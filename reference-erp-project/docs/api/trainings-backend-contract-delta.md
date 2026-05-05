# Trainings, Sessions & Materials — Backend contract delta

**Audience:** Backend engineers  
**Spec source:** Public API reference [Scalar](https://fredvic.timbal.ai/docs/scalar#), schema [`openapi.json`](https://fredvic.timbal.ai/openapi.json) (`dev`).  
**LaIA frontend:** Implements editors/list UIs that assume the behaviors below; align the monolith with this document and refresh OpenAPI.

---

## 1. Endpoints today (from OpenAPI)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/orgs/{org_id}/trainings` | List trainings |
| `POST` | `/orgs/{org_id}/trainings` | Create (`CreateTrainingRequest`) |
| `GET` | `/orgs/{org_id}/trainings/{training_id}` | Get training |
| `PATCH` | `/orgs/{org_id}/trainings/{training_id}` | Update (`UpdateTrainingRequest`) |
| `DELETE` | `/orgs/{org_id}/trainings/{training_id}` | Delete training |
| `GET` | `/orgs/{org_id}/trainings/{training_id}/sessions` | List sessions (`ListTrainingSessionsResponse`) |
| `POST` | `/orgs/{org_id}/trainings/{training_id}/sessions` | Create session (`CreateTrainingSessionRequest`) |
| `GET` | `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}` | Get session (`GetTrainingSessionResponse`) |
| `PATCH` | `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}` | Update session (`UpdateTrainingSessionRequest`) |
| `DELETE` | `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}` | Delete session |
| `GET` | `/orgs/{org_id}/trainings/{training_id}/materials` | List training-level materials (`ListTrainingMaterialsResponse`) |
| `POST` | `/orgs/{org_id}/trainings/{training_id}/materials` | Upload training material (multipart) |
| `DELETE` | `/orgs/{org_id}/trainings/{training_id}/materials/{material_id}` | Delete training material |
| `POST` | `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials` | Upload session material (multipart) |
| `DELETE` | `/orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials/{material_id}` | Delete session material |
| `POST` | `/orgs/{org_id}/trainings/{training_id}/enrollments/{enrollment_id}/sessions/{session_id}/completion` | Toggle completion (`ToggleSessionCompletionRequest`) |

---

## 2. Required changes (frontend ↔ API gaps)

### 2.1 Training sessions — `is_visible`

**Today:** `TrainingSession`, `CreateTrainingSessionRequest`, and `UpdateTrainingSessionRequest` in OpenAPI have **no** visibility flag.

**Needed:**

- **DB:** `TrainingSessions.is_visible` (boolean, not null, default `true`), or equivalent.
- **Create/PATCH body:** Optional `is_visible` (boolean); default `true` on create if omitted.
- **Responses:** Every `TrainingSession` JSON must include `is_visible` (boolean).

**Semantics:** When `is_visible` is `false`, HR is hiding the session from learners until ready (product wording on the client: “Visible to learners”).

---

### 2.2 Session materials — `read_required`

**Today:** `TrainingSessionMaterial` has `id`, `name`, `file_url`, `file_type`, `file_size`, `uploaded_by`, `created_at` only. There is **no** `PATCH` on a session material in OpenAPI.

**Needed:**

- **DB:** `TrainingSessionMaterials.read_required` (boolean, not null, default `false`).
- **Schemas:** Add `read_required` (boolean) to `TrainingSessionMaterial` and to upload response bodies.
- **Upload (POST):** Optional multipart field or JSON sidecar `read_required` (default `false`). Simplest: accept optional form field `read_required` as boolean string (`"true"`/`"false"`) alongside `file` + `name`.
- **New endpoint:**  
  `PATCH /orgs/{org_id}/trainings/{training_id}/sessions/{session_id}/materials/{material_id}`  
  - Body (subset): `{ "read_required": boolean }` (extensible later, e.g. `name`).  
  - Response: `{ "material": <TrainingSessionMaterial> }` (200), consistent with upload.
- **Read paths:** `GET` list sessions, `GET` session, and any nested `TrainingSession.materials[]` must return `read_required`.

**Semantics:** If `read_required` is `true`, the learner must open/access that file before the session can be marked complete (enforcement described in §2.4).

---

### 2.3 Training-level materials — optional `read_required` (parity)

The SPA currently **does not** toggle “must read” on **training** materials (only on **session** materials). For a single product rule later, consider the same column + `PATCH` on:

`PATCH /orgs/{org_id}/trainings/{training_id}/materials/{material_id}`  

Not blocking current UI; include if you want one model for all attachments.

---

### 2.4 Session completion — business rules (when `read_required` exists)

**Today:** `POST .../completion` accepts `{ "completed": boolean }` only.

**Needed (product):**

- When setting `completed: true` for a session, if **any** session material has `read_required: true`, require that the enrollment has satisfied “opened/viewed” (or your tracked equivalent) for **each** such material **before** accepting the transition.
- Return **`409 Conflict`** or **`422 Unprocessable Entity`** with a clear `detail` message if requirements are not met.
- Define where “material viewed” is stored (per enrollment + material row, or event log) and document it; OpenAPI should describe the error shape clients will see.

---

## 3. OpenAPI / Scalar updates

After implementation:

1. Regenerate or hand-update `openapi.json` so [Scalar](https://fredvic.timbal.ai/docs/scalar#) shows:
   - `is_visible` on session create/update models and `TrainingSession`.
   - `read_required` on `TrainingSessionMaterial` and upload/PATCH responses.
   - New `PATCH` path for session materials (request/response schemas).
2. Add **`UpdateSessionMaterialRequest`** (or equivalent) schema for the PATCH body.
3. Document new error responses for completion when mandatory reads are incomplete.

---

## 4. Compatibility notes

- **`uploaded_by`:** OpenAPI uses `EmployeeRef`; the web app types sometimes assume a string id. Confirm JSON shape (`{ id, ... }` vs string) matches what the frontend parses, or document the canonical shape.
- **List responses:** `ListTrainingMaterialsResponse` / `ListTrainingSessionsResponse` include `next_page_token`; ensure the web client’s non-paginated usage still receives a full first page or document pagination contract.

---

## 5. Quick verification checklist

- [ ] Create session with `is_visible: false`; `GET` returns it; learners’ views respect it (if applicable server-side).
- [ ] Upload session material; toggle `read_required` via `PATCH`; list/get echo the flag.
- [ ] Attempt `completed: true` without meeting read requirements → expected error.
- [ ] Scalar shows all new fields and the new PATCH route.

---

*Generated for alignment between LaIA frontend training flows and the published API spec. Update this file when the backend ships.*
