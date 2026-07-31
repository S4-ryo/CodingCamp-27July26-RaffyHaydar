# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page personal productivity application
delivered as three files: `index.html`, `css/style.css`, and `js/script.js`.
It runs entirely in the browser with no build step, no dependencies, and no backend.

All feature state — tasks and quick links — is persisted to `localStorage`.
The clock, greeting, and timer are purely in-memory runtime concerns.

The architecture is deliberately flat: one HTML skeleton, one CSS file for all
visual rules, and one JavaScript file that owns all application logic divided
into clearly named, single-responsibility modules (plain JS objects/functions).

---

## Architecture

### High-Level Structure

```
index.html          — Static HTML skeleton; no inline scripts or styles
css/style.css       — All visual rules; no style attributes in HTML
js/script.js        — All application logic; no inline scripts in HTML
```

### Runtime Model

The page loads once. After `DOMContentLoaded` fires, `script.js` bootstraps
every module in sequence:

1. `ClockModule.init()` — starts the 1-second clock/greeting interval
2. `TimerModule.init()` — wires timer button event listeners
3. `TodoModule.init()` — reads tasks from localStorage, renders list, wires form
4. `LinksModule.init()` — reads links from localStorage, renders panel, wires form

No module communicates with another at runtime. Each owns its own DOM section,
its own localStorage key, and its own event listeners.

### Module Dependency Graph

```
DOMContentLoaded
    ├── ClockModule.init()
    ├── TimerModule.init()
    ├── TodoModule.init()   ←→  StorageService (tasks key)
    └── LinksModule.init()  ←→  StorageService (links key)
```

`StorageService` is a shared utility (not a module with its own DOM section)
that wraps `localStorage.getItem` / `setItem` in try/catch and handles
JSON parse/stringify. All other modules call it; it calls nothing else.

---

## Components and Interfaces

### 1. HTML Page Structure (`index.html`)

The page is divided into five semantic sections inside a `<main>` container:

```
<body>
  <main id="dashboard">
    <section id="clock-section">      — Clock + greeting
    <section id="timer-section">      — Focus timer + controls
    <section id="todo-section">       — Task list + add form
    <section id="links-section">      — Quick links + add form
  </main>
  <div id="toast-container">          — Non-blocking error notifications
  <script src="js/script.js"></script>
</body>
```

Key DOM elements and their IDs:

| Element | ID / selector | Purpose |
|---|---|---|
| Time display | `#clock-time` | Updated every second |
| Date display | `#clock-date` | Updated every second |
| Greeting display | `#clock-greeting` | Updated every second |
| Timer display | `#timer-display` | MM:SS countdown |
| Timer Start btn | `#timer-start` | Starts/resumes countdown |
| Timer Stop btn | `#timer-stop` | Pauses countdown |
| Timer Reset btn | `#timer-reset` | Resets to 25:00 |
| Timer done msg | `#timer-done` | Hidden; shown at 00:00 |
| Todo form | `#todo-form` | Submit adds a task |
| Todo input | `#todo-input` | maxlength="200" |
| Todo error | `#todo-error` | Inline validation message |
| Todo list | `#todo-list` | `<ul>` rendered tasks |
| Links form | `#links-form` | Submit adds a link |
| Links label input | `#link-label` | maxlength="50" |
| Links URL input | `#link-url` | maxlength="2048" |
| Links error | `#links-error` | Inline validation message |
| Links list | `#links-list` | `<ul>` rendered links |
| Toast container | `#toast-container` | Non-blocking notifications |

### 2. ClockModule

Responsibilities: format and render time, date, and greeting; manage the update interval.

Public interface:

