import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { min } from '../../src/constraints/min';
import { GateError } from '../../src/error';
import { array } from '../../src/types/array';
import { bigint } from '../../src/types/bigint';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';

describe('min', () => {
  it('number min', () => {
    const p = parse(min(number(), 5));
    expect(p(10)).toBe(10);
    expect(p(5)).toBe(5);
    expect(() => p(4)).toThrow(GateError);
  });

  it('string min length', () => {
    const p = parse(min(string(), 3));
    expect(p('abc')).toBe('abc');
    expect(p('abcdef')).toBe('abcdef');
    expect(() => p('ab')).toThrow(GateError);
  });

  it('array min length', () => {
    const p = parse(min(array(string()), 2));
    expect(p(['a', 'b'])).toEqual(['a', 'b']);
    expect(p(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(() => p(['a'])).toThrow(GateError);
  });

  it('custom message', () => {
    const p = parse(min(number(), 0, 'Must be positive'));
    try {
      p(-1);
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Must be positive');
    }
  });

  it('validate mode', () => {
    const v = validate(min(number(), 5));
    expect(v(10).issues).toBeUndefined();
    expect(v(2).issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(min(number(), 5))(10)).toBe(true);
    expect(check(min(number(), 5))(2)).toBe(false);
  });

  // ── bigint ──
  it('bigint min', () => {
    const p = parse(min(bigint(), 10n));
    expect(p(10n)).toBe(10n);
    expect(p(100n)).toBe(100n);
    expect(() => p(9n)).toThrow(GateError);
    expect(() => p(0n)).toThrow(GateError);
  });

  it('bigint min validate mode', () => {
    const v = validate(min(bigint(), 50n));
    expect(v(100n).issues).toBeUndefined();
    expect(v(40n).issues).toBeDefined();
  });

  it('bigint min check mode', () => {
    expect(check(min(bigint(), 50n))(100n)).toBe(true);
    expect(check(min(bigint(), 50n))(40n)).toBe(false);
  });
});
