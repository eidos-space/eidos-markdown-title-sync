import type {
  Activate,
  FileHookContext,
  FileHookPlan,
} from "@eidos.space/plugin-sdk"
import { filenameFromTitle, leadingH1, titleFromFilename } from "./title"

export function titlePlan({
  event,
  settings,
}: FileHookContext): FileHookPlan | undefined {
  if (event.source !== "local") return
  const heading = leadingH1(event.document.text)
  if (!heading) return
  if (
    event.type === "document.saved" &&
    settings["update-filename"] !== false
  ) {
    // Enabling the plugin and saving an unchanged title never reconciles old files.
    if (
      event.previousText === undefined ||
      leadingH1(event.previousText)?.title === heading.title
    )
      return
    const name = filenameFromTitle(heading.title, event.path)
    if (name && name !== event.path.split("/").at(-1)) return { name }
  }
  if (event.type === "file.renamed" && settings["update-title"] !== false) {
    const title = titleFromFilename(event.path)
    if (title !== heading.title)
      return {
        text:
          event.document.text.slice(0, heading.start) +
          title +
          event.document.text.slice(heading.end),
      }
  }
}

const activate: Activate = (context) => {
  context.subscriptions.add(
    context.capabilities.hooks.register("title-saved", titlePlan)
  )
  context.subscriptions.add(
    context.capabilities.hooks.register("file-renamed", titlePlan)
  )
}
export default activate
