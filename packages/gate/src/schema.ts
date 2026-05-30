/* eslint-disable ts/prefer-literal-enum-member, no-restricted-syntax */
import type { Compiler } from './compiler';
import type { Context } from './compiler/context';
import type { Props, StandardSchemaV1 } from './standard';
import { check, parse, validate } from './compiler';
import { GateError } from './error';
import { settings } from './settings';

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

export interface Schema<I = unknown, O = I> {
  readonly [TYPE]: SchemaType;
  readonly 'compiler'?: Compiler<any>;
  readonly 'rules'?: Rules;
  readonly '~standard': Props<I, O>;
}

export type Output<T extends Schema> = T extends Schema<unknown, infer O> ? O : never;

interface SchemaCreateOptions {
  readonly compiler?: Compiler<any>;
  readonly rules?: Rules;
  readonly [key: string]: unknown;
}

export function isSchema(value: unknown): value is Schema {
  return (typeof value === 'object' || typeof value === 'function') && value != null && TYPE in value;
}

export function createSchema<
  Output,
  Options extends SchemaCreateOptions,
>(type: SchemaType, options: Options): Schema<Output> & Options {
  const schema = { ...options, [TYPE]: type } as Schema<Output> & Options;
  let standard: StandardSchemaV1<unknown, Output>['~standard']['validate'];

  switch (settings().standardMode) {
    case 'parse':
      standard = (value: unknown) => {
        try {
          return { value: parse(schema)(value) };
        }
        catch (e) {
          if (e instanceof GateError) return { issues: [{ message: e.message, path: e.path }] };
          throw e;
        }
      };
      break;
    case 'validate':
      standard = validate(schema);
      break;
    case 'check':
      standard = (value: unknown) => check(schema)(value) ? { value: (value as Output) } : { issues: [{ message: 'Invalid input' }] };
      break;
  }

  return {
    ...schema,
    '~standard': {
      version: 1,
      vendor: '@sx3/gate',
      validate: standard,
    } as const,
  };
}
