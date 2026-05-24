import { describe, expect, it } from 'bun:test';
import { check, parse, validate } from '../../src/compiler';
import { GateError } from '../../src/error';
import { instance } from '../../src/types/instance';

class TestClass {}
class OtherClass {}

describe('instance', () => {
  it('accepts instances of the constructor', () => {
    const p = parse(instance(TestClass));
    expect(p(new TestClass())).toBeInstanceOf(TestClass);
  });

  it('rejects non-instances', () => {
    const p = parse(instance(TestClass));
    expect(() => p({})).toThrow(GateError);
    expect(() => p(new OtherClass())).toThrow(GateError);
  });

  it('rejects primitives', () => {
    const p = parse(instance(TestClass));
    expect(() => p(42)).toThrow(GateError);
    expect(() => p('hello')).toThrow(GateError);
    expect(() => p(null)).toThrow(GateError);
  });

  it('works with validate mode', () => {
    const v = validate(instance(TestClass));
    expect(v(new TestClass()).issues).toBeUndefined();
    expect(v({}).issues).toBeDefined();
  });

  it('works with check mode', () => {
    expect(check(instance(TestClass))(new TestClass())).toBe(true);
    expect(check(instance(TestClass))({})).toBe(false);
  });

  it('includes constructor name in error message', () => {
    const p = parse(instance(TestClass));
    try {
      p({});
      expect.unreachable();
    }
    catch (error) {
      expect((error as GateError).message).toContain('TestClass');
    }
  });
});
