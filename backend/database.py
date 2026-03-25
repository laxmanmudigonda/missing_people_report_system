from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["missing_people"]

cases_collection = db["cases"]
sightings_collection = db["sightings"]