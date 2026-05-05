# Trainings V2 — Backend Implementation Guide

This document describes the backend API for the **Trainings V2** feature. It covers database schema, JSON response shapes, every endpoint, business rules, and error handling.

This is an **incremental upgrade** on top of the existing v1 Trainings feature. V1 already provides `Trainings` and `TrainingEnrollments` with full CRUD. V2 adds:

- **Dynamic categories** — `TrainingCategories` table, replaces hardcoded `category` enum
- **Training groups / editions** — `TrainingGroups` table, multiple sessions per training
- **Scheduled reminders** — `TrainingGroupReminders` per group
- **Training materials** — `TrainingMaterials` file attachments
- **Attendance confirmation** — `attendance_confirmed` on enrollments
- **Course validity / expiry** — `expires_at` computed from `validity_months`
- **Cost & budget tracking** — `cost_per_participant`, `budget` on trainings
- **Export report** — CSV / Excel download
- **Insights dashboard** — aggregate stats endpoint

---

## Database Schema

### New Table: `TrainingCategories`

Replaces the hardcoded `category` enum on `Trainings`. Categories are org-owned and managed dynamically.

```sql
CREATE TABLE public."TrainingCategories" (
    id          bigserial NOT NULL PRIMARY KEY,
    org_id      bigint NOT NULL REFERENCES public."Orgs"(id),
    name        text NOT NULL,
    description text,
    color       text,
    created_at  timestamptz NOT NULL DEFAULT NOW(),
    updated_at  timestamptz NOT NULL DEFAULT NOW(),
    deleted_at  timestamptz
);

CREATE TRIGGER "TR_TrainingCategories_set_updated_at"
    BEFORE UPDATE ON public."TrainingCategories"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX "IX_TrainingCategories_org_id" ON public."TrainingCategories"(org_id);
CREATE INDEX "IX_TrainingCategories_name_trgm" ON public."TrainingCategories" USING GIN (name gin_trgm_ops);
CREATE UNIQUE INDEX "IX_TrainingCategories_org_name_unique" ON public."TrainingCategories"(org_id, name) WHERE deleted_at IS NULL;
```

---

### New Table: `TrainingGroups`

A group represents a specific session or edition of a training (e.g. "Q2 2026 cohort", "Madrid – June"). Each group has its own dates and its own enrolled participants.

```sql
CREATE TABLE public."TrainingGroups" (
    id              bigserial NOT NULL PRIMARY KEY,
    training_id     bigint NOT NULL REFERENCES public."Trainings"(id),
    name            text NOT NULL,
    code            text,
    description     text,
    start_date      date,
    end_date        date,
    location        text,
    max_participants integer,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW(),
    deleted_at      timestamptz,

    CONSTRAINT "CK_TrainingGroups_end_after_start"
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TRIGGER "TR_TrainingGroups_set_updated_at"
    BEFORE UPDATE ON public."TrainingGroups"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX "IX_TrainingGroups_training_id" ON public."TrainingGroups"(training_id);
```

---

### New Table: `TrainingGroupReminders`

Scheduled email reminders for a group. Always queried inline with the group — never independently.

```sql
CREATE TABLE public."TrainingGroupReminders" (
    id                 bigserial NOT NULL PRIMARY KEY,
    training_group_id  bigint NOT NULL REFERENCES public."TrainingGroups"(id) ON DELETE CASCADE,
    days_before        integer NOT NULL CHECK (days_before > 0),
    message            text,
    sent_at            timestamptz,
    created_at         timestamptz NOT NULL DEFAULT NOW(),
    deleted_at         timestamptz
);

CREATE INDEX "IX_TrainingGroupReminders_training_group_id" ON public."TrainingGroupReminders"(training_group_id);
```

> Reminders cascade-delete when their parent group is hard-deleted. When a group is soft-deleted (`deleted_at` set), the service must also soft-delete its reminders in the same transaction.

---

### New Table: `TrainingMaterials`

File attachments (PDFs, slides, documents) for a training. Stored in object storage; only the URL is persisted here.

```sql
CREATE TABLE public."TrainingMaterials" (
    id              bigserial NOT NULL PRIMARY KEY,
    training_id     bigint NOT NULL REFERENCES public."Trainings"(id),
    org_user_id     bigint REFERENCES public."OrgUsers"(id) ON DELETE SET NULL,
    name            text NOT NULL,
    file_url        text NOT NULL,
    file_type       text,
    file_size       bigint,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    deleted_at      timestamptz
);

CREATE INDEX "IX_TrainingMaterials_training_id" ON public."TrainingMaterials"(training_id);
```

---

### Updated Table: `Trainings` — new columns

