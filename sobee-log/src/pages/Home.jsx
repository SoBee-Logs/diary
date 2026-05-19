import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'
import { CURRENT_USER } from '../constants/rooms'
import { roomFeedPreviews } from '../data/mockDiaries'

export default function Home() {
  const navigate = useNavigate()

  return (
    <main className="min-h-full bg-white text-left pb-2">
      <section className="bg-gradient-to-b from-[#1e73be] via-[#7eb8e8] to-[#e8f4fc] pb-5">
        <StatusBar dark />
        <header className="px-5 pt-1 flex justify-between items-center text-white text-[11px] font-medium">
          <span className="bg-white/30 px-3 py-1.5 rounded-full">
            나의 소비 페르소나
          </span>
          <button type="button" onClick={() => navigate('/report')} className="text-white/95">
            소비 리포트 보러가기 &gt;
          </button>
        </header>

        <figure className="mx-5 mt-3 mb-0 rounded-2xl overflow-hidden bg-white h-[200px] m-0 shadow-sm">
          <img
            src={CURRENT_USER.personaImage}
            alt="페르소나 꿀벌 아바타"
            className="w-full h-full object-cover object-center"
          />
        </figure>

        <p className="text-center text-[14px] font-semibold text-gray-800/90 tracking-tight mt-3 mb-4 px-5">
          {CURRENT_USER.personaTitle}
        </p>

        <button
          type="button"
          className="mx-5 w-[calc(100%-40px)] py-3.5 rounded-xl bg-[#1e73be] text-white text-[13px] font-bold shadow-md"
        >
          페르소나 기반 금융 상품 추천 바로가기
        </button>
      </section>

      <section className="px-5 -mt-2">
        <button
          type="button"
          onClick={() => navigate('/camera')}
          className="w-full bg-white rounded-3xl px-5 py-5 shadow-md flex items-center gap-4 text-left"
        >
          <span className="flex-1 block">
            <span className="block text-[11px] text-gray-400 mb-1">sytem time</span>
            <span className="block text-[15px] font-bold text-gray-900 leading-snug">
              소비가 있다면
              <br />
              찍어주세요!
            </span>
          </span>
          <span className="w-[68px] h-[68px] border border-gray-200 rounded-2xl flex items-center justify-center bg-white shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>
      </section>

      <section className="px-5 pt-6 pb-24">
        <h2 className="text-[18px] font-bold text-gray-900 mb-4">피드</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-4 list-none p-0 m-0">
          {roomFeedPreviews.map((item) => (
            <li key={item.roomId}>
              <button
                type="button"
                onClick={() => navigate('/feed', { state: { roomId: item.roomId } })}
                className="w-full text-left p-0 border-0 bg-transparent"
              >
                <figure className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 m-0 mb-2">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 text-gray-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                </figure>
                <p className="text-[13px] font-bold text-gray-900 m-0">{item.roomName}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
