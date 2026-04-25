from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "places_state.json"
BASE_FILE = "tarczyn_places.json"

class Place(BaseModel):
    id: int
    name: str
    description: str
    lat: float
    lng: float
    is_visited: bool = False


def load_db():
    # 1. Próba załadowania stanu zapisanego przez użytkownika
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                content = f.read()
                if content:  # Sprawdź czy plik nie jest pusty
                    return [Place(**p) for p in json.loads(content)]
        except (json.JSONDecodeError, ValueError):
            print(f"Błąd pliku {DATA_FILE}. Ładuję bazę domyślną.")

    # 2. Ładowanie bazy głównej (100 miejsc)
    if os.path.exists(BASE_FILE):
        try:
            with open(BASE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [Place(**p, is_visited=False) for p in data]
        except json.JSONDecodeError:
            print(f"Krytyczny błąd: Plik {BASE_FILE} jest uszkodzony lub pusty!")
            return []  # Zwróć pustą listę, żeby serwer chociaż wstał

    return []

def save_db(places):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([p.dict() for p in places], f, ensure_ascii=False, indent=2)

db_places = load_db()

@app.get("/api/places", response_model=List[Place])
def get_places():
    return db_places

@app.put("/api/places/{place_id}")
def toggle_place(place_id: int):
    for p in db_places:
        if p.id == place_id:
            p.is_visited = not p.is_visited
            save_db(db_places)
            return p
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)