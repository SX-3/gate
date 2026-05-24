import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { max } from '../../src/constraints/max';
import { min } from '../../src/constraints/min';
import { GateError } from '../../src/error';
import { array } from '../../src/types/array';
import { bigint } from '../../src/types/bigint';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';

describe('max', () => {
  it('number max', () => {
    const p = parse(max(number(), 10));
    expect(p(5)).toBe(5);
    expect(p(10)).toBe(10);
    expect(() => p(11)).toThrow(GateError);
  });

  it('string max length', () => {
    const p = parse(max(string(), 5));
    expect(p('abc')).toBe('abc');
    expect(p('abcde')).toBe('abcde');
    expect(() => p('abcdef')).toThrow(GateError);
  });

  it('array max length', () => {
    const p = parse(max(array(string()), 3));
    expect(p(['a'])).toEqual(['a']);
    expect(p(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(() => p(['a', 'b', 'c', 'd'])).toThrow(GateError);
  });

  it('custom message', () => {
    const p = parse(max(number(), 100, 'Too big'));
    try {
      p(101);
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Too big');
    }
  });

  it('validate mode', () => {
    const v = validate(max(number(), 10));
    expect(v(5).issues).toBeUndefined();
    expect(v(15).issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(max(number(), 10))(5)).toBe(true);
    expect(check(max(number(), 10))(15)).toBe(false);
  });

  it('chained: min + max on number', () => {
    const p = parse(min(max(number(), 100), 10));
    expect(p(50)).toBe(50);
    expect(() => p(5)).toThrow(GateError);
    expect(() => p(150)).toThrow(GateError);
  });

  // ── bigint ──
  it('bigint max', () => {
    const p = parse(max(bigint(), 100n));
    expect(p(50n)).toBe(50n);
    expect(p(100n)).toBe(100n);
    expect(() => p(101n)).toThrow(GateError);
  });

  it('bigint max validate mode', () => {
    const v = validate(max(bigint(), 50n));
    expect(v(25n).issues).toBeUndefined();
    expect(v(100n).issues).toBeDefined();
  });

  it('bigint max check mode', () => {
    expect(check(max(bigint(), 50n))(25n)).toBe(true);
    expect(check(max(bigint(), 50n))(100n)).toBe(false);
  });
});
