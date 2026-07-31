# Implementation Plan: To-Do List Life Dashboard

## Overview

Implementation follows six sequential milestones. Each milestone targets a working, independently testable slice of the application. All code lives in exactly three files: `index.html`, `css/style.css`, and `js/script.js`. A separate `test.html` + `js/test-runner.js` pair (not part of the production file set) hosts unit and property tests.

---

## Tasks

- [ ] 1. Milestone 1 — Scaffold and Clock
  - [x] 1.1 Create the `index.html` skeleton
    - Write the full HTML document with `<head>` (linking `css/style.css`), `<body>`, `<main id="dashboard">`, and the four `<section>` elements: `#clock-section`, `#timer-section`, `#todo-section`, `#links-section`
    - Add `<div id="toast-container">` and `<script src="js/script.js">` before `</body>`
    - Include all named child elements listed in the DOM ID table (clock-time, clock-date, clock-greeting, timer-display, timer-start, timer-stop, timer-reset, timer-done, todo-form, todo-input, todo-error, todo-list, links-form, link-label, link-url, links-error, links-list)
    - No inline `<style>` blocks, no inline `<script>` blocks, no inline `style` attributes
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 1.2 Add skeleton CSS to `css/style.css`
    - Define CSS Grid layout for `#dashboard` (2-column ≥ 768 px, 1-column < 768 px)
    - Set basic color scheme and typography (body font, background, section borders/padding)
    - Define the responsive breakpoint media query
    - _Requirements: 9.1_

  - [x] 1.3 Implement `StorageService` in `js/script.js`
    - Write `StorageService.KEYS` constant with `TASKS: 'tdl_tasks'` and `LINKS: 'tdl_links'`
    - Write `StorageService.load(key)` — wraps `JSON.parse(localStorage.getItem(key))` in try/catch, returns `null` on any exception
    - Write `StorageService.save(key, value)` — wraps `localStorage.setItem(key, JSON.stringify(value))` in try/catch, returns `{ ok: true }` on success or `{ ok: false, error: message }` on failure
    - _Requirements: 4.7, 6.7, 8.3_

  - [x] 1.4 Implement `ToastService` in `js/script.js`
    - Write `ToastService.show(message, durationMs = 3000)` — creates a `<div class="toast">` inside `#toast-container`, sets its `textContent`, removes it after `durationMs` via `setTimeout`
    - Add `.toast` CSS rule to `css/style.css` (positioned notification style)
    - _Requirements: 6.7, 8.3_

  - [x] 1.5 Implement `ClockModule` in `js/script.js`
    - Write `pad2(n)` helper that zero-pads a number to two digits
    - Write `ClockModule.formatTime(h, m, s)` — returns `"HH:MM:SS"` using `pad2`
    - Write `ClockModule.formatDate(date)` — returns `"Weekday, Month Day, Year"` using `date.toLocaleDateString` with appropriate options
    - Write `ClockModule.getGreeting(hour)` — if/else chain: 5–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–23 and 0–4 → "Good Night", else → "Good Day"
    - Write `ClockModule.tick()` — reads `new Date()`, calls format helpers, writes to `#clock-time`, `#clock-date`, `#clock-greeting`
    - Write `ClockModule.init()` — calls `tick()` immediately, sets `setInterval(tick, 1000)`, attaches `visibilitychange` listener that calls `tick()` when `document.visibilityState === 'visible'`
    - Wire `ClockModule.init()` inside `DOMContentLoaded` listener at the bottom of `js/script.js`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 1.6 Write property tests for ClockModule pure functions
    - Create `test.html` (loads `js/script.js` and fast-check from CDN) and `js/test-runner.js` with a minimal assert helper
    - **Property 1: Clock time formatting is always zero-padded HH:MM:SS** — use `fc.integer({min:0,max:23})`, `fc.integer({min:0,max:59})` × 2; assert result matches `/^\d{2}:\d{2}:\d{2}$/` and values round-trip
    - **Property 2: Clock date formatting includes all required components** — use `fc.date()`; assert result contains weekday name, month name, numeric day, and 4-digit year
    - **Property 3: Greeting mapping is total and correct for every hour** — use `fc.integer({min:0,max:23})`; assert result is one of the four greeting strings and never "Good Day"
    - _Validates: Requirements 1.1, 1.2, 2.1–2.4, 2.6_

  - [ ] 1.7 Checkpoint — Milestone 1 complete
    - Ensure clock ticks and greeting displays correctly; all Milestone 1 property tests pass. Ask the user if questions arise.

---

