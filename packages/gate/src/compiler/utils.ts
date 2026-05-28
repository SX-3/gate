import type { Schema } from '../schema';
import { Context } from './context';

const IDENTIFIER_REGEX = /^[a-z_$][\w$]*$/i;
export function isIdentifier(name: string): boolean {
  return IDENTIFIER_REGEX.test(name);
}

export function rulesCount(schema: Schema): number {
  return schema.rules?.('', new Context())?.length ?? 0;
}

/** True when a schema has no compiler and at most 1 rule — cheap enough to inline. */
export function isSimpleSchema(schema: Schema): boolean {
  return !schema.compiler && rulesCount(schema) <= 1;
}

export function checkCost(schema: Schema): number {
  let points = rulesCount(schema);
  if (schema.compiler) points += 10;
  return points;
}

export function isDynamicPath(path: string[]): boolean {
  return path.some(p => !p.startsWith('"'));
}

export function serialize(value: unknown): string {
  if (typeof value === 'bigint') return `${String(value)}n`;
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}

/** Returns the logical inverse of a condition string. */
export function invertCondition(condition: string): string {
  const inner = condition.trim();

  // De Morgan: invert(A || B) = invert(A) && invert(B)
  if (inner.includes('||')) {
    return inner
      .split('||')
      .map(c => invertCondition(c.trim()))
      .join('&&');
  }

  // De Morgan: invert(A && B) = invert(A) || invert(B)
  if (inner.includes('&&')) {
    return inner
      .split('&&')
      .map(c => invertCondition(c.trim()))
      .join('||');
  }

  // Strip wrapping parens
  let stripped = inner;
  while (stripped.startsWith('(') && stripped.endsWith(')')) {
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < stripped.length; i++) {
      if (stripped[i] === '(') depth++;
      if (stripped[i] === ')') depth--;
      if (depth === 0 && i < stripped.length - 1) {
        balanced = false;
        break;
      }
    }
    if (!balanced) break;
    stripped = stripped.slice(1, -1).trim();
  }

  // Leading negation — remove it
  if (stripped.startsWith('!')) {
    return stripped.slice(1);
  }

  // Comparison operators — check longer ones first to avoid partial matches
  if (stripped.includes('!==')) return stripped.replace('!==', '===');
  if (stripped.includes('===')) return stripped.replace('===', '!==');
  if (stripped.includes('!=')) return stripped.replace('!=', '==');
  if (stripped.includes('==')) return stripped.replace('==', '!=');
  if (stripped.includes('>=')) return stripped.replace('>=', '<');
  if (stripped.includes('<=')) return stripped.replace('<=', '>');
  if (stripped.includes('>')) return stripped.replace('>', '<=');
  if (stripped.includes('<')) return stripped.replace('<', '>=');

  return condition.includes(' ') ? `!(${condition})` : `!${condition}`;
}
