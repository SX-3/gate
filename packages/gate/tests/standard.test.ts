import type { InferInput, InferOutput, StandardSchemaV1, SuccessResult } from '../src/standard';
import { afterEach, describe, expect, expectTypeOf, it } from 'bun:test';
import { parse } from '../src';
import { nullable } from '../src/modifiers/nullable';
import { optional } from '../src/modifiers/optional';
import { settings } from '../src/settings';
import { array } from '../src/types/array';
import { boolean } from '../src/types/boolean';
import { int } from '../src/types/int';
import { literal } from '../src/types/literal';
import { number } from '../src/types/number';
import { object } from '../src/types/object';
import { pattern } from '../src/types/pattern';
import { string } from '../src/types/string';
import { union } from '../src/types/union';

function standard<T>(schema: T): T & StandardSchemaV1 {
  return schema as T & StandardSchemaV1;
}

function isSuccess<O>(result: { issues?: unknown }): result is SuccessResult<O> {
  return !result.issues;
}

afterEach(() => {
  settings({ standardMode: 'parse' });
});

describe('standard schema', () => {
  it('every schema has ~standard property', () => {
    const schemas = [
      string(),
      number(),
      boolean(),
      array(string()),
      object({ name: string() }),
      union([string(), number()]),
      literal(42),
      int,
      pattern(/^[a-z]+$/),
      nullable(string()),
      optional(string()),
    ];

    for (const schema of schemas) {
      const std = standard(schema);
      expect(std['~standard']).toBeDefined();
      expect(std['~standard'].version).toBe(1);
      expect(std['~standard'].vendor).toBe('@sx3/gate');
      expect(typeof std['~standard'].validate).toBe('function');
    }
  });

  describe('parse mode (default)', () => {
    it('returns success for valid input', () => {
      const s = standard(string());
      const result = s['~standard'].validate('hello');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe('hello');
    });

    it('returns failure with issues for invalid input', () => {
      const s = standard(number());
      const result = s['~standard'].validate('not a number');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
      expect(result.issues![0]!.message).toBeDefined();
    });

    it('includes path in issues for nested schemas', () => {
      const s = standard(object({
        user: object({
          age: number(),
        }),
      }));
      const result = s['~standard'].validate({ user: { age: 'old' } });
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
      // path should contain the field name(s)
      const issue = result.issues![0]!;
      expect(issue.path).toBeDefined();
    });

    it('works with array schema', () => {
      const s = standard(array(number()));
      const result = s['~standard'].validate([1, 2, 3]);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toEqual([1, 2, 3]);
    });

    it('returns failure for invalid array elements', () => {
      const s = standard(array(number()));
      const result = s['~standard'].validate([1, 'x', 3]);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });

    it('works with union schema', () => {
      const s = standard(union([string(), number()]));
      const r1 = s['~standard'].validate('hello');
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate(42);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeUndefined();

      const r3 = s['~standard'].validate(true);
      expect(r3).not.toBeInstanceOf(Promise);
      if (r3 instanceof Promise) return;
      expect(r3.issues).toBeDefined();
    });

    it('works with literal schema', () => {
      const s = standard(literal(42));
      const r1 = s['~standard'].validate(42);
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(isSuccess(r1)).toBe(true);
      if (isSuccess(r1)) expect(r1.value).toBe(42);

      const r2 = s['~standard'].validate(43);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeDefined();
    });

    it('works with pattern schema', () => {
      const s = standard(pattern(/^[a-z]+$/));
      const r1 = s['~standard'].validate('hello');
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate('123');
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeDefined();
    });

    it('works with modifiers (nullable)', () => {
      const s = standard(nullable(string()));
      const r1 = s['~standard'].validate('hello');
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate(null);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(isSuccess(r2)).toBe(true);
      if (isSuccess(r2)) expect(r2.value).toBe(null);

      const r3 = s['~standard'].validate(42);
      expect(r3).not.toBeInstanceOf(Promise);
      if (r3 instanceof Promise) return;
      expect(r3.issues).toBeDefined();
    });

    it('works with modifiers (optional)', () => {
      const s = standard(optional(string()));
      const r1 = s['~standard'].validate(undefined);
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(isSuccess(r1)).toBe(true);
      if (isSuccess(r1)) expect(r1.value).toBe(undefined);
    });

    it('works with complex nested object', () => {
      const s = standard(object({
        users: array(object({
          name: string(),
          scores: array(number()),
        })),
      }));
      const valid = {
        users: [
          { name: 'Alice', scores: [1, 2, 3] },
          { name: 'Bob', scores: [] },
        ],
      };
      const r1 = s['~standard'].validate(valid);
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(isSuccess(r1)).toBe(true);
      if (isSuccess(r1)) expect(r1.value).toEqual(valid);

      const invalid = {
        users: [
          { name: 'Alice', scores: [1, 'x', 3] },
        ],
      };
      const r2 = s['~standard'].validate(invalid);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeDefined();
    });
  });

  describe('validate mode', () => {
    it('returns success for valid input', () => {
      settings({ standardMode: 'validate' });
      const s = standard(string());
      const result = s['~standard'].validate('hello');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe('hello');
    });

    it('returns failure with issues for invalid input', () => {
      settings({ standardMode: 'validate' });
      const s = standard(number());
      const result = s['~standard'].validate('not a number');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBeGreaterThan(0);
    });

    it('collects multiple issues for arrays', () => {
      settings({ standardMode: 'validate' });
      const s = standard(array(number()));
      const result = s['~standard'].validate(['x', 'y', 'z']);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBe(3);
    });
  });

  describe('check mode', () => {
    it('returns success for valid input', () => {
      settings({ standardMode: 'check' });
      const s = standard(string());
      const result = s['~standard'].validate('hello');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe('hello');
    });

    it('returns failure with issues for invalid input', () => {
      settings({ standardMode: 'check' });
      const s = standard(number());
      const result = s['~standard'].validate('not a number');
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBe(1);
      expect(result.issues![0]!.message).toBe('Invalid input');
    });

    it('works with union', () => {
      settings({ standardMode: 'check' });
      const s = standard(union([string(), number()]));
      const r1 = s['~standard'].validate('hello');
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate(42);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeUndefined();

      const r3 = s['~standard'].validate(true);
      expect(r3).not.toBeInstanceOf(Promise);
      if (r3 instanceof Promise) return;
      expect(r3.issues).toBeDefined();
    });

    it('works with int constraint', () => {
      settings({ standardMode: 'check' });
      const s = standard(int);
      const r1 = s['~standard'].validate(42);
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate(3.14);
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles null input', () => {
      const s = standard(string());
      const result = s['~standard'].validate(null);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
    });

    it('handles undefined input', () => {
      const s = standard(string());
      const result = s['~standard'].validate(undefined);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
    });

    it('handles empty object schema', () => {
      const s = standard(object({}));
      const r1 = s['~standard'].validate({});
      expect(r1).not.toBeInstanceOf(Promise);
      if (r1 instanceof Promise) return;
      expect(r1.issues).toBeUndefined();

      const r2 = s['~standard'].validate({ extra: 1 });
      expect(r2).not.toBeInstanceOf(Promise);
      if (r2 instanceof Promise) return;
      expect(r2.issues).toBeUndefined();
    });

    it('custom error message appears in issues', () => {
      const s = standard(string('Custom error'));
      const result = s['~standard'].validate(42);
      expect(result).not.toBeInstanceOf(Promise);
      if (result instanceof Promise) return;
      expect(result.issues).toBeDefined();
      expect(result.issues![0]!.message).toBe('Custom error');
    });
  });

  describe('type inference', () => {
    it('InferInput and InferOutput types are exported', () => {
      const schema = object({ id: string });
      expectTypeOf<InferOutput<typeof string>>().toBeString();
      expectTypeOf<InferInput<typeof schema>>().toEqualTypeOf<{ id: string }>();

      const parsed = parse(schema)({ id: 'abc' });
      expect(parsed).toEqual({ id: 'abc' });
      expectTypeOf<typeof parsed>().toEqualTypeOf<{ id: string }>();
    });
  });
});
