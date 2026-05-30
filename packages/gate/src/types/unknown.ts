import type { Schema } from '../schema';
import { createSchema, SchemaType } from '../schema';

const create = (): Schema<unknown> => createSchema(SchemaType.UNKNOWN, {});

export const unknown = Object.assign(create, create());
