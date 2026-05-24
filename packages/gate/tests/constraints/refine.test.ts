import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { min } from '../../src/constraints/min';
import { refine } from '../../src/constraints/refine';
import { GateError } from '../../src/error';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';

describe('refine', () => {
  // ── String-based ──
  it('string-based: accepts valid values', () => {
    const p = parse(refine(string(), '$.length > 3', 'Too short'));
    expect(p('hello')).toBe('hello');
    expect(p('abcd')).toBe('abcd');
  });

  it('string-based: rejects invalid values', () => {
    const p = parse(refine(string(), '$.length > 3', 'Too short'));
    expect(() => p('ab')).toThrow(GateError);
    expect(() => p('')).toThrow(GateError);
  });

  it('string-based: custom message via options', () => {
    const p = parse(refine(string(), '$.length > 3', 'Need more chars'));
    try {
      p('ab');
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Need more chars');
    }
  });

  it('string-based: validate mode', () => {
    const v = validate(refine(string(), '$.length > 3', 'Too short'));
    expect(v('hello').issues).toBeUndefined();
    expect(v('ab').issues).toBeDefined();
  });

  it('string-based: check mode', () => {
    expect(check(refine(string(), '$.length > 3', 'Too short'))('hello')).toBe(true);
    expect(check(refine(string(), '$.length > 3', 'Too short'))('ab')).toBe(false);
  });

  // ── Function-based ──
  it('function-based: accepts valid values', () => {
    const p = parse(refine(string(), v => v.length > 3, 'Too short'));
    expect(p('hello')).toBe('hello');
  });

  it('function-based: rejects invalid values', () => {
    const p = parse(refine(string(), v => v.length > 3, 'Too short'));
    expect(() => p('ab')).toThrow(GateError);
  });

  it('function-based: custom message via options', () => {
    const p = parse(refine(string(), v => v.length > 3, 'Need more chars'));
    try {
      p('ab');
      expect.unreachable();
    }
    catch (e) {
      expect((e as GateError).message).toBe('Need more chars');
    }
  });

  it('function-based: validate mode', () => {
    const v = validate(refine(string(), v => v.includes('@'), 'No @'));
    expect(v('a@b').issues).toBeUndefined();
    expect(v('ab').issues).toBeDefined();
  });

  it('function-based: check mode', () => {
    const s = refine(string(), v => v.includes('@'), 'No @');
    expect(check(s)('a@b')).toBe(true);
    expect(check(s)('ab')).toBe(false);
  });

  it('function-based: chained with min', () => {
    const s = min(refine(string(), v => v.includes('@'), 'No @'), 5);
    const p = parse(s);
    expect(p('a@bcde')).toBe('a@bcde');
    expect(() => p('a@b')).toThrow(GateError); // too short
    expect(() => p('abcde')).toThrow(GateError); // no @
  });

  it('function-based: works with numbers', () => {
    const s = refine(number(), v => v > 0 && v < 100, 'Out of range');
    const p = parse(s);
    expect(p(50)).toBe(50);
    expect(() => p(0)).toThrow(GateError);
    expect(() => p(150)).toThrow(GateError);
  });
});
