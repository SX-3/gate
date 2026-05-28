<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=58A6FF&width=520&lines=%40sx3%2Fgate;Fastest+schema+validation">
  <img alt="Gate" src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=58A6FF&width=520&lines=%40sx3%2Fgate;Fastest+schema+validation">
</picture>

<p align="center">
  <a href="https://www.npmjs.com/package/@sx3/gate"><img src="https://img.shields.io/npm/v/@sx3/gate?color=cb3837&style=flat-square&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@sx3/gate"><img src="https://img.shields.io/npm/dm/@sx3/gate?style=flat-square&color=cb3837" alt="npm downloads"></a>
  <a href="https://bundlejs.com/?q=@sx3/gate"><img src="https://img.shields.io/bundlejs/size/@sx3/gate?style=flat-square&label=size" alt="bundle size"></a>
  <a href="https://github.com/SX-3/gate"><img src="https://img.shields.io/badge/Standard%20Schema-v1-4285F4?style=flat-square" alt="Standard Schema v1"></a>
</p>

<p align="center">
  <b>Gate</b> — a <a href="https://sx-3.github.io/perfcheck/">maximally performant</a> TypeScript schema validation and parsing library.
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

const UserSchema = object({
  name: pipe(string, min(2), max(50)),
  email: pipe(string, email),
  age: pipe(number, min(0), max(120)),
  tags: array(string),
});

const data = parse(UserSchema)({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  tags: ['admin'],
});

const result = validate(UserSchema)(input); // Return StandardSchema Result

if (check(UserSchema)(input)) { /* ok */ }
```

## Validation Modes

Three validation modes. They differ in speed and error detail.

### `parse` — throw

```ts
import { parse } from '@sx3/gate';

try { parse(User)(input) }
catch (error) { /* GateError */ }
```

On error — `throw`. Ideal for APIs: invalid input → immediate 400.

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

No objects, no throw — just `true`/`false`. The fastest mode. Ideal for guards and filters.

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

// inline condition ($ → variable name) / ! DANGER: don't try make runtime string literal (RCE risk)
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
number       // typeof === "number"
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
min(string, 3)                // .length >= 3
max(string, 100)              // .length <= 100
clamp(string, 0, 100)         // .length >= 0 && .length <= 100

min(number, 0)                // >= 0
max(number, 100)              // <= 100
clamp(number, 0, 100)         // >= 0 && <= 100

length(string, 10)            // .length === 10

email                          // email (regex)
uuid                           // UUID v4
url                            // http(s)://...
cuid                           // CUID
datetime                       // ISO 8601 UTC
trim(string)                   // whitespace trim
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
const C = object({ age: number });
const ABC = merge(A, B, C);  // { id: number; name: string; age: number }
```

### `strict` — disallow extra keys

```ts
import { object, strict } from '@sx3/gate';

const StrictUser = strict(object({ id: number, name: string }), true); // strict(schema, deep)

parse(StrictUser)({ id: 1, name: 'a', extra: true });
// → GateError: Unexpected key "extra"
```

## Transformations

### `to` — type coercion

Compiles to inline coercion operations — no function calls at runtime.

```ts
import { pipe, string, number, boolean, object, to } from '@sx3/gate';

// string ↔ number
to(string, number)   // "42" → 42
to(number, string)   // 42 → "42"

// string ↔ boolean
to(string, boolean)    // "true" → true, "false" → false
to(boolean, string)    // true → "true"

// string ↔ bigint
to(string, bigint)     // "9007199254740991" → 9007199254740991n
to(bigint, string)     // 9007199254740991n → "9007199254740991"

// string ↔ object (JSON.parse / JSON.stringify)
to(string, object({}))    // '{"a":1}' → { a: 1 }   — uses JSON.parse
to(object({}), string)    //  { a: 1 } → '{"a":1}'   — uses JSON.stringify
to(string, array(number)) // '[1,2]' → [1, 2]      — JSON.parse
to(array(number), string) //  [1,2] → '[1,2]'       — JSON.stringify
```

Coercion only works between compatible type pairs. Unsupported combinations throw at schema compilation time.

### `transform` — custom transformation

```ts
import { string, transform } from '@sx3/gate';

transform(string, s => s.toUpperCase())('hello');  // "HELLO"
transform(string, JSON.parse) // equivalent to to(object({}))
```

## Type Inference

```ts
import type { Output } from '@sx3/gate';
import { number, object, string } from '@sx3/gate';

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
