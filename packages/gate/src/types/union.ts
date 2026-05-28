import type { Compiler } from '../compiler';
import type { Context } from '../compiler/context';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import type { Literal } from './literal';
import { compile, EMPTY_RESULT } from '../compiler';
import { checkCost } from '../compiler/utils';

import { getErrorMessage } from '../error';
import { createSchema, isSchema, SchemaType, TYPE } from '../schema';
import { literal } from './literal';

type UnionValue = Schema | Literal;
type GetValue<T> = T extends Schema<infer O> ? O : T;

interface UnionSchema<T> extends Schema<T> {
  variants: Schema[];
  message: string;
}

/** Sort variants by check cost — cheapest first, so invalid data is rejected faster. */
export function sortVariantsByCost(schemas: Schema[]): Schema[] {
  return schemas.toSorted((a, b) => checkCost(a) - checkCost(b));
}

/**
 * For a simple schema (no compiler, single rule), return a condition that
 * is TRUE when this variant matches. E.g. for `string()` returns
 * `typeof v === "string"`.
 * Returns null if the variant can't be reduced to a simple predicate.
 */
function simpleMatch(variant: Schema, name: string, context: Context): string | null {
  if (variant.compiler) return null;
  const rules = variant.rules?.(name, context);
  if (!rules || rules.length !== 1) return null;
  const [condition] = rules[0]!;
  // Bail if condition is complex (has &&, ||, or runtime deps)
  if (condition.includes('||') || condition.includes('&&') || condition.includes('r.')) {
    return null;
  }
  return condition;
}

const compileUnion: Compiler<UnionSchema<unknown>> = (options) => {
  const { schema, name, fail, path, context } = options;
  const length = schema.variants.length;
  if (!length) return EMPTY_RESULT;

  // Single variant — compile directly.
  if (length === 1) return compile({ ...options, schema: schema.variants[0]! });

  // Separate simple variants from complex ones.
  // Simple variants have a single invertible rule → we can check with a quick predicate.
  const simple: string[] = [];
  const complex: Schema[] = [];

  for (const variant of sortVariantsByCost(schema.variants)) {
    const predicate = simpleMatch(variant, name, context);
    if (predicate) simple.push(predicate);
    else complex.push(variant);
  }

  // All variants are simple → single if with combined condition.
  if (complex.length === 0) {
    // if (!(simple1 || simple2 || ...)) fail(...)
    const merged = simple.join('||');
    return {
      lines: [`if(!(${merged}))${fail(schema.message, path, name)}`],
      output: name,
    };
  }

  // Mixed: simple predicates first (quick break), then complex variants with labels.
  const rootLabel = `u${context.id}`;
  const lines = [`${rootLabel}:{`];

  if (simple.length > 0) {
    lines.push(`if(${simple.join('||')})break ${rootLabel};`);
  }

  for (const variant of complex) {
    const label = `u${context.id}`;
    const compiled = compile({
      ...options,
      schema: variant,
      fail: () => `break ${label};`,
    });
    lines.push(`${label}: {`, ...compiled.lines, `break ${rootLabel};}`);
  }

  lines.push(`${fail(schema.message, path, name)}}`);

  return { lines, output: name };
};

export function union<V extends [UnionValue, ...UnionValue[]]>(variants: V, message?: ErrorGetter): UnionSchema<GetValue<V[number]>> {
  return createSchema({
    [TYPE]: SchemaType.UNION,
    compiler: compileUnion,
    variants: variants.map(s => isSchema(s) ? s : literal(s)),
    message: getErrorMessage(message) ?? 'Union failed',
  });
}
