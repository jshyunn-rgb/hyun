import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, HelpCircle, Table, CheckCircle2 } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../gasScriptCode';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  onTestUrl?: (url: string) => Promise<{ success: boolean; message: string }>;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
  onTestUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyUrl = async () => {
    if (!inputUrl) return;
    try {
      await navigator.clipboard.writeText(inputUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestConnection = async () => {
    if (!inputUrl || !inputUrl.trim()) {
      setTestStatus({ loading: false, success: false, message: 'URL을 먼저 입력해주세요.' });
      return;
    }
    setTestStatus({ loading: true });
    try {
      if (onTestUrl) {
        const result = await onTestUrl(inputUrl.trim());
        setTestStatus({ loading: false, success: result.success, message: result.message });
      } else {
        const res = await fetch('/api/test-gas-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl: inputUrl.trim() }),
        });
        const data = await res.json();
        setTestStatus({ loading: false, success: res.ok && data.success, message: data.message || data.error });
      }
    } catch (err: any) {
      setTestStatus({ loading: false, success: false, message: err?.message || '연결 실패' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(inputUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="gas-guide-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Google Sheet 연동 가이드 및 Apps Script 코드</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Current URL Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span>Google Apps Script Web App URL 설정</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              배포 후 발급받은 웹앱 URL을 입력하시면 상담 질문과 메모가 본인의 Google Sheet로 바로 저장됩니다.
            </p>
            <form onSubmit={handleSave} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  id="gas-url-input"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setTestStatus({ loading: false });
                  }}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800"
                />
                <button
                  type="submit"
                  id="save-gas-url-btn"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>저장됨</span>
                    </>
                  ) : (
                    <span>URL 저장</span>
                  )}
                </button>
              </div>

              {/* URL Action Tools: Paste, Copy, Test */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition-colors"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>클립보드에서 URL 붙여넣기</span>
                </button>

                {inputUrl && (
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className={`w-3 h-3 ${copiedUrl ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{copiedUrl ? 'URL 복사 완료!' : 'URL 주소 복사'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus.loading || !inputUrl.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {testStatus.loading ? (
                    <span>연결 확인 중...</span>
                  ) : (
                    <span>🔍 연결 테스트</span>
                  )}
                </button>
              </div>

              {/* Test Status Message */}
              {testStatus.message && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border ${
                    testStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <p>{testStatus.message}</p>
                </div>
              )}
            </form>
          </div>

          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base">간편 연동 4단계 (약 1분 소요)</h3>
            <ol className="space-y-3 list-decimal list-inside text-xs leading-relaxed text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <li className="pl-1">
                <span className="font-semibold text-slate-800">Google Drive</span>에서 새{' '}
                <span className="font-semibold text-slate-800">Google 스프레드시트</span>를 만듭니다.{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1 font-medium"
                >
                  새 스프레드시트 열기 <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="pl-1">
                시트 상단 메뉴에서 <span className="font-semibold text-slate-800">[확장 프로그램]</span> →{' '}
                <span className="font-semibold text-slate-800">[Apps Script]</span>를 클릭합니다.
              </li>
              <li className="pl-1">
                기존 코드를 지우고, 아래 <span className="font-semibold text-slate-800">[Google Apps Script 전체 코드 복사]</span> 버튼을 눌러 붙여넣습니다.
                <div className="text-[11px] text-slate-500 mt-1 pl-4">
                  ※ 시트 이름을 바꾸고 싶으시면 코드 내 <code className="text-slate-800 bg-slate-200 px-1 rounded">SHEET_NAME</code> 주석 위치를 수정하세요.
                </div>
              </li>
              <li className="pl-1">
                우측 상단 <span className="font-semibold text-slate-800">[배포]</span> →{' '}
                <span className="font-semibold text-slate-800">[새 배포]</span>를 누르고 다음 설정을 확인합니다:
                <div className="mt-1.5 pl-4 space-y-1 text-[11px] text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                  <p>• 유형: <strong>웹 앱 (Web App)</strong></p>
                  <p>• 다음 사용자로 실행: <strong>나 (My account)</strong></p>
                  <p className="text-emerald-700 font-semibold">
                    • 액세스 권한이 있는 사용자: <strong>모든 사용자 (Anyone)</strong> (필수)
                  </p>
                </div>
              </li>
              <li className="pl-1">
                발급된 <span className="font-semibold text-slate-800">웹 앱 URL</span>을 복사하여 위 URL 입력창에 붙여넣고 저장하세요.
              </li>
            </ol>
          </div>

          {/* Code Viewer and Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Google Apps Script 복사용 전체 코드</span>
              <button
                type="button"
                id="copy-gas-code-btn"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors border border-slate-300"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">전체 코드 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>전체 코드 복사</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl max-h-52 overflow-y-auto font-mono leading-relaxed border border-slate-800 select-all">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>

          {/* Sheet Structure Note */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Google Sheet 열 구성 및 통계 활용</span>
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-2">
              <div className="p-2 bg-slate-100 rounded border border-slate-200 font-semibold text-slate-900">
                A열: 제품명
              </div>
              <div className="p-2 bg-slate-100 rounded border border-slate-200 font-semibold text-slate-900">
                B열: 상담 질문
              </div>
              <div className="p-2 bg-slate-100 rounded border border-slate-200 font-semibold text-slate-900">
                C열: 견적/가격 메모
              </div>
              <div className="p-2 bg-slate-100 rounded border border-slate-200 font-semibold text-slate-900">
                D열: 저장 날짜
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              제품명이 독립된 A열에 자동 저장되므로, 구글 스프레드시트의 필터나 피벗테이블을 통해 
              <strong> 압력센서, 차압센서, 디지털 압력계, 진공센서, 로드셀</strong>별 상담 건수를 즉시 집계하고 분석할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
