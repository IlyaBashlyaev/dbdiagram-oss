# dbdiagram-oss

An Open Source alternative to dbdiagram.io, aiming to have the same basic features+more. Motivation behind the project was that $9/month overpriced subscription for just some **very VERY** basic features. (dark mode/header colours/table groups)

Detailed technical documentation: [docs/documentation.md](docs/documentation.md)

---

## Description

dbdiagram-oss turns DBML (Database Markup Language) text into an interactive entity relationship diagram. You write the schema in a code editor on one side and see tables, references, table groups and relation types drawn on a pan and zoom canvas on the other side. Tables can be dragged, header colours can be changed, the layout can be fitted to the screen, and the result can be exported (for example as PNG) or imported from SQL dumps.

Diagrams can be stored in three ways: in the browser (IndexedDB), as real files on disk through the bundled FastAPI backend (`data/<diagram name>/<diagram name>.dbml` and `coords.json`), or in an external S3 bucket.

### User story

As a developer or analyst who designs database schemas, I want to describe my tables in DBML and get a clean, editable diagram without paying a monthly subscription, so that I can use dark mode, coloured table headers and table groups, keep my diagrams as plain files in my own repository or storage, and run the whole tool on my own machine with a single command.

Acceptance criteria that follow from this story:

1. I can start the tool locally with Docker and open it in the browser without installing Node.js or Python.
2. I can write or paste DBML and the diagram updates, including references and table groups.
3. I can change table header colours and switch between light and dark themes.
4. My diagrams are saved as readable `.dbml` files plus a `coords.json` for table positions, so they can be versioned in Git.
5. I can optionally store diagrams in S3 instead of local storage.

### Comparison with the paid alternative

The only price figure used here is the one this project was started from: dbdiagram.io was perceived as a $9/month subscription for dark mode, header colours and table groups. Check dbdiagram.io directly for its current plans, because those can change and are not verified in this repository.

| Aspect | dbdiagram-oss | dbdiagram.io (paid plan) |
| --- | --- | --- |
| Cost | Free, MIT licence | Subscription, about $9/month according to the project motivation |
| Hosting | Self-hosted (Docker, or static build on GitHub Pages) | Hosted service by the vendor |
| Dark mode, header colours, table groups | Included | Part of the motivation for the paid plan |
| Storage of diagrams | Browser IndexedDB, local files through the backend, or S3 | Vendor account |
| File format | Plain `.dbml` plus `coords.json` on disk | Vendor-managed |
| Source code | Open, can be modified | Closed |
| Maintenance and support | Community, no guarantees | Vendor |
| Maturity | Smaller project, fewer features outside the basics | Established product |

The honest trade-off: dbdiagram-oss gives up vendor support, a polished account and sharing system, and the breadth of an established product, in exchange for no recurring cost and full control over data and code.

---

## Installation

### Requirements

1. Frontend: `Vue & Quasar` (JavaScript)
2. Backend: `FastAPI` (Python)
3. Orchestration: `Docker Compose`

For the Docker setup you need Docker Engine (or Docker Desktop) with the Compose plugin (`docker compose version` should work). To build the frontend you additionally need Node.js and npm on the host, see the note in step 2.

### Run with Docker (detailed)

1. Clone the repository and enter it.

```
git clone https://github.com/TruDan/dbdiagram-oss.git
cd dbdiagram-oss
```

2. Build the frontend once on the host. The frontend image does not compile the Vue app itself: its `Dockerfile` copies the prebuilt `frontend/dist/spa` folder into an Nginx image, so this folder must exist before `docker compose` builds the image.

```
cd frontend
npm install
npm run build
cd ..
```

3. Build the images and start the containers in the background.

```
docker compose up -d --build
```

4. Print the addresses of the running services.

```
docker compose run --rm urls
```

By the compose file the services are published as follows: the frontend (Nginx) on `http://localhost:3210` and the backend (FastAPI) on `http://localhost:8000`. The `urls` helper is in the `tools` profile, so it is not started by `up`; it only reads the published ports from the Docker socket and prints them.

5. Check the backend.

```
curl http://localhost:8000/health
```

The expected answer is `{"status":"ok"}`.

6. Open the frontend address in the browser. To save diagrams as files, open Settings -> General -> Storage and choose the file storage mode. The backend writes them to the `data/` folder in the project root, which is mounted into the backend container as `/app/data` and is ignored by Git.

Useful commands:

```
docker compose ps            # state of the containers
docker compose logs -f       # follow the logs
docker compose down          # stop and remove the containers (data/ is kept)
docker compose up -d --build # rebuild after code changes (rebuild frontend/dist/spa first for UI changes)
```

Known limitations of the current Docker setup:

1. The backend only accepts browser requests from `localhost` or `127.0.0.1` origins (CORS), so the file storage mode works only when the frontend is opened through one of these host names.
2. The frontend Nginx configuration still contains the original `server_name` and web root of the upstream author's server. It works because it is the only server block in the container, but it should be cleaned up before public use.
3. The `urls` helper needs access to `/var/run/docker.sock`, so it works only where this socket is available.

### Run without Docker (NPM and Uvicorn)

Frontend:

```
cd frontend
npm install
npm run dev
```

Backend (in a second terminal):

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

The frontend file storage mode talks to `http://localhost:8000` by default.

### Tests

```
cd frontend && npm test
cd backend && pip install -r requirements-dev.txt && pytest
```

---

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

## Screenshots

![Demo GIF](https://raw.githubusercontent.com/TruDan/dbdiagram-oss/master/.github/media/demo.gif)

---

## Related

[quasar](https://quasar.dev/) - Awesome VueJS framework

[jointjs](https://github.com/clientIO/joint) - Charting Library used for diagrams

[dbml.org](https://www.dbml.org/home/) - DBML Parser/importer/exporter

[dbdiagram.io](https://dbdiagram.io/home) - Original DBDiagram tool

[dbdocs.io](https://dbdocs.io/) - Documentation generator for DBML
