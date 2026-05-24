import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { length } from '../../src/constraints/length';
import { GateError } from '../../src/error';
import { nullable } from '../../src/modifiers/nullable';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { string } from '../../src/types/string';

describe('nullable', () => {
  describe('parse', () => {
    it('accepts valid value', () => {
      const p = parse(nullable(string));
      expect(p('hello')).toBe('hello');
    });

    it('accepts null', () => {
      const p = parse(nullable(string));
      expect(p(null)).toBe(null);
    });

    it('rejects undefined', () => {
      const p = parse(nullable(string));
      expect(() => p(undefined)).toThrow(GateError);
    });

    it('rejects wrong type', () => {
      const p = parse(nullable(string));
      expect(() => p(42)).toThrow(GateError);
    });

    it('nullable number', () => {
      const p = parse(nullable(number));
      expect(p(42)).toBe(42);
      expect(p(null)).toBe(null);
      expect(() => p('42')).toThrow(GateError);
    });

    it('nested nullable', () => {
      const p = parse(nullable(nullable(string)));
      expect(p('hello')).toBe('hello');
      expect(p(null)).toBe(null);
      expect(() => p(42)).toThrow(GateError);
    });

    it('nullable object', () => {
      const p = parse(nullable(object({ a: number })));
      expect(p({ a: 1 })).toEqual({ a: 1 });
      expect(p(null)).toBe(null);
      expect(() => p({ a: 'x' })).toThrow(GateError);
    });
  });

  describe('validate', () => {
    it('returns { value } for valid', () => {
      const v = validate(nullable(string));
      expect(v('ok').issues).toBeUndefined();
      expect(v(null).issues).toBeUndefined();
    });

    it('returns { issues } for invalid', () => {
      const v = validate(nullable(string));
      const result = v(42);
      expect(result.issues).toBeDefined();
    });
  });

  describe('check', () => {
    it('returns true for valid', () => {
      expect(check(nullable(string))('ok')).toBe(true);
      expect(check(nullable(string))(null)).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(check(nullable(string))(42)).toBe(false);
      expect(check(nullable(string))(undefined)).toBe(false);
    });
  });

  describe('combined with constraints', () => {
    it('nullable constrained string', () => {
      const p = parse(nullable(length(string, 5)));
      expect(p('hello')).toBe('hello');
      expect(p(null)).toBe(null);
      expect(() => p('hi')).toThrow(GateError);
    });
  });

  describe('inside object', () => {
    it('nullable field in object', () => {
      const s = object({ name: string, avatar: nullable(object({ key: string })) });
      const p = parse(s);
      expect(p({ name: 'a', avatar: { key: 'x' } })).toEqual({ name: 'a', avatar: { key: 'x' } });
      expect(p({ name: 'a', avatar: null })).toEqual({ name: 'a', avatar: null });
    });

    it('rejects wrong type in nullable field', () => {
      const s = object({ name: string, avatar: nullable(object({ key: string })) });
      const p = parse(s);
      expect(() => p({ name: 'a', avatar: { key: 1 } })).toThrow(GateError);
      expect(() => p({ name: 'a', avatar: 'wrong' })).toThrow(GateError);
    });
  });
});
