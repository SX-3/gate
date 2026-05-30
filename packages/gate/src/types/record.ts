import type { Compiler } from '../compiler';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { compile } from '../compiler';
import { NEQ } from '../compiler/platform';
import { getErrorMessage } from '../error';
import { createSchema, SchemaType } from '../schema';

interface RecordSchema<T> extends Schema<Record<string, T>> {
  value: Schema<T>;
  message: string;
}

const compileRecord: Compiler<RecordSchema<unknown>> = (options) => {
  const { schema, name, fail, path, context } = options;
  const value = schema.value;

  // Validate: non-null object
  const lines = [
    `if(typeof ${name} ${NEQ} "object" || ${name} === null)${fail(schema.message, path, name)}`,
  ];

  // Iterate keys and validate each value
  const keyVariable = `k${context.id}`;
  const valueVariable = `v${context.id}`;

  lines.push(`for(const ${keyVariable} in ${name}){`);
  lines.push(`let ${valueVariable}=${name}[${keyVariable}];`);

  const compiled = compile({
    ...options,
    schema: value,
    name: valueVariable,
    path: [...path, keyVariable],
  });

  lines.push(...compiled.lines);

  const compiledOutput = compiled.output;
  if (compiledOutput !== valueVariable) {
    lines.push(`${name}[${keyVariable}]=${compiledOutput};`);
  }

  lines.push('}');

  return { lines, output: name };
};

export function record<T>(value: Schema<T>, message?: ErrorGetter): Schema<Record<string, T>> {
  return createSchema(SchemaType.RECORD, {

    compiler: compileRecord,
    value,
    message: getErrorMessage(message) ?? 'Expected object',
  });
}
