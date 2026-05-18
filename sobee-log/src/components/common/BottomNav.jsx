import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const location = useLocation()

  const tabs = [
    {
      label: '리포트',
      path: '/report',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6366f1' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
    },
    {
      label: '홈',
      path: '/',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6366f1' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: '피드',
      path: '/feed',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6366f1' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex-shrink-0 flex items-center justify-around h-16 bg-white border-t border-gray-100">
      {tabs.map((tab) => {
        const active =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex flex-col items-center justify-center gap-1 w-full h-full"
          >
            {tab.icon(active)}
            <span className={`text-xs font-medium ${active ? 'text-indigo-500' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}