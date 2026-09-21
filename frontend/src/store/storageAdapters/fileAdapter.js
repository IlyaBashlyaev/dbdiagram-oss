// Fetch-based client for the local FastAPI file-storage backend.
// Saves for the same diagram name are chained (not just fired) so that a
// slow/out-of-order response from an earlier PUT can never clobber a later
// one - important since autosave can fire a new save before the previous
// network round-trip has resolved.
const inFlightSaves = new Map();

async function request(baseUrl, path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch (e) {
    throw new Error("File storage server is not reachable");
  }

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (e) {
      // Not JSON - most likely the URL points at something other than the
      // file-storage API (e.g. a static-file server returning an HTML page),
      // so surface a friendly message instead of the raw parse error.
      throw new Error("File storage server is not reachable");
    }
  }

  if (!response.ok) {
    const message = (body && body.detail) || `File storage request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

export function createFileAdapter(baseUrl) {
  return {
    async list() {
      return request(baseUrl, "/diagrams");
    },

    async load(name) {
      try {
        return await request(baseUrl, `/diagrams/${encodeURIComponent(name)}`);
      } catch (e) {
        return null;
      }
    },

    async save(name, { dbml, coords }) {
      const previous = inFlightSaves.get(name) || Promise.resolve();
      const run = () => request(baseUrl, `/diagrams/${encodeURIComponent(name)}`, {
        method: "PUT",
        body: JSON.stringify({ dbml, coords })
      });
      const chained = previous.then(run, run);
      inFlightSaves.set(name, chained.catch(() => {}));
      return chained;
    },

    async delete(name) {
      return request(baseUrl, `/diagrams/${encodeURIComponent(name)}`, { method: "DELETE" });
    },

    async rename(oldName, newName) {
      return request(baseUrl, `/diagrams/${encodeURIComponent(oldName)}`, {
        method: "PATCH",
        body: JSON.stringify({ new_name: newName })
      });
    },

    async health() {
      try {
        const result = await request(baseUrl, "/health");
        return !!result && result.status === "ok";
      } catch (e) {
        return false;
      }
    }
  };
}