- [ ] 2. Milestone 2 — Focus Timer
  - [x] 2.1 Implement `TimerModule` in `js/script.js`
    - Declare internal state object `{ remaining: 1500, state: 'idle', intervalId: null }`
    - Write `TimerModule.formatTime(totalSeconds)` — returns `"MM:SS"` where `MM = Math.floor(totalSeconds/60)` and `SS = totalSeconds % 60`, both zero-padded with `pad2`
    - Write `TimerModule.start()` — if `state === 'running'` return early; set `state = 'running'`; create `setInterval` that decrements `remaining`, calls `TimerModule._render()`, and on reaching 0 clears interval, sets `state = 'done'`, shows `#timer-done`, adds `.timer-done` to `#timer-section`
    - Write `TimerModule.stop()` — if `state !== 'running'` return early; `clearInterval(intervalId)`; set `state = 'paused'`
    - Write `TimerModule.reset()` — `clearInterval(intervalId)`; set `remaining = 1500`, `state = 'idle'`; hide `#timer-done`; remove `.timer-done` from `#timer-section`; call `TimerModule._render()`
    - Write `TimerModule._render()` — writes `formatTime(remaining)` to `#timer-display`
    - Write `TimerModule.init()` — calls `_render()` to show initial "25:00", attaches click listeners to `#timer-start`, `#timer-stop`, `#timer-reset`
    - Wire `TimerModule.init()` inside `DOMContentLoaded`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ] 2.2 Add timer CSS to `css/style.css`
    - Style `#timer-display` (large monospace font)
    - Style timer control buttons (`.btn-timer`)
    - Define `.timer-done` class (e.g., highlighted background or colored border to signal session complete)
    - Style `#timer-done` message element (hidden by default, shown when `.timer-done` is active)
    - _Requirements: 3.5, 9.1_

  - [ ]* 2.3 Write property test for `TimerModule.formatTime`
    - **Property 4: Timer time formatting produces valid MM:SS for all valid inputs** — use `fc.integer({min:0,max:1500})`; assert result matches `/^\d{2}:\d{2}$/`, `MM === Math.floor(s/60)`, `SS === s % 60`
    - Also add unit tests for state machine transitions: one test per row in the state transition table (idle→start, running→start no-op, running→stop, paused→start resume, paused→stop no-op, running→00:00→done, any→reset→idle)
    - _Validates: Requirements 3.1–3.9_

  - [ ] 2.4 Checkpoint — Milestone 2 complete
    - Ensure all timer state transitions work and property test passes. Ask the user if questions arise.

---

- [ ] 3. Milestone 3 — Task Add and Display
  - [ ] 3.1 Implement `TodoModule.validateDescription` in `js/script.js`
    - Accept a string; return `{ valid: false, error: "Description cannot be empty." }` if `str.trim().length === 0`
    - Return `{ valid: false, error: "Description must be 200 characters or fewer." }` if `str.trim().length > 200`
    - Return `{ valid: true }` otherwise
    - _Requirements: 4.4, 5.3_

  - [ ] 3.2 Implement `TodoModule.renderTask(task)` in `js/script.js`
    - Build and return a `<li>` element with `data-id` set to `task.id`
    - Include `<span class="task-text">` with `task.text`
    - Include `<button class="btn-complete" data-action="complete" data-id="{task.id}" aria-label="Complete task">`
    - Include `<button class="btn-edit" data-action="edit" data-id="{task.id}" aria-label="Edit task">`
    - Include `<button class="btn-delete" data-action="delete" data-id="{task.id}" aria-label="Delete task">`
    - Apply `.task-done` class to the `<li>` if `task.done === true`
    - _Requirements: 4.3, 6.2, 9.1_

  - [ ] 3.3 Implement `TodoModule.renderAll` in `js/script.js`
    - Clear `#todo-list` inner HTML
    - For each task in the in-memory array, call `renderTask(task)` and append the result to `#todo-list`
    - _Requirements: 4.2, 4.6_

  - [ ] 3.4 Implement `TodoModule.addTask(description)` in `js/script.js`
    - Call `validateDescription(description)`; on failure set `#todo-error` `textContent` and add `.error-visible`, then return
    - On success: create Task object `{ id: crypto.randomUUID(), text: description.trim(), done: false }`; push to in-memory array
    - Call `StorageService.save(KEYS.TASKS, tasks)`; on `ok: false` call `ToastService.show(error)`
    - Call `renderAll()`; clear `#todo-input` value; remove `.error-visible` from `#todo-error`
    - _Requirements: 4.2, 4.4, 4.5_

  - [ ] 3.5 Implement `TodoModule.init()` in `js/script.js`
    - Load tasks via `StorageService.load(KEYS.TASKS)`; if result is `null` or not an array, use `[]`
    - Call `renderAll()`
    - Attach `submit` listener to `#todo-form` that calls `addTask(input.value)` and prevents default
    - Attach click event-delegation listener to `#todo-list` (reads `data-action` and `data-id` to route to `toggleTask`, `beginEdit`, or `deleteTask`)
    - Wire `TodoModule.init()` inside `DOMContentLoaded`
    - _Requirements: 4.6, 4.7_

  - [ ] 3.6 Add task panel CSS to `css/style.css`
    - Style `#todo-list` `<ul>` and `<li>` items (layout, spacing)
    - Style `.btn-complete`, `.btn-edit`, `.btn-delete` buttons
    - Define `.error-visible` to show `#todo-error` (hidden by default)
    - _Requirements: 9.1_

  - [ ]* 3.7 Write property tests for TodoModule add/validate/render
    - **Property 5: Adding a valid task always increases the task list length by exactly one** — use `fc.string({minLength:1,maxLength:200})` filtered to non-whitespace-only; assert array length increments by 1 and last item has the trimmed description
    - **Property 6: Task rendering always includes description and all controls** — use `fc.record({id: fc.uuid(), text: fc.string({minLength:1}), done: fc.boolean()})`; assert returned element contains `.task-text`, `.btn-complete`, `.btn-edit`, `.btn-delete`
    - **Property 7: Whitespace-only descriptions are always rejected** — use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'), {minLength:1})`; assert `validateDescription` returns `{ valid: false }` and array length unchanged after attempted add
    - _Validates: Requirements 4.2, 4.3, 4.4_

  - [ ] 3.8 Checkpoint — Milestone 3 complete
    - Ensure tasks can be added, empty input is rejected with inline error, and localStorage stores tasks correctly. Ask the user if questions arise.

