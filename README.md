<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=58A6FF&width=520&lines=%40sx3%2Fgate;Very+fast+schema+validation">
  <img alt="Gate" src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=58A6FF&width=520&lines=%40sx3%2Fgate;Very+fast+schema+validation">
</picture>

<p align="center">
  <a href="https://www.npmjs.com/package/@sx3/gate"><img src="https://img.shields.io/npm/v/@sx3/gate?color=cb3837&style=flat-square&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@sx3/gate"><img src="https://img.shields.io/npm/dm/@sx3/gate?style=flat-square&color=cb3837" alt="npm downloads"></a>
  <a href="https://bundlejs.com/?q=@sx3/gate"><img src="https://img.shields.io/bundlejs/size/@sx3/gate?style=flat-square&label=size" alt="bundle size"></a>
  <a href="https://github.com/SX-3/gate"><img src="https://img.shields.io/badge/Standard%20Schema-v1-4285F4?style=flat-square" alt="Standard Schema v1"></a>
</p>

<p align="center">
  <b>Gate</b> — a maximally performant TypeScript schema validation and parsing library.
  Compiles schemas into pure JavaScript on the fly — zero runtime interpretation.
</p>

---

## Installation

```bash
npm install @sx3/gate
bun add @sx3/gate
pnpm add @sx3/gate
```

## Quick Start

```ts
import { parse, validate, check, pipe, string, number, object, array, min, max, email } from '@sx3/gate';

const User = object({
  name: pipe(string, min(2), max(50)),
  email: pipe(string, email),
  age: pipe(number, min(0), max(120)),
  tags: array(string),
});

const data = parse(User)({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  tags: ['admin'],
});

const result = validate(User)(input);
if (result.issues) {
  for (const issue of result.issues) console.log(issue.message, issue.path);
} else {
  console.log(result.value);
}

if (check(User)(input)) { /* ok */ }
```

## Validation Modes

Three validation modes. They differ in speed and error detail.

### `parse` — throw

```ts
import { parse } from '@sx3/gate';

try { parse(User)(input) }
catch (error) { /* GateError */ }
```

No allocations on the happy path. On error — `throw`. Ideal for APIs: invalid input → immediate 400.

### `validate` — result

```ts
import { validate } from '@sx3/gate';

const result = validate(User)(input);
if (result.issues) { /* all errors */ }
else { result.value }
```

Returns **all** errors at once, never throws. Perfect for forms.

### `check` — boolean

```ts
import { check } from '@sx3/gate';

if (check(User)(input)) { /* valid */ }
```

No objects, no throw, no arrays — just `true`/`false`. The fastest mode. Ideal for guards and filters.

| Mode | Speed | Error info |
|------|-------|------------|
| `parse` | ★★☆ | `message` + `path` (first error) |
| `validate` | ★☆☆ | `message` + `path` (all errors) |
| `check` | ★★★ | none (`boolean` only) |

> On the first call to `parse(schema)` / `validate(schema)` / `check(schema)`, the schema is compiled via `new Function` and cached. Subsequent calls are just a direct function invocation — **zero overhead** on schema interpretation.

## Error Messages

Every type and constraint accepts a custom message as its **last argument**. The message can be a string or a function `(ctx) => string`.

> **Messages are evaluated at compile time** and baked directly into the generated function as a string literal. No runtime string interpolation, no extra allocations on every validation call. If you pass `'Must be a string'`, the compiled code contains `throw new E("Must be a string", ...)`. If you use a function like `({ n }) => \`Min ${n}\``, the function runs once during compilation and the resulting string `"Min 3"` is inlined. The function itself is never called at validation time.

### On types

```ts
string('Must be a string');
number('Expected a number');
boolean('Must be a boolean');
literal(42, 'Must be exactly 42');
array(string, 'Must be an array of strings');
object({ name: string }, 'Must be an object');
```

### On constraints

```ts
pipe(string, min(3, 'At least 3 characters'));
pipe(string, max(100, 'Too long'));
pipe(string, length(10, 'Exactly 10 characters'));
pipe(string, email('Invalid email'));
pipe(number, clamp(0, 100, 'Out of range'));
```

### Function-style message

```ts
pipe(string, min(3, ({ n }) => `At least ${n} characters`));
pipe(number, clamp(0, 100, ({ min, max }) => `Must be ${min}..${max}`));
```

### `refine` — custom check

```ts
import { refine } from '@sx3/gate';

// predicate function
pipe(number, refine(n => n % 2 === 0, 'Must be even'));

// inline condition ($ → variable name)
pipe(number, refine('$ % 2 === 0', 'Must be even'));
```

## Types

```ts
import {
  string, number, boolean, bigint,
  unknown, never, literal,
  object, array, tuple, record, union, instance,
  int, int8, int16, int32, int64,
  uint8, uint16, uint32, uint64,
} from '@sx3/gate';
```

### Primitives

```ts
string       // typeof === "string"
number       // typeof === "number", not NaN
boolean      // typeof === "boolean"
bigint       // typeof === "bigint"
unknown      // passes anything
never        // rejects everything
literal(42)  // === 42
```

