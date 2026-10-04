# 프로젝트 코드·문서 점검 기록

- 점검일: 2026-10-04
- 범위: App Router 경로·공개 콘텐츠·메타데이터·관리자 인증·API·파일/Supabase 저장소·migration·검증 스크립트와 기획 문서
- 기준: [PRD](./fe-prd.md), [task-list](./fe-task.md), 설치된 Next.js 16.3.6의 `node_modules/next/dist/docs/` 가이드
- 작업: FE-T43. 점검 시작 전에 있던 관리자 Auth·문서·라우트 이동 변경을 유지하면서 수정했다.

## 문서 정합성

| 확인한 불일치 | 반영 내용 |
| --- | --- |
| 인증·Supabase가 범위 제외/미구현으로 남은 완료 문구 | 관리자 Auth 코드·서버 저장 구현과 실제 계정/운영 검증 대기를 구분 |
| 서버 이메일 허용 목록과 UUID 테이블을 동시에 현재 권한 기준으로 설명 | 현재 앱 기준은 `ADMIN_EMAIL_ALLOWLIST`; 기존 테이블 migration은 이력으로 유지. DB 권한 기준과 동기화·회수는 T41로 연결 |
| 실제 신청 API를 구현된 경로처럼 표기 | 현재 `/api/mock-enrollments`와 미구현 `/api/enrollments`를 분리하고 비밀번호 설정 경로도 명시 |
| `MockClassOffer`·정적 `AcademyClass`·운영 과정/신청 모델을 동일하게 설명 | 운영 모델·schema·공개/신청 허용 상태·개인정보 동의·처리 상태 작업을 T42에 추가 |
| 초기 로컬 관리자 제한과 현재 Auth 보호/Supabase 기능이 충돌 | F단계는 초기 구현 기록으로 설명하고 현재 환경 조건을 반영 |
| PRD 요구사항과 후속 작업의 연결이 흩어짐 | FE-01~FE-09, NFR-01~NFR-05 전체 대응표를 task-list §1.1에 추가 |
| 공개 지점·예약·마켓이 적용되어도 미확보로 표시 | 확인된 8개 지점·스토어 주소와 나머지 자료 대기를 구분 |

## 코드 수정과 리팩터링

| 문제 | 수정 | 관련 파일 |
| --- | --- | --- |
| 관리자 지점 조회가 Supabase 확인보다 먼저 개발 환경만 허용 | Supabase를 먼저 선택하고 파일 fallback만 개발로 제한 | `src/content/local-branches.ts` |
| 지점 목록과 채용·사이트맵이 서로 다른 지점 목록 사용 | 동일한 공개 지점 조회 사용; 비공개/삭제된 지점의 공고를 목록·상세·메타데이터·사이트맵에서 제외 | `src/app/recruit/`, `src/app/sitemap.ts` |
| 관리용 `placeUrl`과 임의 저장 JSON 필드가 공개 props에 포함될 수 있음 | 지점과 이미지 공개 필드를 명시적으로 projection; 렌더 내 중복 지점 조회는 React cache 사용 | `src/content/local-branches.ts` |
| 문서는 운영 변경 비활성인데 Auth 통과 후 API는 쓰기를 허용 | Production 관리자 변경을 중앙 가드에서 503으로 차단; 지점/신청 UI는 조회 전용, mock 과목은 준비 상태 | `src/lib/admin-auth.ts`, `src/app/admin/(protected)/` |
| 운영 mock 카탈로그·비개발 로컬 신청 파일 읽기와 잘못된 저장 설정 fallback | Production mock 조회는 빈 목록, 로컬 신청 읽기는 개발만 허용; 부분 설정 오류는 제출 불가로 표시 | `src/content/mock-class-offers.ts`, `src/content/mock-enrollments.ts` |
| Auth 공개 URL만 있어도 관리 데이터 저장소가 부분 설정으로 인식 | 관리 데이터 URL/Secret key의 존재와 Auth 공개 설정을 구분 | `src/lib/supabase-storage.ts` |
| JSON 응답·Origin·Content-Type·본문 크기 검사 중복 | 공통 HTTP 유틸리티; 정확한 JSON media type 검사와 스트림 읽기 중 byte 제한 | `src/lib/http.ts`, `src/app/api/` |
| 파일별 쓰기 큐·임시 파일 교체 중복 | 경로 정규화가 적용된 공통 큐와 원자적 파일 교체 사용 | `src/lib/local-file-store.ts`, 파일 저장소 3개 |
| Supabase 기본 페이지 제한 이후 레코드 누락 | ID 순서로 range 조회를 반복해 1,000건 초과 신청도 반환 | `src/lib/supabase-storage.ts` |
| DB 응답 검증에 CSV export escaping을 적용해 원문이 변형 | CSV 검증 후 DB 원문을 유지하고 신청 DTO에서는 저장용 추가 ID 제외 | `src/lib/supabase-storage.ts` |
| 테스트 신청 삽입이 false여도 성공으로 응답 | 실패/충돌을 409로 응답 | `src/app/api/mock-enrollments/route.ts` |
| 로그아웃 실패를 무시하고 이동 | 오류 응답·예외를 안내하고 성공 후 로그인으로 이동 | `src/components/admin/AdminSignOutButton.tsx` |
| 인증 페이지에 root main 안의 또 다른 main 존재 | 인증 페이지 wrapper를 div로 변경 | `src/app/admin/login/`, `src/app/admin/complete-invite/` |
| 메인 채용 CTA가 빌드 시각 이후 마감을 다시 확인하지 않음 | 기존 TimeBoundAction을 재사용해 마감·탭 복귀·클릭 전 재검사 | `src/components/sections/HomeLanding.tsx` |
| 옛 로컬 관리자 검사·정적 지점 조회 등 사용되지 않는 export | 파일 저장 제한만 공통 가드에 연결하고 사용하지 않는 조회 export 정리 | `src/lib/local-storage-access.ts`, `src/content/queries.ts` |