---

- [ ] 4. Milestone 4 — Task Edit, Complete, Delete
  - [ ] 4.1 Implement `TodoModule.toggleTask(id)` in `js/script.js`
    - Find task by `id` in the array; flip `task.done`
    - Call `StorageService.save`; on failure call `ToastService.show`
    - Call `renderAll()`
    - _Requirements: 6.1, 6.4_

  - [ ] 4.2 Implement `TodoModule.deleteTask(id)` in `js/script.js`
    - Filter the task out of the in-memory array
    - Call `StorageService.save`; on failure call `ToastService.show`
    - Call `renderAll()`
    - _Requirements: 6.5, 6.6_

  - [ ] 4.3 Implement `TodoModule.beginEdit(id)` in `js/script.js`
    - Locate the `<li data-id="{id}">` in `#todo-list`
    - Hide `.task-text` span; insert an `<input class="task-edit-input">` pre-filled with `task.text`; place cursor at end
    - Show Confirm and Cancel buttons; hide the Edit button
    - Add `.task-editing` class to the `<li>`
    - _Requirements: 5.1_

  - [ ] 4.4 Implement `TodoModule.confirmEdit(id, newDesc)` in `js/script.js`
    - Call `validateDescription(newDesc)`; on failure show inline error near the edit input, return
    - On success: find task by `id`, update `task.text = newDesc.trim()`
    - Call `StorageService.save`; on failure call `ToastService.show`
    - Call `renderAll()`
    - _Requirements: 5.2, 5.5_

  - [ ] 4.5 Implement `TodoModule.cancelEdit(id)` in `js/script.js`
    - Call `renderAll()` to discard the in-progress DOM state and restore display mode without altering `task.text`
    - Attach Escape key listener inside `beginEdit` (or via event delegation) to call `cancelEdit`
    - _Requirements: 5.4_

  - [ ] 4.6 Add edit/complete/done CSS to `css/style.css`
    - Define `.task-done` with `text-decoration: line-through`
    - Define `.task-editing` rules that hide `.task-text` and the edit button, show the edit input and confirm/cancel buttons
    - _Requirements: 6.2, 6.3, 5.1_

  - [ ]* 4.7 Write property tests for toggle and delete
    - **Property 8: Added tasks are always persisted to localStorage** — use valid description string; after `addTask`, parse `localStorage.getItem('tdl_tasks')` and assert it contains a task with the trimmed description
    - **Property 9: Valid task description updates are always persisted** — use an existing task and a valid new description; after `confirmEdit`, parse localStorage and assert the updated text
    - **Property 10: Completion toggle is a round-trip** — use a Task record; toggle twice via `toggleTask`; assert `done` equals original value and `.task-done` class matches final `done`
    - **Property 11: Toggle and delete operations always persist the updated list** — after each operation, serialize in-memory array to JSON and compare with `localStorage.getItem('tdl_tasks')`
    - **Property 12: Deleting a task always removes it from state and DOM** — use a task list with ≥ 1 task; after `deleteTask(id)`, assert id absent from array and from `#todo-list` DOM
    - _Validates: Requirements 5.2, 5.5, 6.1–6.6_

  - [ ] 4.8 Checkpoint — Milestone 4 complete
    - Ensure toggle, delete, edit save, edit cancel, and Escape key all work; property tests pass. Ask the user if questions arise.

