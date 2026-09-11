import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Smartphone, Globe } from 'lucide-react';

interface OgPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OgPreviewModal: React.FC<OgPreviewModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-nvlqz5v4av2dngu3wwhgm5-497417192682.asia-east1.run.app';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">SNS 오픈그래프(OG) 카드 미리보기</h3>
              <p className="text-xs text-slate-300">카카오톡, 슬랙, 페이스북 공유 시 나타나는 미리보기 화면</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* KakaoTalk / Messenger Style Mockup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>메신저(카카오톡/슬랙) 공유 미리보기</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">1200 x 630 규격</span>
            </div>

            {/* Simulated Chat Message Bubble */}
            <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <div className="max-w-md bg-white rounded-xl overflow-hidden border border-slate-300/80 shadow-md">
                {/* OG Image banner */}
                <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                  <img
                    src="/og-image.jpg"
                    alt="오픈그래프 배너 이미지"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider border border-white/20">
                    B2B SENSOR AI
                  </div>
                </div>

                {/* OG Text container */}
                <div className="p-3.5 space-y-1 bg-white">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    센서 세일즈 어시스턴트
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                    마케팅 전화상담 질문 생성기 — 산업용 센서 B2B
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    통화 전 구매 가능성을 즉시 판별하는 맞춤형 5대 상담 질문 생성 & 마이크 음성 메모 Google Sheet 실시간 연동
                  </p>
                  <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span className="truncate">{currentUrl.replace(/^https?:\/\//, '')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OG Meta Tag Specification Details */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">적용된 오픈그래프 메타태그 정보</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-sans">og:title</span>
                <span className="text-slate-900 font-semibold font-sans">마케팅 전화상담 질문 생성기 — 산업용 센서 B2B</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-sans">og:image (권장 비율 1.91:1)</span>
                <span className="text-emerald-700 font-semibold">/og-image.jpg (1200x630)</span>
              </div>
            </div>
          </div>

          {/* Link Copy action */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 truncate">
              동료 영업팀 또는 고객사 전달용 URL
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>링크 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>공유 링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
