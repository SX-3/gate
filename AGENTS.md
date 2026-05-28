## About
Focused on maximim performance parse\validation lib on typescript, all changes should not harm performance.

## Style

NEVER abbreviating variable names.
No any type annotations.
Before run benchmarks: bun run build

## Other
Benchmarks: packages/benchmark run `bun complex` for node `node complex.ts` | `bun moltar` for node `node moltar.ts`
Sources: packages/gate
Tests: packages/gate run `bun run test`
Lint: bun run lint:fix
Check compiled output: packages/gate run `bun out`
