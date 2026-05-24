import { SchemaType } from '../schema';
import { createPrimitive } from './primitive';

export const boolean = createPrimitive<boolean>(SchemaType.BOOLEAN, 'boolean');
