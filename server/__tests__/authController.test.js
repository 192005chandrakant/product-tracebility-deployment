jest.mock('../models/User', () => jest.fn());

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

jest.mock('../utils/firebaseVerification', () => ({
  verifyFirebaseToken: jest.fn(),
  extractUserFromClaims: jest.fn()
}));

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  verifyFirebaseToken,
  extractUserFromClaims
} = require('../utils/firebaseVerification');
const authController = require('../models/controllers/authController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.connection.readyState = 1;
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.ALLOW_ADMIN_REGISTRATION;
  });

  test('register normalizes email before saving', async () => {
    const createdUsers = [];
    User.findOne = jest.fn().mockResolvedValue(null);
    User.mockImplementation(function createUser(data) {
      const instance = {
        ...data,
        save: jest.fn().mockResolvedValue(undefined)
      };
      createdUsers.push(instance);
      return instance;
    });
    bcrypt.hash.mockResolvedValue('hashed-password');

    const req = {
      body: {
        email: '  NEW.USER@Example.COM ',
        password: 'secret123',
        role: 'producer'
      }
    };
    const res = createRes();

    await authController.register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'new.user@example.com' });
    expect(createdUsers).toHaveLength(1);
    expect(createdUsers[0].email).toBe('new.user@example.com');
    expect(createdUsers[0].role).toBe('producer');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('login rejects inactive accounts before password verification', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      email: 'inactive@example.com',
      password: 'hashed-password',
      isActive: false
    });

    const req = {
      body: {
        email: 'inactive@example.com',
        password: 'secret123'
      }
    };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Account inactive'
    }));
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('google login creates a new account with the requested role', async () => {
    const createdUsers = [];
    User.findOne = jest.fn().mockResolvedValue(null);
    User.mockImplementation(function createUser(data) {
      const instance = {
        ...data,
        _id: 'user-123',
        save: jest.fn().mockResolvedValue(undefined)
      };
      createdUsers.push(instance);
      return instance;
    });

    verifyFirebaseToken.mockResolvedValue({
      verified: true,
      claims: {
        email: 'google.user@example.com',
        uid: 'firebase-uid-1',
        picture: 'https://example.com/avatar.png'
      }
    });
    extractUserFromClaims.mockReturnValue({
      email: 'google.user@example.com',
      firstName: 'Google',
      lastName: 'User',
      googleUID: 'firebase-uid-1',
      profilePicture: 'https://example.com/avatar.png'
    });
    jwt.sign.mockReturnValue('jwt-token');

    const req = {
      body: {
        firebaseToken: 'firebase-token',
        role: 'producer',
        googleUser: {
          email: 'Google.User@Example.com',
          firstName: 'Google',
          lastName: 'User',
          profilePicture: 'https://example.com/avatar.png',
          googleUID: 'firebase-uid-1'
        }
      }
    };
    const res = createRes();

    await authController.googleLogin(req, res);

    expect(verifyFirebaseToken).toHaveBeenCalledWith('firebase-token');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'google.user@example.com' });
    expect(createdUsers).toHaveLength(1);
    expect(createdUsers[0].email).toBe('google.user@example.com');
    expect(createdUsers[0].role).toBe('producer');
    expect(createdUsers[0].oauth).toEqual(expect.objectContaining({
      provider: 'google',
      uid: 'firebase-uid-1'
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: 'jwt-token',
      role: 'producer',
      email: 'google.user@example.com'
    }));
  });
});