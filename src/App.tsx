import React, { useEffect, useRef, useState } from 'react';
import { Hands, Results, HAND_CONNECTIONS, LandmarkList } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Cpu, Play, StopCircle, MousePointer2, Eraser, Pencil, Trash2, Palette, CheckCircle2, AlertCircle, Hand } from 'lucide-react';

type Gesture = 'ONE_FINGER' | 'TWO_FINGERS' | 'THREE_FINGERS' | 'PALM' | 'FIST' | 'PINKY_ONLY' | 'NONE';
type Mode = 'DRAW' | 'ERASE' | 'NONE';

interface HandState {
  mode: Mode;
  activeColor: string;
  detectedGesture: Gesture;
  isDrawingEnabled: boolean;
  lastPos: { x: number; y: number } | null;
  fingerStatus: { index: boolean; middle: boolean; ring: boolean; pinky: boolean };
  colorSwitchCooldown: number;
  toggleCooldown: number;
}

const initialHandState = (): HandState => ({
  mode: 'NONE',
  activeColor: '#10b981',
  detectedGesture: 'NONE',
  isDrawingEnabled: false,
  lastPos: null,
  fingerStatus: { index: false, middle: false, ring: false, pinky: false },
  colorSwitchCooldown: 0,
  toggleCooldown: 0,
});

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);
  const [handStates, setHandStates] = useState<HandState[]>([initialHandState(), initialHandState()]);
  const [error, setError] = useState<string | null>(null);

  const handStatesRef = useRef<HandState[]>([initialHandState(), initialHandState()]);
  const lastStateUpdateRef = useRef<number>(0);
  let lastTime = 0;

  const detectGesture = (landmarks: LandmarkList, handIndex: number): Gesture => {
    // Tip must be higher than the PIP joint for a finger to be considered "up"
    const isIndexUp = landmarks[8].y < landmarks[6].y;
    const isMiddleUp = landmarks[12].y < landmarks[10].y;
    const isRingUp = landmarks[16].y < landmarks[14].y;
    const isPinkyUp = landmarks[20].y < landmarks[18].y;

    handStatesRef.current[handIndex].fingerStatus = { index: isIndexUp, middle: isMiddleUp, ring: isRingUp, pinky: isPinkyUp };

    const upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

    if (upCount === 0) return 'FIST';
    // Pinky Only: Only pinky is up, others are down
    if (isPinkyUp && !isIndexUp && !isMiddleUp && !isRingUp) return 'PINKY_ONLY';
    // Index Only: Only index is up, others are down
    if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return 'ONE_FINGER';
    if (upCount === 2 && isIndexUp && isMiddleUp) return 'TWO_FINGERS';
    if (upCount === 3 && isIndexUp && isMiddleUp && isRingUp) return 'THREE_FINGERS';
    if (upCount >= 4) return 'PALM';
    
    return 'NONE';
  };

  const onResults = (results: Results) => {
    if (!canvasRef.current || !videoRef.current || !drawingCanvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d', { alpha: true });
    const drawCtx = drawingCanvasRef.current.getContext('2d', { alpha: true });
    if (!canvasCtx || !drawCtx) return;

    canvasCtx.imageSmoothingEnabled = false;
    drawCtx.imageSmoothingEnabled = true; // Keep smoothing for drawing

    const now = performance.now();
    if (lastTime !== 0) {
      const currentFps = 1000 / (now - lastTime);
      setFps(Math.round(currentFps));
    }
    lastTime = now;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const newHandStates = [...handStatesRef.current];

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Clear previous frame's hand detection info but keep drawing states
      results.multiHandLandmarks.forEach((landmarks, index) => {
        if (index >= 2) return; // Only support 2 hands

        const gesture = detectGesture(landmarks, index);
        newHandStates[index].detectedGesture = gesture;

        // Pinky Toggle for Drawing
        if (gesture === 'PINKY_ONLY' && now > newHandStates[index].toggleCooldown) {
          newHandStates[index].isDrawingEnabled = !newHandStates[index].isDrawingEnabled;
          newHandStates[index].toggleCooldown = now + 1000; // 1s cooldown for toggle
        }

        // Color Switching with Cooldown
        if (now > newHandStates[index].colorSwitchCooldown) {
          if (gesture === 'TWO_FINGERS' && newHandStates[index].activeColor !== '#ef4444') {
            newHandStates[index].activeColor = '#ef4444';
            newHandStates[index].colorSwitchCooldown = now + 800;
          } else if (gesture === 'THREE_FINGERS' && newHandStates[index].activeColor !== '#10b981') {
            newHandStates[index].activeColor = '#10b981';
            newHandStates[index].colorSwitchCooldown = now + 800;
          }
        }

        // Mode Selection
        let currentMode: Mode = 'NONE';
        
        if (gesture === 'FIST') {
          currentMode = 'ERASE';
        } else if (gesture === 'ONE_FINGER' && newHandStates[index].isDrawingEnabled) {
          currentMode = 'DRAW';
        }
        newHandStates[index].mode = currentMode;

        // Skeleton Rendering
        let skeletonColor = '#ffffff';
        if (currentMode === 'DRAW') skeletonColor = newHandStates[index].activeColor;
        else if (currentMode === 'ERASE') skeletonColor = '#f59e0b';

        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: skeletonColor,
          lineWidth: 4
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: '#ffffff',
          lineWidth: 1,
          radius: 3
        });

        // Drawing Logic
        const activeLandmark = currentMode === 'ERASE' ? landmarks[9] : landmarks[8];
        const x = Math.round(activeLandmark.x * canvasRef.current.width);
        const y = Math.round(activeLandmark.y * canvasRef.current.height);

        if (currentMode === 'DRAW') {
          drawCtx.globalCompositeOperation = 'source-over';
          drawCtx.strokeStyle = newHandStates[index].activeColor;
          drawCtx.lineWidth = 6;
          drawCtx.lineCap = 'round';
          drawCtx.lineJoin = 'round';

          if (newHandStates[index].lastPos) {
            drawCtx.beginPath();
            drawCtx.moveTo(newHandStates[index].lastPos!.x, newHandStates[index].lastPos!.y);
            drawCtx.lineTo(x, y);
            drawCtx.stroke();
          }
          newHandStates[index].lastPos = { x, y };
        } else if (currentMode === 'ERASE') {
          drawCtx.globalCompositeOperation = 'destination-out';
          drawCtx.beginPath();
          drawCtx.arc(x, y, 30, 0, Math.PI * 2);
          drawCtx.fill();
          newHandStates[index].lastPos = null;
        } else {
          newHandStates[index].lastPos = null;
        }
      });

      // Reset state for hands not detected
      if (results.multiHandLandmarks.length < 2) {
        for (let i = results.multiHandLandmarks.length; i < 2; i++) {
          newHandStates[i].mode = 'NONE';
          newHandStates[i].detectedGesture = 'NONE';
          newHandStates[i].lastPos = null;
        }
      }
    } else {
      newHandStates[0].mode = 'NONE';
      newHandStates[1].mode = 'NONE';
      newHandStates[0].detectedGesture = 'NONE';
      newHandStates[1].detectedGesture = 'NONE';
      newHandStates[0].lastPos = null;
      newHandStates[1].lastPos = null;
    }

    handStatesRef.current = newHandStates;
    // Throttle UI state updates to ~30 FPS to save CPU, while canvas drawing stays at max FPS
    if (isTracking && now - lastStateUpdateRef.current > 32) {
      setHandStates([...newHandStates]);
      lastStateUpdateRef.current = now;
    }
    canvasCtx.restore();
  };

  const clearCanvas = () => {
    if (!drawingCanvasRef.current) return;
    const ctx = drawingCanvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
  };

  useEffect(() => {
    let hands: Hands | null = null;

    if (isTracking) {
      setError(null);
      hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      hands.onResults(onResults);

      if (videoRef.current) {
        const processVideo = async () => {
          if (!videoRef.current || !hands) return;
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 360, frameRate: { ideal: 60 } }
            });
            videoRef.current.srcObject = stream;
            
            const runDetection = async () => {
              if (!isTracking || !hands || !videoRef.current) return;
              try {
                await hands.send({ image: videoRef.current });
              } catch (e) {
                console.error("Detection error:", e);
              }
              if ('requestVideoFrameCallback' in videoRef.current) {
                (videoRef.current as any).requestVideoFrameCallback(runDetection);
              } else {
                requestAnimationFrame(runDetection);
              }
            };
            
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              if ('requestVideoFrameCallback' in videoRef.current!) {
                (videoRef.current as any).requestVideoFrameCallback(runDetection);
              } else {
                runDetection();
              }
            };
          } catch (err) {
            console.error(err);
            setError("Камера не доступна. Будь ласка, надайте дозвіл у браузері.");
            setIsTracking(false);
          }
        };
        processVideo();
      }
    }

    return () => {
      if (hands) hands.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isTracking]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-emerald-500/30">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ rotate: isTracking ? 360 : 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Cpu className="w-5 h-5 text-black" />
            </motion.div>
            <h1 className="text-lg font-bold tracking-tight">AirPaint Pro<span className="text-emerald-500">.js</span></h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Green: 3 Fingers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Red: 2 Fingers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Toggle Pen: Pinky</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>Erase: Fist</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono">
              <span className={isTracking ? "text-emerald-500 animate-pulse" : "text-zinc-500"}>●</span>
              {isTracking ? "LIVE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 shadow-xl space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Керування</h2>
                <p className="text-sm text-zinc-500">Мульти-трекінг (2 руки)</p>
              </div>

              {handStates.map((hand, idx) => (
                <div key={idx} className={`space-y-4 p-4 rounded-2xl border ${hand.detectedGesture !== 'NONE' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-black/20'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Рука {idx + 1}</span>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold ${hand.mode === 'ERASE' ? 'bg-orange-500 text-black' : hand.isDrawingEnabled ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                      {hand.mode === 'ERASE' ? 'СТИРАННЯ' : hand.isDrawingEnabled ? 'ПЕНЗЕЛЬ УВІМК' : 'РЕЖИМ ОЧІКУВАННЯ'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-3 rounded-xl border text-center transition-all ${hand.activeColor === '#10b981' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5'}`}>
                      <div className="text-[8px] font-bold uppercase tracking-widest">Зелений (3)</div>
                    </div>
                    <div className={`p-3 rounded-xl border text-center transition-all ${hand.activeColor === '#ef4444' ? 'border-red-500 bg-red-500/10' : 'border-white/5'}`}>
                      <div className="text-[8px] font-bold uppercase tracking-widest">Червоний (2)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {Object.entries(hand.fingerStatus).map(([name, isUp]) => (
                      <div key={name} className={`py-1 rounded border text-[7px] font-mono text-center uppercase ${isUp ? 'border-emerald-500/50 text-emerald-500' : 'border-white/5 text-zinc-700'}`}>
                        {name[0]}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-[9px] font-mono text-zinc-500 text-center">
                    Gesture: {hand.detectedGesture}
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    isTracking 
                      ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                      : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/30"
                  }`}
                >
                  {isTracking ? <StopCircle className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  {isTracking ? "ЗУПИНИТИ" : "ПОЧАТИ МАЛЮВАТИ"}
                </button>

                <button
                  onClick={clearCanvas}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold tracking-widest"
                >
                  <Trash2 className="w-4 h-4" />
                  ОЧИСТИТИ ПОЛОТНО
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="relative aspect-video rounded-[2.5rem] bg-black border border-white/10 overflow-hidden shadow-2xl group">
              {!isTracking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/80 backdrop-blur-md">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20"
                  >
                    <Camera className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">Ready to capture</p>
                </div>
              )}
              
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                playsInline
                muted
              />
              <canvas
                ref={drawingCanvasRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-20 will-change-transform"
                width={640}
                height={360}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-30 pointer-events-none will-change-transform"
                width={640}
                height={360}
              />

              {isTracking && (
                <div className="absolute top-8 left-8 z-50 flex flex-col gap-3">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    FPS: {fps}
                  </div>
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Hands Detected: {handStates.filter(h => h.detectedGesture !== 'NONE').length}
                  </div>
                </div>
              )}

              {isTracking && (
                <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-2">
                  {handStates.map((hand, i) => hand.detectedGesture !== 'NONE' && (
                    <div key={i} className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                      <span className="text-zinc-600">H{i+1}:</span>
                      <span style={{ color: hand.activeColor }}>{hand.activeColor === '#10b981' ? 'GREEN' : 'RED'}</span>
                      <span className={hand.isDrawingEnabled ? 'text-emerald-500' : 'text-zinc-600'}>
                        {hand.mode === 'DRAW' ? 'DRAWING' : hand.mode === 'ERASE' ? 'ERASING' : 'READY'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 grid grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Зелений</span>
                <span className="text-xs text-zinc-400">3 Пальці 🤟</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Червоний</span>
                <span className="text-xs text-zinc-400">2 Пальці ✌️</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Toggle Pen</span>
                <span className="text-xs text-zinc-400">Мізинець 🤙</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Стерти</span>
                <span className="text-xs text-zinc-400">Кулак ✊</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Малювати</span>
                <span className="text-xs text-zinc-400">Вказівний ☝️ (якщо УВІМК)</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