```
ClockModule.init()
  — calls ClockModule.tick() immediately
  — sets setInterval(ClockModule.tick, 1000)
  — adds document.addEventListener('visibilitychange', ...) to re-tick on focus

ClockModule.tick()
  — reads new Date()
  — calls ClockModule.formatTime(h, m, s) → "HH:MM:SS"
  — calls ClockModule.formatDate(date) → "Weekday, Month Day, Year"
  — calls ClockModule.getGreeting(hour) → greeting string
  — writes results to DOM

ClockModule.formatTime(h, m, s) → string   [pure, testable]
ClockModule.formatDate(date) → string       [pure, testable]
ClockModule.getGreeting(hour) → string      [pure, testable]
```

`formatTime` zero-pads each component using a shared `pad2(n)` helper.
`getGreeting` uses a simple if/else chain over the hour value (0–23).

### 3. TimerModule

Responsibilities: manage a 25-minute countdown; enforce start/stop/reset state machine.

Timer states: `idle` | `running` | `paused` | `done`

State transition table:

| Current state | Action | Next state | Effect |
|---|---|---|---|
| idle | start | running | Start interval |
| running | start | running | No-op (ignored) |
| running | stop | paused | Clear interval |
| paused | start | running | Restart interval from remaining |
| paused | stop | paused | No-op (ignored) |
| running | reaches 00:00 | done | Clear interval, show done message |
| any | reset | idle | Clear interval, restore 1500s, hide done message |

Public interface:

```
TimerModule.init()
  — reads DOM button IDs, attaches click listeners

TimerModule.start()
TimerModule.stop()
TimerModule.reset()

TimerModule.formatTime(totalSeconds) → "MM:SS"   [pure, testable]
  — MM = Math.floor(totalSeconds / 60), zero-padded
  — SS = totalSeconds % 60, zero-padded
```

Internal state: `{ remaining: 1500, state: 'idle', intervalId: null }`.

### 4. TodoModule

Responsibilities: maintain in-memory task array; handle add/edit/complete/delete;
render task list; persist to `localStorage`; display validation errors.

Public interface:

```
TodoModule.init()
  — loads tasks from StorageService
  — calls TodoModule.renderAll()
  — attaches submit listener to #todo-form

TodoModule.addTask(description)        — validates, creates Task, renders, persists
TodoModule.deleteTask(id)              — removes Task from array, re-renders, persists
TodoModule.toggleTask(id)              — flips task.done, re-renders, persists
TodoModule.beginEdit(id)               — swaps task DOM to edit input mode
TodoModule.confirmEdit(id, newDesc)    — validates, updates task.text, returns to display mode, persists
TodoModule.cancelEdit(id)             — discards changes, returns task to display mode

TodoModule.renderAll()                 — clears #todo-list, renders each task
TodoModule.renderTask(task) → Element  — returns a <li> DOM element [pure-ish, testable]

TodoModule.validateDescription(str) → { valid: boolean, error: string }
  — rejects empty string and strings where str.trim().length === 0
  — rejects strings longer than 200 chars after trim
```

Each task `<li>` element contains:
- A `<span class="task-text">` (or `<input>` in edit mode)
- A `<button class="btn-complete">` (checkbox-style)
- A `<button class="btn-edit">`
- A `<button class="btn-delete">`

Event delegation: a single click listener on `#todo-list` reads
`event.target.dataset.id` and `event.target.dataset.action` to route actions.

### 5. LinksModule

Responsibilities: maintain in-memory links array; handle add/delete; render link list;
persist to `localStorage`; display validation errors; enforce 50-link cap.

Public interface:

```
LinksModule.init()
  — loads links from StorageService
  — calls LinksModule.renderAll()
  — attaches submit listener to #links-form

LinksModule.addLink(label, url)        — validates, creates Link, renders, persists
LinksModule.deleteLink(id)             — removes Link, re-renders, persists

LinksModule.renderAll()                — clears #links-list, renders each link
LinksModule.renderLink(link) → Element — returns a <li> DOM element [pure-ish, testable]

LinksModule.validateLink(label, url) → { valid: boolean, errors: { label?, url? } }
  — label must be non-empty after trim, max 50 chars
  — url must start with "http://" or "https://"
```

