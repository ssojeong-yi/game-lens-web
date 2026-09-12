# Game Lens

일본 모바일 게임의 화면 위 텍스트를 자연스러운 한국어로 바꿔주는 콘셉트 프로젝트입니다.

## 구성

- `index.html` — **Game Lens 인터랙티브 프로토타입.** 가상의 일본어 방치형 게임 화면 위에 떠 있는 렌즈 아이콘을 드래그하고 탭해서, 화면 레이아웃을 유지한 채 일본어 ↔ 한국어를 전환해보는 클릭형 데모. 외부 의존성은 구글 폰트뿐이라 정적 호스팅에서 그대로 작동합니다.
- `translate.html` — **Game Lens Translate.** 실제 게임 스크린샷을 업로드하거나 텍스트를 직접 입력하면 자연스러운 한국어로 번역해주는 도구.
- `api/translate.js` — `translate.html`이 호출하는 Vercel 서버리스 함수. 서버에 저장된 Anthropic API 키로 Claude API를 대신 호출해서, API 키가 브라우저에 노출되지 않게 해줍니다.

## Vercel 배포 방법

**CLI로 배포**
```bash
npm i -g vercel
vercel login
vercel        # 프리뷰 배포
vercel --prod # 프로덕션 배포
```

**GitHub 연동으로 배포**
1. 이 폴더를 GitHub 저장소로 push (또는 GitHub 웹사이트에서 파일 업로드)
2. [vercel.com/new](https://vercel.com/new)에서 그 저장소를 Import
3. 별다른 설정 없이 그대로 Deploy

배포되면 `/`가 `index.html`(프로토타입), `/translate`가 `translate.html`(번역 도구)입니다.

## translate.html이 실제로 동작하게 하려면: Anthropic API 키 설정

`translate.html`은 `/api/translate` 서버리스 함수를 통해 Claude를 호출합니다. 이 함수가 동작하려면 **본인의 Anthropic API 키**를 Vercel 프로젝트에 등록해야 합니다.

1. [console.anthropic.com](https://console.anthropic.com)에서 로그인 → **API Keys** → **Create Key**로 키 발급
   - 사용한 만큼 비용이 청구되는 종량제입니다 (이미지 1장 분석에 보통 1센트 내외). 걱정되면 콘솔의 **Limits**에서 월별 사용 한도를 걸어두세요.
2. Vercel 대시보드 → 이 프로젝트 → **Settings** → **Environment Variables**
3. Key: `ANTHROPIC_API_KEY`, Value: 방금 발급받은 키 → **Save**
4. **Deployments** 탭 → 가장 최근 배포 옆 **⋯** 메뉴 → **Redeploy** (환경 변수는 새로 배포해야 적용됩니다)

이후 `/translate`에서 스크린샷을 올리거나 텍스트를 입력하면 실제로 번역됩니다.

`index.html`(프로토타입)은 이런 설정이 전혀 필요 없이 지금 그대로 작동합니다.

## 참고

- 업로드된 이미지는 브라우저에서 가로/세로 최대 1400px, JPEG로 줄여서 전송됩니다.
- 번역 결과는 자동 인식이라 간혹 오역이나 위치가 어긋나는 경우가 있을 수 있습니다.
- API 키는 절대 `translate.html`이나 다른 프런트엔드 파일에 직접 적어 넣지 마세요 — 반드시 Vercel 환경 변수로만 등록하세요.
