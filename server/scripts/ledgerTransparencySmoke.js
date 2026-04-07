function parseBool(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Login failed (${response.status}): ${text}`);
  }

  const payload = JSON.parse(text);
  ensure(payload && payload.token, 'Login response did not include token');
  return payload.token;
}

async function runStageUpdate(baseUrl, token, productId, password, stage) {
  const form = new FormData();
  form.append('stage', stage);
  form.append('password', password);
  form.append('stageDocumentsMeta', '[]');

  const response = await fetch(`${baseUrl}/api/update-product/${encodeURIComponent(productId)}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`
    },
    body: form
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Update failed (${response.status}): ${text}`);
  }

  return JSON.parse(text);
}

async function fetchPublicProduct(baseUrl, productId) {
  const response = await fetch(`${baseUrl}/api/product/${encodeURIComponent(productId)}`);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Public product fetch failed (${response.status}): ${text}`);
  }

  return JSON.parse(text);
}

function validateLedger(publicProduct) {
  const blockchainEvents = Array.isArray(publicProduct.blockchainEvents)
    ? publicProduct.blockchainEvents
    : [];

  ensure(blockchainEvents.length > 0, 'Expected blockchainEvents to contain at least one entry');

  const latest = blockchainEvents[blockchainEvents.length - 1];
  ensure(latest && latest.txHash, 'Latest blockchain event is missing txHash');
  ensure(latest && latest.explorerUrl, 'Latest blockchain event is missing explorerUrl');
  ensure(
    String(latest.explorerUrl).startsWith('https://sepolia.etherscan.io/tx/'),
    'Latest explorerUrl does not use expected Etherscan prefix'
  );
  ensure(
    String(latest.explorerUrl).includes(String(latest.txHash)),
    'Latest explorerUrl does not include latest txHash'
  );

  const stageEvents = Array.isArray(publicProduct.stageEvents)
    ? publicProduct.stageEvents
    : [];
  ensure(stageEvents.length > 0, 'Expected stageEvents to contain at least one entry');

  return {
    blockchainEventsCount: blockchainEvents.length,
    latestAction: latest.action || null,
    latestStatus: latest.status || null,
    latestTxHash: latest.txHash || null,
    latestExplorerUrl: latest.explorerUrl || null,
    stageEventsCount: stageEvents.length,
    verificationStatus: publicProduct.verification && publicProduct.verification.status
      ? publicProduct.verification.status
      : null
  };
}

async function main() {
  const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5001';
  const email = process.env.LEDGER_SMOKE_EMAIL;
  const password = process.env.LEDGER_SMOKE_PASSWORD;
  const productId = process.env.LEDGER_SMOKE_PRODUCT_ID;
  const stage = process.env.LEDGER_SMOKE_STAGE || 'Processed';
  const runUpdate = parseBool(process.env.LEDGER_SMOKE_RUN_UPDATE, true);

  ensure(email, 'LEDGER_SMOKE_EMAIL is required');
  ensure(password, 'LEDGER_SMOKE_PASSWORD is required');
  ensure(productId, 'LEDGER_SMOKE_PRODUCT_ID is required');

  const token = await login(baseUrl, email, password);

  let updateResult = null;
  if (runUpdate) {
    updateResult = await runStageUpdate(baseUrl, token, productId, password, stage);
  }

  const publicProduct = await fetchPublicProduct(baseUrl, productId);
  const ledgerResult = validateLedger(publicProduct);

  const summary = {
    baseUrl,
    productId,
    runUpdate,
    updateMessage: updateResult && updateResult.message ? updateResult.message : null,
    ...ledgerResult
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`Ledger transparency smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
