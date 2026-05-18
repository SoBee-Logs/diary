import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="pt-4 px-4">
      <p>홈 화면</p>
      <button
        onClick={() => navigate('/home/detail')}
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
      >
        상세 보기 →
      </button>
    </div>
  )
}