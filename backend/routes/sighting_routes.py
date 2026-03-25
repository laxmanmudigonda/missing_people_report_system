from fastapi import APIRouter
from backend.models.sighting_model import Sighting
from backend.database import sightings_collection, cases_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter()

# ADD SIGHTING
@router.post("/sightings")
async def add_sighting(sighting: Sighting):
    sighting_dict = sighting.dict()
    sighting_dict["createdAt"] = datetime.utcnow()

    result = sightings_collection.insert_one(sighting_dict)
    sighting_dict["_id"] = str(result.inserted_id)

    return sighting_dict


# GET SIGHTINGS WITH CASE INFO
@router.get("/sightings/{case_id}")
async def get_sightings(case_id: str):
    sightings = []

    case = cases_collection.find_one({"_id": ObjectId(case_id)})

    for s in sightings_collection.find({"caseId": case_id}):
        s["_id"] = str(s["_id"])

        if case:
            s["person"] = {
                "name": case.get("name"),
                "age": case.get("age"),
                "photo": case.get("photo")
            }

        sightings.append(s)

    return sightings