```sql
ALTER TABLE public."Trainings"
    -- Replace the hardcoded category enum:
    DROP COLUMN IF EXISTS category,
    ADD COLUMN category_id          bigint REFERENCES public."TrainingCategories"(id) ON DELETE SET NULL,

    -- New v2 columns:
    ADD COLUMN validity_months       integer,           -- null = no expiry
    ADD COLUMN learning_platform_url text,
    ADD COLUMN cost_per_participant  numeric(10, 2),
    ADD COLUMN budget                numeric(10, 2),
    ADD COLUMN is_subsidized         boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN subsidized_by         text;
```

> **Migration order:** (1) CREATE `TrainingCategories`, (2) INSERT rows from existing `category` enum values per org, (3) `UPDATE "Trainings" SET category_id = ...` backfill, (4) DROP COLUMN `category`.

---

### Updated Table: `TrainingEnrollments` — new columns

```sql
ALTER TABLE public."TrainingEnrollments"
    ADD COLUMN training_group_id         bigint REFERENCES public."TrainingGroups"(id) ON DELETE SET NULL,
    ADD COLUMN attendance_confirmed      boolean NOT NULL DEFAULT FALSE,
    ADD COLUMN attendance_confirmed_at   timestamptz,
    ADD COLUMN expires_at                date;
```

---

## ID Format

| Entity | Prefix | Example |
|--------|--------|---------|
| TrainingCategory | `tc_` | `tc_000001` |
| TrainingGroup | `tg_` | `tg_000001` |
| TrainingGroupReminder | `tgr_` | `tgr_000001` |
| TrainingMaterial | `tm_` | `tm_000001` |

Existing prefixes `tn_` (Training) and `te_` (TrainingEnrollment) are unchanged.

---

## JSON Response Shapes

### `TrainingCategory` object

```json
{
  "id": "tc_000001",
  "org_id": "or_000001",
  "name": "Compliance",
  "description": "Regulatory and compliance courses",
  "color": "#ef4444",
  "created_at": "2026-01-01T09:00:00Z"
}
```

- `color` — optional hex string or `null`
- `description` — optional or `null`

---

### `TrainingGroupReminder` object

```json
{
  "id": "tgr_000001",
  "training_group_id": "tg_000001",
  "days_before": 7,
  "message": null,
  "sent_at": null
}
```

- `sent_at` — `null` if not yet sent; ISO 8601 timestamp once sent
- `message` — optional custom email body, `null` to use default template

---

### `TrainingGroup` object

```json
{
  "id": "tg_000001",
  "training_id": "tn_000001",
  "name": "January 2026 Edition",
  "code": "FS-2026-JAN",
  "description": null,
  "start_date": "2026-01-15",
  "end_date": "2026-01-15",
  "location": "Madrid HQ – Room B2",
  "max_participants": 15,
  "enrolled_count": 8,
  "reminders": [
    { "id": "tgr_000001", "training_group_id": "tg_000001", "days_before": 7, "message": null, "sent_at": null }
  ],
  "created_at": "2026-01-01T09:00:00Z",
  "updated_at": "2026-01-01T09:00:00Z"
}
```

- `enrolled_count` — computed via `COUNT` JOIN on `TrainingEnrollments`; always `0` not `null`
- `reminders` — always included in list/get responses; empty array `[]` when none
- `code`, `description`, `location`, `max_participants` — optional, `null` when not set

---

### `TrainingMaterial` object

```json
{
  "id": "tm_000001",
  "training_id": "tn_000001",
  "org_user_id": "ou_000001",
  "name": "Safety Handbook 2026",
  "file_url": "https://storage.example.com/materials/safety-handbook.pdf",
  "file_type": "application/pdf",
  "file_size": 2048576,
  "created_at": "2026-01-01T12:00:00Z"
}
```

- `file_type` — MIME type or `null`
- `file_size` — bytes or `null`
- `org_user_id` — uploader, or `null` if the user was deleted

---

### Updated `Training` object

```json
{
  "id": "tn_000001",
  "org_id": "or_000001",
  "title": "Fire Safety Training",
  "description": "Annual mandatory fire safety session.",
  "category_id": "tc_000001",
  "category": {
    "id": "tc_000001",
    "name": "Safety",
    "color": "#f97316",
    "description": null
  },
  "delivery_type": "in_person",
  "status": "scheduled",
  "provider": "SafetyFirst Ltd.",
  "location": "Conference Room A",
  "start_date": "2026-05-12",
  "end_date": "2026-05-12",
  "duration_hours": 4.0,
  "is_mandatory": true,
  "max_participants": 20,
  "enrolled_count": 7,
  "validity_months": 12,
  "learning_platform_url": "https://lms.example.com/fire-safety",
  "cost_per_participant": 150.00,
  "budget": 3000.00,
  "is_subsidized": false,
  "subsidized_by": null,
  "created_at": "2026-01-01T09:00:00Z",
  "updated_at": "2026-01-01T09:00:00Z"
}
```

