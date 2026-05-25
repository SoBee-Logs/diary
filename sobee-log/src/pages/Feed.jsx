import { useEffect, useState } from 'react'
import RoomTabs from '../components/common/RoomTabs'
import StatusBar from '../components/common/StatusBar'
import { CURRENT_USER } from '../constants/rooms'

// API 응답(DiaryFeedItemResponse)을 FeedPost가 사용하는 형태로 변환
const mapDiaryToPost = (item) => ({
  id: item.diaryId,
  title: item.title || '무제',
  // diaryLines가 비어있으면 subtitle을 한 줄로 표시
  diaryLines: item.diaryLines?.length > 0
    ? item.diaryLines
    : [item.subtitle].filter(Boolean),
  date: item.date || '',
  authorNickname: item.authorName || '익명',
  // 개인 아바타 없음 — 추후 B팀 페르소나 이미지 합칠 때 이 값만 교체하면 됨
  avatarUrl: CURRENT_USER.avatarUrl,
  personaTitle: item.roomLabel || '',
  imageUrl: item.imageUrl || '',
  liked: false,
  likes: item.likes ?? 0,
  roomId: `room_${item.roomId}`, // RoomTabs의 id 형식(room_N)에 맞게 변환
})

function FeedPost({ post, onToggleLike }) {
  return (
    <article className="bg-white mb-3 rounded-2xl overflow-hidden shadow-sm mx-4">
      <header className="flex items-center gap-3 px-4 py-3">
        <img
          src={post.avatarUrl}
          alt={post.authorNickname}
          className="w-9 h-9 rounded-full object-cover"
        />
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-bold text-gray-900">{post.authorNickname}</span>
          <span className="block text-xs text-gray-500 truncate">{post.personaTitle}</span>
        </span>
      </header>

      <figure className="m-0 w-full aspect-square bg-gray-100 relative">
        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center"
          aria-label="좋아요"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={post.liked ? '#ef4444' : 'none'}
            stroke={post.liked ? '#ef4444' : '#374151'}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </figure>

      <section className="px-4 py-3 text-left">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-gray-900 m-0">{post.title}</h3>
          <time className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{post.date}</time>
        </div>
        {post.diaryLines.map((line, i) => (
          <p key={i} className="text-sm text-gray-700 leading-relaxed m-0 mb-1">
            {line}
          </p>
        ))}
        {post.likes > 0 && (
          <p className="text-xs text-gray-400 mt-2 m-0">좋아요 {post.likes}개</p>
        )}
      </section>
    </article>
  )
}

export default function Feed() {
  // RoomTabs가 mount 시 onChange로 첫 번째 방 ID를 설정해 줌 — null로 시작
  const [activeRoom, setActiveRoom] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // activeRoom이 바뀔 때마다 해당 방의 일기 목록 DB 조회
  useEffect(() => {
    // room_N 형식 검증 — RoomTabs가 설정하기 전(null 등)은 skip
    if (!activeRoom || !activeRoom.startsWith('room_')) return

    const groupId = activeRoom.replace('room_', '')

    const fetchDiaries = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/diary/list?groupId=${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setPosts(data.map(mapDiaryToPost))
      } catch (err) {
        console.error('일기 목록 조회 실패', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiaries()
  }, [activeRoom])

  const handleToggleLike = (id) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== id) return post
        const liked = !post.liked
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1),
        }
      }),
    )
  }

  return (
    <main className="min-h-full bg-[#F3F4F6]">
      <StatusBar />
      <RoomTabs activeRoom={activeRoom} onChange={setActiveRoom} showAdd />

      <section className="py-3 pb-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-400 py-12">불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">
            이 모임방에 아직 일기가 없어요
          </p>
        ) : (
          posts.map((post) => (
            <FeedPost key={post.id} post={post} onToggleLike={handleToggleLike} />
          ))
        )}
      </section>
    </main>
  )
}