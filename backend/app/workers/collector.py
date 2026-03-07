import asyncio

from app.db.session import async_session_factory
from app.services.collector_service import collector_service


async def main() -> None:
    while True:
        async with async_session_factory() as session:
            await collector_service.collect_once(session)
        await asyncio.sleep(15)


if __name__ == '__main__':
    asyncio.run(main())
