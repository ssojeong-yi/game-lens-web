// Vercel serverless function: proxies a translation request to the
// Anthropic API using a server-side API key, so the key never reaches
// the browser. Configure ANTHROPIC_API_KEY in the Vercel project's
// Environment Variables before this will work.

const IMAGE_PROMPT = [
  '다음은 사용자가 플레이 중인 일본 모바일 게임의 스크린샷입니다.',
  '이미지 안에서 사람이 읽는 일본어 텍스트(메뉴, 버튼, 아이템 이름, 설명, 대사, 알림, 상태 표시 등)를 찾아주세요.',
  '사전적인 직역이 아니라, 그 게임 UI 맥락에서 실제 한국 유저가 플레이하며 바로 이해할 수 있는 자연스러운 UX 라이팅으로 한국어 번역을 만들어주세요.',
  '순수 로고나 그림으로만 된 제목, 숫자만 있는 값은 제외하세요.',
  '',
  '오직 아래 형식의 JSON 배열만 답하세요. 다른 설명 문장은 절대 포함하지 마세요. 최대 14개 항목까지만 포함하세요.',
  '',
  '[',
  '  {',
  '    "ja": "원본 일본어 텍스트",',
  '    "ko": "자연스러운 한국어 번역",',
  '    "x": 이미지 왼쪽 기준 텍스트 블록 좌측 끝의 가로 위치 (0-100 사이 백분율 숫자),',
  '    "y": 이미지 위쪽 기준 텍스트 블록 상단의 세로 위치 (0-100 사이 백분율 숫자),',
  '    "w": 텍스트 블록의 가로 폭 (0-100 사이 백분율 숫자),',
  '    "h": 텍스트 블록의 세로 높이 (0-100 사이 백분율 숫자),',
  '    "bg": "텍스트 바로 뒤 배경색과 가장 가까운 hex 색상 코드",',
  '    "color": "원본 텍스트 색상과 가장 가까운 hex 색상 코드",',
  '    "style": "handwritten 또는 ui 중 하나 (손글씨/캐주얼 느낌이면 handwritten, 딱딱한 버튼·라벨이면 ui)"',
  '  }',
  ']'
].join('\n');

function buildTextPrompt(lines) {
  return [
    '다음은 사용자가 플레이 중인 일본 모바일 게임 화면에서 그대로 옮겨 적은 일본어 텍스트 줄입니다.',
    '각 줄을 게임 UI/UX 맥락에 맞는 자연스러운 한국어로 번역해주세요.',
    '사전적인 직역이 아니라, 그 게임을 플레이하며 바로 이해할 수 있는 자연스러운 표현을 사용하세요.',
    '',
    '오직 아래 형식의 JSON 배열만 답하세요. 다른 설명 문장은 절대 포함하지 마세요.',
    '입력한 줄의 개수와 순서를 그대로 유지하세요.',
    '',
    '[{"ja":"원문 줄","ko":"자연스러운 한국어 번역"}, ...]',
    '',
    '입력:',
    lines.join('\n'),
  ].join('\n');
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // fall through
  }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (e) {
      // fall through
    }
  }
  let start = -1;
  let startChar = null;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[' || text[i] === '{') {
      start = i;
      startChar = text[i];
      break;
    }
  }
  if (start === -1) return undefined;
  const endChar = startChar === '[' ? ']' : '}';
  const end = text.lastIndexOf(endChar);
  if (end === -1 || end < start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return undefined;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed', message: 'POST 요청만 지원해요.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'missing_api_key',
      message: 'ANTHROPIC_API_KEY 환경 변수가 설정되지 않았어요. Vercel 프로젝트 설정에서 추가해 주세요.',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'invalid_body', message: '요청 본문을 읽을 수 없어요.' });
      return;
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid_body', message: '요청 본문이 비어 있어요.' });
    return;
  }

  let content;

  if (body.mode === 'image') {
    const { image, mediaType } = body;
    if (!image || typeof image !== 'string' || !mediaType || typeof mediaType !== 'string') {
      res.status(400).json({ error: 'invalid_body', message: '이미지 데이터가 없어요.' });
      return;
    }
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
      { type: 'text', text: IMAGE_PROMPT },
    ];
  } else if (body.mode === 'text') {
    const lines = Array.isArray(body.lines) ? body.lines.filter((l) => typeof l === 'string' && l.trim()) : [];
    if (!lines.length) {
      res.status(400).json({ error: 'invalid_body', message: '입력한 줄이 없어요.' });
      return;
    }
    content = buildTextPrompt(lines);
  } else {
    res.status(400).json({ error: 'invalid_body', message: 'mode는 image 또는 text여야 해요.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = (data && data.error && data.error.message) || '번역 요청이 실패했어요.';
      res.status(upstream.status).json({ error: 'anthropic_error', message });
      return;
    }

    const text = data && data.content && data.content[0] && data.content[0].text;
    if (!text) {
      res.status(502).json({ error: 'empty_completion', message: '분석 결과를 받지 못했어요.' });
      return;
    }

    const parsed = extractJson(text);
    if (parsed === undefined) {
      res.status(502).json({ error: 'invalid_json', message: '번역 결과를 정리하는 데 실패했어요.' });
      return;
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    res.status(502).json({ error: 'upstream_error', message: '번역 서버 요청 중 문제가 발생했어요.' });
  }
};
