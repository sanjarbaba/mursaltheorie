export const ACCOUNT_DELETE_CONFIRMATION = 'VERWIJDER MIJN ACCOUNT';

export function validDeletionConfirmation(body) {
  return Boolean(body && !Array.isArray(body) && body.confirmation === ACCOUNT_DELETE_CONFIRMATION);
}

export function accountExport({ profile, progress, examAttempts, entitlements, purchases, devices }, exportedAt = new Date().toISOString()) {
  return {
    schemaVersion: 2,
    exportedAt,
    profile: profile || null,
    progress: progress || [],
    examAttempts: examAttempts || [],
    entitlements: entitlements || [],
    purchases: purchases || [],
    devices: (devices || []).map(({ push_token: _pushToken, ...device }) => device)
  };
}
