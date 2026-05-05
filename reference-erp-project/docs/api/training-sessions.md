# Training Sessions — Backend Implementation Guide

This document describes the backend API for the **Training Sessions** feature. It covers database schema, JSON response shapes, every endpoint, business rules, and error handling.

This is an **incremental upgrade** on top of the existing Trainings v2 feature. A training is now composed of **sessions** — ordered units of content (rich text, materials) that employees work through. Each session can be marked as required or optional to complete the training. Per-enrollment session completion is tracked individually.

**What this adds:**

- **Training sessions** — `TrainingSessions` table, ordered content blocks within a training
- **Session materials** — `TrainingSessionMaterials` file attachments per session
- **Per-enrollment session completion tracking** — `EnrollmentSessionCompletions` junction table
- `**sessions_count`** on the `Training` response — computed count of active sessions

---

## Database Schema

### New Table: `TrainingSessions`

Ordered content units within a training. Each session has optional rich text content (stored as HTML from TipTap editor), a date, duration, location, and a flag indicating whether completion is required.

```sql
CREATE TABLE public."TrainingSessions" (
    id                bigserial NOT NULL PRIMARY KEY,
    training_id       bigint NOT NULL REFERENCES public."Trainings"(id),
    title             text NOT NULL,
    description       text,
    content           text,
    "order"           integer NOT NULL DEFAULT 1,
    is_required       boolean NOT NULL DEFAULT TRUE,
    date              date,
    duration_minutes  integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    location          text,
    created_at        timestamptz NOT NULL DEFAULT NOW(),
    updated_at        timestamptz NOT NULL DEFAULT NOW(),
    deleted_at        timestamptz
);

CREATE TRIGGER "TR_TrainingSessions_set_updated_at"
    BEFORE UPDATE ON public."TrainingSessions"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX "IX_TrainingSessions_training_id" ON public."TrainingSessions"(training_id);
CREATE INDEX "IX_TrainingSessions_title_trgm" ON public."TrainingSessions" USING GIN (title gin_trgm_ops);
```

- `content` — HTML string produced by TipTap rich text editor; `NULL` when no content has been written
- `"order"` — quoted because `order` is a reserved word in PostgreSQL; determines display sequence
- `is_required` — when `TRUE`, enrolled employees must complete this session to finish the training

---

### New Table: `TrainingSessionMaterials`

File attachments for a specific session. Same pattern as `TrainingMaterials` but scoped to a session.

```sql
CREATE TABLE public."TrainingSessionMaterials" (
    id              bigserial NOT NULL PRIMARY KEY,
    session_id      bigint NOT NULL REFERENCES public."TrainingSessions"(id),
    org_user_id     bigint REFERENCES public."OrgUsers"(id) ON DELETE SET NULL,
    name            text NOT NULL,
    file_url        text NOT NULL,
    file_type       text,
    file_size       bigint,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    deleted_at      timestamptz
);

CREATE INDEX "IX_TrainingSessionMaterials_session_id" ON public."TrainingSessionMaterials"(session_id);
```

---

### New Table: `EnrollmentSessionCompletions`

Tracks which sessions each enrolled employee has completed. One row per (enrollment, session) pair.

```sql
CREATE TABLE public."EnrollmentSessionCompletions" (
    id              bigserial NOT NULL PRIMARY KEY,
    enrollment_id   bigint NOT NULL REFERENCES public."TrainingEnrollments"(id),
    session_id      bigint NOT NULL REFERENCES public."TrainingSessions"(id),
    completed       boolean NOT NULL DEFAULT FALSE,
    completed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW(),
    deleted_at      timestamptz
);

CREATE TRIGGER "TR_EnrollmentSessionCompletions_set_updated_at"
    BEFORE UPDATE ON public."EnrollmentSessionCompletions"
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE UNIQUE INDEX "IX_EnrollmentSessionCompletions_enrollment_session_unique"
    ON public."EnrollmentSessionCompletions"(enrollment_id, session_id)
    WHERE deleted_at IS NULL;

CREATE INDEX "IX_EnrollmentSessionCompletions_enrollment_id"
    ON public."EnrollmentSessionCompletions"(enrollment_id);

CREATE INDEX "IX_EnrollmentSessionCompletions_session_id"
    ON public."EnrollmentSessionCompletions"(session_id);
```

