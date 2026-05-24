import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { optional } from '../../src/modifiers/optional';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { string } from '../../src/types/string';

describe('optional', () => {
  describe('parse', () => {
    it('accepts valid value', () => {
      const p = parse(optional(string));
      expect(p('hello')).toBe('hello');
    });

    it('accepts undefined', () => {
      const p = parse(optional(string));
      // @ts-expect-error fail
      expect(p(undefined)).toBe(undefined);
    });

    it('rejects null', () => {
      const p = parse(optional(string));
      expect(() => p(null)).toThrow(GateError);
    });

    it('rejects wrong type', () => {
      const p = parse(optional(string));
      expect(() => p(42)).toThrow(GateError);
    });

    it('optional number', () => {
      const p = parse(optional(number));
      expect(p(42)).toBe(42);
      // @ts-expect-error fail
      expect(p(undefined)).toBe(undefined);
      expect(() => p(null)).toThrow(GateError);
    });
  });

  describe('validate', () => {
    it('returns { value } for valid and undefined', () => {
      const v = validate(optional(string));
      expect(v('ok').issues).toBeUndefined();
      expect(v(undefined).issues).toBeUndefined();
    });

    it('returns { issues } for invalid', () => {
      const v = validate(optional(string));
      expect(v(null).issues).toBeDefined();
      expect(v(42).issues).toBeDefined();
    });
  });

  describe('check', () => {
    it('returns true for valid and undefined', () => {
      expect(check(optional(number))(42)).toBe(true);
      expect(check(optional(number))(undefined)).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(check(optional(number))('42')).toBe(false);
      expect(check(optional(number))(null)).toBe(false);
    });
  });

  describe('inside object', () => {
    it('optional field in object', () => {
      const s = object({ name: string, age: optional(number) });
      const p = parse(s);
      expect(p({ name: 'a', age: 1 })).toEqual({ name: 'a', age: 1 });
      expect(p({ name: 'a' })).toEqual({ name: 'a' });
    });

    it('rejects null in optional field', () => {
      const s = object({ name: string, age: optional(number) });
      const p = parse(s);
      expect(() => p({ name: 'a', age: null })).toThrow(GateError);
    });

    it('optional object field', () => {
      const s = object({ name: string, meta: optional(object({ key: string })) });
      const p = parse(s);
      expect(p({ name: 'a', meta: { key: 'x' } })).toEqual({ name: 'a', meta: { key: 'x' } });
      expect(p({ name: 'a' })).toEqual({ name: 'a' });
    });
  });
});
