const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const testUser = { name: 'Test User', email: 'test@example.com', password: 'Password123' };

describe('POST /api/v1/auth/register', () => {
  it('should register first user as admin', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should register second user as viewer', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Viewer', email: 'viewer@test.com', password: 'Password123',
    });
    expect(res.body.data.user.role).toBe('viewer');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.statusCode).toBe(409);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...testUser, email: 'bad' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...testUser, password: '123' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject missing name', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'a@b.com', password: 'Password123' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email, password: testUser.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email, password: 'WrongPass123',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@test.com', password: 'Password123',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/auth/profile', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.statusCode).toBe(401);
  });

  it('should return profile with valid token', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(testUser);
    const token = reg.body.data.accessToken;
    const res = await request(app).get('/api/v1/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should reject invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/profile').set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('RBAC', () => {
  it('should deny viewer from clearing logs', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const viewer = await request(app).post('/api/v1/auth/register').send({
      name: 'Viewer', email: 'v@test.com', password: 'Password123',
    });
    const res = await request(app).delete('/api/v1/predictions/logs')
      .set('Authorization', `Bearer ${viewer.body.data.accessToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should allow admin to clear logs', async () => {
    const admin = await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).delete('/api/v1/predictions/logs')
      .set('Authorization', `Bearer ${admin.body.data.accessToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/v1/health', () => {
  it('should return healthy', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });
});

describe('404', () => {
  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});