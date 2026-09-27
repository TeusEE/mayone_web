# MAY.ONE 공식 홈페이지

Next.js App Router와 TypeScript strict 모드로 구성한 MAY.ONE 홈페이지 프로젝트입니다. 초기 콘텐츠는 정적 파일로 관리하며, 확인되지 않은 지점·인물·교육·공고·외부 링크는 공개되지 않도록 초안 상태로 보관합니다.

## 개발 환경

- Node.js 24.x (`.nvmrc`, Vercel 지원 버전)
- npm 11.19.1
- Next.js 16.3.6
- React / React DOM 19.3.0

```bash
nvm use
npm ci
npm run dev
```

`http://localhost:3000`에서 개발 화면을 확인할 수 있습니다. 환경 변수나 외부 서비스 계정은 필요하지 않습니다.

## 명령

```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript strict 검사
npm run content:validate # 콘텐츠 ID·관계·공개 필수값·URL·일정 검사
npm run build            # Production 빌드
npm start                # 빌드 결과 실행
```

## 프로젝트 구조

- `src/app/`: App Router 레이아웃과 페이지
- `src/components/layout/`: 공통 헤더·모바일 메뉴·푸터
- `src/components/ui/`: 공통 UI와 상태 표현
- `src/content/`: 타입이 있는 정적 콘텐츠와 공개 조회 규칙
- `src/types/`: 콘텐츠 모델
- `src/lib/`: 콘텐츠 공개·CTA·검증 규칙
- `public/images/`, `public/brand/`: 공개 사용이 확인된 이미지와 로고
- `docs/`, `origin_source/`: 기획 기준과 원자료. 원자료는 공개 정적 폴더에 복사하지 않습니다.

콘텐츠 원본 파일은 Server Component와 검증 스크립트에서 조회합니다. 화면이나 Client Component에는 `published`와 `confirmed`가 모두 확인된 항목만 전달합니다. `pending`과 확인된 빈 목록은 별도 상태로 처리하며, 임시 fixture는 실제 콘텐츠와 분리합니다.
