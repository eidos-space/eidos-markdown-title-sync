# Markdown Title Sync

An optional Eidos plugin for Markdown filename and title synchronization. Requires plugin API **3.3.0** in Eidos Lite, Android or iOS.

Install the `.eidos-plugin` archive from the plugin manager and enable it for the current Space on each device. Two settings control title → filename and filename → title independently; both are enabled by default.

- Save a changed leading H1: the filename follows the title, retaining `.md` or `.markdown`.
- Rename a Markdown file locally: its existing leading H1 follows the filename.
- Documents without a leading H1 remain unchanged. A one-line Setext H1 is supported, along with UTF-8 BOM, frontmatter and CRLF.
- Opening a file, enabling the plugin, body-only saves, and incoming cloud/LAN updates do not reconcile old filenames or create headings.
- Invalid filename characters are replaced with spaces; Windows reserved names gain an underscore. Names are limited to 200 UTF-8 bytes. Existing destination files are never overwritten.

The host runs plugins in isolation, checks the current file version, maintains Markdown links when renaming, and prevents plugin mutations from retriggering hooks. Failed or stale hook plans leave the ordinary save or rename in place. If a title cannot be used because another file already has that name, rename the file manually or choose another title.

This plugin has no filesystem, network, SQLite, or workspace permissions. It receives the current document snapshot and returns a change plan for that document only.

## Development

Until plugin API 3.3 is released, use the tools from the matching Eidos source checkout:

```sh
node /path/to/eidos/packages/plugin-tools/bin/eidos-plugin.mjs check .
node /path/to/eidos/packages/plugin-tools/bin/eidos-plugin.mjs pack .
node --experimental-strip-types --test test/*.test.ts
```

For the archive test, build `cargo build -p eidos-runtime-host --example file-hook-check --locked` in that checkout, then run `EIDOS_HOOK_CHECK=/path/to/eidos/target/debug/examples/file-hook-check node --test test/*.test.mjs` here. This checks the actual packaged plugin in the same isolated VM used by Android and iOS.
