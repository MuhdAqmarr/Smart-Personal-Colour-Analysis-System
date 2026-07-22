# Match.Lab API (`apps/api`)

FastAPI backend: upload hardening, image-quality validation, and the deterministic rule-based colour-analysis pipeline (OpenCV + MediaPipe + NumPy), plus persistence, palettes, products, and admin APIs backed by Supabase PostgreSQL.

## Commands (run from `apps/api`)

```bash
uv sync                 # create .venv with Python 3.12 and all dependencies
uv run uvicorn app.main:app --reload --port 8000
uv run pytest           # tests
uv run ruff check .     # lint
uv run ruff format .    # format
uv run mypy app         # type check
```

Environment variables: see `.env.example`. Settings are validated at startup; production refuses to boot with missing critical variables.

Structure: see `ARCHITECTURE.md` (repo root) §3 — routers stay thin, `app/analysis/*` is pure and deterministic, every threshold comes from `packages/colour-engine/config/classifier-v1.json`.
