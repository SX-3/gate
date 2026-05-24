import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { literal } from '../../src/types/literal';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { string } from '../../src/types/string';
import { union } from '../../src/types/union';

describe('union', () => {
  describe('parse', () => {
    it('string | number', () => {
      const p = parse(union([string(), number()]));
      expect(p('hello')).toBe('hello');
      expect(p(42)).toBe(42);
      expect(() => p(true)).toThrow(GateError);
    });

    it('literal union', () => {
      const p = parse(union([literal('a'), literal('b'), literal('c')]));
      expect(p('a')).toBe('a');
      expect(p('b')).toBe('b');
      expect(p('c')).toBe('c');
      expect(() => p('d')).toThrow(GateError);
    });

    it('mixed simple and complex', () => {
      const p = parse(union([
        string(),
        object({ a: number }),
      ]));
      expect(p('hello')).toBe('hello');
      expect(p({ a: 42 })).toEqual({ a: 42 });
      expect(() => p(true)).toThrow(GateError);
    });

    it('single variant', () => {
      const p = parse(union([string()]));
      expect(p('hello')).toBe('hello');
      expect(() => p(42)).toThrow(GateError);
    });

    it('with literal shorthand – non-schema values auto-wrapped', () => {
      const p = parse(union([1, 2, 3]));
      expect(p(1)).toBe(1);
      expect(p(2)).toBe(2);
      expect(p(3)).toBe(3);
      expect(() => p(4)).toThrow(GateError);
    });

    it('nested objects in union', () => {
      const p = parse(union([
        object({ type: literal('cat'), meow: string }),
        object({ type: literal('dog'), bark: string }),
      ]));
      expect(p({ type: 'cat', meow: 'meow' })).toEqual({ type: 'cat', meow: 'meow' });
      expect(p({ type: 'dog', bark: 'woof' })).toEqual({ type: 'dog', bark: 'woof' });
      expect(() => p({ type: 'fish' })).toThrow(GateError);
    });

    it('nullish values via shorthand', () => {
      const p = parse(union([string(), null]));
      expect(p('hello')).toBe('hello');
      expect(p(null)).toBe(null);
      expect(() => p(undefined)).toThrow(GateError);
    });

    it('custom message', () => {
      const p = parse(union([string(), number()], 'Need string or number'));
      try {
        p(true);
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('Need string or number');
      }
    });
  });

  describe('validate', () => {
    it('returns { value } on success', () => {
      const v = validate(union([string(), number()]));
      const result = v(42);
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toBe(42);
    });

    it('returns { issues } on failure', () => {
      const v = validate(union([string(), number()]));
      const result = v(true);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });
  });

  describe('check', () => {
    it('returns true for valid', () => {
      expect(check(union([string(), number()]))('ok')).toBe(true);
      expect(check(union([string(), number()]))(42)).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(check(union([string(), number()]))(true)).toBe(false);
    });
  });
});