파일 쓰기 큐는 한 Node 프로세스 안의 개발 저장만 직렬화한다. 여러 서버의 공유 파일 잠금이나 실제 접수의 중복 저장 억제는 제공하지 않으며, 운영은 DB와 T42의 idempotency 검증을 사용해야 한다.

## 검증 결과

최종 명령은 프로젝트 지정 버전인 Node.js 24.21.0과 npm 11.19.1로 실행했다. 기본 셸의 Node.js는 26.8.2여서 npm exec의 임시 Node 24 실행 환경을 사용했다. 저장소 의존성 버전은 변경하지 않았다.

| 검증 | 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck -- --noUnusedLocals --noUnusedParameters` | 통과 |
| `npm run content:validate`, `npm run content:test` | 통과 |
| `npm run class-offers:test`, `npm run class-offers-store:test` | 통과 |
| `npm run branches:test`, `npm run admin-auth:test` | 통과 |
| `npm run http:test`, `npm run enrollment-csv:test` | 통과 |
| `npm run supabase-storage:test` | 통과; 가짜 REST로 CRUD·환경 분리·공개 DTO·1,001행 조회·DB 원문 보존·운영 mock 차단 검사 |
| `npm run build` | Node.js 24에서 최종 빌드 통과; Production trace에 mock fixture·로컬 신청 파일 없음 |
| 로컬 Production HTTP | 24개 요청 통과; DB/Auth 변수를 비워 외부 계정·실제 데이터를 사용하지 않음 |
| `git diff --check` | 통과 |
| 문서 대응·링크 | 14개 FE/NFR 대응과 연결된 로컬 파일 존재 확인 |

HTTP 점검은 다음 조건을 확인했다.

- 200: `/`, `/salon`, `/haru/classes`, `/haru/apply`, `/recruit`, `/haru/cooperation`, `/about`, `/admin/login`, `/robots.txt`, `/sitemap.xml`
- 307 로그인 이동: `/admin`, `/admin/branches`, `/admin/classes`, `/admin/enrollments`, `/admin/complete-invite`
- 404: 지점 상세, 없는 교육/채용 상세와 일반 경로, 미구현 실제 신청 API, Production mock 신청 POST
- 503: Auth 미설정 상태의 지점·과목 생성과 신청 수정 API; `Cache-Control: no-store` 확인
- HTML main landmark 1개, 공식 도메인 미설정 시 noindex, Production 신청 폼 비노출 확인

Auth가 설정된 상태의 미인증 401·비관리자 403은 중앙 가드 구현과 기존 검증 기록에 해당한다. 이번 HTTP 점검은 Auth 미설정 503을 직접 확인했고, 실제 계정으로 허용/거부를 확인하는 작업은 T40 대기다. 임시 서버는 점검 후 종료했다.

## 관리자 로그인 후속 구현 — FE-T40

2026-10-04 추가 요청에 따라 기본 인증 폼을 실제 관리자 이용 흐름으로 연결했다.

| 확인한 문제 | 반영 |
| --- | --- |
| `127.0.0.1`의 정상 요청이 Origin 검사에서 거절됨 | 설치된 NextURL의 loopback→localhost 정규화를 확인했다. HTTP Host로 원래 출처를 계산해 출처 검사와 callback 주소에 함께 사용 |
| 브라우저 SDK에서 로그인·복구·비밀번호 저장·로그아웃을 각각 처리 | 같은 출처 서버 인증 API로 통일하고 서버 `getUser()`와 허용 목록 검사, HttpOnly cookie, 본문 제한·캐시 금지 적용. 사용하지 않는 브라우저 Supabase client 제거 |
| 미로그인 페이지의 목적지를 잃고 항상 관리자 홈으로 이동 | Proxy가 내부 페이지 경로를 전달하고 알려진 관리자 경로만 로그인 복귀 주소로 허용 |
| 기존 로그인 상태가 복구 fragment 처리보다 먼저 홈으로 이동 | `/admin/auth-link`를 추가하고 로그인 페이지도 fragment 처리 후 이동. PKCE code와 invite/recovery token hash는 서버 callback에서 검증 |
| 관리자 메뉴에서 현재 계정·비밀번호 변경을 찾을 수 없음 | 이메일·현재 메뉴·비밀번호 설정·로그아웃 메뉴 연결. 비밀번호는 서버에서도 12~128자·확인 일치 검증 |
| SSR cookie 갱신 시 SDK가 전달한 캐시 헤더를 누락 | Proxy와 Route Handler 응답에 `setAll`의 cookie·캐시 금지 헤더 함께 반영 |

로컬 대체 Auth 서버와 실제 Next.js 개발 서버를 연결한 **34개 HTTP 확인**이 통과했다. 잘못된 비밀번호·미등록 이메일·미인증 비밀번호 변경·Origin/JSON/본문 크기 거절, 복구 안내와 callback 주소, PKCE/OTP/기존 fragment 세션 교환, 관리자 메뉴 진입, 비밀번호 서버 검증, 로그아웃 cookie 제거, 기존 JWT의 Auth 계정 비활성화 거절, 외부 복귀 주소 차단을 확인했다. 대체 서버는 메일을 전송하지 않으며 실제 Auth 계정이나 DB를 변경하지 않는다.

Chrome에서도 잘못된 로그인 안내→로그인→요청했던 지점 관리 복귀, 관리자 홈·현재 이메일·비밀번호 설정 메뉴, 로그아웃 후 로그인 화면, 이미 로그인된 상태의 implicit 복구 링크→비밀번호 설정을 확인했다. 마지막 링크의 주소에서 token fragment가 제거되는 것도 확인했다. 실제 비밀번호를 브라우저에 입력하거나 저장하는 작업은 하지 않았다. 임시 서버와 확인용 탭은 종료했다.

Node.js 24에서 타입·미사용 변수 검사, ESLint, Production 빌드를 통과했다. PRD와 FE-T40에 서버 인증 API·계정 메뉴·복귀/복구 처리를 반영했다. 후속 구현 당시 실제 관리자 계정·메일 전달과 Production 배포 검증은 미완료로 두었으며, 이후 Production 배포 완료는 아래 기록에 추가했다.

## Vercel Production 배포 — 2026-10-04

- 프로젝트: `mayone-home` / scope: `teus-ee-s-projects`
- 배포 ID: `dpl_75nC8mVyjGSeUaXKRyHr13Q8c4eH` / 상태: **Ready**
- 운영 주소: [mayone-home.vercel.app](https://mayone-home.vercel.app)
- 관리자 로그인: [mayone-home.vercel.app/admin/login](https://mayone-home.vercel.app/admin/login)
- 배포 상세: [Vercel 배포 기록](https://vercel.com/teus-ee-s-projects/mayone-home/75nC8mVyjGSeUaXKRyHr13Q8c4eH)

사용자 배포 요청에 따라 현재 승인된 로컬 관리자 이메일을 Production의 서버 전용 Secret `ADMIN_EMAIL_ALLOWLIST`에 등록했다. 기존 운영 Supabase URL·publishable key와 `SUPABASE_DATA_TARGET=production`의 일치를 확인했으며 운영 Auth의 이메일 로그인 활성화·공개 가입 비활성화를 확인했다. 운영 Secret key는 기존 설정을 유지했다. 로컬의 테스트 프로젝트와 비밀번호는 운영으로 복사하지 않았다.

`.vercelignore`를 추가해 환경 파일, `.local-data/`, 원자료, 문서·스크립트·migration과 빌드 산출물을 소스 업로드에서 제외했다. 최초 제외 규칙이 `src/lib/supabase/`도 제외해 첫 원격 빌드가 실패했으므로 루트 기준 패턴으로 수정했다. 최종 dry run에서 `src/`·`public/`의 128개 파일 누락 0개와 환경 파일·로컬 자료·원자료 업로드 0개를 확인했다. 최종 업로드는 148개 파일이며 원격 Next.js 빌드·타입 검사를 통과했다. 현재 로컬 작업 트리를 CLI로 배포했고 Git commit/push는 수행하지 않았다.

운영 도메인의 **14개 HTTP 확인**이 모두 통과했다.

- 200: `/`, `/salon`, `/haru/classes`, `/haru/apply`, `/admin/login`. 지점 조회와 로그인 입력 UI를 확인했고 운영 mock 신청 입력은 노출되지 않았다.
- 307: 미인증 `/admin/branches`, `/admin/enrollments`, `/admin/complete-invite`는 해당 내부 복귀 경로를 가진 로그인 주소로 이동했다.
- 401: 허용되지 않은 이메일 로그인, 미인증 비밀번호 변경, 미인증 지점 생성 API. 변경이나 실제 계정 인증을 수행하지 않았다.
- 403: 다른 출처의 로그인 요청.
- 404: Production mock 신청 POST.
- 307: 지원하지 않는 signup callback은 로그인 오류 안내로 이동했다.
- API 응답의 캐시 금지를 확인했다. 실제 메일 전송·관리자 비밀번호 변경은 수행하지 않았으며 실제 로그인·로그아웃은 사용자 검증으로 남긴다.

## 남은 완료 조건

| 작업 | 남은 조건 |
| --- | --- |
| T40 | 실제 계정의 직접 비밀번호 설정, 로그인·로그아웃·허용 해제·세션 만료 검증. 운영 허용 목록·Auth 코드 배포와 기본 HTTP 검증은 아래 배포 기록에서 완료 |
| T41 | 공개 projection·SELECT 정책, 관리자 JWT/RLS, 서버/DB 허용 기준 동기화·회수, Secret key CRUD 제거, 테스트→운영 migration 검증 |
| T42 | 운영 과정/신청 모델·migration, 실제 비회원 API, 동의·보유/삭제·처리 상태, 남용 방지·idempotency, 실제 접수 공개 조건 |
| T12·T18·T20~T24 | 상세 자료·공식 이미지/로고/도메인, 전체 폭·키보드·확대·reduced-motion·Lighthouse, 실제 외부 CTA·배포·운영 인계 |

기존 Production 배포 ID·Supabase 현황과 과거 Playwright 기록은 재확인한 결과와 구분해 유지했다. 최초 T43 점검은 로컬 코드·HTTP 검증이고, 이후 위 사용자 요청의 Production 배포를 추가로 완료했다. 운영 DB migration·실제 접수 활성화의 완료를 의미하지 않는다.

## 운영 관리자 계정 미등록 후속 조치 — 2026-10-04

운영 비밀번호 재설정 메일 미수신 보고 후 Production Auth Users의 실제 목록이 비어 있음을 확인했다. 서버 이메일 허용 목록 등록은 Auth 사용자 생성을 대신하지 않으며, 앞선 14개 HTTP 확인도 실제 계정 존재나 메일 수신을 검증하지 않았다. FE-T40의 초대 완료 문구를 정정했다.

사용자가 운영 계정 초대와 메일 발송을 승인한 뒤 Dashboard에서 승인된 첫 관리자 이메일의 초대를 제출했다. 요청이 정상 처리되어 계정이 생성됐으며 `Waiting for verification` 상태를 확인했다. 실제 받은편지함 수신과 초기 비밀번호 설정·로그인은 사용자가 확인해야 하므로 완료 처리하지 않았다. 비밀번호를 대신 만들거나 입력하지 않았다. 운영 프로젝트는 custom SMTP가 꺼진 기본 메일 서비스를 사용한다.

Dashboard 초대의 기본 반환 URL은 Site URL인 홈페이지다. 홈페이지에 인증 fragment 처리 컴포넌트를 연결해 invite/recovery 토큰을 서버 세션으로 교환하도록 보완했다. 일반 섹션 앵커는 유지하며 최초 진입과 같은 페이지 hash 변경을 모두 처리한다. Node.js 24 lint·타입 검사와 Vercel Production 빌드를 통과했다. 최종 배포 `dpl_3V8qy1s6YbqdNYJMME6DUSM4VaTw`는 Ready이고 운영 도메인에 연결됐다. Chrome에서 운영 `/#hair` 유지와 만료 인증 fragment의 제거·로그인 오류 안내 이동을 확인했다. 실제 초대 링크는 사용자의 비밀번호 설정을 위해 소비하지 않았다.

