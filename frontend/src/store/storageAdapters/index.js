import localAdapter from "./localAdapter";
import { createFileAdapter } from "./fileAdapter";

// Spaces inside the name are fine (e.g. the OS-style default "Untitled (1)"),
// but none of the characters invalid in a path component on macOS/Linux/Windows,
// no control characters, no leading/trailing whitespace, and non-empty - the
// name is used literally as a folder/file name by the file-storage backend.
// eslint-disable-next-line no-control-regex
const INVALID_CHARS_RE = /[<>:"/\\|?*\x00-\x1f]/;

export const isValidDiagramName = (name) => {
  if (typeof name !== "string" || name.length === 0) return false;
  if (name.trim() !== name) return false;
  return !INVALID_CHARS_RE.test(name);
};

export function getAdapter(mode, fileBackendUrl) {
  if (mode === "file") {
    return createFileAdapter(fileBackendUrl);
  }
  return localAdapter;
}
