import { add, complete, cycle, suite } from 'benny';
import {
  GateCompiledUserSchema,
  invalidUser,
  SuryCompiledUserSchema,
  TypeBoxCompiledUserSchema,
  validUser,
} from './data/user.ts';

suite(
  'parse - valid',
  add('sury', () => SuryCompiledUserSchema(validUser)),
  add('gate', () => GateCompiledUserSchema(validUser)),
  add('typebox', () => TypeBoxCompiledUserSchema.Parse(validUser)),
  cycle(),
  complete(),
);

suite(
  'parse - inalid',
  add('sury', () => {
    try {
      SuryCompiledUserSchema(invalidUser);
    }
    catch {}
  }),
  add('gate', () => {
    try {
      GateCompiledUserSchema(invalidUser);
    }
    catch {}
  }),
  add('typebox', () => {
    try {
      TypeBoxCompiledUserSchema.Parse(invalidUser);
    }
    catch {}
  }),
  cycle(),
  complete(),
);
