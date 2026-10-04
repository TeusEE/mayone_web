# MAY.ONE 공식 홈페이지

Next.js App Router와 TypeScript strict 모드로 구성한 MAY.ONE 홈페이지 프로젝트입니다. 초기 콘텐츠는 정적 파일로 관리하며, 확인되지 않은 지점·인물·교육·공고·외부 링크는 공개되지 않도록 초안 상태로 보관합니다.

제품 요구사항은 [PRD](docs/fe-prd.md), 구현·검증·운영 대기는 [task-list](docs/fe-task.md), 최신 코드 점검 결과는 [프로젝트 점검 기록](docs/project-audit.md)에서 확인합니다.

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

`http://localhost:3000`에서 공개 화면을 확인할 수 있습니다. 공개 콘텐츠는 Supabase 미설정 상태에서도 로컬 데이터로 표시됩니다. 관리자 페이지를 사용하려면 아래 Supabase Auth 설정이 필요합니다.

### 관리자 인증 설정

현재 운영 관리자 코드는 [관리자 로그인](https://mayone-home.vercel.app/admin/login)에서 확인할 수 있습니다. 2026-10-04 Production 배포와 기본 접근 검증을 완료했으며 상세 결과는 [배포 기록](docs/project-audit.md#vercel-production-배포--2026-10-04)에 기록했습니다. 운영 Supabase는 로컬 테스트와 별도이므로 운영 계정의 비밀번호 설정·로그인은 운영 페이지에서 확인합니다.

관리자 로그인은 Supabase Auth 이메일·비밀번호 방식이며, 서버 환경변수 `ADMIN_EMAIL_ALLOWLIST`에 등록된 이메일만 관리자 기능을 사용할 수 있습니다. 일반 회원가입은 제공하지 않습니다. 로컬에서는 테스트 Supabase 프로젝트의 Auth URL·publishable key와 `SUPABASE_DATA_TARGET=test`를 `.env.local`에 설정합니다. 관리 데이터 저장에는 별도로 서버 전용 `SUPABASE_SECRET_KEY`가 필요합니다. Auth는 publishable key로만 처리하고 Secret key와 `ADMIN_EMAIL_ALLOWLIST`에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

`.env.local`과 Vercel Production에 승인된 관리자 주소를 쉼표로 구분해 `ADMIN_EMAIL_ALLOWLIST`에 설정합니다. Supabase Dashboard에서 공개 가입을 비활성화하고 같은 이메일로 관리자 Auth 초대를 보냅니다. 프로젝트의 Auth URL Configuration에 로컬 및 배포 주소의 `/auth/callback`을 허용합니다. 관리자는 초대 또는 비밀번호 재설정 링크를 통해 개인 비밀번호를 설정하고 `/admin/login`에서 로그인합니다. 접근을 회수할 때는 allowlist에서 이메일을 제거하고 Supabase Auth 계정을 비활성화합니다.

로그인 초대 redirect URL은 `http://localhost:3000/auth/callback` 또는 해당 배포 도메인의 `https://<domain>/auth/callback`입니다. 운영 DB와 publishable key는 Vercel Production 환경 변수에, 테스트 DB와 key는 로컬/Preview 환경 변수에 각각 설정합니다.

관리자 진입 주소는 `/admin/login`입니다. 로그인 후에는 처음 요청한 관리자 화면으로 돌아갑니다. 관리자 메뉴에서 현재 로그인 이메일, 선택한 메뉴, **비밀번호 설정**, **로그아웃**을 확인할 수 있습니다. 공개 메뉴에는 관리자 링크를 추가하지 않습니다.

로그인·복구 메일 요청·비밀번호 저장·로그아웃은 `/api/admin/auth/[action]`의 서버 경로를 사용합니다. 같은 출처 JSON 요청만 처리하고, 로그인 성공과 비밀번호 저장 전에는 Supabase `getUser()`와 서버 허용 목록을 확인합니다. 세션은 HttpOnly cookie에 저장하고 토큰을 JSON 응답이나 브라우저 저장소에 전달하지 않습니다. 새 비밀번호는 서버와 폼에서 모두 12~128자와 확인 입력을 검사합니다. 복구 메일 요청은 등록 여부를 구분하지 않는 안내를 제공합니다.

`/auth/callback`은 PKCE `code` 또는 `token_hash` + `type=invite|recovery`를 확인하고 허용된 관리자만 `/admin/complete-invite`로 이동시킵니다. 기존 implicit hash 링크는 `/admin/auth-link`에서 주소의 토큰을 지운 뒤 서버 세션으로 교환합니다. Dashboard 초대가 기본 Site URL인 `/`로 돌아와도 동일하게 인증 fragment를 처리하고 일반 홈페이지 anchor는 유지합니다. 이미 로그인된 브라우저에서도 복구 링크를 먼저 처리합니다. 실패·만료한 링크는 로그인 화면에서 설정 메일을 다시 요청할 수 있습니다. cookie 갱신 응답에는 Supabase SSR의 캐시 금지 헤더도 반영합니다.

PKCE 복구 메일은 요청한 브라우저에서 여는 것이 기본입니다. 다른 브라우저에서도 링크를 확인해야 한다면 Supabase 초대/복구 이메일 템플릿을 각각 `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite` / `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`로 구성합니다. 실제 메일 전송·템플릿 변경은 이 코드 수정에서 실행하지 않았습니다. 관련 기준은 [Supabase 서버 인증 가이드](https://supabase.com/docs/guides/auth/server-side/advanced-guide)와 [Next.js 이메일 token hash 예제](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)를 참고합니다.

일반 Auth 계정도 관리자 이메일 허용 목록에 없으면 관리자 화면·API를 사용할 수 없습니다. 인증 설정이 없는 관리자 API는 `503`, 미인증은 `401`, 허용되지 않은 계정은 `403`으로 거절합니다. 비관리자 이메일의 로그인은 자격 증명 오류와 동일한 `401` 안내를 사용합니다. 로그아웃은 허용 목록에서 제거된 계정도 이용할 수 있습니다.

### 저장소와 환경 제한

- 관리 데이터는 서버 전용 `SUPABASE_URL`·`SUPABASE_SECRET_KEY`·`SUPABASE_DATA_TARGET`으로 설정합니다. 개발/Preview는 `test`, Vercel Production은 `production`만 연결합니다.
- 관리 데이터 URL/Secret key 없이 Auth 공개 URL/key·`SUPABASE_DATA_TARGET=test`·`ADMIN_EMAIL_ALLOWLIST`를 설정하면 로컬 관리자 인증과 개발 파일 fallback을 함께 사용할 수 있습니다. 관리 데이터 변수가 일부만 설정되었거나 target이 다르면 fallback으로 전환하지 않습니다.
- Supabase 미설정 개발 환경은 `.local-data/branches.json`, `.local-data/mock-class-offers.csv`, `.local-data/mock-enrollments.csv`를 사용합니다. 관리자 파일 쓰기는 인증·Origin·개발 모드·loopback Host를 모두 확인합니다. Preview/Production에는 파일 쓰기 fallback이 없습니다.
- 현재 Supabase 어댑터는 Secret key를 사용합니다. 관리자 JWT/RLS 전환은 FE-T41 대기이므로 Vercel Production 변경 API는 인증된 관리자에게도 `503`을 반환하고 관리자 지점/신청 화면은 조회만 제공합니다.
- `/haru/apply`와 `/api/mock-enrollments`는 개발/Preview 테스트 전용입니다. Production mock POST는 `404`입니다. 실제 과정·개인정보 동의·비회원 신청 API는 FE-T42에서 구현하며 현재 실제 접수는 받지 않습니다.
- `npm run supabase:import-local`은 로컬 자료를 테스트 DB로 upsert하는 실제 쓰기 명령입니다. 일반 검증 명령에 포함하지 않습니다.

## 명령

```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript strict 검사
npm run content:validate # 콘텐츠 ID·관계·공개 필수값·URL·일정 검사
npm run content:test     # 공개·필터·CTA 규칙
npm run class-offers:test # mock 과정·모집 상태·신청 입력
npm run class-offers-store:test # 과정 파일 CRUD·동시 저장
npm run branches:test    # 지점 입력·공개 요건·파일 CRUD
npm run admin-auth:test  # 관리자 이메일 허용 목록 접근 상태
npm run http:test        # Origin·JSON·스트림 크기·로컬 쓰기 제한
npm run enrollment-csv:test # 신청 파일·그룹·수식 방어·동시 저장
npm run supabase-storage:test # 가짜 REST를 이용한 저장소 회귀 검증
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
