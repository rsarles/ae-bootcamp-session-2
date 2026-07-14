# UI Guidelines

## Overview

This document defines the core UI guidelines for the To Do App. These recommendations follow modern application UI standards to ensure a consistent, accessible, and user-friendly experience.

---

## 1. Layout & Structure

- Use a **single-column, centered layout** with a max-width of `800px` for readability on large screens.
- Apply consistent **padding** (`16px`–`24px`) and **gap** (`16px`–`20px`) between sections.
- Group related controls (e.g., filters + sort) in a dedicated toolbar area above the task list.
- Keep the page structure shallow: header → toolbar → task list → empty state.

---

## 2. Color & Theme

| Role             | Value         | Usage                          |
|------------------|---------------|-------------------------------|
| Primary          | `#61dafb`     | Buttons, active states, links  |
| Primary (hover)  | `#21a1c9`     | Button hover                   |
| Danger           | `#f44336`     | Delete actions                 |
| Background       | `#282c34`     | App header                     |
| Surface          | `#f5f5f5`     | Cards, sections                |
| Text (primary)   | `#1a1a1a`     | Body text                      |
| Text (secondary) | `#666666`     | Metadata, due dates, labels    |
| Overdue          | `#d32f2f`     | Past-due date indicators       |
| Due soon         | `#f57c00`     | Tasks due within 24 hours      |

- Maintain a **contrast ratio of at least 4.5:1** for all text against its background (WCAG AA).
- Do not rely on color alone to convey meaning — always pair with an icon or label.

---

## 3. Typography

- Use the system font stack for performance and native feel: `'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- **Heading (h1):** `1.8rem`, `font-weight: 700`
- **Section heading (h2):** `1.2rem`, `font-weight: 600`
- **Body text:** `1rem` / `16px`, `line-height: 1.5`
- **Metadata (due dates, secondary labels):** `0.85rem`, `color: #666666`
- Avoid using more than two font sizes in a single view.

---

## 4. Components

### Buttons

- Use clearly labeled text buttons for primary actions (e.g., "Add Task", "Save", "Delete").
- **Primary button:** filled background (`#61dafb`), dark text, `border-radius: 4px`.
- **Danger button:** filled background (`#f44336`), white text — use only for destructive actions.
- **Ghost/Secondary button:** transparent background with border — use for cancel or low-priority actions.
- Minimum touch target size: **44×44px** (mobile accessibility).
- Disable buttons when the associated action is unavailable; do not hide them.

### Inputs & Forms

- All inputs must have a visible `<label>` or `aria-label`.
- Use `border-radius: 4px` and a `1px solid #ddd` border at rest; highlight the border on focus.
- Show inline validation errors below the field in red (`#d32f2f`) immediately after the user leaves the field.
- Required fields should be indicated with an asterisk (`*`) and a legend note.

### Task Items

- Each task row displays: **completion checkbox → task title → due date badge → action buttons**.
- Completed tasks use a strikethrough style and reduced opacity (`0.5`) to indicate done state.
- Overdue tasks display the due date in red with an "Overdue" label.
- Action buttons (Edit, Delete) are right-aligned and use icon buttons with `aria-label` attributes.

### Empty State

- When no tasks exist (or no tasks match filters), display a centered empty state with:
  - A descriptive icon or illustration
  - A short message (e.g., "No tasks yet. Add one above!")
  - A call-to-action button if applicable

---

## 5. Sorting & Filtering Controls

- Place sort and filter controls in a **sticky toolbar** directly above the task list.
- Use a `<select>` or segmented control for sort order (Due Date, Created Date, Title).
- Use toggle buttons or a pill-style filter bar for status filters (All / Active / Completed).
- Use a dropdown or date range picker for due-date filters.
- Display an **active filter indicator** (e.g., a badge count or highlighted filter label) when filters are applied.
- Provide a "Clear all filters" link when any filter is active.

---

## 6. Spacing & Sizing

- Use an **8px base grid** for all spacing (margins, paddings, gaps).
- Common values: `8px`, `12px`, `16px`, `24px`, `32px`.
- Avoid arbitrary spacing values outside this scale.

---

## 7. Accessibility

- All interactive elements must be **keyboard navigable** with visible focus indicators.
- Use semantic HTML: `<button>` for actions, `<input>` for fields, `<ul>`/`<li>` for lists.
- Provide `aria-label` or `aria-describedby` for icon-only buttons.
- Announce dynamic content changes (task added/deleted/updated) using `aria-live="polite"`.
- Support `prefers-reduced-motion` — disable or reduce transitions for users who opt out.

---

## 8. Responsiveness

- The layout must be fully usable on screens **320px and wider**.
- On mobile (`< 600px`): stack the add-task form vertically; collapse sort/filter into a compact toggle.
- Use `rem`-based font sizes and fluid widths (`%` or `max-width`) rather than fixed pixel widths.
- Test touch interactions: buttons and checkboxes must be easy to tap without zooming.

---

## 9. Feedback & States

| State       | Visual Treatment                                        |
|-------------|--------------------------------------------------------|
| Loading     | Skeleton screen or spinner with "Loading…" label       |
| Success     | Brief inline confirmation (e.g., "Task added")         |
| Error       | Red inline message with a description and retry option |
| Empty       | Descriptive empty state (see §4)                       |
| Disabled    | 40% opacity, `cursor: not-allowed`                     |

- Avoid full-page modals for confirmations unless the action is irreversible (e.g., bulk delete).
- Use **toast notifications** (bottom-right, auto-dismiss after 4 seconds) for non-blocking feedback.
