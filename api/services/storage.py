"""File storage service for uploads and exports."""

import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

import aiofiles

import config

logger = logging.getLogger(__name__)


class StorageService:
    """Manages file storage for uploads and exports."""

    def __init__(
        self,
        uploads_dir: Optional[Path] = None,
        exports_dir: Optional[Path] = None,
    ):
        self.uploads_dir = uploads_dir or config.UPLOADS_DIR
        self.exports_dir = exports_dir or config.EXPORTS_DIR

    def ensure_dirs(self) -> None:
        """Create upload and export directories if they don't exist."""
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Storage dirs ready: uploads=%s, exports=%s",
                     self.uploads_dir, self.exports_dir)

    async def save_upload(
        self,
        file_data: bytes,
        original_filename: str,
        project_id: str,
    ) -> str:
        """Save an uploaded file and return its storage path.

        Files are stored as: uploads/{project_id}/{uuid}_{original_name}

        Args:
            file_data: The raw file bytes.
            original_filename: The original filename from the upload.
            project_id: The project this file belongs to.

        Returns:
            The relative path to the saved file.
        """
        project_dir = self.uploads_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        # Create a unique filename to prevent collisions
        ext = Path(original_filename).suffix
        safe_name = f"{uuid.uuid4().hex[:8]}_{self._sanitize_filename(original_filename)}"
        file_path = project_dir / safe_name

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_data)

        logger.info("Saved upload: %s (%d bytes)", file_path, len(file_data))
        return str(file_path)

    async def save_upload_stream(
        self,
        file_stream,
        original_filename: str,
        project_id: str,
        chunk_size: int = 1024 * 1024,
    ) -> str:
        """Save an uploaded file from a stream (for large files).

        Args:
            file_stream: An async file-like object with a read() method.
            original_filename: The original filename.
            project_id: The project this file belongs to.
            chunk_size: Read chunk size in bytes (default 1MB).

        Returns:
            The path to the saved file.
        """
        project_dir = self.uploads_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        safe_name = f"{uuid.uuid4().hex[:8]}_{self._sanitize_filename(original_filename)}"
        file_path = project_dir / safe_name

        async with aiofiles.open(file_path, "wb") as f:
            while True:
                chunk = await file_stream.read(chunk_size)
                if not chunk:
                    break
                await f.write(chunk)

        logger.info("Saved streamed upload: %s", file_path)
        return str(file_path)

    def get_upload_path(self, project_id: str, filename: str) -> Path:
        """Get the full path for an uploaded file."""
        return self.uploads_dir / project_id / filename

    def get_export_path(self, project_id: str, filename: str) -> Path:
        """Get the full path for an export file."""
        return self.exports_dir / project_id / filename

    def list_uploads(self, project_id: str) -> list[str]:
        """List all uploaded files for a project."""
        project_dir = self.uploads_dir / project_id
        if not project_dir.exists():
            return []
        return [f.name for f in project_dir.iterdir() if f.is_file()]

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file by path. Returns True if deleted."""
        path = Path(file_path)
        if path.exists():
            os.remove(path)
            logger.info("Deleted file: %s", file_path)
            return True
        return False

    async def cleanup_project(self, project_id: str) -> None:
        """Delete all files for a project."""
        for base_dir in (self.uploads_dir, self.exports_dir):
            project_dir = base_dir / project_id
            if project_dir.exists():
                shutil.rmtree(project_dir)
                logger.info("Cleaned up: %s", project_dir)

    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Remove or replace characters that are unsafe in filenames."""
        safe = filename.replace(" ", "_")
        safe = "".join(c for c in safe if c.isalnum() or c in ("_", "-", "."))
        return safe or "file"


# Global singleton
storage = StorageService()
