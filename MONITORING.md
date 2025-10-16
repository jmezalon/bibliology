# Monitoring & Alerting Guide

Comprehensive guide for monitoring the Bibliology application in production, setting up alerts, and responding to incidents.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Key Metrics](#key-metrics)
- [Health Checks](#health-checks)
- [Logging](#logging)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Alerts Configuration](#alerts-configuration)
- [Incident Response](#incident-response)
- [Dashboard Setup](#dashboard-setup)

---

## Overview

### Monitoring Philosophy

1. **Monitor user experience first** - Focus on what users see
2. **Alert on symptoms, not causes** - Alert when users are affected
3. **Keep it simple** - Start with basics, add complexity as needed
4. **Automate responses** - Auto-restart, auto-scale where possible
5. **Document everything** - Every alert should have a runbook

### Monitoring Layers

```
┌─────────────────────────────────────┐
│   User Experience (Frontend)        │  Uptime, page load, errors
├─────────────────────────────────────┤
│   API Layer (Backend)               │  Response times, error rates
├─────────────────────────────────────┤
│   Database Layer                    │  Query performance, connections
├─────────────────────────────────────┤
│   Infrastructure                    │  CPU, memory, disk, network
└─────────────────────────────────────┘
```

---

## Monitoring Stack

### Recommended Setup (Cost-Effective)

| Component | Tool | Cost | Purpose |
|-----------|------|------|---------|
| **Error Tracking** | Sentry | Free tier | Frontend & backend errors |
| **Uptime Monitoring** | BetterUptime | Free tier | Health checks, status page |
| **Logging** | Render Logs | Included | Centralized logs |
| **Metrics** | Render Metrics | Included | CPU, memory, response times |
| **APM** | (Optional) New Relic | Free tier | Deep performance insights |

**Total Cost:** $0-20/month for small project

### Alternative: Full Observability Stack

For production-grade monitoring:
- **Datadog** (~$31/month) - All-in-one
- **New Relic** (~$25/month) - APM + Logs
- **LogRocket** (~$99/month) - Session replay + monitoring

---

## Key Metrics

### Frontend Metrics

#### Core Web Vitals
```javascript
// Largest Contentful Paint (LCP)
Target: < 2.5s
Warning: > 4s
```

```javascript
// First Input Delay (FID)
Target: < 100ms
Warning: > 300ms
```

```javascript
// Cumulative Layout Shift (CLS)
Target: < 0.1
Warning: > 0.25
```

#### JavaScript Errors
```
Target: < 0.1% of page loads
Warning: > 1% of page loads
Critical: > 5% of page loads
```

#### API Request Success Rate
```
Target: > 99%
Warning: < 98%
Critical: < 95%
```

---

### Backend Metrics

#### Response Time (p50, p95, p99)
```
p50 (Median):
  Target: < 200ms
  Warning: > 500ms
  Critical: > 1000ms

p95 (95th percentile):
  Target: < 500ms
  Warning: > 1000ms
  Critical: > 2000ms

p99 (99th percentile):
  Target: < 1000ms
  Warning: > 2000ms
  Critical: > 5000ms
```

#### Error Rates
```
2xx Success Rate:
  Target: > 99%
  Warning: < 98%
  Critical: < 95%

4xx Client Errors:
  Target: < 5%
  Warning: > 10%

5xx Server Errors:
  Target: < 0.5%
  Warning: > 1%
  Critical: > 5%
```

#### Request Rate
```
Monitor for:
- Sudden spikes (possible DDoS)
- Sudden drops (possible outage)
- Gradual increase (plan for scaling)
```

---

### Database Metrics

#### Query Performance
```
Average Query Time:
  Target: < 50ms
  Warning: > 100ms
  Critical: > 500ms

Slow Queries (> 1s):
  Target: 0
  Warning: > 5/hour
  Critical: > 20/hour
```

#### Connection Pool
```
Active Connections:
  Target: < 50% of pool
  Warning: > 75% of pool
  Critical: > 90% of pool

Connection Errors:
  Target: 0
  Warning: > 5/hour
  Critical: > 20/hour
```

#### Storage
```
Disk Usage:
  Warning: > 70%
  Critical: > 85%

Database Size Growth:
  Monitor: > 10% per week
  (may need to archive old data)
```

---

### Infrastructure Metrics

#### CPU Usage
```
Target: < 60%
Warning: > 75%
Critical: > 90%
```

#### Memory Usage
```
Target: < 70%
Warning: > 85%
Critical: > 95%
```

#### Disk I/O
```
Target: < 70%
Warning: > 85%
Critical: > 95%
```

---

## Health Checks

### API Health Endpoint

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "database": "connected",
  "uptime": 86400,
  "version": "1.0.0"
}
```

**Implementation:** (Already exists in `apps/api/src/app.service.ts`)

### Enhanced Health Check (Recommended)

Add more detailed checks:

```typescript
// apps/api/src/app.service.ts
async getHealth() {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkDiskSpace(),
  ]);

  const status = checks.every(c => c.status === 'fulfilled') ? 'ok' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? 'connected' : 'disconnected',
      redis: checks[1].status === 'fulfilled' ? 'connected' : 'disconnected',
      disk: checks[2].status === 'fulfilled' ? 'ok' : 'low',
    },
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  };
}

