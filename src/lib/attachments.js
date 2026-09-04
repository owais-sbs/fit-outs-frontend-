import axiosInstance from "@/lib/axiosInstance";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";

export function parseAttachmentPaths(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function attachmentLabel(path) {
  if (!path) return "File";
  const name = path.split("/").pop() || path;
  const idx = name.indexOf("_");
  return idx > 0 ? name.slice(idx + 1) : name;
}

export function attachmentHref(path) {
  return resolveFileUrl(path);
}

/** API path for axios (baseURL is already /api). */
export function attachmentApiPath(path) {
  if (!path) return null;
  return `/files/${String(path).replace(/^\/+/, "")}`;
}

export async function fetchAttachmentArrayBuffer(path) {
  const apiPath = attachmentApiPath(path);
  if (!apiPath) throw new Error("Invalid file path");
  const response = await axiosInstance.get(apiPath, { responseType: "arraybuffer" });
  return response.data;
}

/** Keep an isolated copy — pdf.js detaches buffers passed to each Document. */
export function storePdfBytes(arrayBuffer) {
  return new Uint8Array(arrayBuffer).slice();
}

/** pdf.js detaches buffers — always pass a fresh copy to each Document instance. */
export function clonePdfFile(bytes) {
  if (!bytes) return null;
  const copy = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes).slice();
  return { data: copy };
}

export function isImagePath(path) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path || "");
}

export function isPdfPath(path) {
  return /\.pdf$/i.test(path || "");
}
