import json
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException

from models import DiagramContent, RenameRequest
from naming import is_valid_diagram_name, resolve_diagram_dir


def create_router(data_dir: Path) -> APIRouter:
    router = APIRouter()

    def diagram_dir(name: str) -> Path:
        if not is_valid_diagram_name(name):
            raise HTTPException(status_code=400, detail=f"Invalid diagram name: '{name}'")
        try:
            return resolve_diagram_dir(data_dir, name)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid diagram name: '{name}'")

    @router.get("/health")
    def health():
        return {"status": "ok"}

    @router.get("/diagrams")
    def list_diagrams():
        names = []
        for entry in sorted(data_dir.iterdir()):
            if entry.is_dir() and (entry / f"{entry.name}.dbml").exists():
                names.append(entry.name)
        return names

    @router.get("/diagrams/{name}")
    def get_diagram(name: str):
        folder = diagram_dir(name)
        dbml_path = folder / f"{name}.dbml"
        if not dbml_path.exists():
            raise HTTPException(status_code=404, detail=f"Diagram '{name}' not found")

        dbml = dbml_path.read_text(encoding="utf-8")

        coords = {}
        coords_path = folder / "coords.json"
        if coords_path.exists():
            coords = json.loads(coords_path.read_text(encoding="utf-8") or "{}")

        return {"dbml": dbml, "coords": coords}

    @router.put("/diagrams/{name}")
    def save_diagram(name: str, content: DiagramContent):
        folder = diagram_dir(name)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{name}.dbml").write_text(content.dbml, encoding="utf-8")
        (folder / "coords.json").write_text(json.dumps(content.coords, indent=2), encoding="utf-8")
        return {"status": "saved"}

    @router.delete("/diagrams/{name}")
    def delete_diagram(name: str):
        folder = diagram_dir(name)
        if not folder.exists():
            raise HTTPException(status_code=404, detail=f"Diagram '{name}' not found")
        shutil.rmtree(folder)
        return {"status": "deleted"}

    @router.patch("/diagrams/{name}")
    def rename_diagram(name: str, body: RenameRequest):
        folder = diagram_dir(name)
        if not folder.exists():
            raise HTTPException(status_code=404, detail=f"Diagram '{name}' not found")

        new_folder = diagram_dir(body.new_name)
        if new_folder.exists():
            raise HTTPException(status_code=409, detail=f"Diagram '{body.new_name}' already exists")

        folder.rename(new_folder)

        old_dbml = new_folder / f"{name}.dbml"
        if old_dbml.exists():
            old_dbml.rename(new_folder / f"{body.new_name}.dbml")

        return {"status": "renamed"}

    return router
