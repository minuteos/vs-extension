# minuteOS VS Code Extension

Tooling that makes working with [minuteOS](https://github.com/minuteos) projects nicer inside VS Code. Companion to [minuteDebug](https://github.com/minuteos/vs-debugger).

## Features

- **Build / Clean** commands that drive the project's `make`-based build.
- **Target picker** with a status-bar chip — click to switch the active build target.
- Structured output channel for make and extension logs.

Planned:

- Project scaffolding and template support.
- Flash / deploy integration with `minuteDebug`.
- Richer project introspection (boards, components, libraries).

## Configuration

| Setting | Description |
| --- | --- |
| `minute.make.path` | Path to the `make` executable. |
| `minute.make.jobs` | Parallel job count passed to `make -j`. |
| `minute.target` | Currently selected build target. |
| `minute.trace` | Trace categories to log (`*` for all). |

## Development

```sh
npm install
npm run watch      # concurrent esbuild + tsc watch
npm run package    # production bundle in dist/
```

Press `F5` inside VS Code to launch an Extension Development Host.

## License

MIT — see [LICENSE.txt](./LICENSE.txt).
