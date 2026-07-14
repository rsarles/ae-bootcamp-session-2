import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const baseItems = [
  { id: 1, name: 'Test Item 1', due_date: null, completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Item 2', due_date: '2099-12-31', completed: 0, created_at: '2023-01-02T00:00:00.000Z' },
];

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(baseItems));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    return res(
      ctx.status(201),
      ctx.json({ id: 3, name, due_date: req.body.due_date || null, completed: 0, created_at: new Date().toISOString() })
    );
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const existing = baseItems.find(i => i.id === parseInt(id));
    if (!existing) return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    const updated = { ...existing, ...req.body, completed: req.body.completed ? 1 : 0 };
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: parseInt(id) }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
  });

  test('loads and displays items', async () => {
    await act(async () => { render(<App />); });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  test('displays due date alongside task', async () => {
    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText('2099-12-31')).toBeInTheDocument();
    });
  });

  test('adds a new item', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.queryByText('Loading data...')).not.toBeInTheDocument());

    const input = screen.getByPlaceholderText('Enter task name');
    await act(async () => { await user.type(input, 'New Test Item'); });

    const submitButton = screen.getByText('Add Task');
    await act(async () => { await user.click(submitButton); });

    await waitFor(() => {
      expect(screen.getByText('New Test Item')).toBeInTheDocument();
    });
  });

  test('enters and cancels edit mode', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.getByText('Test Item 2')).toBeInTheDocument());

    const editButtons = screen.getAllByText('Edit');
    await act(async () => { await user.click(editButtons[0]); });

    expect(screen.getByDisplayValue('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    await act(async () => { await user.click(screen.getByText('Cancel')); });

    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('saves an edited item', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.getByText('Test Item 2')).toBeInTheDocument());

    const editButtons = screen.getAllByText('Edit');
    await act(async () => { await user.click(editButtons[0]); });

    const nameInput = screen.getByDisplayValue('Test Item 2');
    await act(async () => {
      await user.clear(nameInput);
      await user.type(nameInput, 'Renamed Item');
    });

    await act(async () => { await user.click(screen.getByText('Save')); });

    await waitFor(() => {
      expect(screen.getByText('Renamed Item')).toBeInTheDocument();
    });
  });

  test('toggles a task as completed', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.getByText('Test Item 1')).toBeInTheDocument());

    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => { await user.click(checkboxes[0]); });

    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked();
    });
  });

  test('filters by status: completed', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('/api/items', (req, res, ctx) =>
        res(ctx.status(200), ctx.json([
          { id: 1, name: 'Active Task', due_date: null, completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
          { id: 2, name: 'Done Task', due_date: null, completed: 1, created_at: '2023-01-02T00:00:00.000Z' },
        ]))
      )
    );

    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Active Task')).toBeInTheDocument());

    await act(async () => { await user.click(screen.getByText('Completed')); });

    expect(screen.queryByText('Active Task')).not.toBeInTheDocument();
    expect(screen.getByText('Done Task')).toBeInTheDocument();
  });

  test('shows empty state when no items match filters', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('/api/items', (req, res, ctx) =>
        res(ctx.status(200), ctx.json([
          { id: 1, name: 'Active Task', due_date: null, completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
        ]))
      )
    );

    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Active Task')).toBeInTheDocument());

    await act(async () => { await user.click(screen.getByText('Completed')); });

    await waitFor(() => {
      expect(screen.getByText(/No tasks match the current filters/)).toBeInTheDocument();
    });
  });

  test('handles API error on load', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => res(ctx.status(500)))
    );

    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no items exist', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json([])))
    );

    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Add one above!')).toBeInTheDocument();
    });
  });
});
