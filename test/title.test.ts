import { test } from "node:test"
import assert from "node:assert/strict"
import {
  filenameFromTitle,
  leadingH1,
  titleFromFilename,
} from "../src/title.ts"

test("leading H1, frontmatter, CRLF, BOM, Setext and closing hashes", () => {
  assert.equal(
    leadingH1("\ufeff---\r\na: b\r\n---\r\n\r\n# 标题 ##\r\nBody")?.title,
    "标题"
  )
  assert.equal(leadingH1("Title\n===\nBody")?.title, "Title")
  for (const text of [
    "## H2\n",
    "Body\n\n# H1",
    "```\n# H1\n```",
    "---\na: b",
    "    # Code",
  ])
    assert.equal(leadingH1(text), null)
})
test("portable Windows, macOS and mobile filenames", () => {
  assert.equal(filenameFromTitle("a_b", "old.md"), "a_b.md")
  assert.equal(filenameFromTitle("a\\_b", "old.md"), "a_b.md")
  assert.equal(filenameFromTitle("`a_b`", "old.md"), "a_b.md")
  assert.equal(filenameFromTitle("A/B: C?", "old.MD"), "A B C.MD")
  assert.equal(filenameFromTitle("CON", "old.md"), "_CON.md")
  assert.equal(
    filenameFromTitle("[你好](https://example.com)", "old.markdown"),
    "你好.markdown"
  )
  assert.equal(filenameFromTitle("...", "old.md"), null)
  assert.ok(
    Buffer.byteLength(filenameFromTitle("你".repeat(200), "old.md")!) <= 200
  )
  assert.equal(titleFromFilename("folder/My [title].md"), "My \\[title\\]")
})
