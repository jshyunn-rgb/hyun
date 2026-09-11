import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback high-quality expert questions if Gemini is unavailable
const SENSOR_FALLBACK_QUESTIONS: Record<string, string[]> = {
  '압력센서': [
    '1. 현재 어떤 설비나 공정 라인에서 사용할 압력센서를 검토 중이신가요?',
    '2. 측정하시려는 유체(가스/액체)와 필요한 압력 범위 및 출력 신호(4-20mA, 0-10V 등)는 어떻게 되시나요?',
    '3. 현재 현장에서 사용 중이신 기존 센서 모델명이나 제조사는 어디 제품인가요?',
    '4. 기존 센서 사용 시 잦은 고장이나 내구성, 나사 규격 호환 등 개선하고 싶으신 문제점이 있으신가요?',
    '5. 이번 건 교체 또는 신규 장비 적용을 위해 예상하시는 구매 시기와 필요 수량은 어느 정도인가요?',
  ],
  '차압센서': [
    '1. 클린룸 차압 모니터링, 필터 막힘 감지, 또는 배관 유량 측정 중 어떤 용도로 적용하시나요?',
    '2. 측정해야 할 차압 범위(Pa/kPa)와 배관의 최대 정압(Line Pressure) 조건은 어떻게 되시나요?',
    '3. 현재 현장에 설치되어 있는 차압센서나 차압 전송기 제조사는 어디인가요?',
    '4. 기존 제품 사용 시 영점 드리프트(Zero Drift)나 결로, 배관 접속부에서 겪으신 애로사항이 있으신가요?',
    '5. 해당 라인 정기 보수나 신규 설치 일정에 맞춰 필요하신 납기 및 발주 예상 수량은 어떻게 되시나요?',
  ],
  '디지털 압력계': [
    '1. 현장 배관에 직접 설치하여 작업자가 상시 확인하는 용도인가요, 아니면 테스트 벤치 검사용인가요?',
    '2. 필요하신 측정 압력 범위와 요구 정확도(예: 0.25% F.S 등), 배터리 구동 여부는 어떻게 되시나요?',
    '3. 기존에는 아날로그 압력계를 쓰셨나요, 아니면 타사 디지털 게이지를 사용 중이신가요?',
    '4. 기존 게이지의 시인성 부족이나 진동에 의한 지침 떨림 등 어떤 점을 개선하고자 하시나요?',
    '5. 테스트용 샘플 1~2대 먼저 필요하신가요, 아니면 양산/전체 교체용 구매 견적 일정이 잡혀 있으신가요?',
  ],
  '진공센서': [
    '1. 반도체, 진공 건조로, 증착기 등 어떤 진공 챔버 및 설비에 적용 계획이신가요?',
    '2. 측정하셔야 할 진공도 영역(고진공/중진공/저진공)과 챔버 내부의 부식성 가스 유무는 어떠한가요?',
    '3. 현재 챔버에서 사용 중이신 진공 게이지(피라니, 펜닝 등) 모델명이나 제조사가 어떻게 되시나요?',
    '4. 기존 게이지의 센서 오염, 응답 지연이나 수명 문제로 겪고 계신 고충이 있으신가요?',
    '5. 설비 개조나 정기 셧다운 일정에 맞춘 구매 타임라인과 검토 중이신 초기 소요 수량은 얼마인가요?',
  ],
  '로드셀': [
    '1. 호퍼 스케일, 인장/압축 시험기, 컨베이어 계량 등 구체적으로 어떤 하중 측정 장비에 탑재되나요?',
    '2. 측정하려는 최대 하중 용량(kg/ton)과 방수/방진(IP등급) 및 외형 구조(빔형, 캔타입 등) 조건은 무엇인가요?',
    '3. 현재 설비에 장착되어 있는 기존 로드셀 제조사 및 인디케이터 기종은 무엇인가요?',
    '4. 현재 로드셀의 편심 하중 오차나 영점 흔들림, 가혹한 환경으로 인한 파손 문제가 있으신가요?',
    '5. 신규 라인 셋업이나 긴급 교체를 위해 계획하고 계신 구매 일정과 필요 수량(세트)은 어떻게 되시나요?',
  ],
};

