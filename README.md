# Game Lens

일본 모바일 게임의 화면 위 텍스트를 자연스러운 한국어로 바꿔주는 콘셉트 프로젝트입니다.

## 구성

- `index.html` — **Game Lens 인터랙티브 프로토타입.** 가상의 일본어 방치형 게임 화면 위에 떠 있는 렌즈 아이콘을 드래그하고 탭해서, 화면 레이아웃을 유지한 채 일본어 ↔ 한국어를 전환해보는 클릭형 데모. 순수 HTML/CSS/JS(구글 폰트 링크 하나만 외부 의존)라 정적 호스팅에서 100% 그대로 작동합니다.
- `translate.html` — **Game Lens Translate.** 실제 게임 스크린샷/텍스트를 자연스러운 한국어로 번역해주는 도구. **Claude Artifact 전용 기능(`window.claude` sample capability)에 의존**하고 있어, 아래 "중요: translate.html의 제약" 항목을 꼭 읽어주세요.

## Vercel 배포 방법

이 폴더는 별도 빌드 과정이 필요 없는 순수 정적 사이트라 Vercel이 설정 없이 그대로 인식합니다.

**CLI로 배포**
```bash
npm i -g vercel
vercel login
vercel        # 프리뷰 배포
vercel --prod # 프로덕션 배포
```

**GitHub 연동으로 배포**
1. 이 폴더를 GitHub 저장소로 push
2. [vercel.com/new](https://vercel.com/new)에서 그 저장소를 Import
3. Framework Preset은 "Other"(정적 사이트)로 두고 그대로 Deploy

배포되면 `/`가 `index.html`(프로토타입), `/translate`가 `translate.html`(번역 도구)입니다.

## 중요: translate.html의 제약

`translate.html`은 Claude Artifact 환경에서만 존재하는 `window.claude.use('sample')` 기능으로 Claude를 호출해 번역합니다. 이건 Claude.ai/Claude 앱이 아티팩트를 iframe으로 감싸서 보여줄 때만 주입되는 전역 객체라서, **Vercel에 올려서 독립된 URL로 열면 `window.claude` 자체가 없어 번역 기능이 전혀 동작하지 않습니다.** (화면에는 "Claude 기능을 사용할 수 없어요" 안내만 계속 보이게 됩니다.)

Vercel에서도 실제로 번역이 동작하게 하려면 별도 백엔드가 필요합니다. 예를 들면:

- Vercel Serverless Function(`/api/translate`)을 만들어 사용자 본인의 Anthropic API 키로 Claude API를 직접 호출
- 프런트엔드(`translate.html`)에서 `window.claude.use('sample')` 대신 그 API 라우트로 fetch

이 구조로 바꿔서 실제로 동작하게 만들고 싶으시면 말씀해주세요 — Anthropic API 키 발급(및 사용량에 따른 비용)이 필요합니다.

`index.html`(프로토타입)은 이런 의존성이 전혀 없어서 Vercel에서도 지금 그대로 완전히 동일하게 작동합니다.
