jest.mock('../models/Product', () => ({
  find: jest.fn()
}));

jest.mock('../models/AdminActionLog', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn()
}));

const adminController = require('../models/controllers/adminController');
const Product = require('../models/Product');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn()
  };
}

describe('adminController.exportTransparencyAudit', () => {
  const originalContractAddress = process.env.CONTRACT_ADDRESS;
  const originalSigningKey = process.env.TRANSPARENCY_AUDIT_SIGNING_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
    process.env.TRANSPARENCY_AUDIT_SIGNING_KEY = 'audit-signing-key';
  });

  afterAll(() => {
    if (originalContractAddress === undefined) {
      delete process.env.CONTRACT_ADDRESS;
    } else {
      process.env.CONTRACT_ADDRESS = originalContractAddress;
    }

    if (originalSigningKey === undefined) {
      delete process.env.TRANSPARENCY_AUDIT_SIGNING_KEY;
    } else {
      process.env.TRANSPARENCY_AUDIT_SIGNING_KEY = originalSigningKey;
    }
  });

  function mockFindChain(records) {
    const lean = jest.fn().mockResolvedValue(records);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    Product.find.mockReturnValue({ sort });
    return { lean, limit, sort };
  }

  test('exports transparency audit as json attachment', async () => {
    const records = [
      {
        productId: 'P-JSON-1',
        name: 'Product One',
        manufacturer: 'Acme Foods',
        origin: 'India',
        createdByWallet: 'owner@example.com',
        blockchainStatus: 'confirmed',
        blockchainTx: '0xjson1',
        blockchainEvents: [
          {
            action: 'register_product',
            status: 'confirmed',
            txHash: '0xjson1',
            recordedAt: '2026-04-05T00:00:00.000Z'
          }
        ],
        stageEvents: [],
        verification: {
          status: 'allowed',
          reviewState: 'verified',
          riskScore: 12
        },
        createdAt: '2026-04-05T00:00:00.000Z',
        updatedAt: '2026-04-05T00:00:00.000Z'
      }
    ];

    mockFindChain(records);

    const req = { query: { format: 'json', productId: 'P-JSON-1', limit: '10' } };
    const res = createRes();

    await adminController.exportTransparencyAudit(req, res);

    expect(Product.find).toHaveBeenCalledWith({ productId: 'P-JSON-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/json; charset=utf-8');
    expect(res.send).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(res.send.mock.calls[0][0]);
    expect(payload.success).toBe(true);
    expect(payload.totalRecords).toBe(1);
    expect(payload.records[0].transparency.verificationBadge.proofHash).toBeTruthy();
  });

  test('exports transparency audit as csv attachment', async () => {
    const records = [
      {
        productId: 'P-CSV-1',
        name: 'Product Csv',
        manufacturer: 'Acme Foods',
        origin: 'India',
        createdByWallet: 'owner@example.com',
        blockchainStatus: 'confirmed',
        blockchainTx: '0xcsv1',
        blockchainEvents: [
          {
            action: 'update_stage',
            stage: 'Processed',
            status: 'confirmed',
            txHash: '0xcsv1',
            recordedAt: '2026-04-06T00:00:00.000Z'
          }
        ],
        stageEvents: [
          {
            stage: 'Processed',
            blockchainTxHash: '0xcsv1',
            recordedAt: '2026-04-06T00:00:00.000Z'
          }
        ],
        verification: {
          status: 'allowed',
          reviewState: 'verified',
          riskScore: 20
        },
        createdAt: '2026-04-06T00:00:00.000Z',
        updatedAt: '2026-04-06T00:00:00.000Z'
      }
    ];

    mockFindChain(records);

    const req = { query: { format: 'csv', limit: '1' } };
    const res = createRes();

    await adminController.exportTransparencyAudit(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'text/csv; charset=utf-8');
    expect(res.send).toHaveBeenCalledTimes(1);

    const csv = res.send.mock.calls[0][0];
    expect(csv).toContain('productId,name,manufacturer,origin');
    expect(csv).toContain('P-CSV-1');
    expect(csv).toContain('proofHash');
  });

  test('returns 400 for unsupported format', async () => {
    const req = { query: { format: 'xml' } };
    const res = createRes();

    await adminController.exportTransparencyAudit(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
