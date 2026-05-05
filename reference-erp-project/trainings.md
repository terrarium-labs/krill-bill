# Trainings Feature — Backend Implementation Guide

This document explains **exactly** what the backend must implement for the Employee Trainings feature to work. It covers auth, response format, database schema, every endpoint, business rules, and error handling.

---

## 1. How the Frontend Calls the Backend

Every API call in LaIA goes through `laiaFetch` (see `src/api/0.core/basics.ts`). The key things to know:

### Auth header

The frontend attaches a Supabase JWT from `localStorage`:

```
Authorization: Bearer <supabase-access-token>
```

The backend must validate this token on every request using the Supabase JWT secret.

### How responses are parsed

`laiaFetch` wraps the raw response body in `{ success: data }`. So:

- If the backend returns `200` with body `{ "trainings": [...] }` → frontend gets `response.success.trainings`
- If the backend returns `409` → frontend reads `errorData.message` and shows it as a toast
- If the backend returns `204` → frontend gets `{ success: "OK" }` (no body needed)

**The backend returns plain JSON. It does NOT wrap anything in a `success` key — that is done client-side.**

### URL base

All URLs are constructed as `new URL("/orgs/{org_id}/...", baseApiUrl)`. The `org_id` is always a UUID in the path. **All resources are scoped to an org.**

### Status codes the frontend handles explicitly

| Status | Frontend behavior |
|---|---|
| `200` | Parses body as JSON, wraps in `{ success }` |
| `204` | Returns `{ success: "OK" }` (no body read) |
| `400` | Reads `detail` or `message` from body, shows error toast |
| `401` | Refreshes Supabase session, retries once |
| `403` | Reads `message` from body, shows error toast |
| `409` | Reads `message` or `error` from body, shows error toast |
| `422` | Reads `detail[]` array (FastAPI validation format), shows toast |
| `500` | Shows generic "Internal server error" toast |

---

## 2. Database Schema

### Table: `trainings`

```sql
CREATE TABLE trainings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL CHECK (category IN (
                        'compliance', 'technical', 'soft_skills',
                        'safety', 'leadership', 'other'
                    )),
    delivery_type   TEXT NOT NULL CHECK (delivery_type IN (
                        'online', 'in_person', 'hybrid'
                    )),
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                        'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'
                    )),
    provider        TEXT,
    location        TEXT,
    start_date      DATE,
    end_date        DATE,
    duration_hours  NUMERIC(6, 2),
    is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
    max_participants INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT end_date_after_start_date CHECK (
        end_date IS NULL OR start_date IS NULL OR end_date >= start_date
    )
);

-- Indexes
CREATE INDEX idx_trainings_org_id ON trainings(org_id);
CREATE INDEX idx_trainings_status ON trainings(org_id, status);
CREATE INDEX idx_trainings_category ON trainings(org_id, category);
```

`enrolled_count` is **not stored** — it is computed at query time using a JOIN or subquery (see endpoints below).

---

### Table: `training_enrollments`

```sql
CREATE TABLE training_enrollments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id      UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status           TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN (
                         'enrolled', 'in_progress', 'completed', 'failed', 'withdrew'
                     )),
    enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_date  DATE,
    score            NUMERIC(5, 2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    certificate_url  TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One enrollment per employee per training
    CONSTRAINT unique_employee_training UNIQUE (training_id, employee_id)
);

-- Indexes
CREATE INDEX idx_enrollments_training_id ON training_enrollments(training_id);
CREATE INDEX idx_enrollments_employee_id ON training_enrollments(employee_id);
```

---

### Trigger: `updated_at` auto-update (if not already global)

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trainings_updated_at
    BEFORE UPDATE ON trainings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER training_enrollments_updated_at
    BEFORE UPDATE ON training_enrollments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 3. JSON Shapes

These are the exact JSON objects returned by the backend. Field order does not matter.

