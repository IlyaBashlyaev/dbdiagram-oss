import re
from pathlib import Path

# Mirrors frontend/src/store/storageAdapters/index.js's isValidDiagramName:
# spaces inside the name are fine (e.g. the OS-style default "Untitled (1)"),
# but no leading/trailing whitespace, no characters invalid in a path
# component on macOS/Linux/Windows, no control characters, non-empty.
INVALID_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def is_valid_diagram_name(name: str) -> bool:
    if not name:
        return False
    if name != name.strip():
        return False
    return not INVALID_CHARS_RE.search(name)


def resolve_diagram_dir(data_dir: Path, name: str) -> Path:
    """Resolve <data_dir>/<name>, guaranteeing the result stays inside data_dir.

    The name regex already excludes '/' and '\\', but this is a defense-in-depth
    check against path traversal (e.g. via '..' passed as a "single component").
    """
    candidate = (data_dir / name).resolve()
    if candidate.parent != data_dir.resolve():
        raise ValueError("Resolved diagram path escapes the data directory")
    return candidate
