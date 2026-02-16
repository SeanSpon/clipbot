"""SSE event broadcasting service for real-time progress updates.

Each project can have multiple subscribers. Events are published per-project
and delivered to all active SSE connections for that project.
"""

import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """Manages SSE event broadcasting per project."""

    def __init__(self):
        # project_id -> list of asyncio.Queue
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    async def subscribe(self, project_id: str) -> AsyncGenerator[dict, None]:
        """Subscribe to events for a project.

        Yields event dicts as they are published. The caller should
        use this with SSE streaming.

        Usage:
            async for event in broadcaster.subscribe(project_id):
                yield ServerSentEvent(data=json.dumps(event))
        """
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[project_id].append(queue)
        logger.info("New subscriber for project %s (total: %d)",
                     project_id, len(self._subscribers[project_id]))

        try:
            while True:
                event = await queue.get()
                if event is None:
                    # Sentinel value to close the stream
                    break
                yield event
        finally:
            self._subscribers[project_id].remove(queue)
            if not self._subscribers[project_id]:
                del self._subscribers[project_id]
            logger.info("Subscriber removed for project %s", project_id)

    async def publish(
        self,
        project_id: str,
        event_type: str,
        data: Optional[dict] = None,
        stage: Optional[str] = None,
        progress: Optional[float] = None,
        message: Optional[str] = None,
    ) -> int:
        """Publish an event to all subscribers of a project.

        Args:
            project_id: The project to publish to.
            event_type: Event type (e.g., 'transcription.progress', 'director.complete').
            data: Optional payload dict.
            stage: Optional pipeline stage name.
            progress: Optional progress percentage (0-100).
            message: Optional human-readable message.

        Returns:
            Number of subscribers that received the event.
        """
        event = {
            "type": event_type,
            "project_id": project_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if data is not None:
            event["data"] = data
        if stage is not None:
            event["stage"] = stage
        if progress is not None:
            event["progress"] = progress
        if message is not None:
            event["message"] = message

        subscribers = self._subscribers.get(project_id, [])
        for queue in subscribers:
            await queue.put(event)

        return len(subscribers)

    async def close_project(self, project_id: str) -> None:
        """Close all subscriber streams for a project."""
        subscribers = self._subscribers.get(project_id, [])
        for queue in subscribers:
            await queue.put(None)  # Sentinel to close

    def get_subscriber_count(self, project_id: str) -> int:
        """Get the number of active subscribers for a project."""
        return len(self._subscribers.get(project_id, []))


# Global singleton
broadcaster = EventBroadcaster()
