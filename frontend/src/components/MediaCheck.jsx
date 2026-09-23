import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MediaCheck({ onBack, onContinue }) {
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    requestMediaAccess();

    return () => {
      // Cleanup stream and audio context on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const requestMediaAccess = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      // Check Video Track
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].enabled) {
        setCameraReady(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      // Check Audio Track & measure volume level
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].enabled) {
        setMicReady(true);
        setupAudioAnalyser(stream);
      }
    } catch (err) {
      console.warn("Media devices access error:", err);
      setErrorMsg("Unable to access camera/microphone. Please allow browser permissions.");
    }
  };

  const setupAudioAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn("Audio level meter init failed", e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      
      <div className="text-center mb-8">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Hardware & Media Check
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Camera & Microphone Check
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-1">
          Please make sure your camera and microphone are working before starting the live interview.
        </p>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Camera Feed */}
          <div className="space-y-3 text-center">
            <div className="relative aspect-video bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/90 p-4">
                  <Camera className="w-8 h-8 mb-2 animate-bounce" />
                  <span className="text-xs">Requesting Camera Access...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs font-bold">
              {cameraReady ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Camera Ready
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Camera Offline
                </span>
              )}
            </div>
          </div>

          {/* Microphone & Status Details */}
          <div className="space-y-5">
            
            {/* Mic Status & Level Meter */}
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Mic className="w-4 h-4 text-blue-400" />
                  <span>Microphone Status</span>
                </div>
                {micReady ? (
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Offline</span>
                )}
              </div>

              {/* Audio Level Meter Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Audio Level Test</span>
                  <span>{micReady ? `${audioLevel}%` : 'Speak into mic'}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              <p className="leading-relaxed">
                <strong>Privacy Notice:</strong> Your video stream stays strictly inside your browser for your preview during the live session. No video data is recorded or stored on any server.
              </p>
            </div>

          </div>

        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/80">
          <button
            onClick={onBack}
            className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Setup</span>
          </button>

          <button
            onClick={onContinue}
            className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>Proceed to Live Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