- `category` — nested `TrainingCategory` object or `null` when not assigned
- `category_id` — FK prefixed string or `null`
- `validity_months`, `learning_platform_url`, `cost_per_participant`, `budget`, `subsidized_by` — all optional, `null` when not set

---

### Updated `TrainingEnrollment` object

```json
{
  "id": "te_000001",
  "training_id": "tn_000001",
  "training_group_id": "tg_000001",
  "training_group": {
    "id": "tg_000001",
    "name": "January 2026 Edition"
  },
  "employee_id": "ou_000001",
  "employee": {
    "id": "ou_000001",
    "first_name": "Maria",
    "last_name": "García",
    "photo_url": "https://..."
  },
  "status": "completed",
  "enrolled_at": "2026-01-10T09:00:00Z",
  "completion_date": "2026-01-15",
  "expires_at": "2027-01-15",
  "attendance_confirmed": true,
  "attendance_confirmed_at": "2026-01-15T17:00:00Z",
  "score": 92.0,
  "certificate_url": "https://...",
  "notes": null
}
```

- `training_group_id` — prefixed string or `null`
- `training_group` — `{ id, name }` or `null`
- `expires_at` — `YYYY-MM-DD` or `null`; computed as `completion_date + validity_months` on the parent training
- `attendance_confirmed_at` — ISO 8601 or `null`

---

### `TrainingInsights` object

```json
{
  "total_trainings": 12,
  "total_enrollments": 148,
  "completion_rate": 0.73,
  "total_hours_delivered": 320.5,
  "mandatory_completion_rate": 0.91,
  "optional_completion_rate": 0.54,
  "total_cost": 18500.00,
  "enrollments_by_status": {
    "enrolled": 18,
    "in_progress": 22,
    "completed": 108,
    "failed": 6,
    "withdrew": 14
  },
  "top_categories": [
    { "category_id": "tc_000001", "category_name": "Safety", "count": 45 },
    { "category_id": "tc_000002", "category_name": "Compliance", "count": 38 }
  ]
}
```

- All numeric fields are always present; use `0` or `0.0` when no data — never `null`
- `completion_rate`, `mandatory_completion_rate`, `optional_completion_rate` — floats in range `[0.0, 1.0]`

---

## Endpoints

### Endpoint 1 — List Training Categories

```
GET /orgs/{org_id}/training-categories
```

**Who can call it:** Any org member

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `query` | string | No | Search on `name` |

**Business rules:**
- Returns all non-deleted categories for the org; no pagination (lists are always small)

**SQL example:**

```sql
SELECT id, org_id, name, description, color, created_at
FROM public."TrainingCategories"
WHERE org_id = $1
  AND deleted_at IS NULL
  AND ($2::text IS NULL OR unaccent(name) ILIKE '%' || unaccent($2) || '%')
ORDER BY name ASC
```

**Response `200 OK`:**

```json
{
  "categories": [
    { "id": "tc_000001", "org_id": "or_000001", "name": "Compliance", "description": null, "color": "#ef4444", "created_at": "2026-01-01T09:00:00Z" }
  ]
}
```

---

### Endpoint 2 — Create Training Category

```
POST /orgs/{org_id}/training-categories
```

**Who can call it:** HR admin or org admin only

**Request body:**

```json
{
  "name": "Onboarding",
  "description": "Training for new hires",
  "color": "#22c55e"
}
```

**Required fields:** `name`  
**Optional fields:** `description`, `color`  
**Never accepted:** `id`, `org_id`, `created_at`, `updated_at`, `deleted_at`

**Validation:**
- `name` must be a non-empty string

**Business rules:**
- `name` must be unique per org (case-insensitive) → `409` with `{ "detail": "A category with this name already exists" }`

**SQL example:**

```sql
-- Check uniqueness
SELECT id FROM public."TrainingCategories"
WHERE org_id = $1 AND lower(name) = lower($2) AND deleted_at IS NULL;

-- Insert
INSERT INTO public."TrainingCategories" (org_id, name, description, color)
VALUES ($1, $2, $3, $4)
RETURNING id
```

**Response `200 OK`:**

```json
{
  "category": { "id": "tc_000003", "org_id": "or_000001", "name": "Onboarding", "description": "Training for new hires", "color": "#22c55e", "created_at": "2026-04-08T10:00:00Z" }
}
```

---

### Endpoint 3 — Update Training Category

