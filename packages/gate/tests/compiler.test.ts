import { describe, expect, it } from 'bun:test';
import { check, Context, parse, validate } from '../src/compiler';
import { GateError } from '../src/error';
import { array } from '../src/types/array';
import { int } from '../src/types/int';
import { number } from '../src/types/number';
import { object } from '../src/types/object';
import { string } from '../src/types/string';
import { union } from '../src/types/union';
import { unknown } from '../src/types/unknown';

describe('compiler', () => {
  describe('parse', () => {
    it('returns a function', () => {
      const p = parse(string());
      expect(typeof p).toBe('function');
    });

    it('caches compiled functions', () => {
      const s = string();
      const p1 = parse(s);
      const p2 = parse(s);
      expect(p1).toBe(p2);
    });

    it('works with complex nested schema', () => {
      const s = object({
        users: array(object({
          name: string(),
          scores: array(number()),
        })),
      });
      const p = parse(s);
      const valid = {
        users: [
          { name: 'Alice', scores: [1, 2, 3] },
          { name: 'Bob', scores: [] },
        ],
      };
      expect(p(valid)).toEqual(valid);

      const invalid = {
        users: [
          { name: 'Alice', scores: [1, 'x', 3] },
        ],
      };
      expect(() => p(invalid)).toThrow(GateError);
    });

    it('throws GateError with correct path', () => {
      const s = object({
        data: object({
          value: number(),
        }),
      });
      const p = parse(s);
      try {
        p({ data: { value: 'not a number' } });
        expect.unreachable();
      }
      catch (e) {
        expect(e).toBeInstanceOf(GateError);
        const err = e as GateError;
        expect(err.path).toBeArray();
      }
    });

    it('throws GateError with correct message', () => {
      const p = parse(string('custom'));
      try {
        p(42);
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('custom');
      }
    });

    it('unknown schema always passes', () => {
      const p = parse(unknown);
      expect(p(undefined)).toBe(undefined);
      expect(p(null)).toBe(null);
      expect(p(42)).toBe(42);
      expect(p({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe('validate', () => {
    it('returns success result for valid input', () => {
      const v = validate(string());
      const result = v('hello');
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toBe('hello');
    });

    it('returns failure result for invalid input', () => {
      const v = validate(number());
      const result = v('not number');
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.issues!.length).toBeGreaterThan(0);
      const issue = result.issues![0]!;
      expect(issue.message).toBeDefined();
    });

    it('caches compiled functions', () => {
      const s = string();
      const v1 = validate(s);
      const v2 = validate(s);
      expect(v1).toBe(v2);
    });

    it('handles empty object schema', () => {
      const v = validate(object({}));
      expect(v({}).issues).toBeUndefined();
      expect(v({ a: 1 }).issues).toBeUndefined();
    });

    it('collects multiple issues for arrays', () => {
      const v = validate(array(number()));
      const result = v(['x', 'y', 'z']);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBe(3);
    });
  });

  describe('check', () => {
    it('returns true for valid input', () => {
      expect(check(string())('hello')).toBe(true);
      expect(check(number())(42)).toBe(true);
    });

    it('returns false for invalid input', () => {
      expect(check(string())(42)).toBe(false);
      expect(check(number())('42')).toBe(false);
    });

    it('caches compiled functions', () => {
      const s = string();
      const c1 = check(s);
      const c2 = check(s);
      expect(c1).toBe(c2);
    });

    it('works with union', () => {
      const c = check(union([string(), number()]));
      expect(c('hello')).toBe(true);
      expect(c(42)).toBe(true);
      expect(c(true)).toBe(false);
    });

    it('works with constraints', () => {
      const c = check(int);
      expect(c(42)).toBe(true);
      expect(c(3.14)).toBe(false);
    });
  });

  describe('all modes on same schema', () => {
    it('parse, validate, check all work independently', () => {
      const s = string();

      const p = parse(s);
      expect(p('hi')).toBe('hi');
      expect(() => p(42)).toThrow(GateError);

      const v = validate(s);
      expect(v('hi').issues).toBeUndefined();
      expect(v(42).issues).toBeDefined();

      const c = check(s);
      expect(c('hi')).toBe(true);
      expect(c(42)).toBe(false);
    });
  });

  describe('context', () => {
    const ctx = new Context();
    it('deduplicate embed', () => {
      const obj = {};
      const k1 = ctx.embed(obj);
      expect(k1).toBeString();
      expect(ctx.embed(obj)).toBe(k1);
    });

    it('inline strings', () => {
      const key = ctx.embed(JSON.stringify('hello'));
      expect(key).toBeString();
      expect(ctx.build().inline).toBe(` const ${key}="hello";`);
    });
  });
});
