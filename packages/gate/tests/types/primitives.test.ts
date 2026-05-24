import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { nullable } from '../../src/modifiers/nullable';
import { nullish } from '../../src/modifiers/nullish';
import { optional } from '../../src/modifiers/optional';
import { isSchema } from '../../src/schema';
import { bigint } from '../../src/types/bigint';
import { boolean } from '../../src/types/boolean';
import { number } from '../../src/types/number';
import { string } from '../../src/types/string';
import { unknown } from '../../src/types/unknown';

const schemas = [
  string,
  number,
  boolean,
  bigint,
  unknown,
] as const;

describe('primitives', () => {
  describe('isSchema', () => {
    it('value form', () => {
      for (const schema of schemas) {
        expect(isSchema(schema)).toBeTrue();
      }
    });

    it('functional form', () => {
      for (const schema of schemas) {
        expect(isSchema(schema())).toBeTrue();
      }
    });
  });

  describe('works with options', () => {
    it('custom message in parse', () => {
      const s = string('NOPE');
      try {
        parse(s)(42);
        expect.unreachable();
      }
      catch (e) {
        expect(e).toBeInstanceOf(GateError);
        expect((e as GateError).message).toBe('NOPE');
      }
    });

    it('custom message via function', () => {
      const s = string(() => 'fn_msg');
      try {
        parse(s)(42);
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('fn_msg');
      }
    });
  });

  describe('parse', () => {
    it('string', () => {
      const p = parse(string);
      expect(p('hello')).toBe('hello');
      expect(() => p(42)).toThrow(GateError);
      expect(() => p(null)).toThrow(GateError);
      expect(() => p(undefined)).toThrow(GateError);
    });

    it('number', () => {
      const p = parse(number);
      expect(p(42)).toBe(42);
      expect(p(0)).toBe(0);
      expect(p(-1)).toBe(-1);
      expect(() => p(Number.NaN)).toThrow(GateError);
      expect(() => p('42')).toThrow(GateError);
    });

    it('boolean', () => {
      const p = parse(boolean);
      expect(p(true)).toBe(true);
      expect(p(false)).toBe(false);
      expect(() => p(1)).toThrow(GateError);
      expect(() => p('true')).toThrow(GateError);
    });

    it('bigint', () => {
      const p = parse(bigint);
      expect(p(0n)).toBe(0n);
      expect(p(42n)).toBe(42n);
      expect(() => p(42)).toThrow(GateError);
    });

    it('unknown', () => {
      const p = parse(unknown);
      expect(p('anything')).toBe('anything');
      expect(p(42)).toBe(42);
      expect(p(null)).toBe(null);
      expect(p(undefined)).toBe(undefined);
      expect(p({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe('validate', () => {
    it('returns { value } on success', () => {
      const v = validate(string);
      const result = v('hello');
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toBe('hello');
    });

    it('returns { issues } on failure', () => {
      const v = validate(number);
      const result = v('not a number');
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });
  });

  describe('check', () => {
    it('returns true for valid input', () => {
      expect(check(string)('hello')).toBe(true);
      expect(check(number)(42)).toBe(true);
      expect(check(boolean)(true)).toBe(true);
      expect(check(bigint)(0n)).toBe(true);
      expect(check(unknown)(null)).toBe(true);
    });

    it('returns false for invalid input', () => {
      expect(check(string)(42)).toBe(false);
      expect(check(number)('42')).toBe(false);
      expect(check(boolean)('true')).toBe(false);
      expect(check(bigint)(42)).toBe(false);
    });
  });

  describe('works with modifiers', () => {
    it('nullable string', () => {
      const s = nullable(string);
      const p = parse(s);
      expect(p('hello')).toBe('hello');
      expect(p(null)).toBe(null);
      expect(() => p(42)).toThrow(GateError);
    });

    it('optional number', () => {
      const s = optional(number);
      const p = parse(s);
      expect(p(42)).toBe(42);
      // @ts-expect-error - TS can't infer optional accepts undefined
      expect(p(undefined)).toBe(undefined);
      expect(() => p('42')).toThrow(GateError);
    });

    it('nullish boolean', () => {
      const s = nullish(boolean);
      const p = parse(s);
      expect(p(true)).toBe(true);
      expect(p(null)).toBe(null);
      // @ts-expect-error - TS can't infer nullish accepts undefined
      expect(p(undefined)).toBe(undefined);
      expect(() => p(42)).toThrow(GateError);
    });
  });
});
