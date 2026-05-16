# minuteOS VS Code Extension

Tooling that makes working with [minuteOS](https://github.com/minuteos) projects nicer inside VS Code. Companion to [minuteDebug](https://github.com/minuteos/vs-debugger).

## Features

- **Build / Clean** commands that drive the project's `make`-based build.
- **Flash** and **Build & Flash** commands that reuse your existing
  [minuteDebug](https://github.com/minuteos/vs-debugger) launch configuration
  to download firmware to the target without opening a full debug session.
- **Configuration picker** with a status-bar chip — click to switch between
  `Release` and `Debug` (passed as `CONFIG=` to make).
- Structured output channel for make and extension logs.

Planned:

- Project scaffolding and template support.
- Richer project introspection (boards, components, libraries).

### Flashing

`minuteOS: Flash` picks up a `minute-debug` launch configuration from your
workspace's `.vscode/launch.json` and calls the programmatic `flash` API
exposed by [minuteDebug](https://github.com/minuteos/vs-debugger). No debug
session is allocated — the probe is brought up, the program downloaded, and
the probe torn down. `minuteOS: Build & Flash` runs `make all` first, so you
can bind the whole pipeline to a single keybinding.

## Configuration

| Setting | Description |
| --- | --- |
| `minute.make.path` | Path to the `make` executable. |
| `minute.make.jobs` | Parallel job count passed to `make -j`. |
| `minute.config` | Build configuration (`Release` or `Debug`), passed as `CONFIG=`. |
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
