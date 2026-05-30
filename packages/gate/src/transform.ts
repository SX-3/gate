import type { CompilerOptions } from './compiler';
import type { Context } from './compiler/context';
import type { Schema } from './schema';
import { compile } from './compiler';
import { createSchema, isSchema, SchemaType, TYPE } from './schema';

type Fail = CompilerOptions['fail'];
type Coercion = (name: string, fail: Fail, path: string[]) => string;

const JSONStringify: Coercion = (name, fail, path) => `try{${name}=JSON.stringify(${name})}catch{${fail('Incorrect value', path, name)}}`;

const COERCIONS: Record<number, Record<number, Coercion>> = {
  [SchemaType.STRING]: {
    [SchemaType.NUMBER | SchemaType.INTEGER]: name => `${name}=+${name};`,
    [SchemaType.BOOLEAN]: name => `${name}=${name}==="true";`,
    [SchemaType.BIGINT]: (name, fail, path) =>
      `try{${name}=BigInt(${name})}catch{${fail('Expected bigint', path, name)}}`,
    [SchemaType.OBJECT | SchemaType.ARRAY]: (name, fail, path) =>
      `try{${name}=JSON.parse(${name})}catch{${fail('Expected JSON', path, name)}}`,
  },

  [SchemaType.NUMBER | SchemaType.INTEGER]: {
    [SchemaType.STRING]: name => `${name}=""+${name};`,
    [SchemaType.BIGINT]: name => `${name}=BigInt(${name});`,
    [SchemaType.BOOLEAN]: name => `${name}=${name}!==0;`,
  },

  [SchemaType.BOOLEAN]: {
    [SchemaType.STRING]: name => `${name}=""+${name};`,
    [SchemaType.NUMBER]: name => `${name}=Number(${name});`,
    [SchemaType.BIGINT]: name => `${name}=BigInt(${name});`,
  },

  [SchemaType.BIGINT]: {
    [SchemaType.STRING]: name => `${name}=""+${name};`,
    [SchemaType.NUMBER]: name => `${name}=Number(${name});`,
    [SchemaType.BOOLEAN]: name => `${name}=${name}!==0n;`,
  },

  [SchemaType.OBJECT]: {
    [SchemaType.STRING]: JSONStringify,
    [SchemaType.BOOLEAN]: name => `${name}=Boolean(${name});`,
  },

  [SchemaType.ARRAY]: {
    [SchemaType.STRING]: JSONStringify,
    [SchemaType.BOOLEAN]: name => `${name}=Boolean(${name});`,
  },
};
function isOnlyTypeofCheck(schema: Schema, context: Context): boolean {
  if (schema.compiler) return false;
  const rules = schema.rules?.('x', context) ?? [];
  if (rules.length !== 1) return false;
  const [condition] = rules[0]!;
  // Проверяем что правило — чистый typeof без && / ||
  return /^typeof x\s*[!=]==?\s*["']\w+["']$/.test(condition.trim());
}

function getCoercer(from: SchemaType, to: SchemaType): Coercion | null {
  for (const fromKey of Object.keys(COERCIONS)) {
    if (+fromKey & from) {
      const toRecord = COERCIONS[+fromKey]!;
      for (const toKey of Object.keys(toRecord)) {
        if (+toKey & to) return toRecord[+toKey]!;
      }
    }
  }
  return null;
}

export function to<To>(target: Schema<To>): <From>(from: Schema<From>) => Schema<To>;
export function to<From, To>(from: Schema<From>, target: Schema<To>): Schema<To>;
export function to<From, To>(
  fromOrTarget: Schema<From> | Schema<To>,
  maybeTarget?: Schema<To>,
): Schema<To> | ((from: Schema<From>) => Schema<To>) {
  if (!isSchema(maybeTarget)) {
    const target = fromOrTarget as Schema<To>;
    return (from: Schema<From>) => to(from, target);
  }

  const from = fromOrTarget as Schema<From>;
  const target = maybeTarget;

  return createSchema(target[TYPE], {
    compiler: (options) => {
      const { name, fail, path, context } = options;

      // 1. Validate source
      const fromCompiled = compile({ ...options, schema: from });
      const lines = [...fromCompiled.lines];

      // 2. Inline coercion
      const coercer = getCoercer(from[TYPE], target[TYPE]);
      if (coercer) lines.push(coercer(name, fail, path));
      else throw new Error(`Unsupported coercion from ${from[TYPE]} to ${target[TYPE]}`);

      // 3. Validate target
      if (!isOnlyTypeofCheck(target, context)) {
        const targetCompiled = compile({ ...options, schema: target });
        lines.push(...targetCompiled.lines);
        const out = targetCompiled.output;
        if (out !== name) lines.push(`${name}=${out}`);
      }

      return { lines, output: name };
    },
  });
}

export function transform<Input, Output>(
  schema: Schema<Input>,
  parse: (value: Input) => Output,
  // serialize?: (value: Output) => Input,
): Schema<Output> {
  return createSchema(SchemaType.UNKNOWN, {
    compiler: (options) => {
      const { name, context } = options;

      // 1. Validate source
      const fromCompiled = compile({ ...options, schema });
      const lines = [...fromCompiled.lines];

      // 2. Apply transformation via embedded function
      const key = context.embed(parse);
      lines.push(`${name}=${key}(${name});`);

      return { lines, output: name };
    },
  });
}
