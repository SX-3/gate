/* eslint-disable no-new-func */
import type { Schema } from '../schema';
import type { Result } from '../standard';
import { GateError } from '../error';
import { Context } from './context';
import { optimize } from './optimize';
import { invertCondition, isDynamicPath } from './utils';

export const EMPTY_RESULT: CompiledResult = { lines: [], output: '' };

export type Mode = 'parse' | 'validate' | 'check';
export type FailHandler = (message: string, path: string[], name: string) => string;
export type Compiler<S extends Schema = Schema> = (options: CompilerOptions<S>) => CompiledResult;

interface CompilerOptions<S extends Schema = Schema> {
  schema: S;
  name: string;
  path: string[];
  context: Context;
  mode: Mode;
  fail: FailHandler;
}

type CompiledFunction<O> = (input: unknown) => O;

interface CompiledResult {
  lines: string[];
  output: string;
}

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

function failStandardParse(context: Context, message: string, path: string[], name: string): string {
  if (isDynamicPath(path)) {
    const { parts, dynamic } = analyzePath(path);
    const params = ['v', ...dynamic].join(',');
    const args = [name, ...dynamic].join(',');
    const key = context.embed(`(${params})=>({issues:[{message:${JSON.stringify(message)},path:[${parts.join(',')}]}]})`);
    return `return ${key}(${args});`;
  }
  const error = context.embed(`{issues:[{message:${JSON.stringify(message)},path:[${path.join(',')}]}]}`);
  return `return ${error};`;
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

const PARSE_CACHE = Symbol('v:parse');
const CHECK_CACHE = Symbol('v:check');
const VALIDATE_CACHE = Symbol('v:validate');
const STANDARD_PARSE_CACHE = Symbol('v:standard-parse');
const STANDARD_CHECK_CACHE = Symbol('v:standard-check');

interface SchemaWithCache<O> extends Schema<O> {
  [PARSE_CACHE]?: CompiledFunction<O>;
  [CHECK_CACHE]?: CompiledFunction<boolean>;
  [VALIDATE_CACHE]?: CompiledFunction<Result<O>>;
  [STANDARD_PARSE_CACHE]?: CompiledFunction<Result<O>>;
  [STANDARD_CHECK_CACHE]?: CompiledFunction<Result<O>>;
}

function cache<T>(schema: Schema, builded: CompiledFunction<T>, key: symbol): CompiledFunction<T> {
  Object.defineProperty(schema, key, {
    value: builded,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return builded;
}

// ── Public API ──

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

export function parse<O>(schema: Schema<O>): CompiledFunction<O> {
  // ? Check cache first
  const cached = (schema as SchemaWithCache<O>)[PARSE_CACHE];
  if (cached) return cached;

  // ? Compile
  const context = new Context();

  // ? Cache result
  return cache(schema, build<O>(compile({
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'parse',
    fail: (message, path, name) => failParse(
      context,
      message,
      path,
      name,
      context.embed(GateError),
    ),
  }), context), PARSE_CACHE);
}

export function validate<O>(schema: Schema<O>): CompiledFunction<Result<O>> {
  const cached = (schema as SchemaWithCache<O>)[VALIDATE_CACHE];
  if (cached) return cached;

  const context = new Context();
  const issues = context.embed('[]');

  return cache(schema, build<Result<O>>(
    compile({
      schema,
      name: 'i',
      path: [],
      context,
      mode: 'validate',
      fail: (m, p, n) => failValidate(context, m, p, n, issues),
    }),
    context,
    `${issues}.length?{value:i,issues: ${issues}}:{value:i}`,
  ), VALIDATE_CACHE);
}

export function check<O>(schema: Schema<O>): CompiledFunction<boolean> {
  const cached = (schema as SchemaWithCache<O>)[CHECK_CACHE];
  if (cached) return cached;

  const context = new Context();

  return cache(schema, build<boolean>(compile({
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'check',
    fail: () => 'return false;',
  }), context, 'true'), CHECK_CACHE);
}

export function standardParse<O>(schema: Schema<O>): CompiledFunction<Result<O>> {
  const cached = (schema as SchemaWithCache<O>)[STANDARD_PARSE_CACHE];
  if (cached) return cached;

  const context = new Context();

  return cache(schema, build<Result<O>>(compile({
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'parse',
    fail: (message, path, name) => failStandardParse(context, message, path, name),
  }), context, '{value:i}'), STANDARD_PARSE_CACHE);
}

export function standardCheck<O>(schema: Schema<O>): CompiledFunction<Result<O>> {
  const cached = (schema as SchemaWithCache<O>)[STANDARD_CHECK_CACHE];
  if (cached) return cached;

  const context = new Context();

  return cache(schema, build<Result<O>>(compile({
    schema,
    name: 'i',
    path: [],
    context,
    mode: 'check',
    fail: () => 'return {issues:[{message:"Invalid input"}]};',
  }), context, '{value:i}'), STANDARD_CHECK_CACHE);
}