```
PATCH /orgs/{org_id}/training-categories/{category_id}
```

**Who can call it:** HR admin or org admin only

**Request body:** Any subset of `name`, `description`, `color`

**Validation:**
- If `name` provided: must be non-empty
- If `name` changed: must remain unique per org → `409`

**Business rules:**
- `category_id` must belong to `org_id` → `404` if not found

**SQL example:**

```sql
UPDATE public."TrainingCategories"
SET
    name        = COALESCE($3, name),
    description = COALESCE($4, description),
    color       = COALESCE($5, color),
    updated_at  = NOW()
WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL
RETURNING id, org_id, name, description, color, created_at, updated_at
```

**Response `200 OK`:**

```json
{
  "category": { ...updated TrainingCategory object... }
}
```

---

### Endpoint 4 — Delete Training Category

```
DELETE /orgs/{org_id}/training-categories/{category_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**
- Soft-delete only — does NOT delete associated trainings; those trainings have `category_id` set to `null` by the service after soft-deleting the category
- `category_id` must belong to `org_id` → `404` if not found

**SQL example:**

```sql
-- Soft-delete the category
UPDATE public."TrainingCategories"
SET deleted_at = NOW()
WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL;

-- Nullify references on trainings
UPDATE public."Trainings"
SET category_id = NULL, updated_at = NOW()
WHERE category_id = $1 AND deleted_at IS NULL;
```

**Response `204 No Content`**

---

### Endpoint 5 — List Training Groups

```
GET /orgs/{org_id}/trainings/{training_id}/groups
```

**Who can call it:** Any org member

**Business rules:**
- Verify `training_id` belongs to `org_id` → `404` if not
- Returns groups with `enrolled_count` (COUNT JOIN) and inline `reminders` array

**SQL example:**

```sql
-- Groups with enrolled_count
SELECT
    g.id, g.training_id, g.name, g.code, g.description,
    g.start_date, g.end_date, g.location, g.max_participants,
    g.created_at, g.updated_at,
    COUNT(e.id) FILTER (WHERE e.deleted_at IS NULL) AS enrolled_count
FROM public."TrainingGroups" g
LEFT JOIN public."TrainingEnrollments" e ON e.training_group_id = g.id
WHERE g.training_id = $1 AND g.deleted_at IS NULL
GROUP BY g.id
ORDER BY g.id ASC;

-- Reminders for all returned groups (pass group_ids array)
SELECT id, training_group_id, days_before, message, sent_at
FROM public."TrainingGroupReminders"
WHERE training_group_id = ANY($1) AND deleted_at IS NULL
ORDER BY days_before ASC;
```

**Response `200 OK`:**

```json
{
  "groups": [
    {
      "id": "tg_000001",
      "training_id": "tn_000001",
      "name": "January 2026 Edition",
      "code": "FS-2026-JAN",
      "description": null,
      "start_date": "2026-01-15",
      "end_date": "2026-01-15",
      "location": null,
      "max_participants": 15,
      "enrolled_count": 8,
      "reminders": [
        { "id": "tgr_000001", "training_group_id": "tg_000001", "days_before": 7, "message": null, "sent_at": null }
      ],
      "created_at": "2026-01-01T09:00:00Z",
      "updated_at": "2026-01-01T09:00:00Z"
    }
  ]
}
```

---

### Endpoint 6 — Create Training Group

```
POST /orgs/{org_id}/trainings/{training_id}/groups
```

**Who can call it:** HR admin or org admin only

**Request body:**

```json
{
  "name": "February 2026 Edition",
  "code": "FS-2026-FEB",
  "description": null,
  "start_date": "2026-02-10",
  "end_date": "2026-02-10",
  "location": "Barcelona Office",
  "max_participants": 12,
  "reminders": [
    { "days_before": 14, "message": null },
    { "days_before": 3, "message": null }
  ]
}
```

**Required fields:** `name`  
**Optional fields:** `code`, `description`, `start_date`, `end_date`, `location`, `max_participants`, `reminders`  
**Never accepted:** `id`, `training_id`, `created_at`, `updated_at`, `deleted_at`

**Validation:**
- `name` must be non-empty
- `end_date >= start_date` if both provided → `400` with `{ "detail": "end_date must be on or after start_date" }`
- Each reminder's `days_before` must be a positive integer

**Business rules:**
- Verify `training_id` belongs to `org_id` → `404` if not
- INSERT group, then INSERT all provided reminders in the same transaction

**SQL example:**

```sql
-- Insert group
INSERT INTO public."TrainingGroups"
    (training_id, name, code, description, start_date, end_date, location, max_participants)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;

