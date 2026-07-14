const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

const createItem = async (name = 'Temp Item', due_date = null) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, due_date })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('due_date');
      expect(item).toHaveProperty('completed');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item without due date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Test Item' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Item');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body.due_date).toBeNull();
      expect(response.body.completed).toBe(0);
    });

    it('should create a new item with a due date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Test With Due Date', due_date: '2099-12-31' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.due_date).toBe('2099-12-31');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if due_date is invalid format', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Valid Name', due_date: 'not-a-date' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update the name of an existing item', async () => {
      const item = await createItem('Original Name');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.id).toBe(item.id);
    });

    it('should update the due date of an existing item', async () => {
      const item = await createItem('Item For Due Date Update');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ due_date: '2099-06-15' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBe('2099-06-15');
    });

    it('should mark an item as completed', async () => {
      const item = await createItem('Item To Complete');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ completed: true })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(1);
    });

    it('should return 404 for a non-existent item', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Ghost Item' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 if name is set to empty string', async () => {
      const item = await createItem('Item With Name');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid due_date format on update', async () => {
      const item = await createItem('Item Bad Date');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ due_date: '31/12/2099' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});