import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../src/compiler';
import { max } from '../src/constraints/max';
import { min } from '../src/constraints/min';
import { GateError } from '../src/error';
import { pipe } from '../src/pipe';
import { to, transform } from '../src/transform';
import { array } from '../src/types/array';
import { bigint } from '../src/types/bigint';
import { boolean } from '../src/types/boolean';
import { int } from '../src/types/int';
import { number } from '../src/types/number';
import { object } from '../src/types/object';
import { string } from '../src/types/string';

describe('to', () => {
  it('string \u2192 number', () => {
    const s = to(string, number);
    const p = parse(s);
    expect(p('42')).toBe(42);
    expect(p('3.14')).toBe(3.14);
    expect(() => p('abc')).toThrow(GateError);
  });

  it('number \u2192 string', () => {
    const s = to(number(), string());
    const p = parse(s);
    expect(p(42)).toBe('42');
    expect(() => p('abc' as any)).toThrow(GateError);
  });

  it('string \u2192 number with target validation', () => {
    const s = to(string(), min(int, 0));
    const p = parse(s);
    expect(p('42')).toBe(42);
    expect(() => p('3.14')).toThrow(GateError);
    expect(() => p('-5')).toThrow(GateError);
  });

  it('string \u2192 boolean', () => {
    const s = to(string(), boolean());
    const p = parse(s);
    expect(p('true')).toBe(true);
    expect(p('false')).toBe(false);
    expect(p('xyz')).toBe(false);
  });

  it('string \u2192 bigint', () => {
    const s = to(string(), bigint());
    const p = parse(s);
    expect(p('9007199254740991')).toBe(9007199254740991n);
    expect(() => p('not a bigint')).toThrow(GateError);
  });

  it('number \u2192 bigint', () => {
    const s = to(number(), bigint());
    const p = parse(s);
    expect(p(42)).toBe(42n);
  });

  it('bigint \u2192 number', () => {
    const s = to(bigint(), number());
    const p = parse(s);
    expect(p(42n)).toBe(42);
  });

  it('bigint \u2192 string', () => {
    const s = to(bigint(), string());
    const p = parse(s);
    expect(p(42n)).toBe('42');
  });

  it('boolean → string', () => {
    const s = to(boolean(), string());
    const p = parse(s);
    expect(p(true)).toBe('true');
  });

  it('number → boolean', () => {
    const s = to(number(), boolean());
    const p = parse(s);
    expect(p(1)).toBe(true);
    expect(p(0)).toBe(false);
    expect(p(42)).toBe(true);
    expect(() => p('abc' as any)).toThrow(GateError);
  });

  it('bigint → boolean', () => {
    const s = to(bigint(), boolean());
    const p = parse(s);
    expect(p(1n)).toBe(true);
    expect(p(0n)).toBe(false);
    expect(() => p('abc' as any)).toThrow(GateError);
  });

  it('boolean → number', () => {
    const s = to(boolean(), number());
    const p = parse(s);
    expect(p(true)).toBe(1);
    expect(p(false)).toBe(0);
  });

  it('boolean → bigint', () => {
    const s = to(boolean(), bigint());
    const p = parse(s);
    expect(p(true)).toBe(1n);
    expect(p(false)).toBe(0n);
  });

  it('works with validate mode', () => {
    const s = to(string(), number());
    const v = validate(s);
    expect(v('42').issues).toBeUndefined();
    expect(v('abc').issues).toBeDefined();
  });

  it('works with check mode', () => {
    const s = to(string(), number());
    expect(check(s)('42')).toBe(true);
    expect(check(s)('abc')).toBe(false);
  });

  // \u2500\u2500 string \u2192 object \u2500\u2500
  it('string \u2192 object with known shape', () => {
    const s = to(string(), object({ a: number() }));
    const p = parse(s);
    expect(p('{"a":1}')).toEqual({ a: 1 });
    expect(p('{"a":42}')).toEqual({ a: 42 });
    expect(() => p('invalid json')).toThrow(GateError);
    expect(() => p(42 as any)).toThrow(GateError); // not a string
  });

  it('string \u2192 object with shape validation', () => {
    const s = to(string(), object({ name: string() }));
    const p = parse(s);
    expect(p('{"name":"Alice"}')).toEqual({ name: 'Alice' });
    expect(() => p('{"name":42}')).toThrow(GateError);
  });

  it('string \u2192 object strips unknown keys (non-strict)', () => {
    const s = to(string(), object({ name: string() }));
    const p = parse(s);
    expect(p('{"name":"Alice","extra":1}')).toEqual({ name: 'Alice' });
  });

  // \u2500\u2500 string \u2192 array \u2500\u2500
  it('string \u2192 array (JSON.parse)', () => {
    const s = to(string(), array(number()));
    const p = parse(s);
    expect(p('[1,2,3]')).toEqual([1, 2, 3]);
    expect(p('[]')).toEqual([]);
    expect(() => p('not json')).toThrow(GateError);
    expect(() => p('[1,"x"]')).toThrow(GateError);
  });

  it('string \u2192 array of strings', () => {
    const s = to(string(), array(string()));
    const p = parse(s);
    expect(p('["a","b"]')).toEqual(['a', 'b']);
    expect(() => p('[1,2]')).toThrow(GateError);
  });

  // \u2500\u2500 object \u2192 string \u2500\u2500
  it('object \u2192 string (JSON.stringify)', () => {
    const s = to(object({ a: number() }), string());
    const p = parse(s);
    expect(p({ a: 1 })).toBe('{"a":1}');
    expect(() => p('not an object' as any)).toThrow(GateError);
  });

  // \u2500\u2500 array \u2192 string \u2500\u2500
  it('array \u2192 string (JSON.stringify)', () => {
    const s = to(array(number()), string());
    const p = parse(s);
    expect(p([1, 2, 3])).toBe('[1,2,3]');
    expect(p([])).toBe('[]');
    expect(() => p('not an array' as any)).toThrow(GateError);
  });

  // \u2500\u2500 validate/check modes for object/array casts \u2500\u2500
  it('string \u2192 object validate mode', () => {
    const s = to(string(), object({ a: number() }));
    const v = validate(s);
    expect(v('{"a":1}').issues).toBeUndefined();
    expect(v('bad').issues).toBeDefined();
  });

  it('string \u2192 array check mode', () => {
    const s = to(string(), array(number()));
    expect(check(s)('[1,2]')).toBe(true);
    expect(check(s)('bad')).toBe(false);
  });

  it('object \u2192 string check mode', () => {
    const s = to(object({ x: number() }), string());
    expect(check(s)({ x: 1 })).toBe(true);
    expect(check(s)('bad' as any)).toBe(false);
  });

  it('array \u2192 string check mode', () => {
    const s = to(array(number()), string());
    expect(check(s)([1, 2])).toBe(true);
    expect(check(s)('bad' as any)).toBe(false);
  });
});

