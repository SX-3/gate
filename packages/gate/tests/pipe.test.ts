import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../src/compiler';
import { length } from '../src/constraints/length';
import { max } from '../src/constraints/max';
import { min } from '../src/constraints/min';
import { refine } from '../src/constraints/refine';
import { GateError } from '../src/error';
import { pipe } from '../src/pipe';
import { to } from '../src/transform';
import { bigint } from '../src/types/bigint';
import { int, int64 } from '../src/types/int';
import { number } from '../src/types/number';
import { pattern } from '../src/types/pattern';
import { string } from '../src/types/string';

describe('pipe', () => {
  it('composes a single constraint', () => {
    const s = pipe(string, min(3));
    const p = parse(s);
    expect(p('abc')).toBe('abc');
    expect(() => p('ab')).toThrow(GateError);
  });

  it('composes multiple constraints', () => {
    const s = pipe(string(), min(3), max(10));
    const p = parse(s);
    expect(p('hello')).toBe('hello');
    expect(() => p('ab')).toThrow(GateError);
    expect(() => p('toolongstring')).toThrow(GateError);
  });

  it('works with pattern', () => {
    const p = parse(pattern(/^[a-z]+$/));
    expect(p('hello')).toBe('hello');
    expect(() => p('123')).toThrow(GateError);
  });

  it('works with int', () => {
    const s = pipe(int, min(0));
    const p = parse(s);
    expect(p(42)).toBe(42);
    expect(() => p(3.14)).toThrow(GateError);
  });

  it('works with length', () => {
    const s = pipe(string(), length(5));
    const p = parse(s);
    expect(p('hello')).toBe('hello');
    expect(() => p('hi')).toThrow(GateError);
  });

  it('works with refine (function)', () => {
    const s = pipe(string(), refine((v: string) => v.includes('@'), 'No @'));
    const p = parse(s);
    expect(p('a@b')).toBe('a@b');
    expect(() => p('ab')).toThrow(GateError);
  });

  it('works with refine (string \u2013 $ replacement)', () => {
    const s = pipe(string(), refine('$.length > 3', 'Too short'));
    const p = parse(s);
    expect(p('hello')).toBe('hello');
    expect(() => p('ab')).toThrow(GateError);
  });

  it('complex pipeline', () => {
    const s = pipe(
      int,
      min(5),
      max(100),
    );
    const p = parse(s);
    expect(p(50)).toBe(50);
    expect(() => p(3.5)).toThrow(GateError);
  });

  it('works with validate mode', () => {
    const s = pipe(string, min(3));
    const v = validate(s);
    expect(v('abc').issues).toBeUndefined();
    expect(v('ab').issues).toBeDefined();
  });

  it('works with check mode', () => {
    const s = pipe(string(), min(3));
    expect(check(s)('abc')).toBe(true);
    expect(check(s)('ab')).toBe(false);
  });

  it('preserves type through pipeline', () => {
    // TypeScript should infer Schema<string> throughout
    const s = pipe(pattern(/^[a-z]+$/), min(3), max(10));
    const p = parse(s);
    const result: string = p('hello');
    expect(result).toBe('hello');
  });

  it('preserves number type through pipeline', () => {
    const s = pipe(number(), min(0), max(100));
    const p = parse(s);
    const result: number = p(42);
    expect(result).toBe(42);
  });

  it('equivalent to nested calls', () => {
    const piped = pipe(string(), min(3), max(10));
    const nested = min(max(string(), 10), 3);
    const p1 = parse(piped);
    const p2 = parse(nested);
    expect(p1('hello')).toBe(p2('hello'));
  });

  // ── bigint ──
  it('works with bigint + min', () => {
    const s = pipe(bigint(), min(5n));
    const p = parse(s);
    expect(p(10n)).toBe(10n);
    expect(() => p(3n)).toThrow(GateError);
  });

  it('works with bigint + min + max', () => {
    const s = pipe(bigint(), min(0n), max(100n));
    const p = parse(s);
    expect(p(50n)).toBe(50n);
    expect(() => p(-1n)).toThrow(GateError);
    expect(() => p(101n)).toThrow(GateError);
  });

  it('works with int64 + min', () => {
    const s = pipe(int64, min(1000n));
    const p = parse(s);
    expect(p(5000n)).toBe(5000n);
    expect(() => p(500n)).toThrow(GateError);
    expect(() => p(42 as any)).toThrow(GateError);
  });

  it('works with bigint + refine (function)', () => {
    const s = pipe(bigint(), refine((v: bigint) => v % 2n === 0n, 'Not even'));
    const p = parse(s);
    expect(p(2n)).toBe(2n);
    expect(() => p(3n)).toThrow(GateError);
  });

  // ── to ──
  it('works with to (string \u2192 bigint)', () => {
    const s = pipe(string, to(bigint));
    const p = parse(s);
    expect(p('42')).toBe(42n);
    expect(() => p('abc')).toThrow(GateError);
  });

  it('works with to + constraints', () => {
    const s = pipe(string, to(number), min(0), max(100));
    const p = parse(s);
    expect(p('50')).toBe(50);
    expect(() => p('-5')).toThrow(GateError);
    expect(() => p('101')).toThrow(GateError);
  });

  it('to preserves type through pipeline', () => {
    const s = pipe(string, to(bigint), min(0n));
    const p = parse(s);
    const result: bigint = p('42');
    expect(result).toBe(42n);
  });
});
