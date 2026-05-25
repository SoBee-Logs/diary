from pydantic import BaseModel
from typing import Optional, List

# 프론트엔드(또는 VLM)에서 일기를 써달라고 보낼 때 담겨올 데이터 형식
class DiaryRequest(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    store_name: Optional[str] = None
    description: Optional[str] = None
    mood: Optional[str] = None
    # DB emotions_text.text — 사용자가 사진과 함께 직접 입력한 메모 텍스트
    emotion_text: Optional[str] = None
    # 결제 매핑 여부 — persona_transaction 존재 = True (확인된 소비)
    matched: Optional[bool] = None
    # 프론트 소비 로그 타임라인에서 해시태그로 표시할 방 번호 목록 (예: ["#거지방", "#다이어트방"])
    tags: Optional[List[str]] = []
    # Spring Boot가 주입하는 모임방 특징 — 일기 톤/스타일 결정에 사용
    group_description: Optional[str] = None

# AI가 일기를 다 쓰고 나서 프론트엔드로 돌려줄 데이터 형식
class DiaryResponse(BaseModel):
    title: str
    subtitle: str
    diary_lines: List[str]
    # 프론트 소비 로그 타임라인에 해시태그로 표시할 방 번호 목록
    tags: List[str]