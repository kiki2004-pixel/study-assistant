# API Reference

Base URL (local): `http://localhost:3000`

## Authentication

Webhook management endpoints require an API key:
```
X-Api-Key: <API_KEY>
```

All validation endpoints are currently unauthenticated.

---

## Validation

### `POST /validation/validate-single`

Validates a single email address (syntax + DNS MX check).

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Email address to validate |

**Response `200`**
```json
{
  "email": "user@example.com",
  "valid": true,
  "status": "deliverable",
  "reason": null
}
```

**Status values**

| Status | Meaning |
|--------|---------|
| `deliverable` | Syntax valid, MX record found |
| `undeliverable` | Syntax valid, no MX record |
| `invalid_syntax` | Failed RFC syntax check |

**Response `422`** — invalid syntax (FastAPI validation error)

---

### `POST /validation/validate-bulk`

Validates a list of email addresses.

**Request body**
```json
{
  "emails": ["a@example.com", "b@example.com"],
  "response_mode": "all",
  "dedupe": false
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `emails` | string[] | required | Up to 30,000 addresses |
| `response_mode` | enum | `"all"` | `"all"` \| `"invalid_only"` \| `"summary_only"` |
| `dedupe` | bool | `false` | Deduplicate before validating |

**Response `200` — `response_mode: "all"`**
```json
{
  "results": [
    { "email": "a@example.com", "valid": true, "status": "deliverable", "reason": null },
    { "email": "b@example.com", "valid": false, "status": "undeliverable", "reason": "no_mx" }
  ],
  "summary": {
    "total": 2,
    "valid": 1,
    "invalid": 1
  }
}
```

**Response `200` — `response_mode: "summary_only"`**
```json
{
  "results": [],
  "summary": { "total": 2, "valid": 1, "invalid": 1 }
}
```

---

### `GET /validation/trigger`

Manually triggers the Listmonk validation job (same as the Celery scheduled task).

**Response `200`**
```json
{ "status": "triggered" }
```

---

## Webhooks

Webhook endpoints require `X-Api-Key` header.

### `POST /webhooks/register`

Registers a URL to receive validation events.

**Request body**
```json
{
  "url": "https://your-service.com/hook",
  "secret": "your-signing-secret"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "url": "https://your-service.com/hook",
  "active": true
}
```

Payloads are signed with HMAC-SHA256 using the provided secret. The signature is sent in the `X-Scrub-Signature` header.

---

### `DELETE /webhooks/{id}`

Deregisters a webhook.

**Response `204`** — no content

---

### `GET /webhooks`

Lists all registered webhooks.

**Response `200`**
```json
[
  { "id": "uuid", "url": "https://...", "active": true, "failure_count": 0 }
]
```

---

## Listmonk

### `POST /listmonk/validate`

Runs a single Listmonk list validation pass (fetches, validates, unsubscribes). Requires Listmonk credentials in the request body.

---

## Postmark webhook

### `POST /postmark/webhook`

Receives bounce/complaint events from Postmark and blocklists the affected address in Listmonk.

Authenticated via `X-Postmark-Secret` header (set `POSTMARK_WEBHOOK_SECRET` env var).

---

## Observability

### `GET /metrics`

Prometheus metrics in text exposition format. Includes:
- `http_requests_total` — request count by endpoint and status
- `http_request_duration_seconds` — latency histogram
- `scrub_bulk_size` — histogram of bulk request sizes
- `scrub_valid_emails_total` / `scrub_invalid_emails_total` — validation outcome counters
