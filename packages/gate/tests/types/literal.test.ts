import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { literal } from '../../src/types/literal';

describe('literal', () => {
  describe('parse', () => {
    it('string literal', () => {
      const p = parse(literal('hello'));
      expect(p('hello')).toBe('hello');
      expect(() => p('world')).toThrow(GateError);
      expect(() => p(42)).toThrow(GateError);
    });

    it('number literal', () => {
      const p = parse(literal(42));
      expect(p(42)).toBe(42);
      expect(() => p(43)).toThrow(GateError);
      expect(() => p('42')).toThrow(GateError);
    });

    it('boolean literal', () => {
      const pTrue = parse(literal(true));
      expect(pTrue(true)).toBe(true);
      expect(() => pTrue(false)).toThrow(GateError);

      const pFalse = parse(literal(false));
      expect(pFalse(false)).toBe(false);
      expect(() => pFalse(true)).toThrow(GateError);
    });

    it('null literal', () => {
      const p = parse(literal(null));
      expect(p(null)).toBe(null);
      expect(() => p(undefined)).toThrow(GateError);
      expect(() => p('null')).toThrow(GateError);
    });

    it('undefined literal', () => {
      const p = parse(literal(undefined));
      expect(p(undefined)).toBe(undefined);
      expect(() => p(null)).toThrow(GateError);
    });

    it('bigint literal', () => {
      const p = parse(literal(7n));
      expect(p(7n)).toBe(7n);
      expect(() => p(8n)).toThrow(GateError);
      expect(() => p(7)).toThrow(GateError);
    });
  });

  describe('validate', () => {
    it('returns { value } on match', () => {
      const v = validate(literal(42));
      const result = v(42);
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toBe(42);
    });

    it('returns { issues } on mismatch', () => {
      const v = validate(literal(42));
      const result = v(43);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBe(1);
    });
  });

  describe('check', () => {
    it('returns true for match', () => {
      expect(check(literal('ok'))('ok')).toBe(true);
      expect(check(literal(1))(1)).toBe(true);
      expect(check(literal(true))(true)).toBe(true);
    });

    it('returns false for mismatch', () => {
      expect(check(literal('ok'))('nope')).toBe(false);
      expect(check(literal(1))(2)).toBe(false);
      expect(check(literal(true))(false)).toBe(false);
    });
  });

  describe('custom message', () => {
    it('uses custom message', () => {
      const s = literal(42, 'Not the answer');
      try {
        parse(s)(43);
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('Not the answer');
      }
    });
  });
});
