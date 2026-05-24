import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { nullish } from '../../src/modifiers/nullish';
import { boolean } from '../../src/types/boolean';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { string } from '../../src/types/string';

describe('nullish', () => {
  describe('parse', () => {
    it('accepts valid value', () => {
      const p = parse(nullish(string));
      expect(p('hello')).toBe('hello');
    });

    it('accepts null', () => {
      const p = parse(nullish(string));
      expect(p(null)).toBe(null);
    });

    it('accepts undefined', () => {
      const p = parse(nullish(string));
      // @ts-expect-error fail
      expect(p(undefined)).toBe(undefined);
    });

    it('rejects wrong type', () => {
      const p = parse(nullish(string));
      expect(() => p(42)).toThrow(GateError);
    });

    it('nullish number', () => {
      const p = parse(nullish(number));
      expect(p(42)).toBe(42);
      expect(p(null)).toBe(null);
      // @ts-expect-error fail
      expect(p(undefined)).toBe(undefined);
      expect(() => p('42')).toThrow(GateError);
    });
  });

  describe('validate', () => {
    it('returns { value } for all valid variants', () => {
      const v = validate(nullish(number));
      expect(v(42).issues).toBeUndefined();
      expect(v(null).issues).toBeUndefined();
      expect(v(undefined).issues).toBeUndefined();
    });

    it('returns { issues } for invalid', () => {
      const v = validate(nullish(number));
      expect(v('x').issues).toBeDefined();
    });
  });

  describe('check', () => {
    it('returns true for all valid variants', () => {
      expect(check(nullish(boolean))(true)).toBe(true);
      expect(check(nullish(boolean))(null)).toBe(true);
      expect(check(nullish(boolean))(undefined)).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(check(nullish(boolean))(42)).toBe(false);
    });
  });

  describe('inside object', () => {
    it('nullish field in object', () => {
      const s = object({ name: string, age: nullish(number) });
      const p = parse(s);
      expect(p({ name: 'a', age: 1 })).toEqual({ name: 'a', age: 1 });
      expect(p({ name: 'a', age: null })).toEqual({ name: 'a', age: null });
      expect(p({ name: 'a' })).toEqual({ name: 'a' });
    });

    it('rejects wrong type in nullish field', () => {
      const s = object({ name: string, age: nullish(number) });
      const p = parse(s);
      expect(() => p({ name: 'a', age: 'wrong' })).toThrow(GateError);
    });

    it('nullish object field', () => {
      const s = object({ name: string, meta: nullish(object({ key: string })) });
      const p = parse(s);
      expect(p({ name: 'a', meta: { key: 'x' } })).toEqual({ name: 'a', meta: { key: 'x' } });
      expect(p({ name: 'a', meta: null })).toEqual({ name: 'a', meta: null });
      expect(p({ name: 'a' })).toEqual({ name: 'a' });
    });
  });
});
