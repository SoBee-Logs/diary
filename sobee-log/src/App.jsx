import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/common/BottomNav'
import AppBar from './components/common/AppBar'
import Home from './pages/Home'
import HomeDetail from './pages/HomeDetail'
import Report from './pages/Report'
import ReportDetail from './pages/ReportDetail'
import Feed from './pages/Feed'

const routeConfig = [
  { path: '/',               element: <Home />,         bottomNav: true,  appBar: false },
  { path: '/home/detail',    element: <HomeDetail />,   bottomNav: false, appBar: true, title: '홈 상세' },
  { path: '/report',         element: <Report />,       bottomNav: true,  appBar: true, title: '리포트' },
  { path: '/report/detail',  element: <ReportDetail />, bottomNav: false, appBar: true, title: '리포트 상세' },
  { path: '/feed',           element: <Feed />,         bottomNav: true,  appBar: true, title: '피드' },
]

function Layout() {
  const location = useLocation()
  const config = routeConfig.find(r => r.path === location.pathname) ?? { bottomNav: false, appBar: false }

  return (
    <div className="flex flex-col w-[375px] h-[100dvh] mx-auto bg-white overflow-hidden">
      {config.appBar && <AppBar title={config.title} />}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          {routeConfig.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </div>
      {config.bottomNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}