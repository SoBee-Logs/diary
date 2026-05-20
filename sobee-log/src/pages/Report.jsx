import { useNavigate } from 'react-router-dom'

export default function Report() {
  const navigate = useNavigate()
  return (
    <div className="pt-4 px-4">
      <p>리포트 화면</p>
      <button
        onClick={() => navigate('/report/detail')}
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
      >
        상세 보기 →
      </button>
    </div>
  )
}