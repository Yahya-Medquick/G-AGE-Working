# Project Atlas — Operations, Monitoring, & Disaster Recovery Manual

This manual governs runtime operations, telemetry monitoring, incident response, data backup, and disaster recovery procedures for **Project Atlas**.

---

## 1. Health Checks & Readiness Probes

Project Atlas exposes three standard health and readiness endpoints:

| Endpoint | Type | Description | Expected Status |
|---|---|---|---|
| `/api/health` | Liveness | Standard container liveness check | `200 OK` `{ status: "ok" }` |
| `/api/v1/health` | Diagnostic | In-depth application diagnostic telemetry | `200 OK` `{ uptimeSeconds, memoryUsageMb, ... }` |
| `/api/v1/ready` | Readiness | Pod readiness probe for load balancers | `200 OK` (Ready) or `503 Service Unavailable` |

---

## 2. Monitoring & Metrics Telemetry

Prometheus-compatible JSON metrics endpoint is exposed at `/api/v1/metrics`.

Key Operational Indicators (SLIs / SLOs):
- **Cache Hit Ratio Target**: > 80%
- **p95 Latency Target**: < 300ms for cached data, < 1200ms for live API aggregation
- **Error Rate Target**: < 0.1% 5xx errors
- **Memory Consumption**: Heap usage should remain < 400 MB per container instance.

Example Metrics Payload:
```json
{
  "app": "Project Atlas Explorer",
  "timestamp": "2026-07-28T11:00:00.000Z",
  "process": {
    "uptimeSeconds": 14200,
    "heapUsedMb": 68,
    "heapTotalMb": 112,
    "rssMb": 140
  },
  "performance": {
    "cacheHits": 1420,
    "cacheMisses": 180,
    "cacheHitRatio": "88.8%",
    "cachedKeysCount": 42
  },
  "externalApis": {
    "totalCalls": 240,
    "openAlex": 95,
    "wikipedia": 85,
    "github": 40,
    "reddit": 20
  }
}
```

---

## 3. Structured Logging & Error Reporting

### Log Output Format
All log entries are output as structured JSON strings to stdout/stderr for ingestion by Datadog, GCP Cloud Logging, Grafana Loki, or AWS CloudWatch:

```json
{
  "timestamp": "2026-07-28T11:05:00.123Z",
  "level": "INFO",
  "message": "Category request fulfilled",
  "topic": "quantum-computing",
  "category": "papers",
  "cached": true,
  "durationMs": 4
}
```

### Unhandled Error Handling
All unhandled server errors are intercepted by centralized Express middleware. Sensitive stack traces are suppressed in production mode (`NODE_ENV=production`) while generating a unique error reference ID returned to the client.

---

## 4. Analytics & Telemetry Tracking

Analytics are monitored through administrative telemetry endpoints:
- `GET /api/admin/analytics`: Real-time query frequency counts, popular entity rankings, category distribution, and system performance metrics.
- `GET /api/admin/entities`: Dynamic registry status of all indexed topics and entities.

---

## 5. Backup & Disaster Recovery Strategy

### A. Data Persistence Model
Project Atlas operates with a hybrid architecture:
1. **Stateless App Tier**: Node.js server container instances hold zero persistent local state.
2. **In-Memory Cache & Registry**: Automatically bootstrapped and self-healing upon container startup.
3. **Database Tier (Optional PostgreSQL/Supabase)**: When configured via `SUPABASE_URL` or `DATABASE_URL`, user bookmarks and search logs persist in PostgreSQL.

### B. Backup Execution Strategy
- **Automated Database Snapshots**:
  - Daily full backups stored in multi-region cloud storage.
  - Point-In-Time Recovery (PITR) enabled with 7-day log retention.
- **Environment & Secrets Backup**:
  - Environment variable secrets stored in GCP Secret Manager or AWS Secrets Manager with versioning.

### C. Disaster Recovery & Rollback Procedure
1. **RTO (Recovery Time Objective)**: < 5 minutes.
2. **RPO (Recovery Point Objective)**: < 1 hour.
3. **Rollback Command (Cloud Run)**:
   ```bash
   gcloud run services update-traffic project-atlas --to-revisions=atlas-explorer-v1-prev=100
   ```
