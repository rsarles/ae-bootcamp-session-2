const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = [
  { name: 'Item 1', due_date: null },
  { name: 'Item 2', due_date: null },
  { name: 'Item 3', due_date: null },
];
const insertStmt = db.prepare('INSERT INTO items (name, due_date) VALUES (?, ?)');

initialItems.forEach(item => {
  insertStmt.run(item.name, item.due_date);
});

console.log('In-memory database initialized with sample data');

const getItemById = (id) => db.prepare('SELECT * FROM items WHERE id = ?').get(id);
const updateStmt = db.prepare(
  'UPDATE items SET name = ?, due_date = ?, completed = ? WHERE id = ?'
);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, due_date } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (due_date !== undefined && due_date !== null) {
      if (typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
        return res.status(400).json({ error: 'due_date must be a valid date in YYYY-MM-DD format' });
      }
    }

    const result = insertStmt.run(name.trim(), due_date || null);
    const id = result.lastInsertRowid;

    const newItem = getItemById(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existing = getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { name, due_date, completed } = req.body;

    const updatedName = (name !== undefined)
      ? (typeof name === 'string' && name.trim() !== '' ? name.trim() : null)
      : existing.name;

    if (updatedName === null) {
      return res.status(400).json({ error: 'Item name cannot be empty' });
    }

    if (due_date !== undefined && due_date !== null) {
      if (typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
        return res.status(400).json({ error: 'due_date must be a valid date in YYYY-MM-DD format' });
      }
    }

    const updatedDueDate = due_date !== undefined ? (due_date || null) : existing.due_date;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;

    updateStmt.run(updatedName, updatedDueDate, updatedCompleted, id);
    const updatedItem = getItemById(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = getItemById(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db, insertStmt, updateStmt };