Each link `<li>` element contains:
- An `<a href="{url}" target="_blank" rel="noopener">` with the label text
- A `<button class="btn-delete-link">`

Event delegation: a single click listener on `#links-list` reads
`event.target.dataset.id` to route delete actions.

### 6. StorageService

Responsibilities: abstract `localStorage` access with error handling.

```
StorageService.load(key) → any | null
  — JSON.parse(localStorage.getItem(key))
  — returns null on any exception (parse error, security error, etc.)

StorageService.save(key, value) → { ok: boolean, error?: string }
  — localStorage.setItem(key, JSON.stringify(value))
  — returns { ok: false, error: message } on any exception

StorageService.KEYS = { TASKS: 'tdl_tasks', LINKS: 'tdl_links' }
```

Callers (TodoModule, LinksModule) check the return value of `save()`.
On failure they call `ToastService.show(message)` without reverting in-memory state.

### 7. ToastService

Responsibilities: display non-blocking notification toasts.

```
ToastService.show(message, durationMs = 3000)
  — creates a <div class="toast"> in #toast-container
  — removes it after durationMs via setTimeout
```

---

## Data Models

### Task Object

```json
{
  "id": "string (crypto.randomUUID() or Date.now().toString())",
  "text": "string (1–200 chars, trimmed)",
  "done": "boolean"
}
```

localStorage key: `tdl_tasks`
Stored value: JSON array of Task objects, in insertion order.

### Link Object

```json
{
  "id": "string (crypto.randomUUID() or Date.now().toString())",
  "label": "string (1–50 chars, trimmed)",
  "url": "string (starts with http:// or https://, max 2048 chars)"
}
```

localStorage key: `tdl_links`
Stored value: JSON array of Link objects, in insertion order (insertion order = display order).

### Timer State (in-memory only, never persisted)

```js
{
  remaining: 1500,      // seconds remaining (0–1500)
  state: 'idle',        // 'idle' | 'running' | 'paused' | 'done'
  intervalId: null      // return value of setInterval, or null
}
```

### localStorage Schema Summary

| Key | Type | Notes |
|---|---|---|
| `tdl_tasks` | `Task[]` | Missing key → treat as `[]` |
| `tdl_links` | `Link[]` | Missing key → treat as `[]` |

If `StorageService.load()` returns `null` for either key, the module initialises
with an empty array. No migration logic is needed for the initial version.

---

## CSS Layout Architecture (`css/style.css`)

### Layout Strategy

The dashboard uses CSS Grid at the page level and Flexbox within each panel.

```
body
  └── #dashboard  (CSS Grid, 2-column on wide screens, 1-column on narrow)
        ├── #clock-section    (spans full width, top)
        ├── #timer-section    (column 1)
        ├── #todo-section     (column 2, grows to fill height)
        └── #links-section    (column 1, below timer)
```

### Responsive Breakpoints

- `>= 768px` — two-column grid layout
- `< 768px`  — single-column stacked layout (clock → timer → todo → links)

### CSS Class Conventions

| Class | Applied to | Purpose |
|---|---|---|
| `.task-done` | `<li>` | Adds `text-decoration: line-through` |
| `.task-editing` | `<li>` | Swaps display/edit mode visibility |
| `.error-visible` | `#todo-error`, `#links-error` | Shows inline error text |
| `.toast` | `<div>` in `#toast-container` | Non-blocking notification style |
| `.timer-done` | `#timer-section` | Visual style when timer reaches 00:00 |
| `.btn-complete` | `<button>` | Checkbox-style toggle button |
| `.btn-edit` | `<button>` | Edit pencil button |
| `.btn-delete`, `.btn-delete-link` | `<button>` | Destructive delete button |

No class names are set via inline `style` attributes. All visual state changes
are achieved by toggling CSS classes.

---

## Component Interaction

### Add Task Flow

