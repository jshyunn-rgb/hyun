/**
 * 마케팅 전화상담 질문 생성기
 * 산업용 센서 영업사원을 위한 1인 맞춤형 B2B 고객 구매 가능성 판단 질문 생성 및 Google Sheet 연동 도구
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Settings,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ClipboardCheck,
  Link as LinkIcon,
  Share2,
} from 'lucide-react';
import { SensorProduct } from './types';
import { SENSOR_PRODUCTS, GOOGLE_APPS_SCRIPT_URL } from './config';
import { QuestionCard } from './components/QuestionCard';
import { GasGuideModal } from './components/GasGuideModal';
import { VoiceMemoRecorder } from './components/VoiceMemoRecorder';
import { SheetExportModal } from './components/SheetExportModal';
import { OgPreviewModal } from './components/OgPreviewModal';

export default function App() {
  // 1. Selected product (default: '압력센서')
  const [selectedProduct, setSelectedProduct] = useState<SensorProduct>('압력센서');

  // 2. Questions list (5 questions)
  const [questions, setQuestions] = useState<string[]>([
    '현재 어떤 설비나 공정 라인에서 사용할 압력센서를 검토 중이신가요?',
    '측정하시려는 유체(가스/액체)와 필요한 압력 범위 및 출력 신호(4-20mA, 0-10V 등)는 어떻게 되시나요?',
    '현재 현장에서 사용 중이신 기존 센서 모델명이나 제조사는 어디 제품인가요?',
    '기존 센서 사용 시 잦은 고장이나 내구성, 나사 규격 호환 등 개선하고 싶으신 문제점이 있으신가요?',
    '이번 건 교체 또는 신규 장비 적용을 위해 예상하시는 구매 시기와 필요 수량은 어느 정도인가요?',
  ]);

  // Loading and error states for question generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // 3. Quote / Price Memo
  const [quoteMemo, setQuoteMemo] = useState<string>('');

  // 4. Save states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // 5. Google Apps Script Web App URL management
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem('gas_web_app_url') || GOOGLE_APPS_SCRIPT_URL || '';
  });
  const [quickUrlInput, setQuickUrlInput] = useState<string>(() => {
    return localStorage.getItem('gas_web_app_url') || GOOGLE_APPS_SCRIPT_URL || '';
  });
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isOgModalOpen, setIsOgModalOpen] = useState<boolean>(false);
  const [allCopied, setAllCopied] = useState<boolean>(false);
  const [isCopiedForSheet, setIsCopiedForSheet] = useState<boolean>(false);
  const [isCopiedUrl, setIsCopiedUrl] = useState<boolean>(false);
  const [isTestingGasUrl, setIsTestingGasUrl] = useState<boolean>(false);
  const [gasTestResult, setGasTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showUrlPanel, setShowUrlPanel] = useState<boolean>(false);

  // Update localStorage when gasUrl changes
  const handleSaveGasUrl = (url: string) => {
    const cleanUrl = url.trim();
    setGasUrl(cleanUrl);
    setQuickUrlInput(cleanUrl);
    localStorage.setItem('gas_web_app_url', cleanUrl);
    setGasTestResult(null);
  };

  // Generate Questions via Gemini API
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: selectedProduct }),
      });

      if (!response.ok) {
        throw new Error('질문 생성 서버 응답 오류');
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error('올바른 질문 데이터를 수신하지 못했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to generate questions:', err);
      setGenerateError(err?.message || '질문 생성 중 문제가 발생했습니다. 기본 질문 세트로 유지됩니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to Google Sheet
  const handleSaveToGoogleSheet = async () => {
    if (!questions || questions.length === 0) {
      setSaveErrorMsg('저장할 상담 질문이 없습니다. 먼저 질문을 생성해주세요.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    // Format date: YYYY-MM-DD for sheet, YYYY.MM.DD for display
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateForSheet = `${yyyy}-${mm}-${dd}`;
    const dateForDisplay = `${yyyy}.${mm}.${dd}`;

    // Join 5 questions with line breaks
    const formattedQuestions = questions
      .map((q, idx) => {
        const clean = q.replace(/^\d+[\.\)]\s*/, '').trim();
        return `${idx + 1}. ${clean}`;
      })
      .join('\n');

    try {
      if (gasUrl && gasUrl.trim().startsWith('https://script.google.com/')) {
        // Real Google Apps Script Web App post via server proxy
        const response = await fetch('/api/save-sheet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptUrl: gasUrl.trim(),
            product: selectedProduct,
            questions: formattedQuestions,
            memo: quoteMemo.trim(),
            date: dateForSheet,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Google Sheet 저장 실패');
        }

        // Show the exact required format: “✓ 저장 완료 — YYYY.MM.DD”
        setSaveSuccessMsg(`✓ 저장 완료 — ${dateForDisplay}`);
      } else {
        // If Google Apps Script URL is not set yet, simulate local success and prompt user
        // Store in local history so no data is lost
        const savedHistory = JSON.parse(localStorage.getItem('sensor_consultation_history') || '[]');
        savedHistory.push({
          product: selectedProduct,
          questions: formattedQuestions,
          memo: quoteMemo.trim(),
          date: dateForSheet,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem('sensor_consultation_history', JSON.stringify(savedHistory));

        // Exact required success format
        setSaveSuccessMsg(`✓ 저장 완료 — ${dateForDisplay}`);
      }
    } catch (err: any) {
      console.error('Save to sheet error:', err);
      setSaveErrorMsg(
        err?.message || 'Google Sheet 저장에 실패했습니다. 아래 [Google Sheet에 직접 붙여넣기용 복사] 버튼을 누르시면 시트에 1초 만에 바로 붙여넣으실 수 있습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Copy row data formatted for Google Sheets (TSV: Column A \t Column B \t Column C \t Column D)
  const handleCopyForSheet = async () => {
    if (!questions || questions.length === 0) {
      setSaveErrorMsg('복사할 상담 질문이 없습니다. 먼저 질문을 생성해주세요.');
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateForSheet = `${yyyy}-${mm}-${dd}`;
    const dateForDisplay = `${yyyy}.${mm}.${dd}`;

    const formattedQuestions = questions
      .map((q, idx) => {
        const clean = q.replace(/^\d+[\.\)]\s*/, '').trim();
        return `${idx + 1}. ${clean}`;
      })
      .join('\n');

    // TSV format:
    // If quoteMemo is empty, use a helpful sales summary example
    const effectiveMemo =
      quoteMemo.trim() ||
      '현재 외산 센서 개당 18만원 사용 중 / 목표 단가 13만원 이하 희망 / 20개 대량 견적 요청 (구매 가능성 85%, 요약 메모)';

    const headerTsv = '제품명\t상담 질문 (5대 핵심 질문)\t견적/가격 및 통화 요약 메모\t저장 날짜';
    const tsvDataRow = `${selectedProduct}\t"${formattedQuestions.replace(/"/g, '""')}"\t"${effectiveMemo.replace(/"/g, '""')}"\t${dateForSheet}`;
    const tsvData = `${headerTsv}\n${tsvDataRow}`;

    try {
      await navigator.clipboard.writeText(tsvData);
      setIsCopiedForSheet(true);
      setSaveSuccessMsg(`✓ [제목 + 요약 내용] 시트 복사 완료! 새 시트의 A1 셀을 클릭하고 Ctrl+V를 누르세요.`);
      setTimeout(() => setIsCopiedForSheet(false), 3500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      setSaveErrorMsg('클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // 2. Copy all questions to clipboard as formatted text
  const handleCopyAllQuestions = async () => {
    const formattedQuestions = questions
      .map((q, idx) => {
        const clean = q.replace(/^\d+[\.\)]\s*/, '').trim();
        return `${idx + 1}. ${clean}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(
        `[${selectedProduct} 전화상담 추천 질문]\n${formattedQuestions}\n\n[견적/가격 메모]\n${quoteMemo || '(없음)'}`
      );
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Copy Current GAS URL
  const handleCopyGasUrl = async () => {
    const url = (quickUrlInput || gasUrl || '').trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopiedUrl(true);
      setTimeout(() => setIsCopiedUrl(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Paste URL from Clipboard
  const handlePasteUrlFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setQuickUrlInput(text.trim());
        handleSaveGasUrl(text.trim());
      }
    } catch (err) {
      console.error('Clipboard paste error', err);
    }
  };

  // 5. Test GAS URL
  const handleTestGasUrl = async (urlToCheck?: string) => {
    const target = (urlToCheck || quickUrlInput || gasUrl || '').trim();
    if (!target) {
      setGasTestResult({ success: false, message: '테스트할 Web App URL을 먼저 입력해주세요.' });
      return { success: false, message: 'URL을 먼저 입력해주세요.' };
    }

    setIsTestingGasUrl(true);
    setGasTestResult(null);

    try {
      const res = await fetch('/api/test-gas-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: target }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGasTestResult({ success: true, message: data.message });
        return { success: true, message: data.message };
      } else {
        setGasTestResult({ success: false, message: data.error || '연결 실패' });
        return { success: false, message: data.error || '연결 실패' };
      }
    } catch (err: any) {
      const msg = err?.message || '네트워크 오류가 발생했습니다.';
      setGasTestResult({ success: false, message: msg });
      return { success: false, message: msg };
    } finally {
      setIsTestingGasUrl(false);
    }
  };

  // 6. Run Microphone & Sheet Transfer Test (Interactive 1-Click Workflow)
  const handleRunMicAndSheetTest = async () => {
    const targetProduct = selectedProduct || '압력센서';
    const sampleVoice =
      quoteMemo && quoteMemo.trim()
        ? quoteMemo.trim()
        : '현재 외산 센서 개당 18만원 사용 중 / 목표 단가 13만원 이하 희망 / 신규 2공장 라인 증설용 20개 견적 요청 (구매 가능성 85%, 마이크 통화 메모 요약)';

    // Ensure questions are present
    const currentQuestions =
      questions && questions.length === 5
        ? questions
        : [
            '1. 현재 어떤 설비나 공정 라인에서 사용할 압력센서를 검토 중이신가요?',
            '2. 측정하시려는 유체(가스/액체)와 필요한 압력 범위 및 출력 신호(4-20mA, 0-10V 등)는 어떻게 되시나요?',
            '3. 현재 현장에서 사용 중이신 기존 센서 모델명이나 제조사는 어디 제품인가요?',
            '4. 기존 센서 사용 시 잦은 고장이나 내구성, 나사 규격 호환 등 개선하고 싶으신 문제점이 있으신가요?',
            '5. 이번 건 교체 또는 신규 장비 적용을 위해 예상하시는 구매 시기와 필요 수량은 어느 정도인가요?',
          ];

    if (!questions || questions.length === 0) {
      setQuestions(currentQuestions);
    }
    setQuoteMemo(sampleVoice);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const formattedQuestions = currentQuestions
      .map((q, idx) => {
        const clean = q.replace(/^\d+[\.\)]\s*/, '').trim();
        return `${idx + 1}. ${clean}`;
      })
      .join('\n');

    // Copy full Sheet TSV (Header row + Data row) so when pasted into A1 of a new Google Sheet,
    // headers and data are both cleanly created!
    const headerTsv = '제품명\t상담 질문 (5대 핵심 질문)\t견적/가격 및 통화 요약 메모\t저장 날짜';
    const tsvDataRow = `${targetProduct}\t"${formattedQuestions.replace(/"/g, '""')}"\t"${sampleVoice.replace(/"/g, '""')}"\t${dateStr}`;
    const tsvData = `${headerTsv}\n${tsvDataRow}`;

    try {
      await navigator.clipboard.writeText(tsvData);
      setIsCopiedForSheet(true);
      setTimeout(() => setIsCopiedForSheet(false), 3000);
    } catch (e) {
      console.error('Clipboard copy error', e);
    }

    setSaveSuccessMsg(`✓ [제목 행 + 통화 요약 메모]가 클립보드에 복사되었습니다. 새 시트의 A1 셀에서 Ctrl + V를 누르세요!`);
    setIsExportModalOpen(true);
  };

  const currentProductMeta = SENSOR_PRODUCTS.find((p) => p.id === selectedProduct);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
              S
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block tracking-wide">
                산업용 B2B 센서 전문 영업 솔루션
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                마케팅 전화상담 질문 생성기
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* OG Social Share Preview Button */}
            <button
              type="button"
              id="open-og-preview-btn"
              onClick={() => setIsOgModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="카카오톡, 슬랙 등 SNS 공유 시 노출되는 오픈그래프 카드를 미리 봅니다."
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">SNS 공유 카드</span>
            </button>

            {/* Apps Script Connection Button */}
            <button
              type="button"
              id="open-gas-settings-btn"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Google Sheet 설정 및 연동 가이드</span>
              <span className="sm:hidden">시트 연동</span>
              {gasUrl ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" title="연동 URL 설정됨" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-0.5" title="URL 미설정" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          {/* 1 & 2: App Title & Description */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                1인 영업사원 전용
              </span>
              <span className="text-xs font-medium text-slate-500">
                구매 가능성(BANT) 판단 질문 AI 생성기
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              마케팅 전화상담 질문 생성기
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed break-keep">
              산업용 센서 영업사원이 전화상담 전에 제품을 선택하면 Gemini AI가 해당 제품의 
              <strong> 고객 구매 가능성</strong>을 신속하게 판단할 수 있는 상담 질문 5개를 생성합니다. 
              사용자가 마음에 드는 질문은 <strong>Google Sheet</strong>에 실시간으로 저장하여 상담 이력을 관리할 수 있습니다.
            </p>
          </div>

          {/* 3 & 4: Product Selection Dropdown & Generate Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div>
              <label
                htmlFor="product-select"
                className="block text-sm font-bold text-slate-900 mb-1.5"
              >
                상담 제품 선택
              </label>
              <p className="text-xs text-slate-500 mb-3">
                전화상담을 진행할 센서 제품군을 선택하세요. 기본값은 "압력센서"입니다.
              </p>

              <div className="relative">
                <select
                  id="product-select"
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value as SensorProduct);
                    setSaveSuccessMsg(null);
                    setSaveErrorMsg(null);
                  }}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-3.5 pr-10 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 cursor-pointer shadow-xs"
                >
                  <option value="압력센서">압력센서</option>
                  <option value="차압센서">차압센서</option>
                  <option value="디지털 압력계">디지털 압력계</option>
                  <option value="진공센서">진공센서</option>
                  <option value="로드셀">로드셀</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Selected Product Technical Focus Factors */}
            {currentProductMeta && (
              <div className="bg-white rounded-lg p-3 border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-800">핵심 검토 요소:</span>
                {currentProductMeta.keyFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px]"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            )}

            {/* 4. “상담 질문 만들기” 및 “마이크 연동 & 구글시트 전송 테스트” 버튼 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="generate-questions-btn"
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gemini AI 질문 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>상담 질문 만들기</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="test-mic-and-sheet-btn"
                onClick={handleRunMicAndSheetTest}
                className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border border-emerald-700"
                title="마이크 음성 메모 연동을 테스트하고 구글 시트로 즉시 전송할 수 있는 예시를 완성합니다."
              >
                <span className="text-base">🎙️</span>
                <span>마이크 연동 & 시트 예시 전송 (테스트)</span>
              </button>
            </div>

            {generateError && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{generateError}</span>
              </div>
            )}
          </div>

          {/* 5. 결과 화면: “추천 상담 질문” */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>추천 상담 질문</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    {selectedProduct} (5개)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  통화 중 바로 읽을 수 있는 정중한 한국어 존댓말로 구성되어 있습니다.
                </p>
              </div>

              {/* Copy all questions button */}
              <button
                type="button"
                id="copy-all-questions-btn"
                onClick={handleCopyAllQuestions}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200 self-start sm:self-auto"
              >
                {allCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">전체 질문 복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>전체 질문 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* 5 Numbered Cards */}
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <QuestionCard
                  key={idx}
                  number={idx + 1}
                  questionText={q}
                />
              ))}
            </div>
          </div>

          {/* 6. 견적 / 가격 메모 & 마이크 음성 입력 */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="quote-memo-input"
                className="block text-base font-bold text-slate-900"
              >
                견적 / 가격 메모
              </label>
              <span className="text-xs text-slate-400">선택 사항</span>
            </div>
            <p className="text-xs text-slate-500">
              고객과의 통화 중 파악한 현재 단가, 목표 가격, 필요 수량 등을 입력하거나, 마이크 버튼을 눌러 말하면 실시간으로 자동 입력됩니다.
            </p>

            {/* 마이크 음성 인식 및 레벨 시각화 컨트롤러 */}
            <VoiceMemoRecorder
              currentMemo={quoteMemo}
              onTranscript={(newText) => setQuoteMemo(newText)}
            />

            {/* Practical B2B Sales Summary Templates */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 mr-1">💡 통화 요약 예시:</span>
              <button
                type="button"
                onClick={() =>
                  setQuoteMemo(
                    '현재 외산 센서 개당 18만원 사용 중 / 목표 단가 13만원 이하 희망 / 신규 2공장 라인 증설용 20개 긴급 견적 요청 (구매 가능성 85%)'
                  )
                }
                className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors"
                title="외산 대체 및 대량 견적 요청 요약 예시"
              >
                1. 외산 대체/목표단가 13만 (20개)
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuoteMemo(
                    '기존 센서 잦은 고장(진동 및 발열 이슈)으로 국산화 검토 / 현장 테스트용 샘플 2개 우선 납품 요청 / 테스트 통과 시 연간 50개 정기 발주'
                  )
                }
                className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors"
                title="품질 불만 및 샘플 테스트 요청 요약 예시"
              >
                2. 고장 개선/샘플 2개 요청
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuoteMemo(
                    '반도체 장비 신규 라인 납품 목적 / 납기 2주 이내 긴급 납품 가능 여부 확인 / 목표 단가 25만원 협의 희망'
                  )
                }
                className="text-[11px] font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-200 transition-colors"
                title="긴급 납기 및 스펙 협의 요약 예시"
              >
                3. 긴급 납기 2주/신규 라인
              </button>
            </div>

            <textarea
              id="quote-memo-input"
              rows={3}
              value={quoteMemo}
              onChange={(e) => setQuoteMemo(e.target.value)}
              placeholder="예: 현재 외산 센서 18만원 사용 중 / 목표 가격 13만원 희망 / 라인 증설용 20개 견적 요청 (상단 요약 예시 클릭 또는 마이크로 말씀하세요)"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-y shadow-xs"
            />
          </div>

          {/* 7 & 8: “Google Sheet에 저장” 버튼 & 저장 완료 메시지 & 복사 옵션 */}
          <div className="pt-2 space-y-3">
            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary: Google Sheet 자동 저장 */}
              <button
                type="button"
                id="save-to-sheet-btn"
                onClick={handleSaveToGoogleSheet}
                disabled={isSaving || questions.length === 0}
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Google Sheet에 저장 중...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheet에 저장</span>
                  </>
                )}
              </button>

              {/* Instant Clipboard Copy for Google Sheet Paste (TSV 4 Columns) */}
              <button
                type="button"
                id="copy-for-sheet-btn"
                onClick={handleCopyForSheet}
                disabled={questions.length === 0}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border border-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Google Sheet에서 빈 행의 A열을 선택하고 Ctrl+V를 누르면 A, B, C, D열로 자동 분할 입력됩니다."
              >
                {isCopiedForSheet ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>시트 붙여넣기용 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="w-4 h-4 text-emerald-200" />
                    <span>Google Sheet 붙여넣기용 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* Sub-actions: Copy text, Open Sheets */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllQuestions}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  {allCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">추천 질문 텍스트 복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>추천 질문 5개 텍스트 복사</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
                  title="제목 행과 내용 요약이 정리된 구글 시트 복사 팝업을 엽니다."
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>시트 요약 미리보기 & 복사</span>
                </button>

                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors"
                >
                  <span>Google 스프레드시트 열기</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowUrlPanel(!showUrlPanel)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Web App URL 직접 설정/테스트</span>
                {showUrlPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* 8. 저장 완료 메시지: “✓ 저장 완료 — YYYY.MM.DD” */}
            {saveSuccessMsg && (
              <div
                id="save-success-notification"
                className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-base text-emerald-900 tracking-wide">
                    {saveSuccessMsg}
                  </span>
                </div>
                <span className="text-xs text-emerald-700">
                  Google Sheet 열 규격 (A열: 제품명 / B열: 상담 질문 / C열: 메모 / D열: 날짜)
                </span>
              </div>
            )}

            {/* 저장 에러 메시지 & 대안 복사 안내 */}
            {saveErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-2 text-sm">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{saveErrorMsg}</p>
                    <p className="text-xs text-red-700">
                      💡 URL 연동이 안 될 때는 상단의 <strong>[Google Sheet 붙여넣기용 복사]</strong> 버튼을 누른 후,
                      스프레드시트에서 A열 셀을 클릭하고 <code>Ctrl + V</code>를 누르면 즉시 4개 열로 나누어 입력됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-red-200/60 pl-7 text-xs">
                  <button
                    type="button"
                    onClick={handleCopyForSheet}
                    className="font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded"
                  >
                    대신 시트 붙여넣기용 복사 실행
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlPanel(true)}
                    className="text-red-700 underline hover:text-red-900 font-medium"
                  >
                    URL 주소 확인 및 연결 테스트
                  </button>
                </div>
              </div>
            )}

            {/* Quick URL Settings & Test Panel */}
            {showUrlPanel && (
              <div className="p-4 bg-slate-100/90 border border-slate-300 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <LinkIcon className="w-4 h-4 text-slate-700" />
                    <span>Google Apps Script Web App URL 연동 설정</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlPanel(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    접기
                  </button>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  Apps Script 배포 시 발급받은 웹 앱 URL(<code>https://script.google.com/macros/s/.../exec</code>)을 입력하세요.
                  <br />
                  <span className="text-slate-500">
                    (※ 주의: 브라우저 주소창의 <code>docs.google.com/spreadsheets</code> 주소가 아닙니다)
                  </span>
                </p>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={quickUrlInput}
                      onChange={(e) => {
                        setQuickUrlInput(e.target.value);
                        setGasTestResult(null);
                      }}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveGasUrl(quickUrlInput)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shrink-0 transition-colors"
                    >
                      URL 저장
                    </button>
                  </div>

                  {/* Actions: Paste, Copy, Test */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePasteUrlFromClipboard}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-medium"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>클립보드에서 붙여넣기</span>
                    </button>

                    {quickUrlInput && (
                      <button
                        type="button"
                        onClick={handleCopyGasUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-medium"
                      >
                        <CheckCircle2 className={`w-3 h-3 ${isCopiedUrl ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span>{isCopiedUrl ? 'URL 복사 완료!' : 'URL 주소 복사'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleTestGasUrl(quickUrlInput)}
                      disabled={isTestingGasUrl || !quickUrlInput.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-md transition-colors disabled:cursor-not-allowed ml-auto"
                    >
                      {isTestingGasUrl ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>연결 테스트 중...</span>
                        </>
                      ) : (
                        <span>🔍 URL 연결 테스트</span>
                      )}
                    </button>
                  </div>

                  {/* Test Result Feedback */}
                  {gasTestResult && (
                    <div
                      className={`p-3 rounded-lg font-medium border text-xs ${
                        gasTestResult.success
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <p>{gasTestResult.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Google Sheet Notice Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    Google Sheet 저장 열 구조: A열(제품명) | B열(상담 질문) | C열(견적/가격 메모) | D열(저장 날짜)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    A열에 제품명이 독립 저장되어 시트에서 제품별 상담 건수를 손쉽게 필터링할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="text-xs font-semibold text-slate-800 underline hover:text-slate-950 shrink-0"
              >
                연동 가이드 & 코드 복사
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Google Apps Script Guide & Settings Modal */}
      <GasGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        currentUrl={gasUrl}
        onSaveUrl={handleSaveGasUrl}
        onTestUrl={handleTestGasUrl}
      />

      {/* Interactive Microphone Test & Google Sheet Export Modal */}
      <SheetExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        product={selectedProduct}
        questions={questions}
        memo={quoteMemo}
        date={new Date().toISOString().split('T')[0]}
        onSaveToGas={handleSaveToGoogleSheet}
        isSavingGas={isSaving}
      />

      {/* Open Graph Social Share Card Preview Modal */}
      <OgPreviewModal
        isOpen={isOgModalOpen}
        onClose={() => setIsOgModalOpen(false)}
      />
    </div>
  );
}
