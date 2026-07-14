# Testing Guidelines

## Overview

This document defines the testing standards for the To Do App. All tests must be reliable, maintainable, and independent of one another.

---

## 1. Test Types

### Unit Tests

- Test individual functions and React components **in isolation**.
- Mock all external dependencies (network calls, databases, modules).
- **Framework**: Jest (backend), Jest + React Testing Library (frontend).
- **File extensions**: `*.test.js` or `*.test.ts`
- **Backend location**: `packages/backend/__tests__/`
- **Frontend location**: `packages/frontend/src/__tests__/`
- Name files to match the module under test (e.g., `app.test.js` for `app.js`).

**What to test:**
- Pure functions and business logic
- React component rendering and user interactions
- Edge cases and error paths
- Input validation

### Integration Tests

- Test backend API endpoints with **real HTTP requests** against a running Express app and in-memory/test database.
- **Framework**: Jest + Supertest
- **File extensions**: `*.test.js` or `*.test.ts`
- **Location**: `packages/backend/__tests__/integration/`
- Name files based on what they test (e.g., `todos-api.test.js`).

**What to test:**
- Full request/response cycles for each endpoint
- HTTP status codes, response bodies, and headers
- Validation error responses (400, 404, etc.)
- Success responses (200, 201, 204)

### End-to-End (E2E) Tests

- Test complete UI workflows through **browser automation**.
- **Framework**: Playwright only — do not use Cypress or Puppeteer.
- **File extensions**: `*.spec.js` or `*.spec.ts`
- **Location**: `tests/e2e/`
- Run against a **single browser** only.
- Must follow the **Page Object Model (POM)** pattern — keep selectors and actions in page classes, not in test files.
- Limit to **5–8 tests** covering critical user journeys. Favor quality over quantity.
- Name files based on the journey being tested (e.g., `todo-workflow.spec.js`).

**What to test:**
- Critical happy paths (create, edit, complete, delete a task)
- Due date assignment and overdue display
- Sort and filter interactions

### Security Tests

- Validate that the API rejects malicious or malformed input at boundaries.
- **Framework**: Jest + Supertest (co-located with integration tests).
- **Location**: `packages/backend/__tests__/integration/`
- Name files descriptively (e.g., `security.test.js`).

**What to test:**
- SQL injection attempts in request bodies and query parameters
- XSS payloads in task names and due dates (ensure output is escaped)
- Missing or invalid `Content-Type` headers
- Oversized request payloads (enforce request size limits)
- Requests with unexpected or extra fields (ensure they are ignored, not persisted)
- Authentication/authorization enforcement if applicable

---

## 2. Test Independence

Every test must be fully **independent and self-contained**:

- No test may depend on state created by another test.
- Do not share mutable state between tests (no module-level variables that accumulate across tests).
- Each test must set up its own preconditions and not assume a particular database or application state.
- Tests must pass when run individually, in any order, or in parallel.

---

## 3. Setup and Teardown

### General Rules

- Use `beforeEach` / `afterEach` for setup and teardown that applies to every test in a suite.
- Use `beforeAll` / `afterAll` only for **one-time** setup that is expensive and safe to share (e.g., starting a server, opening a DB connection).
- Always clean up resources in `afterEach` or `afterAll` (close DB connections, stop servers, clear mocks).

### Backend (Jest + Supertest)

```js
const request = require('supertest');
const { app, db } = require('../../src/app');

// One-time teardown — close DB after the full suite
afterAll(() => {
  if (db) db.close();
});

// Per-test cleanup — remove data created during each test
afterEach(async () => {
  await db.run('DELETE FROM items WHERE name LIKE "Test%"');
});
```

### Frontend (Jest + React Testing Library)

```js
import { render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(/* handlers */);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers()); // Reset overrides between tests
afterAll(() => server.close());
```

### E2E (Playwright)

```js
import { test, expect } from '@playwright/test';
import { TodoPage } from './pages/TodoPage';

test.beforeEach(async ({ page }) => {
  // Reset state via API or navigate to a clean page
  await page.goto('/');
});
```

---

## 4. Mocking

- **Backend unit tests**: Use `jest.mock()` to mock modules (e.g., database layer).
- **Frontend unit tests**: Use [MSW (Mock Service Worker)](https://mswjs.io/) to intercept `fetch` calls — do not mock `fetch` directly.
- **Integration tests**: Do **not** mock the database; use a separate test database or in-memory SQLite.
- **E2E tests**: Do **not** mock anything — run against the full stack.
- Reset all mocks in `afterEach` using `jest.clearAllMocks()` or `server.resetHandlers()`.

---

## 5. Assertions

- Prefer **specific assertions** over generic ones (`toBe`, `toEqual`, `toHaveProperty` over `toBeTruthy`).
- Assert both **success and failure** paths in every test suite.
- For API tests, always assert: HTTP status code, response body shape, and relevant field values.
- For component tests, assert what the **user sees** (text, roles, labels) — not implementation details (state, class names).

---

## 6. Naming Conventions

| Test type   | File pattern                          | `describe` label             | `it`/`test` label                        |
|-------------|---------------------------------------|------------------------------|------------------------------------------|
| Unit        | `*.test.js`                           | Module or component name     | `should <expected behavior>`             |
| Integration | `*-api.test.js`                       | HTTP method + endpoint path  | `should return <status> when <condition>`|
| Security    | `security.test.js`                    | `Security`                   | `should reject <attack vector>`          |
| E2E         | `*.spec.js`                           | User journey name            | Plain-language description of the action |

---

## 7. Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm test --workspace=packages/backend

# Run frontend tests only
npm test --workspace=packages/frontend

# Run E2E tests
npx playwright test
```

---

## 8. Coverage

- Aim for **80%+ line coverage** on business logic and API route handlers.
- Do not write tests solely to inflate coverage — untested edge cases are more valuable than padding.
- Coverage reports are generated automatically when running `npm test -- --coverage`.
