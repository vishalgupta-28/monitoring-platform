# PulseBoard Monitoring Platform

PulseBoard is a high-performance, real-time observability and monitoring platform designed for modern microservices architectures. It provides a centralized dashboard for metrics, logs, traces, and automated alerting, enabling engineers to gain deep insights into system health and performance.

The platform is built with a distributed architecture using FastAPI, Next.js, Kafka, and RabbitMQ to ensure high throughput and low latency in data ingestion and visualization.

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. System Architecture](#3-system-architecture)
- [3. Tech Stack](#4-tech-stack)
- [4. Project Structure](#5-project-structure)
- [5. Installation](#6-installation)
- [6. Environment Variables](#7-environment-variables)
- [7. API Documentation](#8-api-documentation)
- [8. Database Schema](#9-database-schema)
- [9. Authentication & Authorization](#10-authentication--authorization)
- [10. Data Flow](#12-data-flow)
- [11. Running the Project](#13-running-the-project)
- [12. Testing](#14-testing)

---

## 3. System Architecture

PulseBoard follows a microservices-inspired architecture where data ingestion is decoupled from the main API and long-running tasks are handled by dedicated workers.

### High-Level Architecture
- **Agent**: A lightweight Python script that runs on target hosts to collect system and application metrics.
- **Kafka**: Acts as a high-throughput buffer for incoming telemetry data (metrics, logs, traces).
- **Collector Worker**: Consumes data from Kafka and persists it to PostgreSQL.
- **API (FastAPI)**: Serves as the central gateway for the frontend and management operations.
- **Alert Dispatcher**: Monitors metric thresholds via RabbitMQ queues and sends notifications.
- **Frontend (Next.js)**: Provides a real-time visualization dashboard using WebSockets.

### System Architecture Diagram

```mermaid
flowchart LR
    Agent[Python Agent] -->|Ingest| Kafka{Kafka}
    Kafka --> Collector[Collector Worker]
    Collector --> DB[(PostgreSQL)]
    DB --> API[FastAPI Backend]
    API --> Frontend[Next.js Dashboard]
    API <--> Redis[(Redis Cache)]
    API --> RMQ{RabbitMQ}
    RMQ --> Dispatcher[Alert Dispatcher]
    Dispatcher --> Slack[Slack / Email]
```

---

## 4. Tech Stack

| Layer              | Technology           | Purpose                                      |
| ------------------ | -------------------- | -------------------------------------------- |
| **Frontend**       | Next.js, React, TS   | Modern UI with server-side rendering         |
| **Backend**        | FastAPI, Python      | High-performance asynchronous API            |
| **Database**       | PostgreSQL 16        | Primary relational storage for metadata      |
| **Caching**        | Redis                | Rate limiting and session storage            |
| **Messaging**      | Apache Kafka         | High-throughput telemetry ingestion          |
| **Task Queue**     | RabbitMQ             | Reliable alert dispatching                   |
| **Visualizations** | Recharts, Lucide     | Interactive charts and iconography           |
| **DevOps**         | Docker, Nginx        | Containerization and reverse proxy           |

---

## 5. Project Structure

```text
root/
 ├── agent/           # Lightweight Python monitoring agent
 ├── backend/         # FastAPI core application
 │    ├── app/api/    # API routes and controllers
 │    ├── app/db/     # SQLAlchemy models and migrations
 │    ├── app/workers/# Background task consumers (Kafka/RabbitMQ)
 │    └── app/services# Business logic layer
 ├── frontend/        # Next.js 15 dashboard application
 ├── infra/           # Configuration for Nginx, Postgres, etc.
 ├── simulator/       # Load and traffic simulation scripts
 └── docker-compose.yml # Orchestration for all services
```

---

## 6. Installation

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 20+ (for local frontend development)

### Step-by-Step Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/vishalgupta-28/monitoring-platform.git
   cd monitoring-platform
   ```

2. **Setup Environment Files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. **Launch with Docker Compose**
   ```bash
   docker-compose up --build
   ```

---

## 7. Environment Variables

### Backend Configuration
| Variable | Description | Required | Example |
| -------- | ----------- | -------- | ------- |
| `POSTGRES_SERVER` | DB Hostname | Yes | `postgres` |
| `REDIS_URL` | Redis connection string | Yes | `redis://redis:6379/0` |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker list | Yes | `kafka:9092` |
| `RABBITMQ_URL` | RabbitMQ connection string | Yes | `amqp://guest:guest@rabbitmq:5672/` |
| `SECRET_KEY` | JWT signing key | Yes | `your-secret-key` |

---

## 8. API Documentation

### Metrics Endpoints
- **POST** `/api/v1/metrics/ingest`: Ingest a batch of metric points from agents.
- **GET** `/api/v1/metrics`: Query aggregated metric data with time intervals.
- **GET** `/api/v1/metrics/latest`: Retrieve the most recent snapshots for services.

### Services Endpoints
- **GET** `/api/v1/services`: List all registered services.
- **POST** `/api/v1/services`: Register a new service for monitoring.

### Real-time
- **WS** `/api/v1/ws/stream`: WebSocket endpoint for live dashboard updates.

---

## 9. Database Schema

The system uses a relational schema optimized for telemetry metadata and alert configuration.

```mermaid
erDiagram
    User ||--o{ Service : manages
    Service ||--o{ MetricPoint : produces
    Service ||--o{ AlertRule : has
    AlertRule ||--o{ AlertEvent : triggers
    Service ||--o{ LogEntry : generates
    Service ||--o{ TraceSpan : contains
```

---

## 10. Authentication & Authorization

PulseBoard uses **JWT (JSON Web Tokens)** for secure authentication. 
1. **Login**: User authenticates with email/password.
2. **Token**: System issues an `access_token`.
3. **Authorization**: Subsequent requests must include the Bearer token in the `Authorization` header.
4. **RBAC**: Roles include `admin`, `operator`, and `viewer` to control access to destructive actions (e.g., deleting services).

---

## 12. Data Flow (Request Lifecycle)

```mermaid
sequenceDiagram
    participant A as Python Agent
    participant K as Kafka
    participant W as Collector Worker
    participant DB as PostgreSQL
    participant F as Next.js Dashboard
    
    A->>K: POST /metrics/ingest (Every 10s)
    K->>W: Push message
    W->>DB: Bulk insert metric points
    F-->>DB: Query metrics via REST API
    F->>F: Update Real-time Charts
```

---

## 13. Running the Project

### Development Mode (Inside Docker)
```bash
docker-compose up
```
The dashboard will be available at `http://localhost`.

### Troubleshooting
- **Logs**: `docker-compose logs -f backend`
- **DB Reset**: `docker-compose down -v` (Caution: deletes all data)

---

## 14. Testing

### Backend Tests
```bash
cd backend
pytest
```

---

## 20. License

This project is licensed under the **MIT License**.
