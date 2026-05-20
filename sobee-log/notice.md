# 프론트엔드 개발 공통 공지

---

## 1. 레포 구조 이해

```
sobee-log (이 레포 — 공통 컴포넌트 원본)
├── A팀 레포 (카메라·소비로그·LLM일기·모임방·피드)
└── B팀 레포 (리포트·금융상품 추천)
```

이걸 A와 B가 각자 레포를 만들 때 그대로 복사해서 시작하면 됨. (Vite 설정, Tailwind, React Router, routeConfig 기반 레이아웃 구조 설정해둠.)
- **이 레포는 공통 컴포넌트의 원본 저장소**입니다. 직접 기능 개발은 하지 않습니다.
- A팀·B팀은 각자 레포에서 개발하고, 공통 컴포넌트가 업데이트되면 공지 후 각자 레포에 수동 복붙합니다.
- 레포가 달라도 웹앱 방식이므로 URL 다이렉팅으로 팀 간 화면 이동을 처리합니다.

---

## 2. 팀 간 화면 이동

두 팀의 프론트가 별도 레포(별도 도메인/포트)로 배포되므로, **팀 경계를 넘는 이동은 `react-router`의 `<Link>`가 아니라 `window.location.href`를 사용**합니다.

```js
// 같은 팀 레포 내부 이동 → Link 또는 navigate 사용
navigate('/report/detail')

// 다른 팀 레포로 이동 → window.location 사용
window.location.href = 'https://팀A주소/feed'
```

배포 URL은 환경변수로 관리합니다. `.env.local`에 작성하세요 (`.gitignore`에 포함되어 있어 커밋되지 않습니다).

```
# .env.local 예시
VITE_TEAM_A_URL=http://localhost:5173
VITE_TEAM_B_URL=http://localhost:5174
```

---

## 3. 공통 컴포넌트 복붙 위치

```
src/
└── components/
    └── common/
        ├── AppBar.jsx     ← 뒤로가기 + 타이틀 앱바
        └── BottomNav.jsx  ← 하단 탭 네비게이션
```

복붙 후 **절대 컴포넌트 내부 구조를 임의로 수정하지 마세요.** 공통 수정이 필요하면 총팀장에게 요청하고 원본을 업데이트한 뒤 공지합니다.

### BottomNav 탭 구성은 A·B팀 공통입니다

| 탭 | 경로 |
|---|---|
| 리포트 | `/report` |
| 홈 | `/` |
| 피드 | `/feed` |

**탭 자체는 수정하지 않습니다.** 각 탭을 눌렀을 때 렌더링되는 페이지 컴포넌트(`Home.jsx`, `Report.jsx`, `Feed.jsx`)의 내용만 팀별로 자유롭게 개발하세요.

---

## 4. 페이지 추가 방법 (routeConfig 기반)

페이지를 추가할 때는 `App.jsx`의 `routeConfig` 배열에 항목 하나만 추가하면 됩니다.

```js
// App.jsx
const routeConfig = [
  { path: '/',            element: <Home />,   bottomNav: true,  appBar: false },
  { path: '/report',      element: <Report />, bottomNav: true,  appBar: true, title: '리포트' },
  { path: '/report/123',  element: <Detail />, bottomNav: false, appBar: true, title: '상세' },
  // ↑ 여기에 추가
]
```

| 옵션 | 설명 |
|---|---|
| `appBar: true` | 상단 앱바 표시 (타이틀 + 뒤로가기) |
| `appBar: false` | 앱바 없음 |
| `bottomNav: true` | 하단 탭바 표시 |
| `bottomNav: false` | 탭바 없음 (상세 페이지 등) |
| `title` | 앱바에 표시할 타이틀 (appBar: true일 때 필수) |

---

## 5. 기술 스택 및 개발 환경

| 항목 | 스펙 |
|---|---|
| 프레임워크 | React 19 + Vite 8 |
| 스타일 | Tailwind CSS v4 |
| 라우팅 | React Router v7 |
| 기준 해상도 | **375px (모바일 웹앱)** |

- `w-[375px]` 기준으로 레이아웃을 잡습니다. 이 너비를 벗어나는 요소를 만들지 마세요.
- `fixed` 포지셔닝은 사용하지 않습니다. AppBar/BottomNav는 flex column 레이아웃으로 처리되어 있습니다.
- 스크롤이 필요한 콘텐츠 영역은 부모가 `overflow-y-auto`를 가진 `flex-1` div 안에 작성합니다.

---

## 6. API 호출 구조

```
프론트엔드
├── Spring Boot (메인 서버) — 인증·모임방·피드·결제 CRUD
│     └── /api/v1/...
└── FastAPI (AI 서버) — 일기 생성·VLM 분석·임베딩 검색
      └── /ai/...
```

- common의 **group / user / transaction API는 A팀·B팀 모두 Spring Boot에서 호출**합니다.
- FastAPI는 Spring Boot가 내부적으로 호출하는 구조가 기본이지만, 프론트에서 직접 호출이 필요한 경우 총팀장과 협의 후 진행합니다.
- API 클라이언트(axios 인스턴스 등)도 공통 컴포넌트와 함께 관리할 예정이니 임의로 만들지 말고 공지를 기다려 주세요.

---

## 7. Git 주의사항

- **커밋 전 반드시 확인**: `.env.local` 파일이 스테이징되지 않았는지 확인하세요.
- `dist/` 폴더는 커밋하지 않습니다 (`.gitignore` 처리됨).
- 브랜치 전략은 팀별 레포에서 각자 정합니다. 이 공통 레포는 `main`만 사용합니다.

---

## 8. 문의

공통 컴포넌트 수정 요청, 환경변수 URL 확정, API 명세 관련 사항은 모두 공통(슬랙 or 카톡)으로 확인 거친 후 진행해주세요.
