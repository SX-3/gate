import { describe, expect, expectTypeOf, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { boolean } from '../../src/types/boolean';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';
import { tuple } from '../../src/types/tuple';

describe('tuple', () => {
  it('accepts matching tuple', () => {
    const p = parse(tuple([string(), number(), boolean()]));
    expect(p(['hello', 42, true])).toEqual(['hello', 42, true]);
  });

  it('rejects wrong length', () => {
    const p = parse(tuple([string(), number()]));
    expectTypeOf(p).returns.toEqualTypeOf<[string, number]>();
    expect(() => p(['only one'])).toThrow(GateError);
    expect(() => p(['one', 2, 'three'])).toThrow(GateError);
  });

  it('rejects non-array', () => {
    const p = parse(tuple([string()]));
    expect(() => p(42)).toThrow(GateError);
    expect(() => p({})).toThrow(GateError);
  });

  it('rejects wrong element types', () => {
    const p = parse(tuple([string(), number()]));
    expect(() => p([42, 'hello'])).toThrow(GateError);
    expect(() => p(['hello', 'world'])).toThrow(GateError);
  });

  it('empty tuple', () => {
    const p = parse(tuple([]));
    expect(p([])).toEqual([]);
    expect(() => p([1])).toThrow(GateError);
  });

  it('custom message', () => {
    const p = parse(tuple([string()], 'Expected string'));
    try {
      p(42);
      expect.unreachable();
    }
    catch (error) {
      expect((error as GateError).message).toBe('Expected string');
    }
  });

  it('works with validate mode', () => {
    const v = validate(tuple([string(), number()]));
    expect(v(['hello', 42]).issues).toBeUndefined();
    expect(v(['hello']).issues).toBeDefined();
  });

  it('works with check mode', () => {
    expect(check(tuple([string(), number()]))(['hello', 42])).toBe(true);
    expect(check(tuple([string(), number()]))(['hello'])).toBe(false);
  });

  it('single element tuple', () => {
    const p = parse(tuple([string()]));
    expect(p(['hello'])).toEqual(['hello']);
  });
});
