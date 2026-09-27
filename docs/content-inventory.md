# MAY.ONE 홈페이지 콘텐츠·자료 현황

기준일: 2026-09-27  
기준: `fe-prd.md` §3.3·§11, `origin_source/mayone_homepage.html`, `origin_source/webpage_contents.md`, `origin_source/KakaoTalk_Chat_2026-09-27-18-51-45.txt`, [메이원헤어 소개.pdf](../origin_source/%EB%A9%94%EC%9D%B4%EC%9B%90%ED%97%A4%EC%96%B4%20%EC%86%8C%EA%B0%9C.pdf)

`origin_source/mayone_homepage.html`은 메인·공통 헤더·푸터의 카피와 디자인 기준입니다. `webpage_contents.md`, PDF, 대화 기록은 지점·교육·채용·협력 등 개별 운영자료의 검토 후보로만 사용합니다. 원본 HTML과 다른 추가 랜딩 카피나 구역을 만들지 않습니다.

이 문서는 원고 후보와 공개 가능한 운영 자료를 구분합니다. `draft`는 내부 구현 자료이며 공개 콘텐츠가 아닙니다. 목록의 `pending`은 운영 담당자가 최신 정보와 공개 범위를 확인하지 않았다는 뜻입니다.

## 원본 HTML 랜딩 매핑

| 순서 | 메인 구역 | 원본 구성 | 현재 구현·공개 상태 |
| --- | --- | --- | --- |
| 1 | 히어로 `#top` | 브랜드 약속, 설명, 살롱·HARU·마켓 CTA | 카피 반영. 브랜드 원고는 `draft`; 개발 검수에만 노출 |
| 2 | `ONE BRAND. ONE SYSTEM.` `#brand-story` | SALON → SYSTEM → EDUCATION → ACADEMY → BUSINESS | 원본 흐름으로 반영 |
| 3 | MAY.ONE HAIR `#hair` | BEAUTY BEYOND STYLE, 소개 카피, 지점·채용 이동 | 카피와 CSS visual 반영. 실제 살롱 사진·운영 정보는 미확보 |
| 4 | MAY.ONE SYSTEM `#system` | EDUCATION·CONSULTING·MARKETING·MANAGEMENT·GROWTH | 원본의 다섯 항목으로 반영 |
| 5 | HARU `#haru` | Learn. Grow. Lead., 교육 소개·원칙 네 가지·분야 다섯 가지 | 소개 반영. 실제 개설 강의·신청 링크는 별도 공개 검증 |
| 6 | MAY.ONE MARKET `#market` | 마켓 소개·스토어·대표 상품 CTA | 원본 URL 목적지 미검증. 공개 공통 링크가 없으면 CTA 비활성 |
| 7 | RECRUIT `#recruit` | 소개와 INTERN → DESIGNER → DIRECTOR → PARTNER | 카피 반영. 실제 공고와 입사 지원은 pending |
| 8 | EVERYTHING IS CONNECTED. `#about` | HARU ACADEMY·MAY.ONE HAIR·MAY.ONE MARKET 3개 카드 | 원본 카드 3개 반영 |
| 9 | 마지막 CTA `#next-step`와 푸터 | Learn. Grow. Lead. 및 SALON · EDUCATION · MARKET | 원본 CTA·푸터 카피 반영 |

원본 HTML의 대표 사진이나 공식 로고는 포함되어 있지 않습니다. MAY.ONE HAIR와 MARKET의 대체 visual은 CSS 그래픽이며, 공개 브랜드 원고는 담당자의 승인 전까지 Production에 노출되지 않습니다.

## 자료별 확보·공개 상태

