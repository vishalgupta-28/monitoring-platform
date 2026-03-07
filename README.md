# PulseBoard

PulseBoard is a production-oriented full-stack monitoring platform for distributed systems. It combines service monitoring, real-time dashboards, alerts, logs, tracing, and a system design playground in a single control plane.

## Folder structure

```text
monitoring-platform/
  agent/                   Example monitoring agent
  backend/                 FastAPI API, workers, schema models
  docs/                    Architecture and database design
  frontend/                Next.js dashboard UI
  infra/                   Nginx and PostgreSQL bootstrap assets
  simulator/               Synthetic load generator
  .github/workflows/       GitHub Actions CI pipeline
  docker-compose.yml       Local multi-service deployment
```

## Local run

```bash
cd monitoring-platform
docker compose up --build
```

Endpoints after boot:

- UI: [http://localhost](http://localhost)
- Backend docs: [http://localhost/api/v1/openapi.json](http://localhost/api/v1/openapi.json)
- RabbitMQ: [http://localhost:15672](http://localhost:15672)

Seeded login:

- Email: `admin@pulseboard.dev`
- Password: `admin123`

## Core capabilities

- Real-time service monitoring for APIs, databases, and workers
- JWT authentication and RBAC (`viewer`, `operator`, `admin`)
- Metric ingest, rollups, WebSocket streaming, and Redis hot cache
- Threshold alerting with RabbitMQ-backed notification dispatch
- Distributed tracing with bottleneck detection
- Searchable logs viewer and simulator for classic system design cases
- Dockerized infra with PostgreSQL, Redis, Kafka, RabbitMQ, Next.js, FastAPI, and Nginx

## Scale model

The reference architecture targets 10 million metrics per minute by pushing writes through Kafka, batching database inserts, caching hot aggregates in Redis, and horizontally scaling stateless API and worker pools behind Nginx.
