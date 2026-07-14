const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

const createItem = async (name = 'Security Test Item') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');
  expect(response.status).toBe(201);
  return response.body;
};

describe('Security', () => {
  describe('SQL injection', () => {
    it('should safely handle SQL injection in POST name field', async () => {
      const payload = "'; DROP TABLE items; --";
      const response = await request(app)
        .post('/api/items')
        .send({ name: payload })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(payload);

      const check = await request(app).get('/api/items');
      expect(check.status).toBe(200);
      expect(Array.isArray(check.body)).toBe(true);
    });

    it('should safely handle SQL injection in PUT name field', async () => {
      const item = await createItem('Target Item');
      const payload = "' OR '1'='1";

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: payload })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(payload);

      const check = await request(app).get('/api/items');
      expect(check.status).toBe(200);
    });

    it('should safely handle SQL injection in due_date field', async () => {
      const item = await createItem('Due Date Injection Target');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ due_date: "2099-01-01'; DROP TABLE items; --" })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('XSS payloads', () => {
    it('should store XSS payload as plain text without executing it', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/items')
        .send({ name: xssPayload })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(xssPayload);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Malformed and oversized input', () => {
    it('should reject requests with no Content-Type on POST', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Accept', 'application/json')
        .send('plain string body');

      expect([400, 415]).toContain(response.status);
    });

    it('should reject non-string name values', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 12345 })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should ignore unexpected extra fields on POST', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Legit Item', admin: true, role: 'superuser' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty('admin');
      expect(response.body).not.toHaveProperty('role');
    });

    it('should ignore unexpected extra fields on PUT', async () => {
      const item = await createItem('Item Extra Fields');

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated', id: 9999, created_at: '2000-01-01', role: 'admin' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(item.id);
      expect(response.body).not.toHaveProperty('role');
    });
  });
});
