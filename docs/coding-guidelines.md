# Coding Guidelines

## Overview

This document describes the coding style and best practices for the To Do App. Consistent, readable code lowers the cost of maintenance and makes it easier for GitHub Copilot and human contributors alike to generate correct, on-brand additions. When writing new code, always follow the conventions already established in the codebase rather than introducing new patterns.

---

## 1. Language & Runtime

The project is written entirely in **JavaScript (ES2020+)**. TypeScript is not used; however, code should be written in a way that makes types obvious from context (clear variable names, explicit return shapes, validated inputs at boundaries).

- Backend: Node.js with CommonJS modules (`require` / `module.exports`).
- Frontend: React with ES Modules (`import` / `export`).
- Do not mix module systems within a package.

---

## 2. Formatting

There is no Prettier config in this project. Follow these formatting rules consistently by hand or via editor settings:

- **Indentation**: 2 spaces — no tabs.
- **Quotes**: Single quotes (`'`) in JavaScript; double quotes only inside JSX attribute values.
- **Semicolons**: Always terminate statements with a semicolon.
- **Line length**: Keep lines under 100 characters where practical.
- **Trailing commas**: Use trailing commas in multi-line arrays and objects.
- **Braces**: Always use braces for `if`, `else`, `for`, and `while` blocks, even single-line ones.
- **Blank lines**: One blank line between top-level declarations; no consecutive blank lines.
- **Arrow functions**: Prefer arrow functions for callbacks and inline handlers; use `function` declarations for named top-level functions.

```js
// Good
const handleDelete = async (id) => {
  const result = await deleteItem(id);
  return result;
};

// Avoid
const handleDelete = async id => deleteItem(id)
```

---

## 3. Linting

The **frontend** uses the `react-app` ESLint preset (configured in `packages/frontend/package.json`). This enforces React hooks rules, JSX formatting, and general JavaScript quality.

The **backend** has no explicit ESLint config; it implicitly follows Node.js common sense rules. When adding an ESLint config to the backend, extend `eslint:recommended`.

- Never disable ESLint rules with `// eslint-disable` unless there is a documented reason in the same comment.
- Fix lint warnings before committing — do not let warnings accumulate.
- Run the frontend linter via `react-scripts` as part of the build (`npm run build --workspace=frontend`).

---

## 4. Naming Conventions

| Construct              | Convention         | Example                      |
|------------------------|--------------------|------------------------------|
| Variables & functions  | `camelCase`        | `fetchItems`, `newItem`      |
| React components       | `PascalCase`       | `App`, `TodoList`            |
| CSS class names        | `kebab-case`       | `.add-item-section`          |
| Constants              | `UPPER_SNAKE_CASE` | `MAX_ITEMS`                  |
| Files (JS/JSX)         | `camelCase`        | `app.js`, `App.js`           |
| Test files             | Match source file  | `app.test.js`, `App.test.js` |
| Database columns       | `snake_case`       | `created_at`, `due_date`     |

---

## 5. Best Practices

### DRY (Don't Repeat Yourself)

- Extract any logic used in more than one place into a shared helper or utility function.
- In React, extract repeated JSX into reusable components rather than duplicating markup.
- In the backend, use a single prepared statement or helper for repeated database operations rather than inline SQL strings scattered across routes.

```js
// Good — single reusable helper
const getItemById = (id) => db.prepare('SELECT * FROM items WHERE id = ?').get(id);

// Avoid — duplicating the same query in every route handler
app.get('/api/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  // ...
});
app.delete('/api/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  // ...
});
```

### Single Responsibility

- Each function or component should do one thing well.
- Route handlers in Express should delegate business logic to helper functions, not contain it inline.
- React components should handle rendering; data fetching belongs in hooks or effect blocks, not mixed into JSX.

### Error Handling

- All `async` functions must be wrapped in `try/catch`.
- API routes must return a consistent error shape: `{ error: '<message>' }` with an appropriate HTTP status code.
- Never expose raw error messages or stack traces to the client in production.
- Log errors server-side with `console.error` before returning a response.

### Input Validation

- Validate all user-supplied input at the API boundary before using it in a query or business operation.
- Reject missing, empty, or wrong-type values with a `400` status and a descriptive error message.
- Use parameterised queries (prepared statements) for all database operations — never concatenate user input into SQL strings.

### Immutability & State

- In React, never mutate state directly. Use the setter from `useState` or spread/filter to produce new values.
- Prefer `const` over `let`; only use `let` when reassignment is genuinely required. Never use `var`.

### Comments

- Write comments to explain **why**, not **what**. The code itself should explain what it does.
- Delete commented-out code before merging — use version control history instead.
- Use `// TODO:` comments only for genuinely deferred work; resolve them before the feature is considered complete.

---

## 6. React-Specific Guidelines

- Use **functional components** with hooks. Do not write class components.
- Keep components small and focused — if a component file exceeds ~150 lines, consider splitting it.
- Co-locate component-specific CSS in the same directory as the component.
- Use `useEffect` cleanly: declare the dependency array explicitly; never omit it.
- Avoid inline object/array literals in JSX props when the same value is used on every render — define them outside the component or memoize them.

---

## 7. Backend-Specific Guidelines

- Use `better-sqlite3` for all database access — it is synchronous by design; do not wrap calls in unnecessary Promises.
- Prepare SQL statements once at module load time, not inside request handlers.
- Keep route definitions in `app.js` and export `{ app, db }` for testability.
- Use `morgan` for HTTP request logging in development; do not add `console.log` to route handlers for normal traffic.
- Return `204 No Content` for successful delete operations with no body.

---

## 8. File & Folder Organisation

```
packages/
  backend/
    src/
      app.js       # Express app and routes
      index.js     # Server entry point (binds port)
    __tests__/
      app.test.js
      integration/
  frontend/
    src/
      App.js       # Root component
      App.css
      index.js     # React entry point
      __tests__/
        App.test.js
tests/
  e2e/             # Playwright E2E specs
```

- Keep source files in `src/` and test files in `__tests__/` or alongside the source with a `.test.js` suffix.
- Do not place business logic in entry-point files (`index.js`).
