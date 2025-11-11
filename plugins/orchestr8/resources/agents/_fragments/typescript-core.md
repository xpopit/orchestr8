---
id: typescript-core
category: agent
tags: [typescript, types, generics, type-inference, advanced-types]
capabilities:
  - Complex type system design
  - Generic type constraints and inference
  - Conditional and mapped types
  - Type-level programming
useWhen:
  - Designing type-safe APIs using generic constraints (T extends keyof Type), conditional types (T extends Array<infer U>), and mapped types (Pick, Omit, Partial, Required)
  - Solving complex type transformations with utility types like PartialBy, RequireAtLeastOne, DeepPartial, and template literal type inference (ParseRoute<T extends string>)
  - Implementing discriminated unions for type-safe state machines with exhaustive switch statements and narrowing based on discriminant properties
  - Resolving type inference issues using type predicates (is Type), assertion functions (asserts val is NonNullable<T>), and branded types for nominal typing
  - Building type-level programming patterns with recursive conditional types, distributed conditional types (Flatten<T>), and const assertions (as const) for literal types
  - Extending third-party types using declaration merging (declare module 'express'), namespace organization, and interface extension for Request/Response customization
estimatedTokens: 650
---

# TypeScript Core Expertise

## Generic Constraints & Inference

**Constraint patterns:**
```typescript
// Extend specific properties
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>

// Constrain to constructor
function create<T extends { new(...args: any[]): any }>(ctor: T): InstanceType<T>

// Recursive constraints
type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
```

**Inference optimization:**
```typescript
// Infer from position
declare function map<T, U>(arr: T[], fn: (item: T) => U): U[]
// T inferred from arr, U from fn return

// Distributed conditional types
type Flatten<T> = T extends Array<infer U> ? U : T

// Template literal inference
type ParseRoute<T extends string> = 
  T extends `${infer Path}/:${infer Param}/${infer Rest}`
    ? { path: Path; param: Param; rest: ParseRoute<Rest> }
    : T
```

## Discriminated Unions

**Type-safe state machines:**
```typescript
type State = 
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error }

function handle(state: State) {
  switch (state.status) {
    case 'loading': return state.progress // progress exists
    case 'success': return state.data     // data exists
  }
}
```

## Utility Type Patterns

**Custom utilities:**
```typescript
// Make specific keys optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Require at least one property
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

// Deep partial with array handling
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : DeepPartial<T[P]>
} : T
```

## Type Narrowing Patterns

**Beyond typeof/instanceof:**
```typescript
// Custom type guards
function isError(e: unknown): e is Error {
  return e instanceof Error || (typeof e === 'object' && e !== null && 'message' in e)
}

// Assertion functions
function assertDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === null || val === undefined) throw new Error('Not defined')
}

// Branded types
type UserId = string & { __brand: 'UserId' }
const toUserId = (s: string): UserId => s as UserId
```

## Module & Namespace Patterns

**Declaration merging:**
```typescript
// Extend third-party types
declare module 'express' {
  interface Request { user?: User }
}

// Namespace for grouped types
namespace API {
  export type Request<T = unknown> = { body: T; headers: Headers }
  export type Response<T = unknown> = { data: T; status: number }
}
```

## Performance Considerations

- Avoid deep recursive types (>5 levels) - use `any` escape hatch
- Use `interface` over `type` for object shapes (better error messages, faster)
- Leverage `const` assertions: `as const` for literal types
- Prefer type predicates over type assertions
- Use `unknown` over `any` - forces type narrowing

## Common Pitfalls

**Index signature conflicts:**
```typescript
// Wrong - incompatible with index signature
interface Bad { [key: string]: string; count: number }

// Right - union type
interface Good { [key: string]: string | number; count: number }
```

**Async type inference:**
```typescript
// Infers Promise<number>
const fn = async () => 42

// Extract resolved type
type Resolved<T> = T extends Promise<infer U> ? U : T
type Result = Resolved<ReturnType<typeof fn>> // number
```

**Excess property checking:**
```typescript
// Fails - excess property
const user: User = { name: 'x', extra: 1 }

// Passes - no checking via variable
const temp = { name: 'x', extra: 1 }
const user: User = temp
```
