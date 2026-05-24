import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { min } from '../../src/constraints/min';
import { GateError } from '../../src/error';
import { int, int64, uint64 } from '../../src/types/int';

describe('int', () => {
  const p = parse(int);

  it('accepts integers', () => {
    expect(p(0)).toBe(0);
    expect(p(42)).toBe(42);
    expect(p(-7)).toBe(-7);
  });

  it('rejects non-integers', () => {
    expect(() => p(3.14)).toThrow(GateError);
    expect(() => p(Number.NaN)).toThrow(GateError);
  });

  it('custom message', () => {
    const p = parse(int('Need int'));
    try {
      p(1.5);
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Need int');
    }
  });

  it('validate mode', () => {
    const v = validate(int);
    expect(v(42).issues).toBeUndefined();
    expect(v(1.5).issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(int)(42)).toBe(true);
    expect(check(int)(1.5)).toBe(false);
  });

  it('chained: int + min', () => {
    const p = parse(min(int, 5));
    expect(p(5)).toBe(5);
    expect(() => p(-5)).toThrow(GateError);
    expect(() => p(2.5)).toThrow(GateError);
  });

  it('rejects bigint (int is number)', () => {
    expect(() => p(42n as any)).toThrow(GateError);
  });
});

describe('int64', () => {
  const p = parse(int64);

  it('accepts bigints in range', () => {
    expect(p(0n)).toBe(0n);
    expect(p(42n)).toBe(42n);
    expect(p(-7n)).toBe(-7n);
    expect(p(9223372036854775807n)).toBe(9223372036854775807n);
    expect(p(-9223372036854775808n)).toBe(-9223372036854775808n);
  });

  it('rejects non-bigints', () => {
    expect(() => p(42 as any)).toThrow(GateError);
    expect(() => p(3.14 as any)).toThrow(GateError);
  });

  it('validate mode', () => {
    const v = validate(int64);
    expect(v(100n).issues).toBeUndefined();
    expect(v(42 as any).issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(int64)(100n)).toBe(true);
    expect(check(int64)(42 as any)).toBe(false);
  });

  it('chained: int64 + min', () => {
    const p = parse(min(int64, 1000n));
    expect(p(1000n)).toBe(1000n);
    expect(p(5000n)).toBe(5000n);
    expect(() => p(500n)).toThrow(GateError);
    expect(() => p(3.14 as any)).toThrow(GateError);
  });
});

describe('uint64', () => {
  const p = parse(uint64);

  it('accepts unsigned bigints in range', () => {
    expect(p(0n)).toBe(0n);
    expect(p(42n)).toBe(42n);
    expect(p(18446744073709551615n)).toBe(18446744073709551615n);
  });

  it('rejects negative bigints', () => {
    expect(() => p(-1n)).toThrow(GateError);
  });

  it('rejects non-bigints', () => {
    expect(() => p(42 as any)).toThrow(GateError);
  });

  it('validate mode', () => {
    const v = validate(uint64);
    expect(v(0n).issues).toBeUndefined();
    expect(v(-1n).issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(uint64)(0n)).toBe(true);
    expect(check(uint64)(-1n)).toBe(false);
  });

  it('chained: uint64 + min', () => {
    const p = parse(min(uint64, 10n));
    expect(p(10n)).toBe(10n);
    expect(p(100n)).toBe(100n);
    expect(() => p(5n)).toThrow(GateError);
    expect(() => p(-1n)).toThrow(GateError);
  });
});
