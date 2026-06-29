# minuteOS VS Code Extension

Tooling that makes working with [minuteOS](https://github.com/minuteos) projects nicer inside VS Code. Companion to [minuteDebug](https://github.com/minuteos/vs-debugger).

## Features

- **Build / Clean** commands that drive the project's `make`-based build.
- **Flash** and **Build & Flash** commands that reuse your existing
  [minuteDebug](https://github.com/minuteos/vs-debugger) launch configuration
  to download firmware to the target without opening a full debug session.
- **Configuration picker** with a status-bar chip — click to switch between
  `Release` and `Debug` (passed as `CONFIG=` to make).
- **C/C++ IntelliSense** wired up automatically — include paths, defines and
  the cross compiler are queried from the build and handed to the C/C++
  extension, with no `c_cpp_properties.json` to maintain.
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

### IntelliSense

With Microsoft's [C/C++ extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
installed, the extension registers a custom configuration provider so
IntelliSense matches what the build actually sees — the active `CONFIG`'s
include paths, preprocessor defines, language standard and cross compiler.
Nothing is written to disk; switching configuration or editing a `Makefile`
refreshes it live, and `minuteOS: Refresh IntelliSense Configuration` forces
a re-query.

The flags are derived from a `make --dry-run`: the extension reads them off
the actual compiler command lines make *would* run, per source file, with a
union for headers. This needs no changes to your project's build — any
minuteOS Makefile works as-is.

## Configuration

| Setting | Description |
| --- | --- |
| `minute.make.path` | Path to the `make` executable. |
| `minute.make.jobs` | Parallel job count passed to `make -j`. |
| `minute.config` | Build configuration (`Release` or `Debug`), passed as `CONFIG=`. |
| `minute.intellisense.enabled` | Provide C/C++ IntelliSense from the build (default `true`). |
| `minute.intellisense.intelliSenseMode` | IntelliSense mode reported to cpptools (default `gcc-arm`). |
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
