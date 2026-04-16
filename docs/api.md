# API Reference

## Base URLs

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000` |
| Dev | `https://dev-api.homwe.app` |
| Production | `https://api.thescrub.app` |

---

## Authentication

The API supports two authentication methods depending on the caller.

### Bearer token (OIDC — web app users)

Obtained via the Zitadel OIDC flow. Sent as an `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are validated locally using Zitadel's JWKS endpoint. No introspection call is made per request. Keys are cached for 1 hour with automatic rotation on `kid` mismatch.

**Required env vars:** `ZITADEL_DOMAIN`, `ZITADEL_JWKS_URL`, `ZITADEL_CLIENT_ID`

### API key (integrations)

Created by authenticated users via `POST /api-keys`. Sent as an `X-API-Key` header:

```
X-API-Key: sk_<token>
```

Keys are stored as SHA-256 hashes. The raw key is shown once on creation. Keys are scoped to the creating user — all data returned is filtered to that user's records.

**Accepted by:** validation endpoints, history endpoints, webhook endpoints

---

## Validation

### `POST /validation/validate-single`

Validates a single email address. Requires Bearer or API key auth.

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Email address to validate |

**Response `200`**
```json
{
  "email": "user@example.com",
  "status": "deliverable",
  "reason": null,
  "details": {},
  "checks": {
    "syntax": true,
    "mx": true,
    "disposable": false,
    "role_based": false
  },
  "attributes": {
    "domain": "example.com",
    "is_free_provider": false
  },
  "quality_score": 95
}
```

**Status values**

| Status | Meaning |
|--------|---------|
| `deliverable` | Syntax valid, MX record found |
| `undeliverable` | Syntax valid, no MX record |
| `invalid_syntax` | Failed RFC syntax check |
| `risky` | Valid but flagged (disposable, role-based, etc.) |

**Response `422`** — email failed FastAPI query param validation

---

### `POST /validation/validate-bulk`

Validates up to 30,000 emails in a single request. Requires Bearer or API key auth.

**Request body**
```json
{
  "emails": ["a@example.com", "b@example.com"],
  "response_mode": "all",
  "dedupe": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `emails` | string[] | required | Up to 30,000 addresses |
| `response_mode` | enum | `"all"` | `"all"` \| `"invalid_only"` \| `"summary_only"` |
| `dedupe` | bool | `false` | Deduplicate (case-insensitive) before validating |

**Response `200`**
```json
{
  "summary": {
    "total": 2,
    "processed": 2,
    "valid": 1,
    "invalid": 1,
    "errors": 0,
    "deduped": true,
    "duplicates_removed": 0,
    "duration_ms": 312,
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "results": [
    {
      "email": "a@example.com",
      "valid": true,
      "status": "deliverable",
      "reason": null,
      "layer": "dns",
      "details": {}
    },
    {
      "email": "b@example.com",
      "valid": false,
      "status": "undeliverable",
      "reason": "no_mx",
      "layer": "dns",
      "details": {}
    }
  ]
}
```

`request_id` can be used with `GET /validation/history/bulk/{request_id}` to retrieve results later.

---

## Validation History

All history endpoints require an API key (`X-API-Key`). Results are always scoped to the key owner's data.

### `GET /validation/history`

Returns paginated validation history for the authenticated user, newest first.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | `1` | Page number (≥ 1) |
| `page_size` | int | `100` | Results per page (1–1000) |
| `is_valid` | bool | — | Filter by validation outcome |

**Response `200`**
```json
{
  "total": 4201,
  "page": 1,
  "page_size": 100,
  "results": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "validated_at": "2026-04-15T10:00:00",
      "is_valid": true,
      "quality_score": 95,
      "checks": { "syntax": true, "mx": true },
      "attributes": { "domain": "example.com" },
      "request_id": null,
      "user_id": "367962869381791750"
    }
  ]
}
```

---

### `GET /validation/history/bulk/{request_id}`

Returns all results for a specific bulk job by its `request_id`.

**Response `200`** — array of history entries (same shape as above)

**Response `404`** — request_id not found or not owned by caller

---

### `GET /validation/history/{email}`

Returns all validation history for a specific email address.

**Response `200`** — array of history entries

**Response `404`** — no history found for this email

---

### `DELETE /validation/history/{email}`

Deletes all history for an email address (GDPR right-to-erasure). Scoped to the caller's records only.

**Response `200`**
```json
{ "email": "user@example.com", "deleted": 3 }
```

---

## API Keys

All API key management endpoints require Bearer token auth (not API key — you need a user session to manage keys).

### `POST /api-keys`

Creates a new API key for the authenticated user.

**Request body**
```json
{ "name": "Zapier integration" }
```

| Field | Constraints |
|-------|-------------|
| `name` | 1–100 characters |

**Response `201`**
```json
{
  "id": 1,
  "name": "Zapier integration",
  "key": "sk_abc123...",
  "created_at": "2026-04-15T10:00:00"
}
```

> **The `key` field is shown once.** Store it immediately — it cannot be retrieved again.

---

### `GET /api-keys`

Lists all API keys for the authenticated user (active and revoked). The raw key is never returned.

**Response `200`**
```json
[
  {
    "id": 1,
    "name": "Zapier integration",
    "created_at": "2026-04-15T10:00:00",
    "last_used_at": "2026-04-15T12:30:00",
    "active": true
  }
]
```

---

### `DELETE /api-keys/{key_id}`

Revokes an API key. The key immediately stops working. Only the key owner can revoke it.

**Response `204`** — no content

**Response `404`** — key not found or not owned by caller

---

## Webhooks

Webhook endpoints require API key auth.

### `POST /webhooks/register`

Registers a URL to receive validation result events.

**Request body**
```json
{ "url": "https://your-service.com/hook" }
```

**Response `200`**
```json
{
  "url": "https://your-service.com/hook",
  "secret": "hex-signing-secret",
  "message": "Webhook registered. Save the secret — it will not be shown again."
}
```

Scrub signs each outbound payload with HMAC-SHA256 using this secret. Verify the `X-Scrub-Signature` header on your endpoint.

---

### `DELETE /webhooks/deregister`

**Query parameters:** `url` — the registered URL to remove

**Response `200`**
```json
{ "message": "Webhook deregistered successfully." }
```

**Response `404`** — URL not found

---

### `GET /webhooks/list`

Lists all registered webhooks.

**Response `200`**
```json
[
  { "id": 1, "url": "https://...", "active": true, "failure_count": 0 }
]
```

---

## Webhook payload format

Scrub sends `POST` requests to your registered URL after each validation.

**Headers**
```
Content-Type: application/json
X-Scrub-Signature: sha256=<hmac_hex>
```

**Single validation payload**
```json
{
  "endpoint": "single",
  "job_id": null,
  "summary": { "total": 1, "valid": 1, "invalid": 0 },
  "result": { "email": "...", "status": "deliverable", ... }
}
```

**Bulk validation payload**
```json
{
  "endpoint": "bulk",
  "job_id": null,
  "summary": {
    "total": 500,
    "processed": 498,
    "valid": 412,
    "invalid": 86,
    "errors": 2,
    "duplicates_removed": 14,
    "duration_ms": 4201,
    "request_id": "uuid"
  }
}
```

---

## Observability

### `GET /metrics`

Prometheus metrics in text exposition format.

| Metric | Type | Description |
|--------|------|-------------|
| `scrub_emails_total` | counter | Emails validated, labelled by `endpoint`, `status`, `layer` |
| `scrub_duration_seconds` | histogram | Validation latency by endpoint |
| `scrub_bulk_size` | histogram | Emails per bulk request |
| `scrub_duplicates_removed_total` | counter | Duplicates removed during bulk dedup |
| `postmark_bounce_events_total` | counter | Bounce events received from Postmark |