| 자료 | 원자료에서 찾은 값 | 현재 상태 | 필요한 확인 / 영향 |
| --- | --- | --- | --- |
| 공식 로고·대표 이미지·공유 이미지·favicon | HTML의 `MO`는 임시 그래픽 | 미확보 | 원본 로고, 살롱·교육 이미지와 사용 권한 필요. 공식 에셋이 없어 이미지 공개, OG 이미지, favicon 검수와 Lighthouse 측정 대기 |
| 12개 지점 후보 | 콘텐츠 원고 §4.6에 이름 12개 | 이름만 있음, pending | 공식명·영업 여부·지역·주소·시간·연락처·사진·예약 URL 확인. `천안아산/아산`, `왕십리·행당/행당` 명칭 관계 확인 |
| 강사·디자이너 후보 | PDF와 원고에 “현직 원장·디자이너·전문 강사진” 등 일반 설명 | 개인 프로필 미확보 | 이름·직책·전문 분야·소개·사진·게시 동의 필요. 현재 이름을 추정하지 않음 |
| 연혁 후보 | PDF의 2022–2026 개점 기록 | 검토 필요 | 현재 지점명·개점일·동일 지점 관계·HARU 설립과 산학협력 시점 확인. 성장 단계 설명은 날짜 없이 가능 |
| HARU 주소·SNS | 2026년 8월 PDF: 서울 강남구 신사동 662-15 4F, `@haru_hair_academy`; 원고 내 `@may.one_hair` 표기 | 과거 소개자료 후보, 최신 확인 필요 | 현재 운영 주소·공식 계정 URL·공개할 연락 채널 확인 전 페이지·푸터에 링크하지 않음 |
| 실제 교육 | 개설 강의·대상·강사·일정·장소·수강료 자료 없음 | 미확보, pending | 목록 상태는 `지점 정보를 준비 중`과 구분되는 교육 준비 안내. 신청 버튼 비활성 |
| 채용 | 실제 공고·조건·마감·지원 URL 없음 | 미확보, pending | 상시 모집으로 가정하지 않음. 채용 목록은 준비 안내 |
| 산학협력 기관·문의 | 소개자료에 정화예술대학교 표기 후보, 문의 채널 없음 | 검토 필요 | 협력 관계·담당 채널·사례·기관 로고 공개 승인 필요 |
| 시장·대표 상품 링크 | `https://naver.me/GArimveD`, `https://naver.me/FM9zFgIA` | 원자료 URL, 목적지 미검증 | 최종 목적지·상품명·현재 판매 상태를 확인한 뒤 각각 활성화 |
| 운영·정책 정보 | 사업자·대표 연락처·개인정보처리방침·약관·권리자 없음 | 미확보 | 임의 연락처·정책·저작권 문구를 만들지 않음 |
| 도메인·배포 | 공식 도메인·Git 원격·Vercel 프로젝트 미정 | 미확정 | Preview와 Production URL·canonical·공유 주소 확정 필요. `NEXT_PUBLIC_SITE_URL`은 공식 HTTPS origin을 받은 뒤 설정 |

자료 담당 역할은 `fe-task.md` §8에 기록합니다. 운영팀 확인 전까지 앱 콘텐츠 데이터의 `sourceState`는 `pending`, 원고·후보 레코드는 `publicationState: draft`, `reviewState: pending`으로 둡니다. 공개 조회는 두 상태가 모두 확정된 레코드만 반환합니다.

## D단계 기존 검증 기록

2026-09-27 원본 HTML 정렬 작업 전 상태 규칙 자동 테스트, Production build와 로컬 release 서버를 확인했습니다. 해당 당시 Production에는 후보 지점명·미승인 브랜드 문구가 없었고, 공개 데이터가 없어 사이트맵은 비어 있었으며 미공개 상세 URL은 404였습니다. 아래 시각 개편 이전의 반응형 확인 결과는 새 화면의 QA로 간주하지 않습니다.

## 원본 HTML 정렬 후 검사

2026-09-27 기준 `npm run lint`, `npm run typecheck`, `npm run content:validate`, `npm run content:test`, `npm run build`가 모두 통과했습니다. 요청에 따라 개발 서버를 중지한 상태로 유지했으며, 3000번 포트에 수신 중인 서버가 없는 것을 확인했습니다. 따라서 새 헤더·랜딩·푸터의 브라우저별 시각 확인, 모바일 메뉴 동작 재검수와 직접 URL 점검은 아직 수행하지 않았고 [fe-task.md](./fe-task.md)의 FE-T20~FE-T21에 남겼습니다. 공식 사진·로고·도메인·운영 데이터가 필요한 이미지·Lighthouse·canonical 공개 검수도 자료 확보 후 진행합니다.
