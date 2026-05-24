import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { min } from '../../src/constraints/min';
import { GateError } from '../../src/error';
import { pattern } from '../../src/types/pattern';

describe('pattern', () => {
  it('accepts matching strings', () => {
    const p = parse(pattern(/^[a-z]+$/));
    expect(p('hello')).toBe('hello');
    expect(p('abc')).toBe('abc');
  });

  it('rejects non-matching strings', () => {
    const p = parse(pattern(/^[a-z]+$/));
    expect(() => p('123')).toThrow(GateError);
    expect(() => p('Hello')).toThrow(GateError);
    expect(() => p('')).toThrow(GateError);
  });

  it('rejects non-string values', () => {
    const p = parse(pattern(/^[a-z]+$/));
    expect(() => p(42)).toThrow(GateError);
    expect(() => p(null)).toThrow(GateError);
  });

  it('supports global regex flag', () => {
    const p = parse(pattern(/^[a-z]+$/g));
    expect(p('hello')).toBe('hello');
    expect(p('world')).toBe('world');
    expect(p('hello')).toBe('hello');
  });

  it('supports sticky regex flag', () => {
    const p = parse(pattern(/^[a-z]+$/y));
    expect(p('hello')).toBe('hello');
    expect(p('world')).toBe('world');
  });

  it('custom message', () => {
    const p = parse(pattern(/^\d+$/, 'Must be digits'));
    try {
      p('abc');
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Must be digits');
    }
  });

  it('validate mode', () => {
    const v = validate(pattern(/^[a-z]+$/));
    expect(v('hello').issues).toBeUndefined();
    expect(v('123').issues).toBeDefined();
  });

  it('check mode', () => {
    expect(check(pattern(/^[a-z]+$/))('hello')).toBe(true);
    expect(check(pattern(/^[a-z]+$/))('123')).toBe(false);
  });

  it('chained with min', () => {
    const p = parse(min(pattern(/^[a-z]+$/), 3));
    expect(p('hello')).toBe('hello');
    expect(() => p('ab')).toThrow(GateError); // too short
    expect(() => p('1234')).toThrow(GateError); // pattern mismatch
  });

  it('works standalone in object', () => {
    const p = parse(pattern(/^[a-z]+$/));
    expect(p('hello')).toBe('hello');
    expect(() => p('123')).toThrow(GateError);
  });
});
