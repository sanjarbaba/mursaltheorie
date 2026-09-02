export const ACCOUNT_DELETE_CONFIRMATION = 'VERWIJDER MIJN ACCOUNT';

export function validDeletionConfirmation(body) {
  return Boolean(body && !Array.isArray(body) && body.confirmation === ACCOUNT_DELETE_CONFIRMATION);
}

export function accountExport({ profile, progress, examAttempts, entitlements, devices }, exportedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1,
    exportedAt,
    profile: profile || null,
    progress: progress || [],
    examAttempts: examAttempts || [],
    entitlements: entitlements || [],
    devices: (devices || []).map(({ push_token: _pushToken, ...device }) => device)
  };
}
