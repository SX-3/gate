import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { array } from '../../src/types/array';
import { number } from '../../src/types/number';
import { object } from '../../src/types/object';
import { string } from '../../src/types/string';
import { unknown } from '../../src/types/unknown';

describe('array', () => {
  describe('parse', () => {
    it('array of strings', () => {
      const p = parse(array(string));
      expect(p(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(p([])).toEqual([]);
      expect(() => p(['a', 1, 'c'])).toThrow(GateError);
    });

    it('array of numbers', () => {
      const p = parse(array(number));
      expect(p([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => p([1, '2', 3])).toThrow(GateError);
    });

    it('array of any (unknown)', () => {
      const p = parse(array(unknown));
      expect(p([1, 'a', true, null])).toEqual([1, 'a', true, null]);
    });

    it('throws on non-array input', () => {
      const p = parse(array(string));
      expect(() => p('not array')).toThrow(GateError);
      expect(() => p(null)).toThrow(GateError);
      expect(() => p(42)).toThrow(GateError);
      expect(() => p({})).toThrow(GateError);
    });

    it('array of objects', () => {
      const p = parse(array(object({ id: number, name: string })));
      expect(p([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(() => p([{ id: 1, name: 'Alice' }, { id: 'two', name: 'Bob' }])).toThrow(GateError);
    });

    it('nested arrays', () => {
      const p = parse(array(array(number)));
      expect(p([[1, 2], [3, 4]])).toEqual([[1, 2], [3, 4]]);
      expect(() => p([[1, 2], [3, 'x']])).toThrow(GateError);
    });

    it('custom message', () => {
      const p = parse(array(string, 'Nope array'));
      try {
        p(42);
        expect.unreachable();
      }
      catch (e) {
        expect((e as GateError).message).toBe('Nope array');
      }
    });
  });

  describe('validate', () => {
    it('returns { value } on success', () => {
      const v = validate(array(number));
      const result = v([1, 2, 3]);
      expect(result.issues).toBeUndefined();
      expect((result as any).value).toEqual([1, 2, 3]);
    });

    it('returns { issues } on failure', () => {
      const v = validate(array(string));
      const result = v([1, 2, 3]);
      expect(result.issues).toBeDefined();
      expect(result.issues!.length).toBe(3);
    });
  });

  describe('check', () => {
    it('returns true for valid', () => {
      expect(check(array(string))(['a', 'b'])).toBe(true);
      expect(check(array(number))([])).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(check(array(string))([1, 2])).toBe(false);
      expect(check(array(number))('nope')).toBe(false);
    });
  });

  describe('error paths', () => {
    it('includes index in path', () => {
      const p = parse(array(string));
      try {
        p(['ok', 42, 'ok']);
        expect.unreachable();
      }
      catch (e) {
        const err = e as GateError;
        expect(err.path.length).toBeGreaterThan(0);
      }
    });
  });

  // NOTE: constraints on arrays (length, max, min) don't work yet because
  // compileArray ignores added rules. This is a known design limitation.
  // TODO: fix compileArray to also check schema.rules after element validation.
});
