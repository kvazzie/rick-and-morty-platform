# Roadmap

This describes planned work after the maintained 1.0.0 baseline.
The only implemented application is the web PWA in `apps/web`. The Telegram and MCP applications below are plans,
not available products or empty workspaces. Each needs a concrete use case and its own reviewed specification before implementation.

## Shipped in 1.0.0

- Public character, location, and episode browsing through React Router with client-side navigation.
- An installable PWA with offline shell startup, cached public data and character images, reconnect recovery, and update consent.
- A TypeScript workspace repository with Devenv, Vite+, React Compiler, and React View Transitions.
- Application and production-browser tests, an authoritative CI Quality gate, Changesets releases, and validated-artifact deployment through Void to Cloudflare.

## Toward 1.1.0: TanStack Start

Replace React Router with [TanStack Start](https://tanstack.com/start/latest) in the web application.
Use its [SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode) to retain client-rendered routes
and client-side navigation. The migration must preserve browsing, incremental loading, URL and history restoration,
direct detail entry, and reduced-motion behavior.

Preserve the local-first PWA contract:

- The installed shell and route code start offline after a successful online installation.
- Previously retrieved public pages, details, and character images remain usable offline within cache and browser storage limits.
- Uncached offline content shows an explicit message; a failed additional page keeps the visible content.
- Reconnection retries requests and refreshes local data.
- Service-worker updates wait for consent and preserve the current address and navigation state when accepted.

Move hosting to the corresponding Cloudflare Worker runtime through Void as required by the Start deployment.
The existence of a runtime does not require moving public reads or navigation onto the server.
Introduce server functions or server components only when a concrete feature needs server execution, such as protecting
a credential. Recheck framework support at that point and define how that feature behaves offline.
Public browsing must continue to work from the client and local cache.

Keep the existing public behavior and production PWA tests as migration acceptance checks.
Any new server behavior needs tests at its own public boundary, and the deployment must continue consuming the exact validated artifact.
This roadmap does not install Start or change the current runtime.

## Planned applications

The platform will use TypeScript and React where a UI is needed. Applications should own their platform-specific integration.

| Application       | Planned purpose                                                                                | Implementation gate                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Web               | Continue the installable local-first viewer and migrate to TanStack Start.                     | Preserve the existing browsing and PWA contracts during the 1.1.0 migration.                             |
| Telegram bot      | Expose useful Rick and Morty lookups in Telegram conversations.                                | Specify the commands, credentials, and hosting needs before choosing a bot SDK.                          |
| Telegram Mini App | Provide a React browsing UI inside Telegram's web app environment.                             | Define the Telegram entry flow and platform requirements, then verify browser and offline compatibility. |
| MCP server        | Expose selected Rick and Morty data through the Model Context Protocol for compatible clients. | Specify useful tools or resources and transport requirements before adding a server.                     |
| MCP App           | Provide an interactive React viewer inside MCP clients that support apps.                      | Define the UI-to-server contract and supported host capabilities before implementation.                  |

Implement these applications one at a time as their requirements become clear.
The Telegram Mini App is the planned mobile web application; there is no native mobile workspace.

## Shared code when there are consumers

Potential shared responsibilities are platform-neutral domain types and rules, the Rick and Morty API client,
React UI components for compatible hosts, and configuration that several workspaces actually use.
Extract these into packages only when implemented applications share that code.
Telegram SDK details, MCP transports, browser storage, and hosting integrations remain with their owning applications.
Do not add empty package directories or a package just to reserve a name.

## Exclusions

React Native, a native mobile workspace, Turborepo, and Cloudflare D1 are outside this roadmap.
Vite+ remains the JavaScript toolchain and monorepo task runner.
Additional databases, storage bindings, authentication, and other infrastructure require a separately specified product need;
the Start migration and future application names do not justify provisioning them.

Workspaces remain private to npm and on one Changesets release train.
Current contribution and release rules are in [CONTRIBUTING.md](CONTRIBUTING.md) and [release operation](docs/development/releases.md).
