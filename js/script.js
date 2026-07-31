// js/script.js — application logic will be added in Tasks 1.3 onwards

// ─── StorageService ───────────────────────────────────────────────────────────
// Wraps localStorage access with JSON serialisation and error handling.
// All other modules use this service; it calls nothing else.

const StorageService = {
  KEYS: {
    TASKS: 'tdl_tasks',
    LINKS: 'tdl_links',
  },

  /**
   * Load a value from localStorage and parse it as JSON.
   * Returns null on any exception (missing key, parse error, security error, etc.).
   *
   * @param {string} key
   * @returns {any|null}
   */
  load(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (_e) {
      return null;
    }
  },

  /**
   * Serialise a value as JSON and write it to localStorage.
   * Returns { ok: true } on success, or { ok: false, error: message } on any exception.
   *
   * @param {string} key
   * @param {any} value
   * @returns {{ ok: boolean, error?: string }}
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
};

// ─── ToastService ─────────────────────────────────────────────────────────────
// Displays non-blocking notification toasts in #toast-container.
// Creates a <div class="toast">, appends it to the container, and removes it
// after durationMs milliseconds via setTimeout.

const ToastService = {
  /**
   * Show a toast notification.
   *
   * @param {string} message    - Text to display in the toast.
   * @param {number} durationMs - How long (ms) to show the toast. Default: 3000.
   */
  show(message, durationMs = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, durationMs);
  },
};

// ─── pad2 helper ─────────────────────────────────────────────────────────────
// Zero-pads a number to at least two digits.
// e.g. pad2(7) → "07",  pad2(12) → "12"

/**
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

// ─── ClockModule ──────────────────────────────────────────────────────────────
// Manages the live clock, date, and time-based greeting.
// Public surface: init(), tick(), formatTime(), formatDate(), getGreeting()

const ClockModule = {
  /**
   * Format hours, minutes, and seconds as "HH:MM:SS".
   * Pure function — no side effects.
   *
   * @param {number} h - hours   (0–23)
   * @param {number} m - minutes (0–59)
   * @param {number} s - seconds (0–59)
   * @returns {string} e.g. "09:04:07"
   */
  formatTime(h, m, s) {
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  },

  /**
   * Format a Date object as a locale-aware long date string.
   * Uses the browser's default locale (undefined) so the output honours
   * the user's system language — satisfies Requirement 1.2.
   * Pure function — no side effects.
   *
   * @param {Date} date
   * @returns {string} e.g. "Sunday, July 27, 2025"
   */
  formatDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Return the appropriate greeting for the given hour (0–23).
   * Pure function — no side effects.
   *
   * Ranges (inclusive):
   *   5–11  → "Good Morning"
   *  12–17  → "Good Afternoon"
   *  18–20  → "Good Evening"
   *  21–23 and 0–4 → "Good Night"
   *  else   → "Good Day"  (fallback; should not occur for valid input)
   *
   * @param {number} hour - integer in [0, 23]
   * @returns {string}
   */
  getGreeting(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'Good Morning';
    } else if (hour >= 12 && hour <= 17) {
      return 'Good Afternoon';
    } else if (hour >= 18 && hour <= 20) {
      return 'Good Evening';
    } else if (hour >= 21 || hour <= 4) {
      return 'Good Night';
    } else {
      return 'Good Day';
    }
  },

  /**
   * Read the current time, format it, and write it to the DOM.
   * Called every second by the interval started in init().
   */
  tick() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    const greetingEl = document.getElementById('clock-greeting');

    if (timeEl) timeEl.textContent = ClockModule.formatTime(h, m, s);
    if (dateEl) dateEl.textContent = ClockModule.formatDate(now);
    if (greetingEl) greetingEl.textContent = ClockModule.getGreeting(h);
  },

  /**
   * Bootstrap the clock:
   *  1. Render immediately so there is no blank flash on load.
   *  2. Start a 1-second interval to keep the display current.
   *  3. Re-tick when the tab becomes visible again after being hidden,
   *     so the time is never stale when the user returns to the tab
   *     (satisfies Requirement 1.5).
   */
  init() {
    ClockModule.tick();
    setInterval(ClockModule.tick, 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        ClockModule.tick();
      }
    });
  },
};

