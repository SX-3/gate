/* eslint-disable  antfu/no-top-level-await, style/max-statements-per-line */
'use strict';
import { bench, do_not_optimize, group, run, summary } from 'mitata';
import {
  invalidUser,
  SuryCompiledUserSchema,
  TypeBoxCompiledUserSchema,
  GateCompiledUserSchema,
  validUser,
  // ZodUserSchema,
} from './data/user.ts';

const GC: 'inner' | 'once' = 'inner';

group('parsing - valid', () => {
  summary(() => {
    // bench('zod', () => ZodUserSchema.parse(validUser)).gc('inner');
    bench('typebox', () => do_not_optimize(TypeBoxCompiledUserSchema.Parse(validUser))).gc(GC);
    bench('sury', () => do_not_optimize(SuryCompiledUserSchema(validUser))).gc(GC);
    bench('gate', () => do_not_optimize(GateCompiledUserSchema(validUser))).gc(GC);
  });
});

group('parsing - invalid', () => {
  summary(() => {
    // bench('zod', () => {
    //   try { ZodUserSchema.parse(invalidUser); }
    //   catch { }
    // }).gc('inner');

    bench('typebox', () => {
      try { do_not_optimize(TypeBoxCompiledUserSchema.Parse(invalidUser)); }
      catch { }
    }).gc(GC);

    bench('sury', () => {
      try { do_not_optimize(SuryCompiledUserSchema(invalidUser)); }
      catch { }
    }).gc(GC);

    bench('gate', () => {
      try { do_not_optimize(GateCompiledUserSchema(invalidUser)); }
      catch { }
    }).gc(GC);
  });
});

await run();
