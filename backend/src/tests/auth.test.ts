import request from 'supertest';
import { app } from '../app';
import { AuthService } from '../services/auth.service';
import { generateExternalId, encryptText, decryptText } from '../utils/crypto';

describe('OpsRadar Authentication & Security Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid credentials', async () => {
      jest.spyOn(AuthService, 'register').mockResolvedValue({
        user: {
          _id: '60c72b2f9b1d8b2badbee556',
          name: 'DevOps Engineer',
          email: 'engineer@opsradar.io',
          passwordHash: 'hashed_password',
          createdAt: new Date()
        } as any,
        tokens: {
          accessToken: 'mock_access_token_123',
          refreshToken: 'mock_refresh_token_123',
          expiresIn: '15m'
        }
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'DevOps Engineer',
          email: 'engineer@opsradar.io',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('engineer@opsradar.io');
      expect(res.body.data.tokens.accessToken).toBe('mock_access_token_123');
    });

    it('should fail registration when password is weak', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'DevOps Engineer',
          email: 'engineer2@opsradar.io',
          password: 'weak'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration if email is already registered', async () => {
      const conflictError: any = new Error('An account with this email address already exists.');
      conflictError.statusCode = 409;
      conflictError.isOperational = true;
      jest.spyOn(AuthService, 'register').mockRejectedValue(conflictError);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing User',
          email: 'existing@opsradar.io',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with correct credentials', async () => {
      jest.spyOn(AuthService, 'login').mockResolvedValue({
        user: {
          _id: '60c72b2f9b1d8b2badbee555',
          name: 'Existing User',
          email: 'existing@opsradar.io',
          passwordHash: 'hashed_password',
          createdAt: new Date()
        } as any,
        tokens: {
          accessToken: 'mock_login_access_token',
          refreshToken: 'mock_login_refresh_token',
          expiresIn: '15m'
        }
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@opsradar.io',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBe('mock_login_access_token');
    });

    it('should reject login with wrong password', async () => {
      const authError: any = new Error('Invalid email or password credentials.');
      authError.statusCode = 401;
      authError.isOperational = true;
      jest.spyOn(AuthService, 'login').mockRejectedValue(authError);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@opsradar.io',
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Cryptographic External ID & At-Rest Encryption', () => {
    it('should generate a unique cryptographically random external ID', () => {
      const id1 = generateExternalId();
      const id2 = generateExternalId();
      expect(id1).toMatch(/^opsradar-[0-9a-f-]+-[0-9a-f]+$/);
      expect(id1).not.toEqual(id2);
    });

    it('should encrypt and decrypt sensitive metadata using AES-256-GCM', () => {
      const secretMetadata = 'sensitive-account-config-data-12345';
      const encrypted = encryptText(secretMetadata);
      expect(encrypted.encryptedData).not.toEqual(secretMetadata);

      const decrypted = decryptText(encrypted.encryptedData, encrypted.iv, encrypted.tag);
      expect(decrypted).toEqual(secretMetadata);
    });
  });
});