// ─── TimerModule ──────────────────────────────────────────────────────────────
// Manages the 25-minute (1500 s) countdown timer.
// Internal state is kept in a private _state object (not exposed on the module).
// State machine: idle → running → paused → running → … → done; any → idle (reset)

const _state = {
  remaining: 1500,   // seconds remaining (0–1500)
  state: 'idle',     // 'idle' | 'running' | 'paused' | 'done'
  intervalId: null,  // setInterval return value, or null
};

const TimerModule = {
  /**
   * Format a total-seconds value as "MM:SS", zero-padded.
   * Pure function — no side effects.
   *
   * @param {number} totalSeconds - integer in [0, 1500]
   * @returns {string} e.g. "25:00", "04:37", "00:00"
   */
  formatTime(totalSeconds) {
    const MM = Math.floor(totalSeconds / 60);
    const SS = totalSeconds % 60;
    return pad2(MM) + ':' + pad2(SS);
  },

  /**
   * Write the current remaining time to #timer-display.
   * Includes a null guard in case the element is absent.
   */
  _render() {
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = TimerModule.formatTime(_state.remaining);
    }
  },

  /**
   * Start (or resume) the countdown.
   * If already running, this is a no-op — satisfies Req 3.7.
   * From 'paused', resumes from retained remaining — satisfies Req 3.9.
   */
  start() {
    if (_state.state === 'running') return; // Req 3.7 — ignore duplicate start

    _state.state = 'running';
    _state.intervalId = setInterval(() => {
      _state.remaining -= 1;
      TimerModule._render();

      if (_state.remaining <= 0) {
        // Timer has reached 00:00 — Req 3.5
        clearInterval(_state.intervalId);
        _state.intervalId = null;
        _state.state = 'done';

        const doneEl = document.getElementById('timer-done');
        if (doneEl) doneEl.removeAttribute('hidden');

        const sectionEl = document.getElementById('timer-section');
        if (sectionEl) sectionEl.classList.add('timer-done');
      }
    }, 1000);
  },

  /**
   * Pause the countdown.
   * If not currently running, this is a no-op — satisfies Req 3.8.
   */
  stop() {
    if (_state.state !== 'running') return; // Req 3.8 — ignore stop when not running

    clearInterval(_state.intervalId);
    _state.intervalId = null;
    _state.state = 'paused';
  },

  /**
   * Reset the timer to 25:00 from any state — satisfies Req 3.4.
   * clearInterval(null) is safe and does nothing.
   */
  reset() {
    clearInterval(_state.intervalId);
    _state.intervalId = null;
    _state.remaining = 1500;
    _state.state = 'idle';

    const doneEl = document.getElementById('timer-done');
    if (doneEl) doneEl.setAttribute('hidden', '');

    const sectionEl = document.getElementById('timer-section');
    if (sectionEl) sectionEl.classList.remove('timer-done');

    TimerModule._render();
  },

  /**
   * Bootstrap the timer:
   *  1. Render the initial "25:00" display — satisfies Req 3.1.
   *  2. Wire click listeners to the three control buttons.
   */
  init() {
    TimerModule._render(); // shows "25:00" on load — Req 3.1

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.addEventListener('click', () => TimerModule.start());
    if (stopBtn)  stopBtn.addEventListener('click',  () => TimerModule.stop());
    if (resetBtn) resetBtn.addEventListener('click', () => TimerModule.reset());
  },
};

// ─── TodoModule ───────────────────────────────────────────────────────────────
// Manages to-do tasks: validation, rendering, add/toggle/delete, and persistence.
// Tasks 3.2–3.5 will add the remaining methods (renderTask, renderAll, addTask, init).

// Private in-memory task array — loaded from localStorage in TodoModule.init()
let _tasks = [];