- Unique constraint ensures only one completion record per (enrollment, session) pair
- `completed_at` is set when `completed = TRUE`, cleared to `NULL` when toggled back to `FALSE`

---

### Updated Table: `Trainings` — computed field

No schema change. The `sessions_count` field is computed via `COUNT` JOIN in queries, not stored as a column.

---

### Updated Table: `TrainingEnrollments` — response enrichment

No schema change. The `session_completions` array is built from a JOIN on `EnrollmentSessionCompletions` and `TrainingSessions` when fetching enrollments.

---

## ID Format


| Entity                      | Prefix | Example      |
| --------------------------- | ------ | ------------ |
| TrainingSession             | `ts_`  | `ts_000001`  |
| TrainingSessionMaterial     | `tsm_` | `tsm_000001` |
| EnrollmentSessionCompletion | `esc_` | `esc_000001` |


Existing prefixes unchanged: `tn_` (Training), `te_` (TrainingEnrollment), `tc_` (TrainingCategory), `tm_` (TrainingMaterial).

---

## JSON Response Shapes

### `TrainingSession` object

```json
{
  "id": "ts_000001",
  "training_id": "tn_000001",
  "title": "Introduction to Fire Safety",
  "description": "Overview of fire hazards and prevention techniques.",
  "content": "<h2>Fire Safety Basics</h2><p>This session covers...</p>",
  "order": 1,
  "is_required": true,
  "date": "2026-05-12",
  "duration_minutes": 60,
  "location": "Conference Room A",
  "materials": [
    {
      "id": "tsm_000001",
      "session_id": "ts_000001",
      "name": "Fire Safety Handbook.pdf",
      "file_url": "https://storage.example.com/materials/fire-safety-handbook.pdf",
      "file_type": "application/pdf",
      "file_size": 2048576,
      "uploaded_by": "ou_000001",
      "created_at": "2026-05-01T10:00:00Z"
    }
  ],
  "created_at": "2026-04-01T09:30:00Z",
  "updated_at": "2026-04-01T09:30:00Z"
}
```

- `content` — HTML string or `null`; may contain headings, paragraphs, lists, links, images, code blocks (TipTap StarterKit + extensions)
- `description` — plain text summary, `null` when not set
- `date` — `YYYY-MM-DD` or `null`
- `duration_minutes` — positive integer or `null`
- `location` — free text or `null`
- `materials` — always included in list/get responses; empty array `[]` when none
- `order` — 1-based integer; sessions are returned sorted by `order ASC`

---

### `TrainingSessionMaterial` object

```json
{
  "id": "tsm_000001",
  "session_id": "ts_000001",
  "name": "Fire Safety Handbook.pdf",
  "file_url": "https://storage.example.com/materials/fire-safety-handbook.pdf",
  "file_type": "application/pdf",
  "file_size": 2048576,
  "uploaded_by": "ou_000001",
  "created_at": "2026-05-01T10:00:00Z"
}
```

- `file_type` — MIME type or `null`
- `file_size` — bytes or `null`
- `uploaded_by` — `ou_` prefixed ID of the uploader, or `null` if deleted

---

### `EnrollmentSessionCompletion` object

Returned inline within `TrainingEnrollment.session_completions`:

```json
{
  "session_id": "ts_000001",
  "session_title": "Introduction to Fire Safety",
  "completed": true,
  "completed_at": "2026-05-12T17:00:00Z"
}
```

- `session_title` — denormalized from `TrainingSessions.title` for display convenience
- `completed_at` — ISO 8601 or `null` when `completed = false`

---

### Updated `Training` object

Adds `sessions_count` to the existing response shape:

```json
{
  "id": "tn_000001",
  "...": "...existing fields...",
  "sessions_count": 5,
  "enrolled_count": 7
}
```

- `sessions_count` — computed via `COUNT` on `TrainingSessions WHERE deleted_at IS NULL`; always `0` not `null`

---

### Updated `TrainingEnrollment` object

Adds `session_completions` array:

