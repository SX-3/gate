import type { Compiler } from '../compiler';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { compile } from '../compiler';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';

type TupleItems = readonly Schema[];

type TupleOutput<T>
  = T extends readonly [infer First, ...infer Rest]
    ? [First extends Schema<infer Output> ? Output : never, ...TupleOutput<Rest>]
    : [];

interface TupleSchema<T extends TupleItems> extends Schema<TupleOutput<T>> {
  items: TupleItems;
  message: string;
}

const compileTuple: Compiler<TupleSchema<TupleItems>> = (options) => {
  const { schema, name, fail, path, context } = options;
  const items = schema.items;
  const length = items.length;

  if (!length) {
    return {
      lines: [`if(!Array.isArray(${name}) || ${name}.length !== 0)${fail(schema.message, path, name)}`],
      output: name,
    };
  }

  const lines = [
    `if(!Array.isArray(${name}) || ${name}.length !== ${length})${fail(schema.message, path, name)}`,
  ];

  let needsReconstruction = false;
  const elementOutputs: string[] = [];

  for (let position = 0; position < length; position++) {
    const positionString = String(position);
    const elementAccess = `${name}[${positionString}]`;
    const elementVariable = `v${context.id}`;
    lines.push(`const ${elementVariable}=${elementAccess};`);

    const compiled = compile({
      ...options,
      schema: items[position]!,
      name: elementVariable,
      path: [...path, JSON.stringify(positionString)],
    });

    lines.push(...compiled.lines);

    const compiledOutput = compiled.output;
    elementOutputs.push(compiledOutput);
    if (compiledOutput !== elementVariable) {
      needsReconstruction = true;
    }
  }

  if (needsReconstruction) {
    lines.push(`${name}=[${elementOutputs.join(',')}]`);
  }

  return { lines, output: name };
};

export function tuple<const T extends readonly Schema[]>(
  items: T,
  message?: ErrorGetter,
): TupleSchema<T> {
  return createSchema({
    [TYPE]: SchemaType.TUPLE,
    compiler: compileTuple,
    items,
    message: getErrorMessage(message) ?? `Expected tuple of length ${items.length}`,
  });
}
