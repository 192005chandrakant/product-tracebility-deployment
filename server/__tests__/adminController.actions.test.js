jest.mock('../models/Product', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn()
}));

jest.mock('../models/AdminActionLog', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn()
}));

const adminController = require('../models/controllers/adminController');
const Product = require('../models/Product');
const AdminActionLog = require('../models/AdminActionLog');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

function createBaseProduct() {
  return {
    productId: 'P-100',
    isActive: true,
    verification: {
      status: 'flagged',
      reviewState: 'pending_review',
      riskScore: 72,
      issues: ['mismatch'],
      criticalFailures: []
    },
    save: jest.fn().mockResolvedValue(true)
  };
}

describe('adminController.productAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approve marks product verified and active', async () => {
    const product = createBaseProduct();
    Product.findOne.mockResolvedValue(product);
    AdminActionLog.create.mockResolvedValue({});

    const req = {
      params: { id: 'P-100' },
      body: { action: 'approve', reason: 'Manual verification complete' },
      user: { email: 'admin@example.com', role: 'admin' }
    };
    const res = createRes();

    await adminController.productAction(req, res);

    expect(product.verification.status).toBe('allowed');
    expect(product.verification.reviewState).toBe('verified');
    expect(product.verificationStatus).toBe('allowed');
    expect(product.reviewedByAdmin).toBe('admin@example.com');
    expect(product.riskScore).toBe(72);
    expect(product.issues).toEqual(['mismatch']);
    expect(product.isActive).toBe(true);
    expect(product.save).toHaveBeenCalledTimes(1);
    expect(AdminActionLog.create).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        productId: 'P-100',
        status: 'allowed',
        reviewState: 'verified',
        isActive: true
      })
    }));
  });

  test('reject marks product blocked and keeps active', async () => {
    const product = createBaseProduct();
    Product.findOne.mockResolvedValue(product);
    AdminActionLog.create.mockResolvedValue({});

    const req = {
      params: { id: 'P-100' },
      body: { action: 'reject', reason: 'Critical mismatch' },
      user: { email: 'admin@example.com', role: 'admin' }
    };
    const res = createRes();

    await adminController.productAction(req, res);

    expect(product.verification.status).toBe('blocked');
    expect(product.verification.reviewState).toBe('rejected');
    expect(product.verificationStatus).toBe('blocked');
    expect(product.reviewedByAdmin).toBe('admin@example.com');
    expect(product.isActive).toBe(true);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        status: 'blocked',
        reviewState: 'rejected',
        isActive: true
      })
    }));
  });

  test('remove marks product blocked and inactive', async () => {
    const product = createBaseProduct();
    Product.findOne.mockResolvedValue(product);
    AdminActionLog.create.mockResolvedValue({});

    const req = {
      params: { id: 'P-100' },
      body: { action: 'remove', reason: 'Fraudulent document' },
      user: { email: 'admin@example.com', role: 'admin' }
    };
    const res = createRes();

    await adminController.productAction(req, res);

    expect(product.verification.status).toBe('blocked');
    expect(product.verification.reviewState).toBe('rejected');
    expect(product.verificationStatus).toBe('blocked');
    expect(product.reviewedByAdmin).toBe('admin@example.com');
    expect(product.isActive).toBe(false);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        status: 'blocked',
        reviewState: 'rejected',
        isActive: false
      })
    }));
  });

  test('invalid action returns 400', async () => {
    const req = {
      params: { id: 'P-100' },
      body: { action: 'invalid' },
      user: { email: 'admin@example.com', role: 'admin' }
    };
    const res = createRes();

    await adminController.productAction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