```json
{
  "id": "te_000001",
  "...": "...existing fields...",
  "session_completions": [
    {
      "session_id": "ts_000001",
      "session_title": "Introduction to Fire Safety",
      "completed": true,
      "completed_at": "2026-05-12T17:00:00Z"
    },
    {
      "session_id": "ts_000002",
      "session_title": "Evacuation Procedures",
      "completed": false,
      "completed_at": null
    }
  ]
}
```

- `session_completions` — always present; empty array `[]` when the training has no sessions or no completions have been recorded
- Includes **all** sessions for the training (not just completed ones), so the frontend can show `done/total`

---

## Endpoints

### Endpoint 1 — List Training Sessions

```
GET /orgs/{org_id}/trainings/{training_id}/sessions
```

**Who can call it:** Any org member

**Business rules:**

- Verify `training_id` belongs to `org_id` and is not soft-deleted → `404` if not
- Returns all non-deleted sessions with inline materials, ordered by `order ASC`

**SQL example:**

```sql
-- Sessions
SELECT
    s.id, s.training_id, s.title, s.description, s.content,
    s."order", s.is_required, s.date, s.duration_minutes, s.location,
    s.created_at, s.updated_at
FROM public."TrainingSessions" s
JOIN public."Trainings" t ON t.id = s.training_id
WHERE s.training_id = $1
  AND t.org_id = $2
  AND s.deleted_at IS NULL
  AND t.deleted_at IS NULL
ORDER BY s."order" ASC;

-- Materials for all returned sessions (pass session_ids array)
SELECT id, session_id, org_user_id, name, file_url, file_type, file_size, created_at
FROM public."TrainingSessionMaterials"
WHERE session_id = ANY($1) AND deleted_at IS NULL
ORDER BY id ASC;
```

**Response `200 OK`:**

```json
{
  "sessions": [
    {
      "id": "ts_000001",
      "training_id": "tn_000001",
      "title": "Introduction to Fire Safety",
      "description": null,
      "content": "<p>Session content...</p>",
      "order": 1,
      "is_required": true,
      "date": "2026-05-12",
      "duration_minutes": 60,
      "location": null,
      "materials": [],
      "created_at": "2026-04-01T09:30:00Z",
      "updated_at": "2026-04-01T09:30:00Z"
    }
  ]
}
```

---

### Endpoint 2 — Get Training Session

```
GET /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}
```

**Who can call it:** Any org member

**Business rules:**

- Verify `session_id` belongs to `training_id` which belongs to `org_id` → `404` at any level
- Returns full session object with inline materials

**SQL example:**

```sql
SELECT
    s.id, s.training_id, s.title, s.description, s.content,
    s."order", s.is_required, s.date, s.duration_minutes, s.location,
    s.created_at, s.updated_at
FROM public."TrainingSessions" s
JOIN public."Trainings" t ON t.id = s.training_id
WHERE s.id = $1
  AND s.training_id = $2
  AND t.org_id = $3
  AND s.deleted_at IS NULL
  AND t.deleted_at IS NULL;

-- Materials for this session
SELECT id, session_id, org_user_id, name, file_url, file_type, file_size, created_at
FROM public."TrainingSessionMaterials"
WHERE session_id = $1 AND deleted_at IS NULL
ORDER BY id ASC;
```

**Response `200 OK`:**

```json
{
  "session": { "...full TrainingSession object..." }
}
```

---

### Endpoint 3 — Create Training Session

```
POST /orgs/{org_id}/trainings/{training_id}/sessions
```

**Who can call it:** HR admin or org admin only

**Request body:**

```json
{
  "title": "Evacuation Procedures",
  "description": "How to evacuate the building safely.",
  "content": "<h2>Evacuation</h2><p>In case of fire...</p>",
  "order": 2,
  "is_required": true,
  "date": "2026-05-13",
  "duration_minutes": 45,
  "location": "Main Hall"
}
```

**Required fields:** `title`, `order`
**Optional fields:** `description`, `content`, `is_required` (defaults `true`), `date`, `duration_minutes`, `location`
**Never accepted:** `id`, `training_id`, `created_at`, `updated_at`, `deleted_at`, `materials`

**Validation:**

- `title` must be a non-empty string
- `order` must be a positive integer (>= 1)
- `duration_minutes` must be a positive integer if provided
- `date` must be a valid date string (`YYYY-MM-DD`) if provided