describe('transform', () => {
  it('transforms value via parse function', () => {
    const s = transform(string(), v => v.length);
    const p = parse(s);
    expect(p('hello')).toBe(5);
  });

  it('validates source before transforming', () => {
    const s = transform(string(), v => v.length);
    const p = parse(s);
    expect(() => p(42 as any)).toThrow(GateError);
  });

  it('works with validate mode', () => {
    const s = transform(string(), v => v.length);
    const v = validate(s);
    expect(v('hello').issues).toBeUndefined();
    expect(v(42 as any).issues).toBeDefined();
  });

  it('works with check mode', () => {
    const s = transform(string(), v => v.length);
    expect(check(s)('hello')).toBe(true);
    expect(check(s)(42 as any)).toBe(false);
  });

  it('complex transform', () => {
    const s = transform(string(), v => ({ value: Number.parseInt(v) }));
    const p = parse(s);
    expect(p('42')).toEqual({ value: 42 });
  });
});

describe('to in pipe', () => {
  it('pipe string -> bigint', () => {
    const s = pipe(string, to(bigint));
    const p = parse(s);
    expect(p('9007199254740991')).toBe(9007199254740991n);
    expect(() => p('not a bigint')).toThrow(GateError);
  });

  it('pipe string -> number', () => {
    const s = pipe(string, to(number));
    const p = parse(s);
    expect(p('42')).toBe(42);
    expect(p('3.14')).toBe(3.14);
    expect(() => p('abc')).toThrow(GateError);
  });

  it('pipe string -> boolean', () => {
    const s = pipe(string, to(boolean));
    const p = parse(s);
    expect(p('true')).toBe(true);
    expect(p('false')).toBe(false);
    expect(p('')).toBe(false);
  });

  it('pipe number -> string', () => {
    const s = pipe(number, to(string));
    const p = parse(s);
    expect(p(42)).toBe('42');
  });

  it('pipe with constraints after coercion', () => {
    const s = pipe(string, to(number), min(0));
    const p = parse(s);
    expect(p('42')).toBe(42);
    expect(() => p('-5')).toThrow(GateError);
  });

  it('pipe string -> bigint -> check range', () => {
    const s = pipe(string, to(bigint), min(0n), max(100n));
    const p = parse(s);
    expect(p('50')).toBe(50n);
    expect(() => p('-1')).toThrow(GateError);
    expect(() => p('101')).toThrow(GateError);
  });

  it('pipe validate mode', () => {
    const s = pipe(string, to(number));
    const v = validate(s);
    expect(v('42').issues).toBeUndefined();
    expect(v('abc').issues).toBeDefined();
  });

  it('pipe check mode', () => {
    const s = pipe(string, to(bigint));
    expect(check(s)('42')).toBe(true);
    expect(check(s)('abc')).toBe(false);
  });
});
