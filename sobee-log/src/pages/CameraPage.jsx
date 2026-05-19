import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'
import { ROOMS } from '../constants/rooms'

const MOODS = ['☺️', '😭', '😮', '😍', '😡']

const PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'

export default function CameraPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState(0)
  const [selectedRooms, setSelectedRooms] = useState(['room1', 'room2'])

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const handleNext = () => {
    if (selectedRooms.length === 0) return
    navigate('/consumption-log', {
      state: {
        text,
        mood: MOODS[selectedMood],
        imageUrl: PREVIEW_IMAGE,
        selectedRooms,
      },
    })
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
        {/* 사진 영역 */}
        <figure className="w-full aspect-square rounded-3xl bg-[#E8E8E8] m-0 relative flex flex-col justify-end items-center pb-6">
          <img
            src={PREVIEW_IMAGE}
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-30"
          />
          <span className="relative flex items-center gap-8 text-2xl z-10">
            <span>⚡</span>
            <span>📷</span>
          </span>
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
          disabled={selectedRooms.length === 0}
          className="w-full py-3.5 rounded-2xl bg-[#38BDF8] text-white font-bold text-[15px] disabled:opacity-40 mt-2"
        >
          다음
        </button>
      </section>
    </main>
  )
}