```
User types in #todo-input → clicks Add or presses Enter
  → TodoModule handles 'submit' on #todo-form
    → Validator.validateDescription(input.value)
      → INVALID: show #todo-error, return
      → VALID:
          create Task { id, text: input.value.trim(), done: false }
          push to tasks array
          StorageService.save('tdl_tasks', tasks)
            → FAIL: ToastService.show(error), continue
          TodoModule.renderAll()
          clear #todo-input, hide #todo-error
```

### Edit Task Flow

```
User clicks Edit button on a task <li>
  → TodoModule.beginEdit(id)
      → hide .task-text span, show inline <input> pre-filled with task.text
      → place cursor at end of input
      → show Confirm / Cancel buttons; hide Edit button

User confirms edit (click Confirm or press Enter)
  → TodoModule.confirmEdit(id, inputValue)
      → Validator.validateDescription(inputValue)
        → INVALID: show inline error near input
        → VALID: update task.text, StorageService.save(), TodoModule.renderAll()

User cancels (click Cancel or press Escape)
  → TodoModule.cancelEdit(id)
      → restore original task.text display, return to view mode
```

### Toggle Complete Flow

```
User clicks Complete button on a task
  → Event delegation on #todo-list detects data-action="complete"
    → TodoModule.toggleTask(id)
        → flip task.done
        → StorageService.save('tdl_tasks', tasks)
            → FAIL: ToastService.show(error)
        → TodoModule.renderAll()
```

### Delete Task Flow

```
User clicks Delete button on a task
  → Event delegation on #todo-list detects data-action="delete"
    → TodoModule.deleteTask(id)
        → remove task from array
        → StorageService.save('tdl_tasks', tasks)
            → FAIL: ToastService.show(error)
        → TodoModule.renderAll()
```

### Add Link Flow

```
User fills #link-label and #link-url → clicks Add or presses Enter
  → LinksModule handles 'submit' on #links-form
    → LinksModule.validateLink(label, url)
      → INVALID: show #links-error with specific field message, return
      → check links.length >= 50: show cap error, return
      → VALID:
          create Link { id, label: label.trim(), url }
          push to links array
          StorageService.save('tdl_links', links)
            → FAIL: ToastService.show(error), continue
          LinksModule.renderAll()
          clear both input fields, hide #links-error
```

### Page Load Flow