**Business rules:**

- Verify `training_id` belongs to `org_id` → `404` if not

**SQL example:**

```sql
INSERT INTO public."TrainingSessions"
    (training_id, title, description, content, "order", is_required, date, duration_minutes, location)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id
```

**Response `200 OK`:**

```json
{
  "session": { "...full TrainingSession object with materials: []..." }
}
```

---

### Endpoint 4 — Update Training Session

```
PATCH /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}
```

**Who can call it:** HR admin or org admin only

**Request body:** Any subset of `title`, `description`, `content`, `order`, `is_required`, `date`, `duration_minutes`, `location`

**Validation:**

- If `title` provided: must be non-empty
- If `order` provided: must be a positive integer
- If `duration_minutes` provided: must be a positive integer

**Business rules:**

- `session_id` must belong to `training_id` which must belong to `org_id` → `404` if not found at any level

**SQL example:**

```sql
UPDATE public."TrainingSessions"
SET
    title            = COALESCE($4, title),
    description      = COALESCE($5, description),
    content          = COALESCE($6, content),
    "order"          = COALESCE($7, "order"),
    is_required      = COALESCE($8, is_required),
    date             = COALESCE($9, date),
    duration_minutes = COALESCE($10, duration_minutes),
    location         = COALESCE($11, location),
    updated_at       = NOW()
WHERE id = $1 AND training_id = $2 AND deleted_at IS NULL
  AND EXISTS (
      SELECT 1 FROM public."Trainings"
      WHERE id = $2 AND org_id = $3 AND deleted_at IS NULL
  )
RETURNING *
```

**Response `200 OK`:**

```json
{
  "session": { "...updated TrainingSession object with materials..." }
}
```

---

### Endpoint 5 — Delete Training Session

```
DELETE /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**

- `session_id` must belong to `training_id` under `org_id` → `404` if not found
- Soft-delete the session and its materials in the same transaction
- Soft-delete related `EnrollmentSessionCompletions` rows in the same transaction

**SQL example:**

```sql
-- Soft-delete session materials
UPDATE public."TrainingSessionMaterials"
SET deleted_at = NOW()
WHERE session_id = $1 AND deleted_at IS NULL;

-- Soft-delete enrollment completions for this session
UPDATE public."EnrollmentSessionCompletions"
SET deleted_at = NOW()
WHERE session_id = $1 AND deleted_at IS NULL;

-- Soft-delete the session
UPDATE public."TrainingSessions"
SET deleted_at = NOW()
WHERE id = $1 AND training_id = $2 AND deleted_at IS NULL
  AND EXISTS (
      SELECT 1 FROM public."Trainings"
      WHERE id = $2 AND org_id = $3 AND deleted_at IS NULL
  );
```

**Response `204 No Content`**

---

### Endpoint 6 — Upload Session Material

```
POST /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials
```

**Who can call it:** HR admin or org admin only

**Request:** `multipart/form-data`


| Field  | Type   | Required | Description               |
| ------ | ------ | -------- | ------------------------- |
| `name` | string | Yes      | Display name for the file |
| `file` | binary | Yes      | File content              |


**Validation:**

- `name` must be non-empty
- File size must not exceed 300 MB → `413` with `{ "detail": "File too large. Maximum allowed size is 300 MB." }`
- Accepted MIME types: `application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain`, `text/csv` → `400` with `{ "detail": "Unsupported file type" }` for anything else

**Business rules:**

- Verify `session_id` belongs to `training_id` which belongs to `org_id` → `404` at any level
- Upload the file to object storage; persist the returned URL in `file_url`
- Store `file_type` (MIME) and `file_size` (bytes) from the uploaded file metadata
- `org_user_id` is set from `auth_user.org_user_id`

**SQL example:**

```sql
INSERT INTO public."TrainingSessionMaterials"
    (session_id, org_user_id, name, file_url, file_type, file_size)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id