private async checkDatabase() {
  await this.prisma.$queryRaw`SELECT 1`;
}

private async checkRedis() {
  // Check Redis connection
  await this.redis.ping();
}

private async checkDiskSpace() {
  // Check available disk space
  const stats = await fs.promises.statfs('/');
  const available = stats.bavail * stats.bsize;
  const total = stats.blocks * stats.bsize;
  if (available / total < 0.15) throw new Error('Low disk space');
}
```

### Frontend Health Check

Add a simple health check:

```typescript
// apps/web/src/utils/healthCheck.ts
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## Logging

### Log Levels

```typescript
// Structured logging with Pino (already configured)
import { Logger } from '@nestjs/common';

// ERROR - Something failed
logger.error('Failed to create lesson', { error, userId, lessonId });

// WARN - Something unexpected but handled
logger.warn('Slow database query detected', { query, duration });

// INFO - Important business events
logger.info('User created lesson', { userId, lessonId });

// DEBUG - Development debugging (disabled in production)
logger.debug('Processing lesson block', { blockId, type });
```

### What to Log

**DO Log:**
- Authentication events (login, logout, failed attempts)
- Critical business operations (lesson created, quiz completed)
- Errors with context (user ID, request ID, stack trace)
- Performance warnings (slow queries, high latency)
- Rate limit hits
- Unusual patterns (multiple failures, spikes)

**DON'T Log:**
- Passwords or secrets
- Personal information (unless hashed)
- Credit card numbers
- Full request/response bodies (unless debugging)

### Log Structure

```typescript
// Good: Structured logging
logger.info('Lesson created', {
  userId: user.id,
  lessonId: lesson.id,
  duration: 234,
  requestId: req.id,
});

// Bad: String concatenation
logger.info(`User ${user.id} created lesson ${lesson.id}`);
```

### Accessing Logs

**Render:**
1. Dashboard → Service → Logs
2. Filter by severity, search by keyword
3. Download logs for analysis

**Better Alternative (BetterStack):**
1. Sign up at https://betterstack.com/logs
2. Install logging integration
3. Query logs with SQL-like syntax
4. Set up alerts on log patterns

---

## Error Tracking

### Sentry Setup

**1. Install Sentry:**
```bash
# Backend
cd apps/api
pnpm add @sentry/node @sentry/tracing

# Frontend
cd apps/web
pnpm add @sentry/react
```

**2. Configure Backend:**
```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/node';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of requests
      beforeSend(event, hint) {
        // Don't send certain errors
        if (event.exception?.values?.[0]?.type === 'ValidationError') {
          return null;
        }
        return event;
      },
    });
  }

  // ... rest of bootstrap
}
```