### `Training` object

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fire Safety Training",
  "description": "Annual mandatory fire safety awareness session.",
  "category": "safety",
  "delivery_type": "in_person",
  "status": "scheduled",
  "provider": "SafetyFirst Ltd.",
  "location": "Conference Room A",
  "start_date": "2026-05-12",
  "end_date": "2026-05-12",
  "duration_hours": 4.0,
  "is_mandatory": true,
  "max_participants": 20,
  "enrolled_count": 7
}
```

- `start_date` / `end_date` — `YYYY-MM-DD` string or `null`
- `enrolled_count` — integer, always included, never `null` (use `0` if none)
- All optional fields (`description`, `provider`, `location`, `duration_hours`, `max_participants`) — `null` when not set, **not omitted**

---

### `TrainingEnrollment` object (base form — used in enrollment write responses)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "training_id": "550e8400-e29b-41d4-a716-446655440000",
  "employee_id": "d4e5f6a7-b8c9-0123-def0-456789abcdef",
  "status": "completed",
  "enrolled_at": "2026-04-01T09:30:00Z",
  "completion_date": "2026-05-12",
  "score": 87.5,
  "certificate_url": null,
  "notes": null
}
```

---

### `TrainingEnrollment` object (with nested `employee` — for enrollment list endpoints)

Returned by `GET /orgs/{org_id}/trainings/{training_id}/enrollments`:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "training_id": "550e8400-e29b-41d4-a716-446655440000",
  "employee_id": "d4e5f6a7-b8c9-0123-def0-456789abcdef",
  "employee": {
    "id": "d4e5f6a7-b8c9-0123-def0-456789abcdef",
    "first_name": "Maria",
    "last_name": "García",
    "photo_url": "https://cdn.example.com/photos/maria.jpg"
  },
  "status": "enrolled",
  "enrolled_at": "2026-04-01T09:30:00Z",
  "completion_date": null,
  "score": null,
  "certificate_url": null,
  "notes": null
}
```

---

### `TrainingEnrollment` object (with nested `training` — for employee-scoped list endpoints)

Returned by `GET /orgs/{org_id}/employees/{employee_id}/trainings` and `GET /orgs/{org_id}/me/employee/trainings`:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "training_id": "550e8400-e29b-41d4-a716-446655440000",
  "training": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Fire Safety Training",
    "description": "Annual mandatory fire safety awareness session.",
    "category": "safety",
    "delivery_type": "in_person",
    "status": "scheduled",
    "provider": "SafetyFirst Ltd.",
    "location": "Conference Room A",
    "start_date": "2026-05-12",
    "end_date": "2026-05-12",
    "duration_hours": 4.0,
    "is_mandatory": true,
    "max_participants": 20,
    "enrolled_count": 7
  },
  "employee_id": "d4e5f6a7-b8c9-0123-def0-456789abcdef",
  "status": "enrolled",
  "enrolled_at": "2026-04-01T09:30:00Z",
  "completion_date": null,
  "score": null,
  "certificate_url": null,
  "notes": null
}
```

---

## 4. Pagination

All list endpoints support cursor-based pagination.

- The client passes `?page_token=<opaque_token>` to fetch the next page
- The response always includes `"next_page_token": <string or null>`
- When `next_page_token` is `null`, there are no more pages
- Default page size: **50 items** (configurable per endpoint)

The simplest implementation is to use the last row's `id` (UUID) or a timestamp as the cursor, encoded as a base64 string. Example:

```python
import base64, json

def encode_page_token(last_id: str) -> str:
    return base64.urlsafe_b64encode(json.dumps({"id": last_id}).encode()).decode()

def decode_page_token(token: str) -> dict:
    return json.loads(base64.urlsafe_b64decode(token.encode()))
```

For ordering, always use `ORDER BY created_at ASC, id ASC` so pagination is stable.

---

## 5. Error Response Format

The frontend reads these fields depending on the status code:

### `400 Bad Request` — validation / business rule failure

```json
{
  "detail": "end_date must be on or after start_date"
}
```

or:

```json
{
  "message": "Training cannot be cancelled while employees are actively enrolled"
}
```

The frontend shows the string value of `detail` or `message` as a toast error.

---

### `403 Forbidden`

```json
{
  "message": "You do not have permission to perform this action"
}
```

---

### `404 Not Found`

```json
{
  "message": "Training not found"
}
```

The frontend does not show a toast for 404 — handle it as needed.

---

### `409 Conflict`

```json
{
  "message": "This employee is already enrolled in this training"
}
```

The frontend shows `message` or `error` as a toast.

---

### `422 Unprocessable Entity` — FastAPI/Pydantic validation format (if using FastAPI)

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "missing"
    }
  ]
}
```

The frontend joins all `msg` values and shows them as a toast.

---

## 6. Endpoints — Complete Specification

### Auth check for every endpoint

Before any logic, validate the Bearer token:
1. Extract `Authorization: Bearer <token>` header
2. Verify the JWT using your Supabase JWT secret
3. Extract the `sub` (user UUID) from the token payload
4. Look up the user's membership in `org_id` — they must be an active member
5. For admin-only endpoints, check that the user has `hr_admin` or `org_admin` role

If the token is missing or invalid → `401`. If the user is not a member → `403`.

---

### Endpoint 1 — List Trainings

```
GET /orgs/{org_id}/trainings
```

**Who can call it:** Any org member (employees and HR admins)

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `query` | string | No | Full-text search on `title`, `provider`, `description` |
| `status` | string | No | Filter by `status` enum value |
| `category` | string | No | Filter by `category` enum value |
| `page_token` | string | No | Pagination cursor from previous response |

**What to do:**
1. Auth check (any member)
2. Query `trainings` WHERE `org_id = ?`, applying filters
3. For `query`: use `ILIKE '%{query}%'` on `title`, `provider`, `description` (OR condition)
4. Compute `enrolled_count` per training via a subquery or LEFT JOIN on `training_enrollments`
5. Order by `created_at ASC, id ASC`
6. Apply page_token cursor if provided
7. Return up to 50 results

**SQL example:**

```sql
SELECT
    t.*,
    COUNT(e.id)::int AS enrolled_count
FROM trainings t
LEFT JOIN training_enrollments e ON e.training_id = t.id
WHERE t.org_id = :org_id
  AND (:query IS NULL OR (
      t.title ILIKE '%' || :query || '%'
      OR t.provider ILIKE '%' || :query || '%'
      OR t.description ILIKE '%' || :query || '%'
  ))
  AND (:status IS NULL OR t.status = :status)
  AND (:category IS NULL OR t.category = :category)