### Objects and collections

```ts
object({ name: string, age: number })  // { name: string; age: number }
array(string)                           // string[]
tuple([string, number])                 // [string, number]
record(string, number)                  // Record<string, number>
union([string, number])                 // string | number
instance(Date)                          // instanceof Date
```

### Modifiers

```ts
import { nullable, optional, nullish } from '@sx3/gate';

nullable(string)   // string | null
optional(string)   // string | undefined
nullish(string)    // string | null | undefined
```

## Constraints

Applied via `pipe`. For strings/arrays they check `.length`, for numbers they check the value.

```ts
import { min, max, length, clamp, email, uuid, url, cuid, datetime, trim, port } from '@sx3/gate';

pipe(string, min(3))          // .length >= 3
pipe(string, max(100))        // .length <= 100
pipe(string, length(10))      // .length === 10
pipe(number, min(0))          // >= 0
pipe(number, max(100))        // <= 100
pipe(number, clamp(0, 100))   // >= 0 && <= 100

pipe(string, email)           // email (regex)
pipe(string, uuid)            // UUID v4
pipe(string, url)             // http(s)://...
pipe(string, cuid)            // CUID
pipe(string, datetime)        // ISO 8601 UTC
pipe(string, trim)            // whitespace trim

pipe(number, port)            // integer 0–65535
```

### `pattern` — arbitrary regex

`pattern` is a standalone string schema with a regex check, not a constraint:

```ts
import { pattern } from '@sx3/gate';

const HexColor = pattern(/^#[0-9a-f]{6}$/i);
const Digits = pattern(/^\d+$/, 'Digits only');
```

## Composition

### `pipe` — chaining

Left-to-right: each function takes a schema and returns a schema.

```ts
import { pipe, string, number, min, max, to } from '@sx3/gate';

const Username = pipe(string, min(3), max(20));
const NumericId = pipe(string, to(number));   // string → number
```

### `merge` — merging objects

```ts
import { object, merge } from '@sx3/gate';

const A = object({ id: number });
const B = object({ name: string });
const AB = merge(A, B);  // { id: number; name: string }
```

### `strict` — disallow extra keys

```ts
import { object, strict } from '@sx3/gate';

const StrictUser = strict(object({ id: number, name: string }));

parse(StrictUser)({ id: 1, name: 'a', extra: true });
// → GateError: Unexpected key "extra"
```

## Transformations

### `to` — type coercion

Compiles to inline coercion operations — no function calls at runtime.

```ts
import { pipe, string, number, boolean, object, to } from '@sx3/gate';

// string ↔ number
pipe(string, to(number))     // "42" → 42
pipe(number, to(string))     // 42 → "42"

// string ↔ boolean
pipe(string, to(boolean))    // "true" → true, "false" → false
pipe(boolean, to(string))    // true → "true"

// string ↔ bigint
pipe(string, to(bigint))     // "9007199254740991" → 9007199254740991n
pipe(bigint, to(string))     // 9007199254740991n → "9007199254740991"

// string ↔ object (JSON.parse / JSON.stringify)
pipe(string, to(object({})))   // '{"a":1}' → { a: 1 }   — uses JSON.parse
pipe(object({}), to(string))   // { a: 1 } → '{"a":1}'   — uses JSON.stringify
pipe(string, to(array(number))) // '[1,2]' → [1, 2]      — JSON.parse
pipe(array(number), to(string)) // [1,2] → '[1,2]'       — JSON.stringify
```

Coercion only works between compatible type pairs. Unsupported combinations throw at schema compilation time.

### `transform` — custom transformation

```ts
import { pipe, string, transform } from '@sx3/gate';

pipe(string, transform(s => s.trim().toUpperCase()));
pipe(string, transform(JSON.parse));  // equivalent to to(object({}))
```

## Type Inference

```ts
import type { Output } from '@sx3/gate';
import { object, string, number } from '@sx3/gate';

const UserSchema = object({ id: number, name: string });
type User = Output<typeof UserSchema>;
// { id: number; name: string }
```

## Standard Schema v1

Works with tRPC, Hono, TanStack Form out of the box:

```ts
const schema = object({ name: string });
const result = await schema['~standard'].validate(input);
```

By default `~standard.validate` uses `parse` mode. Switch it:

```ts
import { settings } from '@sx3/gate';

settings({ standardMode: 'validate' }); // use validate
settings({ standardMode: 'check' });    // use check
```

## Settings

```ts
import { settings } from '@sx3/gate';

settings({
  strict: true,           // all object() are strict by default
  checkNaN: false,        // don't check NaN for number()
  standardMode: 'parse',  // 'parse' | 'validate' | 'check'
});
```

## Highlights

- ⚡ **JIT compilation** — `new Function` + schema-level cache, second call is pure JS
- 🎯 **Full type inference** — `Output<typeof schema>`, no manual generics
- 📦 **Tree-shakeable ESM** — take only what you use
- 🚫 **Zero dependencies** — no runtime dependencies
- 🔗 **Standard Schema v1** — tRPC, Hono, TanStack Form

## License

MIT © [SX3](https://github.com/SX-3)
