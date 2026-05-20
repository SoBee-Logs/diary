// CameraPage.jsx 수정본

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'
import { ROOMS } from '../constants/rooms'

const MOODS = ['☺️', '😭', '😮', '😍', '😡']

export default function CameraPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState(0)
  const [selectedRooms, setSelectedRooms] = useState(['room1', 'room2'])
  const [imageFile, setImageFile] = useState(null)        // ← 추가
  const [previewUrl, setPreviewUrl] = useState(null)      // ← 추가
  const [isLoading, setIsLoading] = useState(false)       // ← 추가
  const fileInputRef = useRef(null)

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) =>
        prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  // 파일 선택 시 미리보기 생성
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleNext = async () => {
    if (selectedRooms.length === 0 || !imageFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()

      // groupId 배열을 roomId → 숫자로 매핑 (room1→1, room2→2, room3→3)
      const roomIdMap = { room1: 1, room2: 2, room3: 3 }
      const groupIds = selectedRooms.map((r) => roomIdMap[r])
      
      formData.append('image', imageFile)
      formData.append('takenAt', new Date().toISOString())   // 임시, 실제론 EXIF
      formData.append('latitude', '37.5665')                  // 임시, 실제론 GPS
      formData.append('longitude', '126.9780')                // 임시
      if (text) formData.append('text', text)
      formData.append('emoji', MOODS[selectedMood])
      groupIds.forEach((id) => formData.append('groupId', id))

      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'X-User-Id': '1',   // 실제로는 JWT 토큰에서 추출
        },
        body: formData,
      })

      if (!res.ok) throw new Error('업로드 실패')

      const result = await res.json()

      navigate('/consumption-log', {
        state: {
          text,
          mood: MOODS[selectedMood],
          imageUrl: result.imageUrl,   // S3 URL
          selectedRooms,
          photoId: result.photoId,
        },
      })
    } catch (err) {
      alert('사진 업로드에 실패했어요. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <main className="flex flex-col min-h-full bg-white">
        <StatusBar />

        <header className="px-5 py-2">
          <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-2xl text-gray-800 leading-none w-8 h-8 flex items-center"
              aria-label="뒤로"
          >
            ‹
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-5 pb-8 space-y-6">
          {/* 사진 영역 — 클릭하면 파일 선택 */}
          <figure
              className="w-full aspect-square rounded-3xl bg-[#E8E8E8] m-0 relative flex flex-col justify-end items-center pb-6 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="선택한 사진"
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                />
            ) : (
                <>
              <span className="relative flex items-center gap-8 text-2xl z-10">
                <span>⚡</span>
                <span>📷</span>
              </span>
                </>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"   // 모바일에서 바로 카메라 실행
                className="hidden"
                onChange={handleImageChange}
            />
          </figure>

          {/* 텍스트 */}
          <label className="block text-left">
            <span className="text-[15px] font-bold text-gray-900 mb-2 block">텍스트</span>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="사진에 대해 설명해주세요!"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#F0F0F0] border-0 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </label>

          {/* 소비 기분 */}
          <section className="text-left">
            <p className="text-[15px] font-bold text-gray-900 mb-4">소비 기분</p>
            <ul className="flex justify-between list-none p-0 m-0 px-1">
              {MOODS.map((emoji, i) => (
                  <li key={i}>
                    <button
                        type="button"
                        onClick={() => setSelectedMood(i)}
                        className={`text-[28px] transition-transform ${
                            selectedMood === i ? 'scale-110' : 'opacity-50'
                        }`}
                    >
                      {emoji}
                    </button>
                  </li>
              ))}
            </ul>
          </section>

          {/* 모임 선택 */}
          <section className="text-left">
            <ul className="flex gap-3 overflow-x-auto list-none p-0 m-0 pb-1">
              {ROOMS.map((room) => {
                const checked = selectedRooms.includes(room.id)
                return (
                    <li key={room.id} className="shrink-0">
                      <button
                          type="button"
                          onClick={() => toggleRoom(room.id)}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#F0F0F0] min-w-[100px]"
                      >
                        <span className="text-[14px] font-bold text-[#3B82F6]">{room.label}</span>
                        <span
                            className={`w-5 h-5 rounded border-2 border-dashed flex items-center justify-center ${
                                checked ? 'border-[#3B82F6] bg-sky-50' : 'border-[#3B82F6]/50'
                            }`}
                        >
                      {checked && (
                          <span className="text-[10px] text-[#3B82F6] font-bold">✓</span>
                      )}
                    </span>
                      </button>
                    </li>
                )
              })}
            </ul>
          </section>

          <button
              type="button"
              onClick={handleNext}
              disabled={selectedRooms.length === 0 || !imageFile || isLoading}
              className="w-full py-3.5 rounded-2xl bg-[#38BDF8] text-white font-bold text-[15px] disabled:opacity-40 mt-2"
          >
            {isLoading ? '업로드 중...' : '다음'}
          </button>
        </section>
      </main>
  )
}