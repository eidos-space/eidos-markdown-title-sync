import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { gunzipSync } from "node:zlib"
import { spawnSync } from "node:child_process"

// Run after packing and building the checkout's file-hook-check example.
const binary = process.env.EIDOS_HOOK_CHECK
const archive = new URL(
  "../dist/eidos.markdown-title-sync-0.1.0.eidos-plugin",
  import.meta.url
)
const program = binary ? JSON.parse(gunzipSync(fs.readFileSync(archive))) : null
function run(
  type,
  text,
  previousText,
  direction = "bidirectional",
  source = "local"
) {
  const manifest = program.manifest
  const declaration = manifest.hooks.find((hook) => hook.event === type)
  const input = {
    hook: declaration.id,
    hooks: manifest.hooks.map((h) => h.id),
    actions: [],
    formatters: [],
    settings: {
      "update-filename": direction !== "file-to-document",
      "update-title": direction !== "document-to-file",
    },
    event: {
      type,
      source,
      operationId: "test",
      path: "folder/New.md",
      previousPath: "folder/Old.md",
      previousText,
      document: { text, version: "v1" },
    },
  }
  const result = spawnSync(binary, [], {
    input: JSON.stringify({
      code: program.modules[manifest.extension],
      declaration,
      input,
    }),
    encoding: "utf8",
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout).plan
}
test(
  "packaged plugin: local title changes, both directions and missing H1",
  { skip: !binary },
  () => {
    assert.deepEqual(run("document.saved", "# Title\nBody", "# Old\nBody"), {
      name: "Title.md",
    })
    assert.equal(
      run("document.saved", "# Old\nChanged body", "# Old\nBody"),
      null
    )
    assert.equal(run("document.saved", "Body", "Old body"), null)
    assert.equal(run("document.saved", "## H2", "## Old"), null)
    assert.equal(
      run("document.saved", "# Title", "# Old", "file-to-document"),
      null
    )
    assert.deepEqual(run("file.renamed", "# Old\r\nBody", undefined), {
      text: "# New\r\nBody",
    })
    assert.equal(run("file.renamed", "No H1", undefined), null)
    assert.equal(
      run("file.renamed", "# Old", undefined, "document-to-file"),
      null
    )
    assert.deepEqual(
      run("file.renamed", "---\na: b\n---\n\nOld\n===\nBody", undefined),
      { text: "---\na: b\n---\n\nNew\n===\nBody" }
    )
  }
)