## 추가 관리자 초대 — 2026-10-04

사용자 승인 후 `dslee1311@naver.com`, `jjcoin2@gmail.com`을 Vercel Production `ADMIN_EMAIL_ALLOWLIST`에 추가했다. 기존 1개 허용 주소를 보존했고, 최신 앱 코드와 환경 설정을 포함한 Production 배포 `dpl_diPb9vn85h4NmLJyzk6rQxn67ZKk`가 Ready로 `https://mayone-home.vercel.app`에 연결됐다. 초대 전 두 주소가 허용 목록과 Supabase Auth 사용자에 없음을 확인했다.

Supabase Dashboard에서 `dslee1311@naver.com` 초대는 200 응답과 발송 완료 알림을 받았다. `jjcoin2@gmail.com` 초대는 429 `email rate limit exceeded`로 거부돼 발송되지 않았다. 최근 다른 Auth 메일과 첫 초대가 발송 제한에 포함된 것으로 보인다. 제한이 풀린 뒤 두 번째 초대를 재시도해야 한다. 실제 메일 수신과 직접 비밀번호 설정은 아직 확인하지 않았다. Production 관리자 변경 API는 FE-T41 완료 전까지 차단된다.

## Production 관리자 허용 목록·콘텐츠 편집 후속 — 2026-10-04

