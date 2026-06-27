# 우리반 학습 포털

`prd.md`와 `design.md` 내용을 바탕으로 만든 Vercel 배포용 학습 웹앱 포털입니다.

## 구현된 기능

- 전체 / 수업 / 학습 / 놀이 / 학급운영 카테고리
- `#태그` 자동 생성 및 태그별 필터링
- 앱 제목, 설명, 태그 검색
- 앱 런처형 카드 UI
- 썸네일 이미지 업로드 및 미리보기
- 관리자 코드 입력 후 웹앱 추가
- 공개 앱만 학생 화면에 표시
- 앱 삭제
- JSON 내보내기 / 가져오기
- 모바일, 태블릿, 데스크톱 반응형 UI
- Vercel Serverless Function 기반 관리자 코드 확인
- Firebase Admin SDK 환경변수 연결 시 Firestore 저장
- Firebase 미연결 시 localStorage 저장

## 파일 구조

```text
portal-webapp/
├─ index.html
├─ styles.css
├─ app.js
├─ package.json
├─ vercel.json
├─ .env.example
├─ api/
│  ├─ _firebaseAdmin.js
│  ├─ apps.js
│  └─ verify-admin.js
└─ docs/
   ├─ prd.md
   └─ design.md
```

## Vercel 배포 방법

1. 이 폴더 전체를 GitHub 저장소에 올립니다.
2. Vercel에서 `New Project`를 눌러 해당 GitHub 저장소를 가져옵니다.
3. Vercel 프로젝트의 `Settings > Environment Variables`에서 아래 값을 추가합니다.

```text
ADMIN_CODE=원하는관리자코드
```

4. 우선 이것만 넣어도 관리자 코드 확인은 됩니다.
5. 다만 Firebase 환경변수를 넣지 않으면 새로 추가한 앱은 `localStorage`에 저장됩니다.

## 중요한 저장 방식 안내

### 1. Firebase 환경변수 없음

- 앱 목록은 브라우저 `localStorage`에 저장됩니다.
- 이 경우 선생님 컴퓨터에서 앱을 추가해도 학생 컴퓨터에는 보이지 않습니다.
- 테스트용 또는 개인용으로만 적합합니다.

### 2. Firebase 환경변수 있음

- 앱 목록은 Firestore의 `portalApps` 컬렉션에 저장됩니다.
- 선생님이 앱을 추가하면 학생 기기에서도 같은 목록을 볼 수 있습니다.
- 실제 학급 운영용으로는 이 방식을 권장합니다.

## Firebase 연결용 환경변수

Vercel에 다음 환경변수를 추가하면 클라우드 저장 모드로 작동합니다.

```text
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

Firebase 서비스 계정 키에서 `project_id`, `client_email`, `private_key` 값을 가져와 입력합니다.

주의: `FIREBASE_PRIVATE_KEY`는 줄바꿈을 `\n` 형태로 넣어야 합니다.

## 관리자 코드

관리자 코드는 프론트엔드 코드에 직접 들어 있지 않습니다. Vercel 서버리스 함수 `/api/verify-admin`에서 `ADMIN_CODE` 환경변수와 비교합니다.

## 앱 추가 방법

1. 포털 오른쪽 위의 `관리자` 버튼을 누릅니다.
2. 관리자 코드를 입력합니다.
3. 새 웹앱 정보를 입력합니다.
   - 앱 제목
   - 앱 링크
   - 카테고리
   - 태그
   - 썸네일 이미지
   - 간단 설명
   - 공개 여부
4. `저장하기`를 누릅니다.

## 태그 입력 규칙

다음과 같이 입력할 수 있습니다.

```text
독서, 퀴즈, 문해력
```

또는

```text
#독서 #퀴즈 #문해력
```

화면에는 자동으로 `#독서`, `#퀴즈`, `#문해력` 형태로 표시됩니다.

## 카테고리 기준

- 전체: 모든 공개 앱 보기용 필터
- 수업: 수업 시간에 교사가 안내하여 함께 쓰는 앱
- 학습: 학생이 개념을 익히거나 복습하는 앱
- 놀이: 게임, 빙고, 워드서치 등 놀이형 앱
- 학급운영: 투표, 학급회의, 역할, 생활지도 등 학급 운영 앱

## 썸네일 안내

- 권장 비율: 16:9
- 권장 크기: 1280 x 720px
- 지원 형식: jpg, jpeg, png, webp
- 너무 큰 이미지는 브라우저에서 자동으로 webp 형식으로 축소 저장합니다.

## 로컬 실행

정적 화면만 확인하려면 `index.html`을 브라우저로 열 수 있습니다. 다만 이 방식에서는 Vercel API가 없으므로 관리자 인증이 되지 않습니다.

관리자 기능까지 로컬에서 확인하려면 Vercel CLI를 사용합니다.

```bash
vercel dev
```

그 전에 `.env.example`을 참고해 Vercel 환경변수 또는 로컬 환경변수를 설정해야 합니다.

## 다음 개선 후보

- 앱 수정 기능
- 공개/비공개 전환 버튼
- 태그 더보기/접기
- 앱 수동 정렬
- Firebase Storage 기반 썸네일 저장
- 교사용 대시보드
- 학생별 사용 기록
