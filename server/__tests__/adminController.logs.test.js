jest.mock('../models/Product', () => ({
  countDocuments: jest.fn(),
  find: jest.fn()
}));

jest.mock('../models/AdminActionLog', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn()
}));

const adminController = require('../models/controllers/adminController');
const AdminActionLog = require('../models/AdminActionLog');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('adminController.getActionLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns paginated logs with filters', async () => {
    const logs = [{ _id: '1', action: 'approve' }];

    const leanMock = jest.fn().mockResolvedValue(logs);
    const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

    AdminActionLog.find.mockReturnValue({ sort: sortMock });
    AdminActionLog.countDocuments.mockResolvedValue(11);

    const req = {
      query: {
        page: '2',
        limit: '5',
        action: 'approve',
        adminEmail: 'admin@example.com',
        startDate: '2026-04-01',
        endDate: '2026-04-07'
      }
    };
    const res = createRes();

    await adminController.getActionLogs(req, res);

    expect(AdminActionLog.find).toHaveBeenCalledTimes(1);
    const queryArg = AdminActionLog.find.mock.calls[0][0];

    expect(queryArg.action).toBe('approve');
    expect(queryArg.adminEmail).toBe('admin@example.com');
    expect(queryArg.createdAt).toBeDefined();
    expect(queryArg.createdAt.$gte).toBeInstanceOf(Date);
    expect(queryArg.createdAt.$lte).toBeInstanceOf(Date);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: logs,
      pagination: expect.objectContaining({
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true
      }),
      filters: expect.objectContaining({
        action: 'approve',
        adminEmail: 'admin@example.com'
      })
    }));
  });

  test('uses defaults and ignores invalid filters', async () => {
    const logs = [];

    const leanMock = jest.fn().mockResolvedValue(logs);
    const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

    AdminActionLog.find.mockReturnValue({ sort: sortMock });
    AdminActionLog.countDocuments.mockResolvedValue(0);

    const req = {
      query: {
        action: 'invalid-action',
        startDate: 'not-a-date',
        endDate: 'also-not-a-date'
      }
    };
    const res = createRes();

    await adminController.getActionLogs(req, res);

    expect(AdminActionLog.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      pagination: expect.objectContaining({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      })
    }));
  });
});