**3. Configure Frontend:**
```typescript
// apps/web/src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

**4. Error Boundaries:**
```typescript
// apps/web/src/components/ErrorBoundary.tsx
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';

export function ErrorBoundary({ children }) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h1>Something went wrong</h1>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      onError={(error) => {
        console.error('Error boundary caught:', error);
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
}
```

---

## Performance Monitoring

### API Performance

**Using Render Metrics (Built-in):**
1. Dashboard → Service → Metrics
2. Monitor:
   - Response time (p50, p95, p99)
   - Request rate
   - Error rate
   - CPU/Memory usage

**Using New Relic (Optional):**
```typescript
// Install
pnpm add newrelic

// Add to main.ts (first line)
if (process.env.NODE_ENV === 'production') {
  require('newrelic');
}

// Configure newrelic.js
// See: https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
```

### Database Performance

**Slow Query Logging:**
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Log slow queries
    this.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        this.logger.warn('Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params,
        });
      }
    });
  }
}
```

**Query Analysis:**
```sql
-- In Render database console
-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find most frequent queries
SELECT * FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
```

---

## Alerts Configuration

### BetterUptime Setup (Recommended)

**1. Create Account:**
- Visit https://betteruptime.com
- Sign up (free tier available)

**2. Add Health Check Monitor:**
1. Dashboard → Monitors → Create monitor
2. Configure:
   - **Name:** Bibliology API Health
   - **URL:** https://api.bibliology.com/health
   - **Method:** GET
   - **Interval:** 1 minute
   - **Expected Status:** 200
   - **Expected Body:** `"status":"ok"`
   - **Timeout:** 10 seconds
3. Add notification channels (email, Slack, SMS)

**3. Add Heartbeat Monitor (for worker):**
1. Create heartbeat monitor
2. Add heartbeat call to worker:
```typescript
// apps/worker/src/worker.service.ts
async processJob() {
  // ... process job

  // Send heartbeat
  await fetch(`https://betteruptime.com/api/v1/heartbeat/${HEARTBEAT_ID}`);
}
```

### Alert Rules

#### Critical (Immediate Page)

```yaml
API Health Check Failed:
  Condition: Health endpoint returns non-200 or error for 2 consecutive checks
  Notification: SMS + Email + Slack
  Response Time: Immediate

5xx Error Rate > 5%:
  Condition: 5xx errors > 5% over 5 minutes
  Notification: SMS + Email + Slack
  Response Time: Immediate

Database Connection Lost:
  Condition: Health check shows database disconnected
  Notification: SMS + Email + Slack
  Response Time: Immediate

Frontend Down:
  Condition: Main page returns non-200 for 2 minutes
  Notification: SMS + Email + Slack
  Response Time: Immediate
```

#### Warning (Notify During Business Hours)

```yaml
4xx Error Rate > 10%:
  Condition: 4xx errors > 10% over 15 minutes
  Notification: Email + Slack
  Response Time: 30 minutes

Slow Response Times:
  Condition: p95 > 2s for 10 minutes
  Notification: Email + Slack
  Response Time: 1 hour

High CPU Usage:
  Condition: CPU > 85% for 10 minutes
  Notification: Email + Slack
  Response Time: 1 hour

High Memory Usage:
  Condition: Memory > 85% for 10 minutes
  Notification: Email + Slack
  Response Time: 1 hour

Low Disk Space:
  Condition: Disk usage > 80%
  Notification: Email + Slack
  Response Time: 1 day
```

#### Info (Log Only)

```yaml
Deployment Started:
  Notification: Slack only

Deployment Completed:
  Notification: Slack only

Unusual Traffic Spike:
  Condition: Requests > 2x baseline
  Notification: Slack only