-- Insert reminders (for each reminder in the request)
INSERT INTO public."TrainingGroupReminders" (training_group_id, days_before, message)
VALUES ($1, $2, $3);
```

**Response `200 OK`:**

```json
{
  "group": { ...full TrainingGroup object with enrolled_count: 0 and reminders array... }
}
```

---

### Endpoint 7 — Update Training Group

```
PATCH /orgs/{org_id}/trainings/{training_id}/groups/{group_id}
```

**Who can call it:** HR admin or org admin only

**Request body:** Any subset of `name`, `code`, `description`, `start_date`, `end_date`, `location`, `max_participants`, `reminders`

**Validation:**
- `end_date >= start_date` if both present after merge → `400`
- If `reminders` is provided: each `days_before` must be a positive integer

**Business rules:**
- `group_id` must belong to `training_id` which must belong to `org_id` → `404` if not found at any level
- If `reminders` array is provided: **replace all reminders** for this group atomically (soft-delete all existing, insert new ones)

**SQL example:**

```sql
-- Update group fields
UPDATE public."TrainingGroups"
SET
    name             = COALESCE($3, name),
    code             = COALESCE($4, code),
    description      = COALESCE($5, description),
    start_date       = COALESCE($6, start_date),
    end_date         = COALESCE($7, end_date),
    location         = COALESCE($8, location),
    max_participants = COALESCE($9, max_participants),
    updated_at       = NOW()
WHERE id = $1 AND training_id = $2 AND deleted_at IS NULL;

-- If reminders provided: soft-delete existing
UPDATE public."TrainingGroupReminders"
SET deleted_at = NOW()
WHERE training_group_id = $1 AND deleted_at IS NULL;

