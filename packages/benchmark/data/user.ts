import type { TSchema } from 'typebox';
import * as G from '@sx3/gate';
import * as S from 'sury';
import { Type as T } from 'typebox';
import Schema from 'typebox/schema';
import { z as Z } from 'zod';

S.global({ disableNanNumberValidation: true });
export const SuryCompiledUserSchema = S.parser(S.schema({
  id: S.string,
  name: S.string.with(S.trim),
  age: S.number,
  email: S.string,
  first_name: S.string,
  last_name: S.string,
  role: S.union(['user', 'admin', 'moderator']),
  settings: S.array(S.schema({
    name: S.string,
    value: S.string,
  })),
  avatar: S.nullable(S.schema({
    key: S.string,
    width: S.number,
    height: S.number,
  })),
}));

const Nullable = <T extends TSchema>(schema: T) => T.Union([T.Null(), schema]);
export const TypeBoxCompiledUserSchema = Schema.Compile(T.Object({
  id: T.String(),
  name: T.String({ trim: true }),
  age: T.Number(),
  email: T.String(),
  first_name: T.String(),
  last_name: T.String(),
  role: T.Union(['user', 'admin', 'moderator']),
  settings: T.Array(T.Object({
    name: T.String(),
    value: T.String(),
  })),
  avatar: Nullable(T.Object({
    key: T.String(),
    width: T.Number(),
    height: T.Number(),
  })),
}));

export const ZodUserSchema = Z.object({
  id: Z.string(),
  name: Z.string().trim(),
  age: Z.number(),
  email: Z.string(),
  first_name: Z.string(),
  last_name: Z.string(),
  role: Z.enum(['user', 'admin', 'moderator']),
  settings: Z.array(Z.object({
    name: Z.string(),
    value: Z.string(),
  })),
  avatar: Z.nullable(Z.object({
    key: Z.string(),
    width: Z.number(),
    height: Z.number(),
  })),
});

G.settings({ checkNaN: false });
export const GateCompiledUserSchema = G.parse(G.object({
  id: G.string,
  name: G.trim(G.string),
  age: G.number,
  email: G.string,
  first_name: G.string,
  last_name: G.string,
  role: G.union(['user', 'admin', 'moderator']),
  settings: G.array(G.object({
    name: G.string,
    value: G.string,
  })),
  avatar: G.nullable(G.object({
    key: G.string,
    width: G.number,
    height: G.number,
  })),
}));

// ===== DATA =====

type User = Z.output<typeof ZodUserSchema>;

export const validUser: Readonly<User> = Object.freeze({
  id: '3',
  name: 'SX3',
  age: 333,
  email: 'sx3@example.com',
  first_name: 'SX',
  last_name: '3',
  role: 'moderator',
  settings: [
    { name: 'setting1', value: 'value1' },
    { name: 'setting2', value: 'value2' },
  ],
  avatar: {
    key: 'avatar.jpg',
    width: 250,
    height: 400,
  },
});

export const invalidUser = Object.freeze({
  id: '3',
  name: 'SX3',
  age: 333,
  email: 'sx3@example.com',
  first_name: 'SX',
  last_name: '3',
  role: 'admin',
  settings: [
    { name: 'setting1', value: 32 },
    { name: 'setting2', value: 'value2' },
  ],
  avatar: {
    key: 'avatar.jpg',
    width: '250',
    height: 400,
  },
});