---

- [ ] 5. Milestone 5 — Quick Links Add and Delete
  - [ ] 5.1 Implement `LinksModule.validateLink(label, url)` in `js/script.js`
    - Return `{ valid: false, errors: { label: "Label cannot be empty." } }` if `label.trim().length === 0`
    - Return `{ valid: false, errors: { label: "Label must be 50 characters or fewer." } }` if `label.trim().length > 50`
    - Return `{ valid: false, errors: { url: "URL must start with http:// or https://." } }` if `url` does not start with `"http://"` or `"https://"`
    - Return `{ valid: false, errors: { url: "URL cannot be empty." } }` if `url.trim().length === 0`
    - Return `{ valid: true }` when both fields pass
    - _Requirements: 7.5_

  - [ ] 5.2 Implement `LinksModule.renderLink(link)` in `js/script.js`
    - Build and return a `<li>` with `data-id` set to `link.id`
    - Include `<a href="{link.url}" target="_blank" rel="noopener noreferrer">` with `link.label` as text content
    - Include `<button class="btn-delete-link" data-id="{link.id}" aria-label="Delete link">`
    - _Requirements: 7.3, 7.4, 9.1_

  - [ ] 5.3 Implement `LinksModule.renderAll` in `js/script.js`
    - Clear `#links-list` inner HTML
    - For each link in the in-memory array (in insertion order), call `renderLink(link)` and append to `#links-list`
    - _Requirements: 7.7_

  - [ ] 5.4 Implement `LinksModule.addLink(label, url)` in `js/script.js`
    - Call `validateLink(label, url)`; on failure set `#links-error` `textContent` with the relevant error and add `.error-visible`, return
    - Check `links.length >= 50`; if so show cap error in `#links-error` and return
    - Create Link object `{ id: crypto.randomUUID(), label: label.trim(), url }`; push to array
    - Call `StorageService.save(KEYS.LINKS, links)`; on failure call `ToastService.show`
    - Call `renderAll()`; clear `#link-label` and `#link-url` values; remove `.error-visible` from `#links-error`
    - _Requirements: 7.2, 7.6_

  - [ ] 5.5 Implement `LinksModule.deleteLink(id)` in `js/script.js`
    - Filter the link out of the in-memory array
    - Call `StorageService.save(KEYS.LINKS, links)`; on failure call `ToastService.show`
    - Call `renderAll()`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 5.6 Implement `LinksModule.init()` in `js/script.js`
    - Load links via `StorageService.load(KEYS.LINKS)`; if result is `null` or not an array, use `[]`
    - Call `renderAll()`
    - Attach `submit` listener to `#links-form` that calls `addLink(labelInput.value, urlInput.value)` and prevents default
    - Attach click event-delegation listener to `#links-list` that reads `data-id` and calls `deleteLink(id)`
    - Wire `LinksModule.init()` inside `DOMContentLoaded`
    - _Requirements: 7.7, 8.1_

  - [ ] 5.7 Add links panel CSS to `css/style.css`
    - Style `#links-list` `<ul>` and `<li>` items (layout, spacing)
    - Style link anchors and `.btn-delete-link` button
    - Ensure `.error-visible` applies to `#links-error` as well
    - _Requirements: 9.1_

  - [ ]* 5.8 Write property tests for LinksModule
    - **Property 13: Adding a valid link always increases the links list length by one** — use `fc.record({label: fc.string({minLength:1,maxLength:50}), url: fc.oneof(fc.constant('http://'), fc.constant('https://')).chain(proto => fc.string({minLength:1}).map(s => proto + s))})` filtered to valid; assert array length increments by 1
    - **Property 14: Link rendering always includes a clickable label and a delete control** — use a Link record; assert returned element contains `<a>` with correct `href` and `target="_blank"`, and `.btn-delete-link`
    - **Property 15: Invalid link inputs are always rejected** — use combinations with empty/whitespace label or non-http(s) URL; assert `validateLink` returns `{ valid: false }` and array length unchanged
    - **Property 16: Added links are persisted and rendered in insertion order** — add a sequence of valid links; assert rendered order and localStorage order both match insertion order
    - **Property 17: Deleting a link always removes it from state and DOM** — add ≥ 1 link, then `deleteLink(id)`; assert id absent from array, DOM, and localStorage
    - _Validates: Requirements 7.2–7.7, 8.1–8.3_

  - [ ] 5.9 Checkpoint — Milestone 5 complete
    - Ensure links can be added, validated, deleted, capped at 50, and persisted; property tests pass. Ask the user if questions arise.

