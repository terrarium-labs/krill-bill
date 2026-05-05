# Analytics & Reports — Backend Specification

## Overview

This document describes the backend API required to power the **Analytics / Reports** feature in LaIA. The frontend dynamically renders report forms based on the parameter schema returned by the backend, so no frontend code changes are needed when new reports are added — only the backend data needs to be updated.

---

## Architecture Summary

```
Client                        Backend
  |                              |
  | GET /orgs/{id}/reports       |
  |----------------------------->|  Returns all categories + reports + their parameter schemas
  |<-----------------------------|
  |                              |
  | POST /orgs/{id}/reports/{id}/run  (with { parameters: {...} })
  |----------------------------->|  Validates params, generates report, returns download URL or data
  |<-----------------------------|
```

---

## Endpoints

### 1. `GET /orgs/{org_id}/reports`

Returns all available report categories and their reports for the organization, including the **full parameter schema** for each report.

**Auth:** Bearer token (org member required)

**Response `200 OK`:**

```json
{
  "categories": [
    {
      "id": "hr",
      "name": "HR",
      "description": "Human resources reports for employee management",
      "reports": [
        {
          "id": "extra_hours",
          "name": "Extra Hours Report",
          "description": "Shows overtime hours worked per employee in a given period",
          "category": "hr",
          "parameters": [
            {
              "key": "period",
              "type": "date_range",
              "label": "Period",
              "required": true,
              "range_label_from": "From",
              "range_label_to": "To"
            },
            {
              "key": "employee_ids",
              "type": "employee_multi_select",
              "label": "Employees",
              "required": false,
              "placeholder": "All employees (leave empty for all)"
            },
            {
              "key": "include_approved_only",
              "type": "boolean",
              "label": "Approved overtime only",
              "required": false
            }
          ]
        },
        {
          "id": "sick_leaves",
          "name": "Sick Leaves Report",
          "description": "Summary of sick leave absences by employee and date range",
          "category": "hr",
          "parameters": [
            {
              "key": "period",
              "type": "date_range",
              "label": "Period",
              "required": true,
              "range_label_from": "From",
              "range_label_to": "To"
            },
            {
              "key": "employee_ids",
              "type": "employee_multi_select",
              "label": "Employees",
              "required": false,
              "placeholder": "All employees"
            },
            {
              "key": "status",
              "type": "select",
              "label": "Status",
              "required": false,
              "options": [
                { "value": "pending", "label": "Pending" },
                { "value": "approved", "label": "Approved" },
                { "value": "rejected", "label": "Rejected" }
              ]
            }
          ]
        },
        {
          "id": "absences_summary",
          "name": "Absences Summary",
          "description": "Aggregated summary of all absence types per employee",
          "category": "hr",
          "parameters": [
            {
              "key": "year",
              "type": "select",
              "label": "Year",
              "required": true,
              "options": [
                { "value": "2024", "label": "2024" },
                { "value": "2025", "label": "2025" },
                { "value": "2026", "label": "2026" }
              ]
            },
            {
              "key": "employee_ids",
              "type": "employee_multi_select",
              "label": "Employees",
              "required": false
            }
          ]
        },
        {
          "id": "payroll_summary",
          "name": "Payroll Summary",
          "description": "Payroll totals by employee for a specific month or period",
          "category": "hr",
          "parameters": [
            {
              "key": "period",
              "type": "date_range",
              "label": "Period",
              "required": true,
              "range_label_from": "From",
              "range_label_to": "To"
            },
            {
              "key": "employee_ids",
              "type": "employee_multi_select",
              "label": "Employees",
              "required": false
            }
          ]
        },
        {
          "id": "attendance",
          "name": "Attendance Report",
          "description": "Daily attendance, clock-in/out times and anomalies",
          "category": "hr",
          "parameters": [
            {
              "key": "period",
              "type": "date_range",
              "label": "Period",
              "required": true,
              "range_label_from": "From",
              "range_label_to": "To"
            },
            {
              "key": "employee_ids",
              "type": "employee_multi_select",
              "label": "Employees",
              "required": false
            },
            {
              "key": "include_anomalies_only",
              "type": "boolean",
              "label": "Show anomalies only",
              "required": false
            }
          ]
        }
      ]
    }
  ]
}
```

**Notes:**
- Categories are displayed as tabs in the sidebar navigation on the Reports page.
- Reports within a category are displayed as clickable cards.
- The `parameters` array determines which form fields appear when a user clicks "Run Report". The frontend renders them dynamically — no code changes needed for new reports.
- If an org has no reports configured, return `{ "categories": [] }`.

---

### 2. `GET /orgs/{org_id}/reports/{report_id}`

Returns a single report definition. Used if the frontend needs to refresh a specific report's schema without re-fetching all.

**Auth:** Bearer token (org member required)

**Response `200 OK`:**

```json
{
  "report": {
    "id": "extra_hours",
    "name": "Extra Hours Report",
    "description": "...",
    "category": "hr",
    "parameters": [...]
  }
}
```

---

### 3. `POST /orgs/{org_id}/reports/{report_id}/run`

Executes a report with the provided parameters. The backend validates, generates the file (or data), and returns a secure download URL or inline data.

**Auth:** Bearer token (org member required)

**Request body:**

```json
{
  "parameters": {
    "period_from": "2026-01-01T00:00:00.000Z",
    "period_to":   "2026-03-31T23:59:59.999Z",
    "employee_ids": ["emp_abc123", "emp_xyz456"],
    "include_approved_only": true
  }
}
```