```

**Response `200 OK`:**

```json
{
  "material": { "...full TrainingSessionMaterial object..." }
}
```

---

### Endpoint 7 — Delete Session Material

```
DELETE /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials/{material_id}
```

**Who can call it:** HR admin or org admin only

**Business rules:**

- `material_id` must belong to `session_id` which belongs to `training_id` under `org_id` → `404` at any level
- Delete the file from object storage **before** soft-deleting the DB row; if storage deletion fails, abort and return `500`

**SQL example:**

```sql
-- Fetch file_url first for storage deletion, then:
UPDATE public."TrainingSessionMaterials"
SET deleted_at = NOW()
WHERE id = $1 AND session_id = $2 AND deleted_at IS NULL
  AND EXISTS (
      SELECT 1 FROM public."TrainingSessions" s
      JOIN public."Trainings" t ON t.id = s.training_id
      WHERE s.id = $2 AND t.org_id = $3 AND s.deleted_at IS NULL AND t.deleted_at IS NULL
  )
```

**Response `204 No Content`**

---

### Endpoint 8 — Toggle Enrollment Session Completion

```
POST /orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}/sessions/{session_id}/completion
```

**Who can call it:** HR admin, org admin, or the enrolled employee themselves

**Request body:**

```json
{
  "completed": true
}
```

**Required fields:** `completed` (boolean)

**Validation:**

- `completed` must be a boolean

**Business rules:**

- `enrollment_id` must belong to `training_id` under `org_id` → `404` if not found
- `session_id` must belong to `training_id` → `404` if not found
- If caller is an employee (not HR/admin), verify `enrollment.employee_id` matches `auth_user.org_user_id` → `403` otherwise
- **Upsert:** if no `EnrollmentSessionCompletions` row exists for this (enrollment, session) pair, INSERT one; otherwise UPDATE
- When `completed = true`: set `completed_at = NOW()`
- When `completed = false`: set `completed_at = NULL`

**SQL example:**

```sql
INSERT INTO public."EnrollmentSessionCompletions"
    (enrollment_id, session_id, completed, completed_at)
VALUES ($1, $2, $3, CASE WHEN $3 = true THEN NOW() ELSE NULL END)
ON CONFLICT (enrollment_id, session_id) WHERE deleted_at IS NULL
DO UPDATE SET
    completed    = EXCLUDED.completed,
    completed_at = EXCLUDED.completed_at,
    updated_at   = NOW()
RETURNING *
```

**Response `200 OK`:**

```json
{
  "completion": {
    "session_id": "ts_000001",
    "session_title": "Introduction to Fire Safety",
    "completed": true,
    "completed_at": "2026-05-12T17:00:00Z"
  }
}
```

---

### Updated: List/Get Training — add `sessions_count`

The existing `GET /orgs/{org_id}/trainings` (list) and `GET /orgs/{org_id}/trainings/{training_id}` (get) endpoints must now include `sessions_count` in the response.

**SQL change for list query:**

```sql
SELECT
    t.*,
    COUNT(e.id) FILTER (WHERE e.deleted_at IS NULL) AS enrolled_count,
    COUNT(s.id) FILTER (WHERE s.deleted_at IS NULL) AS sessions_count
FROM public."Trainings" t
LEFT JOIN public."TrainingEnrollments" e ON e.training_id = t.id
LEFT JOIN public."TrainingSessions" s ON s.training_id = t.id
WHERE t.org_id = $1 AND t.deleted_at IS NULL
GROUP BY t.id
ORDER BY t.id DESC
```

---

### Updated: List/Get Training Enrollments — add `session_completions`

The existing enrollment list and get endpoints must now include `session_completions` in each enrollment object.

**Additional query after fetching enrollments (pass enrollment_ids array):**

```sql
SELECT
    esc.enrollment_id,
    esc.session_id,
    s.title AS session_title,
    esc.completed,
    esc.completed_at
FROM public."EnrollmentSessionCompletions" esc
JOIN public."TrainingSessions" s ON s.id = esc.session_id
WHERE esc.enrollment_id = ANY($1)
  AND esc.deleted_at IS NULL
  AND s.deleted_at IS NULL