const TodoModule = {
  /**
   * Validate a task description.
   * Pure function — no side effects.
   *
   * @param {string} str - untrimmed user input
   * @returns {{ valid: boolean, error?: string }}
   */
  validateDescription(str) {
    if (str.trim().length === 0) {
      return { valid: false, error: 'Description cannot be empty.' };
    }
    if (str.trim().length > 200) {
      return { valid: false, error: 'Description must be 200 characters or fewer.' };
    }
    return { valid: true };
  },

  /**
   * Build and return a <li> element representing a single task.
   * Pure-ish — creates DOM but has no side effects beyond that.
   *
   * @param {{ id: string, text: string, done: boolean }} task
   * @returns {HTMLLIElement}
   */
  renderTask(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.done) li.classList.add('task-done');

    const span = document.createElement('span');
    span.classList.add('task-text');
    span.textContent = task.text;

    const completeBtn = document.createElement('button');
    completeBtn.classList.add('btn-complete');
    completeBtn.dataset.action = 'complete';
    completeBtn.dataset.id = task.id;
    completeBtn.setAttribute('aria-label', 'Complete task');
    completeBtn.textContent = '✓';

    const editBtn = document.createElement('button');
    editBtn.classList.add('btn-edit');
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = task.id;
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = '✎';

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn-delete');
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = task.id;
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.textContent = '✕';

    li.appendChild(span);
    li.appendChild(completeBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Clear and re-render the full task list in #todo-list.
   * Called after every state mutation (add, toggle, delete, edit).
   */
  renderAll() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';
    _tasks.forEach(task => {
      list.appendChild(TodoModule.renderTask(task));
    });
  },

  /**
   * Add a new task to the list.
   * Validates input, creates the task, persists, and re-renders.
   *
   * @param {string} description - raw user input from #todo-input
   */
  addTask(description) {
    const errorEl = document.getElementById('todo-error');
    const result = TodoModule.validateDescription(description);

    if (!result.valid) {
      if (errorEl) {
        errorEl.textContent = result.error;
        errorEl.classList.add('error-visible');
      }
      return;
    }

    const task = {
      id: crypto.randomUUID(),
      text: description.trim(),
      done: false,
    };

    _tasks.push(task);

    const saveResult = StorageService.save(StorageService.KEYS.TASKS, _tasks);
    if (!saveResult.ok) {
      ToastService.show('Could not save tasks: ' + saveResult.error);
    }

    TodoModule.renderAll();

    const input = document.getElementById('todo-input');
    if (input) input.value = '';
    if (errorEl) errorEl.classList.remove('error-visible');
  },

  /**
   * Toggle a task's completion state.
   * Flips task.done, persists, and re-renders — satisfies Req 6.1, 6.4.
   *
   * @param {string} id - task id
   */
  toggleTask(id) {
    const task = _tasks.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;

    const saveResult = StorageService.save(StorageService.KEYS.TASKS, _tasks);
    if (!saveResult.ok) {
      ToastService.show('Could not save tasks: ' + saveResult.error);
    }

    TodoModule.renderAll();
  },

  /**
   * Remove a task from the list.
   * Filters _tasks, persists, and re-renders — satisfies Req 6.5, 6.6.
   *
   * @param {string} id - task id to remove
   */
  deleteTask(id) {
    _tasks = _tasks.filter(t => t.id !== id);

    const saveResult = StorageService.save(StorageService.KEYS.TASKS, _tasks);
    if (!saveResult.ok) {
      ToastService.show('Could not save tasks: ' + saveResult.error);
    }

    TodoModule.renderAll();
  },

  /**
   * Switch a task row into inline edit mode.
   * Hides the text span and edit button; shows an edit input with
   * confirm/cancel controls — satisfies Req 5.1.
   *
   * @param {string} id - task id to edit
   */
  beginEdit(id) {
    const task = _tasks.find(t => t.id === id);
    if (!task) return;

    const li = document.querySelector(`#todo-list li[data-id="${id}"]`);
    if (!li) return;

    // Add editing class to the row
    li.classList.add('task-editing');

    // Hide the static text span and the edit button
    const textSpan = li.querySelector('.task-text');
    const editBtn  = li.querySelector('.btn-edit');
    if (textSpan) textSpan.style.display = 'none';
    if (editBtn)  editBtn.style.display  = 'none';

    // Create the inline edit input pre-filled with current text
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('task-edit-input');
    input.value = task.text;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task description');

    // Create confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('btn-confirm-edit');
    confirmBtn.dataset.action = 'confirm-edit';
    confirmBtn.dataset.id = id;
    confirmBtn.setAttribute('aria-label', 'Confirm edit');
    confirmBtn.textContent = '✔';

    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('btn-cancel-edit');
    cancelBtn.dataset.action = 'cancel-edit';
    cancelBtn.dataset.id = id;
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.textContent = '✖';

    // Insert input and new buttons into the li
    li.insertBefore(input, editBtn);
    li.insertBefore(confirmBtn, editBtn);
    li.insertBefore(cancelBtn, editBtn);

    // Place cursor at the end of the input text — satisfies Req 5.1
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    // Wire keyboard shortcuts
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        TodoModule.confirmEdit(id, input.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        TodoModule.cancelEdit(id);
      }
    });

    // Wire confirm/cancel button clicks via the existing delegation listener on #todo-list
    // The delegation in init() checks data-action; add direct listeners here as well for robustness
    confirmBtn.addEventListener('click', () => TodoModule.confirmEdit(id, input.value));
    cancelBtn.addEventListener('click',  () => TodoModule.cancelEdit(id));
  },

  /**
   * Confirm and save an inline task edit.
   * Validates the new description, updates the task, persists, and re-renders.
   * On validation failure, shows an inline error without leaving edit mode.
   * Satisfies Req 5.2, 5.5.
   *
   * @param {string} id      - task id being edited
   * @param {string} newDesc - raw value from the edit input
   */
  confirmEdit(id, newDesc) {
    const result = TodoModule.validateDescription(newDesc);

    if (!result.valid) {
      // Show inline error near the edit input — stay in edit mode
      const li = document.querySelector(`#todo-list li[data-id="${id}"]`);
      if (li) {
        // Reuse an existing error span or create one
        let errSpan = li.querySelector('.task-edit-error');
        if (!errSpan) {
          errSpan = document.createElement('span');
          errSpan.classList.add('task-edit-error');
          errSpan.style.cssText = 'color:#dc2626;font-size:0.8rem;margin-left:0.25rem;';
          const input = li.querySelector('.task-edit-input');
          if (input) input.insertAdjacentElement('afterend', errSpan);
        }
        errSpan.textContent = result.error;
      }
      return;
    }

    const task = _tasks.find(t => t.id === id);
    if (!task) return;

    task.text = newDesc.trim();

    const saveResult = StorageService.save(StorageService.KEYS.TASKS, _tasks);
    if (!saveResult.ok) {
      ToastService.show('Could not save tasks: ' + saveResult.error);
    }

    TodoModule.renderAll();
  },

  /**
   * Cancel an inline task edit and restore display mode.
   * Calls renderAll() to discard DOM edits; task.text is never mutated
   * by beginEdit so the original description is always restored.
   * Satisfies Req 5.4.
   *
   * @param {string} id - task id being edited (unused but kept for symmetry)
   */
  cancelEdit(id) {
    TodoModule.renderAll();
  },

  /**
   * Bootstrap TodoModule:
   *  1. Load persisted tasks from localStorage (fall back to [] on failure).
   *  2. Render the initial task list.
   *  3. Wire the add-task form submit handler.
   *  4. Wire event delegation on #todo-list for complete/edit/delete actions.
   */
  init() {
    // 1. Load from localStorage — fall back to empty array on null or non-array
    const stored = StorageService.load(StorageService.KEYS.TASKS);
    _tasks = Array.isArray(stored) ? stored : [];

    // 2. Render initial list
    TodoModule.renderAll();

    // 3. Form submit → addTask
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        TodoModule.addTask(input.value);
      });
    }

    // 4. Event delegation on #todo-list
    const list = document.getElementById('todo-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'complete') TodoModule.toggleTask(id);
        else if (action === 'edit')    TodoModule.beginEdit(id);
        else if (action === 'delete')  TodoModule.deleteTask(id);
      });
    }
  },
};

