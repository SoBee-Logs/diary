import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'

const MOOD_EMOJIS = ['☺️', '😭', '😮', '😍', '😡']
const MOOD_TYPES = ['HAPPY', 'SAD', 'SURPRISED', 'LOVE', 'ANGRY']

export default function CameraPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState(0)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch('http://localhost:8080/api/groups', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()
        if (data && data.length > 0) {
          setRooms(data.map((group) => ({
            id: group.groupId,
            label: group.groupName,
          })))
        }
      } catch (err) {
        console.error('모임 목록 조회 실패', err)
      }
    }
    fetchMyGroups()
  }, [])

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    )
  }

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
      const token = localStorage.getItem("token")

      formData.append('image', imageFile)
      formData.append('takenAt', new Date().toISOString())
      formData.append('latitude', '37.5665')
      formData.append('longitude', '126.9780')
      if (text) formData.append('text', text)
      formData.append('emoji', MOOD_TYPES[selectedMood])
      formData.append('groupId', selectedRooms.join(','))

      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('업로드 실패')

      const result = await res.json()

      navigate('/consumption-log', {
        state: {
          text,
          mood: MOOD_EMOJIS[selectedMood],
          imageUrl: result.imageUrl,
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
            <span className="relative flex items-center gap-8 text-2xl z-10">
              <span>⚡</span>
              <span>📷</span>
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
        </figure>

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

        <section className="text-left">
          <p className="text-[15px] font-bold text-gray-900 mb-4">소비 기분</p>
          <ul className="flex justify-between list-none p-0 m-0 px-1">
            {MOOD_EMOJIS.map((emoji, i) => (
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

        <section className="text-left">
          <p className="text-[15px] font-bold text-gray-900 mb-3">모임 선택</p>
          <ul className="flex gap-3 overflow-x-auto list-none p-0 m-0 pb-1">
            {rooms.length === 0 ? (
              <p className="text-[13px] text-gray-400">모임이 없어요. 먼저 모임을 만들어주세요!</p>
            ) : (
              rooms.map((room) => {
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
              })
            )}
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