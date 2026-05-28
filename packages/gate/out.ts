import {
  array,
  bigint,
  check,
  datetime,
  int,
  merge,
  nullable,
  nullish,
  number,
  object,
  optional,
  string,
  to,
  union,
} from './src';

const id = to(string, bigint);

const ImageMiniatureSchema = object({
  key: string,
  width: int,
  height: int,
});

const ImageMetaSchema = object({
  kind: 'image' as const,
  width: int,
  height: int,
  miniatures: optional(array(ImageMiniatureSchema)),
});

const TextMetaSchema = object({
  kind: 'text' as const,
  length: int,
  lines: int,
  originalSize: int,
});

const AudioMetaSchema = object({
  kind: 'audio' as const,
});

const VideoMetaSchema = object({
  kind: 'video' as const,
  fps: number,
  duration: number,
  height: int,
  width: int,
  rotation: number,
  lang: string,
  poster: string,
});

const FileMetaSchema = union([
  TextMetaSchema,
  AudioMetaSchema,
  VideoMetaSchema,
  ImageMetaSchema,
]);

const FileCreateSchema = object({
  user_id: nullable(id),
  parent_id: nullable(id),
  hash: string,
  original_hash: string,
  name: string,
  original_name: string,
  key: string,
  description: nullish(string),
  size: int,
  type: string,
  meta: nullable(FileMetaSchema),
});

const TimestampsSchema = object({
  created_at: datetime,
  updated_at: datetime,
});

const FileSchema = merge(
  object({ id }),
  FileCreateSchema,
  TimestampsSchema,
);

console.error(check(FileSchema).toString());