```
DOMContentLoaded fires in script.js
  → ClockModule.init()
      → ClockModule.tick()   (immediate render)
      → setInterval(tick, 1000)
      → document.addEventListener('visibilitychange', onVisible)
  → TimerModule.init()
      → attach click listeners to #timer-start, #timer-stop, #timer-reset
  → TodoModule.init()
      → StorageService.load('tdl_tasks') → tasks array (or [])
      → TodoModule.renderAll()
      → attach submit listener to #todo-form
      → attach click listener (event delegation) to #todo-list
  → LinksModule.init()
      → StorageService.load('tdl_links') → links array (or [])
      → LinksModule.renderAll()
      → attach submit listener to #links-form
      → attach click listener (event delegation) to #links-list
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Clock time formatting is always zero-padded HH:MM:SS

*For any* combination of hour (0–23), minute (0–59), and second (0–59), `ClockModule.formatTime(h, m, s)` shall return a string matching the pattern `\d{2}:\d{2}:\d{2}` where the numeric values round-trip correctly from the output string.

**Validates: Requirements 1.1**

### Property 2: Clock date formatting includes all required components

*For any* valid `Date` object, `ClockModule.formatDate(date)` shall return a string that contains a weekday name, a month name, a numeric day, and a 4-digit year, all in the correct order.

**Validates: Requirements 1.2**

### Property 3: Greeting mapping is total and correct for every hour

*For any* integer hour in [0, 23], `ClockModule.getGreeting(hour)` shall return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night", and never return "Good Day" (the fallback) unless the input is outside 0–23.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

### Property 4: Timer time formatting produces valid MM:SS for all valid inputs

*For any* integer total seconds in [0, 1500], `TimerModule.formatTime(totalSeconds)` shall return a string matching `\d{2}:\d{2}` where `MM = floor(s/60)` and `SS = s mod 60`, both zero-padded.

**Validates: Requirements 3.6**

### Property 5: Adding a valid task always increases the task list length by exactly one

*For any* task list and any non-empty, non-whitespace-only description of 1–200 characters, calling `TodoModule.addTask(description)` shall result in the task list length increasing by exactly one, and the new task shall appear in the list with the trimmed description.

**Validates: Requirements 4.2**

### Property 6: Task rendering always includes description and all controls

*For any* Task object, `TodoModule.renderTask(task)` shall return a DOM element that contains the task's description text, a complete-toggle control, an edit control, and a delete control.

**Validates: Requirements 4.3**

### Property 7: Whitespace-only task descriptions are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), `TodoModule.validateDescription(str)` shall return `{ valid: false }` and the task list shall remain unchanged.

**Validates: Requirements 4.4, 5.3**

### Property 8: Added tasks are always persisted to localStorage

*For any* valid task description, after `TodoModule.addTask(description)` the value retrieved from `localStorage.getItem('tdl_tasks')` shall contain a task object with the same trimmed description.

**Validates: Requirements 4.5**

### Property 9: Valid task description updates are always persisted

*For any* existing task and any valid replacement description (1–200 non-whitespace chars), after `TodoModule.confirmEdit(id, newDesc)` the localStorage contents shall reflect the updated description.

**Validates: Requirements 5.2, 5.5**

### Property 10: Completion toggle is a round-trip (double-toggle restores original state)

*For any* task, toggling completion twice shall leave the task's `done` field equal to its original value, and the rendered strikethrough class shall match the final `done` value.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Toggle and delete operations always persist the updated list

*For any* task list, after a toggle or delete operation the JSON stored in `localStorage('tdl_tasks')` shall exactly reflect the current in-memory task array.

**Validates: Requirements 6.4, 6.6**

### Property 12: Deleting a task always removes it from state and DOM

*For any* task list with at least one task, after `TodoModule.deleteTask(id)` the resulting task array shall not contain a task with that id, and the rendered list shall not contain a DOM element with that id.

**Validates: Requirements 6.5**

### Property 13: Adding a valid link always increases the links list length by one

*For any* links list (below the 50-item cap) and any valid label/URL pair, `LinksModule.addLink(label, url)` shall increase the links list length by exactly one and the new link shall appear with the correct label and URL.

**Validates: Requirements 7.2**

### Property 14: Link rendering always includes a clickable label and a delete control

*For any* Link object, `LinksModule.renderLink(link)` shall return a DOM element containing an anchor element with `href` equal to the link's URL and `target="_blank"`, and a delete control.

**Validates: Requirements 7.3, 7.4**

### Property 15: Invalid link inputs are always rejected

*For any* combination of inputs where the label is empty/whitespace or the URL does not start with "http://" or "https://", `LinksModule.validateLink(label, url)` shall return `{ valid: false }` and the links list shall remain unchanged.

**Validates: Requirements 7.5**

### Property 16: Added links are persisted and rendered in insertion order

*For any* sequence of valid link additions, the order of links rendered on the page and the order stored in `localStorage('tdl_links')` shall both match the insertion order.

**Validates: Requirements 7.6, 7.7**

### Property 17: Deleting a link always removes it from state and DOM

*For any* links list with at least one link, after `LinksModule.deleteLink(id)` the resulting links array shall not contain that id, the rendered list shall not contain a DOM element for that id, and localStorage shall reflect the updated array.

**Validates: Requirements 8.1, 8.2**

---

## Error Handling

### Validation Errors (inline)

Inline error messages appear in `#todo-error` and `#links-error` elements.
They are shown by adding class `.error-visible` and setting the element's
`textContent`. They are hidden again when the user successfully submits or
modifies the input.