```

---

## Incident Response

### Response Playbook

**1. Alert Triggered → Acknowledge (< 5 min)**
- Acknowledge alert in monitoring tool
- Notify team in #incidents channel
- Start timer for SLA tracking

**2. Assess Impact (< 10 min)**
- Check health endpoints
- Review error rates in Sentry
- Check recent deployments
- Determine user impact

**3. Mitigate (< 30 min)**
- If recent deployment: Consider rollback
- If database issue: Check connections, restart
- If external service: Check status pages
- If DDoS: Enable rate limiting

**4. Restore Service (< 1 hour)**
- Apply fix or rollback
- Verify health checks pass
- Monitor for 15 minutes
- Confirm with users if needed

**5. Post-Mortem (< 24 hours)**
- Document timeline
- Identify root cause
- List action items
- Update runbooks

### Common Incidents

#### API Returns 500 Errors

**Symptoms:** High 5xx error rate, health check fails

**Quick Checks:**
```bash
# Check API health
curl https://api.bibliology.com/health

# Check Render logs
# Dashboard → Service → Logs → Filter by ERROR

# Check database status
# Dashboard → Database → Status
```

**Likely Causes:**
1. Database connection lost
2. Recent deployment introduced bug
3. Out of memory
4. Disk full

**Resolution:**
1. If database issue: Restart API service
2. If deployment: Rollback (see DEPLOYMENT.md)
3. If resource: Scale up service
4. If disk: Clean up logs, scale storage

---

#### Slow Response Times

**Symptoms:** p95 > 2s, users report slowness

**Quick Checks:**
```bash
# Check Render metrics
# Dashboard → Service → Metrics → Response time

# Check database queries
# Dashboard → Database → Metrics

# Check error logs
# Look for "Slow query detected"
```

**Likely Causes:**
1. Unoptimized database queries
2. High traffic
3. External API slowness
4. Memory leak

**Resolution:**
1. Identify slow queries in logs
2. Add database indexes if needed
3. Scale up API service
4. Implement caching
5. Restart service to clear memory

---

#### Database Connection Errors

**Symptoms:** Health check shows "disconnected", 5xx errors

**Quick Checks:**
```bash
# Check database status
# Render Dashboard → Database → Status

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# API logs for "connection pool exhausted"
```

**Resolution:**
1. Verify database is running
2. Check DATABASE_URL is correct
3. Increase connection pool size
4. Restart API service
5. Check for connection leaks in code

---

## Dashboard Setup

### Render Dashboard

**What to Monitor:**
1. **API Service:**
   - Response time (p50, p95)
   - Request rate
   - Error rate
   - CPU & Memory usage

2. **Database:**
   - CPU usage
   - Storage used
   - Active connections
   - Query performance

3. **Redis:**
   - Memory usage
   - Connection count
   - Hit rate

### Custom Dashboard (Optional)

Create a simple dashboard:

```html
<!-- dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Bibliology Status</title>
  <script>
    async function checkHealth() {
      const api = await fetch('https://api.bibliology.com/health');
      const apiData = await api.json();

      document.getElementById('api-status').textContent =
        apiData.status === 'ok' ? '✅ Healthy' : '❌ Down';
    }

    setInterval(checkHealth, 30000); // Check every 30s
    checkHealth();
  </script>
</head>
<body>
  <h1>Bibliology Status</h1>
  <div id="api-status">Loading...</div>
</body>
</html>
```

---

## Monitoring Checklist

**Daily:**
- [ ] Check error rates in Sentry
- [ ] Review slow queries
- [ ] Check disk space

**Weekly:**
- [ ] Review performance trends
- [ ] Check for outdated dependencies
- [ ] Review failed deployments
- [ ] Update documentation

**Monthly:**
- [ ] Review alert thresholds
- [ ] Audit access logs
- [ ] Review and archive old data
- [ ] Test rollback procedures
- [ ] Rotate secrets

**Quarterly:**
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Review and update runbooks
- [ ] Security audit

---

## Resources

- [Render Metrics Documentation](https://render.com/docs/metrics)
- [Sentry Documentation](https://docs.sentry.io/)
- [BetterUptime Documentation](https://docs.betteruptime.com/)
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/)
- [Incident Response Best Practices](https://response.pagerduty.com/)

---

Last Updated: 2025-10-16
