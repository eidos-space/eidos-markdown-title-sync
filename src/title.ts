export interface Heading {
  title: string
  start: number
  end: number
}

/** Only the first content block is eligible; never promote paragraphs or H2s. */
export function leadingH1(text: string): Heading | null {
  let offset = text.startsWith("\ufeff") ? 1 : 0
  const lines = text.slice(offset).split(/(?<=\n)/)
  let index = 0
  if (/^---\r?\n$/.test(lines[0] ?? "")) {
    const end = lines.findIndex(
      (line, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(line.trimEnd())
    )
    if (end < 0) return null
    for (; index <= end; index++) offset += lines[index]!.length
  }
  while (index < lines.length && !lines[index]!.trim())
    offset += lines[index++]!.length
  const line = (lines[index] ?? "").replace(/\r?\n$/, "")
  const atx = /^( {0,3}#[\t ]+)(.*?)(?:[\t ]+#+[\t ]*)?$/.exec(line)
  if (atx) {
    const title = atx[2]!.trim()
    const start = offset + atx[1]!.length
    return title ? { title, start, end: start + atx[2]!.length } : null
  }
  // A one-line Setext H1 is also a level-one Markdown heading.
  if (
    line &&
    !/^( {4}|\t| {0,3}[#>\-+*`~])/.test(line) &&
    /^ {0,3}=+[\t ]*$/.test((lines[index + 1] ?? "").replace(/\r?\n$/, ""))
  ) {
    return { title: line.trim(), start: offset, end: offset + line.length }
  }
  return null
}

export function portableTitle(title: string): string | null {
  // Keep visible inline text, without including link destinations in filenames.
  const inline = title
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<([^>]+)>/g, "$1")
  let visible = ""
  for (let index = 0; index < inline.length; index++) {
    const character = inline[index]!
    if (character === "\\" && index + 1 < inline.length) {
      visible += inline[++index]
      continue
    }
    if (character === "`") {
      let count = 1
      while (inline[index + count] === "`") count++
      const end = inline.indexOf("`".repeat(count), index + count)
      if (end >= 0) {
        visible += inline.slice(index + count, end)
        index = end + count - 1
        continue
      }
    }
    if (character === "*") continue
    if (
      character === "_" &&
      !(
        /[\p{L}\p{N}]/u.test(inline[index - 1] ?? "") &&
        /[\p{L}\p{N}]/u.test(inline[index + 1] ?? "")
      )
    )
      continue
    visible += character
  }
  let value = visible
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/g, "")
  if (!value) return null
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))
    value = "_" + value
  return value
}

export function filenameFromTitle(title: string, path: string): string | null {
  const stem = portableTitle(title)
  if (!stem) return null
  const extension = path.slice(path.lastIndexOf("."))
  let shortened = ""
  // Conservative UTF-8 count also works in native QuickJS without TextEncoder.
  for (const character of stem) {
    if (utf8Size(shortened + character + extension) > 200) break
    shortened += character
  }
  return shortened ? shortened.replace(/[. ]+$/g, "") + extension : null
}

function utf8Size(value: string) {
  let size = 0
  for (const character of value) {
    const code = character.codePointAt(0)!
    size += code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4
  }
  return size
}

export function titleFromFilename(path: string) {
  const name = path.split("/").at(-1)!
  // Escape Markdown punctuation so a literal filename remains a literal title.
  return name
    .slice(0, name.lastIndexOf("."))
    .replace(/([\\`*_{}[\]()#+.!>~-])/g, "\\$1")
}
