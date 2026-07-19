#!/usr/bin/env python3
"""Prove the Row Level Security model against a real PostgreSQL instance.

Runs the §25 verification matrix from the master specification:
  * User A cannot read or delete User B's analyses.
  * A normal user cannot perform admin mutations.
  * Anonymous sessions cannot reach private records.
  * Public catalogue content stays readable.
  * Role self-escalation is blocked.

Requires a database prepared by scripts/db-reset.sh (auth shim + migrations
+ seed). Connects with owner credentials for setup, then simulates
PostgREST behaviour with SET LOCAL ROLE + request.jwt.claims per check.

Usage:
    uv run --project apps/api python scripts/verify_rls.py
    DATABASE_URL=postgres://... uv run --project apps/api python scripts/verify_rls.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import uuid
from dataclasses import dataclass, field

import asyncpg

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://coloursense:coloursense@localhost:54329/coloursense"
).replace("postgresql+asyncpg://", "postgresql://")

USER_A = uuid.uuid4()
USER_B = uuid.uuid4()
ADMIN = uuid.uuid4()


def claims(user_id: uuid.UUID | None) -> str:
    if user_id is None:
        return json.dumps({"role": "anon"})
    return json.dumps({"sub": str(user_id), "role": "authenticated", "aud": "authenticated"})


@dataclass
class Report:
    passed: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)

    def record(self, name: str, ok: bool, detail: str = "") -> None:
        if ok:
            self.passed.append(name)
            print(f"  PASS  {name}")
        else:
            self.failed.append(name)
            print(f"  FAIL  {name}  {detail}")


async def as_role(
    conn: asyncpg.Connection,
    user_id: uuid.UUID | None,
    query: str,
    *args: object,
    fetch: str = "val",
) -> object:
    """Run one statement as anon/authenticated with the given JWT claims."""
    role = "anon" if user_id is None else "authenticated"
    tx = conn.transaction()
    await tx.start()
    try:
        await conn.execute(f"SET LOCAL ROLE {role}")
        await conn.execute(
            "SELECT set_config('request.jwt.claims', $1, true)", claims(user_id)
        )
        if fetch == "val":
            result = await conn.fetchval(query, *args)
        elif fetch == "status":
            result = await conn.execute(query, *args)
        else:
            result = await conn.fetch(query, *args)
        await tx.commit()
        return result
    except Exception:
        await tx.rollback()
        raise


async def expect_denied(
    conn: asyncpg.Connection,
    user_id: uuid.UUID | None,
    query: str,
    *args: object,
) -> bool:
    """True when the statement is blocked by RLS/permissions/triggers."""
    try:
        await as_role(conn, user_id, query, *args, fetch="status")
        return False
    except (
        asyncpg.InsufficientPrivilegeError,
        asyncpg.RaiseError,
        asyncpg.PostgresError,
    ):
        return True


async def setup(conn: asyncpg.Connection) -> dict[str, uuid.UUID]:
    """Create two users, one admin, and one analysis each (owner bypasses RLS)."""
    for uid, email in ((USER_A, "user-a@test.local"), (USER_B, "user-b@test.local"), (ADMIN, "admin@test.local")):
        await conn.execute(
            "INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            uid,
            email,
        )
    await conn.execute("UPDATE public.profiles SET role = 'admin' WHERE id = $1", ADMIN)

    ids: dict[str, uuid.UUID] = {}
    for key, uid in (("analysis_a", USER_A), ("analysis_b", USER_B)):
        ids[key] = await conn.fetchval(
            """
            INSERT INTO public.analyses
              (user_id, classifier_version, undertone, internal_undertone,
               undertone_score, season_slug, confidence, confidence_label)
            VALUES ($1, '1.0.0', 'warm', 'warm', 0.5, 'autumn', 0.8, 'high')
            RETURNING id
            """,
            uid,
        )
    return ids


async def cleanup(conn: asyncpg.Connection) -> None:
    await conn.execute(
        "DELETE FROM auth.users WHERE id = ANY($1::uuid[])", [USER_A, USER_B, ADMIN]
    )


async def main() -> int:
    conn = await asyncpg.connect(DATABASE_URL)
    report = Report()
    try:
        ids = await setup(conn)
        analysis_a, analysis_b = ids["analysis_a"], ids["analysis_b"]

        print("Row Level Security verification\n")

        # 1. Owner isolation on analyses -------------------------------
        own = await as_role(
            conn, USER_A, "SELECT count(*) FROM public.analyses WHERE user_id = $1", USER_A
        )
        report.record("User A sees their own analysis", own == 1)

        cross = await as_role(
            conn, USER_A, "SELECT count(*) FROM public.analyses WHERE id = $1", analysis_b
        )
        report.record("User A cannot read User B's analysis", cross == 0)

        status = await as_role(
            conn, USER_A, "DELETE FROM public.analyses WHERE id = $1", analysis_b, fetch="status"
        )
        still_there = await conn.fetchval(
            "SELECT count(*) FROM public.analyses WHERE id = $1", analysis_b
        )
        report.record(
            "User A cannot delete User B's analysis",
            status == "DELETE 0" and still_there == 1,
            f"status={status} remaining={still_there}",
        )

        status = await as_role(
            conn, USER_A, "DELETE FROM public.analyses WHERE id = $1", analysis_a, fetch="status"
        )
        report.record("User A can delete their own analysis", status == "DELETE 1")

        # 2. Profiles ---------------------------------------------------
        other_profile = await as_role(
            conn, USER_A, "SELECT count(*) FROM public.profiles WHERE id = $1", USER_B
        )
        report.record("User A cannot read User B's profile", other_profile == 0)

        denied = await expect_denied(
            conn,
            USER_A,
            "UPDATE public.profiles SET role = 'admin' WHERE id = $1",
            USER_A,
        )
        report.record("User A cannot self-escalate to admin", denied)

        # 3. Admin-only mutations --------------------------------------
        denied = await expect_denied(
            conn,
            USER_A,
            """
            INSERT INTO public.stores (slug, name) VALUES ('rls-test-store', 'RLS Test Store')
            """,
        )
        report.record("Normal user cannot create stores", denied)

        season_id = await conn.fetchval(
            "SELECT id FROM public.colour_seasons WHERE slug = 'spring'"
        )
        denied = await expect_denied(
            conn,
            USER_A,
            """
            INSERT INTO public.palette_colours
              (season_id, name, hex, lab_l, lab_a, lab_b, palette_group)
            VALUES ($1, 'Hacker Colour', '#123456', 10, 0, 0, 'core')
            """,
            season_id,
        )
        report.record("Normal user cannot mutate palette colours", denied)

        admin_status = await as_role(
            conn,
            ADMIN,
            "INSERT INTO public.stores (slug, name) VALUES ('rls-admin-store', 'RLS Admin Store')",
            fetch="status",
        )
        report.record("Admin can create stores", admin_status == "INSERT 0 1")
        await conn.execute("DELETE FROM public.stores WHERE slug = 'rls-admin-store'")

        # 4. Anonymous access ------------------------------------------
        anon_palette = await as_role(
            conn, None, "SELECT count(*) FROM public.palette_colours WHERE is_active"
        )
        report.record("Anonymous can read active palette colours", anon_palette > 0)

        anon_products = await as_role(
            conn, None, "SELECT count(*) FROM public.products WHERE is_active"
        )
        report.record("Anonymous can read active products", anon_products > 0)

        anon_analyses = await as_role(conn, None, "SELECT count(*) FROM public.analyses")
        report.record("Anonymous cannot read any analyses", anon_analyses == 0)

        anon_profiles = await as_role(conn, None, "SELECT count(*) FROM public.profiles")
        report.record("Anonymous cannot read any profiles", anon_profiles == 0)

        anon_settings = await as_role(conn, None, "SELECT count(*) FROM public.system_settings")
        report.record("Anonymous cannot read system settings", anon_settings == 0)

        # 5. Inactive content hidden ------------------------------------
        inactive_id = await conn.fetchval(
            """
            INSERT INTO public.palette_colours
              (season_id, name, hex, lab_l, lab_a, lab_b, palette_group, is_active)
            VALUES ($1, 'Hidden Colour', '#0a0b0c', 10, 0, 0, 'core', false)
            RETURNING id
            """,
            season_id,
        )
        hidden = await as_role(
            conn, None, "SELECT count(*) FROM public.palette_colours WHERE id = $1", inactive_id
        )
        report.record("Inactive palette colours hidden from public", hidden == 0)
        await conn.execute("DELETE FROM public.palette_colours WHERE id = $1", inactive_id)

        # 6. Favourites isolation ---------------------------------------
        product_id = await conn.fetchval("SELECT id FROM public.products LIMIT 1")
        denied = await expect_denied(
            conn,
            USER_A,
            "INSERT INTO public.user_favourite_products (user_id, product_id) VALUES ($1, $2)",
            USER_B,
            product_id,
        )
        report.record("User A cannot create favourites for User B", denied)

        ok_status = await as_role(
            conn,
            USER_A,
            "INSERT INTO public.user_favourite_products (user_id, product_id) VALUES ($1, $2)",
            USER_A,
            product_id,
            fetch="status",
        )
        report.record("User A can favourite for themselves", ok_status == "INSERT 0 1")

        fav_cross = await as_role(
            conn, USER_B, "SELECT count(*) FROM public.user_favourite_products WHERE user_id = $1", USER_A
        )
        report.record("User B cannot see User A's favourites", fav_cross == 0)

        # 7. Import jobs / audit logs are admin-only --------------------
        jobs_visible = await as_role(
            conn, USER_A, "SELECT count(*) FROM public.product_import_jobs"
        )
        report.record("Normal user cannot read import jobs", jobs_visible == 0)

        audit_visible = await as_role(
            conn, USER_A, "SELECT count(*) FROM public.admin_audit_logs"
        )
        report.record("Normal user cannot read audit logs", audit_visible == 0)

        # 8. Published content readable ---------------------------------
        pages = await as_role(
            conn, None, "SELECT count(*) FROM public.content_pages WHERE is_published"
        )
        report.record("Anonymous can read published content pages", pages > 0)

        print(
            f"\n{len(report.passed)} passed, {len(report.failed)} failed "
            f"out of {len(report.passed) + len(report.failed)} checks."
        )
        return 1 if report.failed else 0
    finally:
        await cleanup(conn)
        await conn.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
