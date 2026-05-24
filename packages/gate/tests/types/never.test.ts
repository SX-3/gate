import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { never } from '../../src/types/never';

describe('never', () => {
  it('rejects any value in parse mode', () => {
    const p = parse(never);
    expect(() => p(42)).toThrow(GateError);
    expect(() => p('hello')).toThrow(GateError);
    expect(() => p(null)).toThrow(GateError);
    expect(() => p(undefined)).toThrow(GateError);
    expect(() => p({})).toThrow(GateError);
  });

  it('returns issues in validate mode', () => {
    const v = validate(never);
    expect(v(42).issues).toBeDefined();
    expect(v('any').issues).toBeDefined();
  });

  it('returns false in check mode', () => {
    expect(check(never)(42)).toBe(false);
    expect(check(never)('any')).toBe(false);
  });
});