// ─── LinksModule ──────────────────────────────────────────────────────────────
// Manages quick links: validation, rendering, add/delete, and persistence.
// Tasks 5.2–5.6 will add the remaining methods (renderLink, renderAll, addLink,
// deleteLink, init).

// Private in-memory links array — loaded from localStorage in LinksModule.init()
let _links = [];

const LinksModule = {
  /**
   * Validate a link label and URL.
   * Pure function — no side effects.
   *
   * Validation order:
   *  1. Label empty/whitespace → error on label
   *  2. Label > 50 chars       → error on label
   *  3. URL empty/whitespace   → error on url
   *  4. URL missing http/https → error on url
   *  5. Both valid             → { valid: true }
   *
   * @param {string} label - raw label input
   * @param {string} url   - raw URL input
   * @returns {{ valid: boolean, errors?: { label?: string, url?: string } }}
   */
  validateLink(label, url) {
    if (label.trim().length === 0) {
      return { valid: false, errors: { label: 'Label cannot be empty.' } };
    }
    if (label.trim().length > 50) {
      return { valid: false, errors: { label: 'Label must be 50 characters or fewer.' } };
    }
    if (url.trim().length === 0) {
      return { valid: false, errors: { url: 'URL cannot be empty.' } };
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, errors: { url: 'URL must start with http:// or https://.' } };
    }
    return { valid: true };
  },

  /**
   * Build and return a <li> element representing a single quick link.
   * Pure-ish — creates DOM but has no side effects beyond that.
   *
   * @param {{ id: string, label: string, url: string }} link
   * @returns {HTMLLIElement}
   */
  renderLink(link) {
    const li = document.createElement('li');
    li.dataset.id = link.id;

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn-delete-link');
    deleteBtn.dataset.id = link.id;
    deleteBtn.setAttribute('aria-label', 'Delete link');
    deleteBtn.textContent = '✕';

    li.appendChild(anchor);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Clear and re-render the full links list in #links-list.
   * Called after every state mutation (add, delete).
   * Renders in insertion order — satisfies Req 7.7.
   */
  renderAll() {
    const list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = '';
    _links.forEach(link => {
      list.appendChild(LinksModule.renderLink(link));
    });
  },

  /**
   * Add a new quick link.
   * Validates input, enforces 50-link cap, creates the link, persists, and re-renders.
   * Satisfies Req 7.2, 7.6.
   *
   * @param {string} label - raw label input from #link-label
   * @param {string} url   - raw URL input from #link-url
   */
  addLink(label, url) {
    const errorEl = document.getElementById('links-error');
    const result = LinksModule.validateLink(label, url);

    if (!result.valid) {
      if (errorEl) {
        // Show the first field-specific error message
        const msg = result.errors.label || result.errors.url;
        errorEl.textContent = msg;
        errorEl.classList.add('error-visible');
      }
      return;
    }

    if (_links.length >= 50) {
      if (errorEl) {
        errorEl.textContent = 'You can save a maximum of 50 links.';
        errorEl.classList.add('error-visible');
      }
      return;
    }

    const link = {
      id: crypto.randomUUID(),
      label: label.trim(),
      url,
    };

    _links.push(link);

    const saveResult = StorageService.save(StorageService.KEYS.LINKS, _links);
    if (!saveResult.ok) {
      ToastService.show('Could not save links: ' + saveResult.error);
    }

    LinksModule.renderAll();

    const labelInput = document.getElementById('link-label');
    const urlInput   = document.getElementById('link-url');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
    if (errorEl)    errorEl.classList.remove('error-visible');
  },

  /**
   * Remove a quick link from the list.
   * Filters _links, persists, and re-renders.
   *
   * @param {string} id - link id to remove
   */
  deleteLink(id) {
    _links = _links.filter(link => link.id !== id);

    const saveResult = StorageService.save(StorageService.KEYS.LINKS, _links);
    if (!saveResult.ok) {
      ToastService.show('Could not save links: ' + saveResult.error);
    }

    LinksModule.renderAll();
  },

  /**
   * Bootstrap LinksModule:
   *  1. Load persisted links from localStorage (fall back to [] on failure).
   *  2. Render the initial link list.
   *  3. Wire the add-link form submit handler.
   *  4. Wire click delegation on #links-list for delete actions.
   */
  init() {
    // 1. Load from localStorage — fall back to empty array on null or non-array
    const stored = StorageService.load(StorageService.KEYS.LINKS);
    _links = Array.isArray(stored) ? stored : [];

    // 2. Render initial list
    LinksModule.renderAll();

    // 3. Form submit → addLink
    const form = document.getElementById('links-form');
    const labelInput = document.getElementById('link-label');
    const urlInput = document.getElementById('link-url');
    if (form && labelInput && urlInput) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        LinksModule.addLink(labelInput.value, urlInput.value);
      });
    }

    // 4. Event delegation on #links-list
    const list = document.getElementById('links-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-link');
        if (!btn) return;
        const id = btn.dataset.id;
        if (id) LinksModule.deleteLink(id);
      });
    }
  },
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Initialise all modules after the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  ClockModule.init();
  TimerModule.init();
  TodoModule.init();
  LinksModule.init();
});
