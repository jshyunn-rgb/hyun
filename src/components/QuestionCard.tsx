import React, { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { QUESTION_GOALS } from '../config';

interface QuestionCardProps {
  number: number;
  questionText: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ number, questionText }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const goal = QUESTION_GOALS.find((g) => g.number === number) || {
    number,
    title: `핵심 질문 ${number}`,
    desc: '고객 구매 가능성 판단 질문',
  };

  // Extract question text without leading number if already formatted
  const cleanQuestion = questionText.replace(/^\d+[\.\)]\s*/, '').trim();

  // Speech synthesis for listening to the question
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanQuestion);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95; // Natural phone consultation pacing
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${number}. ${cleanQuestion}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div
      id={`question-card-${number}`}
      className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col gap-3 relative group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-sm font-bold shrink-0">
            {number}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            목적 {number}: {goal.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* TTS Read-aloud button */}
          <button
            type="button"
            id={`speak-question-btn-${number}`}
            onClick={handleSpeak}
            aria-label={`질문 ${number} 음성으로 듣기`}
            title={isSpeaking ? '음성 중지' : '음성으로 읽어주기'}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              isSpeaking
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                <span className="text-[11px]">듣는 중</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">음성 듣기</span>
              </>
            )}
          </button>

          <button
            type="button"
            id={`copy-question-btn-${number}`}
            onClick={handleCopy}
            aria-label={`질문 ${number} 복사`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-100 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="pl-1">
        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed break-keep">
          "{cleanQuestion}"
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-slate-500">
          <Sparkles className="w-3 h-3 text-slate-400" />
          {goal.desc}
        </span>
        <span className="text-[11px] text-slate-400">통화 중 바로 읽기</span>
      </div>
    </div>
  );
};
