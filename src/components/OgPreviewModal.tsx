import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Smartphone, Globe, RefreshCw, Image as ImageIcon } from 'lucide-react';
import ogImageSrc from '../assets/og-image.jpg';

interface OgPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OgPreviewModal: React.FC<OgPreviewModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedImgUrl, setCopiedImgUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'raw'>('card');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://hyun-sy51.vercel.app';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hyun-sy51.vercel.app';
  const fullOgImageUrl = `${origin}/og-image.jpg?v=3`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyImgUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullOgImageUrl);
      setCopiedImgUrl(true);
      setTimeout(() => setCopiedImgUrl(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">SNS 오픈그래프(OG) 카드 및 이미지</h3>
              <p className="text-xs text-slate-300">카카오톡, 슬랙, 페이스북 링크 공유 시 나타나는 미리보기</p>
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

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`pb-2 px-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>메신저 공유 카드 형태</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`pb-2 px-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>OG 원본 이미지 (1200×630)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'card' ? (
            /* KakaoTalk / Messenger Style Mockup */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>카카오톡 / 슬랙 메시지 미리보기</span>
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">1200 × 630 표준 비율</span>
              </div>

              {/* Simulated Chat Message Bubble */}
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200/80">
                <div className="max-w-md bg-white rounded-xl overflow-hidden border border-slate-300/80 shadow-md">
                  {/* OG Image banner with both direct asset and relative fallback */}
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={ogImageSrc || '/og-image.jpg?v=2'}
                      alt="마케팅 전화상담 질문 생성기 오픈그래프 배너"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider border border-white/20">
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
          ) : (
            /* Raw Image Inspection */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>실제 생성된 1200×630 오픈그래프 대표 이미지</span>
                <a
                  href={fullOgImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-750 inline-flex items-center gap-1"
                >
                  <span>새 창에서 원본 보기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-950">
                <img
                  src={ogImageSrc || '/og-image.jpg?v=2'}
                  alt="오픈그래프 원본 1200x630"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">URL: {fullOgImageUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyImgUrl}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold shrink-0"
                >
                  {copiedImgUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedImgUrl ? '복사됨' : '이미지 URL 복사'}</span>
                </button>
              </div>
            </div>
          )}

          {/* KakaoTalk Scraper Cache Clear Guide */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <RefreshCw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>카카오톡에서 기존 빈 썸네일이 계속 뜰 때 해결법</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              카카오톡은 이전에 한번 공유했던 링크의 미리보기를 <strong>최대 수일간 자체 서버에 캐싱</strong>합니다.
              최신 이미지를 즉시 반영하려면 아래 <a href="https://developers.kakao.com/tool/clear-og-cache" target="_blank" rel="noreferrer" className="font-bold underline text-amber-950">카카오 공유 디버거</a>에 접속 후 URL을 입력하고 [캐시 삭제]를 누르면 즉시 갱신됩니다.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://developers.kakao.com/tool/clear-og-cache"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors"
              >
                <span>카카오 OG 캐시 삭제 도구 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://developers.facebook.com/tools/debug/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-md transition-colors"
              >
                <span>페이스북 디버거 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Link Copy action */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
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
