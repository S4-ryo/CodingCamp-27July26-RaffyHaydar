# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and vanilla JavaScript. It serves as a personal productivity hub that combines a live clock, a time-of-day greeting, a 25-minute focus timer (Pomodoro-style), a task manager, and a quick-links bookmarking panel — all persisted via the browser's Local Storage API. No backend, no frameworks, no build tools.

## Glossary

- **Dashboard**: The single HTML page rendered in the user's browser that contains all feature panels.
- **Clock**: The UI component that displays the current time and date.
- **Greeting**: The text message displayed to the user based on the current hour of the day.
- **Focus_Timer**: The countdown timer component that counts down from 25 minutes (1500 seconds).
- **Todo_List**: The UI component that manages the user's tasks.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI component that manages the user's saved website shortcuts.
- **Link**: A single quick-link item containing a display label and a URL.
- **Local_Storage**: The browser's `localStorage` API used to persist data between sessions.
- **Validator**: The logic that checks user input before creating or saving a Task or Link.

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date at all times, so that I stay aware of the time while I work.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current local time in HH:MM:SS 24-hour format, sourced from the user's device clock, with two-digit zero-padding for hours (00–23), minutes (00–59), and seconds (00–59).
2. THE Dashboard SHALL display the current date in the format "Weekday, Month Day, Year" (e.g., "Sunday, July 27, 2025"), using the user's device locale and local time zone.
3. WHEN the Dashboard has finished loading, THE Clock SHALL begin updating the displayed time within 1 second of page load completion.
4. WHILE the Dashboard is open, THE Clock SHALL update the displayed time on an interval of 1000ms ± 100ms, without requiring a page reload.
5. WHEN the browser tab containing the Dashboard regains focus after being hidden or inactive, THE Clock SHALL display the correct current time within 1 second of the tab becoming visible.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a greeting that reflects the time of day, so that the dashboard feels personal and contextual.

#### Acceptance Criteria

1. WHEN the current local hour is between 5 and 11 (inclusive), THE Greeting SHALL display exactly the text "Good Morning".
2. WHEN the current local hour is between 12 and 17 (inclusive), THE Greeting SHALL display exactly the text "Good Afternoon".
3. WHEN the current local hour is between 18 and 20 (inclusive), THE Greeting SHALL display exactly the text "Good Evening".
4. WHEN the current local hour is between 21 and 23 (inclusive) or between 0 and 4 (inclusive), THE Greeting SHALL display exactly the text "Good Night".
5. WHEN the Dashboard is loaded, THE Greeting SHALL evaluate the current local device hour and display the appropriate greeting message within 1 second of page load completion.
6. IF the current local hour does not match any of the ranges defined in criteria 1–4 (which should not occur under normal conditions), THE Greeting SHALL display "Good Day" as a safe default.

---

### Requirement 3: 25-Minute Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a displayed countdown value of 25:00 (25 minutes, 0 seconds) when the Dashboard is loaded or after Reset is activated.
2. WHEN the user activates the Start control and the timer is not already counting down, THE Focus_Timer SHALL begin counting down by one second per second.
3. WHEN the user activates the Stop control while the Focus_Timer is counting down, THE Focus_Timer SHALL pause the countdown and retain the current remaining time value.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL clear any active or paused countdown interval and restore the displayed value to 25:00.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual indication that the session is complete (e.g., a message or style change).
6. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format, where MM is zero-padded minutes (00–24) and SS is zero-padded seconds (00–59).
7. IF the user activates the Start control while the Focus_Timer is already counting down, THEN THE Focus_Timer SHALL ignore that activation and continue counting without resetting or duplicating the interval.
8. IF the user activates the Stop control while the Focus_Timer is not counting down (either paused or at initial/reset state), THEN THE Focus_Timer SHALL ignore that activation and take no action.
9. WHEN the user activates the Start control after previously activating Stop, THE Focus_Timer SHALL resume counting down from the retained remaining time value, not from 25:00.

---

### Requirement 4: Task Management — Add and Display

**User Story:** As a user, I want to add tasks to a list and see them displayed, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field with a maximum length of 200 characters and an "Add" control for creating new tasks.
2. WHEN the user submits a new task with a description of 1–200 non-whitespace characters, THE Todo_List SHALL add a new Task to the list and display it in the same view without a page reload.
3. WHEN a Task is displayed, THE Todo_List SHALL show the task description and individual controls for completing, editing, and deleting that specific task.
4. IF the user submits the Add form with an empty or whitespace-only description, THEN THE Validator SHALL prevent the Task from being added and SHALL display an inline error message near the input field.
5. WHEN a new Task is added, THE Todo_List SHALL persist the updated task list to Local_Storage before updating the display.
6. WHEN the Dashboard is loaded, THE Todo_List SHALL read the task list from Local_Storage and render all previously saved tasks within 500ms of page load completion.
7. IF Local_Storage is unavailable or contains malformed data when the Dashboard is loaded, THE Todo_List SHALL render an empty task list and SHALL NOT throw a JavaScript error.