-- Then insert new reminders
INSERT INTO public."TrainingGroupReminders" (training_group_id, days_before, message)
VALUES ($1, $2, $3);
```

**Response `200 OK`:**

```json
{
  "group": { ...updated TrainingGroup object... }
}
```

---

### Endpoint 8 — Delete Training Group

```
DELETE /orgs/{org_id}/trainings/{training_id}/groups/{group_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**
- `group_id` must belong to `training_id` under `org_id` → `404` if not found
- Soft-delete the group and its reminders in the same transaction
- Enrollments referencing this group have their `training_group_id` set to `null` (not deleted)

**SQL example:**

```sql
-- Soft-delete reminders
UPDATE public."TrainingGroupReminders"
SET deleted_at = NOW()
WHERE training_group_id = $1 AND deleted_at IS NULL;

-- Nullify enrollment references
UPDATE public."TrainingEnrollments"
SET training_group_id = NULL, updated_at = NOW()
WHERE training_group_id = $1 AND deleted_at IS NULL;

-- Soft-delete the group
UPDATE public."TrainingGroups"
SET deleted_at = NOW()
WHERE id = $1 AND training_id = $2 AND deleted_at IS NULL;
```

**Response `204 No Content`**

---

### Endpoint 9 — Confirm Enrollment Attendance

```
POST /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}/attendance
```

**Who can call it:** HR admin, org admin, or the enrolled employee themselves

**Request body:**

```json
{
  "confirmed": true
}
```

**Required fields:** `confirmed` (boolean)

**Business rules:**
- `enrollment_id` must belong to `training_id` under `org_id` → `404` if not found
- If caller is an employee (not HR/admin), verify `enrollment.employee_id` matches `auth_user.org_user_id` → `403` otherwise
- Idempotent: calling again when already confirmed is a no-op (returns the current state)

**SQL example:**

```sql
UPDATE public."TrainingEnrollments"
SET
    attendance_confirmed    = $2,
    attendance_confirmed_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END,
    updated_at              = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *
```

**Response `200 OK`:**

```json
{
  "enrollment": { ...full updated TrainingEnrollment object... }
}
```

---

### Endpoint 10 — List Training Materials

```
GET /orgs/{org_id}/trainings/{training_id}/materials
```

**Who can call it:** Any org member (all employees can see materials for trainings they are enrolled in; HR admin and org admin can see all)

**Business rules:**
- Verify `training_id` belongs to `org_id` → `404` if not
- For non-admin callers, verify the caller is enrolled in this training → `403` with `{ "detail": "Access denied" }` if not enrolled

**SQL example:**

```sql
SELECT id, training_id, org_user_id, name, file_url, file_type, file_size, created_at
FROM public."TrainingMaterials"
WHERE training_id = $1 AND deleted_at IS NULL
ORDER BY id ASC
```

**Response `200 OK`:**

```json
{
  "materials": [
    {
      "id": "tm_000001",
      "training_id": "tn_000001",
      "org_user_id": "ou_000001",
      "name": "Safety Handbook 2026",
      "file_url": "https://storage.example.com/safety-handbook.pdf",
      "file_type": "application/pdf",
      "file_size": 2048576,
      "created_at": "2026-01-01T12:00:00Z"
    }
  ]
}
```

---

### Endpoint 11 — Upload Training Material

```
POST /orgs/{org_id}/trainings/{training_id}/materials
```

**Who can call it:** HR admin or org admin only

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Display name for the file |
| `file` | binary | Yes | File content |

**Validation:**
- `name` must be non-empty
- File size must not exceed 300 MB → `413` with `{ "detail": "File too large. Maximum allowed size is 300 MB." }`
- Accepted MIME types: `application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → `400` with `{ "detail": "Unsupported file type" }` for anything else

**Business rules:**
- Verify `training_id` belongs to `org_id` → `404` if not
- Upload the file to object storage; persist the returned URL in `file_url`
- Store `file_type` (MIME) and `file_size` (bytes) from the uploaded file metadata

**SQL example:**

```sql
INSERT INTO public."TrainingMaterials"
    (training_id, org_user_id, name, file_url, file_type, file_size)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id
```

**Response `200 OK`:**

```json
{
  "material": { ...full TrainingMaterial object... }
}
```

---

### Endpoint 12 — Delete Training Material

```
DELETE /orgs/{org_id}/trainings/{training_id}/materials/{material_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**
- `material_id` must belong to `training_id` under `org_id` → `404` if not found
- Delete the file from object storage **before** soft-deleting the DB row; if storage deletion fails, abort and return `500`

**SQL example:**

```sql
-- Fetch the file_url first, then after storage deletion:
UPDATE public."TrainingMaterials"
SET deleted_at = NOW()
WHERE id = $1 AND training_id = $2 AND deleted_at IS NULL
```

**Response `204 No Content`**

---

### Endpoint 13 — Export Training Report

```
GET /orgs/{org_id}/trainings/export
```

**Who can call it:** HR admin or org admin only

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `format` | `csv` \| `xlsx` | No | Output format. Default: `csv` |
| `training_id` | string | No | Filter by a specific training |
| `category_id` | string | No | Filter by category |
| `employee_id` | string | No | Filter by employee |
| `status` | string | No | Filter by enrollment status |
| `from_date` | `YYYY-MM-DD` | No | Enrollment date range start |
| `to_date` | `YYYY-MM-DD` | No | Enrollment date range end |

**Validation:**
- `format` must be `csv` or `xlsx` if provided
- `from_date` and `to_date` must be valid dates; `to_date >= from_date` if both provided

**Business rules:**
- All filter IDs (`training_id`, `category_id`, `employee_id`) must belong to `org_id` — silently ignored if they don't match (return empty result)

**SQL example:**

```sql
SELECT
    ou.first_name || ' ' || ou.last_name AS employee_name,
    ou.email                              AS employee_email,
    t.title                               AS training_title,
    tc.name                               AS category,
    tg.name                               AS group_name,
    e.status,
    e.enrolled_at,
    e.completion_date,
    e.score,
    e.attendance_confirmed,
    t.cost_per_participant,
    t.duration_hours,
    e.certificate_url,
    e.expires_at,
    t.is_mandatory
FROM public."TrainingEnrollments" e
JOIN public."Trainings" t ON t.id = e.training_id
JOIN public."OrgUsers" ou ON ou.id = e.employee_id
LEFT JOIN public."TrainingCategories" tc ON tc.id = t.category_id
LEFT JOIN public."TrainingGroups" tg ON tg.id = e.training_group_id
WHERE t.org_id = $1
  AND e.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND ($2::bigint IS NULL OR e.training_id = $2)
  AND ($3::bigint IS NULL OR t.category_id = $3)
  AND ($4::bigint IS NULL OR e.employee_id = $4)
  AND ($5::text IS NULL OR e.status = $5)
  AND ($6::date IS NULL OR e.enrolled_at::date >= $6)
  AND ($7::date IS NULL OR e.enrolled_at::date <= $7)
ORDER BY e.enrolled_at DESC
```

**Response:** File download  
**Headers:** `Content-Disposition: attachment; filename="training-report.csv"` (or `.xlsx`)  
**Content-Type:** `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Report columns:**  
`Employee Name | Employee Email | Training Title | Category | Group | Status | Enrolled At | Completion Date | Score | Attendance Confirmed | Cost per Participant | Hours | Certificate URL | Expires At | Mandatory`

---

### Endpoint 14 — Training Insights

```
GET /orgs/{org_id}/trainings/insights
```

**Who can call it:** HR admin or org admin only

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `from_date` | `YYYY-MM-DD` | No | Stats window start (filters `enrolled_at`) |
| `to_date` | `YYYY-MM-DD` | No | Stats window end |

**Business rules:**
- All computed rates are floats in `[0.0, 1.0]`; use `0.0` when denominator is zero (never `null`)
- `total_cost` = `SUM(cost_per_participant)` for completed enrollments within the window
- `top_categories` = top 5 categories by enrollment count, descending

**SQL example:**

```sql
WITH enrollments AS (
    SELECT e.id, e.status, e.training_id, e.enrolled_at
    FROM public."TrainingEnrollments" e
    JOIN public."Trainings" t ON t.id = e.training_id
    WHERE t.org_id = $1
      AND e.deleted_at IS NULL AND t.deleted_at IS NULL
      AND ($2::date IS NULL OR e.enrolled_at::date >= $2)
      AND ($3::date IS NULL OR e.enrolled_at::date <= $3)
),
stats AS (
    SELECT
        COUNT(DISTINCT e.training_id)             AS total_trainings,
        COUNT(e.id)                               AS total_enrollments,
        COUNT(e.id) FILTER (WHERE e.status = 'completed')::float
            / NULLIF(COUNT(e.id), 0)              AS completion_rate,
        COALESCE(SUM(t.duration_hours), 0)        AS total_hours_delivered,
        COALESCE(SUM(
            CASE WHEN e.status = 'completed' THEN t.cost_per_participant ELSE 0 END
        ), 0)                                     AS total_cost,
        COUNT(e.id) FILTER (WHERE t.is_mandatory AND e.status = 'completed')::float
            / NULLIF(COUNT(e.id) FILTER (WHERE t.is_mandatory), 0)
                                                  AS mandatory_completion_rate,
        COUNT(e.id) FILTER (WHERE NOT t.is_mandatory AND e.status = 'completed')::float
            / NULLIF(COUNT(e.id) FILTER (WHERE NOT t.is_mandatory), 0)
                                                  AS optional_completion_rate
    FROM enrollments e
    JOIN public."Trainings" t ON t.id = e.training_id
)
SELECT * FROM stats;

-- Enrollments by status
SELECT status, COUNT(*) AS count
FROM enrollments
GROUP BY status;

-- Top categories
SELECT tc.id AS category_id, tc.name AS category_name, COUNT(e.id) AS count
FROM enrollments e
JOIN public."Trainings" t ON t.id = e.training_id
LEFT JOIN public."TrainingCategories" tc ON tc.id = t.category_id
WHERE tc.id IS NOT NULL
GROUP BY tc.id, tc.name
ORDER BY count DESC
LIMIT 5;
```

**Response `200 OK`:**

```json
{
  "insights": {
    "total_trainings": 12,
    "total_enrollments": 148,
    "completion_rate": 0.73,
    "total_hours_delivered": 320.5,
    "mandatory_completion_rate": 0.91,
    "optional_completion_rate": 0.54,
    "total_cost": 18500.00,
    "enrollments_by_status": {
      "enrolled": 18,
      "in_progress": 22,
      "completed": 108,
      "failed": 6,
      "withdrew": 14
    },
    "top_categories": [
      { "category_id": "tc_000001", "category_name": "Safety", "count": 45 }
    ]
  }
}
```

---

### Endpoint 15 — Updated: Create Training (v2 fields)

The existing `POST /orgs/{org_id}/trainings` endpoint now accepts these additional fields:

**New optional fields in request body:**

```json
{
  "category_id": "tc_000001",
  "validity_months": 12,
  "learning_platform_url": "https://lms.example.com/course",
  "cost_per_participant": 150.00,
  "budget": 3000.00,
  "is_subsidized": false,
  "subsidized_by": null
}
```

**Validation:**
- `category_id` if provided must exist and belong to `org_id` → `400`
- `validity_months` must be a positive integer if provided
- `learning_platform_url` must be a valid URL if provided
- `cost_per_participant` and `budget` must be non-negative numbers if provided

---

### Endpoint 16 — Updated: Create Enrollment (v2 fields)

The existing `POST /orgs/{org_id}/trainings/{training_id}/enrollments` endpoint now accepts:

**New optional field:**

```json
{
  "employee_id": "ou_000001",
  "training_group_id": "tg_000001",
  "status": "enrolled"
}
```

**Validation:**
- If `training_group_id` provided, it must belong to `training_id` → `400`

**Business rules:**
- If the group has `max_participants` set and `enrolled_count >= max_participants` → `409` with `{ "detail": "This session is full" }`
- When `status` is set to `completed` and the training has `validity_months` set: compute and store `expires_at = completion_date + validity_months months`

**SQL for expiry computation:**

```sql
UPDATE public."TrainingEnrollments"
SET expires_at = (
    SELECT (e.completion_date + (t.validity_months * INTERVAL '1 month'))::date
    FROM public."TrainingEnrollments" e
    JOIN public."Trainings" t ON t.id = e.training_id
    WHERE e.id = $1
      AND e.completion_date IS NOT NULL
      AND t.validity_months IS NOT NULL
)
WHERE id = $1
```

---

## Error Responses

| Status | When | Body |
|--------|------|------|
| `400 Bad Request` | Validation / business rule failure | `{ "detail": "description" }` |
| `403 Forbidden` | Employee trying to confirm another employee's attendance | `{ "detail": "Access denied" }` |
| `404 Not Found` | Resource not found or not belonging to the org | `{ "detail": "Resource not found" }` |
| `409 Conflict` | Duplicate category name; session full | `{ "detail": "description" }` |
| `413 Payload Too Large` | File upload exceeds 300 MB | `{ "detail": "File too large. Maximum allowed size is 300 MB." }` |
| `422 Unprocessable` | Pydantic validation failure | FastAPI default format |

---

## Implementation File Mapping

| Component | File Path |
|-----------|-----------|
| Database schema | `db/create_trainings_v2.sql` |
| Migration script | `db/migrate_training_categories.sql` |
| TrainingCategory model | `python/monolith/models/training_category.py` |
| TrainingGroup model | `python/monolith/models/training_group.py` |
| TrainingGroupReminder model | `python/monolith/models/training_group_reminder.py` |
| TrainingMaterial model | `python/monolith/models/training_material.py` |
| Request/Response schemas | `python/monolith/schemas/orgs/trainings/__init__.py` |
| Categories schemas | `python/monolith/schemas/orgs/trainings/categories.py` |
| Groups schemas | `python/monolith/schemas/orgs/trainings/groups.py` |
| Materials schemas | `python/monolith/schemas/orgs/trainings/materials.py` |
| Insights schemas | `python/monolith/schemas/orgs/trainings/insights.py` |
| Service — categories | `python/monolith/services/orgs/rrhh/training_categories.py` |
| Service — groups | `python/monolith/services/orgs/rrhh/training_groups.py` |
| Service — materials | `python/monolith/services/orgs/rrhh/training_materials.py` |
| Service — insights | `python/monolith/services/orgs/rrhh/training_insights.py` |
| Router (parent) | `python/monolith/routers/orgs/trainings/__init__.py` |
| Router — categories | `python/monolith/routers/orgs/trainings/categories.py` |
| Router — groups | `python/monolith/routers/orgs/trainings/groups.py` |
| Router — materials | `python/monolith/routers/orgs/trainings/materials.py` |
| Router — insights/export | `python/monolith/routers/orgs/trainings/reporting.py` |
| Tests — categories | `python/tests/services/test_training_categories.py` |
| Tests — groups | `python/tests/services/test_training_groups.py` |
| Tests — materials | `python/tests/services/test_training_materials.py` |
| Tests — insights | `python/tests/services/test_training_insights.py` |

---

## Implementation Checklist

- [ ] Database: run `db/create_trainings_v2.sql` — creates `TrainingCategories`, `TrainingGroups`, `TrainingGroupReminders`, `TrainingMaterials`
- [ ] Database: run `db/migrate_training_categories.sql` — backfills `category_id` from enum values, drops old `category` column
- [ ] Database: apply `ALTER TABLE` migrations on `Trainings` and `TrainingEnrollments`
- [ ] Model: `python/monolith/models/training_category.py` with `tc_` ID formatter
- [ ] Model: `python/monolith/models/training_group.py` with `tg_` ID formatter
- [ ] Model: `python/monolith/models/training_group_reminder.py` with `tgr_` ID formatter
- [ ] Model: `python/monolith/models/training_material.py` with `tm_` ID formatter
- [ ] Schemas: request/response Pydantic models for categories, groups, materials, insights
- [ ] Service: `training_categories.py` — list, create, update, delete (with unique-name check)
- [ ] Service: `training_groups.py` — list (with enrolled_count + reminders), create, update (reminder replace), delete (cascade soft-delete + nullify enrollments)
- [ ] Service: `training_materials.py` — list, upload (object storage integration), delete (storage + DB)
- [ ] Service: `training_insights.py` — aggregate stats query
- [ ] Service: update existing enrollment service to handle `training_group_id`, `expires_at` computation
- [ ] Service: update existing training service to accept new v2 fields
- [ ] Router: categories, groups, materials, reporting (export + insights)
- [ ] Router integration: include new sub-routers in `python/monolith/routers/orgs/__init__.py`
- [ ] Tests: service-level tests for each new service module
