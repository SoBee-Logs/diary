from fastapi import APIRouter

router = APIRouter(prefix="/diary", tags=["diary"])

@router.get("/list")
def get_diary_list():
    return [
        {
            "diary_id": 1,
            "diary_content": "오늘 친구들과 파스타를 먹었다. 분위기가 너무 좋았다.",
            "created_at": "2026-05-19",
            "likes": 3
        },
        {
            "diary_id": 2,
            "diary_content": "카페에서 아메리카노 한 잔. 여유로운 오후였다.",
            "created_at": "2026-05-18",
            "likes": 5
        }
    ]

@router.post("/generate")
def generate_diary():
    return {
        "status": "success",
        "diary": "오늘 투썸플레이스에서 6만원을 썼다. 친구들과 즐거운 시간이었다."
    }