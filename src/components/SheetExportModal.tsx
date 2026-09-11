import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  FileSpreadsheet,
  ExternalLink,
  Download,
  Mic,
  CheckCircle2,
  Sparkles,
  ClipboardCheck,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface SheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: string;
  questions: string[];
  memo: string;
  date: string;
  onSaveToGas?: () => void;
  isSavingGas?: boolean;
}

export const SheetExportModal: React.FC<SheetExportModalProps> = ({
  isOpen,
  onClose,
  product,
  questions,
  memo,
  date,
  onSaveToGas,
  isSavingGas = false,
}) => {
  const [isCopiedDataOnly, setIsCopiedDataOnly] = useState(false);
  const [isCopiedWithHeader, setIsCopiedWithHeader] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'dataOnly' | 'headerOnly'>('both');

  if (!isOpen) return null;

  const formattedQuestions = questions
    .map((q, idx) => {
      const clean = q.replace(/^\d+[\.\)]\s*/, '').trim();
      return `${idx + 1}. ${clean}`;
    })
    .join('\n');

  // Summary memo for sales representative
  const effectiveMemo =
    memo && memo.trim()
      ? memo.trim()
      : '현재 외산 센서 18만원 사용 중 / 목표 단가 13만원 이하 / 신규 2라인 증설용 20개 긴급 견적 요청 (구매 가능성 85%)';

  // 1. Data Row TSV (for pasting into an existing row with headers)
  const tsvDataRow = `${product}\t"${formattedQuestions.replace(/"/g, '""')}"\t"${effectiveMemo.replace(/"/g, '""')}"\t${date}`;

  // 2. Full Sheet TSV (Header row + Data row) - Perfect for fresh sheets!
  const headerTsv = '제품명\t상담 질문 (5대 핵심 질문)\t견적/가격 및 통화 요약 메모\t저장 날짜';
  const tsvWithHeader = `${headerTsv}\n${tsvDataRow}`;

  // Copy full table (header + row)
  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(tsvWithHeader);
      setIsCopiedWithHeader(true);
      setTimeout(() => setIsCopiedWithHeader(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Copy single row data
  const handleCopyDataRow = async () => {
    try {
      await navigator.clipboard.writeText(tsvDataRow);
      setIsCopiedDataOnly(true);
      setTimeout(() => setIsCopiedDataOnly(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvHeader = '\uFEFF제품명,상담 질문,견적/가격 및 통화 요약 메모,저장 날짜\n';
    const csvRow = `"${product.replace(/"/g, '""')}","${formattedQuestions.replace(/"/g, '""')}","${effectiveMemo.replace(/"/g, '""')}","${date}"\n`;
    const blob = new Blob([csvHeader + csvRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `센서상담요약_${product}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Google Sheet 실전 요약 예시 & 옮기기</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  A~D열 4분할 규격
                </span>
              </div>
              <p className="text-xs text-slate-300">
                빈 Google Sheet에서도 제목과 내용 요약이 한 번에 채워지도록 완성된 데이터입니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main Action Banner: 1-Click Paste Guide */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-emerald-950 text-sm">
                  빈 구글 시트에 [제목 행 + 요약 내용]을 통째로 넣는 방법
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  새로 열린 구글 시트의 <strong>A1 셀(맨 왼쪽 맨 위)</strong>을 마우스로 클릭하고{' '}
                  <kbd className="px-2 py-0.5 bg-white border border-emerald-300 rounded font-bold shadow-2xs text-emerald-900">
                    Ctrl + V
                  </kbd>
                  (Mac은 <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-bold">Cmd + V</kbd>)를 누르시면 아래 표 전체가 즉시 복사됩니다!
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-10">
              <button
                type="button"
                id="copy-full-sheet-btn"
                onClick={handleCopyFull}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                {isCopiedWithHeader ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>✓ [제목 + 요약] 전체 복사 완료! (A1에서 Ctrl+V)</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="w-4 h-4 text-emerald-200" />
                    <span>📋 [제목 + 요약 데이터] 전체 복사 (추천)</span>
                  </>
                )}
              </button>

              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Google Sheet 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyDataRow}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition-colors ml-auto"
                title="기존 시트에 이미 제목이 있는 경우 데이터 1행만 복사합니다."
              >
                {isCopiedDataOnly ? '✓ 데이터 행만 복사됨' : '데이터 1행만 복사'}
              </button>
            </div>
          </div>

          {/* Table Preview (Google Sheet 1:1 Rendering) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Google Sheet 입력 결과 미리보기</span>
                <span className="text-[11px] text-slate-500">(1행: 제목 / 2행: 내용 요약)</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">4개 열 자동 매핑</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-24 text-center">A열 (제품명)</th>
                    <th className="py-2.5 px-3 font-bold border-r border-slate-700">B열 (상담 질문 5개)</th>
                    <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-52">C열 (통화 요약 & 마이크 메모)</th>
                    <th className="py-2.5 px-3 font-bold w-24 text-center">D열 (저장 날짜)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="align-top hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-50 text-center">
                      <span className="inline-block px-2 py-1 bg-slate-200 text-slate-800 rounded font-semibold text-xs">
                        {product}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 border-r border-slate-200 whitespace-pre-line leading-relaxed font-sans text-xs">
                      {formattedQuestions}
                    </td>
                    <td className="py-3 px-3 text-slate-800 border-r border-slate-200 bg-emerald-50/20">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Mic className="w-3 h-3 text-emerald-600" />
                          <span>통화 녹음 요약 메모</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {effectiveMemo}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px] text-center whitespace-nowrap bg-slate-50">
                      {date}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Summary Analysis Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>영업 담당자를 위한 상담 질문 & 메모 분석 요약</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed pl-1">
              <li>
                <strong>B열 질문 목적:</strong> 고객이 기존에 쓰던 외산 제품 규격과 불만 사항을 확인하여 교체 가능성을 판별합니다.
              </li>
              <li>
                <strong>C열 메모 요약:</strong> 기존가(18만) 대비 희망 목표가(13만)가 형성되어 있어, 20개 대량 구매 시 마진 및 단가 절충안 제시가 최우선 과제입니다.
              </li>
              <li>
                <strong>시트 분할 장점:</strong> 질문 5개와 요약 메모가 분리되어 있어, 향후 엑셀 필터나 팀 공유 시에도 가독성이 뛰어납니다.
              </li>
            </ul>
          </div>

          {/* Backup: CSV Download */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              구글 시트 대신 엑셀 파일이 필요하신가요?
            </span>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV 다운로드 (.csv)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            💡 [Google Sheet 열기] 누른 후 새 창의 <strong>A1 셀</strong>에서 <code>Ctrl + V</code>를 누르시면 완료됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
