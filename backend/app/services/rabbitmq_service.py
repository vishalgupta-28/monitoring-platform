import json
import logging

import aio_pika

from app.core.config import settings

logger = logging.getLogger(__name__)


class RabbitMQService:
    def __init__(self) -> None:
        self._connection: aio_pika.RobustConnection | None = None
        self._channel: aio_pika.abc.AbstractRobustChannel | None = None

    async def connect(self) -> None:
        try:
            self._connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            self._channel = await self._connection.channel()
        except Exception as exc:  # noqa: BLE001
            logger.warning('RabbitMQ unavailable: %s', exc)
            self._connection = None
            self._channel = None

    async def enqueue(self, queue_name: str, payload: dict) -> None:
        if not self._channel:
            return
        queue = await self._channel.declare_queue(queue_name, durable=True)
        await self._channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(payload, default=str).encode('utf-8'), delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
            routing_key=queue.name,
        )

    async def close(self) -> None:
        if self._connection:
            await self._connection.close()


rabbitmq_service = RabbitMQService()
