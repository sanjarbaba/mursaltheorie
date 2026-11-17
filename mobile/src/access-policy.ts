export type AccessSnapshot = {
  userId: string | null;
  status: 'checking' | 'active' | 'denied' | 'error';
  validUntil: number;
};

// Authentication identifies an account. Only a server grant (or its unexpired,
// account-scoped offline lease) can unlock the course.
export function canOpenCourse(snapshot: AccessSnapshot, userId: string | null | undefined, signedIn: boolean, now = Date.now()): boolean {
  return signedIn && Boolean(userId) && snapshot.userId === userId
    && snapshot.status === 'active' && Number.isFinite(snapshot.validUntil)
    && snapshot.validUntil > now;
}

export function serverGrantExpiry(access: { hasAccess?: boolean; entitlements?: Array<{ ends_at?: string | null }> }, now = Date.now()): number {
  if (access.hasAccess !== true) return 0;
  const entitlements = access.entitlements || [];
  const ends = entitlements.map((item) => item.ends_at ? Date.parse(item.ends_at) : Infinity);
  // The provider revalidates once a minute without interrupting an active exam.
  const latest = ends.length ? Math.max(...ends) : Infinity;
  return latest === Infinity ? Number.MAX_SAFE_INTEGER : latest;
}
