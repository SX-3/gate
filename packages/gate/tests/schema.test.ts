import { describe, expect, it } from 'bun:test';
import { nullable } from '../src/modifiers/nullable';
import { nullish } from '../src/modifiers/nullish';
import { optional } from '../src/modifiers/optional';
import { isSchema, SchemaType, TYPE } from '../src/schema';
import { array } from '../src/types/array';
import { bigint } from '../src/types/bigint';
import { boolean } from '../src/types/boolean';
import { literal } from '../src/types/literal';
import { number } from '../src/types/number';
import { object } from '../src/types/object';
import { string } from '../src/types/string';
import { union } from '../src/types/union';
import { unknown } from '../src/types/unknown';

describe('isSchema', () => {
  it('should return true for valid schemas (value form)', () => {
    expect(isSchema(string)).toBe(true);
    expect(isSchema(number)).toBe(true);
    expect(isSchema(boolean)).toBe(true);
    expect(isSchema(bigint)).toBe(true);
    expect(isSchema(unknown)).toBe(true);
    expect(isSchema(literal(42))).toBe(true);
    expect(isSchema(object({}))).toBe(true);
    expect(isSchema(array(string))).toBe(true);
  });

  it('should return true for valid schemas (functional form)', () => {
    expect(isSchema(string())).toBe(true);
    expect(isSchema(number())).toBe(true);
    expect(isSchema(boolean())).toBe(true);
    expect(isSchema(bigint())).toBe(true);
    expect(isSchema(unknown())).toBe(true);
  });

  it('should return false for non-schemas', () => {
    expect(isSchema(null)).toBe(false);
    expect(isSchema(undefined)).toBe(false);
    expect(isSchema(42)).toBe(false);
    expect(isSchema('hello')).toBe(false);
    expect(isSchema({})).toBe(false);
    expect(isSchema(() => {})).toBe(false);
    expect(isSchema([])).toBe(false);
  });

  it('should return true for modifiers', () => {
    expect(isSchema(nullable(string))).toBe(true);
    expect(isSchema(optional(string))).toBe(true);
    expect(isSchema(nullish(string))).toBe(true);
  });

  it('should return true for constraints', () => {
    expect(isSchema(string())).toBe(true);
  });
});

describe('SchemaType', () => {
  it('should assign correct types to schemas', () => {
    expect(string[TYPE]).toBe(SchemaType.STRING);
    expect(number[TYPE]).toBe(SchemaType.NUMBER);
    expect(boolean[TYPE]).toBe(SchemaType.BOOLEAN);
    expect(bigint[TYPE]).toBe(SchemaType.BIGINT);
    expect(unknown[TYPE]).toBe(SchemaType.UNKNOWN);
    expect(literal(42)[TYPE]).toBe(SchemaType.LITERAL);
    expect(object({})[TYPE]).toBe(SchemaType.OBJECT);
    expect(array(string)[TYPE]).toBe(SchemaType.ARRAY);
    expect(union([string(), number()])[TYPE]).toBe(SchemaType.UNION);
    expect(nullable(string)[TYPE]).toBe(SchemaType.MODIFIER);
    expect(optional(string)[TYPE]).toBe(SchemaType.MODIFIER);
    expect(nullish(string)[TYPE]).toBe(SchemaType.MODIFIER);
  });

  it('should have correct bitmask values', () => {
    expect(SchemaType.UNKNOWN).toBe(0);
    expect(SchemaType.STRING).toBe(1);
    expect(SchemaType.NUMBER).toBe(2);
    expect(SchemaType.BOOLEAN).toBe(4);
    expect(SchemaType.BIGINT).toBe(8);
    expect(SchemaType.LITERAL).toBe(16);
    expect(SchemaType.OBJECT).toBe(32);
    expect(SchemaType.ARRAY).toBe(64);
    expect(SchemaType.UNION).toBe(128);
    expect(SchemaType.MODIFIER).toBe(256);
  });
});
