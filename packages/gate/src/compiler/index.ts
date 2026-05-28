/* eslint-disable no-new-func */
import type { Schema } from '../schema';
import type { Result } from '../standard';
import { GateError } from '../error';
import { Context } from './context';
import { optimize } from './optimize';
import { invertCondition, isDynamicPath } from './utils';

export type Mode = 'parse' | 'validate' | 'check';

export interface CompilerOptions<S extends Schema = Schema> {
  schema: S;
  name: string;
  path: string[];
  context: Context;
  mode: Mode;
  fail: (message: string, path: string[], name: string) => string;
}

export type CompiledFunction<O> = (input: unknown) => O;

export interface CompiledResult {
  lines: string[];
  output: string;
}

export type Compiler<
  S extends Schema = Schema,
> = (options: CompilerOptions<S>) => CompiledResult;

export const EMPTY_RESULT: CompiledResult = { lines: [], output: '' };

function analyzePath(path: string[]): { parts: string[]; dynamic: string[] } {
  const parts: string[] = [];
  const dynamic: string[] = [];
  for (const part of path) {
    if (part.startsWith('"')) {
      parts.push(part);
    }
    else {
      parts.push(part);
      dynamic.push(part);
    }
  }
  return { parts, dynamic };
}

function failParse(context: Context, message: string, path: string[], name: string, errorName: string): string {
  if (isDynamicPath(path)) {
    const { parts, dynamic } = analyzePath(path);
    const params = ['v', ...dynamic].join(',');
    const args = [name, ...dynamic].join(',');
    const key = context.embed(`(${params})=>{throw new ${errorName}(${JSON.stringify(message)},[${parts.join(',')}])}`);
    return `${key}(${args});`;
  }

  const error = context.embed(`new ${errorName}(${JSON.stringify(message)},[${path.join(',')}])`);
  return `throw ${error};`;
}

function failValidate(context: Context, message: string, path: string[], name: string, issuesName: string): string {
  if (isDynamicPath(path)) {
    const { parts, dynamic } = analyzePath(path);
    const params = ['v', ...dynamic].join(',');
    const args = [name, ...dynamic].join(',');
    const key = context.embed(`(${params})=>{${issuesName}.push({message:${JSON.stringify(message)},path:[${parts.join(',')}]})}`);
    return `${key}(${args});`;
  }

  const errorName = context.embed(`{message: ${JSON.stringify(message)}, path: [${path.join(',')}]}`);
  return `${issuesName}.push(${errorName});`;
}

export function compile<S extends Schema>(options: CompilerOptions<S>): CompiledResult {
  const { schema, name, path, fail, context } = options;
  const compiler = schema.compiler;
  const result = compiler ? compiler(options) : { lines: [], output: name };

  const rules = schema.rules?.(name, context);
  if (rules && rules.length) {
    for (const [condition, message] of rules) {
      result.lines.push(`if(${invertCondition(condition)})${fail(message, path, name)}`);
    }
  }

  return result;
}

function build<O>(compiled: CompiledResult, context: Context, output?: string): CompiledFunction<O> {
  const { inline, params, values } = context.build();

  const code = optimize([
    '"use strict";',
    inline,
    'return i => {',
    compiled.lines.join(''),
    `return ${output ?? compiled.output};}`,
  ].join(''));

  const create = params ? new Function(params, code) : new Function(code);
  return create(...values) as CompiledFunction<O>;
}

// ── Public API ──

const PARSE_CACHE = Symbol('v:parse');
const CHECK_CACHE = Symbol('v:check');
const VALIDATE_CACHE = Symbol('v:validate');

export interface SchemaWithCache<O> extends Schema<O> {
  [PARSE_CACHE]?: CompiledFunction<O>;
  [CHECK_CACHE]?: CompiledFunction<O>;
  [VALIDATE_CACHE]?: CompiledFunction<O>;
}

export function parse<O>(schema: Schema<O>): CompiledFunction<O> {
  const cached = (schema as SchemaWithCache<O>)[PARSE_CACHE];
  if (cached) return cached;

  const context = new Context();
  const errorName = context.embed(GateError);
  const options: CompilerOptions = {
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'parse',
    fail: (message, path, name) => failParse(context, message, path, name, errorName),
  };

  const builded = build<O>(compile(options), context);
  Object.defineProperty(schema as SchemaWithCache<O>, PARSE_CACHE, {
    value: builded,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return builded;
}

export function validate<O>(schema: Schema<O>): CompiledFunction<Result<O>> {
  const cached = (schema as SchemaWithCache<Result<O>>)[VALIDATE_CACHE];
  if (cached) return cached;

  const context = new Context();
  const issues = context.embed('[]');
  const options: CompilerOptions = {
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'validate',
    fail: (m, p, n) => failValidate(context, m, p, n, issues),
  };

  const builded = build<Result<O>>(
    compile(options),
    context,
    `${issues}.length?{value:i,issues: ${issues}}:{value:i}`,
  );

  Object.defineProperty(schema as SchemaWithCache<Result<O>>, VALIDATE_CACHE, {
    value: builded,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return builded;
}

export function check<O>(schema: Schema<O>): CompiledFunction<boolean> {
  const cached = (schema as SchemaWithCache<boolean>)[CHECK_CACHE];
  if (cached) return cached;

  const context = new Context();
  const options: CompilerOptions = {
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'check',
    fail: () => 'return false;',
  };

  const builded = build<boolean>(compile(options), context, 'true');

  Object.defineProperty(schema as SchemaWithCache<boolean>, CHECK_CACHE, {
    value: builded,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return builded;
}
