/** IndexedDB blob store — PDFs don't fit in localStorage as data: URLs. */

const DB_NAME = "healnexus-attachments";
const STORE = "files";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAttachmentBlob(
  id: string,
  blob: Blob,
): Promise<string> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return `idb:${id}`;
}

export async function saveAttachmentFromDataUrl(
  id: string,
  dataUrl: string,
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  return saveAttachmentBlob(id, blob);
}

export async function saveAttachmentFromFile(
  id: string,
  file: File,
): Promise<string> {
  return saveAttachmentBlob(id, file);
}

export async function loadAttachmentBlob(ref: string): Promise<Blob | null> {
  if (!ref.startsWith("idb:")) return null;
  const id = ref.slice(4);
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return new Blob();
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mime = /data:(.*?);/.exec(header)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function openAttachmentRef(
  ref: string | null | undefined,
  filename = "report.pdf",
): Promise<void> {
  if (!ref) return;

  if (ref.startsWith("idb:")) {
    const blob = await loadAttachmentBlob(ref);
    if (!blob) throw new Error("Attachment not found in local storage");
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  if (ref.startsWith("data:")) {
    const blob = dataUrlToBlob(ref);
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return;
  }

  if (ref.startsWith("blob:") || ref.startsWith("http")) {
    window.open(ref, "_blank", "noopener,noreferrer");
  }
}
