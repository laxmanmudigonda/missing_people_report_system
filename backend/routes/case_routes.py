from fastapi import APIRouter, UploadFile, File
from backend.models.case_model import Case
from backend.database import cases_collection
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
import shutil, os

from backend.utils.time_utils import get_time_since
from backend.utils.priority_utils import calculate_priority

class CaseUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    photo: Optional[str] = None
    lastSeenLocation: Optional[dict] = None
    description: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str  # "missing" or "found"

router = APIRouter()

# CREATE CASE
@router.post("/cases")
async def create_case(case: Case):
    case_dict = case.dict()
    case_dict["createdAt"] = datetime.utcnow()
    case_dict["status"] = "missing"

    result = cases_collection.insert_one(case_dict)
    case_dict["_id"] = str(result.inserted_id)

    # FIX: convert datetime to string
    case_dict["createdAt"] = case_dict["createdAt"].isoformat()

    # REALTIME ALERT (safe)
    try:
        from backend.socket_manager import sio
        await sio.emit("new_case", case_dict)
    except Exception as e:
        print("Socket error:", e)

    return case_dict


# GET ALL CASES
@router.get("/cases")
async def get_cases():
    cases = []

    for case in cases_collection.find():
        case["_id"] = str(case["_id"])
        case["timeSince"] = get_time_since(case["createdAt"])
        case["priorityScore"] = calculate_priority(case)
        cases.append(case)

    cases.sort(key=lambda x: x["priorityScore"], reverse=True)

    return cases


# GET SINGLE CASE
@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    case = cases_collection.find_one({"_id": ObjectId(case_id)})

    if case:
        case["_id"] = str(case["_id"])
        case["timeSince"] = get_time_since(case["createdAt"])
        return case

    return {"error": "Case not found"}


# MARK AS FOUND
@router.patch("/cases/{case_id}/found")
async def mark_case_found(case_id: str):
    result = cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "found", "foundAt": datetime.utcnow().isoformat()}}
    )
    if result.modified_count:
        return {"message": "Case marked as found"}
    return {"error": "Case not found"}


# DELETE CASE
@router.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    result = cases_collection.delete_one({"_id": ObjectId(case_id)})
    if result.deleted_count:
        return {"message": "Case deleted"}
    return {"error": "Case not found"}


# REVERT CASE STATUS (e.g. missing again)
@router.patch("/cases/{case_id}/status")
async def update_case_status(case_id: str, update: StatusUpdate):
    allowed = {"missing", "found"}
    if update.status not in allowed:
        return {"error": f"Status must be one of {allowed}"}
    fields = {"status": update.status}
    if update.status == "missing":
        fields["foundAt"] = None
    result = cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": fields}
    )
    if result.matched_count:
        return {"message": f"Case status updated to {update.status}"}
    return {"error": "Case not found"}


# UPDATE CASE DETAILS
@router.patch("/cases/{case_id}")
async def update_case(case_id: str, updates: CaseUpdate):
    fields = {k: v for k, v in updates.dict().items() if v is not None}
    if not fields:
        return {"error": "No valid fields to update"}
    result = cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": fields}
    )
    if result.matched_count:
        return {"message": "Case updated", "updated": fields}
    return {"error": "Case not found"}


# UPLOAD PHOTO
@router.post("/upload")
async def upload_photo(file: UploadFile = File(...)):
    os.makedirs("static", exist_ok=True)
    safe_name = file.filename.replace(" ", "_")
    with open(f"static/{safe_name}", "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": safe_name}