**Parameter key conventions:**
- `date_range` parameters: frontend sends `{key}_from` and `{key}_to` as ISO 8601 strings
- `date` parameters: frontend sends the key directly as an ISO 8601 string
- `employee_select` / `employee_multi_select`: array of employee IDs (strings)
- `select`: the selected option value (string)
- `boolean`: `true` or `false`
- `text` / `number`: raw string / numeric value

**Response `200 OK` — file download:**

```json
{
  "download_url": "https://storage.example.com/reports/extra_hours_20260408.xlsx?token=...",
  "file_name": "extra_hours_2026-Q1.xlsx",
  "total_records": 142
}
```

**Response `200 OK` — inline data (alternative):**

```json
{
  "data": [
    { "employee_name": "John Doe", "total_hours": 12.5, "period": "2026-01" },
    ...
  ],
  "total_records": 23
}
```

> The frontend handles both formats. If `download_url` is present, it triggers a browser download. If only `data` is present, the modal closes and the data could be shown inline (future feature). Prefer `download_url` for large reports.

**Response `422 Unprocessable Entity` — validation error:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required parameter: period_from",
    "details": {
      "missing_fields": ["period_from"]
    }
  }
}
```

---

## Parameter Type Reference

| Type | Frontend renders | Value sent to backend |
|---|---|---|
| `date` | Date picker (no time) | ISO 8601 date string `"2026-01-15T00:00:00.000Z"` |
| `date_range` | Two date pickers (From / To) | `{key}_from` and `{key}_to` ISO 8601 strings |
| `text` | Text input | String |
| `number` | Numeric input | String (parse on backend) |
| `select` | Dropdown with predefined options | String (option `value`) |
| `employee_select` | Employee search (single) | Array with one employee ID |
| `employee_multi_select` | Employee search (multi) | Array of employee IDs |
| `boolean` | Toggle switch | Boolean |

---

## Adding New Reports

To add a new report, **no frontend code change is required**. Simply:

1. Add the new report object to the appropriate category in the `GET /orgs/{org_id}/reports` response.
2. Implement the `POST /orgs/{org_id}/reports/{new_report_id}/run` handler.
3. The frontend will automatically render the new report card and its parameter form.

To add a new **category** (e.g. Finance, Operations), add a new entry to the `categories` array. It will automatically appear as a new tab in the sidebar.

---

## Data Model (Suggested DB Schema)

```sql
-- Report definitions (can be org-agnostic or org-specific)
CREATE TABLE report_definitions (
    id          VARCHAR PRIMARY KEY,          -- e.g. "extra_hours"
    category_id VARCHAR NOT NULL,
    name        VARCHAR NOT NULL,
    description TEXT,
    parameters  JSONB NOT NULL DEFAULT '[]',  -- array of ReportParameter objects
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report categories
CREATE TABLE report_categories (
    id          VARCHAR PRIMARY KEY,           -- e.g. "hr"
    name        VARCHAR NOT NULL,
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Report execution log (optional but recommended)
CREATE TABLE report_executions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES orgs(id),
    report_id   VARCHAR NOT NULL REFERENCES report_definitions(id),
    user_id     UUID NOT NULL,
    parameters  JSONB NOT NULL,
    status      VARCHAR NOT NULL DEFAULT 'pending',  -- pending | completed | failed
    file_url    TEXT,
    total_records INTEGER,
    error_message TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## File Generation Recommendations

- **Format:** Excel (`.xlsx`) preferred for HR reports. PDF as optional alternative.
- **Library suggestions:** `openpyxl` (Python), `exceljs` (Node.js), `Apache POI` (Java).
- **File storage:** Upload to S3 / Supabase Storage and return a pre-signed URL with a short TTL (15 min).
- **Async generation:** For reports that may take > 2 seconds, consider an async pattern:
  1. `POST /run` → returns `{ "job_id": "...", "status": "pending" }`
  2. `GET /run/{job_id}` → returns current status and download URL when ready
  - For the current frontend implementation, synchronous responses are assumed. Async can be added as an enhancement.

---

## Priority Implementation Order

For the HR tab (first phase), implement in this order:

| Priority | Report ID | Notes |
|---|---|---|
| 1 | `extra_hours` | Core HR need — requires time_records data |
| 2 | `sick_leaves` | Requires sick_leaves table |
| 3 | `absences_summary` | Aggregates across absence_types |
| 4 | `attendance` | Requires signing_requests / time_records |
| 5 | `payroll_summary` | Requires payrolls table |

---

## Example `GET /reports` Mock Response for Development

Use this mock to unblock frontend development before the backend is ready:

```json
{
  "categories": [
    {
      "id": "hr",
      "name": "HR",
      "description": "Human resources and workforce reports",
      "reports": [
        {
          "id": "extra_hours",
          "name": "Extra Hours",
          "description": "Overtime hours worked by employee for a given period",
          "category": "hr",
          "parameters": [
            { "key": "period", "type": "date_range", "label": "Period", "required": true, "range_label_from": "From", "range_label_to": "To" },
            { "key": "employee_ids", "type": "employee_multi_select", "label": "Employees", "required": false }
          ]
        },
        {
          "id": "sick_leaves",
          "name": "Sick Leaves",
          "description": "Sick leave absences by employee and status",
          "category": "hr",
          "parameters": [
            { "key": "period", "type": "date_range", "label": "Period", "required": true, "range_label_from": "From", "range_label_to": "To" },
            { "key": "employee_ids", "type": "employee_multi_select", "label": "Employees", "required": false },
            { "key": "status", "type": "select", "label": "Status", "required": false, "options": [{ "value": "approved", "label": "Approved" }, { "value": "pending", "label": "Pending" }] }
          ]
        }
      ]
    }
  ]
}
```
