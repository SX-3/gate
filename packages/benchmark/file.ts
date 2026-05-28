import * as G from '@sx3/gate';
import { add, complete, cycle, suite } from 'benny';
import * as S from 'sury';

const VALID_DATA = Object.freeze({
  id: '37128793812637123312',
  user_id: '312312513251',
  parent_id: null,
  hash: 'fewf*(&$*uj891k419204',
  original_hash: 'fewf*(&$*uj891k419204',
  name: 'example.jpg',
  original_name: 'example.jpg',
  key: 'example.jpg',
  description: null,
  size: 1024,
  type: 'image/jpeg',
  meta: {
    kind: 'image',
    width: 1920,
    height: 1080,
    miniatures: [
      { width: 1920, height: 1080, key: 'example.jpg' },
      { width: 1280, height: 720, key: 'example.jpg' },
      { width: 640, height: 480, key: 'example.jpg' },
    ],
  },
  created_at: '2024-05-28T18:00:00Z',
  updated_at: '2024-05-28T18:00:00Z',
});

const INVALID_DATA = Object.freeze({ ...VALID_DATA, id: 12312 });

const GateSchema = G.object({
  id: G.to(G.string, G.bigint),
  user_id: G.nullable(G.to(G.string, G.bigint)),
  parent_id: G.nullable(G.to(G.string, G.bigint)),
  hash: G.string,
  original_hash: G.string,
  name: G.string,
  original_name: G.string,
  key: G.string,
  description: G.nullish(G.string),
  size: G.int32,
  type: G.string,
  meta: G.nullable(G.union([

    // Text
    G.object({
      kind: 'text' as const,
      lenght: G.int32,
      lines: G.int32,
      originalSize: G.int32,
    }),
    // Audio
    G.object({
      kind: 'audio' as const,
      duration: G.int32,
    }),
    // Image
    G.object({
      kind: 'image' as const,
      width: G.int32,
      height: G.int32,
      miniatures: G.optional(G.array(G.object({
        width: G.int32,
        height: G.int32,
        key: G.string,
      }))),
    }),
    // Video
    G.object({
      kind: 'video' as const,
      duration: G.int32,
      fps: G.int32,
      width: G.int32,
      height: G.int32,
      rotation: G.int32,
      lang: G.string,
      poster: G.string,
    }),
  ])),
  created_at: G.datetime,
  updated_at: G.datetime,
});

const SurySchema = S.schema({
  id: S.to(S.string, S.bigint),
  user_id: S.nullable(S.to(S.string, S.bigint)),
  parent_id: S.nullable(S.to(S.string, S.bigint)),
  hash: S.string,
  original_hash: S.string,
  name: S.string,
  original_name: S.string,
  key: S.string,
  description: S.nullish(S.string),
  size: S.int32,
  type: S.string,
  meta: S.nullable(S.union([
    // Text
    S.schema({
      kind: 'text' as const,
      lenght: S.int32,
      lines: S.int32,
      originalSize: S.int32,
    }),
    // Audio
    S.schema({
      kind: 'audio' as const,
      duration: S.int32,
    }),
    // Image
    S.schema({
      kind: 'image' as const,
      width: S.int32,
      height: S.int32,
      miniatures: S.optional(S.array(S.schema({
        width: S.int32,
        height: S.int32,
        key: S.string,
      }))),
    }),
    // Video
    S.schema({
      kind: 'video' as const,
      duration: S.int32,
      fps: S.int32,
      width: S.int32,
      height: S.int32,
      rotation: S.int32,
      lang: S.string,
      poster: S.string,
    }),
  ])),
  created_at: S.isoDateTime,
  updated_at: S.isoDateTime,
});

const GateParse = G.parse(GateSchema);
const SuryParse = S.parser(SurySchema);

console.log(GateParse.toString());
console.log(SuryParse.toString());

suite(
  'parse - valid',
  add('sury', () => SuryParse(VALID_DATA)),
  add('gate', () => GateParse(VALID_DATA)),
  cycle(),
  complete(),
);

suite(
  'parse - invalid',
  add('sury', () => {
    try {
      SuryParse(INVALID_DATA);
    }
    catch {
    }
  }),
  add('gate', () => {
    try {
      GateParse(INVALID_DATA);
    }
    catch {
    }
  }),
  cycle(),
  complete(),
);