---

### Requirement 5: Task Management — Edit

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. WHEN the user activates the Edit control on a Task, THE Todo_List SHALL replace the task's display text with an editable text input pre-filled with the current task description, with the cursor placed at the end of the text.
2. WHEN the user confirms the edit with a trimmed description of 1–200 characters, THE Todo_List SHALL update the Task's description with the trimmed value and return the task to display mode.
3. IF the user confirms an edit with an empty or whitespace-only description, THEN THE Validator SHALL prevent the update, retain the original description, and display an inline error message indicating the description cannot be empty.
4. WHEN the user presses the Escape key or activates a Cancel control while in edit mode, THE Todo_List SHALL discard any unsaved changes and return the task to display mode with the original description intact.
5. WHEN a Task description is successfully updated, THE Todo_List SHALL persist the updated task list to Local_Storage.

---

### Requirement 6: Task Management — Complete and Delete

**User Story:** As a user, I want to mark tasks as done and remove tasks I no longer need, so that I can manage my list clearly.

#### Acceptance Criteria

1. WHEN the user activates the Complete control on a Task, THE Todo_List SHALL toggle the task's completion state between complete and incomplete.
2. WHEN a Task is in the completed state, THE Todo_List SHALL apply a strikethrough text decoration to the task description to visually distinguish it from incomplete tasks.
3. WHEN a Task is returned to the incomplete state (toggled back), THE Todo_List SHALL remove the strikethrough text decoration from the task description.
4. WHEN the completion state of a Task is toggled, THE Todo_List SHALL persist the updated task list to Local_Storage within 500ms of the toggle action.
5. WHEN the user activates the Delete control on a Task, THE Todo_List SHALL remove both the task data entry and the rendered DOM element from the display.
6. WHEN a Task is deleted, THE Todo_List SHALL persist the updated task list to Local_Storage within 500ms of the delete action.
7. IF Local_Storage is unavailable when a toggle or delete operation is performed, THE Todo_List SHALL display a non-blocking error notification and SHALL NOT revert the in-memory state change.

---

### Requirement 7: Quick Links — Add and Display

**User Story:** As a user, I want to save favorite website links with labels, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field for a link label (maximum 50 characters), a text input field for a URL (maximum 2048 characters), and an "Add" control for saving a new Link.
2. WHEN the user submits a new Link with a non-empty label and a URL beginning with "http://" or "https://", THE Quick_Links SHALL add the Link to the panel, display it, and clear both input fields.
3. WHEN a Link is displayed, THE Quick_Links SHALL show the link label as a clickable element and a Delete control adjacent to it.
4. WHEN the user activates a displayed Link label, THE Dashboard SHALL open the link's URL in a new browser tab using target="_blank".
5. IF the user submits the Add Link form with an empty label, an empty URL, or a URL that does not begin with "http://" or "https://", THEN THE Validator SHALL prevent the Link from being added and SHALL display an inline error message identifying which field is invalid.
6. WHEN a new Link is added and the current link count is below 50, THE Quick_Links SHALL persist the updated links list to Local_Storage. IF the link count would exceed 50, THE Validator SHALL prevent the addition and notify the user.
7. WHEN the Dashboard is loaded, THE Quick_Links SHALL read the links list from Local_Storage and render all previously saved links in insertion order.
8. WHEN a Link is deleted, THE Quick_Links SHALL persist the updated links list to Local_Storage.

---

### Requirement 8: Quick Links — Delete

**User Story:** As a user, I want to remove saved links I no longer need, so that I can keep my quick-links panel organized.

#### Acceptance Criteria

1. WHEN the user activates the Delete control on a Link, THE Quick_Links SHALL immediately remove the Link from the panel and update the display without requiring confirmation.
2. WHEN a Link is deleted, THE Quick_Links SHALL persist the updated links list to Local_Storage immediately after removal.
3. IF Local_Storage is unavailable when a delete operation is performed, THE Quick_Links SHALL display a non-blocking error notification and SHALL NOT revert the in-memory state change.

---

### Requirement 9: Single-File Architecture Constraint

**User Story:** As a developer, I want the project to use exactly one CSS file and one JavaScript file, so that the codebase stays simple and easy to review for the CodingCamp project.

#### Acceptance Criteria

1. THE Dashboard SHALL load all styles from a single CSS file (`css/style.css`) and SHALL NOT contain any `<style>` blocks or inline `style` attributes anywhere in the HTML.
2. THE Dashboard SHALL load all JavaScript logic from a single JavaScript file (`js/script.js`) and SHALL NOT contain any inline `<script>` blocks in the HTML.
3. THE Dashboard SHALL use no external JavaScript frameworks or libraries (no React, Vue, Angular, jQuery, or similar); all DOM manipulation SHALL use native browser APIs.
4. THE Dashboard SHALL make no network requests to external APIs or backend servers; all data persistence SHALL be handled exclusively by the browser's Local_Storage API.
5. THE complete set of project files SHALL consist of exactly: `index.html`, `css/style.css`, and `js/script.js`.
