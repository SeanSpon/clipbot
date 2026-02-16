"""SQLite database layer using aiosqlite.

This is the API's own lightweight storage. The main Prisma DB is managed
by the Next.js frontend -- this SQLite DB stores API-side state like
projects, clips, and job metadata.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import aiosqlite

import config

logger = logging.getLogger(__name__)

DB_PATH = str(config.DATABASE_PATH)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    raw_video_path TEXT,
    transcript TEXT,
    shot_list TEXT,
    settings TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scene_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    duration REAL NOT NULL DEFAULT 0.0,
    transcript_segment TEXT,
    shot_list TEXT,
    virality_score INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    output_path TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clips_project_id ON clips(project_id);
CREATE INDEX IF NOT EXISTS idx_clips_virality ON clips(virality_score DESC);
"""


async def init_db() -> None:
    """Initialize the database and create tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    logger.info("Database initialized at %s", DB_PATH)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_dumps(obj) -> Optional[str]:
    if obj is None:
        return None
    return json.dumps(obj)


def _json_loads(s) -> Optional[dict]:
    if s is None:
        return None
    return json.loads(s)


def _row_to_project(row: aiosqlite.Row) -> dict:
    return {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "status": row[3],
        "raw_video_path": row[4],
        "transcript": _json_loads(row[5]),
        "shot_list": _json_loads(row[6]),
        "settings": _json_loads(row[7]),
        "created_at": row[8],
        "updated_at": row[9],
    }


def _row_to_clip(row: aiosqlite.Row) -> dict:
    return {
        "id": row[0],
        "project_id": row[1],
        "scene_index": row[2],
        "start_time": row[3],
        "end_time": row[4],
        "duration": row[5],
        "transcript_segment": row[6],
        "shot_list": _json_loads(row[7]),
        "virality_score": row[8],
        "status": row[9],
        "output_path": row[10],
        "tags": _json_loads(row[11]),
        "created_at": row[12],
        "updated_at": row[13],
    }


# --- Project CRUD ---

async def create_project(name: str, description: str = None,
                          raw_video_path: str = None,
                          settings: dict = None) -> dict:
    project_id = str(uuid.uuid4())
    now = _now_iso()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO projects (id, name, description, status, raw_video_path,
               transcript, shot_list, settings, created_at, updated_at)
               VALUES (?, ?, ?, 'draft', ?, NULL, NULL, ?, ?, ?)""",
            (project_id, name, description, raw_video_path,
             _json_dumps(settings), now, now),
        )
        await db.commit()
    return await get_project(project_id)


async def get_project(project_id: str) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return _row_to_project(row)


async def list_projects() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT * FROM projects ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        return [_row_to_project(row) for row in rows]


async def update_project(project_id: str, **kwargs) -> Optional[dict]:
    fields = []
    values = []
    for key, val in kwargs.items():
        if val is None and key not in kwargs:
            continue
        if key in ("transcript", "shot_list", "settings"):
            fields.append(f"{key} = ?")
            values.append(_json_dumps(val))
        elif key in ("name", "description", "status", "raw_video_path"):
            fields.append(f"{key} = ?")
            values.append(val)

    if not fields:
        return await get_project(project_id)

    fields.append("updated_at = ?")
    values.append(_now_iso())
    values.append(project_id)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE projects SET {', '.join(fields)} WHERE id = ?",
            tuple(values),
        )
        await db.commit()
    return await get_project(project_id)


async def delete_project(project_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM projects WHERE id = ?", (project_id,)
        )
        await db.commit()
        return cursor.rowcount > 0


# --- Clip CRUD ---

async def create_clip(
    project_id: str,
    scene_index: int,
    start_time: float,
    end_time: float,
    transcript_segment: str = None,
    shot_list: dict = None,
    virality_score: int = None,
    tags: list = None,
) -> dict:
    clip_id = str(uuid.uuid4())
    now = _now_iso()
    duration = end_time - start_time

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO clips (id, project_id, scene_index, start_time, end_time,
               duration, transcript_segment, shot_list, virality_score, status,
               output_path, tags, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?, ?)""",
            (clip_id, project_id, scene_index, start_time, end_time, duration,
             transcript_segment, _json_dumps(shot_list), virality_score,
             _json_dumps(tags), now, now),
        )
        await db.commit()
    return await get_clip(clip_id)


async def get_clip(clip_id: str) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT * FROM clips WHERE id = ?", (clip_id,)
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return _row_to_clip(row)


async def get_project_clips(project_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT * FROM clips WHERE project_id = ? ORDER BY scene_index",
            (project_id,),
        )
        rows = await cursor.fetchall()
        return [_row_to_clip(row) for row in rows]


async def update_clip(clip_id: str, **kwargs) -> Optional[dict]:
    fields = []
    values = []
    for key, val in kwargs.items():
        if key in ("shot_list", "tags"):
            fields.append(f"{key} = ?")
            values.append(_json_dumps(val))
        elif key in ("status", "output_path", "transcript_segment"):
            fields.append(f"{key} = ?")
            values.append(val)
        elif key in ("virality_score", "scene_index"):
            fields.append(f"{key} = ?")
            values.append(val)
        elif key in ("start_time", "end_time", "duration"):
            fields.append(f"{key} = ?")
            values.append(val)

    if not fields:
        return await get_clip(clip_id)

    fields.append("updated_at = ?")
    values.append(_now_iso())
    values.append(clip_id)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE clips SET {', '.join(fields)} WHERE id = ?",
            tuple(values),
        )
        await db.commit()
    return await get_clip(clip_id)


async def delete_project_clips(project_id: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM clips WHERE project_id = ?", (project_id,)
        )
        await db.commit()
        return cursor.rowcount
