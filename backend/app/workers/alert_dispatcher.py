import asyncio
import json
import logging
import smtplib
from email.message import EmailMessage

import aio_pika
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_slack(message: str) -> None:
    if not settings.slack_webhook_url:
        logger.info('Slack webhook not configured. Skipping message: %s', message)
        return
    async with httpx.AsyncClient(timeout=5.0) as client:
        await client.post(settings.slack_webhook_url, json={'text': message})


async def send_webhook(message: str, severity: str) -> None:
    if not settings.alert_webhook_url:
        logger.info('Alert webhook not configured. Skipping message: %s', message)
        return
    async with httpx.AsyncClient(timeout=5.0) as client:
        await client.post(settings.alert_webhook_url, json={'message': message, 'severity': severity})


def send_email(message: str, severity: str) -> None:
    email = EmailMessage()
    email['From'] = settings.smtp_from_email
    email['To'] = 'oncall@pulseboard.local'
    email['Subject'] = f'[{severity.upper()}] PulseBoard alert'
    email.set_content(message)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as server:
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(email)


async def dispatch(payload: dict) -> None:
    channels = payload.get('channels', [])
    message = payload.get('message', 'PulseBoard alert')
    severity = payload.get('severity', 'warning')

    tasks: list[asyncio.Future] = []
    for channel in channels:
        if channel == 'slack':
            tasks.append(asyncio.create_task(send_slack(message)))
        elif channel == 'webhook':
            tasks.append(asyncio.create_task(send_webhook(message, severity)))
        elif channel == 'email':
            await asyncio.to_thread(send_email, message, severity)

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def main() -> None:
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()
    queue = await channel.declare_queue('alerts.dispatch', durable=True)

    async with queue.iterator() as iterator:
        async for message in iterator:
            async with message.process():
                payload = json.loads(message.body.decode('utf-8'))
                logger.info('Dispatching alert %s', payload)
                await dispatch(payload)


if __name__ == '__main__':
    asyncio.run(main())
