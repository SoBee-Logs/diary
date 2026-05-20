import { Link, useLocation } from 'react-router-dom'

const BLUE = '#3B82F6'
const GRAY = '#6b7280'

export default function BottomNav({ floating = false }) {
  const location = useLocation()

  const tabs = [
    {
      label: '리포트',
      path: '/report',
      icon: (active) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? BLUE : '#111'}>
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      ),
    },
    {
      label: '홈',
      path: '/home',
      icon: (active) => (
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            active ? 'bg-gray-200' : ''
          }`}
        >
          <span
            className="w-4 h-4 rounded-full block"
            style={{ backgroundColor: active ? BLUE : '#111' }}
          />
        </span>
      ),
    },
    {
      label: '피드',
      path: '/feed',
      icon: (active) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? BLUE : '#111'}>
          <path d="M12 2L22 20H2L12 2z" />
        </svg>
      ),
    },
  ]

  const navClass = floating
    ? 'mx-5 mb-4 rounded-full bg-white shadow-lg border border-gray-100 h-14'
    : 'h-16 bg-white border-t border-gray-100'

  return (
    <nav
      className={`flex-shrink-0 flex items-center justify-around ${navClass}`}
    >
      {tabs.map((tab) => {
        const active =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
          >
            {tab.icon(active)}
            <span
              className="text-[11px] font-medium"
              style={{ color: active ? BLUE : GRAY }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
