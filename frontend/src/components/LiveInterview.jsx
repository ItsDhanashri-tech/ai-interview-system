import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Camera, CameraOff, Send, Clock, ArrowRight, Award, Sparkles, AlertCircle, PhoneOff } from 'lucide-react';

export default function LiveInterview({ session, firstQuestion, token, onFinishInterview }) {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [textResponse, setTextResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [audioUsed, setAudioUsed] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [nextQuestionData, setNextQuestionData] = useState(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Candidate Live Media Controls (Left Panel)
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize Timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [currentQuestion]);

  // Candidate Camera Stream Setup
  useEffect(() => {
    startCameraStream();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera preview initialization error:", err);
      setCameraEnabled(false);
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !cameraEnabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combined = (finalTranscript || interimTranscript).trim();
      if (combined) {
        setTextResponse((prev) => (prev ? prev + ' ' + combined : combined));
        setAudioUsed(true);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleSpeechToText = () => {
    if (!isSpeechSupported) {
      alert('Speech Recognition is not supported by your browser. You can type your answer in the box below!');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setAudioUsed(true);
      } catch (err) {
        console.error('Mic start error', err);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    if (!textResponse.trim()) {
      alert('Please speak or type an answer before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/interviews/${session.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          text_response: textResponse,
          audio_used: audioUsed,
          response_time_seconds: timerSeconds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit answer.');
      }

      setEvaluation(data.evaluation);
      setNextQuestionData(data.next_question);
      setIsLastQuestion(data.is_last_question);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (nextQuestionData) {
      setCurrentQuestion(nextQuestionData);
      setTextResponse('');
      setEvaluation(null);
      setNextQuestionData(null);
      setAudioUsed(false);
      setTimerSeconds(0);
    }
  };

  const handleCompleteInterview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/interviews/${session.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to build report.');
      }
      onFinishInterview(session.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      
      {/* Split Layout: Left candidate camera + controls | Right AI interview workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE (4 Cols): Candidate Live Stream & Interview Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-4">
            
            {/* Session Status Pill */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE INTERVIEW
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {session.job_role?.title || 'Mock Role'}
              </span>
            </div>

            {/* Candidate Camera Stream Box */}
            <div className="relative aspect-video bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'}`}
              />
              {!cameraEnabled && (
                <div className="flex flex-col items-center justify-center text-slate-500 p-4">
                  <CameraOff className="w-8 h-8 mb-2" />
                  <span className="text-xs">Camera Feed Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white font-semibold">
                Candidate Preview
              </div>
            </div>

            {/* Media Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleCamera}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  cameraEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                <span>{cameraEnabled ? 'Cam On' : 'Cam Off'}</span>
              </button>

              <button
                onClick={toggleMic}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  micEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{micEnabled ? 'Mic On' : 'Mic Off'}</span>
              </button>
            </div>

            {/* End Interview Button */}
            <button
              onClick={handleCompleteInterview}
              className="w-full py-2.5 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Interview Early</span>
            </button>

          </div>
        </div>

        {/* RIGHT SIDE (8 Cols): AI Question & Answer Workspace */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header Progress & Timer */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                Question {currentQuestion.question_number} of {session.question_count}
              </span>
              <span className="text-xs text-slate-400">
                Difficulty: {session.difficulty} • Type: {session.interview_type}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>
          </div>

          {/* AI Question Box */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold uppercase tracking-wider mb-1 inline-block">
                  AI Question • {currentQuestion.category || 'General'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  "{currentQuestion.question_text}"
                </h2>
              </div>
            </div>
          </div>

          {/* Candidate Answer Box / Evaluation Box */}
          {!evaluation ? (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Candidate Response
                </label>
                
                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Stop Recording' : '🎤 Speak Answer'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Type your answer here or click '🎤 Speak Answer' to use speech-to-text..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  {textResponse.trim().split(/\s+/).filter(Boolean).length} words
                </span>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !textResponse.trim()}
                  className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'AI Evaluating...' : 'Submit Answer →'}</span>
                </button>
              </div>

            </div>
          ) : (
            
            /* Real-Time Evaluation Result Box */
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Answer Evaluation</h3>
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  {evaluation.overall_question_score}/100
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <span className="text-sm font-bold text-blue-400">{evaluation.accuracy_score}%</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Completeness</span>
                  <span className="text-sm font-bold text-indigo-400">{evaluation.completeness_score}%</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Relevance</span>
                  <span className="text-sm font-bold text-emerald-400">{evaluation.relevance_score}%</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg text-center border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Communication</span>
                  <span className="text-sm font-bold text-purple-400">{evaluation.communication_score}%</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                <p className="text-xs text-slate-200">{evaluation.feedback_text}</p>
              </div>

              <div className="flex justify-end pt-2">
                {!isLastQuestion ? (
                  <button
                    onClick={handleNextQuestion}
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                  >
                    <span>Next Question #{currentQuestion.question_number + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteInterview}
                    disabled={submitting}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>{submitting ? 'Analyzing...' : 'Finish & View Performance Analysis'}</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
