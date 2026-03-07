import json
import logging

from aiokafka import AIOKafkaProducer

from app.core.config import settings

logger = logging.getLogger(__name__)


class KafkaService:
    def __init__(self) -> None:
        self._producer: AIOKafkaProducer | None = None

    async def connect(self) -> None:
        try:
            self._producer = AIOKafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                value_serializer=lambda payload: json.dumps(payload, default=str).encode('utf-8'),
            )
            await self._producer.start()
        except Exception as exc:  # noqa: BLE001
            logger.warning('Kafka producer unavailable: %s', exc)
            self._producer = None

    async def publish(self, topic: str, payload: dict) -> None:
        if not self._producer:
            return
        await self._producer.send_and_wait(topic, payload)

    async def close(self) -> None:
        if self._producer:
            await self._producer.stop()


kafka_service = KafkaService()
