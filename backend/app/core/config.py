from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = Field(default='PulseBoard API', alias='APP_NAME')
    environment: str = Field(default='development', alias='ENVIRONMENT')
    api_v1_prefix: str = Field(default='/api/v1', alias='API_V1_PREFIX')
    secret_key: str = Field(default='change-me', alias='SECRET_KEY')
    access_token_expire_minutes: int = Field(default=1440, alias='ACCESS_TOKEN_EXPIRE_MINUTES')

    postgres_server: str = Field(default='localhost', alias='POSTGRES_SERVER')
    postgres_port: int = Field(default=5432, alias='POSTGRES_PORT')
    postgres_user: str = Field(default='monitor', alias='POSTGRES_USER')
    postgres_password: str = Field(default='monitor', alias='POSTGRES_PASSWORD')
    postgres_db: str = Field(default='pulseboard', alias='POSTGRES_DB')

    redis_url: str = Field(default='redis://localhost:6379/0', alias='REDIS_URL')
    kafka_bootstrap_servers: str = Field(default='localhost:9092', alias='KAFKA_BOOTSTRAP_SERVERS')
    kafka_metrics_topic: str = Field(default='metrics.ingest', alias='KAFKA_METRICS_TOPIC')
    kafka_logs_topic: str = Field(default='logs.ingest', alias='KAFKA_LOGS_TOPIC')
    kafka_traces_topic: str = Field(default='traces.ingest', alias='KAFKA_TRACES_TOPIC')
    rabbitmq_url: str = Field(default='amqp://guest:guest@localhost:5672/', alias='RABBITMQ_URL')
    smtp_from_email: str = Field(default='alerts@pulseboard.local', alias='SMTP_FROM_EMAIL')
    smtp_host: str = Field(default='mailhog', alias='SMTP_HOST')
    smtp_port: int = Field(default=1025, alias='SMTP_PORT')
    smtp_username: str | None = Field(default=None, alias='SMTP_USERNAME')
    smtp_password: str | None = Field(default=None, alias='SMTP_PASSWORD')
    slack_webhook_url: str | None = Field(default=None, alias='SLACK_WEBHOOK_URL')
    alert_webhook_url: str | None = Field(default=None, alias='ALERT_WEBHOOK_URL')

    api_rate_limit_per_minute: int = Field(default=120, alias='API_RATE_LIMIT_PER_MINUTE')
    ingest_rate_limit_per_minute: int = Field(default=6000, alias='INGEST_RATE_LIMIT_PER_MINUTE')
    auto_init_db: bool = Field(default=True, alias='AUTO_INIT_DB')
    cors_origins: list[str] = ['http://localhost:3000', 'http://127.0.0.1:3000']
    agent_api_key: str = Field(default='local-agent-key', alias='AGENT_API_KEY')

    @property
    def database_url(self) -> str:
        return (
            f'postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}'
            f'@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}'
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
