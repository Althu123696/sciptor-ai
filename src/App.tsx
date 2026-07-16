 import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw,
  Volume2, 
  VolumeX, 
  Globe, 
  Download, 
  Copy, 
  Sparkles, 
  Check, 
  Loader2, 
  Users, 
  Clock, 
  History, 
  Menu, 
  X, 
  Edit2, 
  Plus, 
  Trash2, 
  CheckSquare, 
  ChevronRight, 
  Languages, 
  ListTodo, 
  FileJson, 
  FileText,
  PenTool,
  Volume1,
  MessageSquare,
  Send,
  LogOut,
  Sliders,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface TranscriptSegment {
  id: string;
  timestamp: string; // e.g. "00:15"
  speaker: string; // e.g. "Speaker A"
  text: string;
}

interface SavedTranscription {
  id: string;
  title: string;
  language: string;
  duration: string;
  segments: TranscriptSegment[];
  source: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Toast {
  message: string;
  type: 'success' | 'info' | 'error';
}

const PRELOADED_DRAFTS: SavedTranscription[] = [
  {
    id: 'draft-welcome',
    title: '🚀 Scriptor AI Onboarding Welcome',
    language: 'English',
    duration: '00:15',
    source: 'Preloaded Onboarding Demo',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    segments: [
      { id: 'welcome-1', timestamp: '00:01', speaker: 'Speaker A (Host)', text: "Welcome to Scriptor AI, your unified transcription and speaker diarization station." },
      { id: 'welcome-2', timestamp: '00:05', speaker: 'Speaker B (Guest)', text: "It's wonderful to be here. Scriptor AI is incredible for analyzing research sessions, podcasts, and video meetings." },
      { id: 'welcome-3', timestamp: '00:11', speaker: 'Speaker A (Host)', text: "Exactly. With Gemini 3.5 Flash, users get real-time speaker detection, high accuracy, and integrated translation tools instantly." }
    ]
  },
  {
    id: 'draft-interview',
    title: '💡 Local Intelligence Dev Interview',
    language: 'English',
    duration: '00:26',
    source: 'Evelyn AI Lab Session',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    segments: [
      { id: 'int-1', timestamp: '00:00', speaker: 'Interviewer', text: "Thank you for joining us today. Could you start by describing your vision for decentralized AI?" },
      { id: 'int-2', timestamp: '00:06', speaker: 'Dr. Evelyn', text: "Absolutely. I believe the future of AI is local-first. We need model execution on edge devices to preserve user privacy." },
      { id: 'int-3', timestamp: '00:14', speaker: 'Interviewer', text: "But what about computational limitations? Most devices lack high-powered GPUs." },
      { id: 'int-4', timestamp: '00:20', speaker: 'Dr. Evelyn', text: "That is where quantized distillation comes in. We can compile specialized models that require 90% less memory while retaining 95% performance." }
    ]
  },
  {
    id: 'draft-meeting',
    title: '📈 Q3 Product Sprint Alignment',
    language: 'English',
    duration: '00:30',
    source: 'Corporate Sync Audio',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    segments: [
      { id: 'meet-1', timestamp: '00:00', speaker: 'Sarah (Product)', text: "Okay, let's align on the Q3 roadmap. Our primary goal is lowering the first-input-delay on the player widget." },
      { id: 'meet-2', timestamp: '00:07', speaker: 'David (Engineer)', text: "Right. The dynamic waveform rendering is taking up too much main-thread CPU. I suggest moving it to a Web Worker." },
      { id: 'meet-3', timestamp: '00:15', speaker: 'Elena (Design)', text: "That sounds great, David. Can we also refine the micro-animations so they feel snappier on mobile screens?" },
      { id: 'meet-4', timestamp: '00:22', speaker: 'Sarah (Product)', text: "Perfect. Elena, please draft the Figma layout by Tuesday. David, prepare the worker prototype for review." }
    ]
  }
];

export default function App() {
  const [savedTranscriptions, setSavedTranscriptions] = useState<SavedTranscription[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Audio Player states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15); // Default duration for mock playback
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [sessionAudioUrls, setSessionAudioUrls] = useState<Record<string, string>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  
  // Microphone recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [isMicMonitorEnabled, setIsMicMonitorEnabled] = useState<boolean>(true);

  // Settings
  const [language, setLanguage] = useState<string>('English');
  const [speakerCount, setSpeakerCount] = useState<number>(2);
  const [diarizationEnabled, setDiarizationEnabled] = useState<boolean>(true);

  // App Layout States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [selectedLanguageForTranslation, setSelectedLanguageForTranslation] = useState<string>('Spanish');

  // AI & Processing States
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiActionResult, setAiActionResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'translate' | 'writer' | 'chat'>('summary');

  // Scriptor Co-Writer and Adaptive Recording states
  const [creativeType, setCreativeType] = useState<string>('Story');
  const [creativePrompt, setCreativePrompt] = useState<string>('');
  const [useTranscriptForCreative, setUseTranscriptForCreative] = useState<boolean>(true);
  const [creativeResult, setCreativeResult] = useState<string | null>(null);
  const [isGeneratingCreative, setIsGeneratingCreative] = useState<boolean>(false);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');

  // Editing segments states
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState<string>('');
  const [isEditingFullText, setIsEditingFullText] = useState<boolean>(false);
  const [fullTextDraft, setFullTextDraft] = useState<string>('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-init',
      role: 'assistant',
      content: "Hello. I am **DocAssist**, Scriptor's premium transcription companion. I analyze the active transcript for speaker interactions, sentiment, summaries, and complex code reviews. Ask me anything!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Toast State
  const [toast, setToast] = useState<Toast | null>(null);

  // --- Auth, Feedback & Admin State Variables ---
  const [currentUser, setCurrentUser] = useState<{ email: string; role: 'admin' | 'user'; usedSeconds: number } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin View State
  const [adminData, setAdminData] = useState<{ users: any[]; feedbacks: any[]; logs: any[]; settings: any } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [monthlyLimitSeconds, setMonthlyLimitSeconds] = useState(4500);

  // Feedback Submission State
  const [feedbackTopic, setFeedbackTopic] = useState('Transcription Accuracy & Quality');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Active Main Panel View
  const [activeMainView, setActiveMainView] = useState<'workspace' | 'admin' | 'feedback' | 'privacy'>('workspace');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mockPlaybackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // --- Auth, Feedback & Admin Helpers ---
  const fetchAdminDashboard = async (email: string) => {
    setAdminLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: email })
      });
      const data = await response.json();
      if (response.ok) {
        setAdminData(data);
        setMonthlyLimitSeconds(data.settings.monthlyLimitSeconds);
      } else {
        showToast(data.error || 'Failed to load admin controls', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error communicating with administration server', 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup' && !privacyAccepted) {
      setAuthError('You must agree to the Privacy Policy to create credentials.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    
    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('scriptor_user_email', data.email);
        setCurrentUser(data);
        showToast(`Authenticated as ${data.email}!`, 'success');
        if (data.role === 'admin') {
          fetchAdminDashboard(data.email);
        }
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (e) {
      setAuthError('Server connection issue. Please verify backend is active.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('scriptor_user_email');
    setCurrentUser(null);
    setAdminData(null);
    setAuthEmail('');
    setAuthPassword('');
    setActiveMainView('workspace');
    showToast('Logged out successfully', 'info');
  };

  const handleUpdateLimit = async (limitSeconds: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, monthlyLimitSeconds: limitSeconds })
      });
      const data = await response.json();
      if (response.ok) {
        setMonthlyLimitSeconds(limitSeconds);
        if (adminData) {
          setAdminData({
            ...adminData,
            settings: data.settings
          });
        }
        showToast('Monthly client limit updated!', 'success');
      } else {
        showToast(data.error || 'Failed to update limit', 'error');
      }
    } catch (e) {
      showToast('Error updating settings.', 'error');
    }
  };

  const handleResetUserUsage = async (targetEmail: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/admin/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, targetEmail })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Successfully reset limit for ${targetEmail}!`, 'success');
        fetchAdminDashboard(currentUser.email);
      } else {
        showToast(data.error || 'Failed to reset usage', 'error');
      }
    } catch (e) {
      showToast('Error resetting usage.', 'error');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim() || !currentUser) {
      showToast('Please enter an enquiry message.', 'error');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          topic: feedbackTopic,
          message: feedbackMessage
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'Enquiry successfully logged!', 'success');
        setFeedbackMessage('');
        if (currentUser.role === 'admin') {
          fetchAdminDashboard(currentUser.email);
        }
      } else {
        showToast(data.error || 'Failed to submit enquiry', 'error');
      }
    } catch (e) {
      showToast('Error submitting enquiry.', 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Load user session and transcripts from storage
  useEffect(() => {
    const savedEmail = localStorage.getItem('scriptor_user_email');
    if (savedEmail) {
      fetch('/api/auth/current-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setCurrentUser(data);
        if (data.role === 'admin') {
          fetchAdminDashboard(data.email);
        }
      })
      .catch(() => {
        localStorage.removeItem('scriptor_user_email');
      });
    }

    const saved = localStorage.getItem('scriptor_ai_transcripts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setSavedTranscriptions(parsed);
          setActiveId(parsed[0].id);
        } else {
          setSavedTranscriptions(PRELOADED_DRAFTS);
          setActiveId(PRELOADED_DRAFTS[0].id);
        }
      } catch (e) {
        setSavedTranscriptions(PRELOADED_DRAFTS);
        setActiveId(PRELOADED_DRAFTS[0].id);
      }
    } else {
      setSavedTranscriptions(PRELOADED_DRAFTS);
      setActiveId(PRELOADED_DRAFTS[0].id);
    }
  }, []);

  const saveTranscriptions = (updated: SavedTranscription[]) => {
    setSavedTranscriptions(updated);
    localStorage.setItem('scriptor_ai_transcripts', JSON.stringify(updated));
  };

  const activeTranscript = savedTranscriptions.find(t => t.id === activeId) || null;

  const timelineItems = React.useMemo(() => {
    return activeTranscript ? getTimelineItems(activeTranscript.segments, activeTranscript.duration) : [];
  }, [activeTranscript]);

  // Synchronize HTML5 audio element properties with React state
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeAudioUrl]);

  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, activeAudioUrl]);

  useEffect(() => {
    if (audioElRef.current && activeAudioUrl) {
      if (isPlaying) {
        audioElRef.current.play().catch(err => console.error("Audio play failed:", err));
      } else {
        audioElRef.current.pause();
      }
    }
  }, [isPlaying, activeAudioUrl]);

  // Manage Mock Audio Playback (in sync with waveform and active segments when no real audio URL is loaded)
  useEffect(() => {
    if (isPlaying && !activeAudioUrl) {
      mockPlaybackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (mockPlaybackIntervalRef.current) {
        clearInterval(mockPlaybackIntervalRef.current);
      }
    }
    return () => {
      if (mockPlaybackIntervalRef.current) {
        clearInterval(mockPlaybackIntervalRef.current);
      }
    };
  }, [isPlaying, duration, playbackSpeed, activeAudioUrl]);

  // Set initial duration when active transcript changes and load session audio URL if present
  useEffect(() => {
    if (activeTranscript) {
      setDuration(parseTimestampToSeconds(activeTranscript.duration));
      setCurrentTime(0);
      setIsPlaying(false);
      setAiActionResult(null);

      // Load session cached audio url if exists, or fallback to beautiful public demo loops for onboard drafts
      const cachedUrl = sessionAudioUrls[activeId];
      if (cachedUrl) {
        setActiveAudioUrl(cachedUrl);
      } else if (activeId === 'draft-welcome') {
        setActiveAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      } else if (activeId === 'draft-interview') {
        setActiveAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
      } else if (activeId === 'draft-meeting') {
        setActiveAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
      } else {
        setActiveAudioUrl(null);
      }
    }
  }, [activeId, sessionAudioUrls]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Convert files to base64 and retrieve precise duration
  const processAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      showToast('Please upload a valid audio file (MP3, WAV, etc.)', 'error');
      return;
    }

    // Get duration via browser Audio object
    const audioUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(audioUrl);
    
    tempAudio.onloadedmetadata = () => {
      const durationSeconds = Math.max(1, Math.round(tempAudio.duration || 15));
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        await handleUploadTranscription(base64Data, file.name, file.type, formattedDuration, durationSeconds, audioUrl);
      };
      reader.readAsDataURL(file);
    };

    tempAudio.onerror = () => {
      // Fallback if loading audio fails
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        await handleUploadTranscription(base64Data, file.name, file.type, '00:15', 15, audioUrl);
      };
      reader.readAsDataURL(file);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  // Web Audio Context for microphone loopback / monitor
  const startMicMonitor = async (stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
      }
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        audioSourceRef.current = source;
        source.connect(audioCtx.destination);
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        console.log("Mic monitor loopback started successfully");
      }
    } catch (e) {
      console.error("Failed to start mic monitor:", e);
    }
  };

  const stopMicMonitor = () => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      audioSourceRef.current = null;
      console.log("Mic monitor loopback stopped");
    } catch (e) {
      console.error("Failed to stop mic monitor:", e);
    }
  };

  // Start microphone capture
  const handleStartRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setRecordingSeconds(0);

    try {
      let options: MediaRecorderOptions = {};
      let preferredMimeType = '';
      
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          preferredMimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          preferredMimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          preferredMimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          preferredMimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          preferredMimeType = 'audio/aac';
        }
      }
      
      if (preferredMimeType) {
        options.mimeType = preferredMimeType;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || preferredMimeType || 'audio/wav';
        setRecordedMimeType(actualMimeType);

        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert blob to base64 for submission
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          setRecordedBase64(base64Data);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all stream tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      if (isMicMonitorEnabled) {
        await startMicMonitor(stream);
      }

      mediaRecorder.start(250); // Record in 250ms chunks for reliability
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      showToast('Recording started...', 'info');
    } catch (err: any) {
      console.error(err);
      stopMicMonitor();
      showToast('Could not access microphone. Ensure permissions are granted.', 'error');
    }
  };

  // Stop microphone capture
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      stopMicMonitor();
      showToast('Recording saved locally', 'success');
    }
  };

  const handleTranscribeRecordedAudio = async () => {
    if (!recordedBase64 || !recordedAudioUrl) {
      showToast('No audio recorded yet', 'error');
      return;
    }
    const durationFormatted = formatTime(recordingSeconds);
    
    let ext = 'webm';
    if (recordedMimeType.includes('mp4')) ext = 'mp4';
    else if (recordedMimeType.includes('ogg')) ext = 'ogg';
    else if (recordedMimeType.includes('wav')) ext = 'wav';
    else if (recordedMimeType.includes('aac')) ext = 'aac';

    await handleUploadTranscription(
      recordedBase64, 
      `Live Voice Capture.${ext}`, 
      recordedMimeType, 
      durationFormatted, 
      recordingSeconds, 
      recordedAudioUrl
    );
  };

  // Send audio file payload to /api/transcribe
  const handleUploadTranscription = async (
    base64Data: string, 
    fileName: string, 
    mimeType: string, 
    customDuration?: string,
    durationSeconds?: number,
    fileUrl?: string
  ) => {
    setIsTranscribing(true);
    setTranscriptionProgress(15);
    showToast('Initializing transcription pipeline...', 'info');

    const progressInterval = setInterval(() => {
      setTranscriptionProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 12;
      });
    }, 250);

    try {
      const response = await fetch('/api/transcribe', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           fileData: base64Data,
           fileName,
           mimeType,
           userEmail: currentUser?.email,
           durationSeconds: durationSeconds || 15,
           options: {
             speakerCount,
             language
           }
         })
      });

      clearInterval(progressInterval);
      setTranscriptionProgress(100);

      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || 'Transcription failed', 'error');
        return;
      }

      if (data.segments) {
        // Update user usage immediately in UI
        if (data.usedSeconds !== undefined && currentUser) {
          setCurrentUser({
            ...currentUser,
            usedSeconds: data.usedSeconds
          });
        }

        const titleFormatted = fileName.replace(/\.[^/.]+$/, "");
        const newId = `trans-${Date.now()}`;
        const newTranscription: SavedTranscription = {
          id: newId,
          title: `🎙️ ${titleFormatted}`,
          language: data.language || language,
          duration: customDuration || '00:15',
          segments: data.segments,
          source: data.source || 'Scriptor AI Pipeline',
          createdAt: new Date().toISOString()
        };

        if (fileUrl) {
          setSessionAudioUrls(prev => ({ ...prev, [newId]: fileUrl }));
          setActiveAudioUrl(fileUrl);
        }

        const updated = [newTranscription, ...savedTranscriptions];
        saveTranscriptions(updated);
        setActiveId(newId);
        showToast('Transcription processed with speaker separation!', 'success');
      } else {
        showToast(data.error || 'Transcription engine reported an error.', 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Network error during transcription pipeline run.', 'error');
    } finally {
      clearInterval(progressInterval);
      setIsTranscribing(false);
      setTranscriptionProgress(0);
      setRecordedBase64(null);
      setRecordedAudioUrl(null);
    }
  };

  const handleDeleteTranscription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this transcription record?')) {
      const updated = savedTranscriptions.filter(t => t.id !== id);
      saveTranscriptions(updated);
      if (activeId === id) {
        if (updated.length > 0) {
          setActiveId(updated[0].id);
        } else {
          setActiveId('');
        }
      }
      showToast('Transcription deleted', 'info');
    }
  };

  // Run premium AI workflows (Summary, Action Items, Translate)
  const handleAIAction = async (task: string) => {
    if (!activeTranscript) return;
    setIsAiProcessing(true);
    setAiActionResult(null);
    showToast(`Scriptor model computing ${task}...`, 'info');

    try {
      const response = await fetch('/api/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: activeTranscript.segments,
          task,
          options: {
            language: selectedLanguageForTranslation
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.result) {
        setAiActionResult(data.result);
        showToast(`${task.toUpperCase()} analysis ready`, 'success');
      } else {
        showToast(data.error || 'AI analysis action failed.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not reach Scriptor AI server api.', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCreateCreative = async () => {
    setIsGeneratingCreative(true);
    setCreativeResult(null);
    showToast(`Scriptor AI Co-Writer drafting masterpiece...`, 'info');

    try {
      const response = await fetch('/api/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: useTranscriptForCreative && activeTranscript ? activeTranscript.segments : [],
          task: 'creative-writing',
          options: {
            creativeType,
            customPrompt: creativePrompt,
            useTranscriptContext: useTranscriptForCreative && !!activeTranscript
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.result) {
        setCreativeResult(data.result);
        showToast('Creative writing draft ready!', 'success');
      } else {
        showToast(data.error || 'AI writer failed.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not reach Scriptor AI server api.', 'error');
    } finally {
      setIsGeneratingCreative(false);
    }
  };

  // Inline transcription text correction
  const handleStartEditingFullText = () => {
    if (!activeTranscript) return;
    const combined = activeTranscript.segments.map(s => s.text).join('\n\n');
    setFullTextDraft(combined);
    setIsEditingFullText(true);
  };

  const handleSaveFullText = () => {
    if (!activeTranscript) return;
    const paragraphs = fullTextDraft.split(/\n\n+/).filter(p => p.trim());
    const newSegments = paragraphs.map((p, index) => ({
      id: `seg-${Date.now()}-${index}`,
      timestamp: index === 0 ? '00:00' : formatTime(index * 15),
      speaker: 'Speaker',
      text: p.trim()
    }));

    const updatedTrans = savedTranscriptions.map(t => {
      if (t.id === activeId) {
        return { ...t, segments: newSegments };
      }
      return t;
    });

    saveTranscriptions(updatedTrans);
    setIsEditingFullText(false);
    showToast('Transcription draft updated', 'success');
  };

  const handleStartEditingSegment = (id: string, currentText: string) => {
    setEditingSegmentId(id);
    setEditingText(currentText);
  };

  const handleSaveSegmentText = (id: string) => {
    if (!activeTranscript) return;
    const updatedSegments = activeTranscript.segments.map(seg => {
      if (seg.id === id) {
        return { ...seg, text: editingText };
      }
      return seg;
    });

    const updatedTrans = savedTranscriptions.map(t => {
      if (t.id === activeId) {
        return { ...t, segments: updatedSegments };
      }
      return t;
    });

    saveTranscriptions(updatedTrans);
    setEditingSegmentId(null);
    showToast('Segment draft corrected', 'success');
  };

  // Global speaker re-labeling
  const handleStartEditingSpeaker = (id: string, currentSpeaker: string) => {
    setEditingSpeakerId(id);
    setEditingSpeakerName(currentSpeaker);
  };

  const handleSaveSpeakerName = (id: string, oldSpeakerName: string) => {
    if (!activeTranscript) return;
    
    // Globally rename speaker across this active transcript
    const updatedSegments = activeTranscript.segments.map(seg => {
      if (seg.speaker === oldSpeakerName) {
        return { ...seg, speaker: editingSpeakerName };
      }
      return seg;
    });

    const updatedTrans = savedTranscriptions.map(t => {
      if (t.id === activeId) {
        return { ...t, segments: updatedSegments };
      }
      return t;
    });

    saveTranscriptions(updatedTrans);
    setEditingSpeakerId(null);
    showToast(`Speaker "${oldSpeakerName}" renamed to "${editingSpeakerName}"`, 'success');
  };

  // Segment interactive player jump
  const handleSeekToSegment = (timestamp: string) => {
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      const totalSecs = mins * 60 + secs;
      setCurrentTime(totalSecs);
      if (audioElRef.current && activeAudioUrl) {
        audioElRef.current.currentTime = totalSecs;
      }
      setIsPlaying(true);
      showToast(`Jumped playback to segment ${timestamp}`, 'info');
    }
  };

  // Copy structured layout
  const handleCopyTranscriptText = () => {
    if (!activeTranscript) return;
    const rawText = activeTranscript.segments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
    navigator.clipboard.writeText(rawText);
    showToast('Copied full diarized transcript to clipboard', 'success');
  };

  // Download Transcription variants (TXT, SRT, JSON)
  const handleDownloadTranscript = (format: 'txt' | 'srt' | 'json') => {
    if (!activeTranscript) return;

    let contentStr = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';

    if (format === 'txt') {
      contentStr = activeTranscript.segments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
    } else if (format === 'srt') {
      contentStr = activeTranscript.segments.map((s, index) => {
        const nextSeg = activeTranscript.segments[index + 1];
        const endTs = nextSeg ? nextSeg.timestamp : activeTranscript.duration;
        return `${index + 1}\n00:${s.timestamp}:000 --> 00:${endTs}:000\n${s.speaker}: ${s.text}\n\n`;
      }).join('');
      fileExtension = 'srt';
    } else if (format === 'json') {
      contentStr = JSON.stringify(activeTranscript.segments, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }

    const blob = new Blob([contentStr], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTranscript.title.replace(/[^\w\s-]/gi, '').trim() || 'transcript'}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded as .${fileExtension.toUpperCase()}`, 'success');
  };

  // Submit companion chat questions
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const query = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    try {
      const activeTextStr = activeTranscript 
        ? activeTranscript.segments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
        : '';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: chatMessages.filter(m => m.id !== 'chat-init').map(m => ({ role: m.role, content: m.content })),
          context: activeTextStr
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `⚠️ Assistant encountered an issue: ${data.error || 'Server error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `⚠️ Network disconnect. Verify your server pipeline is fully active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const filteredTranscripts = savedTranscriptions.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.segments.some(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-slate-300 font-sans p-4 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0F0F0F] rounded-xl border border-white/5 shadow-2xl p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-black font-serif font-bold text-xl shadow-xl shadow-amber-500/10 mx-auto">S</div>
            <h1 className="text-lg font-serif tracking-[0.2em] text-white uppercase mt-4">Scriptor AI</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Precision Audio Transcription & Speaker Diarization</p>
          </div>

          {authError && (
            <div className="p-3.5 rounded bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {authError}
            </div>
          )}

          <div className="flex border-b border-white/5 pb-1">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 pb-2 text-xs uppercase tracking-wider font-bold transition-all ${
                authMode === 'login' ? 'border-b border-amber-500 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 pb-2 text-xs uppercase tracking-wider font-bold transition-all ${
                authMode === 'signup' ? 'border-b border-amber-500 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#151515] border border-white/5 rounded px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#151515] border border-white/5 rounded px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            {authMode === 'signup' && (
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="privacy-checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 bg-[#151515] border border-white/10 rounded text-amber-500 focus:ring-0 focus:outline-none accent-amber-500 cursor-pointer"
                />
                <label htmlFor="privacy-checkbox" className="text-[10px] text-slate-400 font-sans leading-relaxed select-none cursor-pointer">
                  I read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-amber-500 hover:underline font-bold"
                  >
                    Privacy Policy
                  </button>{" "}
                  and our strict data minimization standards.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : null}
              <span>{authMode === 'login' ? 'Authenticate Session' : 'Create Credentials'}</span>
            </button>
          </form>
          
          <div className="text-center pt-2">
            <p className="text-[9px] text-slate-600 font-sans leading-relaxed">
              * Standard clients have a default 1 hour 15 minutes of transcription allowance per month.
            </p>
          </div>
        </div>

        {/* 🛡️ IMMERSIVE PRIVACY POLICY OVERLAY MODAL */}
        {showPrivacyModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-lg bg-[#0F0F0F] rounded-xl border border-white/10 shadow-2xl p-6 flex flex-col max-h-[85vh] text-slate-300 relative">
              <button 
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3.5 mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Scriptor Privacy Policy & Minimization Statement</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-[11px] leading-relaxed text-slate-400 font-sans">
                <p className="italic text-slate-500 text-[10px] font-mono">Effective Date: July 15, 2026</p>
                
                <p>
                  Scriptor AI is committed to securing verbal communications with high-grade data minimization practices. By signing up, you explicitly agree to the processing architecture outlined below.
                </p>

                <div className="space-y-2">
                  <h3 className="font-serif font-semibold text-white uppercase text-[10px] tracking-wider">1. Zero Persistent Media Caching</h3>
                  <p>
                    All audio files uploaded to Scriptor AI or live recordings captured through your microphone are processed exclusively in-memory as ephemeral chunks. We do not store raw audio media on our server discs.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-semibold text-white uppercase text-[10px] tracking-wider">2. Secure Google Gemini API Integration</h3>
                  <p>
                    Transcription parsing and diarization are completed in-flight via secure, private enterprise Google Gemini endpoints. Your data is protected by TLS 1.3 protocol during transit and is never utilized for model training.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-semibold text-white uppercase text-[10px] tracking-wider">3. Account Auditing & Usage Logs</h3>
                  <p>
                    To prevent service misuse and monitor monthly allowances, Scriptor logs basic duration parameters and transcription count metadata on our secure databases. These statistics are private and never shared with third parties or advertisers.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-semibold text-white uppercase text-[10px] tracking-wider">4. Complete Sovereign Ownership</h3>
                  <p>
                    You retain full ownership and copyrights of your spoken ideas. You can download your texts instantly (TXT, SRT, JSON) or delete archives permanently from our databases at any time.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-white/5 pt-4 mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPrivacyAccepted(true);
                    setShowPrivacyModal(false);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded transition-all shadow-md cursor-pointer"
                >
                  Accept & Agree
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-white/5 text-slate-400 hover:text-white font-sans font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-slate-300 font-sans flex flex-col overflow-y-auto">
      
      {/* 🔔 PREMIUM ATMOSPHERIC TOAST NOTIFICATION */}
      {toast && (
        <div id="app-toast" className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded bg-[#161616] border border-white/10 shadow-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          toast.type === 'success' ? 'text-amber-400' :
          toast.type === 'error' ? 'text-red-400' :
          'text-slate-300'
        }`}>
          {toast.type === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
          {toast.type === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 🌐 PROFESSIONAL STICKY NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black font-serif font-bold text-base shadow-lg shadow-amber-500/10">S</div>
          <div>
            <span className="text-sm md:text-base font-serif tracking-[0.25em] text-white uppercase block leading-none">Scriptor AI</span>
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mt-1 block">Unified Speaker Diarization Station</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 md:gap-5">
          {/* Quick Stats Allowance display */}
          <div className="text-right hidden md:block">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Monthly Usage Allowance</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {currentUser?.role === 'admin' 
                ? 'Unlimited Cycles' 
                : `${Math.floor((currentUser?.usedSeconds || 0) / 60)}m ${Math.round((currentUser?.usedSeconds || 0) % 60)}s / ${Math.round(monthlyLimitSeconds / 60)}m`
              }
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveMainView('workspace'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold rounded transition-all border ${
                activeMainView === 'workspace' ? 'bg-[#151515] text-amber-500 border-white/10' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => { setActiveMainView('feedback'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold rounded transition-all border ${
                activeMainView === 'feedback' ? 'bg-[#151515] text-amber-500 border-white/10' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Support Enquiry
            </button>
            <button
              onClick={() => { setActiveMainView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold rounded transition-all border ${
                activeMainView === 'privacy' ? 'bg-[#151515] text-amber-500 border-white/10' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Privacy Policy
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { setActiveMainView('admin'); fetchAdminDashboard(currentUser.email); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-extrabold rounded transition-all border ${
                  activeMainView === 'admin' ? 'bg-amber-500 text-black border-transparent shadow-md shadow-amber-500/20' : 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
              >
                Owner Console
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 bg-[#1C1C1C] hover:bg-red-950/20 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 MAIN WEBSITE CONTENT FLOWS DOWNWARDS */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-12">

        {activeMainView === 'workspace' && (
          <div className="space-y-12">
            
            {/* 📥 INGESTION & CALIBRATION DESK */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Media Ingestion */}
              <div className="lg:col-span-7 bg-[#0F0F0F] border border-white/5 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Audio Upload Station</h2>
                </div>

                <div className="space-y-4">
                  {/* File Upload Zone - full width */}
                  <div 
                    id="drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/10 hover:border-amber-500/30 rounded-xl p-8 text-center cursor-pointer bg-[#121212]/50 hover:bg-[#121212] transition-all group flex flex-col justify-center items-center space-y-4 min-h-[220px]"
                  >
                    <Upload className="w-10 h-10 text-slate-500 group-hover:text-amber-500 transition-colors" />
                    <div className="space-y-1">
                      <div className="text-sm text-slate-300 font-bold uppercase tracking-wider">Upload Audio Document</div>
                      <div className="text-[11px] text-slate-500 font-mono">WAV, MP3, M4A, WEBM, OGG, or FLAC up to 200MB (45+ minutes)</div>
                    </div>
                    <span className="px-4 py-2 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black text-[10px] font-mono uppercase tracking-wider rounded font-bold transition-all">
                      Browse Files
                    </span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & History */}
              <div className="lg:col-span-5 bg-[#0F0F0F] border border-white/5 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 shrink-0">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Settings & History</h2>
                </div>

                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  {/* Saved Transcripts Vault */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Transcription History</label>
                    {savedTranscriptions.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-xs italic bg-[#121212] rounded border border-white/5">
                        No transcripts saved yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {savedTranscriptions.map((t) => (
                          <div
                            key={t.id}
                            className={`w-full p-2.5 rounded border transition-all flex items-center justify-between text-xs font-mono uppercase tracking-wide ${
                              t.id === activeId
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-[#121212] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveId(t.id);
                                showToast(`Loaded ${t.title}`, 'info');
                              }}
                              className="flex-1 text-left truncate font-semibold pr-2 cursor-pointer text-xs"
                            >
                              {t.title}
                            </button>
                            <span className="text-[9px] text-slate-500 shrink-0 select-none mr-2">{t.duration}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = savedTranscriptions.filter(item => item.id !== t.id);
                                saveTranscriptions(filtered);
                                if (activeId === t.id && filtered.length > 0) {
                                  setActiveId(filtered[0].id);
                                } else if (filtered.length === 0) {
                                  setActiveId('');
                                }
                                showToast('Transcript removed', 'success');
                              }}
                              className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                              title="Delete transcript"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded-lg border border-white/5 space-y-2.5">
                    <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Language Identification</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#1C1C1C] text-slate-300 text-xs font-mono border border-white/5 rounded py-2.5 px-3 focus:outline-none focus:border-amber-500/30 cursor-pointer"
                    >
                      <option value="Auto">Detect Automatically</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="Japanese">Japanese (日本語)</option>
                      <option value="Indonesian">Indonesian (Bahasa Indonesia)</option>
                      <option value="German">German (Deutsch)</option>
                      <option value="French">French (Français)</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Italian">Italian</option>
                      <option value="Chinese">Chinese (中文)</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Russian">Russian</option>
                      <option value="Korean">Korean (한국어)</option>
                      <option value="Turkish">Turkish</option>
                      <option value="Vietnamese">Vietnamese</option>
                      <option value="Dutch">Dutch</option>
                      <option value="Swedish">Swedish</option>
                      <option value="Polish">Polish</option>
                      <option value="Tagalog">Tagalog</option>
                      <option value="Ukrainian">Ukrainian</option>
                      <option value="Hebrew">Hebrew</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>



          </div>
        )}

        {/* 1. SECURE OWNER CONSOLE VIEW */}
        {activeMainView === 'admin' && adminData && (
          <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-6 md:p-8 space-y-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs bg-amber-500/10 text-amber-500 font-mono uppercase font-bold tracking-widest px-2 py-1 rounded border border-amber-500/20">
                  Owner console
                </span>
                <h1 className="font-serif text-white text-lg md:text-xl tracking-wide uppercase">
                  Administration Dashboard
                </h1>
              </div>
            </div>

            {/* Dashboard summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121212] border border-white/5 rounded-lg p-5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Authorized Signups</span>
                <span className="text-2xl font-serif text-white block mt-1.5">{adminData.users?.length || 1}</span>
                <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">Live profiles in database</span>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-lg p-5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Monthly Base Limit</span>
                <span className="text-2xl font-serif text-amber-500 block mt-1.5">{Math.round(monthlyLimitSeconds / 60)} Mins</span>
                <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">For general clients</span>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-lg p-5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Enquiries & Feedbacks</span>
                <span className="text-2xl font-serif text-white block mt-1.5">{adminData.feedbacks?.length || 0}</span>
                <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">Direct inquiries received</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Monthly limit config */}
              <div className="lg:col-span-4 bg-[#121212] border border-white/5 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-serif text-white uppercase tracking-wider">Configure Limits</h3>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  As Scriptor's Owner, you can dynamically configure the transcription limit seconds granted to general clients.
                </p>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Default Limit (Minutes)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={Math.round(monthlyLimitSeconds / 60)}
                      onChange={(e) => setMonthlyLimitSeconds((parseInt(e.target.value) || 0) * 60)}
                      className="flex-1 bg-[#1A1A1A] border border-white/5 rounded px-3 py-1.5 text-xs text-amber-400 font-mono text-center focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdateLimit(monthlyLimitSeconds)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Users list */}
              <div className="lg:col-span-8 bg-[#121212] border border-white/5 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-serif text-white uppercase tracking-wider">Registered Users & Consumption</h3>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">Real-time stats</span>
                </div>

                <div className="overflow-x-auto max-h-60 overflow-y-auto space-y-2 pr-1">
                  {adminData.users?.map((usr: any) => (
                    <div key={usr.email} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded border border-white/5 text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="font-serif text-white truncate block">{usr.email}</span>
                        <span className="text-[8px] font-mono uppercase text-slate-500 block mt-0.5">
                          Signup: {new Date(usr.createdAt).toLocaleDateString()} | Role: {usr.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-amber-400 block">{Math.floor(usr.usedSeconds / 60)}m {Math.round(usr.usedSeconds % 60)}s</span>
                          <span className="text-[8px] font-mono text-slate-600 uppercase block">Used</span>
                        </div>
                        {usr.role !== 'admin' && (
                          <button
                            onClick={() => handleResetUserUsage(usr.email)}
                            className="px-2 py-1 bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 border border-white/5 hover:border-amber-500/20 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Logs & Feedbacks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Feedbacks */}
              <div className="bg-[#121212] border border-white/5 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-serif text-white uppercase tracking-wider">Direct enquiries</h3>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">Latest inquiries</span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {adminData.feedbacks?.length === 0 ? (
                    <div className="p-6 text-center text-slate-600 text-xs italic">
                      No enquiries received yet.
                    </div>
                  ) : (
                    adminData.feedbacks?.map((fb: any) => (
                      <div key={fb.id} className="p-3.5 bg-[#1A1A1A] rounded border border-white/5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-white font-medium">{fb.topic}</span>
                          <span className="text-[8px] font-mono text-slate-600">{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 font-sans leading-relaxed text-xs">{fb.message}</p>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block mt-1">Sender: {fb.email}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-[#121212] border border-white/5 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-serif text-white uppercase tracking-wider">Secure File Audit Logs</h3>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono">Transaction feed</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {adminData.logs?.map((log: any) => (
                    <div key={log.id} className="p-2.5 bg-[#1A1A1A] rounded border border-white/5 text-[11px] flex justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-slate-400 block leading-tight">{log.action}</span>
                        <span className="text-[9px] font-mono text-slate-600 uppercase block mt-1">User: {log.email} {log.filename ? `| File: ${log.filename}` : ''}</span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 shrink-0 text-right align-top">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DIRECT ENQUIRY SERVICE VIEW */}
        {activeMainView === 'feedback' && (
          <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-8 space-y-6 shadow-2xl max-w-2xl mx-auto">
            <div className="text-center space-y-2 border-b border-white/5 pb-5">
              <Mail className="w-8 h-8 text-amber-500 mx-auto" />
              <h2 className="font-serif text-white text-lg tracking-wider uppercase">Direct Enquiry Service</h2>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                Have any questions, bug reports, or request for custom monthly limits? Send a direct feedback which routes instantly to althafka944@gmail.com.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase font-mono tracking-widest block">Sender Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email}
                  className="w-full bg-[#151515] border border-white/5 rounded px-3.5 py-2.5 text-xs text-slate-500 font-sans cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase font-mono tracking-widest block">Inquiry Category</label>
                <select
                  value={feedbackTopic}
                  onChange={(e) => setFeedbackTopic(e.target.value)}
                  className="w-full bg-[#151515] text-slate-300 text-xs font-sans border border-white/5 rounded p-2.5 focus:outline-none focus:border-amber-500/40"
                >
                  <option value="Transcription Accuracy & Quality">Transcription Accuracy & Quality</option>
                  <option value="Speaker Diarization Issue">Speaker Diarization Issue</option>
                  <option value="Microphone Recording System">Microphone Recording System</option>
                  <option value="Monthly Allowance Limit Increase">Monthly Allowance Limit Increase</option>
                  <option value="General Query or Proposal">General Query or Proposal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase font-mono tracking-widest block">Your Message</label>
                <textarea
                  required
                  rows={5}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Please write your feedback details here. The system administrator will review this and respond shortly."
                  className="w-full bg-[#151515] border border-white/5 rounded px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/40 font-sans leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {feedbackSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-3.5 h-3.5 text-black" />}
                <span>Forward Enquiry directly to Owner</span>
              </button>
            </form>
          </div>
        )}

        {/* 3. COMPLIANCE & PRIVACY POLICY VIEW */}
        {activeMainView === 'privacy' && (
          <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/5 rounded-xl p-8 md:p-10 space-y-6 shadow-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-amber-500/10 pointer-events-none">
              <ShieldCheck className="w-32 h-32" />
            </div>

            <div className="space-y-2 border-b border-white/5 pb-5">
              <span className="text-[9px] text-amber-500 font-mono uppercase tracking-[0.2em] block">Data Governance & Sovereign Integrity</span>
              <h1 className="font-serif text-white text-xl md:text-2xl tracking-wider uppercase">Scriptor Unified Privacy Policy</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Last revised: July 15, 2026</p>
            </div>

            <div className="space-y-5 text-slate-300 font-sans text-xs md:text-sm leading-relaxed">
              <p>
                Scriptor AI is engineered from the ground up with <strong>data minimization principles</strong>. We enforce strict physical constraints on how audio packets are ingested, parsed, and logged to ensure maximum confidentiality for our users.
              </p>

              <div className="space-y-2.5">
                <h3 className="text-xs font-serif text-white uppercase tracking-wider">1. Zero Persistent Media Caching</h3>
                <p className="text-slate-400 text-xs">
                  We never write raw audio uploads or microphone vocal recordings to permanent disc storage. Audio media is streamed as transient memory buffers, transmitted via encrypted API pipes, and cleared instantly once transcription diarization completes.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-serif text-white uppercase tracking-wider">2. Secure Google Gemini Pipeline</h3>
                <p className="text-slate-400 text-xs">
                  Vocal signals are converted directly on HTTPS channels utilizing TLS 1.3 protocol. AI parsing is carried out via secure, private enterprise Google Gemini endpoints. Your data is strictly private and is never used for training models or analytics.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-serif text-white uppercase tracking-wider">3. Exclusive Owner Authority (althafka944@gmail.com)</h3>
                <p className="text-slate-400 text-xs">
                  This platform is owned and managed by althafka944@gmail.com. General clients are allocated 1 hour 15 minutes of transcription monthly limit. Operational telemetry (metadata such as duration and transcript titles) is logged securely for administrative audits.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-serif text-white uppercase tracking-wider">4. Absolute Client Sovereignty</h3>
                <p className="text-slate-400 text-xs">
                  You maintain complete custody and copyrights over your transcriptions. You can download files locally in SRT Subtitles, JSON, or TXT formats, or permanently delete records from our indexes with a single click.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-center">
              <button
                onClick={() => setActiveMainView('workspace')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest rounded transition-all shadow-md cursor-pointer"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )}

        {/* 4. ACTIVE TRANSCRIBING OR EDITING WORKSPACE PANEL */}
        {activeMainView === 'workspace' && (
          <div id="active-workspace-panel" className="scroll-mt-24 space-y-6">
            
            {/* If transcribing, render the pipeline loader */}
            {isTranscribing && (
              <div className="flex flex-col items-center justify-center bg-[#0F0F0F] border border-white/5 rounded-xl p-12 text-center shadow-2xl">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <h3 className="text-base font-serif text-white tracking-wide uppercase">Scriptor AI Processing Pipeline</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed font-mono">
                  Analyzing vocal signatures, assigning speaker segment IDs, and formatting high-fidelity dialogue metadata.
                </p>
                <div className="w-64 bg-[#151515] h-2 rounded-full overflow-hidden mt-6 border border-white/5">
                  <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${transcriptionProgress}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-600 font-mono mt-2">{transcriptionProgress}% completed</span>
              </div>
            )}

            {/* If transcript is active, render workspace */}
            {!isTranscribing && activeTranscript && (
              <div className="space-y-6">
                
                {/* Active Transcript Header with controls & downloads */}
                <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 font-mono uppercase font-bold tracking-widest px-2.5 py-1 rounded border border-emerald-500/25">
                      Live
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Document:</span>
                      <span className="text-white text-xs font-serif font-bold uppercase tracking-wide bg-[#151515] border border-white/5 px-3 py-1.5 rounded select-all max-w-[320px] truncate">
                        {activeTranscript.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      id="copy-text-btn"
                      onClick={handleCopyTranscriptText}
                      className="p-2.5 bg-[#151515] border border-white/5 hover:border-amber-500/30 text-slate-400 hover:text-amber-500 rounded transition-all cursor-pointer"
                      title="Copy Full Transcript"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      id="delete-active-btn"
                      onClick={(e) => handleDeleteTranscription(activeTranscript.id, e)}
                      className="p-2.5 bg-[#151515] border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                      title="Delete This Transcript"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Download Actions */}
                    <div className="flex items-center bg-[#151515] rounded border border-white/5 p-0.5">
                      <button
                        id="dl-txt-btn"
                        onClick={() => handleDownloadTranscript('txt')}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white rounded cursor-pointer"
                        title="Download Text Document"
                      >
                        TXT
                      </button>
                      <button
                        id="dl-srt-btn"
                        onClick={() => handleDownloadTranscript('srt')}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white rounded border-l border-white/5 cursor-pointer"
                        title="Download SRT Subtitle"
                      >
                        SRT
                      </button>
                      <button
                        id="dl-json-btn"
                        onClick={() => handleDownloadTranscript('json')}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white rounded border-l border-white/5 cursor-pointer"
                        title="Download JSON Structure"
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* TWO-COLUMN SIDE-BY-SIDE INTEGRATIVE PANELS */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (8 cols): Audio control and dialogue list */}
                  <div className="xl:col-span-8 space-y-6">
                    
                    {/* 🎵 AUDIO PLAYER CONTROL PANEL */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-6 shadow-2xl">
                      <audio 
                        ref={audioElRef} 
                        src={activeAudioUrl || undefined} 
                        className="hidden" 
                        onTimeUpdate={() => {
                          if (audioElRef.current) {
                            setCurrentTime(Math.floor(audioElRef.current.currentTime));
                          }
                        }}
                        onLoadedMetadata={() => {
                          if (audioElRef.current) {
                            setDuration(Math.floor(audioElRef.current.duration));
                          }
                        }}
                        onPlay={() => console.log("Audio started playing")}
                        onPause={() => console.log("Audio paused")}
                        onError={(e) => {
                          console.error("Audio element error:", e);
                          showToast("Audio playback issue. Format might not be supported.", "error");
                        }}
                        onEnded={() => {
                          setIsPlaying(false);
                          setCurrentTime(0);
                        }}
                      />

                      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
                        {/* Audio Controls */}
                        <div className="flex items-center gap-4">
                          <button
                            id="player-rewind"
                            onClick={() => { if (audioElRef.current) audioElRef.current.currentTime = Math.max(0, currentTime - 5); }}
                            className="p-2.5 bg-[#151515] hover:bg-[#1C1C1C] text-slate-400 hover:text-white rounded border border-white/5 cursor-pointer transition-all"
                            title="Skip Back 5s"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            id="player-play-pause"
                            onClick={handlePlayPause}
                            className="p-4 bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-lg shadow-amber-500/10 cursor-pointer transition-all transform hover:scale-105"
                            title={isPlaying ? 'Pause' : 'Play'}
                          >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </button>

                          <button
                            id="player-forward"
                            onClick={() => { if (audioElRef.current) audioElRef.current.currentTime = Math.min(duration, currentTime + 5); }}
                            className="p-2.5 bg-[#151515] hover:bg-[#1C1C1C] text-slate-400 hover:text-white rounded border border-white/5 cursor-pointer transition-all"
                            title="Skip Forward 5s"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Progress Slider */}
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setCurrentTime(val);
                              if (audioElRef.current) audioElRef.current.currentTime = val;
                            }}
                            className="w-full accent-amber-500 h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Volume and Mute Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 text-slate-400 hover:text-white transition-all"
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              setVolume(parseFloat(e.target.value));
                              setIsMuted(false);
                            }}
                            className="w-16 accent-amber-500 h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 📝 UNIFIED TRANSCRIPTION TEXT PANEL */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Transcription Text</span>
                        </div>
                        {!isEditingFullText && (
                          <button
                            onClick={handleStartEditingFullText}
                            className="text-[9px] font-mono uppercase bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 rounded px-2 py-1 transition-all cursor-pointer font-bold"
                          >
                            Edit Transcript
                          </button>
                        )}
                      </div>

                      <div>
                        {isEditingFullText ? (
                          <div className="space-y-4">
                            <textarea
                              value={fullTextDraft}
                              onChange={(e) => setFullTextDraft(e.target.value)}
                              className="w-full bg-[#121212] border border-amber-500/40 text-slate-200 text-sm md:text-base p-5 rounded-lg focus:outline-none leading-relaxed font-sans min-h-[300px] resize-y"
                              placeholder="Type or correct transcription text..."
                            />
                            <div className="flex gap-2.5 justify-end">
                              <button
                                onClick={() => setIsEditingFullText(false)}
                                className="px-3.5 py-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 hover:text-white rounded bg-[#1C1C1C] border border-white/5 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveFullText}
                                className="px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold text-black rounded bg-amber-500 hover:bg-amber-400 cursor-pointer shadow-md"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-[2px] before:bg-white/10">
                            {(() => {
                              if (timelineItems.length === 0) {
                                return (
                                  <div className="bg-[#121212]/30 border border-white/5 rounded-lg p-5 min-h-[250px] flex items-center justify-center text-center">
                                    <span className="italic text-slate-600 text-sm">No transcription content. Upload an audio document to generate transcription.</span>
                                  </div>
                                );
                              }

                              return timelineItems.map((item, idx) => {
                                const nextItem = timelineItems[idx + 1];
                                const isActive = nextItem 
                                  ? (currentTime >= item.seconds && currentTime < nextItem.seconds)
                                  : (currentTime >= item.seconds);

                                return (
                                  <div 
                                    key={item.id} 
                                    className={`relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border transition-all duration-300 group ${
                                      isActive 
                                        ? 'bg-amber-500/[0.04] border-amber-500/25 shadow-md shadow-amber-500/5' 
                                        : 'bg-[#121212]/30 border-white/5 hover:border-white/10'
                                    }`}
                                  >
                                    {/* Timeline Node Dot */}
                                    <div className="absolute left-[-23px] top-[21px]">
                                      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                                        isActive 
                                          ? 'bg-amber-500 border-amber-500 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                          : 'bg-[#070707] border-white/20 group-hover:border-white/40'
                                      }`} />
                                    </div>

                                    {/* Interactive Timestamp Badge */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCurrentTime(item.seconds);
                                        if (audioElRef.current && activeAudioUrl) {
                                          audioElRef.current.currentTime = item.seconds;
                                        }
                                        setIsPlaying(true);
                                        showToast(`Jumped playback to ${item.timestamp}`, 'info');
                                      }}
                                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer shrink-0 sm:mt-0.5 text-center w-14 ${
                                        isActive
                                          ? 'bg-amber-500 text-black border-transparent shadow'
                                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                                      }`}
                                      title="Click to seek here"
                                    >
                                      {item.timestamp}
                                    </button>

                                    {/* Sentence Text with Word-Level Active Highlight & Word-Level Seek */}
                                    <div className="flex-1">
                                      <p className={`text-sm md:text-base leading-relaxed transition-all ${
                                        isActive 
                                          ? 'text-white font-medium' 
                                          : 'text-slate-300 group-hover:text-white'
                                      }`}>
                                        {(() => {
                                          // Split keeping all whitespace/punctuation tokens
                                          const tokens = item.text.split(/(\s+)/);
                                          const realWordTokens = tokens.filter(t => t.trim().length > 0);
                                          const totalRealWords = realWordTokens.length;

                                          if (totalRealWords === 0) return item.text;

                                          let realWordIdx = 0;
                                          return tokens.map((token, tIdx) => {
                                            const isWhitespace = token.trim().length === 0;
                                            if (isWhitespace) {
                                              return <span key={tIdx}>{token}</span>;
                                            }

                                            const currentRealWordIdx = realWordIdx;
                                            realWordIdx++;

                                            // Calculate precise timing range for this word
                                            const wordDuration = (item.duration || 4) / totalRealWords;
                                            const wordStart = item.seconds + currentRealWordIdx * wordDuration;
                                            const wordEnd = wordStart + wordDuration;
                                            const isWordActive = isActive && currentTime >= wordStart && currentTime < wordEnd;

                                            return (
                                              <span
                                                key={tIdx}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCurrentTime(wordStart);
                                                  if (audioElRef.current && activeAudioUrl) {
                                                    audioElRef.current.currentTime = wordStart;
                                                  }
                                                  setIsPlaying(true);
                                                  showToast(`Seeked to: "${token.trim()}"`, 'info');
                                                }}
                                                className={`cursor-pointer transition-all duration-150 inline-block px-0.5 rounded select-text ${
                                                  isWordActive
                                                    ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/30 scale-105'
                                                    : isActive
                                                      ? 'hover:bg-white/10 text-white/95 underline decoration-white/10 hover:decoration-amber-500/50'
                                                      : 'hover:bg-white/5 text-slate-300'
                                                }`}
                                                title={`Click to play from "${token.trim()}" (${formatTime(Math.floor(wordStart))})`}
                                              >
                                                {token}
                                              </span>
                                            );
                                          });
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (4 cols): Scriptor AI Companion & Translation Station */}
                  <div className="xl:col-span-4 bg-[#0F0F0F] border border-white/5 rounded-xl p-6 space-y-6 shadow-2xl">
                    {/* Companion Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded text-amber-500 border border-amber-500/20">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <span className="font-serif text-sm font-semibold text-white tracking-wide uppercase block">AI Scriptor Companion</span>
                          <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono uppercase tracking-widest mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Copilot Active</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation tabs inside grid sidebar */}
                    <div className="flex border-b border-white/5 bg-[#0A0A0A]/30 p-1 shrink-0 overflow-x-auto scrollbar-none rounded gap-1">
                      {[
                        { id: 'summary', label: 'Summary', icon: FileText },
                        { id: 'actions', label: 'Actions', icon: CheckSquare },
                        { id: 'translate', label: 'Translate', icon: Languages },
                        { id: 'writer', label: 'Writer', icon: PenTool },
                        { id: 'chat', label: 'Ask AI', icon: MessageSquare }
                      ].map((tb) => {
                        const Icon = tb.icon;
                        return (
                          <button
                            key={tb.id}
                            onClick={() => {
                              setActiveTab(tb.id as any);
                              if (tb.id === 'summary') {
                                handleAIAction('summarize');
                              } else if (tb.id === 'actions') {
                                handleAIAction('action-items');
                              }
                            }}
                            className={`flex-1 min-w-[55px] py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer ${
                              activeTab === tb.id ? 'bg-[#151515] text-amber-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <span className="block text-center">{tb.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Content Panel */}
                    <div className="space-y-4">
                      {/* 1. Summary & Action Items Tab */}
                      {(activeTab === 'summary' || activeTab === 'actions') && (
                        <div className="space-y-4">
                          <div className="p-3 bg-amber-500/[0.02] border border-amber-500/10 rounded text-slate-400 text-xs leading-relaxed font-sans">
                            {activeTab === 'summary' 
                              ? 'High-fidelity executive summary identifying key milestones and speech themes.' 
                              : 'Automatically extracted meeting actions, tasks, and responsibilities.'}
                          </div>

                          {isAiProcessing ? (
                            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Running AI presets...</span>
                            </div>
                          ) : aiActionResult ? (
                            <div className="prose prose-invert max-w-none text-xs bg-[#121212] p-4 rounded border border-white/5 shadow-inner leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                              {aiActionResult}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-slate-600 text-xs italic">
                              Analyzing...
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Translation Station Tab */}
                      {activeTab === 'translate' && (
                        <div className="space-y-4">
                          <div className="bg-[#121212] p-4 rounded border border-white/5 space-y-3">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Choose Target Language</span>
                            <select
                              value={selectedLanguageForTranslation}
                              onChange={(e) => setSelectedLanguageForTranslation(e.target.value)}
                              className="w-full bg-[#181818] text-white text-xs font-mono border border-white/10 rounded p-2 focus:outline-none"
                            >
                              <option value="Malayalam">Malayalam (മലയാളം)</option>
                              <option value="Hindi">Hindi (हिन्दी)</option>
                              <option value="Tamil">Tamil (தமிழ்)</option>
                              <option value="Arabic">Arabic (العربية)</option>
                              <option value="Spanish">Spanish (Español)</option>
                              <option value="Japanese">Japanese (日本語)</option>
                              <option value="French">French (Français)</option>
                              <option value="German">German (Deutsch)</option>
                              <option value="Chinese">Chinese (中文)</option>
                            </select>
                            <button
                              onClick={() => handleAIAction('translate')}
                              disabled={isAiProcessing}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              {isAiProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Languages className="w-3.5 h-3.5" />}
                              <span>Translate Full Dialogue</span>
                            </button>
                          </div>

                          {aiActionResult && (
                            <div className="prose prose-invert max-w-none text-xs bg-[#121212] p-4 rounded border border-white/5 shadow-inner leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                              {aiActionResult}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. AI Writer / Creative Co-Pilot Tab */}
                      {activeTab === 'writer' && (
                        <div className="space-y-4">
                          <div className="bg-[#121212] p-4 rounded border border-white/5 space-y-3">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Scriptor AI Writer</span>
                            
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Content Type</label>
                              <select
                                value={creativeType}
                                onChange={(e) => setCreativeType(e.target.value)}
                                className="w-full bg-[#181818] text-white text-xs font-mono border border-white/10 rounded p-2 focus:outline-none"
                              >
                                <option value="Story">Fictional Narrative / Story</option>
                                <option value="Script">Dialogue Script / Screenplay</option>
                                <option value="Speech">Motivational Speech</option>
                                <option value="Blog">Professional Blog Post</option>
                                <option value="Other">Custom Purpose</option>
                              </select>
                            </div>

                            {activeTranscript && (
                              <div className="flex items-center gap-2 py-1 select-none">
                                <input
                                  type="checkbox"
                                  id="useTranscriptForCreative"
                                  checked={useTranscriptForCreative}
                                  onChange={(e) => setUseTranscriptForCreative(e.target.checked)}
                                  className="accent-amber-500 rounded bg-[#181818] border-white/10 cursor-pointer"
                                />
                                <label htmlFor="useTranscriptForCreative" className="text-[10px] text-slate-400 font-sans cursor-pointer">
                                  Reference active transcript facts
                                </label>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Co-Writer Focus & Outline</label>
                              <textarea
                                rows={4}
                                value={creativePrompt}
                                onChange={(e) => setCreativePrompt(e.target.value)}
                                placeholder="Provide outline directions, style guide, or character profiles. E.g., 'Draft a classic sci-fi script about a time machine failure'..."
                                className="w-full bg-[#181818] border border-white/10 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30 font-sans leading-relaxed resize-none"
                              />
                            </div>

                            <button
                              onClick={handleCreateCreative}
                              disabled={isGeneratingCreative}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              {isGeneratingCreative ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Sparkles className="w-3.5 h-3.5 text-black" />}
                              <span>Draft Masterpiece</span>
                            </button>
                          </div>

                          {creativeResult && (
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Masterpiece Draft</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(creativeResult);
                                      showToast('Masterpiece copied!', 'success');
                                    }}
                                    className="px-2 py-0.5 bg-[#151515] border border-white/5 hover:border-white/10 rounded text-[9px] text-amber-500 font-mono uppercase tracking-wider cursor-pointer"
                                    title="Copy to Clipboard"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => {
                                      const blob = new Blob([creativeResult], { type: 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `Scriptor_Creative_${creativeType}_Draft.txt`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                      showToast('Masterpiece downloaded!', 'success');
                                    }}
                                    className="px-2 py-0.5 bg-[#151515] border border-white/5 hover:border-white/10 rounded text-[9px] text-amber-500 font-mono uppercase tracking-wider cursor-pointer"
                                    title="Download manuscript"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                              <div className="prose prose-invert max-w-none text-xs bg-[#121212] p-4 rounded border border-white/5 shadow-inner leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-sans">
                                {creativeResult}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. DocAssist Conversational AI Assistant Tab */}
                      {activeTab === 'chat' && (
                        <div className="flex flex-col h-full space-y-4">
                          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                            {chatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] ${
                                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                              >
                                <span className="text-[8px] text-slate-600 font-mono mb-1 px-1 uppercase">
                                  {msg.role === 'user' ? 'Analyst' : 'Scriptor Assistant'}
                                </span>
                                <div className={`p-3.5 rounded border text-xs leading-relaxed whitespace-pre-wrap ${
                                  msg.role === 'user' 
                                    ? 'bg-amber-500/5 text-amber-100 border-amber-500/15 rounded-tr-none' 
                                    : 'bg-[#151515] text-slate-300 border-white/5 rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}

                            {isChatLoading && (
                              <div className="flex flex-col items-start max-w-[80%] animate-pulse">
                                <span className="text-[8px] text-slate-600 font-mono mb-1 px-1">Computing...</span>
                                <div className="bg-[#151515] border border-white/5 rounded p-3 flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                                  <span className="text-slate-500 text-[10px]">Analyzing audio context...</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Chat Input form */}
                          <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-white/5">
                            <input
                              type="text"
                              placeholder="Ask about active speech segments..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              className="flex-1 bg-[#151515] border border-white/5 rounded px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/40"
                            />
                            <button
                              type="submit"
                              className="p-2 bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors"
                            >
                              <Send className="w-4 h-4 fill-current text-black" />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 🧭 PROFESSIONAL SCROLLABLE FOOTER LINKAGE */}
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 mt-12 text-slate-600">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>Scriptor AI © 2026. Scribe the Spoken Word.</span>
                <span className="text-white/5">|</span>
                <button
                  onClick={() => setActiveMainView('privacy')}
                  className="hover:text-amber-500 transition-colors cursor-pointer"
                >
                  Privacy Policy & Data Sovereign Rules
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <button
                  onClick={() => setActiveMainView('feedback')}
                  className="hover:text-amber-500 transition-colors text-amber-500/80 cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Enquiry & Direct Support</span>
                </button>
                <span className="text-white/5">|</span>
                <span className="text-[10px] uppercase">Owner: althafka944@gmail.com</span>
              </div>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}

// Simple parser helper
function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.trim().split(':');
  if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseInt(parts[2], 10) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  const parsed = parseFloat(timestamp);
  return isNaN(parsed) ? 0 : parsed;
}

interface TimelineItem {
  id: string;
  timestamp: string;
  seconds: number;
  duration: number;
  text: string;
}

function getTimelineItems(segments: TranscriptSegment[], durationStr?: string): TimelineItem[] {
  if (!segments || segments.length === 0) return [];
  const items: TimelineItem[] = [];

  // Parse total duration of audio
  const totalDuration = durationStr ? parseTimestampToSeconds(durationStr) : 60;

  // Sort segments by their starting timestamp to prevent out-of-order issues
  const sortedSegments = [...segments].sort((a, b) => {
    return parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp);
  });

  for (let i = 0; i < sortedSegments.length; i++) {
    const seg = sortedSegments[i];
    const segStart = parseTimestampToSeconds(seg.timestamp);

    // Determine the end boundary of this segment
    let segEnd = totalDuration;
    if (i < sortedSegments.length - 1) {
      const nextStart = parseTimestampToSeconds(sortedSegments[i + 1].timestamp);
      if (nextStart > segStart) {
        segEnd = nextStart;
      }
    }

    // Ensure we have a reasonable duration window for the segment
    let segDuration = segEnd - segStart;
    if (segDuration <= 0) {
      segDuration = 5; // fallback segment duration
    }

    const text = seg.text.trim();
    if (!text) continue;

    // Split the segment text into individual sentences
    const sentenceRegex = /[^.!?]+(?:[.!?]+|$)/g;
    const matches = text.match(sentenceRegex);
    const sentences = matches ? matches.map(s => s.trim()).filter(s => s.length > 0) : [text];

    if (sentences.length === 0) continue;

    // Count words in each sentence to distribute time proportionally to speaking length
    const sentenceStats = sentences.map(s => {
      const words = s.split(/\s+/).filter(w => w.length > 0);
      return {
        text: s,
        wordCount: Math.max(1, words.length)
      };
    });

    const totalWords = sentenceStats.reduce((sum, s) => sum + s.wordCount, 0);

    let currentOffset = 0;
    sentenceStats.forEach((s, sIdx) => {
      const proportion = s.wordCount / totalWords;
      const sentenceDuration = segDuration * proportion;

      // Calculate starting seconds of this sentence
      const sentenceStart = segStart + currentOffset;

      const mins = Math.floor(sentenceStart / 60);
      const secs = Math.floor(sentenceStart % 60);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      items.push({
        id: `${seg.id}-sentence-${sIdx}`,
        timestamp: timeStr,
        seconds: parseFloat(sentenceStart.toFixed(2)),
        duration: parseFloat(sentenceDuration.toFixed(2)),
        text: s.text
      });

      currentOffset += sentenceDuration;
    });
  }

  // Sort timeline items chronologically
  return items.sort((a, b) => a.seconds - b.seconds);
}
