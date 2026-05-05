# Chat Widgets — Backend Reference

Widgets are interactive elements rendered inline inside Charles chat messages. The agent generates a special markdown link and the frontend automatically fetches and renders the corresponding widget.

---

## How it works

1. The agent outputs a standard markdown link using the `charles-widget://` scheme anywhere in its response text:
   ```
   [Link label](charles-widget://<widget-name>?param=value)
   ```
2. The frontend intercepts that link and calls:
   ```
   GET /orgs/{org_id}/charles/widgets/<widget-name>?param=value
   ```
3. The backend returns a `WidgetResponse` JSON object.
4. The frontend picks the correct renderer based on `type` and displays the widget inline.

---

## API Endpoint

```
GET /orgs/{org_id}/charles/widgets/{widget_name}
```

**Auth:** Bearer token (standard org auth).

**Query params:** Any key/value pairs the agent appended to the URL — pass them through to your data source as needed.

**Response shape (all widgets share this envelope):**

```json
{
  "type": "<widget_type>",
  "title": "<optional display title>",
  "data": { ... }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Selects which renderer to use. See types below. |
| `title` | string | no | Shown as a small header above the widget. Falls back to the link label. |
| `data` | object | yes | Widget-specific payload. Schema depends on `type`. |

---

## Widget Types

### `button`

A single clickable button. When clicked, sends `message` as a new chat message.

```json
{
  "type": "button",
  "title": "Quick action",
  "data": {
    "label": "Create task",
    "message": "Create a new task for client Acme Corp",
    "icon": "solar:add-circle-linear",
    "variant": "default"
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Button text |
| `message` | string | yes | Chat message sent when button is clicked |
| `icon` | string | no | Iconify icon name |
| `variant` | `"default"` \| `"outline"` \| `"secondary"` \| `"destructive"` \| `"ghost"` | no | Visual style. Defaults to `"outline"` |

---

### `button_list`

A group of buttons, each triggering a different chat message.

```json
{
  "type": "button_list",
  "title": "What would you like to do?",
  "data": {
    "layout": "column",
    "buttons": [
      {
        "label": "Mark as complete",
        "message": "Mark work order WO-001 as complete",
        "icon": "solar:check-circle-linear",
        "variant": "outline"
      },
      {
        "label": "Reassign",
        "message": "Reassign work order WO-001",
        "icon": "solar:user-linear",
        "description": "Change the assigned technician"
      }
    ]
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `buttons` | Button[] | yes | Array of button objects (same fields as `button.data` plus optional `description`) |
| `layout` | `"row"` \| `"column"` | no | Arranges buttons horizontally or vertically. Defaults to `"row"` |

**Button object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Button text |
| `message` | string | yes | Chat message sent on click |
| `icon` | string | no | Iconify icon name |
| `variant` | string | no | Same variants as `button` |
| `description` | string | no | Shown as muted secondary text inside the button |

---

### `action_suggestion`

Card-style actions with colour coding, intended for proactive suggestions the agent detects from context (e.g. "you should probably create a follow-up task").

```json
{
  "type": "action_suggestion",
  "title": "Suggested next steps",
  "data": {
    "actions": [
      {
        "label": "Schedule follow-up call",
        "description": "No call has been logged for this client in 14 days",
        "message": "Schedule a follow-up call with client Acme Corp for tomorrow",
        "icon": "solar:calendar-linear",
        "color": "blue"
      },
      {
        "label": "Close overdue work order",
        "description": "WO-042 has been open for 30 days",
        "message": "Close work order WO-042",
        "icon": "solar:close-circle-linear",
        "color": "red"
      }
    ]
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actions` | Action[] | yes | List of action items |

**Action object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Action title |
| `message` | string | yes | Chat message sent on click |
| `description` | string | no | Supporting text shown below the label |
| `icon` | string | no | Iconify icon. Defaults to `solar:magic-stick-3-linear` |
| `color` | `"blue"` \| `"green"` \| `"orange"` \| `"red"` \| `"purple"` | no | Colour theme for the card. Neutral/default if omitted |

---

### `suggested_responses`

Pill-shaped quick-reply chips. Clicking one sends the message immediately, shortcutting the user from having to type.

```json
{
  "type": "suggested_responses",
  "data": {
    "responses": [
      { "label": "Yes, proceed" },
      { "label": "No, cancel" },
      { "label": "Show me the details first", "message": "Show me the full details before proceeding" }
    ]
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `responses` | Response[] | yes | Array of response chips |

**Response object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Chip display text |
| `message` | string | no | Chat message sent on click. If omitted, sends `label` verbatim |

---

### `form`

A dynamic mini-form rendered inline. On submit, field values are interpolated into a `messageTemplate` and sent as a chat message.

```json
{
  "type": "form",
  "title": "Create task",
  "data": {
    "submitLabel": "Create",
    "messageTemplate": "Create a task titled \"{title}\" for client {client}, priority {priority}. Notes: {notes}",
    "fields": [
      {
        "name": "title",
        "label": "Task title",
        "type": "text",
        "placeholder": "e.g. Replace water pump",
        "required": true
      },
      {
        "name": "client",
        "label": "Client",
        "type": "select",
        "required": true,
        "options": [
          { "label": "Acme Corp", "value": "Acme Corp" },
          { "label": "Globex", "value": "Globex" }
        ]
      },
      {
        "name": "priority",
        "label": "Priority",
        "type": "select",
        "defaultValue": "medium",
        "options": [
          { "label": "Low", "value": "low" },
          { "label": "Medium", "value": "medium" },
          { "label": "High", "value": "high" }
        ]
      },
      {
        "name": "notes",
        "label": "Additional notes",
        "type": "textarea",
        "placeholder": "Optional context..."
      }
    ]
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fields` | Field[] | yes | Form field definitions (rendered in order) |
| `messageTemplate` | string | yes | Template for the chat message on submit. Use `{field_name}` placeholders — they are replaced with the submitted values |
| `submitLabel` | string | no | Submit button text. Defaults to `"Submit"` |

**Field object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Field identifier (used as key in `messageTemplate`) |
| `label` | string | yes | Visible label |
| `type` | `"text"` \| `"number"` \| `"email"` \| `"date"` \| `"textarea"` \| `"select"` | yes | Input type |
| `placeholder` | string | no | Placeholder text |
| `required` | boolean | no | Shows a red asterisk and blocks submit if empty |
| `defaultValue` | string | no | Pre-filled value |
| `options` | `{ label: string, value: string }[]` | only for `select` | Dropdown options |

---

### `chart`

A data visualisation using Recharts. Supports 7 chart types.

```json
{
  "type": "chart",
  "title": "Work orders this week",
  "data": {
    "chartType": "bar",
    "xKey": "day",
    "grid": true,
    "legend": true,
    "data": [
      { "day": "Mon", "open": 4, "closed": 6 },
      { "day": "Tue", "open": 7, "closed": 3 },
      { "day": "Wed", "open": 2, "closed": 9 },
      { "day": "Thu", "open": 5, "closed": 5 },
      { "day": "Fri", "open": 8, "closed": 4 }
    ],
    "series": [
      { "key": "open",   "label": "Open",   "color": "#f59e0b" },
      { "key": "closed", "label": "Closed", "color": "#22c55e" }
    ]
  }
}
```

**`data` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chartType` | string | yes | One of the supported chart types (see below) |
| `data` | object[] | yes | Array of data points. Each object is one point/row |
| `series` | SeriesConfig[] | yes | Defines which data keys to plot and how |
| `xKey` | string | no | Key in each data object used as the X-axis / category label. Defaults to `"name"` |
| `grid` | boolean | no | Show grid lines. Defaults to `true` |
| `legend` | boolean | no | Show legend. Defaults to `false` |

**SeriesConfig object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | yes | The data key to plot (must match a key in `data` objects) |
| `label` | string | no | Display name in tooltip/legend. Defaults to `key` |
| `color` | string | no | Hex color. If omitted, cycles through the default palette |
| `type` | `"line"` \| `"bar"` \| `"area"` | only for `composed` | Series render type within a composed chart |
| `stackId` | string | no | Bars/areas sharing the same `stackId` are stacked |

**Supported `chartType` values:**

| Value | Description |
|-------|-------------|
| `line` | Line chart — best for trends over time |
| `area` | Area chart — like line but with filled area; supports stacking via `stackId` |
| `bar` | Bar chart — comparisons across categories; supports stacking |
| `pie` | Donut/pie chart — uses only the first series `key` as the value; `xKey` is the slice label |
| `radar` | Radar/spider chart — multivariate comparison |
| `scatter` | Scatter plot — each data point plotted on X/Y |
| `composed` | Mix of line, bar, and area series in one chart — use `series[].type` to set each |

**Default colour palette** (used when `color` is not set, cycles in order):

`#8b5cf6` `#06b6d4` `#22c55e` `#f59e0b` `#ef4444` `#ec4899` `#3b82f6` `#a3e635`

---

## How the agent should generate widget links

The agent should produce a normal markdown link. The link label becomes the widget title fallback if `title` is not returned by the API.

```
[Open Work Orders](charles-widget://work-orders?status=open&limit=10)

[This week's revenue](charles-widget://revenue-chart?period=week)

[Create a task](charles-widget://create-task-form)
```

The `widget_name` path segment maps directly to the endpoint:
```
charles-widget://work-orders  →  GET /orgs/{org_id}/charles/widgets/work-orders
```

All query parameters from the link are forwarded to the endpoint verbatim.

---

## Error handling

If the endpoint returns a non-2xx status or the `laiaFetch` wrapper returns `{ error: "..." }`, the widget renders an inline error message. The user can retry by clicking the refresh icon in the widget header.

To signal an application-level error (e.g. no data found), return a standard error status code — do **not** return a `200` with an empty `data` object, as that will render an empty widget silently.
