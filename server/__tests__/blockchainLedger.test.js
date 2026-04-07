const {
  buildLegacyBlockchainEvents,
  buildBlockchainTransparencySnapshot
} = require('../services/blockchainLedger');

describe('blockchainLedger transparency snapshot', () => {
  const originalSigningKey = process.env.TRANSPARENCY_AUDIT_SIGNING_KEY;

  beforeEach(() => {
    process.env.TRANSPARENCY_AUDIT_SIGNING_KEY = 'unit-test-signing-key';
  });

  afterAll(() => {
    if (originalSigningKey === undefined) {
      delete process.env.TRANSPARENCY_AUDIT_SIGNING_KEY;
      return;
    }

    process.env.TRANSPARENCY_AUDIT_SIGNING_KEY = originalSigningKey;
  });

  test('builds fallback ledger event from legacy blockchainTx', () => {
    const product = {
      productId: 'PRD-1',
      stages: ['Registered'],
      blockchainTx: '0xabc',
      blockchainStatus: 'confirmed',
      createdByWallet: 'owner@example.com',
      createdAt: '2026-04-01T00:00:00.000Z'
    };

    const legacyEvents = buildLegacyBlockchainEvents(product);

    expect(legacyEvents).toHaveLength(1);
    expect(legacyEvents[0].txHash).toBe('0xabc');
    expect(legacyEvents[0].status).toBe('confirmed');
  });

  test('creates normalized snapshot with stage proofs and summary', () => {
    const product = {
      productId: 'PRD-2',
      name: 'Test Product',
      origin: 'India',
      manufacturer: 'Acme Foods',
      stages: ['Registered', 'Processed'],
      certificationHash: 'hash-123',
      createdByWallet: 'owner@example.com',
      blockchainTx: '0xlatest',
      blockchainStatus: 'confirmed',
      blockchainEvents: [
        {
          action: 'register_product',
          stage: 'Registered',
          txHash: '0x111',
          status: 'confirmed',
          initiatedBy: 'owner@example.com',
          initiatedByRole: 'producer',
          recordedAt: '2026-04-01T00:00:00.000Z'
        },
        {
          action: 'update_stage',
          stage: 'Processed',
          txHash: '0x222',
          status: 'confirmed',
          initiatedBy: 'owner@example.com',
          initiatedByRole: 'producer',
          recordedAt: '2026-04-02T00:00:00.000Z'
        }
      ],
      stageEvents: [
        {
          stage: 'Processed',
          blockchainTxHash: '0x222',
          updatedBy: 'owner@example.com',
          verificationSummary: {
            status: 'allowed',
            reason: 'documents verified'
          },
          recordedAt: '2026-04-02T00:00:00.000Z'
        }
      ]
    };

    const onChain = [
      'PRD-2',
      'Test Product',
      'India',
      'Acme Foods',
      ['Registered', 'Processed'],
      'hash-123',
      '1712016000',
      'owner@example.com'
    ];

    const snapshot = buildBlockchainTransparencySnapshot(product, onChain);

    expect(snapshot.summary.ledgerEventCount).toBe(2);
    expect(snapshot.summary.stageProofCount).toBe(1);
    expect(snapshot.summary.confirmedCount).toBe(2);
    expect(snapshot.latestLedgerEvent.txHash).toBe('0x222');
    expect(snapshot.stageProofs[0].txHash).toBe('0x222');
    expect(snapshot.onChainProof.available).toBe(true);
    expect(snapshot.onChainProof.matches).toBe(true);
    expect(snapshot.verificationBadge.proofHash).toBeTruthy();
    expect(snapshot.verificationBadge.signed).toBe(true);
    expect(snapshot.verificationBadge.signature).toBeTruthy();
  });
});
