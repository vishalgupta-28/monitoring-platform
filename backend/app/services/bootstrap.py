import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import AlertRule, Service, SimulationScenario, User
from app.db.session import async_session_factory


async def bootstrap_demo_data() -> None:
    async with async_session_factory() as session:
        existing_user = await session.scalar(select(User).where(User.email == 'admin@pulseboard.dev'))
        if existing_user:
            return

        admin = User(
            id=uuid.uuid4(),
            email='admin@pulseboard.dev',
            full_name='PulseBoard Admin',
            password_hash=hash_password('admin123'),
            role='admin',
        )
        services = [
            Service(
                name='Edge API Gateway',
                slug='edge-api-gateway',
                service_type='api',
                base_url='https://api.pulseboard.dev',
                environment='production',
                status='healthy',
                tags={'team': 'platform', 'tier': 'edge'},
                created_by=admin.id,
            ),
            Service(
                name='Orders PostgreSQL',
                slug='orders-postgres',
                service_type='database',
                base_url='postgres://orders-db:5432/orders',
                environment='production',
                status='degraded',
                tags={'team': 'payments', 'tier': 'stateful'},
                created_by=admin.id,
            ),
            Service(
                name='Dispatch Worker',
                slug='dispatch-worker',
                service_type='microservice',
                base_url='http://dispatch-worker:8080',
                environment='staging',
                status='healthy',
                tags={'team': 'mobility', 'tier': 'worker'},
                created_by=admin.id,
            ),
        ]
        scenarios = [
            SimulationScenario(
                name='URL Shortener',
                category='read-heavy',
                description='Simulates redirect fan-out, cache hit ratio, and hot-key pressure.',
                config={'qps': 45000, 'regions': 3, 'cache_hit_ratio': 0.88},
            ),
            SimulationScenario(
                name='YouTube',
                category='media',
                description='Models upload bursts, transcoding queues, and global playback traffic.',
                config={'uploads_per_sec': 2400, 'stream_start_qps': 150000, 'cdn_pop_count': 64},
            ),
            SimulationScenario(
                name='Uber',
                category='geo',
                description='Exercises location writes, dispatch latency, and surge alerting.',
                config={'rides_per_min': 120000, 'city_count': 55, 'dispatch_slo_ms': 180},
            ),
            SimulationScenario(
                name='Twitter',
                category='feed',
                description='Simulates write fan-out, ranking latency, and feed cache churn.',
                config={'tweets_per_sec': 18000, 'home_timeline_reads_per_sec': 900000, 'fanout_workers': 256},
            ),
        ]
        session.add(admin)
        session.add_all(services)
        session.add_all(scenarios)
        await session.flush()
        session.add(
            AlertRule(
                service_id=services[0].id,
                name='Edge latency high',
                metric_name='latency_ms',
                comparison='gt',
                threshold=500,
                window_seconds=300,
                severity='critical',
                channels=['email', 'slack', 'webhook'],
            )
        )
        await session.commit()
