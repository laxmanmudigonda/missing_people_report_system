from pydantic import BaseModel
from typing import Optional

class Sighting(BaseModel):
    caseId: str
    description: Optional[str] = None
    image: Optional[str] = None
    location: dict  # {lat, lng}
    seenAt: Optional[str] = None
    reporterName: Optional[str] = None