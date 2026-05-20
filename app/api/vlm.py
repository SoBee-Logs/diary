from fastapi import APIRouter

router = APIRouter(prefix="/vlm", tags=["vlm"])

@router.post("/analyze")
def analyze_image():
    return {
        "status": "success",
        "description": "파스타 요리 사진, 고급스러운 분위기의 레스토랑",
        "category": "외식",
        "estimated_price": 60000
    }

@router.post("/mapping")
def map_payment():
    return {
        "status": "success",
        "payment_id": 1,
        "store_name": "투썸플레이스",
        "amount": 60000,
        "payment_date": "2026-05-19 19:00:00"
    }