GROUP BY t.id
ORDER BY t.created_at ASC, t.id ASC
LIMIT 51;  -- fetch 51 to know if there's a next page
```

Fetch 51 rows. If you get 51, return 50 and encode the 50th row's id as `next_page_token`. If you get ≤50, set `next_page_token` to `null`.

**Response `200 OK`:**

```json
{
  "trainings": [
    {
      "id": "...",
      "title": "Fire Safety Training",
      "category": "safety",
      "delivery_type": "in_person",
      "status": "scheduled",
      "provider": "SafetyFirst Ltd.",
      "location": "Conference Room A",
      "start_date": "2026-05-12",
      "end_date": "2026-05-12",
      "duration_hours": 4.0,
      "is_mandatory": true,
      "max_participants": 20,
      "description": null,
      "enrolled_count": 7
    }
  ],
  "next_page_token": null
}
```

---

### Endpoint 2 — Create Training

```
POST /orgs/{org_id}/trainings
```

**Who can call it:** HR admin or org admin only

**Request body (`Content-Type: application/json`):**

```json
{
  "title": "Fire Safety Training",
  "description": "Annual mandatory fire safety awareness session.",
  "category": "safety",
  "delivery_type": "in_person",
  "status": "draft",
  "provider": "SafetyFirst Ltd.",
  "location": "Conference Room A",
  "start_date": "2026-05-12",
  "end_date": "2026-05-12",
  "duration_hours": 4.0,
  "is_mandatory": true,
  "max_participants": 20
}
```

**Required fields:** `title`, `category`, `delivery_type`, `is_mandatory`

**Optional fields:** `description`, `status` (defaults to `draft`), `provider`, `location`, `start_date`, `end_date`, `duration_hours`, `max_participants`

**Never accepted:** `id`, `enrolled_count`, `created_at`, `updated_at`

**Validation:**
- `title` must be non-empty string
- `category` must be one of the enum values
- `delivery_type` must be one of the enum values
- `status` must be one of the enum values if provided
- `end_date >= start_date` if both provided → `400` if violated
- `duration_hours` must be positive
- `max_participants` must be a positive integer

**What to do:**
1. Auth check (admin only)
2. Validate body
3. INSERT into `trainings` with `org_id = {org_id}`
4. Return the newly created training with `enrolled_count: 0`

**Response `200 OK`:**

```json
{
  "training": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Fire Safety Training",
    "description": "Annual mandatory fire safety awareness session.",
    "category": "safety",
    "delivery_type": "in_person",
    "status": "draft",
    "provider": "SafetyFirst Ltd.",
    "location": "Conference Room A",
    "start_date": "2026-05-12",
    "end_date": "2026-05-12",
    "duration_hours": 4.0,
    "is_mandatory": true,
    "max_participants": 20,
    "enrolled_count": 0
  }
}
```

---

### Endpoint 3 — Get Training

```
GET /orgs/{org_id}/trainings/{training_id}
```

**Who can call it:** Any org member

**What to do:**
1. Auth check (any member)
2. SELECT training WHERE `id = :training_id AND org_id = :org_id`
3. If not found → `404` with `{ "message": "Training not found" }`
4. Compute `enrolled_count` via subquery
5. Return training

**Response `200 OK`:**

```json
{
  "training": { ...Training object... }
}
```

---

### Endpoint 4 — Update Training

```
PATCH /orgs/{org_id}/trainings/{training_id}
```

**Who can call it:** HR admin or org admin only

**Request body:** Any subset of Training fields (partial update). Only send the fields you want to update. The backend must NOT reset unmentioned fields.

```json
{
  "status": "scheduled",
  "start_date": "2026-05-12"
}
```

**Fields that cannot be updated via this endpoint:** `id`, `org_id`, `enrolled_count`, `created_at`

**Business rules:**
- If `status` is being set to `cancelled`: check that there are no enrollments with `status IN ('enrolled', 'in_progress')`. If there are → `400` with `{ "message": "Cannot cancel a training with active enrollments" }`
- Validate `end_date >= start_date` considering the merged state (current DB values + new values from request)

**What to do:**
1. Auth check (admin only)
2. Fetch current training — if not found → `404`
3. Validate
4. UPDATE only the provided fields (use COALESCE or build dynamic SQL)
5. Re-query with `enrolled_count` and return updated training

**Response `200 OK`:**

```json
{
  "training": { ...updated Training object... }
}
```

---

### Endpoint 5 — Delete Training

```
DELETE /orgs/{org_id}/trainings/{training_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**
- If the training has **any enrollments at all** → `409` with `{ "message": "Cannot delete a training that has enrolled employees. Remove all enrollments first." }`
- If there are no enrollments → hard delete is safe (CASCADE will handle related records)

**What to do:**
1. Auth check (admin only)
2. Fetch training — if not found → `404`
3. Check `COUNT(*) FROM training_enrollments WHERE training_id = :id`
4. If count > 0 → `409`
5. DELETE FROM `trainings` WHERE `id = :id AND org_id = :org_id`
6. Return `204 No Content` (no body)

**Response `204 No Content`** (empty body)

---

### Endpoint 6 — List Enrollments for a Training

```
GET /orgs/{org_id}/trainings/{training_id}/enrollments
```

**Who can call it:** HR admin or org admin only

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `page_token` | string | No | Pagination cursor |
| `status` | string | No | Filter by enrollment `status` |

**What to do:**
1. Auth check (admin only)
2. Verify training exists under this `org_id` — if not → `404`
3. Query `training_enrollments` WHERE `training_id = :training_id`
4. JOIN with the `employees` table (or equivalent) to get `first_name`, `last_name`, `photo_url` for each enrollment
5. Order by `enrolled_at ASC, id ASC`
6. Paginate (50 per page)

**SQL example:**

```sql
SELECT
    te.*,
    emp.id        AS emp_id,
    emp.first_name,
    emp.last_name,
    emp.photo_url
FROM training_enrollments te
JOIN employees emp ON emp.id = te.employee_id
WHERE te.training_id = :training_id
  AND (:status IS NULL OR te.status = :status)
ORDER BY te.enrolled_at ASC, te.id ASC
LIMIT 51;
```

**Response `200 OK`:**

```json
{
  "enrollments": [
    {
      "id": "...",
      "training_id": "...",
      "employee_id": "...",
      "employee": {
        "id": "...",
        "first_name": "Maria",
        "last_name": "García",
        "photo_url": "https://cdn.example.com/photos/maria.jpg"
      },
      "status": "enrolled",
      "enrolled_at": "2026-04-01T09:30:00Z",
      "completion_date": null,
      "score": null,
      "certificate_url": null,
      "notes": null
    }
  ],
  "next_page_token": null
}
```

---

### Endpoint 7 — Enroll Employee in Training

```
POST /orgs/{org_id}/trainings/{training_id}/enrollments
```

**Who can call it:** HR admin or org admin only

**Request body:**

```json
{
  "employee_id": "d4e5f6a7-b8c9-0123-def0-456789abcdef",
  "status": "enrolled",
  "completion_date": null,
  "score": null,
  "certificate_url": null,
  "notes": null
}
```

**Required fields:** `employee_id`

**Optional fields:** `status` (defaults to `enrolled`), `completion_date`, `score`, `certificate_url`, `notes`

**Business rules (check in this order):**
1. Verify `training_id` exists under `org_id` — if not → `404` with `{ "message": "Training not found" }`
2. Verify `employee_id` exists under `org_id` — if not → `404` with `{ "message": "Employee not found" }`
3. Check if this employee is already enrolled: SELECT from `training_enrollments` WHERE `training_id = ? AND employee_id = ?` — if row exists → `409` with `{ "message": "This employee is already enrolled in this training" }`
4. Check capacity: if `max_participants` is set on the training AND `enrolled_count >= max_participants` → `409` with `{ "message": "This training has reached its maximum number of participants" }`
5. If `status = 'completed'` and `completion_date` is not provided → set `completion_date = TODAY`
6. INSERT into `training_enrollments` with `enrolled_at = NOW()` (server-set, never from client)

**Response `200 OK`:**

```json
{
  "enrollment": {
    "id": "...",
    "training_id": "...",
    "employee_id": "...",
    "status": "enrolled",
    "enrolled_at": "2026-04-08T14:00:00Z",
    "completion_date": null,
    "score": null,
    "certificate_url": null,
    "notes": null
  }
}
```

Note: the response does **not** need to nest the `employee` or `training` objects — those are only needed in list endpoints.

---

### Endpoint 8 — Update Enrollment

```
PATCH /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}
```

**Who can call it:** HR admin or org admin only

**Request body (partial — only send what you want to change):**

```json
{
  "status": "completed",
  "score": 92.0,
  "completion_date": "2026-05-12",
  "notes": "Excellent performance"
}
```

**Fields that CAN be updated:** `status`, `completion_date`, `score`, `certificate_url`, `notes`

**Fields that CANNOT be updated:** `id`, `training_id`, `employee_id`, `enrolled_at`, `created_at`

**Business rules:**
- If `status` is being set to `completed` and `completion_date` is not provided in the request AND is currently `null` in the DB → auto-set `completion_date = TODAY`

**What to do:**
1. Auth check (admin only)
2. Verify the training exists under `org_id` → `404` if not
3. Verify the enrollment exists AND belongs to that training → `404` if not
4. Validate: `score` must be between 0 and 100 if provided
5. UPDATE only the provided fields
6. Return the updated enrollment (no nesting required)

**Response `200 OK`:**

```json
{
  "enrollment": {
    "id": "...",
    "training_id": "...",
    "employee_id": "...",
    "status": "completed",
    "enrolled_at": "2026-04-01T09:30:00Z",
    "completion_date": "2026-05-12",
    "score": 92.0,
    "certificate_url": null,
    "notes": "Excellent performance"
  }
}
```

---

### Endpoint 9 — Remove Enrollment

```
DELETE /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}
```

**Who can call it:** HR admin or org admin only

**What to do:**
1. Auth check (admin only)
2. Verify training exists under `org_id` → `404` if not
3. Verify enrollment exists AND `training_id` matches → `404` if not
4. Hard delete the enrollment row
5. Return `204 No Content`

**Response `204 No Content`** (empty body)

---

### Endpoint 10 — List an Employee's Trainings (HR Admin View)

```
GET /orgs/{org_id}/employees/{employee_id}/trainings
```

**Who can call it:** HR admin, org admin, or the employee themselves (i.e. if `employee_id` corresponds to the calling user)

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `page_token` | string | No | Pagination cursor |
| `status` | string | No | Filter by enrollment `status` |

**What to do:**
1. Auth check
2. Verify `employee_id` exists under `org_id` → `404` if not
3. Query `training_enrollments` WHERE `employee_id = :employee_id`
4. JOIN with `trainings` table to get all training fields
5. For each enrollment, compute `enrolled_count` for the nested training via subquery
6. Order by `enrolled_at DESC, id DESC` (most recent first makes more sense for an employee's own view)
7. Paginate

**SQL example:**

```sql
SELECT
    te.*,
    t.id                AS training_id,
    t.title,
    t.description,
    t.category,
    t.delivery_type,
    t.status            AS training_status,
    t.provider,
    t.location,
    t.start_date,
    t.end_date,
    t.duration_hours,
    t.is_mandatory,
    t.max_participants,
    (SELECT COUNT(*)::int FROM training_enrollments WHERE training_id = t.id) AS enrolled_count
FROM training_enrollments te
JOIN trainings t ON t.id = te.training_id
WHERE te.employee_id = :employee_id
  AND t.org_id = :org_id
  AND (:status IS NULL OR te.status = :status)
ORDER BY te.enrolled_at DESC, te.id DESC
LIMIT 51;
```

**Response `200 OK`:**

```json
{
  "enrollments": [
    {
      "id": "...",
      "training_id": "...",
      "training": {
        "id": "...",
        "title": "Fire Safety Training",
        "description": "...",
        "category": "safety",
        "delivery_type": "in_person",
        "status": "completed",
        "provider": "SafetyFirst Ltd.",
        "location": "Conference Room A",
        "start_date": "2026-05-12",
        "end_date": "2026-05-12",
        "duration_hours": 4.0,
        "is_mandatory": true,
        "max_participants": 20,
        "enrolled_count": 7
      },
      "employee_id": "...",
      "status": "completed",
      "enrolled_at": "2026-04-01T09:30:00Z",
      "completion_date": "2026-05-12",
      "score": 87.5,
      "certificate_url": null,
      "notes": null
    }
  ],
  "next_page_token": null
}
```

---

### Endpoint 11 — List Current User's Own Trainings (Self-Service)

```
GET /orgs/{org_id}/me/employee/trainings
```

**Who can call it:** Any org member who has an employee record in the org

**Query params:** Same as endpoint 10

**What to do:**
1. Auth check (any member)
2. From the JWT `sub`, resolve which `employee_id` belongs to this user in `org_id`. If the user has no employee record → `403` with `{ "message": "You do not have an employee record in this organization" }`
3. Run the same query as endpoint 10 using that resolved `employee_id`

**Response `200 OK`:** Identical shape to endpoint 10.

---

## 7. Frontend API Call Reference

This section shows exactly what the frontend sends and what it expects back, so you can test manually.

### Create a training

```
POST /orgs/ORG_ID/trainings
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Fire Safety",
  "category": "safety",
  "delivery_type": "in_person",
  "status": "draft",
  "is_mandatory": true
}
```

Frontend reads: `response.success.training.id`

---

### Get a training detail page

```
GET /orgs/ORG_ID/trainings/TRAINING_ID
Authorization: Bearer TOKEN
```

Frontend reads: `response.success.training`

---

### List enrolled employees in a training

```
GET /orgs/ORG_ID/trainings/TRAINING_ID/enrollments
Authorization: Bearer TOKEN
```

Frontend reads: `response.success.enrollments`, `response.success.next_page_token`

---

### Enroll an employee

```
POST /orgs/ORG_ID/trainings/TRAINING_ID/enrollments
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "employee_id": "EMPLOYEE_UUID",
  "status": "enrolled"
}
```

Frontend reads: `response.success.enrollment`

---

### Edit an enrollment

```
PATCH /orgs/ORG_ID/trainings/TRAINING_ID/enrollments/ENROLLMENT_ID
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "completed",
  "score": 92
}
```

Frontend reads: `response.success.enrollment`

---

### Remove an enrollment

```
DELETE /orgs/ORG_ID/trainings/TRAINING_ID/enrollments/ENROLLMENT_ID
Authorization: Bearer TOKEN
```

Frontend reads: `response.success` (will be the string `"OK"` from a `204` response)

---

### Employee detail tab — list trainings for a specific employee

```
GET /orgs/ORG_ID/employees/EMPLOYEE_ID/trainings
Authorization: Bearer TOKEN
```

Frontend reads: `response.success.enrollments` (with nested `training` object)

---

### Profile "My Trainings" tab — list current user's trainings

```
GET /orgs/ORG_ID/me/employee/trainings
Authorization: Bearer TOKEN
```

Frontend reads: `response.success.enrollments` (with nested `training` object)

---

## 8. Summary Checklist for Implementation

Use this to track progress:

- [ ] Database: create `trainings` table with constraints and indexes
- [ ] Database: create `training_enrollments` table with UNIQUE constraint and indexes
- [ ] Database: add `updated_at` triggers
- [ ] `GET /orgs/{org_id}/trainings` — with search, filters, pagination, `enrolled_count`
- [ ] `POST /orgs/{org_id}/trainings` — create, admin only
- [ ] `GET /orgs/{org_id}/trainings/{training_id}` — get single with `enrolled_count`
- [ ] `PATCH /orgs/{org_id}/trainings/{training_id}` — partial update, admin only
- [ ] `DELETE /orgs/{org_id}/trainings/{training_id}` — hard delete, check enrollments first
- [ ] `GET /orgs/{org_id}/trainings/{training_id}/enrollments` — with nested `employee` object
- [ ] `POST /orgs/{org_id}/trainings/{training_id}/enrollments` — enroll, check capacity & duplicates
- [ ] `PATCH /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}` — partial update
- [ ] `DELETE /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}` — hard delete
- [ ] `GET /orgs/{org_id}/employees/{employee_id}/trainings` — with nested `training` object
- [ ] `GET /orgs/{org_id}/me/employee/trainings` — resolve employee from JWT, same shape as above
