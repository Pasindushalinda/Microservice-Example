import { describe, expect, it } from 'vitest';
import { permissionsFromToken } from './permissions';

function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

describe('permissionsFromToken', () => {
  it('reads an array permissions claim', () => {
    const token = makeToken({ permissions: ['events:read', 'events:update'] });
    const perms = permissionsFromToken(token);
    expect(perms.has('events:update')).toBe(true);
    expect(perms.has('categories:update')).toBe(false);
  });

  it('reads a space-delimited permissions claim', () => {
    const token = makeToken({ permissions: 'events:read tickets:read' });
    expect(permissionsFromToken(token).has('tickets:read')).toBe(true);
  });

  it('returns an empty set for a token with no permissions', () => {
    expect(permissionsFromToken(makeToken({ sub: 'x' })).size).toBe(0);
    expect(permissionsFromToken(undefined).size).toBe(0);
  });
});
