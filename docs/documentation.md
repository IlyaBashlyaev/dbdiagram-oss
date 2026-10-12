# dbdiagram-oss documentation

This document describes the architecture, the Docker environment, the storage modes and the development history of dbdiagram-oss. For a short introduction, the user story and the comparison with the paid alternative see the [README](../README.md).

## Architecture

The application has two parts that are packaged as separate containers.

The frontend lives in `frontend/` and is a Vue application built with Quasar. It parses DBML with `@dbml/core`, draws the diagram with JointJS, and edits the source with the Ace editor. State is kept in Pinia stores (`frontend/src/store`). The compiled single page app (`frontend/dist/spa`) is served by Nginx.

The backend lives in `backend/` and is a small FastAPI server (`main.py`, `routers.py`, `models.py`, `naming.py`). It stores diagrams as plain files below the `data/` folder in the project root.

Backend endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Returns `{"status": "ok"}` |
| GET | `/diagrams` | Lists the diagram names |
| GET | `/diagrams/{name}` | Returns `{dbml, coords}` of a diagram |
| PUT | `/diagrams/{name}` | Saves `dbml` and `coords` |
| PATCH | `/diagrams/{name}` | Renames a diagram |
| DELETE | `/diagrams/{name}` | Deletes a diagram |

Diagram names are validated (`naming.py`) so that a name cannot point outside the data folder; invalid names are answered with HTTP 400. A diagram `<name>` is stored as `data/<name>/<name>.dbml` and `data/<name>/coords.json`. CORS is restricted to `localhost` and `127.0.0.1` origins.

## Storage modes

The frontend can store diagrams in three places, selected in Settings -> General -> Storage: the browser (IndexedDB, the default), the file storage backend described above, or an external S3 repository. The S3 mode can be switched on and off with a checkbox, and the connection parameters are entered in the same settings.

## Docker environment

`docker-compose.yml` defines three services.

| Service | Image source | Container | Published port | Notes |
| --- | --- | --- | --- | --- |
| `backend` | `backend/Dockerfile` (`python:3-slim`, Uvicorn) | `dbdiagram-oss-backend` | `8000:8000` | Mounts `./data` to `/app/data`, restarts unless stopped |
| `frontend` | `frontend/Dockerfile` (`nginx:alpine`) | `dbdiagram-oss-frontend` | `3210:80` | Depends on `backend` |
| `urls` | `docker:cli` | `dbdiagram-oss-urls` | none | Profile `tools`, runs `scripts/urls.sh` to print the published ports |

Installation steps:

1. Install Docker with the Compose plugin and Node.js with npm.
2. Build the frontend on the host with `cd frontend && npm install && npm run build`. This step is required because `frontend/Dockerfile` only copies the existing `frontend/dist/spa` folder; it does not run the build itself, and `docker compose up` fails if the folder is missing.
3. Run `docker compose up -d --build` in the project root.
4. Run `docker compose run --rm urls` to print the frontend and backend addresses, or read them from `docker-compose.yml`.
5. Open the frontend address, and optionally check `http://localhost:8000/health`.

Stop the environment with `docker compose down`. The `data/` folder is not removed.

Known issues found while preparing this document, based on the repository state at commit `a638501`:

1. The frontend image requires a manual host build of the Vue app. A multi-stage Dockerfile would remove this step.
2. `frontend/nginx/default.conf` and `frontend/Dockerfile` still use the web root and `server_name` of the original upstream deployment (`/home/user/dbdiagram-oss-wrep.nmdrzr.com/public`). They work inside the container but are misleading.
3. The commit messages mention a dynamic port allocation and a move of the frontend port to `8080`, but `docker-compose.yml` at this commit publishes the fixed ports `3210` and `8000`. Confirm which behaviour is intended.
4. `.github/workflows/gh-pages.yaml` still uses `working-directory: web` and Node 16, although the app files were moved from `web/` to `frontend/` in commit `c80178b`. The GitHub Pages deployment will not find the app until the path is updated.

## Local development without Docker

```
cd frontend && npm install && npm run dev
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

Tests: `npm test` in `frontend/` (Vitest) and `pytest` in `backend/` after `pip install -r requirements-dev.txt`.

## Development history

The Git tree contains three development phases, one per developer. Each summary was generated with the subagent defined in `.ai/summary-generator.md`, restricted to the commits of one developer. The summaries are based only on commit messages, not on a review of the code.

| Developer | Git author | Period | Summary |
| --- | --- | --- | --- |
| TruDan | Dan Spiteri | 2022-02-26 to 2022-04-02 | [summary/2022-02-26_2022-04-02.md](summary/2022-02-26_2022-04-02.md) |
| NomadRazor | Peter Shcherbakov | 2023-08-19 to 2025-08-21 | [summary/2023-08-19_2025-08-21.md](summary/2023-08-19_2025-08-21.md) |
| IlyaBashlyaev | IlyaBashlyaev | 2026-09-15 to 2026-09-27 | [summary/2026-09-15_2026-09-27.md](summary/2026-09-15_2026-09-27.md) |

Note on attribution: the split is by Git author name, so work merged through pull requests appears under the author of the individual commits. Merge commits are not listed individually in the summaries.
