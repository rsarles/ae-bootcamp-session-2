import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const TODAY = new Date().toISOString().slice(0, 10);

const getDueDateLabel = (dueDate, completed) => {
  if (!dueDate) return null;
  if (completed) return null;
  if (dueDate < TODAY) return 'overdue';
  if (dueDate === TODAY) return 'due-today';
  return null;
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItem.trim(), due_date: newDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([result, ...data]);
      setNewItem('');
      setNewDueDate('');
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDueDate(item.due_date || '');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditDueDate('');
  };

  const handleEditSave = async (itemId) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), due_date: editDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updated = await response.json();
      setData(data.map(item => item.id === itemId ? updated : item));
      setEditingId(null);
      setEditName('');
      setEditDueDate('');
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error updating item:', err);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updated = await response.json();
      setData(data.map(i => i.id === item.id ? updated : i));
    } catch (err) {
      setError('Error updating item: ' + err.message);
      console.error('Error toggling complete:', err);
    }
  };

  const hasActiveFilters = statusFilter !== 'all' || dueDateFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setDueDateFilter('all');
  };

  const displayedItems = useMemo(() => {
    let items = [...data];

    if (statusFilter === 'active') {
      items = items.filter(item => !item.completed);
    } else if (statusFilter === 'completed') {
      items = items.filter(item => item.completed);
    }

    if (dueDateFilter === 'overdue') {
      items = items.filter(item => item.due_date && item.due_date < TODAY && !item.completed);
    } else if (dueDateFilter === 'today') {
      items = items.filter(item => item.due_date === TODAY);
    } else if (dueDateFilter === 'week') {
      const weekOut = new Date();
      weekOut.setDate(weekOut.getDate() + 7);
      const weekStr = weekOut.toISOString().slice(0, 10);
      items = items.filter(item => item.due_date && item.due_date >= TODAY && item.due_date <= weekStr);
    } else if (dueDateFilter === 'none') {
      items = items.filter(item => !item.due_date);
    }

    items.sort((a, b) => {
      switch (sortBy) {
        case 'due_asc':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        case 'due_desc':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return b.due_date.localeCompare(a.due_date);
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'title_asc':
          return a.name.localeCompare(b.name);
        case 'title_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return items;
  }, [data, sortBy, statusFilter, dueDateFilter]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-item-section">
          <h2>Add New Task</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter task name"
              aria-label="Task name"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              aria-label="Due date (optional)"
              className="date-input"
            />
            <button type="submit">Add Task</button>
          </form>
        </section>

        <section className="items-section">
          <div className="toolbar">
            <div className="toolbar-group">
              <label htmlFor="sort-select">Sort by</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_desc">Created (newest)</option>
                <option value="created_asc">Created (oldest)</option>
                <option value="due_asc">Due date (soonest)</option>
                <option value="due_desc">Due date (latest)</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
            </div>

            <div className="toolbar-group">
              <span className="filter-label">Status</span>
              <div className="filter-pills" role="group" aria-label="Filter by status">
                {['all', 'active', 'completed'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`pill-btn${statusFilter === f ? ' active' : ''}`}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="toolbar-group">
              <label htmlFor="due-filter">Due date</label>
              <select
                id="due-filter"
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="week">Due this week</option>
                <option value="none">No due date</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </div>

          <h2>Tasks {hasActiveFilters && <span className="filter-badge">{displayedItems.length}</span>}</h2>

          {loading && <p>Loading data...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && !error && (
            <ul aria-live="polite">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => {
                  const dueDateLabel = getDueDateLabel(item.due_date, item.completed);
                  const isEditing = editingId === item.id;

                  return (
                    <li key={item.id} className={item.completed ? 'completed' : ''}>
                      <input
                        type="checkbox"
                        checked={!!item.completed}
                        onChange={() => handleToggleComplete(item)}
                        aria-label={`Mark "${item.name}" as ${item.completed ? 'active' : 'completed'}`}
                      />

                      {isEditing ? (
                        <div className="edit-fields">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            aria-label="Edit task name"
                          />
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            aria-label="Edit due date"
                            className="date-input"
                          />
                        </div>
                      ) : (
                        <span className="task-name">
                          {item.name}
                          {item.due_date && (
                            <span className={`due-date${dueDateLabel ? ` ${dueDateLabel}` : ''}`}>
                              {dueDateLabel === 'overdue' && <span className="due-badge">Overdue</span>}
                              {dueDateLabel === 'due-today' && <span className="due-badge today">Due today</span>}
                              {item.due_date}
                            </span>
                          )}
                        </span>
                      )}

                      <div className="item-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="save-btn"
                              onClick={() => handleEditSave(item.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="cancel-btn"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() => handleEditStart(item)}
                              aria-label={`Edit "${item.name}"`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="delete-btn"
                              aria-label={`Delete "${item.name}"`}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="empty-state">
                  {hasActiveFilters
                    ? 'No tasks match the current filters.'
                    : 'No tasks yet. Add one above!'}
                </li>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
