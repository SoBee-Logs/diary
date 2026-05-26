import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CURRENT_USER } from '../constants/rooms'

const LOADING_MESSAGES = [
  'VLM이 사진을 분석하고 있어요...',
  '결제 내역을 매핑하고 있어요...',
  'LLM이 일기를 쓰는 중입니다!',
]

const FLOATING_PHOTOS = [
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=120&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&q=80',
]

export default function LoadingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [messageIndex, setMessageIndex] = useState(0)

  const imageUrl =
    location.state?.imageUrl ??
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'

  const selectedRooms =
    location.state?.selectedRooms?.length > 0
      ? location.state.selectedRooms
      : []

  const imageFile = location.state?.imageFile ?? null
  const photoId   = location.state?.photoId   ?? null
  const mood      = location.state?.mood       ?? null

  useEffect(() => {
    // 로딩 메시지 순환 타이머
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 1000)

    // 일기 생성 파이프라인 (VLM은 CameraPage에서 이미 완료됨)
    const runPipeline = async () => {
      const token = localStorage.getItem('token')
      const today = new Date().toISOString().slice(0, 10) // "yyyy-MM-dd"

      // 선택한 방별로 Spring Boot /api/diary/generate 호출
      // Spring Boot가 내부적으로 DB 사진 수집 + FastAPI LLM 호출을 통합 처리
      const diaries = []
      for (const roomId of selectedRooms) {
        try {
          const res = await fetch('/api/diary/generate', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: roomId,
              date:    today,
              mood:    mood,
            }),
          })
          // 에러 응답(400/500) 시 해당 방 skip
          if (!res.ok) continue
          const data = await res.json()
          diaries.push({
            title:      data.title,
            subtitle:   data.subtitle,
            diaryLines: data.diaryLines,   // Spring Boot camelCase
            tags:       data.tags,
            roomId:     data.roomId,
            roomLabel:  data.roomLabel,
            imageUrls:  data.imageUrls,    // 다중 사진 URL 배열
            photoIds:   data.photoIds,     // DB 저장 시 필요한 사진 ID 목록
            imageUrl:   data.imageUrls?.[0] ?? imageUrl, // 하위 호환용
          })
        } catch {
          // 특정 방 일기 생성 실패 시 해당 방만 skip
        }
      }

      clearInterval(messageTimer)
      navigate('/diary-result', {
        replace: true,
        state: { diaries, selectedRooms, roomIndex: 0 },
      })
    }

    runPipeline()

    return () => clearInterval(messageTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="relative flex flex-col items-center justify-center min-h-full bg-gradient-to-b from-indigo-50 via-white to-indigo-50 overflow-hidden px-6">
      <div className="absolute inset-x-0 top-[18%] h-24 overflow-hidden opacity-40 pointer-events-none">
        <div className="flex gap-4 animate-marquee whitespace-nowrap">
          {[imageUrl, ...FLOATING_PHOTOS, imageUrl, ...FLOATING_PHOTOS].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover shadow-md shrink-0"
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-[22%] left-0 right-0 h-16 overflow-hidden pointer-events-none">
        <div className="flex items-center gap-6 animate-avatar-drift">
          {[CURRENT_USER.personaEmoji, '🌃', '🍜', '✨', CURRENT_USER.personaEmoji, '🌃'].map(
            (emoji, i) => (
              <span
                key={i}
                className="text-4xl shrink-0 w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-lg overflow-hidden"
              >
                {i % 2 === 0 ? (
                  <img
                    src={CURRENT_USER.personaImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  emoji
                )}
              </span>
            ),
          )}
        </div>
      </div>

      <section className="relative z-10 flex flex-col items-center gap-6">
        <span className="relative w-20 h-20">
          <span className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <img
              src={CURRENT_USER.personaImage}
              alt=""
              className="w-12 h-12 object-cover"
            />
          </span>
        </span>

        <section className="text-center space-y-2">
          <h2 className="text-lg font-bold text-gray-800">일기 생성 중</h2>
          <p
            key={messageIndex}
            className="text-sm text-indigo-600 font-medium animate-fade-in min-h-5"
          >
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </section>

        <span className="flex gap-1.5 mt-2">
          {LOADING_MESSAGES.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === messageIndex ? 'bg-indigo-500' : 'bg-indigo-200'
              }`}
            />
          ))}
        </span>
      </section>
    </main>
  )
}
