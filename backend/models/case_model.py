from pydantic import BaseModel
from typing import Optional

class Case(BaseModel):
    name: str
    photo: Optional[str] = None
    age: Optional[int] = None
    lastSeenLocation: dict  # {lat, lng}
    description: Optional[str] = None  # clothing, behavior, other details