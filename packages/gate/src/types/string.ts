import { SchemaType } from '../schema';
import { createPrimitive } from './primitive';

export const string = createPrimitive<string>(SchemaType.STRING, 'string');
