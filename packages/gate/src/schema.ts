/* eslint-disable ts/prefer-literal-enum-member, no-restricted-syntax */
import type { Compiler } from './compiler';
import type { Context } from './compiler/context';
import { starndard } from './standard';

export const enum SchemaType {
  UNKNOWN = 0,
  STRING = 1 << 0, // 1
  NUMBER = 1 << 1, // 2
  BOOLEAN = 1 << 2, // 4
  BIGINT = 1 << 3, // 8
  LITERAL = 1 << 4, // 16
  OBJECT = 1 << 5, // 32
  ARRAY = 1 << 6, // 64
  UNION = 1 << 7, // 128
  MODIFIER = 1 << 8, // 256
  NEVER = 1 << 9, // 512
  INSTANCE = 1 << 10, // 1024
  TUPLE = 1 << 11, // 2048
  RECORD = 1 << 12, // 4096
  INTEGER = 1 << 13, // 8192
}

export const WITH_LENGTH = SchemaType.STRING | SchemaType.ARRAY;
export const TYPE = Symbol('v:type');

/** `[validCondition, message]` — condition is true when value is valid. */
export type Rule = [validCondition: string, message: string];
export type Rules = (variable: string, context: Context) => Rule[];

export interface Schema<T = unknown> {
  readonly _OUT?: T;
  readonly [TYPE]: SchemaType;
  readonly compiler?: Compiler<any>;
  readonly rules?: Rules;
}

export type Output<T extends Schema> = T extends Schema<infer O> ? O : never;

export function isSchema(value: unknown): value is Schema {
  return (typeof value === 'object' || typeof value === 'function') && value != null && TYPE in value;
}

export function createSchema<Output, S extends Schema<Output> = Schema<Output>>(schema: S): S {
  return starndard({ ...schema });
}
