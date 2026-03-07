import asyncio
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        async with self._lock:
            dead: list[WebSocket] = []
            for connection in self._connections:
                try:
                    await connection.send_json(message)
                except Exception:  # noqa: BLE001
                    dead.append(connection)
            for connection in dead:
                self._connections.discard(connection)

    async def shutdown(self) -> None:
        async with self._lock:
            for connection in list(self._connections):
                await connection.close()
            self._connections.clear()


websocket_manager = WebSocketManager()
