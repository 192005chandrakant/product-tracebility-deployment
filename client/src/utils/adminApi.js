import { apiRequest } from './apiConfig';

export async function getAdminOverview() {
  return apiRequest('/api/admin/overview', { method: 'GET' });
}

export async function getAdminDashboard() {
  return apiRequest('/api/admin/dashboard', { method: 'GET' });
}

export async function getFlaggedProducts() {
  return apiRequest('/api/admin/products/flagged', { method: 'GET' });
}

export async function getAdminActionLogs(params = 25) {
  const options = typeof params === 'number'
    ? { limit: params }
    : (params || {});

  const query = new URLSearchParams();

  if (options.page !== undefined) query.set('page', String(options.page));
  if (options.limit !== undefined) query.set('limit', String(options.limit));
  if (options.action) query.set('action', String(options.action));
  if (options.adminEmail) query.set('adminEmail', String(options.adminEmail));
  if (options.startDate) query.set('startDate', String(options.startDate));
  if (options.endDate) query.set('endDate', String(options.endDate));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/api/admin/actions${suffix}`, { method: 'GET' });
}

export async function getAdminProduct(productId) {
  return apiRequest(`/api/admin/product/${encodeURIComponent(productId)}`, { method: 'GET' });
}

export async function takeAdminAction(productId, action, reason = '') {
  return apiRequest(`/api/admin/product/${encodeURIComponent(productId)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, reason })
  });
}
