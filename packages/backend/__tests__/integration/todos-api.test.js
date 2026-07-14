const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

afterEach(() => {
  db.prepare("DELETE FROM items WHERE name LIKE 'Integration Test%'").run();
});

const createItem = async (name, due_date = null) => {
  const response = await request(app)
    .post('/api/items')
    .send({ name, due_date })
    .set('Accept', 'application/json');
  expect(response.status).toBe(201);
  return response.body;
};

describe('Todos API — integration', () => {
  describe('GET /api/items', () => {
    it('should return 200 and an array of items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return items with the expected schema', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('due_date');
      expect(item).toHaveProperty('completed');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create an item and return 201 with the new item', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Integration Test Create' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Integration Test Create');
      expect(response.body.due_date).toBeNull();
      expect(response.body.completed).toBe(0);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should persist the item so it appears in GET /api/items', async () => {
      const created = await createItem('Integration Test Persist');

      const listResponse = await request(app).get('/api/items');
      const found = listResponse.body.find(i => i.id === created.id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Integration Test Persist');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an item name and return the updated item', async () => {
      const item = await createItem('Integration Test Before Update');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Integration Test After Update' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Integration Test After Update');
      expect(response.body.id).toBe(item.id);
    });

    it('should persist the update so GET reflects the change', async () => {
      const item = await createItem('Integration Test To Edit');

      await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Integration Test Edited' })
        .set('Accept', 'application/json');

      const listResponse = await request(app).get('/api/items');
      const found = listResponse.body.find(i => i.id === item.id);
      expect(found.name).toBe('Integration Test Edited');
    });

    it('should update completed status', async () => {
      const item = await createItem('Integration Test Complete Toggle');

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
        .send({ name: 'Ghost' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an item and return 200 with confirmation', async () => {
      const item = await createItem('Integration Test To Delete');

      const response = await request(app).delete(`/api/items/${item.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.id).toBe(item.id);
    });

    it('should remove the item from GET after deletion', async () => {
      const item = await createItem('Integration Test Delete Persist');

      await request(app).delete(`/api/items/${item.id}`);

      const listResponse = await request(app).get('/api/items');
      const found = listResponse.body.find(i => i.id === item.id);
      expect(found).toBeUndefined();
    });

    it('should return 404 when deleting a non-existent item', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
    });
  });
});
