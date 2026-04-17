jest.mock('../middleware/enhancedAuth', () => ({
  auth: jest.fn()
}));

const { auth } = require('../middleware/enhancedAuth');
const requireAdminAuth = require('../middleware/requireAdminAuth');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('requireAdminAuth', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ADMIN_AUTH_BYPASS;
    delete process.env.ADMIN_AUTH_BYPASS_SECRET;
    delete process.env.ADMIN_AUTH_BYPASS_ALLOW_PRODUCTION;
  });

  test('denies non-admin users', () => {
    auth.mockImplementation((req, res, next) => {
      req.user = { email: 'user@example.com', role: 'consumer' };
      next();
    });

    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    requireAdminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows bypass when enabled for testing', () => {
    const originalBypass = process.env.ADMIN_AUTH_BYPASS;
    process.env.ADMIN_AUTH_BYPASS = 'true';

    const req = {
      headers: {
        'x-admin-bypass': 'true',
        'x-admin-email': 'tester@example.com'
      }
    };
    const res = createRes();
    const next = jest.fn();

    requireAdminAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({
      email: 'tester@example.com',
      role: 'admin'
    }));

    if (originalBypass === undefined) {
      delete process.env.ADMIN_AUTH_BYPASS;
    } else {
      process.env.ADMIN_AUTH_BYPASS = originalBypass;
    }
  });

  test('requires bypass secret outside test environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.ADMIN_AUTH_BYPASS = 'true';
    process.env.ADMIN_AUTH_BYPASS_SECRET = 'super-secret-bypass-token';

    auth.mockImplementation((req, res, next) => {
      req.user = { email: 'fallback@example.com', role: 'admin' };
      next();
    });

    const req = {
      headers: {
        'x-admin-bypass': 'true',
        'x-admin-email': 'tester@example.com'
      }
    };
    const res = createRes();
    const next = jest.fn();

    requireAdminAuth(req, res, next);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({
      email: 'fallback@example.com',
      role: 'admin'
    }));
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('allows bypass in development only with valid secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.ADMIN_AUTH_BYPASS = 'true';
    process.env.ADMIN_AUTH_BYPASS_SECRET = 'super-secret-bypass-token';

    const req = {
      headers: {
        'x-admin-bypass': 'true',
        'x-admin-bypass-secret': 'super-secret-bypass-token',
        'x-admin-email': 'tester@example.com'
      }
    };
    const res = createRes();
    const next = jest.fn();

    requireAdminAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({
      email: 'tester@example.com',
      role: 'admin'
    }));
    expect(auth).not.toHaveBeenCalled();
  });

  test('ignores bypass in production unless explicitly allowed', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_AUTH_BYPASS = 'true';
    process.env.ADMIN_AUTH_BYPASS_SECRET = 'super-secret-bypass-token';
    process.env.ADMIN_AUTH_BYPASS_ALLOW_PRODUCTION = 'false';

    auth.mockImplementation((req, res, next) => {
      req.user = { email: 'fallback@example.com', role: 'admin' };
      next();
    });

    const req = {
      headers: {
        'x-admin-bypass': 'true',
        'x-admin-bypass-secret': 'super-secret-bypass-token',
        'x-admin-email': 'tester@example.com'
      }
    };
    const res = createRes();
    const next = jest.fn();

    requireAdminAuth(req, res, next);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({
      email: 'fallback@example.com',
      role: 'admin'
    }));
    expect(next).toHaveBeenCalledTimes(1);
  });
});