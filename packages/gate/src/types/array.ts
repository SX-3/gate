import type { Compiler } from '../compiler';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { compile } from '../compiler';
import { isSimpleSchema } from '../compiler/utils';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType, TYPE } from '../schema';
import { unknown } from './unknown';

interface ArraySchema<Element> extends Schema<Element[]> {
  element: Schema<Element>;
  message: string;
}

const compileArray: Compiler<ArraySchema<unknown>> = (options) => {
  const { schema, name, fail, path, context } = options;
  const lengthName = `l${context.id}`;
  const counterName = `i${context.id}`;

  const lines = [
    `if(Array.isArray(${name})){`,
    `const ${lengthName} = ${name}.length;`,
    `for(let ${counterName} = 0; ${counterName} < ${lengthName}; ++${counterName}){`,
  ];

  let elementName = `${name}[${counterName}]`;
  if (!isSimpleSchema(schema.element)) {
    const elementVariableName = `v${context.id}`;
    lines.push(`let ${elementVariableName} = ${elementName};`);
    elementName = elementVariableName;
  }

  const compiled = compile({
    ...options,
    schema: schema.element,
    name: elementName,
    path: [...path, counterName],
  });

  lines.push(...compiled.lines);
  const ouptut = compiled.output;
  if (ouptut !== elementName) lines.push(`${elementName}=${ouptut};`);
  lines.push(`}}else{${fail(schema.message, path, name)}}`);

  return {
    lines,
    output: name,
  };
};

function create<Element>(element: Schema<Element>, message?: ErrorGetter): ArraySchema<Element> {
  return createSchema({
    [TYPE]: SchemaType.ARRAY,
    element,
    compiler: compileArray,
    message: getErrorMessage(message) ?? 'Expected array',
  });
}

export const array = Object.assign(create, create(unknown));
