import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { nullable } from '../../src/modifiers/nullable';
import { optional } from '../../src/modifiers/optional';
import { array } from '../../src/types/array';
import { bigint } from '../../src/types/bigint';
import { boolean } from '../../src/types/boolean';
import { literal } from '../../src/types/literal';
import { number } from '../../src/types/number';
import { merge, object, strict } from '../../src/types/object';
import { string } from '../../src/types/string';

describe('object', () => {
  describe('parse', () => {
    it('empty object', () => {
      const p = parse(object({}));
      expect(p({})).toEqual({});
      // Strip by default: unknown keys are removed
      expect(p({ a: 1 })).toEqual({});
      expect(() => p(null)).toThrow(GateError);
      expect(() => p('string')).toThrow(GateError);
      expect(() => p(42)).toThrow(GateError);
    });

    it('empty object strict', () => {
      const p = parse(object({}, { strict: true }));
      expect(p({})).toEqual({});
      expect(() => p({ a: 1 })).toThrow(GateError);
    });

    it('simple object', () => {
      const p = parse(object({ name: string, age: number }));
      expect(p({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 });
      // Unknown keys are stripped by default
      expect(p({ name: 'Alice', age: 30, extra: true })).toEqual({ name: 'Alice', age: 30 });
    });

    it('simple object strict', () => {
      const p = parse(object({ name: string, age: number }, { strict: true }));
      expect(p({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 });
      expect(() => p({ name: 'Alice', age: 30, extra: true })).toThrow(GateError);
    });

    it('throws on invalid field type', () => {
      const p = parse(object({ name: string, age: number }));
      expect(() => p({ name: 'Alice', age: 'thirty' })).toThrow(GateError);
    });

    it('throws on missing field', () => {
      const p = parse(object({ name: string, age: number }));
      expect(() => p({ name: 'Alice' })).toThrow(GateError);
    });

    it('throws on non-object input', () => {
      const p = parse(object({ name: string }));
      expect(() => p(null)).toThrow(GateError);
      expect(() => p(42)).toThrow(GateError);
      expect(() => p('hello')).toThrow(GateError);
      expect(() => p([])).toThrow(GateError);
    });

    it('nested objects', () => {
      const p = parse(object({
        user: object({ name: string, score: number }),
      }));
      expect(p({ user: { name: 'Bob', score: 100 } })).toEqual({
        user: { name: 'Bob', score: 100 },
      });
      expect(() => p({ user: { name: 'Bob', score: 'high' } })).toThrow(GateError);
    });

    it('with literal fields', () => {
      const p = parse(object({
        type: literal('user'),
        active: boolean,
      }));
      expect(p({ type: 'user', active: true })).toEqual({ type: 'user', active: true });
      expect(() => p({ type: 'admin', active: true })).toThrow(GateError);
    });

    it('with optional fields', () => {
      const p = parse(object({ name: string, age: optional(number) }));
      expect(p({ name: 'Eve', age: 25 })).toEqual({ name: 'Eve', age: 25 });
      expect(p({ name: 'Eve' })).toEqual({ name: 'Eve' });
      expect(() => p({ name: 'Eve', age: 'old' })).toThrow(GateError);
    });

    it('with nullable fields', () => {
      const p = parse(object({ name: string, nickname: nullable(string) }));
      expect(p({ name: 'Dan', nickname: 'D' })).toEqual({ name: 'Dan', nickname: 'D' });
      expect(p({ name: 'Dan', nickname: null })).toEqual({ name: 'Dan', nickname: null });
      expect(() => p({ name: 'Dan', nickname: 42 })).toThrow(GateError);
    });

    it('with array fields', () => {
      const p = parse(object({ tags: array(string) }));
      expect(p({ tags: ['a', 'b'] })).toEqual({ tags: ['a', 'b'] });
      expect(p({ tags: [] })).toEqual({ tags: [] });
      expect(() => p({ tags: [1, 2] })).toThrow(GateError);
    });

    it('non-identifier keys', () => {
      const p = parse(object({ 'my-key': string, '123': number }));
      expect(p({ 'my-key': 'val', '123': 42 })).toEqual({ 'my-key': 'val', '123': 42 });
    });

    it('custom message', () => {
      const p = parse(object({}, { message: 'Not object' }));
      try {
        p('nope');
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('Not object');
      }
    });

    it('implicit literal for non-schema values', () => {
      const p = parse(object({ kind: 'constant' }));
      expect(p({ kind: 'constant' })).toEqual({ kind: 'constant' });
      expect(() => p({ kind: 'other' })).toThrow(GateError);
    });
  });

  describe('validate', () => {
    it('returns { value } on success', () => {
      const v = validate(object({ a: number, b: string }));
      const result = v({ a: 1, b: 'x' });
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toEqual({ a: 1, b: 'x' });
    });

    it('returns { issues } on failure', () => {
      const v = validate(object({ a: number }));
      const result = v({ a: 'not number' });
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });
  });

  describe('check', () => {
    it('returns true for valid', () => {
      const c = check(object({ name: string }));
      expect(c({ name: 'Ok' })).toBe(true);
    });

    it('returns false for invalid', () => {
      const c = check(object({ name: string }));
      expect(c({ name: 42 })).toBe(false);
      expect(c(null)).toBe(false);
    });
  });

  describe('error paths', () => {
    it('includes field path in error', () => {
      const p = parse(object({ user: object({ name: string }) }));
      try {
        p({ user: { name: 42 } });
        expect.unreachable();
      }
      catch (e) {
        const err = e as GateError;
        expect(err.path).toContain('user');
        expect(err.path).toContain('name');
      }
    });
  });

  describe('merge', () => {
    it('combines fields from two object schemas', () => {
      const base = object({ id: string, name: string });
      const extended = merge(base, object({ age: number }));
      const p = parse(extended);
      expect(p({ id: '1', name: 'John', age: 30 })).toEqual({ id: '1', name: 'John', age: 30 });
    });

    it('b overrides a on conflicting keys', () => {
      const s = merge(
        object({ name: string, age: number }),
        object({ name: number }),
      );
      const p = parse(s);
      expect(p({ name: 42, age: 30 })).toEqual({ name: 42, age: 30 });
      expect(() => p({ name: 'string', age: 30 })).toThrow(GateError);
    });

    it('strips unknown keys by default', () => {
      const s = merge(object({ a: number }), object({ b: string }));
      const p = parse(s);
      expect(p({ a: 1, b: 'x', c: true })).toEqual({ a: 1, b: 'x' });
    });

    it('inherits strict from a', () => {
      const s = merge(
        object({ id: string }, { strict: true }),
        object({ name: string }),
      );
      const p = parse(s);
      expect(p({ id: '1', name: 'x' })).toEqual({ id: '1', name: 'x' });
      expect(() => p({ id: '1', name: 'x', extra: true })).toThrow(GateError);
    });

    it('works with validate mode', () => {
      const s = merge(object({ a: number }), object({ b: string }));
      const v = validate(s);
      expect(v({ a: 1, b: 'x' }).issues).toBeUndefined();
      expect(v({ a: 'bad', b: 'x' }).issues).toBeDefined();
    });

    it('works with check mode', () => {
      const s = merge(object({ a: number }), object({ b: string }));
      expect(check(s)({ a: 1, b: 'x' })).toBe(true);
      expect(check(s)({ a: 'bad', b: 'x' })).toBe(false);
    });

    it('merge with empty object', () => {
      const s = merge(object({}), object({ name: string }));
      const p = parse(s);
      expect(p({ name: 'hi' })).toEqual({ name: 'hi' });
    });

    it('preserves modifiers in merged fields', () => {
      const s = merge(
        object({ id: string }),
        object({ nickname: nullable(string) }),
      );
      const p = parse(s);
      expect(p({ id: '1', nickname: 'N' })).toEqual({ id: '1', nickname: 'N' });
      expect(p({ id: '1', nickname: null })).toEqual({ id: '1', nickname: null });
    });

    it('supports nested objects in merge', () => {
      const s = merge(
        object({ meta: object({ key: string }) }),
        object({ meta: object({ value: number }) }),
      );
      const p = parse(s);
      // b meta overrides a meta completely (shallow merge at top level)
      expect(p({ meta: { value: 42 } })).toEqual({ meta: { value: 42 } });
      expect(() => p({ meta: { key: 'x' } })).toThrow(GateError);
    });

    it('merge derives strict from its schemas', () => {
      const base = object({ a: string });
      const ext = strict(object({ b: number }));
      const merged = merge(base, ext);
      const p = parse(merged);
      expect(() => p({ a: 'x', b: 1, extra: true })).toThrow(GateError);
    });

    it('merge variadic (3+ schemas)', () => {
      const first = object({ a: string });
      const second = object({ b: number });
      const third = object({ c: bigint });
      const merged = merge(first, second, third);
      const p = parse(merged);
      expect(p({ a: 'x', b: 1, c: 2n })).toEqual({ a: 'x', b: 1, c: 2n });
    });

    it('merge variadic overrides conflicting keys (last wins)', () => {
      const first = object({ a: string, b: string });
      const second = object({ b: number });
      const third = object({ c: bigint });
      const merged = merge(first, second, third);
      const p = parse(merged);
      expect(p({ a: 'x', b: 42, c: 2n })).toEqual({ a: 'x', b: 42, c: 2n });
      expect(() => p({ a: 'x', b: 'y', c: 2n })).toThrow(GateError);
    });
  });

  describe('strict()', () => {
    it('makes schema strict — rejects unknown keys', () => {
      const s = strict(object({ name: string }));
      const p = parse(s);
      expect(p({ name: 'Alice' })).toEqual({ name: 'Alice' });
      expect(() => p({ name: 'Alice', extra: 1 })).toThrow(GateError);
    });

    it('deep=false makes only top-level strict', () => {
      const inner = object({ key: string });
      const s = strict(object({ name: string, nested: inner }), false);
      const p = parse(s);
      // Top-level rejects unknown keys
      expect(() => p({ name: 'A', nested: { key: 'v' }, extra: 1 })).toThrow(GateError);
      // Top-level is strict
      expect(s.strict).toBe(true);
      // Nested schema is NOT strict (deep=false keeps it as-is)
      // @ts-expect-error strict property should not be accessible
      expect(s.fields.nested.strict).toBe(false);
      // Original inner schema is unchanged
      expect(inner.strict).toBe(false);
    });

    it('deep=true (default) makes nested object schemas strict too', () => {
      const inner = object({ key: string });
      const s = strict(object({ name: string, nested: inner }));
      const p = parse(s);
      // Top-level unknown keys rejected
      expect(() => p({ name: 'A', nested: { key: 'v' }, extra: 1 })).toThrow(GateError);
      // Nested unknown keys also rejected
      expect(() => p({ name: 'A', nested: { key: 'v', extra: 2 } })).toThrow(GateError);
    });

    it('valid data passes strict schema', () => {
      const s = strict(object({ name: string, age: number }));
      const p = parse(s);
      expect(p({ name: 'Bob', age: 30 })).toEqual({ name: 'Bob', age: 30 });
    });

    it('works with validate mode', () => {
      const s = strict(object({ a: number }));
      const v = validate(s);
      expect(v({ a: 1 }).issues).toBeUndefined();
      expect(v({ a: 1, b: 2 }).issues).toBeDefined();
    });

    it('works with check mode', () => {
      const s = strict(object({ a: number }));
      const c = check(s);
      expect(c({ a: 1 })).toBe(true);
      expect(c({ a: 1, b: 2 })).toBe(false);
    });

    it('deeply nested objects become strict', () => {
      const s = strict(object({
        level1: object({
          level2: object({ value: number }),
        }),
      }));
      const p = parse(s);
      expect(p({ level1: { level2: { value: 42 } } })).toEqual({ level1: { level2: { value: 42 } } });
      expect(() => p({ level1: { level2: { value: 42, extra: 1 } } })).toThrow(GateError);
    });

    it('returns same type schema', () => {
      const original = object({ name: string, age: number });
      const result = strict(original);
      // Must still parse valid input
      const p = parse(result);
      expect(p({ name: 'X', age: 1 })).toEqual({ name: 'X', age: 1 });
    });

    it('does not mutate the original schema', () => {
      const original = object({ name: string });
      const originalStrict = original.strict;
      strict(original);
      // Original should be unchanged
      expect(original.strict).toBe(originalStrict);
    });
  });
});