Validation rules enforced client-side before any state mutation:

| Rule | Module | Behaviour |
|---|---|---|
| Empty / whitespace-only description | TodoModule | Block add/edit, show inline error |
| Description > 200 chars | TodoModule | Block add/edit (also enforced by `maxlength` attr) |
| Empty label | LinksModule | Block add, show inline error identifying label field |
| Empty or invalid URL | LinksModule | Block add, show inline error identifying URL field |
| Links list at cap (50) | LinksModule | Block add, show inline error |

### Storage Errors (toast notifications)

`StorageService.save()` catches all exceptions (QuotaExceededError, SecurityError,
etc.) and returns `{ ok: false, error: message }`. The calling module then calls
`ToastService.show(message)` without reverting in-memory state.

This satisfies Requirements 6.7 and 8.3: the UI remains consistent with in-memory
state even when persistence fails.

### Malformed / Missing localStorage Data

`StorageService.load()` catches JSON parse errors and returns `null`.
`TodoModule.init()` and `LinksModule.init()` treat a `null` return as an empty
array — no exception is thrown, no error is shown to the user.

### Timer Edge Cases

- Double-start: the `TimerModule.start()` method checks `state === 'running'`
  and returns early, preventing a duplicate interval.
- Stop while idle/done: checks `state !== 'running'` and returns early.
- Reset from any state: `clearInterval(intervalId)` is safe to call with `null`.

---

## Testing Strategy

This project uses pure HTML/CSS/JS with no build tooling, so tests are written
as plain JavaScript using a minimal assertion helper (or a zero-dependency test
runner loaded directly in the browser via a `<script>` tag in a separate
`test.html` file that is not shipped as part of the project).

### Dual Testing Approach

- **Unit / example tests**: verify specific behaviors with concrete inputs
  (state machine transitions, edge cases, DOM structure checks, error paths)
- **Property tests**: verify universal properties across a wide range of
  auto-generated inputs using a property-based testing library

For the property tests, the recommended library is
**[fast-check](https://fast-check.dev/)** (loaded from a CDN script tag in
`test.html`, pinned to a specific version). Each property test is configured to
run a minimum of 100 iterations.

Each property test must include a comment referencing its design property:
```js
// Feature: todo-life-dashboard, Property 1: Clock time formatting is always zero-padded HH:MM:SS
```

### Unit Test Coverage (example-based)

- `ClockModule.getGreeting`: one example per hour range boundary (0, 5, 12, 18, 21, 23)
- `TimerModule` state machine: one test per state transition in the table above
- `TimerModule.formatTime(1500)` → "25:00", `formatTime(0)` → "00:00", `formatTime(61)` → "01:01"
- `TodoModule.beginEdit` / `cancelEdit`: DOM mode swap and original value restoration
- `StorageService.load` with mocked malformed JSON → returns null, no throw
- `StorageService.save` with mocked QuotaExceededError → returns `{ ok: false }`
- `ToastService.show`: DOM element created, removed after timeout
- Timer completion at 00:00: done message shown, interval cleared
- Links cap at 50: 51st add rejected with error
- Link anchor has `target="_blank"` and correct `href`

### Property Test Coverage

One property-based test per property listed in the Correctness Properties section
(Properties 1–17). Each test uses fast-check arbitraries to generate inputs:

- `fc.integer({ min: 0, max: 23 })` for hour values
- `fc.integer({ min: 0, max: 1500 })` for timer seconds
- `fc.string({ minLength: 1, maxLength: 200 })` filtered to non-whitespace-only
- `fc.string()` filtered to whitespace-only for rejection tests
- `fc.record({ id: fc.uuid(), text: fc.string(), done: fc.boolean() })` for tasks
- `fc.array(taskArb)` for task lists
- `fc.date()` for date formatting tests

### Test File Location

