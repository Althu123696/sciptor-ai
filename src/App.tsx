 import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
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
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'translate' | 'chat'>('summary');

  // Editing segments states
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState<string>('');

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
      const parts = activeTranscript.duration.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        setDuration(mins * 60 + secs);
      }
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

  // Start microphone capture
  const handleStartRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
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

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      showToast('Recording started...', 'info');
    } catch (err: any) {
      console.error(err);
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
      showToast('Recording saved locally', 'success');
    }
  };

  const handleTranscribeRecordedAudio = async () => {
    if (!recordedBase64 || !recordedAudioUrl) {
      showToast('No audio recorded yet', 'error');
      return;
    }
    const durationFormatted = formatTime(recordingSeconds);
    await handleUploadTranscription(recordedBase64, 'Live Recording Audio.wav', 'audio/wav', durationFormatted, recordingSeconds, recordedAudioUrl);
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
    if (confirm('Permanently delete this transcription record from your vault?')) {
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

  // Inline transcription text correction
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
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="flex h-screen bg-[#0A0A0A] text-slate-300 font-sans overflow-hidden">
      
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

      {/* 🗃️ LEFT SIDEBAR: Transcription Hub, Live Recording & History Vault */}
      <div id="left-sidebar" className={`flex flex-col bg-[#0F0F0F] border-r border-white/5 h-full transition-all duration-300 z-20 ${
        isLeftSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
      }`}>
        {/* Sidebar Brand Logo */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F0F0F]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center text-black font-serif font-bold text-sm shadow-lg shadow-amber-500/10">S</div>
            <div>
              <span className="text-sm font-serif tracking-[0.25em] text-white uppercase block leading-none">Scriptor AI</span>
              <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase mt-1 block">Diarization v1.2</span>
            </div>
          </div>
          <button 
            id="close-sidebar-btn"
            onClick={() => setIsLeftSidebarOpen(false)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Selector */}
        <div className="flex border-b border-white/5 bg-[#0B0B0B] p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveMainView('workspace')}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer ${
              activeMainView === 'workspace' ? 'bg-[#151515] text-amber-500 border border-white/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveMainView('feedback')}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer ${
              activeMainView === 'feedback' ? 'bg-[#151515] text-amber-500 border border-white/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Enquiry
          </button>
          <button
            onClick={() => setActiveMainView('privacy')}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer ${
              activeMainView === 'privacy' ? 'bg-[#151515] text-amber-500 border border-white/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Privacy
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => { setActiveMainView('admin'); fetchAdminDashboard(currentUser.email); }}
              className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all cursor-pointer ${
                activeMainView === 'admin' ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20' : 'text-amber-400 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {/* Live Audio Source Configuration panel */}
        <div className="p-5 border-b border-white/5 bg-[#0A0A0A]/30">
          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-3.5 flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-amber-500" />
            <span>Transcription Input</span>
          </div>

          {/* Upload Audio File area */}
          <div 
            id="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/10 hover:border-amber-500/30 rounded-lg p-4 text-center cursor-pointer bg-[#121212]/50 hover:bg-[#121212] transition-all group mb-4"
          >
            <Upload className="w-6 h-6 mx-auto text-slate-500 group-hover:text-amber-500 mb-2 transition-colors" />
            <div className="text-xs text-slate-300 font-medium">Upload Audio File</div>
            <div className="text-[10px] text-slate-600 mt-1 font-mono">WAV, MP3, M4A up to 50MB</div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Micro Recording Action */}
          <div className="bg-[#121212] border border-white/5 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Voice Capture</span>
              {isRecording && (
                <span className="text-[9px] text-red-400 font-mono animate-pulse uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>Rec: {formatTime(recordingSeconds)}</span>
                </span>
              )}
            </div>

            {!isRecording ? (
              <button
                id="mic-start-btn"
                onClick={handleStartRecording}
                className="w-full py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 font-sans font-bold text-[10px] uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Microphone</span>
              </button>
            ) : (
              <button
                id="mic-stop-btn"
                onClick={handleStopRecording}
                className="w-full py-2 bg-amber-500 text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all shadow-lg animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Recording</span>
              </button>
            )}

            {recordedAudioUrl && !isRecording && (
              <div className="mt-3.5 pt-3 border-t border-white/5">
                <div className="text-[10px] text-slate-500 font-mono mb-2">Recorded Speech Cache:</div>
                <audio src={recordedAudioUrl} controls className="w-full h-8 rounded bg-[#181818] outline-none" />
                <button
                  id="transcribe-rec-btn"
                  onClick={handleTranscribeRecordedAudio}
                  className="w-full mt-2.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Transcribe Captured Voice</span>
                </button>
              </div>
            )}
          </div>

          {/* Engine Parameters Toggle */}
          <div className="mt-4 pt-3.5 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Detect Speakers</label>
              <input 
                type="number" 
                min={1} 
                max={6}
                value={speakerCount} 
                onChange={(e) => setSpeakerCount(Math.max(1, Math.min(6, parseInt(e.target.value) || 2)))}
                className="w-12 text-center bg-[#151515] text-amber-400 text-[10px] font-mono border border-white/5 rounded py-0.5"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Target Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#151515] text-slate-300 text-[10px] font-mono border border-white/5 rounded py-0.5 px-2 focus:outline-none"
              >
                <option value="Auto">Detect Automatically</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Japanese">Japanese</option>
                <option value="Indonesian">Indonesian</option>
                <option value="German">German</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transcription Search */}
        <div className="px-5 py-3">
          <input
            id="search-docs-input"
            type="text"
            placeholder="Search transcript archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151515] border border-white/5 rounded py-2 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* History Archives Collection */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
            <History className="w-3 h-3 text-amber-500/60" />
            <span>Vault Archives ({filteredTranscripts.length})</span>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-5 space-y-1.5">
            {filteredTranscripts.length === 0 ? (
              <div className="p-6 text-center text-slate-600 text-xs italic">
                No matching transcripts inside vault.
              </div>
            ) : (
              filteredTranscripts.map(trans => (
                <div
                  key={trans.id}
                  id={`archive-item-${trans.id}`}
                  onClick={() => setActiveId(trans.id)}
                  className={`group flex items-center justify-between p-3 rounded transition-all duration-200 cursor-pointer ${
                    trans.id === activeId 
                      ? 'bg-[#151515] text-white border-l-2 border-amber-500 border border-y-white/5 border-r-white/5' 
                      : 'text-slate-400 hover:bg-[#151515]/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <span className={`text-xs font-serif truncate ${trans.id === activeId ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'}`}>
                      {trans.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-600 font-mono">
                      <span>{trans.duration}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                      <span className="uppercase text-[8px] text-amber-500/80">{trans.language}</span>
                    </div>
                  </div>
                  <button
                    id={`delete-trans-btn-${trans.id}`}
                    onClick={(e) => handleDeleteTranscription(trans.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 hover:text-red-400 transition-all text-slate-600"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active User Session & Limits display */}
        <div className="p-5 border-t border-white/5 bg-[#0C0C0C] space-y-3.5 shrink-0">
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Session</span>
              <span className="text-xs font-semibold text-white truncate block">{currentUser?.email}</span>
              <span className="text-[8px] font-mono uppercase tracking-wider text-amber-500 mt-0.5 block">
                {currentUser?.role === 'admin' ? '🛡️ Scriptor Owner' : '👥 Authorized Client'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 bg-[#1C1C1C] hover:bg-red-950/20 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Out</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
              <span>Monthly Allowance Used</span>
              <span>
                {currentUser?.role === 'admin' 
                  ? 'Unlimited Time' 
                  : `${Math.floor((currentUser?.usedSeconds || 0) / 60)}m ${Math.round((currentUser?.usedSeconds || 0) % 60)}s / ${Math.round(monthlyLimitSeconds / 60)}m`
                }
              </span>
            </div>
            {currentUser?.role !== 'admin' && (
              <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((currentUser?.usedSeconds || 0) / monthlyLimitSeconds) * 100)}%` }}
                ></div>
              </div>
            )}
            <span className="text-[8px] text-slate-600 font-mono mt-1.5 block">
              {currentUser?.role === 'admin' 
                ? 'Owner has un-restricted development and execution cycles.' 
                : 'Free tiers reset on a 30-day billing cycle.'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 🖥️ MIDDLE WORKSPACE: Active Transcript Viewer, Audio Player, Waveform, and Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Workspace Action Toolbar */}
        <div className="h-20 bg-[#0F0F0F] border-b border-white/5 px-6 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-4">
            {!isLeftSidebarOpen && (
              <button
                id="open-sidebar-btn"
                onClick={() => setIsLeftSidebarOpen(true)}
                className="p-2 bg-[#151515] border border-white/5 hover:border-white/10 text-slate-300 rounded transition-colors"
                title="Expand Archives"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            {activeTranscript ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
                <h1 className="font-serif text-white text-sm md:text-base tracking-wide max-w-xs md:max-w-lg truncate">
                  {activeTranscript.title}
                </h1>
              </div>
            ) : (
              <div className="font-serif text-slate-500 text-sm tracking-widest uppercase">Vault Empty</div>
            )}
          </div>

          {activeTranscript && (
            <div className="flex items-center gap-2">
              <button
                id="copy-text-btn"
                onClick={handleCopyTranscriptText}
                className="p-2 bg-[#151515] border border-white/5 hover:border-white/10 text-slate-400 hover:text-white rounded transition-all"
                title="Copy Full Transcript"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              
              {/* Download dropdown */}
              <div className="flex items-center bg-[#151515] rounded border border-white/5 p-0.5">
                <button
                  id="dl-txt-btn"
                  onClick={() => handleDownloadTranscript('txt')}
                  className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold text-slate-400 hover:text-white rounded"
                  title="Download TXT"
                >
                  TXT
                </button>
                <button
                  id="dl-srt-btn"
                  onClick={() => handleDownloadTranscript('srt')}
                  className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold text-slate-400 hover:text-white rounded border-l border-white/5"
                  title="Download SRT Subtitle"
                >
                  SRT
                </button>
                <button
                  id="dl-json-btn"
                  onClick={() => handleDownloadTranscript('json')}
                  className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold text-slate-400 hover:text-white rounded border-l border-white/5"
                  title="Download JSON structure"
                >
                  JSON
                </button>
              </div>

              {!isRightSidebarOpen && (
                <button
                  id="open-companion-btn"
                  onClick={() => setIsRightSidebarOpen(true)}
                  className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider font-bold py-2 px-3 rounded transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Assistant</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Workspace / Admin / Feedback / Privacy View Router */}
        {activeMainView === 'admin' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070707] space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Dashboard summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Authorized Signups</span>
                  <span className="text-2xl font-serif text-white block mt-1.5">{adminData?.users?.length || 1}</span>
                  <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">Live profiles in database</span>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Monthly Base Limit</span>
                  <span className="text-2xl font-serif text-amber-500 block mt-1.5">{Math.round(monthlyLimitSeconds / 60)} Mins</span>
                  <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">For general clients (1h 15m default)</span>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">Enquiries & Feedbacks</span>
                  <span className="text-2xl font-serif text-white block mt-1.5">{adminData?.feedbacks?.length || 0}</span>
                  <span className="text-[9px] text-slate-600 font-mono uppercase block mt-1">Direct inquiries received</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly limit config */}
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5 lg:col-span-1 space-y-4">
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
                        className="flex-1 bg-[#151515] border border-white/5 rounded px-3 py-1.5 text-xs text-amber-400 font-mono text-center focus:outline-none focus:border-amber-500/40"
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
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5 lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-serif text-white uppercase tracking-wider">Registered Users & Consumption</h3>
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono">Real-time stats</span>
                  </div>

                  <div className="overflow-x-auto max-h-60 overflow-y-auto space-y-2 pr-1">
                    {adminData?.users?.map((usr: any) => (
                      <div key={usr.email} className="flex items-center justify-between p-3 bg-[#141414] rounded border border-white/5 text-xs">
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
                              title="Reset usage counters back to zero"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feedbacks */}
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-serif text-white uppercase tracking-wider">Direct enquiries (althafka944@gmail.com)</h3>
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono">Latest inquiries</span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {adminData?.feedbacks?.length === 0 ? (
                      <div className="p-6 text-center text-slate-600 text-xs italic">
                        No enquiries received yet.
                      </div>
                    ) : (
                      adminData?.feedbacks?.map((fb: any) => (
                        <div key={fb.id} className="p-3.5 bg-[#141414] rounded border border-white/5 space-y-2 text-xs">
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
                <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-serif text-white uppercase tracking-wider">Secure File Audit Logs</h3>
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono">Transaction feed</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {adminData?.logs?.map((log: any) => (
                      <div key={log.id} className="p-2.5 bg-[#141414] rounded border border-white/5 text-[11px] flex justify-between gap-2">
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
          </div>
        ) : activeMainView === 'feedback' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070707] flex items-center justify-center">
            <div className="w-full max-w-lg bg-[#0F0F0F] border border-white/5 rounded-xl p-8 space-y-6 shadow-2xl">
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
          </div>
        ) : activeMainView === 'privacy' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070707] space-y-6 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/5 rounded-xl p-8 md:p-10 space-y-6 shadow-2xl relative overflow-hidden">
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
          </div>
        ) : isTranscribing ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0A] p-8 text-center">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <h3 className="text-base font-serif text-white tracking-wide">Scriptor AI Processing Pipeline</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed font-mono">
              Analyzing vocal signatures, assigning speaker segment IDs, and formatting high-fidelity dialogue metadata.
            </p>
            <div className="w-64 bg-[#151515] h-2 rounded-full overflow-hidden mt-6 border border-white/5">
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${transcriptionProgress}%` }}></div>
            </div>
            <span className="text-[10px] text-slate-600 font-mono mt-2">{transcriptionProgress}% completed</span>
          </div>
        ) : activeTranscript ? (
          <div className="flex-1 flex flex-col overflow-hidden">
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
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            />
            
            {/* 🎵 AUDIO PLAYER CONTROL PANEL WITH LIVE WAVEFORM ANIMATION */}
            <div className="bg-[#111111] border-b border-white/5 p-5 md:px-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
                
                {/* Audio Controls */}
                <div className="flex items-center gap-4">
                  <button
                    id="player-rewind"
                    onClick={() => {
                      setCurrentTime(0);
                      if (audioElRef.current && activeAudioUrl) {
                        audioElRef.current.currentTime = 0;
                      }
                    }}
                    className="p-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-white/5 rounded-full text-slate-400 hover:text-white transition-all"
                    title="Rewind to start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    id="player-play-toggle"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-4 bg-amber-500 hover:bg-amber-400 rounded-full text-black transition-all shadow-lg shadow-amber-500/10"
                    title={isPlaying ? 'Pause playback' : 'Play transcription'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <div className="text-xs font-mono text-slate-400 min-w-[100px]">
                    <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span>{activeTranscript.duration}</span>
                  </div>
                </div>

                {/* Live Responsive Waveform Visualization */}
                <div className="flex-1 max-w-lg w-full flex items-center justify-center gap-[3px] h-8 overflow-hidden px-4">
                  {Array.from({ length: 48 }).map((_, idx) => {
                    // Generate nice wave shapes
                    const baseHeight = Math.sin((idx / 48) * Math.PI * 2.5) * 14 + 16;
                    const bounce = isPlaying ? Math.random() * 12 : 1;
                    const finalHeight = Math.max(4, Math.min(32, baseHeight + bounce));
                    
                    // Highlight played wave segments
                    const isPlayed = (idx / 48) * duration < currentTime;

                    return (
                      <div 
                        key={idx}
                        className={`w-[4px] rounded-full transition-all duration-300 ${
                          isPlayed ? 'bg-amber-500' : 'bg-[#222222]'
                        }`}
                        style={{ height: `${finalHeight}px` }}
                      ></div>
                    );
                  })}
                </div>

                {/* Speed & Volume modifiers */}
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 bg-[#151515] p-1 rounded border border-white/5">
                    {['1x', '1.25x', '1.5x', '2x'].map((speed) => {
                      const speedNum = parseFloat(speed);
                      return (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speedNum)}
                          className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono font-bold rounded ${
                            playbackSpeed === speedNum ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {speed}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 hover:bg-[#1A1A1A] text-slate-400 hover:text-white rounded"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                      className="w-16 accent-amber-500 h-1 bg-[#222] rounded-lg appearance-none"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* SEGMENTS LIST: Precision Audio to Perfect Text */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0A0A0A] space-y-5">
              <div className="max-w-3xl mx-auto space-y-4">
                
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  <span>Diarized Speakers & Statements</span>
                  <span>Double-click name or statement to correct</span>
                </div>

                {activeTranscript.segments.map((seg, index) => {
                  const isCurrent = currentTime >= parseTimestampToSeconds(seg.timestamp) && 
                    (index === activeTranscript.segments.length - 1 || currentTime < parseTimestampToSeconds(activeTranscript.segments[index+1].timestamp));

                  return (
                    <div
                      key={seg.id}
                      id={`segment-${seg.id}`}
                      className={`group flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-amber-500/[0.03] border-amber-500/25 shadow-md' 
                          : 'bg-[#0F0F0F] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Segment play-jump trigger */}
                      <button
                        onClick={() => handleSeekToSegment(seg.timestamp)}
                        className="flex items-center gap-1.5 bg-[#151515] hover:bg-[#1F1F1F] text-slate-500 hover:text-amber-400 text-[10px] font-mono px-2.5 py-1.5 rounded border border-white/5 transition-all mt-0.5 shadow-sm"
                        title="Seek player here"
                      >
                        <Clock className="w-3 h-3 text-amber-500/70" />
                        <span>{seg.timestamp}</span>
                      </button>

                      <div className="flex-1 space-y-2">
                        {/* Speaker Identity Badge */}
                        <div className="flex items-center gap-2">
                          {editingSpeakerId === seg.id ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingSpeakerName}
                                onChange={(e) => setEditingSpeakerName(e.target.value)}
                                className="bg-[#1C1C1C] border border-amber-500/40 text-xs text-white px-2 py-0.5 rounded focus:outline-none font-medium"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveSpeakerName(seg.id, seg.speaker)}
                                className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingSpeakerId(null)}
                                className="p-1 bg-[#252525] text-slate-400 rounded hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-serif font-semibold text-white tracking-wide uppercase">
                                {seg.speaker}
                              </span>
                              <button
                                onClick={() => handleStartEditingSpeaker(seg.id, seg.speaker)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-amber-400 rounded transition-all"
                                title="Rename speaker globally"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Text segment content */}
                        <div>
                          {editingSegmentId === seg.id ? (
                            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-[#1C1C1C] border border-amber-500/40 text-slate-200 text-sm p-2 rounded focus:outline-none leading-relaxed font-sans"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingSegmentId(null)}
                                  className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 hover:text-white rounded bg-[#252525]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveSegmentText(seg.id)}
                                  className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-black rounded bg-amber-500 hover:bg-amber-400"
                                >
                                  Save Correction
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p 
                              onDoubleClick={() => handleStartEditingSegment(seg.id, seg.text)}
                              className="text-slate-300 text-sm md:text-base leading-relaxed font-sans cursor-pointer hover:text-white hover:bg-white/[0.01] rounded py-0.5 px-1 transition-all"
                            >
                              {seg.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0A0A0A] text-center">
            <VolumeX className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
            <h3 className="text-lg font-serif text-white">No active transcription</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Upload a meeting draft, record speaking intervals via microphone, or load a realistic onboarding demo to begin.
            </p>
            <button
              onClick={() => {
                setSavedTranscriptions(PRELOADED_DRAFTS);
                setActiveId(PRELOADED_DRAFTS[0].id);
              }}
              className="mt-5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded transition-all"
            >
              Load Demo Workspace
            </button>
          </div>
        )}
      </div>

      {/* 🧭 RIGHT SIDEBAR: Scriptor AI Companion & Translation Station */}
      <div id="chat-sidebar" className={`flex flex-col bg-[#0F0F0F] border-l border-white/5 h-full shadow-2xl transition-all duration-300 z-20 ${
        isRightSidebarOpen ? 'w-96' : 'w-0 overflow-hidden'
      }`}>
        {/* Companion Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F0F0F]">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-1.5 rounded text-amber-500 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-sm text-white block tracking-wider uppercase">DocAssist Engine</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono uppercase tracking-widest mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Copilot Active</span>
              </span>
            </div>
          </div>
          <button 
            id="close-chat-btn"
            onClick={() => setIsRightSidebarOpen(false)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title="Collapse Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controllers: Summary, Tasks, Translation, Chat */}
        <div className="flex border-b border-white/5 bg-[#0A0A0A]/30 p-1">
          <button
            onClick={() => { setActiveTab('summary'); handleAIAction('summarize'); }}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all ${
              activeTab === 'summary' ? 'bg-[#151515] text-amber-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => { setActiveTab('actions'); handleAIAction('action-items'); }}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all ${
              activeTab === 'actions' ? 'bg-[#151515] text-amber-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => { setActiveTab('translate'); }}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all ${
              activeTab === 'translate' ? 'bg-[#151515] text-amber-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Translate
          </button>
          <button
            onClick={() => { setActiveTab('chat'); }}
            className={`flex-1 py-2 text-[9px] uppercase tracking-wider font-bold rounded transition-all ${
              activeTab === 'chat' ? 'bg-[#151515] text-amber-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Ask AI
          </button>
        </div>

        {/* Active Content Panel */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#0A0A0A]/10">
          
          {/* 1. Summary & Action Items Tab */}
          {(activeTab === 'summary' || activeTab === 'actions') && (
            <div className="space-y-4">
              {isAiProcessing ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Running AI presets...</span>
                </div>
              ) : aiActionResult ? (
                <div className="prose prose-invert max-w-none text-xs bg-[#121212] p-4 rounded border border-white/5 shadow-inner leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {aiActionResult}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600 text-xs italic">
                  Select a preset tab or click below to trigger high-fidelity model analysis.
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
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Indonesian">Indonesian (Bahasa Indonesia)</option>
                </select>
                <button
                  onClick={() => handleAIAction('translate')}
                  disabled={isAiProcessing}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-xs uppercase tracking-widest rounded flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {isAiProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Languages className="w-3.5 h-3.5" />}
                  <span>Translate Full Dialogue</span>
                </button>
              </div>

              {aiActionResult && (
                <div className="prose prose-invert max-w-none text-xs bg-[#121212] p-4 rounded border border-white/5 shadow-inner leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {aiActionResult}
                </div>
              )}
            </div>
          )}

          {/* 3. DocAssist Conversational AI Assistant Tab */}
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
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

// Simple parser helper
function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return 0;
}
