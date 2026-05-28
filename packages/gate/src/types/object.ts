import type { Compiler } from '../compiler';
import type { Context } from '../compiler/context';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import type { Simplify } from '../types';
import type { Literal } from './literal';
import { compile } from '../compiler';
import { EQ, IS_BUN, NEQ } from '../compiler/platform';
import { checkCost, isIdentifier } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { createSchema, isSchema, SchemaType, TYPE } from '../schema';
import { settings } from '../settings';
import { literal } from './literal';

type ObjectShape = Record<string, Schema | Literal>;

type MergeOutput<T extends Record<string, unknown>[]>
  = Simplify<T extends [infer First]
    ? First
    : T extends [infer First, ...infer Rest]
      ? Rest extends Record<string, unknown>[]
        ? Omit<First, KeysOf<Rest>> & MergeOutput<Rest>
        : First
      : Record<string, never>>;

type KeysOf<T extends Record<string, unknown>[]>
  = T extends [infer First, ...infer Rest]
    ? Rest extends Record<string, unknown>[]
      ? keyof First | KeysOf<Rest>
      : keyof First
    : never;

type GetRawType<T> = T extends { inner: Schema<infer U> }
  ? U
  : T extends Schema<infer U>
    ? U
    : T;

type ObjectOutput<T> = Simplify<{
  [K in keyof T as undefined extends GetRawType<T[K]> ? K : never]?: GetRawType<T[K]>;
} & {
  [K in keyof T as undefined extends GetRawType<T[K]> ? never : K]: GetRawType<T[K]>;
}>;

interface ObjectOptions {
  message?: ErrorGetter;
  strict?: boolean;
}

// T is now the OUTPUT type (flat), not the raw shape
interface ObjectSchema<T = Record<string, unknown>> extends Schema<T> {
  fields: Record<string, Schema>;
  message: string;
  strict: boolean;
}

interface UnwrapResult {
  definition: string;
  variables: [string, string][];
}

function key(key: string): string {
  return isIdentifier(key) ? key : JSON.stringify(key);
}

function access(object: string, key: string): string {
  return isIdentifier(key) ? `${object}.${key}` : `${object}["${key}"]`;
}

/** Sort object fields by check cost — cheapest first, so invalid data is rejected faster. */
function sortFieldsByCost(fields: Record<string, Schema>): string[] {
  return Object.keys(fields).sort((a, b) => checkCost(fields[a]!) - checkCost(fields[b]!));
}

function unwrap(name: string, keys: string[], context: Context): UnwrapResult {
  const destructure = IS_BUN && keys.length > 1;
  const variables: [string, string][] = keys.map(k => [k, `v${context.id}`]);
  const declarations = destructure
    ? variables.map(([k, varName]) => `${key(k)}:${varName}`)
    : variables.map(([k, varName]) => `${varName}=${access(name, k)}`);
  return {
    definition: destructure ? `let {${declarations.join(',')}}=${name}` : `let ${declarations.join(',')}`,
    variables,
  };
}

const compileObject: Compiler<ObjectSchema> = (options) => {
  const { schema, name, fail, path, context } = options;
  const fields = schema.fields;
  const keys = sortFieldsByCost(fields);

  // Empty object
  if (!keys.length) {
    const invalid = `typeof ${name} ${NEQ} "object" || ${name} === null`;
    const lines = [`if(${invalid})${fail(schema.message, path, name)}`];

    if (schema.strict) {
      const keyName = `k${context.id}`;
      lines.push(`for(const ${keyName} in ${name})${fail(`Unexpected key "${keyName}"`, path, name)}`);
    }
    else {
      lines.push(`${name}={};`);
    }

    return { lines, output: name };
  }

  const valid = `typeof ${name} ${EQ} "object" && ${name}`;
  const { definition, variables } = unwrap(name, keys, context);
  const lines = [
    `if(${valid}){`,
    `${definition};`,
  ];

  for (const [key, varName] of variables) {
    const compiled = compile({
      ...options,
      schema: fields[key]!,
      name: varName,
      path: [...path, JSON.stringify(key)],
    });
    lines.push(...compiled.lines);
    const out = compiled.output;
    if (out !== varName) lines.push(`${varName}=${out}`);
  }

  if (schema.strict) {
    const keyName = `k${context.id}`;
    const knownChecks = keys.map(k => `${keyName} ${NEQ} ${JSON.stringify(k)}`).join('&&');
    lines.push(`for(const ${keyName} in ${name}){if(${knownChecks})${fail(`Unexpected key "${keyName}"`, path, name)}}`);
  }
  else {
    // Strip: reassign name to a new object with only known keys, inside the if block
    lines.push(
      `${name}={${variables.map(([k, varName]) => `${key(k)}:${varName}`).join(',')}}`,
    );
  }

  lines.push(`}else{${fail(schema.message, path, name)}}`);

  return { lines, output: name };
};

function create<Shape extends ObjectShape>(shape?: Shape, options?: ObjectOptions): ObjectSchema<ObjectOutput<Shape>> {
  const fields: Record<string, Schema> = {};

  if (shape) {
    for (const [key, value] of Object.entries(shape)) {
      fields[key] = isSchema(value) ? value : literal(value);
    }
  }

  return createSchema({
    [TYPE]: SchemaType.OBJECT,
    fields,
    compiler: compileObject,
    message: getErrorMessage(options) ?? 'Expected object',
    strict: options?.strict ?? settings().strict,
  });
}

// Curry: merge(b) — 1 arg, returns function for pipe
export function merge<T extends Record<string, unknown>>(
  b: ObjectSchema<T>,
): (base: Schema<unknown>) => Schema<unknown>;
// Direct: merge(a, b, ...) — 2+ args, merges all
export function merge<T extends [Record<string, unknown>, Record<string, unknown>, ...Record<string, unknown>[]]>(
  ...schemas: { [K in keyof T]: ObjectSchema<T[K]> }
): ObjectSchema<MergeOutput<T>>;
export function merge<T extends Record<string, unknown>>(
  ...schemas: ObjectSchema<T>[]
): ObjectSchema<T> | ((base: Schema<unknown>) => Schema<unknown>) {
  if (schemas.length === 1) {
    return base => merge(base as ObjectSchema, schemas[0]!);
  }

  const fields: Record<string, Schema> = {};
  let strict = false;
  let message = 'Expected object';

  for (const schema of schemas) {
    Object.assign(fields, schema.fields);
    if (schema.strict) strict = true;
    message = schema.message || message;
  }

  return create(fields as any, { strict, message }) as unknown as ObjectSchema<T>;
}

export function strict<T extends Record<string, unknown>>(schema: ObjectSchema<T>, deep = true): ObjectSchema<T> {
  const fields: Record<string, Schema> = { ...schema.fields };

  if (deep) {
    for (const [key, value] of Object.entries(fields)) {
      if (value[TYPE] & SchemaType.OBJECT) fields[key] = strict(value as ObjectSchema, deep);
    }
  }

  return { ...schema, fields, strict: true };
}

export const object = Object.assign(create, create());
