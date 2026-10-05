# Component structure

Each production React component, page, and provider has a directory named after its public component name. Private
components get their own directories inside their owner's directory. Test-only render wrappers are fixtures and follow
`TESTING.md`.

The implementation uses the literal filename `Component.tsx`; `index.ts` is the public entry point. Its stories use `Component.stories.tsx`, and public constants use `Component.constants.ts`. A component with stories and shared fixtures has this layout:

```text
Spinner/
  Component.tsx
  Component.stories.tsx
  Component.fixtures.ts
  index.ts
```

Add stories and fixture files when they are needed. Integration stories follow the common-ancestor placement rule in
`TESTING.md`, so they can live outside an individual component's directory.

Import components through their directory entry point, including from their stories. Export the component by its public
name, for example `Spinner`, rather than a generic name or a default export:

```ts
export { Spinner } from './Component';
```

When a component owns public constants, attach them at module initialization with `Object.assign`. Keep the implementation
and constants in their own files, and assemble the public export in `index.ts`:

```ts
import { SomeComponent as Component } from './Component';
import * as constants from './Component.constants';

export const SomeComponent = Object.assign(Component, constants);
```

A constant exported as `id` is then available as `SomeComponent.id`. Attach only the component's public constants; internal
values stay inside its implementation. Components without public constants use the direct named export. Keep shared domain
constants in their owning modules.
