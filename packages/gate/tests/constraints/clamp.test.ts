import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { clamp } from '../../src/constraints/clamp';
import { GateError } from '../../src/error';
import { array } from '../../src/types/array';
import { bigint } from '../../src/types/bigint';
import { int, int64, uint64 } from '../../src/types/int';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';

describe('clamp', () => {
  // ── number ──
  it('number clamp', () => {
    const p = parse(clamp(number(), 5, 10));
    expect(p(5)).toBe(5);
    expect(p(7)).toBe(7);
    expect(p(10)).toBe(10);
    expect(() => p(4)).toThrow(GateError);
    expect(() => p(11)).toThrow(GateError);
  });

  it('number clamp with int', () => {
    const p = parse(clamp(int, 0, 100));
    expect(p(0)).toBe(0);
    expect(p(50)).toBe(50);
    expect(p(100)).toBe(100);
    expect(() => p(-1)).toThrow(GateError);
    expect(() => p(101)).toThrow(GateError);
    expect(() => p(3.14)).toThrow(GateError); // not an integer
  });

  // ── bigint ──
  it('bigint clamp', () => {
    const p = parse(clamp(bigint(), 0n, 100n));
    expect(p(0n)).toBe(0n);
    expect(p(50n)).toBe(50n);
    expect(p(100n)).toBe(100n);
    expect(() => p(-1n)).toThrow(GateError);
    expect(() => p(101n)).toThrow(GateError);
  });

  it('bigint clamp with int64', () => {
    const p = parse(clamp(int64, 0n, 1000n));
    expect(p(0n)).toBe(0n);
    expect(p(500n)).toBe(500n);
    expect(p(1000n)).toBe(1000n);
    expect(() => p(-1n)).toThrow(GateError);
    expect(() => p(1001n)).toThrow(GateError);
  });

  it('bigint clamp with uint64', () => {
    const p = parse(clamp(uint64, 100n, 200n));
    expect(p(100n)).toBe(100n);
    expect(p(150n)).toBe(150n);
    expect(p(200n)).toBe(200n);
    expect(() => p(99n)).toThrow(GateError);
    expect(() => p(201n)).toThrow(GateError);
  });

  // ── string length ──
  it('string length clamp', () => {
    const p = parse(clamp(string(), 3, 5));
    expect(p('abc')).toBe('abc');
    expect(p('abcd')).toBe('abcd');
    expect(p('abcde')).toBe('abcde');
    expect(() => p('ab')).toThrow(GateError); // too short
    expect(() => p('abcdef')).toThrow(GateError); // too long
  });

  // ── array length ──
  it('array length clamp', () => {
    const p = parse(clamp(array(string()), 1, 3));
    expect(p(['a'])).toEqual(['a']);
    expect(p(['a', 'b'])).toEqual(['a', 'b']);
    expect(p(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(() => p([])).toThrow(GateError);
    expect(() => p(['a', 'b', 'c', 'd'])).toThrow(GateError);
  });

  // ── pipe mode ──
  it('pipe mode: clamp(min, max) as function', () => {
    const p = parse(clamp(0, 100)(number()));
    expect(p(50)).toBe(50);
    expect(() => p(-1)).toThrow(GateError);
    expect(() => p(101)).toThrow(GateError);
  });

  it('pipe mode with bigint', () => {
    const p = parse(clamp(10n, 20n)(bigint()));
    expect(p(15n)).toBe(15n);
    expect(() => p(9n)).toThrow(GateError);
    expect(() => p(21n)).toThrow(GateError);
  });

  // ── custom message ──
  it('custom message', () => {
    const p = parse(clamp(number(), 0, 10, 'Out of range'));
    try {
      p(-1);
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Out of range');
    }
  });

  // ── validate mode ──
  it('validate mode (number)', () => {
    const v = validate(clamp(number(), 5, 10));
    expect(v(7).issues).toBeUndefined();
    expect(v(3).issues).toBeDefined();
    expect(v(15).issues).toBeDefined();
  });

  it('validate mode (bigint)', () => {
    const v = validate(clamp(bigint(), 0n, 50n));
    expect(v(25n).issues).toBeUndefined();
    expect(v(-1n).issues).toBeDefined();
    expect(v(100n).issues).toBeDefined();
  });

  // ── check mode ──
  it('check mode (number)', () => {
    expect(check(clamp(number(), 5, 10))(7)).toBe(true);
    expect(check(clamp(number(), 5, 10))(3)).toBe(false);
    expect(check(clamp(number(), 5, 10))(15)).toBe(false);
  });

  it('check mode (bigint)', () => {
    expect(check(clamp(bigint(), 0n, 50n))(25n)).toBe(true);
    expect(check(clamp(bigint(), 0n, 50n))(-1n)).toBe(false);
    expect(check(clamp(bigint(), 0n, 50n))(100n)).toBe(false);
  });
});
