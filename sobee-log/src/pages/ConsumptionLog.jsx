import { useLocation, useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'
import BottomNav from '../components/common/BottomNav'
import { todayConsumptionLogs } from '../data/mockDiaries'
import { ROOMS } from '../constants/rooms'

export default function ConsumptionLog() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedRooms = location.state?.selectedRooms ?? ['room1', 'room2']

  const roomHashtags = selectedRooms
    .map((id) => ROOMS.find((r) => r.id === id)?.hashtag)
    .filter(Boolean)

  const handleGenerate = () => {
    navigate('/loading', {
      state: {
        ...location.state,
        selectedRooms: selectedRooms.length > 0 ? selectedRooms : ['room1', 'room2'],
      },
    })
  }

  return (
    <main className="flex flex-col min-h-full bg-white">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 text-left shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 -ml-1 mb-2 text-gray-800"
          aria-label="뒤로가기"
        >
          <span className="text-[22px] leading-none">‹</span>
        </button>
        <p className="text-[13px] font-semibold text-gray-900 m-0 leading-snug">
          나의 소비 로그
        </p>
        <p className="text-[11px] text-gray-500 m-0 mt-0.5 font-normal">2026년 5월 7일</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-[140px] relative">
        <span
          className="absolute left-[88px] top-2 bottom-4 w-[2px] bg-[#D8C4F0] rounded-full"
          aria-hidden
        />

        <ul className="list-none m-0 p-0 pb-4">
          {todayConsumptionLogs.map((log) => (
            <li key={log.id} className="flex gap-3 mb-8 relative">
              <span className="w-[76px] shrink-0 text-left pt-1">
                <span className="block text-[13px] font-bold text-gray-900 leading-tight">
                  {log.time}
                </span>
                <span className="block text-[12px] text-gray-800 mt-1 leading-snug">
                  {log.text}
                </span>
                <span className="block text-[22px] mt-1">{log.mood}</span>
                <span className="block text-[10px] text-gray-600 mt-1 leading-relaxed">
                  {(log.roomTags.length ? log.roomTags : roomHashtags).join(' ')}
                </span>
              </span>

              <figure className="flex-1 m-0 relative">
                <span className="block rounded-lg overflow-hidden border-[6px] border-[#00BFFF] aspect-[16/10] bg-gray-100">
                  <img src={log.thumbnail} alt="" className="w-full h-full object-cover" />
                </span>
                {log.isLatest && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white text-lg">
                      📷
                    </span>
                  </span>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 고정 버튼 (하단 네비 바로 위) */}
      <footer className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[375px] px-5 py-3 bg-white border-t border-gray-100 z-10">
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#00BFFF] text-white text-[14px] font-bold shadow-md"
        >
          <span className="text-[11px]">▶</span> LLM 일기 생성
        </button>
      </footer>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] z-20">
        <BottomNav floating />
      </div>
    </main>
  )
}
