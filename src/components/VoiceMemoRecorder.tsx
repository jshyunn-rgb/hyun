import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Volume2, CheckCircle2, RefreshCw } from 'lucide-react';

interface VoiceMemoRecorderProps {
  onTranscript: (text: string) => void;
  currentMemo: string;
}

export const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  onTranscript,
  currentMemo,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check Web Speech API support
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechSupported) {
      setMicPermission('unsupported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
      setMicPermission('granted');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      setInterimText(interim);

      if (finalTranscript.trim()) {
        const separator = currentMemo.trim() ? (currentMemo.endsWith('\n') ? '' : ' / ') : '';
        onTranscript((currentMemo + separator + finalTranscript.trim()).trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermission('denied');
        setErrorMessage('마이크 사용 권한이 차단되었습니다. 브라우저 주소창 좌측의 설정/자물쇠 아이콘에서 마이크를 [허용]해주세요.');
      } else if (event.error === 'no-speech') {
        // Just silent timeout, keep running or restart
      } else {
        setErrorMessage(`음성 인식 오류: ${event.error}`);
      }
      stopAudioVisualizer();
      setIsListening(false);
    };

    recognition.onend = () => {
      // If user still wants listening, or auto ended
      setIsListening(false);
      setInterimText('');
      stopAudioVisualizer();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopAudioVisualizer();
    };
  }, [currentMemo, onTranscript]);

  // Audio level visualizer using Web Audio API
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Get device name if available
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].label) {
        setConnectedDeviceName(audioTracks[0].label);
      } else {
        setConnectedDeviceName('기본 마이크');
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize to 0 - 100
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err: any) {
      console.error('Audio visualizer error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setErrorMessage('마이크 연결 권한이 필요합니다. 브라우저 팝업에서 [허용]을 선택해주세요.');
      }
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Toggle Microphone
  const toggleListening = async () => {
    setErrorMessage(null);

    if (isListening) {
      // Stop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopAudioVisualizer();
      setIsListening(false);
    } else {
      // Start
      try {
        await startAudioVisualizer();
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (err: any) {
        console.error('Failed to start microphone:', err);
        setErrorMessage('마이크를 시작할 수 없습니다. 마이크 연결 및 권한을 확인해주세요.');
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Main Microphone Button */}
          <button
            type="button"
            id="toggle-mic-btn"
            onClick={toggleListening}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-300 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-white" />
                <span>마이크 끄기 (녹음 중)</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>마이크 음성 입력 (말하기)</span>
              </>
            )}
          </button>

          {/* Audio volume visualizer indicator when listening */}
          {isListening && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="flex items-end gap-0.5 h-3.5 w-12">
                {[20, 40, 60, 80, 100].map((threshold, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-t-xs transition-all duration-75 ${
                      audioLevel >= threshold ? 'bg-red-500' : 'bg-red-200'
                    }`}
                    style={{
                      height: audioLevel >= threshold ? `${Math.max(4, (idx + 1) * 3)}px` : '3px',
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-red-700">말씀하세요</span>
            </div>
          )}

          {/* Connected Device badge when active */}
          {connectedDeviceName && isListening && (
            <span className="text-[11px] text-slate-500 hidden md:inline">
              🎙️ {connectedDeviceName}
            </span>
          )}

          {/* Test Voice Memo Sample Button */}
          <button
            type="button"
            onClick={() => {
              const sampleVoice = '현재 외산 센서 개당 18만원 사용 중 / 목표 단가 13만원 희망 / 라인 증설용 20개 견적 요청 (마이크 음성 입력 테스트)';
              onTranscript(sampleVoice);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            title="마이크로 통화 메모를 받아 적은 예시를 자동으로 입력합니다."
          >
            <span>🎙️ 음성 인식 예시 자동 입력</span>
          </button>
        </div>

        {/* Clear Memo quick action */}
        {currentMemo && (
          <button
            type="button"
            onClick={() => onTranscript('')}
            className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
          >
            메모 비우기
          </button>
        )}
      </div>

      {/* Real-time interim voice recognition speech preview */}
      {isListening && interimText && (
        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 italic animate-fadeIn flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>듣는 중: "{interimText}"</span>
        </div>
      )}

      {/* Microphone status guidance / error */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-red-600">
              💡 브라우저 주소창 좌측의 <strong>[사이트 정보 / 자물쇠 또는 설정]</strong> 버튼을 누른 후 <strong>[마이크]</strong>를 <strong>'허용'</strong>으로 변경하고 새로고침해 주세요.
            </p>
          </div>
        </div>
      )}

      {!isSpeechSupported && (
        <p className="text-[11px] text-amber-600">
          ⚠️ 현재 브라우저는 실시간 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.
        </p>
      )}
    </div>
  );
};
