import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { record } from '../../src/types/record';
import { string } from '../../src/types/string';

describe('record', () => {
  it('accepts object with matching values', () => {
    const p = parse(record(number()));
    expect(p({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(p({})).toEqual({});
  });

  it('rejects non-objects', () => {
    const p = parse(record(number()));
    expect(() => p(42)).toThrow(GateError);
    expect(() => p(null)).toThrow(GateError);
    expect(() => p('hello')).toThrow(GateError);
  });

  it('rejects invalid value types', () => {
    const p = parse(record(number()));
    expect(() => p({ a: 1, b: 'bad' })).toThrow(GateError);
  });

  it('custom message', () => {
    const p = parse(record(string(), 'Not an object'));
    try {
      p(null);
      expect.unreachable();
    }
    catch (error) {
      expect((error as GateError).message).toBe('Not an object');
    }
  });

  it('works with validate mode', () => {
    const v = validate(record(number()));
    expect(v({ a: 1 }).issues).toBeUndefined();
    expect(v({ a: 'bad' }).issues).toBeDefined();
  });

  it('works with check mode', () => {
    expect(check(record(number()))({ a: 1 })).toBe(true);
    expect(check(record(number()))({ a: 'bad' })).toBe(false);
  });

  it('works with nested objects', () => {
    const p = parse(record(object({ name: string() })));
    expect(p({ user: { name: 'Alice' } })).toEqual({ user: { name: 'Alice' } });
  });
});
