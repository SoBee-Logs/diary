from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import diary, vlm

app = FastAPI(title="Diary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diary.router)
app.include_router(vlm.router)

@app.get("/")
def root():
    return {"message": "Diary API 서버 작동 중!"}