import { add, complete, cycle, suite } from 'benny';
import { data, GateCompiledSchema, SuryCompiledSchema } from './data/moltar.ts';

suite(
  'moltar - valid',
  add('sury', () => SuryCompiledSchema(data)),
  add('gate', () => GateCompiledSchema(data)),
  cycle(),
  complete(),
);
