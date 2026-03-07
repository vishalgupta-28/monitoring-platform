import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer

from app.core.config import settings

logger = logging.getLogger(__name__)


async def main() -> None:
    consumer = AIOKafkaConsumer(
        settings.kafka_metrics_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_deserializer=lambda value: json.loads(value.decode('utf-8')),
        group_id='pulseboard-metric-workers',
    )
    await consumer.start()
    try:
        async for message in consumer:
            logger.info('Consumed metric event %s', message.value)
    finally:
        await consumer.stop()


if __name__ == '__main__':
    asyncio.run(main())
