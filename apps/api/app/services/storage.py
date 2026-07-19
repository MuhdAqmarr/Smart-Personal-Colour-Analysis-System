"""Supabase Storage client for the private analysis-images bucket.

Talks to the Storage REST API directly with the service-role key (server
side only). Object paths are always `<user_id>/<analysis_id>.jpg`, matching
the owner-scoped storage policies. Signed URLs are short-lived; permanent
public URLs are never produced.
"""

from __future__ import annotations

import httpx

from app.core.config import Settings
from app.core.errors import AppError

BUCKET = "analysis-images"
SIGNED_URL_TTL_SECONDS = 300


class StorageUnavailableError(AppError):
    code = "STORAGE_UNAVAILABLE"
    status_code = 503
    default_message = "Image storage is not configured on this server."


class StorageOperationError(AppError):
    code = "STORAGE_ERROR"
    status_code = 502
    default_message = "The storage service rejected the operation."


class SupabaseStorage:
    def __init__(self, settings: Settings) -> None:
        if not (
            settings.image_storage_enabled
            and settings.supabase_url
            and settings.supabase_service_role_key
        ):
            raise StorageUnavailableError()
        self._base = f"{settings.supabase_url.rstrip('/')}/storage/v1"
        self._headers = {
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
        }

    @staticmethod
    def object_path(user_id: str, analysis_id: str) -> str:
        return f"{user_id}/{analysis_id}.jpg"

    async def upload(self, path: str, data: bytes, content_type: str) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self._base}/object/{BUCKET}/{path}",
                headers={
                    **self._headers,
                    "Content-Type": content_type,
                    "x-upsert": "true",
                },
                content=data,
            )
        if response.status_code >= 400:
            raise StorageOperationError(
                "The image could not be stored.",
                details={"status": response.status_code},
            )

    async def create_signed_url(self, path: str, ttl: int = SIGNED_URL_TTL_SECONDS) -> str:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{self._base}/object/sign/{BUCKET}/{path}",
                headers=self._headers,
                json={"expiresIn": ttl},
            )
        if response.status_code >= 400:
            raise StorageOperationError(
                "A signed URL could not be created.",
                details={"status": response.status_code},
            )
        signed = response.json().get("signedURL", "")
        if not signed:
            raise StorageOperationError("The storage service returned no signed URL.")
        return f"{self._base}{signed}"

    async def delete(self, paths: list[str]) -> None:
        if not paths:
            return
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                "DELETE",
                f"{self._base}/object/{BUCKET}",
                headers=self._headers,
                json={"prefixes": paths},
            )
        if response.status_code >= 400:
            raise StorageOperationError(
                "Stored images could not be deleted.",
                details={"status": response.status_code},
            )

    async def list_user_objects(self, user_id: str) -> list[str]:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self._base}/object/list/{BUCKET}",
                headers=self._headers,
                json={"prefix": f"{user_id}/", "limit": 1000},
            )
        if response.status_code >= 400:
            raise StorageOperationError(
                "Stored images could not be listed.",
                details={"status": response.status_code},
            )
        return [
            f"{user_id}/{item['name']}"
            for item in response.json()
            if isinstance(item, dict) and item.get("name")
        ]


def get_storage(settings: Settings) -> SupabaseStorage:
    return SupabaseStorage(settings)