운영 `/admin` 확인에서 `xodn1311@naver.com`은 Supabase Auth 사용자로 존재하고 인증 시도 로그도 있었지만, 관리자 경로가 `not-allowlisted`로 이동했다. 배포 앱은 당시 Vercel `ADMIN_EMAIL_ALLOWLIST` Secret만 권한 기준으로 사용해 운영 Auth 계정과 Vercel 설정이 어긋날 수 있었다. Secret 원문은 화면이나 로그에 출력하지 않았다. 허용 목록을 서버와 RLS가 공유하는 `mayone_admin_emails` 테이블로 통일하도록 코드를 준비했다.

운영 콘텐츠 편집 불가 원인은 코드에서 확인했다.

| 화면/API | 기존 동작 | 준비한 변경 |
| --- | --- | --- |
| `/admin/branches` | Production `readOnly` prop으로 추가·수정 버튼 비활성 | 추가·수정 허용, 삭제 버튼·API는 계속 차단 |
| `/admin/classes` | Production은 운영 과정 관리자 대신 “준비 중” 안내만 렌더 | `AcademyClass` 운영 카탈로그 조회 및 추가·수정 UI 연결 |
| 지점·과정 변경 API | 중앙 관리자 API 가드가 Production 쓰기를 모두 503으로 거절 | 관리자 Auth 세션 확인 후 사용자 JWT로 Supabase RLS를 통과 |
| 운영 공개 과정 | 공개 페이지가 정적 빈 `classes` 컬렉션만 사용 | Supabase 공개·검토 완료 과정을 디렉터리·상세·사이트맵에서 조회 |
| 신청자 / mock 변경 | API와 테이블은 잠금 상태 | 계속 잠금; 운영 접수 기능은 FE-T42 범위 |

새 migration은 허용 이메일 3개(`xodn1311@naver.com`, `dslee1311@naver.com`, `jjcoin2@gmail.com`)를 초기 목록에 넣고 branch/course 행의 관리자 SELECT·INSERT·UPDATE만 허용한다. `mayone_enrollments` 권한을 열지 않으며 branch/course 삭제 권한도 부여하지 않는다. 공개 페이지의 class JSON은 허용 필드만 projection한다.

현재 작업 트리에서 Node.js 24로 Production build, `npm run typecheck`, `npm run lint`, `git diff --check`가 통과했다. Production Supabase migration과 Production 배포는 아직 적용하지 않았다. 운영 권한·DB 변경 및 배포는 적용 직전 확인을 기다리며, migration 적용 후 허용/비허용 계정과 지점·과정 추가/수정을 확인해야 FE-T41을 완료할 수 있다.
