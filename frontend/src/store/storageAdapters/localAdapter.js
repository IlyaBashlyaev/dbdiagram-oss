import localforage from "localforage";

// IndexedDB (via localforage) is used as the underlying engine instead of raw
// window.localStorage even though the persisted value is a plain array of
// {name, dbml, coords}. window.localStorage is capped at ~5-10MB per origin
// and is synchronous (blocks the main thread); a diagram's DBML text plus its
// full chart geometry (tables/refs/colors/zoom/pan/ctm) can realistically get
// large enough for that to matter, so don't "simplify" this into
// localStorage.setItem later.
const store = localforage.createInstance({
  name: "dbdiagram-oss",
  storeName: "local_files"
});

// Legacy per-key store used before this refactor: one localforage key per
// diagram name, holding { source: { text }, chart }. Left untouched; used
// only as a one-time, best-effort migration source.
const legacyStore = localforage.createInstance({
  name: "dbdiagram-oss",
  storeName: "files"
});

const DIAGRAMS_KEY = "diagrams";

let migrated = false;

async function migrateLegacyIfNeeded(diagrams) {
  if (migrated || diagrams.length > 0) {
    migrated = true;
    return diagrams;
  }
  migrated = true;

  const legacyKeys = await legacyStore.keys();
  if (legacyKeys.length === 0) {
    return diagrams;
  }

  const migratedDiagrams = [];
  for (const key of legacyKeys) {
    const legacyFile = await legacyStore.getItem(key);
    if (legacyFile && legacyFile.source) {
      migratedDiagrams.push({
        name: key,
        dbml: legacyFile.source.text || "",
        coords: legacyFile.chart || {}
      });
    }
  }

  if (migratedDiagrams.length > 0) {
    await store.setItem(DIAGRAMS_KEY, migratedDiagrams);
    return migratedDiagrams;
  }
  return diagrams;
}

async function readDiagrams() {
  const diagrams = (await store.getItem(DIAGRAMS_KEY)) || [];
  return migrateLegacyIfNeeded(diagrams);
}

async function writeDiagrams(diagrams) {
  await store.setItem(DIAGRAMS_KEY, diagrams);
}

export default {
  async list() {
    const diagrams = await readDiagrams();
    return diagrams.map((d) => d.name);
  },

  async load(name) {
    const diagrams = await readDiagrams();
    const found = diagrams.find((d) => d.name === name);
    if (!found) return null;
    return { dbml: found.dbml, coords: found.coords };
  },

  async save(name, { dbml, coords }) {
    const diagrams = await readDiagrams();
    const index = diagrams.findIndex((d) => d.name === name);
    const record = { name, dbml, coords };
    if (index >= 0) {
      diagrams[index] = record;
    } else {
      diagrams.push(record);
    }
    await writeDiagrams(diagrams);
  },

  async delete(name) {
    const diagrams = await readDiagrams();
    await writeDiagrams(diagrams.filter((d) => d.name !== name));
  },

  async rename(oldName, newName) {
    const diagrams = await readDiagrams();
    const found = diagrams.find((d) => d.name === oldName);
    if (found) {
      found.name = newName;
      await writeDiagrams(diagrams);
    }
  }
};
