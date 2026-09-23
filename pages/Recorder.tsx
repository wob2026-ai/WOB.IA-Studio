
import React, { useRef, useState, useEffect } from 'react';
import { EvalMode, User } from '../types';

interface Scenario {
  id: string;
  title: string;
  product: 'Virtua' | 'TV' | 'Mesh' | 'Móvel';
  customerName: string;
  customerProfile: string;
  image: string;
  question: string;
  evalCriteria: string[];
}

interface RecorderProps {
  onComplete: (videoBlob: Blob, finalMode: EvalMode, liveTranscript?: string) => void;
  onCancel: () => void;
  scenario: Scenario | null;
  techName: string;
  mode: EvalMode;
  user?: User | null;
}

// Highly polished, dynamic vector avatar drawing function for Canvas.
// Perfect for protecting field technicians' image rights while staying 100% compliant and interactive.
const drawAvatar = (
  ctx: CanvasRenderingContext2D,
  type: 'alex' | 'beatriz' | 'lucas' | 'mariana' | 'custom',
  width: number,
  height: number,
  mouthOpenRatio: number,
  time: number,
  customStyle?: 'masculino' | 'feminino' | 'neutro',
  customPhoto?: string
) => {
  // Radiant soft ambient background
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
  bgGrad.addColorStop(0, '#1a191f');
  bgGrad.addColorStop(1, '#0e0d11');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Dynamic soundwave rings behind avatar
  ctx.strokeStyle = 'rgba(238, 0, 0, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 20, 110 + Math.sin(time * 0.004) * 8 + mouthOpenRatio * 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(238, 0, 0, 0.07)';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 20, 140 + Math.cos(time * 0.003) * 6, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle breathing offset
  const breatheY = Math.sin(time * 0.0025) * 4;

  // Let's set up skin, hair and shirt colors
  const shirtColor = '#ee0000'; // Claro Corporate Red
  const shirtDarkColor = '#b80000';
  
  let skinColor = '#dfa27a';
  let shadowSkinColor = '#c78a63';
  if (type === 'beatriz') {
    skinColor = '#8a5c3e';
    shadowSkinColor = '#6f482f';
  } else if (type === 'lucas') {
    skinColor = '#e2b192';
    shadowSkinColor = '#c39577';
  } else if (type === 'mariana') {
    skinColor = '#ecc2a6';
    shadowSkinColor = '#caa186';
  } else if (type === 'custom') {
    if (customStyle === 'feminino') {
      skinColor = '#ecc2a6';
      shadowSkinColor = '#caa186';
    } else if (customStyle === 'masculino') {
      skinColor = '#dfa27a';
      shadowSkinColor = '#c78a63';
    } else {
      skinColor = '#e2b192';
      shadowSkinColor = '#c39577';
    }
  }

  // 1. Draw Shoulders/Body (Claro Uniform Polo)
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 130, height);
  ctx.quadraticCurveTo(width / 2 - 105, height - 100 + breatheY, width / 2 - 45, height - 110 + breatheY);
  ctx.lineTo(width / 2 + 45, height - 110 + breatheY);
  ctx.quadraticCurveTo(width / 2 + 105, height - 100 + breatheY, width / 2 + 130, height);
  ctx.closePath();
  ctx.fill();

  // Highlight shoulder lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 130, height);
  ctx.quadraticCurveTo(width / 2 - 105, height - 100 + breatheY, width / 2 - 45, height - 110 + breatheY);
  ctx.stroke();

  // Claro badge logo on chest (left)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(width / 2 - 100, height - 50 + breatheY, 40, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 8px system-ui, sans-serif';
  ctx.fillText('CLARO', width / 2 - 93, height - 37 + breatheY);

  // V polo collar
  ctx.fillStyle = shirtDarkColor;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 38, height - 110 + breatheY);
  ctx.lineTo(width / 2, height - 85 + breatheY);
  ctx.lineTo(width / 2 + 38, height - 110 + breatheY);
  ctx.lineTo(width / 2, height - 114 + breatheY);
  ctx.closePath();
  ctx.fill();

  // 2. Neck
  ctx.fillStyle = shadowSkinColor;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 24, height - 110 + breatheY);
  ctx.lineTo(width / 2 - 24, height - 145 + breatheY);
  ctx.lineTo(width / 2 + 24, height - 145 + breatheY);
  ctx.lineTo(width / 2 + 24, height - 110 + breatheY);
  ctx.closePath();
  ctx.fill();

  // 3. Head & Face base
  const headX = width / 2;
  const headY = height / 2 - 42 + breatheY;
  const headR = 56;

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 4. Hairstyles & Caps based on selected avatar
  if (type === 'alex') {
    // Red Claro Crew Cap
    ctx.fillStyle = '#ee0000';
    ctx.beginPath();
    ctx.arc(headX, headY - 18, 57, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Cap Visor
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.ellipse(headX + 16, headY - 22, 59, 13, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();

    // Visor circular brand mark
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX - 12, headY - 34, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ee0000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headX - 12, headY - 34, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Dark brown short side hair
    ctx.fillStyle = '#221813';
    ctx.beginPath();
    ctx.arc(headX - 48, headY + 12, 13, 0, Math.PI * 2);
    ctx.arc(headX + 48, headY + 12, 13, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'beatriz') {
    // Dark brown elegant hair curls + high puffy bun
    ctx.fillStyle = '#110c0a';
    ctx.beginPath();
    ctx.arc(headX - 48, headY - 26, 26, 0, Math.PI * 2);
    ctx.arc(headX + 48, headY - 26, 26, 0, Math.PI * 2);
    ctx.arc(headX, headY - 48, 44, 0, Math.PI * 2);
    ctx.fill();

    // Bun top
    ctx.beginPath();
    ctx.arc(headX, headY - 84, 24, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'lucas') {
    // Elegant combover hair (brown)
    ctx.fillStyle = '#482c16';
    ctx.beginPath();
    ctx.moveTo(headX - 58, headY - 12);
    ctx.bezierCurveTo(headX - 62, headY - 62, headX + 12, headY - 78, headX + 52, headY - 48);
    ctx.bezierCurveTo(headX + 62, headY - 32, headX + 58, headY - 12, headX + 42, headY - 42);
    ctx.bezierCurveTo(headX, headY - 52, headX - 42, headY - 32, headX - 58, headY - 12);
    ctx.closePath();
    ctx.fill();

    // Soft style short beard along chin
    ctx.fillStyle = '#301c0c';
    ctx.beginPath();
    ctx.arc(headX, headY + 24, 38, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(headX, headY + 14, 26, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'mariana') {
    // Mariana - Dynamic curly hair
    ctx.fillStyle = '#56351d';
    ctx.beginPath();
    ctx.arc(headX - 48, headY - 12, 29, 0, Math.PI * 2);
    ctx.arc(headX + 48, headY - 12, 29, 0, Math.PI * 2);
    ctx.arc(headX - 38, headY + 28, 23, 0, Math.PI * 2);
    ctx.arc(headX + 38, headY + 28, 23, 0, Math.PI * 2);
    ctx.arc(headX, headY - 50, 40, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'custom') {
    if (customStyle === 'feminino') {
      // Long gorgeous hair or high ponytail
      ctx.fillStyle = '#2b1a13';
      ctx.beginPath();
      // Draw ponytail
      ctx.arc(headX + 46, headY - 12, 28, 0, Math.PI * 2);
      ctx.fill();
      // Side locks of hair
      ctx.beginPath();
      ctx.arc(headX - 48, headY - 12, 18, 0, Math.PI * 2);
      ctx.arc(headX + 48, headY - 12, 18, 0, Math.PI * 2);
      ctx.arc(headX, headY - 50, 42, 0, Math.PI * 2);
      ctx.fill();
    } else if (customStyle === 'masculino') {
      // Modern short haircut with beard style
      ctx.fillStyle = '#1c1512';
      ctx.beginPath();
      ctx.moveTo(headX - 58, headY - 18);
      ctx.bezierCurveTo(headX - 60, headY - 58, headX + 10, headY - 70, headX + 54, headY - 44);
      ctx.bezierCurveTo(headX + 58, headY - 28, headX + 54, headY - 12, headX + 42, headY - 38);
      ctx.bezierCurveTo(headX, headY - 48, headX - 40, headY - 30, headX - 58, headY - 18);
      ctx.closePath();
      ctx.fill();

      // Sharp shadow beard around the jawline
      ctx.fillStyle = 'rgba(28, 21, 18, 0.45)';
      ctx.beginPath();
      ctx.arc(headX, headY + 23, 40, 0, Math.PI);
      ctx.fill();
      // Return skin underneath mouth
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(headX, headY + 14, 28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Neutro: futuristic sleek silver helmet or corporate headband styled sleek avatar
      ctx.fillStyle = '#3a3a46';
      ctx.beginPath();
      ctx.arc(headX, headY - 10, 57, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      
      // Futuristic neon visor style detail
      ctx.fillStyle = 'rgba(0, 238, 238, 0.25)'; // cyan glow
      ctx.beginPath();
      ctx.ellipse(headX, headY - 24, 52, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00eeee';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // 5. Eyes with blinking action
  const stepBlink = (Math.floor(time / 200) % 18 === 0);
  ctx.fillStyle = '#1e1b18';
  const leftEyeX = headX - 19;
  const rightEyeX = headX + 19;
  const eyesY = headY - 4;

  if (stepBlink) {
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leftEyeX - 6, eyesY);
    ctx.lineTo(leftEyeX + 6, eyesY);
    ctx.moveTo(rightEyeX - 6, eyesY);
    ctx.lineTo(rightEyeX + 6, eyesY);
    ctx.stroke();
  } else {
    // Pupils
    ctx.beginPath();
    ctx.arc(leftEyeX, eyesY, 5.5, 0, Math.PI * 2);
    ctx.arc(rightEyeX, eyesY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye catch light highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(leftEyeX - 1.8, eyesY - 1.8, 1.8, 0, Math.PI * 2);
    ctx.arc(rightEyeX - 1.8, eyesY - 1.8, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Glasses for Lucas & Mariana
  if (type === 'lucas' || type === 'mariana') {
    ctx.strokeStyle = '#1a191c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(leftEyeX, eyesY - 1, 11, 0, Math.PI * 2);
    ctx.moveTo(rightEyeX + 11, eyesY - 1);
    ctx.arc(rightEyeX, eyesY - 1, 11, 0, Math.PI * 2);
    ctx.stroke();

    // Bridge connector
    ctx.beginPath();
    ctx.moveTo(leftEyeX + 11, eyesY - 1);
    ctx.lineTo(rightEyeX - 11, eyesY - 1);
    ctx.stroke();
  }

  // 7. Eyebrows
  ctx.strokeStyle = '#281a13';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leftEyeX - 10, eyesY - 13);
  ctx.quadraticCurveTo(leftEyeX, eyesY - 17, leftEyeX + 6, eyesY - 13);
  ctx.moveTo(rightEyeX - 6, eyesY - 13);
  ctx.quadraticCurveTo(rightEyeX, eyesY - 17, rightEyeX + 10, eyesY - 13);
  ctx.stroke();

  // 8. Cheeks (Soft blush overlay)
  ctx.fillStyle = 'rgba(238, 0, 0, 0.11)';
  ctx.beginPath();
  ctx.arc(leftEyeX - 8, eyesY + 16, 12, 0, Math.PI * 2);
  ctx.arc(rightEyeX + 8, eyesY + 16, 12, 0, Math.PI * 2);
  ctx.fill();

  // 9. Nose
  ctx.strokeStyle = shadowSkinColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(headX, eyesY - 1);
  ctx.quadraticCurveTo(headX + 2, eyesY + 12, headX - 2, eyesY + 13);
  ctx.stroke();

  // 10. Dynamic speaking mouth shape (responds instantly to microphone voice)
  const mouthY = headY + 23;
  ctx.fillStyle = '#831e10';
  ctx.strokeStyle = '#5a1107';
  ctx.lineWidth = 2;

  const mouthW = 24 + Math.sin(time * 0.006) * 1.5;
  const mouthH = Math.max(2, mouthOpenRatio * 22);

  if (mouthH <= 4) {
    // Default smiling line
    ctx.beginPath();
    ctx.arc(headX, mouthY - 5, 12, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    // Beautiful interactive ellipse speaking mouth
    ctx.beginPath();
    ctx.ellipse(headX, mouthY, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Upper white teeth line
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.rect(headX - mouthW / 4, mouthY - mouthH / 2, mouthW / 2, mouthH / 4.5);
    ctx.fill();
  }

  // 11. Customer service headset / tech headphones
  ctx.fillStyle = '#1e1e24';
  ctx.beginPath();
  // Left ear cushion
  ctx.ellipse(headX - headR + 1, headY + 4, 8, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Metal headset band
  ctx.strokeStyle = '#222226';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(headX, headY - 8, headR + 1, Math.PI, 1.83 * Math.PI, false);
  ctx.stroke();

  // Microphone boom arm extending to the mouth
  ctx.strokeStyle = '#2d2d34';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(headX - headR + 2, headY + 8);
  ctx.quadraticCurveTo(headX - headR + 11, headY + 26, headX - 9, headY + 25);
  ctx.stroke();

  // Highlighted red recording state mic tip
  ctx.fillStyle = '#ea4335';
  ctx.beginPath();
  ctx.arc(headX - 9, headY + 25, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 12. Corporate metadata watermark overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.fillText('AMB BIOMETRIC BYPASS ACTIVE', 20, 26);
  ctx.fillStyle = mouthH > 4 ? '#ff5555' : '#888888';
  ctx.fillText(`MIC MODULATION: ${mouthH > 4 ? 'CAPTURE' : 'STANDBY'}`, 20, 39);

  if (customPhoto) {
    // Clean preview of the uploaded image at the top right as a "Biometric source" reference
    try {
      const img = new Image();
      img.src = customPhoto;
      ctx.save();
      ctx.beginPath();
      ctx.arc(width - 50, 60, 24, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, width - 74, 36, 48, 48);
      ctx.restore();

      // Cyber ring frame around it
      ctx.strokeStyle = '#22c55e'; // Green compliance glow
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(width - 50, 60, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Hologram overlay label
      ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
      ctx.fillRect(width - 74, 90, 48, 12);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 7px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FONTE OK', width - 50, 99);
      ctx.textAlign = 'left'; // Restore
    } catch (e) {
      // Fallback if image fails to render
    }
  }
};

const MAX_RECORDING_TIME = 60; // 60 segundos máximo

export const Recorder: React.FC<RecorderProps> = ({ onComplete, onCancel, scenario, techName, mode, user }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingCanvasLoopRef = useRef<(() => void) | null>(null);
  
  const [localMode, setLocalMode] = useState<EvalMode>(mode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_RECORDING_TIME);
  const chunks = useRef<Blob[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [showScopeInfo, setShowScopeInfo] = useState(false);
  const [activeTipTab, setActiveTipTab] = useState<'body' | 'voice'>('body');

  // Privacy Avatar States - Default to user preference or true to fully respect tech image rights!
  const [useAvatar, setUseAvatar] = useState(user?.useAvatar !== false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<'alex' | 'beatriz' | 'lucas' | 'mariana' | 'custom'>(user?.defaultAvatar || 'alex');

  // Web Audio refs for lipsync
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Transcrição de fala em tempo real capturada pelo microfone
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const liveTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  const LINE_HEIGHT = window.innerWidth < 768 ? 60 : 80;
  const firstName = techName.split(' ')[0];

  const stopTracks = () => {
    // Teardown Web Audio stream analyser
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(e => console.warn(e));
      } catch (err) {
        console.warn("AudioContext closed warning");
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn("Erro ao parar track:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (e) {
      console.warn("Falha ao inicializar o analisador de voz para lip sync:", e);
    }
  };

  const startCamera = async () => {
    try {
      stopTracks();

      // Configuração otimizada para o formato vertical de celular (3:4 retrato)
      let constraints: MediaStreamConstraints;

      if (useAvatar) {
        // MICROPHONE ONLY - Safeguards user's camera privacy completely
        constraints = {
          video: false,
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            channelCount: 1 
          } 
        };
      } else {
        // Standard physical camera constraints
        constraints = {
          video: { 
            facingMode: 'user', 
            width: { ideal: 360 }, 
            height: { ideal: 480 },
            aspectRatio: { ideal: 0.75 },
            frameRate: { ideal: 24, max: 30 }
          }, 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            channelCount: 1 
          } 
        };
      }

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;

      if (!useAvatar && videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(e => console.warn("Erro ao iniciar vídeo:", e));
      }

      // Always spin up audio analyser for dynamic responsive mouth/ripple effects
      startAudioAnalyser(s);

    } catch (err: any) {
      console.error("Erro ao acessar mídia:", err);
      if (err.name === 'NotReadableError' || err.message?.includes('in use') || err.name === 'NotAllowedError') {
        alert("A câmera ou o microfone parecem estar em uso ou bloqueados. Verifique as permissões de acesso.");
      } else {
        alert("Não foi possível acessar seus dispositivos de gravação. Tente recarregar a página.");
      }
      onCancel();
    }
  };

  useEffect(() => {
    if (authorized) {
      startCamera();
    }
    return () => {
      stopTracks();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [authorized, useAvatar]);

  // Garante que o elemento <video> receba o stream da câmera sempre que estiver montado
  useEffect(() => {
    if (!useAvatar && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(e => console.warn("Auto-play stream:", e));
    }
  }, [useAvatar, authorized, isRecording, previewUrl]);

  // Real-time animation render loop for the digital avatar
  useEffect(() => {
    let animationFrameId: number;
    let mouthRatio = 0;

    const renderLoop = () => {
      const canvas = liveCanvasRef.current;
      if (canvas && useAvatar && !previewUrl) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Calculate volume or simulate if muted
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            // Map the average frequency strength smoothly
            const targetMouth = Math.min(avg / 42, 1.4);
            mouthRatio = mouthRatio * 0.55 + targetMouth * 0.45;
          } else {
            mouthRatio = mouthRatio * 0.85;
          }

          drawAvatar(
            ctx,
            selectedAvatarId,
            canvas.width || 360,
            canvas.height || 480,
            mouthRatio,
            Date.now(),
            user?.customAvatarStyle,
            user?.customAvatarPhoto
          );
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (useAvatar && authorized && !previewUrl) {
      const canvas = liveCanvasRef.current;
      if (canvas) {
        if (!canvas.width) canvas.width = 360;
        if (!canvas.height) canvas.height = 480;
      }
      renderLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useAvatar, authorized, previewUrl, selectedAvatarId, isRecording]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });

        if (localMode === 'script') {
          setActiveLine(prev => {
            if (prev < (fullScript?.length || 0) - 1) return prev + 1;
            return prev;
          });
        }
      }, localMode === 'script' ? 4500 : 1000);
    } else {
      setTimeLeft(MAX_RECORDING_TIME);
      setActiveLine(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, localMode]);

  const handleStartRecording = () => {
    if (!streamRef.current || (!useAvatar && !videoRef.current)) {
      startCamera();
      return;
    }

    // Tenta priorizar formatos com melhor suporte
    const mimeTypes = [
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm'
    ];
    
    const mimeType = mimeTypes.find(type => {
      try {
        return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type);
      } catch (e) {
        return false;
      }
    }) || '';

    let recordStream: MediaStream;

    if (useAvatar && liveCanvasRef.current) {
      const canvas = liveCanvasRef.current;
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(24) : (canvas as any).mozCaptureStream?.(24);
      recordStream = new MediaStream();

      const videoTrack = canvasStream?.getVideoTracks()[0];
      if (videoTrack) {
        recordStream.addTrack(videoTrack);
      }

      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        recordStream.addTrack(audioTrack.clone());
      }
    } else {
      // Gravação direta do stream da câmera física/webcam com áudio integrado
      // Evita sobrecarga de CPU, lags e tela preta em dispositivos móveis
      recordStream = streamRef.current;
    }

    chunks.current = [];
    try {
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      options.videoBitsPerSecond = 250000;
      options.audioBitsPerSecond = 64000;

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(recordStream, options);
      } catch (optErr) {
        recorder = new MediaRecorder(recordStream);
      }

      recorder.ondataavailable = (e) => { 
        if (e.data && e.data.size > 0) chunks.current.push(e.data); 
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(chunks.current, { type: finalType });
        console.log(`Gravação otimizada concluída. Tipo: ${finalType}, Tamanho original otimizado: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopTracks();
      };

      recorder.start(1000); 
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Iniciar captura de fala pelo microfone com SpeechRecognition
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.lang = 'pt-BR';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (ev: any) => {
            let full = '';
            for (let i = 0; i < ev.results.length; i++) {
              full += ev.results[i][0].transcript + ' ';
            }
            liveTranscriptRef.current = full.trim();
            setLiveTranscript(full.trim());
          };
          rec.onerror = () => {};
          rec.start();
          recognitionRef.current = rec;
        }
      } catch (errRec) {
        console.warn("SpeechRecognition não disponível:", errRec);
      }
    } catch (e) {
      console.error("Erro ao iniciar MediaRecorder:", e);
      try {
        const recorder = new MediaRecorder(streamRef.current);
        recorder.ondataavailable = (e) => { 
          if (e.data && e.data.size > 0) chunks.current.push(e.data); 
        };
        recorder.onstop = () => {
          const finalType = recorder.mimeType || 'video/webm';
          const blob = new Blob(chunks.current, { type: finalType });
          setRecordedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopTracks();
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        liveTranscriptRef.current = '';
        setLiveTranscript('');
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRec) {
            const rec = new SpeechRec();
            rec.lang = 'pt-BR';
            rec.continuous = true;
            rec.interimResults = true;
            rec.onresult = (ev: any) => {
              let full = '';
              for (let i = 0; i < ev.results.length; i++) {
                full += ev.results[i][0].transcript + ' ';
              }
              liveTranscriptRef.current = full.trim();
              setLiveTranscript(full.trim());
            };
            rec.onerror = () => {};
            rec.start();
            recognitionRef.current = rec;
          }
        } catch (errRec) {}
      } catch (errInner) {
        alert("Erro crítico ao inicializar câmera. Verifique as permissões do microfone e da câmera.");
      }
    }
  };

  const handleStopRecording = () => {
    if (recordingCanvasLoopRef.current) {
      recordingCanvasLoopRef.current();
      recordingCanvasLoopRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRepeat = () => {
    setRecordedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    setActiveLine(0);
    setTimeLeft(MAX_RECORDING_TIME);
    startCamera();
  };

  const getFullScript = () => {
    if (!scenario) return [];
    const name = scenario.customerName;
    const intro = `Oi ${name}, tudo bem? Sou o ${firstName}, técnico da Claro.`;
    
    // Switch por id do cenário para dar roteiros extremamente focados na dúvida exata!
    switch(scenario.id) {
      case '1': // Dona Helena (Comando de vos / Netflix)
        return [
          intro,
          `O Claro TV+ é realmente incrível.`,
          `O controle tem comando de voz integrado.`,
          `Aperte o microfone e diga o que quer ver.`,
          `Diga "Netflix" e o app abre na hora!`,
          `Não precisa mais decorar números de canais.`,
          `Tudo o que a senhora gosta em um só lugar.`,
          `Ficou claro como essa facilidade vai ajudar?`
        ];
      case '2': // Dr. Marcos (Wi-Fi Mesh)
        return [
          `Oi Dr. Marcos, sou o ${firstName} da Claro e vou resolver seu sinal.`,
          `Para telemedicina, estabilidade é fundamental.`,
          `O Wi-Fi Mesh cria uma malha inteligente na casa.`,
          `Diferente de um repetidor, não derruba a velocidade.`,
          `Mantém o sinal forte aqui e no andar de cima.`,
          `Sem precisar passar cabos ou fazer obra.`,
          `Podemos testar agora e verá que a oscilação acabou.`,
          `O que achou dessa solução definitiva?`
        ];
      case '3': // Enzo (Gamer Link / Wi-Fi 6)
        return [
          `E aí Enzo! Sou o ${firstName}, técnico da Claro. Bora baixar esse ping?`,
          `O Wi-Fi 6 é tecnologia de ponta para gamers.`,
          `Ele usa frequências limpas, evitando o lag.`,
          `Nossa rede tem baixa latência (jitter).`,
          `Sua reação no FPS será muito mais rápida.`,
          `Larga banda permite jogar enquanto outros veem 4K.`,
          `É o setup ideal para performance competitiva.`,
          `Sentiu a diferença na estabilidade agora?`
        ];
      case '4': // Seu Roberto (Band Steering e 2.4 / 5Ghz)
        return [
          `Oi Seu Roberto! Sou o ${firstName} da Claro. Vim tirar suas dúvidas.`,
          `O Band Steering é um recurso inteligente do seu roteador.`,
          `Ele une as redes de 2.4Ghz e 5Ghz em um único nome de Wi-Fi.`,
          `Assim, o senhor não precisa ficar trocando de rede no celular.`,
          `A frequência de 2.4Ghz alcança distâncias maiores pela casa toda.`,
          `Já a rede de 5Ghz entrega ultravelocidade de perto.`,
          `Nosso modem gerencia essa troca sozinho de forma automática.`,
          `Ficou claro como essa tecnologia facilita seu dia a dia?`
        ];
      case '5': // Dona Sandra (IoT e Casa Conectada)
        return [
          `Olá Dona Sandra! Sou o ${firstName} da Claro. Vamos conectar sua casa.`,
          `IoT significa internet das coisas: lâmpadas, câmeras e sensores.`,
          `Eles usam a rede de 2.4Ghz porque priorizam o longo alcance.`,
          `Nossa rede inteligente gerencia tudo isso ao mesmo tempo.`,
          `Com o Wi-Fi Mesh da Claro, o sinal cobre toda a casa sem queda.`,
          `Suas lâmpadas e câmeras não vão mais desconectar.`,
          `Sua casa inteligente vai ficar 100% estável e ágil.`,
          `O que a senhora achou dessa estabilidade para sua rotina?`
        ];
      case '6': // Patrícia (Replay TV e Gravação em Nuvem)
        return [
          `Oi Patrícia! Sou o ${firstName} da Claro. Vou tirar suas dúvidas sobre a TV.`,
          `O Replay TV permite voltar os canais em até sete dias atrás.`,
          `Assim você assiste ao telejornal no horário em que puder.`,
          `A Gravação em Nuvem armazena seus programas de forma digital.`,
          `O conteúdo fica salvo online, nos servidores da Claro.`,
          `Por isso, não precisa comprar HD externo ou aparelhos extras.`,
          `Tudo fica disponível na TV, no tablet e no celular!`,
          `Essa flexibilidade vai se adequar melhor à rotina da casa?`
        ];
      default:
        // Fallback por produto se for um id desconhecido
        switch(scenario.product) {
          case 'TV': return [intro, `O Claro TV+ é realmente incrível.`, `O controle tem comando de voz integrado.`, `Aperte o microfone e diga o que quer ver.`, `Não precisa mais decorar números de canais.`, `Tudo o que gosta em um só lugar.`, `Ficou claro como essa facilidade vai ajudar?` ];
          case 'Mesh': return [`Oi, sou o ${firstName} da Claro e vou resolver seu sinal.`, `O Wi-Fi Mesh cria uma malha inteligente na casa.`, `Mantém o sinal forte sem precisar passar cabos ou fazer obra.`, `O que achou dessa solução definitiva?` ];
          case 'Virtua': return [`Oi, sou o ${firstName}, técnico da Claro.`, `O Wi-Fi 6 é tecnologia de ponta.`, `Nossa rede tem baixíssima latência.`, `Sentiu a diferença na estabilidade agora?` ];
          default: return [`Olá ${name}, sou o ${firstName}, técnico da Claro.`, `Nossos produtos facilitam sua vida.`, `A Claro agradece a sua confiança.`, `Tudo certo com a sua conexão?` ];
        }
    }
  };

  const fullScript = getFullScript();

  return (
    <>
      {!authorized && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border-4 border-[#ee0000] text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-[#ee0000] mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674a1 1 0 00.922-.618l2.7-6.187a1 1 0 00-.922-1.395H13.43l.73-4.38a1 1 0 00-1.747-.852l-6.407 8.01a1 1 0 00.787 1.629h4.105l-1.932 4.182a1 1 0 00.922 1.41z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Iniciar Prática</h2>
              <p className="text-xs font-black text-[#ee0000] tracking-widest uppercase">Configure sua simulação</p>
            </div>

            {/* Configuração da Câmera */}
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3.5 space-y-2 text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Configuração da Câmera</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseAvatar(true)}
                  className={`flex-1 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                    useAvatar
                      ? 'bg-green-650 border-green-650 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span>🛡️ AVATAR DIGITAL</span>
                  <span className="text-[7px] opacity-80 font-bold uppercase tracking-tight block">Identidade Preservada</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUseAvatar(false)}
                  className={`flex-1 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                    !useAvatar
                      ? 'bg-gray-850 border-gray-850 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span>📷 WEBCAM REAL</span>
                  <span className="text-[7px] opacity-80 font-bold uppercase tracking-tight block">Uso de Webcam</span>
                </button>
              </div>
              
              {useAvatar ? (
                <p className="text-[9.5px] text-gray-400 font-medium leading-snug">
                  🛡️ Modo Avatar Ativo: Um avatar animado 2D imitará sua fala a partir da sua voz.
                </p>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-gray-150 space-y-1.5 animate-fadeIn">
                  <span className="text-[8px] font-black text-[#ee0000] uppercase tracking-wider block">Uso de Câmera</span>
                  <p className="text-[9.5px] text-gray-500 leading-relaxed font-semibold">
                    Os dados de vídeo são processados para fins de treinamento e avaliação pedagógica pela IA.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button 
                onClick={() => setAuthorized(true)} 
                className="w-full py-4 rounded-full bg-[#ee0000] text-white font-black text-xs tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
              >
                INICIAR PRÁTICA ➜
              </button>
              <button 
                onClick={onCancel} 
                className="w-full py-3 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-extrabold text-xs tracking-widest transition-all"
              >
                VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showScopeInfo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border-4 border-[#ee0000] text-center space-y-6 animate-scaleUp">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-[#ee0000] mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Escopo do Explica+ IA Vision</h2>
              <p className="text-[10px] font-black text-[#ee0000] tracking-widest uppercase">Parâmetros de Análise de IA</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left h-[260px] overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-4">
              <p className="text-[10px] uppercase font-black tracking-widest text-[#ee0000] -mb-1">O que a IA avalia e como funciona:</p>
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <span className="text-[#ee0000] text-sm leading-none select-none">🎙️</span>
                  <div>
                    <p className="font-extrabold text-gray-800 text-[11px] uppercase">Transcrição de Voz (NLP)</p>
                    <p className="text-gray-500 text-[10px] leading-snug">O vídeo gravado é processado para extrair e transcrever as suas falas, avaliando se os argumentos técnicos sobre os produtos Claro foram corretos.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[#ee0000] text-sm leading-none select-none">📊</span>
                  <div>
                    <p className="font-extrabold text-gray-800 text-[11px] uppercase">Postura e Expressividade</p>
                    <p className="text-gray-500 text-[10px] leading-snug">Reconhece expressões receptivas (como sorriso) e a vivacidade de postura e atitude ao explicar os planos e benefícios ao cliente.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[#ee0000] text-sm leading-none select-none">⚡</span>
                  <div>
                    <p className="font-extrabold text-gray-800 text-[11px] uppercase">Clareza & Comunicação</p>
                    <p className="text-gray-500 text-[10px] leading-snug">A IA mede a clareza verbal, o ritmo de fala e construção de pausas de escuta para garantir que a explicação do produto seja fluida.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[#ee0000] text-sm leading-none select-none">🎯</span>
                  <div>
                    <p className="font-extrabold text-gray-800 text-[11px] uppercase">Sincronia com Roteiro</p>
                    <p className="text-gray-500 text-[10px] leading-snug">No modo "Com Roteiro", a IA audita se você leu e incorporou os tópicos essenciais demonstrados no teleprompter.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[#ee0000] text-sm leading-none select-none">🛡️</span>
                  <div>
                    <p className="font-extrabold text-gray-800 text-[11px] uppercase">Políticas de Segurança</p>
                    <p className="text-gray-500 text-[10px] leading-snug">As gravações e análises são em caráter restrito e efêmero, com processamento via canais seguros da API do Google Gemini, preservando total sigilo.</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowScopeInfo(false)} 
              className="w-full py-3.5 rounded-full bg-gray-950 hover:bg-gray-900 text-white font-black text-[10px] tracking-widest transition-all active:scale-95 shadow-md uppercase"
            >
              Entendido e Fechar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4 animate-fadeIn max-w-6xl mx-auto pb-10 px-2 md:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                localMode === 'knowledge' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {localMode === 'knowledge' ? 'Etapa 1/2: Conhecimento' : 'Etapa 2/2: Com Roteiro'}
              </span>
              <h2 className="text-xs font-black claro-text-red uppercase tracking-widest truncate">{scenario?.title}</h2>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Cliente: {scenario?.customerName}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
             <button 
               type="button"
               onClick={() => setShowScopeInfo(true)}
               className="p-1.5 px-2.5 sm:px-3 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-gray-200 cursor-pointer"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Escopo IA
             </button>
             {isRecording && <span className="text-xs font-black text-red-600 animate-pulse">{timeLeft}s</span>}
             <div className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
               localMode === 'knowledge' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'
             }`}>
               {localMode === 'knowledge' ? '1ª Sem Roteiro' : '2ª Teleprompter'}
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          <div className="flex flex-col space-y-4 w-full">
            <div className="relative aspect-[3/4] bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
              {!previewUrl ? (
                useAvatar ? (
                  <canvas ref={liveCanvasRef} width={360} height={480} className="w-full h-full object-cover" />
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
                    className="w-full h-full object-cover mirror" 
                  />
                )
              ) : (
                <video src={previewUrl} controls playsInline className="w-full h-full object-cover" />
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full text-white text-[9px] font-black animate-pulse z-20 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  GRAVANDO...
                </div>
              )}

              {/* Integrated Teleprompter Overlay during Live Capture */}
              {localMode === 'script' && !previewUrl && (
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col justify-end z-10 p-4 pb-6 select-none pointer-events-none">
                  {/* Floating modern frosted glass teleprompter container */}
                  <div className="w-full bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 h-[110px] relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-1 left-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[7.5px] font-black text-white/50 tracking-widest uppercase">Teleprompter Integrado</span>
                    </div>

                    <div className="absolute top-1 right-2.5">
                      <span className="text-[7.5px] font-black text-red-500/90 tracking-widest uppercase">Passo {activeLine + 1}/{fullScript.length}</span>
                    </div>

                    {/* Laser guidance target frame around center line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[32px] bg-red-500/5 border-y border-red-500/20 pointer-events-none z-0 flex items-center justify-between px-2">
                      <span className="text-[8px] text-[#ee0000] font-black animate-pulse">▶</span>
                      <span className="text-[8px] text-[#ee0000] font-black animate-pulse">◀</span>
                    </div>

                    <div className="relative h-[72px] overflow-hidden mt-3 text-center z-10">
                      <div
                        className="absolute left-0 w-full transition-transform duration-700 ease-out"
                        style={{ transform: `translateY(-${activeLine * 36 - 18}px)` }}
                      >
                        {fullScript.map((line, idx) => {
                          const isCurrent = idx === activeLine;
                          const isNext = idx === activeLine + 1;
                          const isPrev = idx === activeLine - 1;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-center px-4 transition-all duration-500 h-[36px] leading-tight ${
                                isCurrent
                                  ? 'text-white text-xs font-black opacity-100 scale-100'
                                  : isNext || isPrev
                                    ? 'text-white/40 text-[9.5px] font-semibold opacity-35 scale-95'
                                    : 'text-white/10 text-[8px] font-medium opacity-5 scale-90'
                              }`}
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls right below the video */}
            <div className="flex flex-col gap-3">
              {!previewUrl ? (
                <button 
                  onClick={isRecording ? handleStopRecording : handleStartRecording} 
                  disabled={!authorized}
                  className={`w-full py-4 rounded-full border-4 font-black text-sm tracking-widest cursor-pointer transition-all shadow-lg ${
                    !authorized 
                    ? 'border-gray-100 bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isRecording 
                      ? 'border-red-600 bg-white text-red-600 hover:bg-red-50 animate-pulse' 
                      : 'border-red-100 bg-[#ee0000] text-white hover:bg-red-700 active:scale-95'
                  }`}
                >
                  {isRecording ? '⏹ FINALIZAR / PARAR' : 'GRAVAR AGORA'}
                </button>
              ) : (
                <div className="space-y-3 w-full">
                  {liveTranscript && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-left">
                      <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[10px] uppercase mb-1">
                        <span>🎙️ Fala capturada pelo microfone:</span>
                      </div>
                      <p className="text-xs text-gray-700 italic line-clamp-2">"{liveTranscript}"</p>
                    </div>
                  )}
                  <div className="w-full flex gap-2">
                    <button onClick={handleRepeat} className="flex-1 bg-gray-100 text-gray-600 font-black text-[10px] uppercase py-4 rounded-2xl">REPETIR</button>
                    <button 
                      onClick={() => {
                        if (!recordedBlob) {
                          alert("Erro: Nenhum vídeo foi gravado. Por favor, tente gravar novamente.");
                          return;
                        }
                        if (recordedBlob.size === 0) {
                          alert("Erro: O vídeo gravado está vazio. Verifique sua câmera e microfone e tente novamente.");
                          return;
                        }
                        if (recordedBlob.size > 20 * 1024 * 1024) {
                          alert("Erro: O vídeo excedeu o limite de tamanho (20MB). Por favor, grave um vídeo mais curto.");
                          return;
                        }
                        onComplete(recordedBlob, localMode, liveTranscriptRef.current);
                      }} 
                      className="flex-[1.5] claro-red text-white font-black text-[10px] uppercase py-4 rounded-2xl shadow-lg"
                    >
                      ENVIAR PARA IA
                    </button>
                  </div>
                </div>
              )}

              {/* Botões de Seleção de Câmera / Avatar */}
              {!previewUrl && !isRecording && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setUseAvatar(true)}
                    className={`py-3 px-3 text-[11px] font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 border-2 ${
                      useAvatar
                        ? 'bg-[#ee0000] text-white border-[#ee0000] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>🛡️</span> Usar Avatar Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAvatar(false)}
                    className={`py-3 px-3 text-[11px] font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 border-2 ${
                      !useAvatar
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>📷</span> Câmera Real (Webcam)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dicas de Especialista: Exibido apenas ANTES de iniciar a gravação e sem vídeo gravado ainda */}
          {!isRecording && !previewUrl && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-[28px] p-5 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Dicas do Especialista Claro</h4>
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Prepare sua postura e clareza de fala antes do play!</p>
                </div>
              </div>

              {/* Mini Tabs Selector */}
              <div className="flex bg-amber-100/50 p-1 rounded-full border border-amber-200/40">
                <button
                  type="button"
                  onClick={() => setActiveTipTab('body')}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 ${
                    activeTipTab === 'body'
                      ? 'bg-white text-amber-950 shadow-sm'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <span>👁️</span> Linguagem Corporal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTipTab('voice')}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 ${
                    activeTipTab === 'voice'
                      ? 'bg-white text-amber-950 shadow-sm'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <span>🗣️</span> Clareza & Voz
                </button>
              </div>

              {/* Dynamic Content */}
              <div className="space-y-3 pt-1">
                {activeTipTab === 'body' ? (
                  <div className="space-y-3.5">
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Olhar na Câmera (Contato Visual)</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Não olhe para a sua própria imagem na tela. Ao fitar diretamente a lente da câmera do aparelho, você simula um contato visual direto, o que transmite extrema segurança e franqueza ao cliente.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Expressão Corporal Livre</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Mantenha os ombros relaxados e a coluna ativa. Gesticular de forma ponderada com as mãos ajuda a sustentar o argumento e traz vivacidade natural à sua pronúncia.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Sorriso Conectador (Gatilho de Empatia)</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Inicie a simulação com um expressão suave e amigável. O "sorriso verbal" transborda até pela voz e desarma eventuais objeções preliminares do cliente.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Ritmo e Respiração (Voice Control)</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Fale pausadamente. Deixar frações de silêncio para respiração dá tempo ao cliente para assimilar o valor do produto e demonstra profissionalismo maduro.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Elimine Termos Ultra-Técnicos (Metáfora Simples)</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Evite falar jargões como "fibra ótica coerente" ou "cabo coaxial multitap". Use termos intuitivos: em vez de falar MHz, fale sobre ter "rodovias livres sem lentidão na casa toda".</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-amber-600 font-extrabold text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight">Ganchos de Fechamento</p>
                        <p className="text-[10px] text-amber-800 leading-snug">Sempre conclua blocos da simulação com perguntas curtas de verificação. Exemplos: *"Me conte, como essa melhora na velocidade vai agilizar o seu dia a dia?"* ou *"Ficou clara essa vantagem para o senhor?"*.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col min-h-[300px] w-full">
            {localMode === 'script' ? (
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 flex flex-col space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="text-left">
                    <span className="text-[#ee0000] text-[8.5px] font-black uppercase tracking-wider block">Roadmap de Vendas</span>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Roteiro Completo de Simulação</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-[8px] text-[#ee0000] font-black rounded-full uppercase tracking-wider">
                    {fullScript.length} Passos
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {fullScript.map((line, idx) => {
                    const isPassed = idx < activeLine;
                    const isCurrent = idx === activeLine;
                    return (
                      <div 
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left ${
                          isCurrent 
                            ? 'bg-red-50/20 border-red-200 text-[#ee0000] shadow-sm font-bold' 
                            : isPassed
                              ? 'bg-gray-50/50 border-gray-100 text-gray-400 font-medium'
                              : 'bg-white border-transparent text-gray-600 font-medium'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isCurrent 
                            ? 'bg-[#ee0000] text-white font-extrabold animate-pulse' 
                            : isPassed
                              ? 'bg-green-100 text-green-600 font-extrabold'
                              : 'bg-gray-100 text-gray-450 font-bold'
                        }`}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <p className={`text-xs leading-snug ${isCurrent ? 'font-black' : ''}`}>{line}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-gray-150 text-left">
                  <span className="text-xs">💡</span>
                  <p className="text-[9.5px] text-gray-400 leading-normal font-bold uppercase tracking-tight">
                    Dica: Olhe fixamente para a câmera ou para o <strong className="text-[#ee0000]">Teleprompter Integrado</strong> no vídeo para fixar seu contato visual!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[32px] shadow-sm border-2 border-orange-200/80 flex-1 flex flex-col items-center justify-center p-7 text-center space-y-3">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl shadow-inner">
                  🧠
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    Etapa 1 de 2: Espontânea
                  </span>
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Desafio Conhecimento</h3>
                </div>
                <p className="text-xs text-gray-600 font-medium max-w-sm leading-relaxed">
                  Nesta primeira etapa, o roteiro está oculto para avaliar sua espontaneidade e domínio técnico.
                </p>
                <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-100 text-left w-full max-w-sm flex items-start gap-2">
                  <span className="text-sm">🎯</span>
                  <p className="text-[10px] text-orange-800 font-bold leading-snug">
                    Após o feedback da IA, você irá para a <strong>2ª Etapa (Desafio com Roteiro)</strong> com o Teleprompter ativo para comparar a evolução!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