---

- [ ] 6. Milestone 6 — Polish, Accessibility, and Final Verification
  - [ ] 6.1 Add ARIA labels and semantic attributes to `index.html` and `js/script.js`
    - Ensure all icon-only or action buttons have `aria-label` set (complete, edit, delete task; delete link; timer start/stop/reset)
    - Add `role` attributes where needed (e.g., `role="alert"` on `#todo-error`, `#links-error`, `#toast-container`)
    - Add `aria-live="polite"` to `#clock-time` or wrap clock in an appropriate live region
    - _Requirements: 9.3_

  - [ ] 6.2 Verify and enforce keyboard navigation in `js/script.js` and `css/style.css`
    - Confirm all interactive elements are reachable and operable via Tab and Enter/Space
    - Confirm Escape key cancels an active task edit (`cancelEdit`)
    - Add visible `:focus` styles in CSS for all interactive elements
    - _Requirements: 5.4, 9.3_

  - [ ] 6.3 Verify `rel="noopener noreferrer"` on all link anchors
    - Confirm `LinksModule.renderLink` sets both `rel="noopener noreferrer"` and `target="_blank"` on every `<a>` element
    - _Requirements: 7.4, 9.3_

  - [ ] 6.4 Test and handle localStorage edge cases in `js/script.js`
    - Verify `StorageService.load` returns `null` (no throw) when given malformed JSON
    - Verify `StorageService.save` returns `{ ok: false }` (no throw) when `localStorage.setItem` throws `QuotaExceededError`
    - Verify `TodoModule.init` and `LinksModule.init` fall back to `[]` when `StorageService.load` returns `null`
    - Add unit tests in `test.html` covering these three scenarios
    - _Requirements: 4.7, 6.7, 8.3_

  - [ ]* 6.5 Run full property test suite and fix any failures
    - Execute all 17 property tests in `test.html` (minimum 100 iterations each)
    - Each test must include a comment in the format: `// Feature: todo-life-dashboard, Property N: <title>`
    - Fix any failing properties before marking this task complete
    - _Validates: All correctness properties 1–17_

  - [ ] 6.6 Final audit — confirm architectural constraints
    - Confirm `index.html` contains no `<style>` blocks and no inline `style` attributes
    - Confirm `index.html` contains no inline `<script>` blocks
    - Confirm `js/script.js` uses only native browser APIs (no jQuery, React, or other libraries)
    - Confirm `js/script.js` makes no `fetch` or `XMLHttpRequest` calls
    - Confirm production file set is exactly `index.html`, `css/style.css`, `js/script.js`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 6.7 Final checkpoint — all done
    - Ensure all tests pass and all architectural constraints are met. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Test files (`test.html`, `js/test-runner.js`) are not part of the production file set
- Each task references specific requirements for traceability
- Milestones are sequential; complete and verify each before starting the next
- All CSS class toggling is done via `classList`; no inline `style` attributes are ever set from JavaScript
- `crypto.randomUUID()` is available in all modern browsers; fall back to `Date.now().toString()` only if targeting very old browsers
- Property tests use [fast-check](https://fast-check.dev/) loaded from CDN in `test.html`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["1.6", "2.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3"] },
    { "id": 6, "tasks": ["3.4", "3.6"] },
    { "id": 7, "tasks": ["3.5", "3.7"] },
    { "id": 8, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 9, "tasks": ["4.4", "4.5", "4.6"] },
    { "id": 10, "tasks": ["4.7", "5.1"] },
    { "id": 11, "tasks": ["5.2", "5.3"] },
    { "id": 12, "tasks": ["5.4", "5.7"] },
    { "id": 13, "tasks": ["5.5", "5.6"] },
    { "id": 14, "tasks": ["5.8", "6.1"] },
    { "id": 15, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 16, "tasks": ["6.5", "6.6"] }
  ]
}
```
