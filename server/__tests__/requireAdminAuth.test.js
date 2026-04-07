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
  beforeEach(() => {
    jest.clearAllMocks();
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
});