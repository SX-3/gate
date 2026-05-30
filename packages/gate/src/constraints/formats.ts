import type { Context } from '../compiler/context';
import type { ErrorGetter } from '../error';
import type { Schema } from '../schema';
import { compile } from '../compiler';
import { EQ } from '../compiler/platform';
import { getErrorMessage } from '../error';
import { createSchema, extendSchema, isSchema, SchemaType, TYPE } from '../schema';
import { uint16 } from '../types/int';

function createFormat<T extends string>(
  regex: RegExp,
  defaultMessage: string,
): Schema<T> & ((schema: Schema<T>, message?: ErrorGetter) => Schema<T>) & ((message?: ErrorGetter) => Schema<T>) {
  function format(schema: Schema<T>, message?: ErrorGetter): Schema<T>;
  function format(message?: ErrorGetter): Schema<T>;
  function format(
    schemaOrMessage?: Schema<T> | ErrorGetter,
    maybeMessage?: ErrorGetter,
  ): Schema<T> {
    const message = getErrorMessage(maybeMessage) ?? defaultMessage;

    if (isSchema(schemaOrMessage)) {
      return extendSchema(schemaOrMessage, {
        rules: (name: string, context: Context) => {
          const key = context.embed(regex);
          return [
            [regex.global || regex.sticky
              ? `(${key}.lastIndex=0,${key}.test(${name}))`
              : `${key}.test(${name})`, message],
          ];
        },
      });
    }

    return createSchema(SchemaType.STRING, {
      rules: (name: string, context: Context) => {
        const key = context.embed(regex);
        return [
          [`typeof ${name} ${EQ} "string"`, message],
          [regex.global || regex.sticky
            ? `(${key}.lastIndex=0,${key}.test(${name}))`
            : `${key}.test(${name})`, message],
        ];
      },
    });
  }

  return Object.assign(format, format()) as Schema<T> & typeof format;
}

/** Validates an email address via regex. */
export const email = createFormat(
  /^(?!\.)(?!.+\.\.)([\w'+\-.]*)[\w+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
  'Invalid email',
);

/** Validates a UUID v4 string. */
export const uuid = createFormat(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Invalid UUID',
);

/** Validates a CUID string. */
export const cuid = createFormat(
  /^c[^\s-]{8,}$/i,
  'Invalid CUID',
);

/** Validates a URL string (starts with http:// or https://). */
export const url = createFormat(
  /^https?:\/\/[\w\-.][-\w]*\.[\w!#$\x26-\x2F:;=?@[\]~]*$/,
  'Invalid URL',
);

/** Validates a UTC datetime string. */
export const datetime = createFormat(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
  'Invalid datetime',
);

/** Trims whitespace from a string (inline transformation). */
export function trim(schema: Schema<string>): Schema<string> {
  return createSchema(schema[TYPE], {
    compiler: (options) => {
      const name = options.name;
      const compiled = compile({ ...options, schema });
      compiled.lines.push(`${name}=${name}.trim();`);
      return compiled;
    },
  });
}

const createPort = (message?: ErrorGetter): Schema<number> => uint16(getErrorMessage(message) ?? 'Invalid port');

/**
 * Validates a port number (integer, 0–65535).
 */
export const port = Object.assign(createPort, createPort());