ORDER BY s."order" ASC;
```

If an enrollment has no completion records for any of the training's sessions, include those sessions with `completed: false, completed_at: null` in the response. This can be done either:

- **Option A (recommended):** LEFT JOIN all training sessions and COALESCE completion status
- **Option B:** Let the frontend treat missing sessions as incomplete (simpler but less explicit)

**Recommended Option A query:**

```sql
SELECT
    s.id AS session_id,
    s.title AS session_title,
    COALESCE(esc.completed, false) AS completed,
    esc.completed_at
FROM public."TrainingSessions" s
LEFT JOIN public."EnrollmentSessionCompletions" esc
    ON esc.session_id = s.id
    AND esc.enrollment_id = $1
    AND esc.deleted_at IS NULL
WHERE s.training_id = $2
  AND s.deleted_at IS NULL
ORDER BY s."order" ASC;
```

---

## Error Responses


| Status                  | When                                                    | Body                                                              |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| `400 Bad Request`       | Validation / business rule failure                      | `{ "detail": "description" }`                                     |
| `403 Forbidden`         | Employee trying to toggle another employee's completion | `{ "detail": "Access denied" }`                                   |
| `404 Not Found`         | Resource not found or not belonging to the org/training | `{ "detail": "Resource not found" }`                              |
| `413 Payload Too Large` | File upload exceeds 300 MB                              | `{ "detail": "File too large. Maximum allowed size is 300 MB." }` |
| `422 Unprocessable`     | Pydantic validation failure                             | FastAPI default format                                            |


---

## Implementation File Mapping


| Component                         | File Path                                                              |
| --------------------------------- | ---------------------------------------------------------------------- |
| Database schema                   | `db/create_training_sessions.sql`                                      |
| TrainingSession model             | `python/monolith/models/training_session.py`                           |
| TrainingSessionMaterial model     | `python/monolith/models/training_session_material.py`                  |
| EnrollmentSessionCompletion model | `python/monolith/models/enrollment_session_completion.py`              |
| Sessions schemas                  | `python/monolith/schemas/orgs/trainings/sessions.py`                   |
| Session materials schemas         | `python/monolith/schemas/orgs/trainings/session_materials.py`          |
| Session completions schemas       | `python/monolith/schemas/orgs/trainings/session_completions.py`        |
| Service — sessions                | `python/monolith/services/orgs/rrhh/training_sessions.py`              |
| Service — session materials       | `python/monolith/services/orgs/rrhh/training_session_materials.py`     |
| Service — session completions     | `python/monolith/services/orgs/rrhh/enrollment_session_completions.py` |
| Router — sessions                 | `python/monolith/routers/orgs/trainings/sessions.py`                   |
| Router — session materials        | `python/monolith/routers/orgs/trainings/session_materials.py`          |
| Router — session completions      | `python/monolith/routers/orgs/trainings/session_completions.py`        |
| Tests — sessions                  | `python/tests/services/test_training_sessions.py`                      |
| Tests — session materials         | `python/tests/services/test_training_session_materials.py`             |
| Tests — session completions       | `python/tests/services/test_enrollment_session_completions.py`         |


---

## Implementation Checklist

- Database: run `db/create_training_sessions.sql` — creates `TrainingSessions`, `TrainingSessionMaterials`, `EnrollmentSessionCompletions` tables with constraints, indexes, and triggers
- Model: `python/monolith/models/training_session.py` with `ts_` ID formatter
- Model: `python/monolith/models/training_session_material.py` with `tsm_` ID formatter
- Model: `python/monolith/models/enrollment_session_completion.py` with `esc_` ID formatter
- Schemas: request/response Pydantic models for sessions, session materials, and session completions
- Service: `training_sessions.py` — list (with materials), get, create, update, delete (cascade soft-delete materials + completions)
- Service: `training_session_materials.py` — upload (object storage integration), delete (storage + DB)
- Service: `enrollment_session_completions.py` — upsert completion toggle with auth check
- Service: update existing training service to include `sessions_count` in list/get responses
- Service: update existing enrollment service to include `session_completions` array in list/get responses
- Router: sessions CRUD at `/orgs/{org_id}/trainings/{training_id}/sessions`
- Router: session materials at `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials`
- Router: session completion toggle at `/orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}/sessions/{session_id}/completion`
- Router integration: include new sub-routers in `python/monolith/routers/orgs/trainings/__init__.py`
- Tests: service-level tests for each new service module

