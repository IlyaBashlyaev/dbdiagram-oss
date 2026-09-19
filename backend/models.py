from pydantic import BaseModel


class DiagramContent(BaseModel):
    dbml: str
    coords: dict = {}


class RenameRequest(BaseModel):
    new_name: str