const SENSOR_SPEC_FACTORS: Record<string, string> = {
  '압력센서': '압력 범위, 출력 방식(4-20mA, 0-10V, RS485 등), 정확도, 접속 나사 규격(PT/NPT/G), 사용 환경(유체 온도, 부식성 등)',
  '차압센서': '차압 범위(Pa/bar), 정압(Line Pressure) 조건, 적용 공정, 출력 방식, 설치 조건',
  '디지털 압력계': '압력 범위, 정확도, 표시 방식(LCD 백라이트/단위 변환), 전원(배터리/외부전원), 설치 조건',
  '진공센서': '진공 범위(Torr/mbar/Pa), 적용 장비, 가스 환경, 현재 사용하는 게이지 타입, 출력 방식',
  '로드셀': '측정 하중(kg/ton), 정확도, 구조(S형, 싱글포인트, 캐니스터 등), 설치 조건, 출력 방식',
};

// API: Generate Questions
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { product } = req.body;
    const validProducts = ['압력센서', '차압센서', '디지털 압력계', '진공센서', '로드셀'];

    if (!product || !validProducts.includes(product)) {
      return res.status(400).json({
        error: '유효한 제품을 선택해주세요. (압력센서, 차압센서, 디지털 압력계, 진공센서, 로드셀)',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Returning pre-crafted industrial expert questions.');
      return res.json({
        success: true,
        questions: SENSOR_FALLBACK_QUESTIONS[product] || SENSOR_FALLBACK_QUESTIONS['압력센서'],
        source: 'fallback',
      });
    }

    const specFactor = SENSOR_SPEC_FACTORS[product] || '';

    const systemInstruction = `당신은 산업용 B2B 센서 전문 기술 영업 수석 엔지니어입니다.
전화상담 전 영업사원이 고객의 '실제 구매 가능성'과 '수요 긴급도'를 빠르고 정확하게 판단할 수 있도록,
통화 중 바로 읽을 수 있는 간결하고 정중한 존댓말 한국어 질문을 정확히 5개 생성해야 합니다.

[핵심 규칙]
1. 단순 제품 소개나 "안녕하세요" 같은 일반적인 인사말은 일체 포함하지 마세요.
2. 각 질문은 전화 통화 중 영업사원이 바로 입으로 읽을 수 있도록 자연스럽고 짧은 존댓말(~신가요?, ~되시나요?, ~인가요?)로 작성하세요.
3. 산업용 센서 전문 영업사원의 전문성을 갖추되, 현장 고객이 직관적으로 대답하기 쉽게 작성하세요.
4. 아래 5가지 목적을 순서대로 정확히 1개씩 질문에 반영해야 합니다:
   질문 1: [사용 목적 또는 적용 장비 확인]
   질문 2: [필요한 기술 사양 확인] - 참고 요소: ${specFactor}
   질문 3: [현재 사용 제품 또는 제조사 확인]
   질문 4: [현재 제품의 문제점 및 개선 요구 확인]
   질문 5: [구매 의향, 구매 시기 또는 예상 수량 확인]

반드시 번호가 매겨진 정확히 5개의 질문 텍스트 배열을 JSON으로 반환하세요.`;

    const prompt = `대상 제품: "${product}"
참고 기술 요소: ${specFactor}

위 5대 목적에 부합하는 전문 전화상담 질문 5개를 생성해주세요.
각 질문 앞에는 "1. ", "2. ", "3. ", "4. ", "5. " 번호를 붙여주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '정확히 5개의 번호가 매겨진 상담 질문',
            },
          },
          required: ['questions'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
    }

    const parsed = JSON.parse(responseText);
    let questions: string[] = parsed.questions || [];

    // Clean up question strings if needed
    questions = questions.map((q: string, idx: number) => {
      // Ensure it has 1., 2., etc.
      const cleaned = q.replace(/^\d+[\.\)]\s*/, '').trim();
      return `${idx + 1}. ${cleaned}`;
    }).slice(0, 5);

    if (questions.length < 5) {
      const fallback = SENSOR_FALLBACK_QUESTIONS[product] || SENSOR_FALLBACK_QUESTIONS['압력센서'];
      while (questions.length < 5) {
        questions.push(fallback[questions.length]);
      }
    }

    return res.json({
      success: true,
      questions,
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    // Fallback to domain questions on error
    const product = req.body?.product;
    const fallback = SENSOR_FALLBACK_QUESTIONS[product] || SENSOR_FALLBACK_QUESTIONS['압력센서'];
    return res.json({
      success: true,
      questions: fallback,
      source: 'fallback',
      warning: error?.message || 'Gemini API 호출 중 오류가 발생하여 기본 전문 질문 세트를 제공합니다.',
    });
  }
});

// API: Test Google Apps Script Web App URL
app.post('/api/test-gas-url', async (req, res) => {
  try {
    const { scriptUrl } = req.body;

    if (!scriptUrl || typeof scriptUrl !== 'string' || scriptUrl.trim() === '') {
      return res.status(400).json({
        error: 'URL을 입력해주세요.',
      });
    }

    const trimmedUrl = scriptUrl.trim();

    if (trimmedUrl.includes('docs.google.com/spreadsheets')) {
      return res.status(400).json({
        error: '입력하신 주소는 [Google 스프레드시트 주소]입니다. Google Sheet 상단 [확장 프로그램] → [Apps Script] → 우측 상단 [배포] → [새 배포]에서 발급된 [웹 앱 URL](https://script.google.com/macros/s/.../exec)을 입력해야 합니다.',
      });
    }

    if (!trimmedUrl.startsWith('https://script.google.com/')) {
      return res.status(400).json({
        error: '올바른 Google Apps Script 웹 앱 URL이 아닙니다. (https://script.google.com/macros/s/.../exec 형식)',
      });
    }

    // Try GET request to the Web App
    const response = await fetch(trimmedUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const responseText = await response.text();

    if (
      responseText.includes('accounts.google.com') ||
      responseText.includes('ServiceLogin') ||
      (responseText.includes('<html') && !responseText.includes('"status"'))
    ) {
      return res.status(400).json({
        error: 'Google 로그인 권한 오류: Apps Script 배포 시 [액세스 권한이 있는 사용자]를 반드시 [모든 사용자 (Anyone)]로 설정해야 로그인 창 없이 연동됩니다. 배포 설정을 수정해주세요.',
      });
    }

    return res.json({
      success: true,
      message: 'Google Apps Script Web App과 성공적으로 연결되었습니다!',
    });
  } catch (error: any) {
    console.error('Test GAS URL error:', error);
    return res.status(500).json({
      error: `연결 테스트 실패: ${error?.message || '네트워크 오류가 발생했습니다.'}`,
    });
  }
});

// API: Proxy Save to Google Apps Script Web App
// This avoids browser CORS restrictions with Google Apps Script Web Apps
app.post('/api/save-sheet', async (req, res) => {
  try {
    const { scriptUrl, product, questions, memo, date } = req.body;

    if (!scriptUrl || typeof scriptUrl !== 'string' || !scriptUrl.trim()) {
      return res.status(400).json({
        error: 'Google Apps Script Web App URL이 설정되지 않았습니다.',
      });
    }

    const trimmedUrl = scriptUrl.trim();

    if (trimmedUrl.includes('docs.google.com/spreadsheets')) {
      return res.status(400).json({
        error: '입력하신 주소는 [Google 스프레드시트 주소]입니다. 스프레드시트 내 [확장 프로그램] → [Apps Script] → [배포] → [새 배포]에서 발급받은 웹 앱 URL(https://script.google.com/.../exec)을 입력해주세요.',
      });
    }

    if (!trimmedUrl.startsWith('https://script.google.com/')) {
      return res.status(400).json({
        error: '올바른 Google Apps Script Web App URL이 아닙니다. (https://script.google.com/macros/s/.../exec 형식)',
      });
    }

    const payload = {
      product: product || '',
      questions: questions || '',
      memo: memo || '',
      date: date || new Date().toISOString().split('T')[0],
    };

    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await response.text();

    if (
      responseText.includes('accounts.google.com') ||
      responseText.includes('ServiceLogin') ||
      (responseText.includes('<html') && !responseText.includes('"status"'))
    ) {
      return res.status(400).json({
        error: 'Google 권한 오류: Apps Script 배포 시 [액세스 권한]이 "모든 사용자(Anyone)"로 설정되지 않아 Google 로그인 화면으로 튕깁니다. Apps Script 배포 설정에서 "모든 사용자"로 변경 후 다시 배포해주세요.',
      });
    }

    let resultJson: any = null;
    try {
      resultJson = JSON.parse(responseText);
    } catch {
      resultJson = { message: responseText };
    }

    if (resultJson && resultJson.status === 'error') {
      return res.status(400).json({
        error: `Google Apps Script 오류: ${resultJson.message || '스프레드시트 처리 실패'}`,
      });
    }

    return res.json({
      success: true,
      message: 'Google Sheet에 성공적으로 저장되었습니다.',
      details: resultJson,
    });
  } catch (error: any) {
    console.error('Error saving to Google Sheet via Apps Script:', error);
    return res.status(500).json({
      error: error?.message || 'Google Sheet 저장 중 네트워크 오류가 발생했습니다.',
    });
  }
});

// Explicit routes for Open Graph Images with CORS, correct mime types, and public cache
app.get(['/og-image.jpg', '/og-image.png'], (req, res) => {
  const isPng = req.path.endsWith('.png');
  const publicPath = path.join(process.cwd(), 'public', isPng ? 'og-image.png' : 'og-image.jpg');
  res.setHeader('Content-Type', isPng ? 'image/png' : 'image/jpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(publicPath);
});

// Helper to inject current request host into Open Graph meta tags
function injectOpenGraphTags(html: string, req: express.Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'ais-pre-nvlqz5v4av2dngu3wwhgm5-497417192682.asia-east1.run.app';
  const baseUrl = `${proto}://${host}`;

  return html
    .replace(/https:\/\/ais-pre-nvlqz5v4av2dngu3wwhgm5-497417192682\.asia-east1\.run\.app\/og-image\.jpg\?v=2/g, `${baseUrl}/og-image.jpg?v=2`)
    .replace(/https:\/\/ais-pre-nvlqz5v4av2dngu3wwhgm5-497417192682\.asia-east1\.run\.app\//g, `${baseUrl}/`);
}

// Start server with Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Handle bot / crawler requests in dev mode to ensure valid absolute OG tags
    app.use(async (req, res, next) => {
      const userAgent = req.headers['user-agent'] || '';
      const isCrawler = /kakaotalk-scrap|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot/i.test(userAgent);

      if (isCrawler && req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          const rawHtml = await vite.transformIndexHtml(req.url, await import('fs').then((fs) => fs.promises.readFile(indexPath, 'utf-8')));
          const injectedHtml = injectOpenGraphTags(rawHtml, req);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(injectedHtml);
        } catch (e) {
          console.error('Error serving crawler HTML in dev:', e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      const fs = await import('fs');
      const indexPath = path.join(distPath, 'index.html');
      try {
        const rawHtml = await fs.promises.readFile(indexPath, 'utf-8');
        const injectedHtml = injectOpenGraphTags(rawHtml, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(injectedHtml);
      } catch {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
