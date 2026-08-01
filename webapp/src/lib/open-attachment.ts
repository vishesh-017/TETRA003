import { openAttachmentRef } from "@/lib/attachment-store";

/** Open uploaded attachments (IndexedDB refs, data URLs, http). */
export async function openAttachment(
  url: string,
  filename = "report.pdf",
): Promise<void> {
  await openAttachmentRef(url, filename);
}
