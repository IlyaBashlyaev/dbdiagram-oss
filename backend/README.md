# dbdiagram-oss file storage backend

A small local FastAPI server that reads/writes diagrams as real files under
`../data/<ERD name>/<ERD name>.dbml` and `../data/<ERD name>/coords.json`.

## Run

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The frontend's "File Storage" mode (Settings -> General -> Storage) talks to
this server at `http://localhost:8000` by default.

## Test

```
pip install -r requirements-dev.txt
pytest
```
