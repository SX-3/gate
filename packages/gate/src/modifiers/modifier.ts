import type { Compiler } from '../compiler';
import type { Schema } from '../schema';
import { compile } from '../compiler';

export interface ModifierSchema<T> extends Schema<T> {
  /** Condition that must be true for the inner schema to be checked. */
  guard: (name: string) => string;
  inner: Schema<T>;
}

export const compileModifier: Compiler<ModifierSchema<unknown>> = (options) => {
  const { schema, name, context } = options;
  const guard = schema.guard(name);
  const inner = schema.inner;

  // If inner has nothing to check, skip entirely
  if (!inner.compiler) {
    const rules = inner.rules?.(name, context);
    if (!rules || !rules.length) return { lines: [], output: name };
  }

  const compiled = compile({ ...options, schema: schema.inner });
  const out = compiled.output;

  // Wrap everything in the guard, including any output reassignment
  const lines = [`if(${guard}){`, ...compiled.lines];
  if (out !== name) lines.push(`${name}=${out}`);
  lines.push('}');

  return { lines, output: name };
};
