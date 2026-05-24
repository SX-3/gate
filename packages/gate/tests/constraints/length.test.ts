import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { length } from '../../src/constraints/length';
import { GateError } from '../../src/error';
import { array } from '../../src/types/array';
import { string } from '../../src/types/string';

describe('length', () => {
  it('string exact length', () => {
    const p = parse(length(string(), 5));
    expect(p('hello')).toBe('hello');
    expect(() => p('hi')).toThrow(GateError);
    expect(() => p('too long')).toThrow(GateError);
  });

  it('array exact length', () => {
    const p = parse(length(array(string()), 2));
    expect(p(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => p(['a'])).toThrow(GateError);
    expect(() => p(['a', 'b', 'c'])).toThrow(GateError);
  });

  it('custom message with options', () => {
    const p = parse(length(string(), 3, ({ n }) => `Need ${n} chars`));
    try {
      p('ab');
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Need 3 chars');
    }
  });

  it('validate mode', () => {
    const v = validate(length(string(), 4));
    expect(v('abcd').issues).toBeUndefined();
    expect(v('abc').issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(length(string(), 3))('abc')).toBe(true);
    expect(check(length(string(), 3))('ab')).toBe(false);
  });
});
