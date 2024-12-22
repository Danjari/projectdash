import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../app.mjs'; 
import { User, Team } from '../db.mjs';
import mongoose from 'mongoose';

describe('Authentication Routes', () => {
  let jwtStub, bcryptStub;

  const mockUser = {
    _id: new mongoose.Types.ObjectId('6749dea4c62ed2fa8c383cd7'), 
    username: 'moudja',
    email: 'mjdinc20@gmail.com',
    password: '$2b$10$Nnt17zM4gk/NCgrd/j0QMOhCvw7m2zNEDN.L/PSuYKm9.5TEhgFHu', 
    role: 'admin',
    team: new mongoose.Types.ObjectId('6749dea4c62ed2fa8c383cda'), 
  };

  const mockToken = jwt.sign(
    { id: mockUser._id, role: 'admin', teamId: 'team123' },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    // Mock bcrypt.compare and jwt.verify
    jwtStub = sinon.stub(jwt, 'verify').callsFake(() => ({
      id: mockUser._id,
      role: mockUser.role,
      teamId: mockUser.team,
    }));
    bcryptStub = sinon.stub(bcrypt, 'compare').resolves(true);
  });

  afterEach(() => {
    // Restore original functions
    sinon.restore();
  });

  describe('POST /register', () => {
    it('should register a new user and create a team', async () => {
      const teamSaveStub = sinon.stub(Team.prototype, 'save').resolves({ _id: 'team123' });
      const userSaveStub = sinon.stub(User.prototype, 'save').resolves(mockUser);

      const res = await request(app).post('/register').send({
        username: 'testuser',
        email: 'admin@ne.uwc.org',
        password: 'Test@1234',
        teamName: 'testTeam',
      });

      expect(res.status).to.equal(302); // Expect redirect on success
      expect(userSaveStub.calledOnce).to.be.true;
      expect(teamSaveStub.calledOnce).to.be.true;
    });

    it('should return an error if email is already registered', async () => {
      sinon.stub(User, 'findOne').resolves(mockUser);

      const res = await request(app).post('/register').send({
        username: 'testuser',
        email: 'admin@ne.uwc.org',
        password: 'Test@1234',
        teamName: 'testTeam',
      });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Email is already registered');
    });
  });

  describe('POST /login', () => {
    before(async () => {
        // Clean and insert mock data before tests
        await User.deleteMany({});
        await User.create(mockUser);
      });
    it('should login successfully and set auth cookie', async () => {
      sinon.stub(User, 'findOne').resolves(mockUser);

      const res = await request(app).post('/login').send({
        email: 'mjdinc20@gmail.com', password: '1234567890'
      });

      expect(res.status).to.equal(302); // Redirect to dashboard
      expect(res.headers['set-cookie']).to.exist;
    });

    it('should return 401 for invalid credentials', async () => {
      sinon.stub(User, 'findOne').resolves(mockUser);
      bcryptStub.resolves(false); // Password comparison fails

      const res = await request(app).post('/login').send({
        email: 'mjdinc20@gmail.com',
        password: 'WrongPassword',
      });

      expect(res.status).to.equal(401);
      expect(res.text).to.include('Invalid email or password');
    });
  });

  describe('Middleware: authenticate', () => {
    it('should pass if token is valid', async () => {
      const res = await request(app).get('/dashboard').set('Cookie', `auth_token=${mockToken}`);

      expect(res.status).to.not.equal(401);
    });

    it('should redirect to /login if token is missing or invalid', async () => {
      jwtStub.restore(); // Remove stub to simulate invalid token
      const res = await request(app).get('/dashboard');

      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal('/login');
    });
  });

  describe('Middleware: isAdmin', () => {
    it('should allow access if user is admin', async () => {
      const res = await request(app)
        .get('/project/create')
        .set('Cookie', `auth_token=${mockToken}`);

      expect(res.status).to.not.equal(403);
    });

    it('should deny access if user is not admin', async () => {
      jwtStub.callsFake(() => ({
        id: mockUser._id,
        role: 'member', // Not admin
        teamId: 'team123',
      }));

      const res = await request(app)
        .get('/project/create')
        .set('Cookie', `auth_token=${mockToken}`);

      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Forbidden: Admins only');
    });
  });
});
