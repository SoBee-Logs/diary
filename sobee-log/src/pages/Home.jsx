import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/common/StatusBar'
import { CURRENT_USER } from '../constants/rooms'
import { jwtDecode } from "jwt-decode"

const BANKS = [
  { code: "0002", name: "산업은행" },
  { code: "0003", name: "기업은행" },
  { code: "0004", name: "국민은행" },
  { code: "0007", name: "수협은행" },
  { code: "0011", name: "농협은행" },
  { code: "0020", name: "우리은행" },
  { code: "0023", name: "SC은행" },
  { code: "0027", name: "씨티은행" },
  { code: "0031", name: "대구은행" },
  { code: "0032", name: "부산은행" },
  { code: "0034", name: "광주은행" },
  { code: "0035", name: "제주은행" },
  { code: "0037", name: "전북은행" },
  { code: "0039", name: "경남은행" },
  { code: "0045", name: "새마을금고" },
  { code: "0048", name: "신협은행" },
  { code: "0071", name: "우체국" },
  { code: "0081", name: "KEB하나은행" },
  { code: "0088", name: "신한은행" },
  { code: "0089", name: "K뱅크" },
]

const CARDS = [
  { code: "0301", name: "KB카드" },
  { code: "0302", name: "현대카드" },
  { code: "0303", name: "삼성카드" },
  { code: "0304", name: "NH카드" },
  { code: "0305", name: "BC카드" },
  { code: "0306", name: "신한카드" },
  { code: "0307", name: "씨티카드" },
  { code: "0309", name: "우리카드" },
  { code: "0311", name: "롯데카드" },
  { code: "0313", name: "하나카드" },
  { code: "0315", name: "전북카드" },
  { code: "0316", name: "광주카드" },
  { code: "0320", name: "수협카드" },
  { code: "0321", name: "제주카드" },
]

