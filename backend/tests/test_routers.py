import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from routers import create_router  # noqa: E402


@pytest.fixture()
def client(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    app = FastAPI()
    app.include_router(create_router(data_dir))

    return TestClient(app), data_dir


def test_health(client):
    c, _ = client
    resp = c.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_crud_round_trip(client):
    c, data_dir = client

    assert c.get("/diagrams").json() == []

    resp = c.put("/diagrams/MyDiagram", json={"dbml": "Table users {}", "coords": {"zoom": 1}})
    assert resp.status_code == 200

    assert (data_dir / "MyDiagram" / "MyDiagram.dbml").read_text() == "Table users {}"
    assert (data_dir / "MyDiagram" / "coords.json").exists()

    assert c.get("/diagrams").json() == ["MyDiagram"]

    resp = c.get("/diagrams/MyDiagram")
    assert resp.status_code == 200
    body = resp.json()
    assert body["dbml"] == "Table users {}"
    assert body["coords"] == {"zoom": 1}

    resp = c.patch("/diagrams/MyDiagram", json={"new_name": "Renamed"})
    assert resp.status_code == 200
    assert not (data_dir / "MyDiagram").exists()
    assert (data_dir / "Renamed" / "Renamed.dbml").exists()

    resp = c.delete("/diagrams/Renamed")
    assert resp.status_code == 200
    assert not (data_dir / "Renamed").exists()


def test_get_missing_diagram_returns_404(client):
    c, _ = client
    resp = c.get("/diagrams/DoesNotExist")
    assert resp.status_code == 404


def test_rename_collision_returns_409(client):
    c, _ = client
    c.put("/diagrams/A", json={"dbml": "", "coords": {}})
    c.put("/diagrams/B", json={"dbml": "", "coords": {}})

    resp = c.patch("/diagrams/A", json={"new_name": "B"})
    assert resp.status_code == 409


def test_names_with_inner_spaces_are_accepted(client):
    c, data_dir = client
    resp = c.put("/diagrams/Untitled (1)", json={"dbml": "Table t {}", "coords": {}})
    assert resp.status_code == 200
    assert (data_dir / "Untitled (1)" / "Untitled (1).dbml").exists()


@pytest.mark.parametrize("bad_name", [" leading", "trailing ", "a/b", "a\\b", "..", "*star"])
def test_invalid_names_are_rejected(client, bad_name):
    c, _ = client
    resp = c.put(f"/diagrams/{bad_name}", json={"dbml": "", "coords": {}})
    assert resp.status_code in (400, 404, 422)
