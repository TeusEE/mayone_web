검수용 fixture는 이 디렉터리에 둡니다. 운영 교육 조회는 이 디렉터리의 샘플을 직접 사용하지 않습니다.

- `class-offers.csv`: 개발·Preview에서 수강 신청 흐름을 확인하는 가상 과정입니다.
- `development-academy-classes.json`: 2026-10-16 운영 사이트에 공개된 교육 17개 중 분야별 최대 3개를 샘플링한 개발 검수용 자료입니다. 커트 3개, 펌 3개, 디자인 상담 1개, 살롱 실무 3개이며 다회차 교육도 포함합니다. 원본 제목·소개·강사·일정·교육비를 보존하고, ID에는 `dev-sample-`을 붙이며 실제 외부 신청 URL은 제거했습니다.

`npm run supabase:seed-dev-classes`로 지정된 테스트 Supabase에 교육 샘플을 추가합니다. 기존 ID는 수정하지 않으므로 재실행해도 개발 중 변경한 값을 보존합니다. 이 명령은 `SUPABASE_DATA_TARGET=test`와 개발 프로젝트 주소를 모두 확인하며 Production에서는 실행되지 않습니다. 기존 mock 과정과 함께 저장되고 `/haru/classes` 및 각 교육 상세에서 확인할 수 있습니다.