A `test.html` file in the project root (not committed as part of the three
production files) loads `js/script.js`, `fast-check` from CDN, and a
`js/test-runner.js` (also excluded from production). This keeps the production
file set strictly to `index.html`, `css/style.css`, and `js/script.js`.

---

## Implementation Plan

The implementation is broken into six sequential milestones. Each milestone
produces working, testable code.

### Milestone 1 — Scaffold and Clock

Files touched: `index.html`, `css/style.css`, `js/script.js`

1. Create `index.html` with five sections, no inline scripts or styles.
   Link `css/style.css` in `<head>` and `js/script.js` before `</body>`.
2. Add skeleton CSS: CSS Grid layout for `#dashboard`, responsive breakpoint,
   basic color scheme and typography.
3. Implement `StorageService` (load, save, KEYS constant).
4. Implement `ClockModule` (formatTime, formatDate, getGreeting, tick, init).
5. Implement `ToastService` (show).
6. Bootstrap: `document.addEventListener('DOMContentLoaded', ...)` calls
   `ClockModule.init()`.
7. Verify clock ticks and greeting changes at boundary hours.

### Milestone 2 — Focus Timer

Files touched: `js/script.js`, `css/style.css`

1. Implement `TimerModule` (internal state object, formatTime, start, stop,
   reset, init).
2. Add timer CSS: display style, `.timer-done` class, button styles.
3. Call `TimerModule.init()` in the bootstrap.
4. Verify all state transitions manually and via unit tests.

### Milestone 3 — Task Add and Display

Files touched: `js/script.js`, `css/style.css`

1. Implement `TodoModule.validateDescription`.
2. Implement `TodoModule.renderTask` (returns `<li>` with controls using
   `data-id` and `data-action` attributes).
3. Implement `TodoModule.renderAll`.
4. Implement `TodoModule.addTask` (validate → create → persist → render).
5. Implement `TodoModule.init` (load from storage, renderAll, attach listeners).
6. Add task CSS: list styles, error message style, button styles.
7. Verify adding tasks, empty rejection, and localStorage persistence.

### Milestone 4 — Task Edit, Complete, Delete

Files touched: `js/script.js`, `css/style.css`

1. Implement event delegation on `#todo-list` for complete/edit/delete actions.
2. Implement `TodoModule.toggleTask` (flip done, persist, renderAll).
3. Implement `TodoModule.deleteTask` (remove, persist, renderAll).
4. Implement `TodoModule.beginEdit`, `confirmEdit`, `cancelEdit`.
5. Add CSS for `.task-done` (strikethrough) and `.task-editing` (edit mode swap).
6. Verify toggle round-trip, delete removal, edit save/cancel, Escape key.

### Milestone 5 — Quick Links Add and Delete

Files touched: `js/script.js`, `css/style.css`

1. Implement `LinksModule.validateLink`.
2. Implement `LinksModule.renderLink` (returns `<li>` with anchor and delete btn).
3. Implement `LinksModule.renderAll`.
4. Implement `LinksModule.addLink` (validate → cap check → create → persist → render).
5. Implement `LinksModule.deleteLink` (remove → persist → renderAll).
6. Implement `LinksModule.init`.
7. Add links panel CSS.
8. Verify add, validation, cap enforcement, delete, and localStorage persistence.

### Milestone 6 — Polish, Accessibility, and Final Verification

Files touched: `index.html`, `css/style.css`, `js/script.js`

1. Add ARIA labels to icon-only buttons (`aria-label="Complete task"`, etc.).
2. Ensure keyboard navigation works for all interactive elements.
3. Verify `target="_blank"` anchors have `rel="noopener noreferrer"`.
4. Test localStorage unavailable scenario (DevTools → Storage → disable).
5. Test malformed data scenario (manually set corrupt JSON in DevTools).
6. Run all property tests (minimum 100 iterations each).
7. Final review: confirm no inline styles, no inline scripts, no external
   libraries, no network requests, and exactly three production files.
