import type { AuthSession } from '../types/auth';

type JwtPayload = Record<string, unknown>;
type GlobalWithAtob = typeof globalThis & { atob?: (input: string) => string };

const ROLE_CLAIMS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

const PERMISSION_CLAIMS = ['permission', 'permissions'];

function normalizeClaimValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const payload = parts[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const scopedGlobal = globalThis as GlobalWithAtob;
  const atobFn = typeof scopedGlobal.atob === 'function' ? scopedGlobal.atob : null;

  if (!atobFn) {
    return null;
  }

  try {
    return JSON.parse(atobFn(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function extractClaims(payload: JwtPayload | null, keys: string[]) {
  if (!payload) {
    return [] as string[];
  }

  const wanted = new Set(keys.map(key => key.toLowerCase()));
  const collected: string[] = [];

  Object.entries(payload).forEach(([key, value]) => {
    if (!wanted.has(key.toLowerCase())) {
      return;
    }

    collected.push(...normalizeClaimValue(value));
  });

  return uniqueStrings(collected);
}

export function normalizeAuthSession(session: AuthSession | null | undefined): AuthSession | null {
  if (!session) {
    return null;
  }

  const payload = decodeJwtPayload(session.accessToken);
  const tokenRoles = extractClaims(payload, ROLE_CLAIMS);
  const tokenPermissions = extractClaims(payload, PERMISSION_CLAIMS);
  const currentRoles = session.roles ?? [];
  const currentPermissions = session.permissions ?? session.permission ?? [];

  return {
    ...session,
    roles: currentRoles.length > 0 ? currentRoles : tokenRoles,
    permissions: currentPermissions.length > 0 ? currentPermissions : tokenPermissions,
  };
}

export function getSessionRoles(session: AuthSession | null | undefined) {
  return session?.roles ?? [];
}

export function getSessionPermissions(session: AuthSession | null | undefined) {
  return session?.permissions ?? session?.permission ?? [];
}

export function hasSessionRole(session: AuthSession | null | undefined, roleName: string) {
  return getSessionRoles(session).some(role => role.toLowerCase() === roleName.toLowerCase());
}

export function hasSessionPermission(session: AuthSession | null | undefined, permissionName: string) {
  return getSessionPermissions(session).some(permission => permission.toLowerCase() === permissionName.toLowerCase());
}

export function isAdminSession(session: AuthSession | null | undefined) {
  return hasSessionRole(session, 'Admin');
}

export function hasPermission(session: AuthSession | null | undefined, permissionName: string) {
  return isAdminSession(session) || hasSessionPermission(session, permissionName);
}

export function canSwitchPanels(session: AuthSession | null | undefined) {
  const normalizedRoles = getSessionRoles(session).map(role => role.toLowerCase());
  const hasStudent = normalizedRoles.includes('client') || normalizedRoles.includes('student');
  const hasTeacher = normalizedRoles.includes('teacher');
  const hasAdmin = normalizedRoles.includes('admin');
  const panelCount = [hasStudent, hasTeacher, hasAdmin].filter(Boolean).length;
  return panelCount > 1;
}
