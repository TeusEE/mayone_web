# 검색 노출 설정

- 대표 주소: `https://mayone-home.vercel.app`
- 적용 대상: Vercel Production의 공개 콘텐츠
- 네이버 서치어드바이저 계정 등록·소유확인·사이트맵 제출은 사용자 요청으로 추후 진행한다.

## Vercel 설정

Production 환경변수에 다음 값을 설정하고 재배포한다.

```env
NEXT_PUBLIC_SITE_URL=https://mayone-home.vercel.app
```

이 값과 `VERCEL_ENV=production`이 모두 유효할 때 공개 페이지의 `index, follow`, canonical과 사이트맵을 생성한다. 값이 없거나 올바른 HTTPS origin이 아니면 검색을 차단한다. Development·Preview는 대표 주소가 있더라도 검색을 차단한다.

`robots.txt`는 공개 경로의 수집을 허용하고 `/admin`, `/api/`, `/auth/`, `/haru/apply`, `/haru/classes/preview`를 제외한다. 관리자·준비 화면의 noindex, 관리자 인증, API 접근 제어는 별도로 유지한다. robots.txt는 인증 수단이 아니다.

사이트맵은 공개가 확인된 메인·소개·지점 목록·교육 목록과 교육 상세를 포함하며, 비공개·개발 샘플·관리자 경로는 포함하지 않는다.

## 추후 네이버 등록

1. [서치어드바이저](https://searchadvisor.naver.com/)에 대표 주소를 등록한다.
2. HTML 태그 방식으로 소유확인할 경우 발급 태그의 `content` 값만 Vercel Production의 `NAVER_SITE_VERIFICATION`에 설정하고 재배포한다. 전체 HTML 태그를 값으로 넣지 않는다.
3. 메인 HTML의 `<meta name="naver-site-verification" content="발급값">`를 확인한 뒤 소유확인을 완료한다. 값이 없으면 태그를 생성하지 않으며 Development·Preview에는 출력하지 않는다.
4. `요청 → 사이트맵 제출`에서 `https://mayone-home.vercel.app/sitemap.xml`을 제출한다.
5. 주요 페이지 수집을 요청하고 수집·색인 상태를 확인한다. 등록 및 수집 성공은 실제 검색 노출·순위를 보장하지 않는다.

별도 대표 도메인으로 이전할 때는 Vercel 도메인 연결, 기존 주소의 영구 리다이렉트, `NEXT_PUBLIC_SITE_URL`, 네이버의 새 사이트 소유확인·사이트맵을 함께 갱신한다.

## 배포 후 확인

- `/robots.txt`: HTTP 200, 공개 경로 허용, 사이트맵 주소 포함.
- `/sitemap.xml`: HTTP 200, 대표 주소의 공개 URL 포함, 개발 샘플·관리자 제외.
- 메인·지점·교육 목록 및 공개 교육 상세: HTTP 200, `index, follow`, 자기 페이지의 canonical.
- `/admin/login`: `noindex, nofollow`.
- `/haru/apply`: 자체 신청 준비 안내와 `noindex` 유지.
- 개발 전용 목록·샘플 상세: Production에서 404.

공식 참고: [네이버 검색 최적화](https://searchadvisor.naver.com/guide/seo-basic-intro), [robots.txt](https://searchadvisor.naver.com/guide/seo-basic-robots), [사이트맵 제출](https://searchadvisor.naver.com/guide/request-feed).
