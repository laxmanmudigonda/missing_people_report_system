from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routes import case_routes, sighting_routes
from backend.socket_manager import sio
import socketio
import os

# FastAPI app
app = FastAPI()

# CORS FIX (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded photos
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Combine Socket.IO + FastAPI
socket_app = socketio.ASGIApp(sio, app)

# Include routes
app.include_router(case_routes.router)
app.include_router(sighting_routes.router)

@app.get("/")
def home():
    return {"message": "Missing People Alert System Running 🚨"}