export default function Home() {
  const navigate = useNavigate()

  const token = localStorage.getItem("token")
  let userId = null
  try {
    if (token) {
      const decoded = jwtDecode(token)
      userId = decoded.sub
    }
  } catch (e) {
    console.error("토큰 디코딩 실패", e)
  }

  const [showPopup, setShowPopup] = useState(() => {
    return localStorage.getItem(`mydataConnected_${userId}`) !== "true"
  })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState([])

  // 실제 모임방 목록 + 각 방의 최신 사진 URL
  const [feedPreviews, setFeedPreviews] = useState([])

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchFeedPreviews = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        // ① 내 모임방 목록 조회
        const groupsRes = await fetch('/api/groups', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!groupsRes.ok) return
        const groups = await groupsRes.json()

        // ② 각 모임방의 최신 사진 병렬 조회
        const previews = await Promise.all(
          groups.map(async (g) => {
            try {
              const photoRes = await fetch(`/api/photos/group/${g.groupId}/latest`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              const photoData = await photoRes.json()
              return {
                groupId: g.groupId,
                groupName: g.groupName,
                imageUrl: photoData?.imageUrl ?? null,
              }
            } catch {
              return { groupId: g.groupId, groupName: g.groupName, imageUrl: null }
            }
          })
        )
        setFeedPreviews(previews)
      } catch (err) {
        console.error('피드 미리보기 로딩 실패', err)
      }
    }
    fetchFeedPreviews()
  }, [])

  const toggleSelect = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleConnect = () => {
    if (selected.length === 0) return alert("최소 1개 이상 선택해주세요!")
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem(`mydataConnected_${userId}`, "true")
      setLoading(false)
      setShowPopup(false)
    }, 2000)
  }

  return (
    <main className="min-h-full bg-white text-left pb-2">

      {showPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "20px",
            padding: "24px",
            width: "90%",
            maxWidth: "340px",
            maxHeight: "85vh",
            overflowY: "auto",
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#0083CA", fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>마이데이터 연동 중</p>
                <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>금융 데이터를 불러오고 있어요</p>
                <div style={{
                  margin: "0 auto",
                  width: "36px", height: "36px",
                  border: "4px solid #0083CA",
                  borderTop: "4px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <h3 style={{ color: "#0083CA", fontWeight: "bold", fontSize: "17px", marginBottom: "4px" }}>마이데이터 연동</h3>
                <p style={{ color: "#888", fontSize: "12px", marginBottom: "20px" }}>연동할 기관을 선택해주세요</p>

                <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "10px" }}>은행</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
                  {BANKS.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => toggleSelect(bank.code)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: selected.includes(bank.code) ? "2px solid #0083CA" : "1.5px solid #eee",
                        backgroundColor: selected.includes(bank.code) ? "#E8F4FD" : "white",
                        color: selected.includes(bank.code) ? "#0083CA" : "#555",
                        fontWeight: selected.includes(bank.code) ? "bold" : "normal",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >{bank.name}</button>
                  ))}
                </div>

                <p style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "10px" }}>카드사</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "20px" }}>
                  {CARDS.map((card) => (
                    <button
                      key={card.code}
                      onClick={() => toggleSelect(card.code)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: selected.includes(card.code) ? "2px solid #0083CA" : "1.5px solid #eee",
                        backgroundColor: selected.includes(card.code) ? "#E8F4FD" : "white",
                        color: selected.includes(card.code) ? "#0083CA" : "#555",
                        fontWeight: selected.includes(card.code) ? "bold" : "normal",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >{card.name}</button>
                  ))}
                </div>

                <button
                  onClick={handleConnect}
                  style={{
                    width: "100%", padding: "14px",
                    backgroundColor: "#0083CA", color: "white",
                    border: "none", borderRadius: "10px",
                    fontSize: "15px", fontWeight: "bold", cursor: "pointer",
                    marginBottom: "8px",
                  }}
                >연동하기 ({selected.length}개 선택)</button>
                <button
                  onClick={() => setShowPopup(false)}
                  style={{
                    width: "100%", padding: "12px",
                    backgroundColor: "white", color: "#aaa",
                    border: "1px solid #eee", borderRadius: "10px",
                    fontSize: "13px", cursor: "pointer",
                  }}
                >나중에 하기</button>
              </>
            )}
          </div>
        </div>
      )}

      <section className="bg-gradient-to-b from-[#1e73be] via-[#7eb8e8] to-[#e8f4fc] pb-5">
        <StatusBar dark />
        <header className="px-5 pt-1 flex justify-between items-center text-white text-[11px] font-medium">
          <span className="bg-white/30 px-3 py-1.5 rounded-full">나의 소비 페르소나</span>
          <button type="button" onClick={() => navigate('/report')} className="text-white/95">
            소비 리포트 보러가기 &gt;
          </button>
        </header>
        <figure className="mx-5 mt-3 mb-0 rounded-2xl overflow-hidden bg-white h-[200px] m-0 shadow-sm">
          <img src={CURRENT_USER.personaImage} alt="페르소나 꿀벌 아바타" className="w-full h-full object-cover object-center" />
        </figure>
        <p className="text-center text-[14px] font-semibold text-gray-800/90 tracking-tight mt-3 mb-4 px-5">
          {CURRENT_USER.personaTitle}
        </p>
        <button type="button" className="mx-5 w-[calc(100%-40px)] py-3.5 rounded-xl bg-[#1e73be] text-white text-[13px] font-bold shadow-md cursor-pointer">
          페르소나 기반 금융 상품 추천 바로가기
        </button>
      </section>

      <section className="px-5 -mt-2">
        <button type="button" onClick={() => navigate('/camera')} className="w-full bg-white rounded-3xl px-5 py-5 shadow-md flex items-center gap-4 text-left cursor-pointer">
          <span className="flex-1 block">
            <span className="block text-[11px] text-gray-400 mb-1">{currentTime}</span>
            <span className="block text-[15px] font-bold text-gray-900 leading-snug">소비가 있다면<br />찍어주세요!</span>
          </span>
          <span className="w-[68px] h-[68px] border border-gray-200 rounded-2xl flex items-center justify-center bg-white shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>
      </section>
      <section className="px-5 mt-2 text-right">
        <button
          type="button"
          onClick={async () => {
            const token = localStorage.getItem("token")
            const res = await fetch('/api/groups', {
              headers: { Authorization: `Bearer ${token}` },
            })
            const groups = await res.json()
            const roomIds = groups.map(g => g.groupId)
            navigate('/consumption-log', { state: { selectedRooms: roomIds } })
          }}
          className="text-[12px] text-gray-400 underline cursor-pointer"
        >
          나의 소비 로그
        </button>
      </section>
      <section className="px-5 pt-6 pb-24">
        <h2 className="text-[18px] font-bold text-gray-900 mb-4">피드</h2>
        {feedPreviews.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-6">
            아직 모임방이 없어요. 모임을 만들어보세요!
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-4 list-none p-0 m-0">
            {feedPreviews.map((item) => (
              <li key={item.groupId}>
                <button
                  type="button"
                  onClick={() => navigate('/feed', { state: { roomId: item.groupId } })}
                  className="w-full text-left p-0 border-0 bg-transparent cursor-pointer"
                >
                  <figure className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 m-0 mb-2">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      // 사진이 없는 방 — 안내 문구 표시
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">📷</span>
                        <span className="text-[10px] text-gray-400">사진이 없어요</span>
                      </div>
                    )}
                  </figure>
                  <p className="text-[13px] font-bold text-gray-900 m-0">{item.groupName}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}