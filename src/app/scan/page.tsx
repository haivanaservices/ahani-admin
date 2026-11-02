'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/client';
import { Camera, Volume2, AlignLeft, ChevronDown, X, CreditCard, Play, Square, Loader2, QrCode, Menu, Search, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import WhisperMicButton from '../../components/WhisperMicButton';
import AhaniOtpModal from '../../components/AhaniOtpModal';
import { Html5Qrcode } from 'html5-qrcode';

const FALLBACK_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani',
  'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese',
  'Catalan', 'Cebuano', 'Chichewa', 'Chinese (Simplified)', 'Chinese (Traditional)',
  'Corsican', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto',
  'Estonian', 'Farsi (Persian)', 'Filipino', 'Finnish', 'French', 'Frisian',
  'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Haitian Creole',
  'Hausa', 'Hawaiian', 'Hebrew', 'Hindi', 'Hmong', 'Hungarian', 'Icelandic',
  'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada',
  'Kazakh', 'Khmer', 'Kinyarwanda', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao',
  'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malay',
  'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian',
  'Odia', 'Pashto', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian',
  'Samoan', 'Scots Gaelic', 'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala',
  'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish',
  'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian',
  'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu'
];

export default function AhaniWebScanner() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [resultText, setResultText] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canShowFollowUp, setCanShowFollowUp] = useState(false);
  
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const [showNoMatchModal, setShowNoMatchModal] = useState(false);
  const [isAgencyOffline, setIsAgencyOffline] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentImageFile = useRef<File | null>(null);

  // Live QR Scanner State
  const [showQRScanner, setShowQRScanner] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (isLangDropdownOpen && langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen, isLangDropdownOpen]);

  useEffect(() => {
    checkUserSession();
    fetchLanguages();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserEmail(session.user.email || null);
        fetchUserCredits();
      } else {
        setCurrentUserEmail(null);
        setCreditBalance(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      let tick = 0;
      timer = setInterval(() => {
        tick++;
        if (tick === 1) setLoadingMessage(`Translating to ${selectedLanguage}...`);
        if (tick === 2) setLoadingMessage('Generating summary...');
        if (tick === 3) setLoadingMessage('Almost done...');
      }, 3000);
    } else {
      setLoadingMessage('Reading document...');
    }
    return () => clearInterval(timer);
  }, [isLoading, selectedLanguage]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startLiveScanner = () => {
    setShowQRScanner(true);
    
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            setShowQRScanner(false);
            
            let campaignId = decodedText;
            if (campaignId.startsWith('http') || campaignId.includes('/scan/')) {
              try {
                const url = new URL(campaignId);
                const pathSegments = url.pathname.split('/').filter(Boolean);
                campaignId = pathSegments[pathSegments.length - 1]; 
              } catch (err) {
                console.error("Failed to parse URL:", err);
              }
            }
            
            const existingQRs = JSON.parse(localStorage.getItem('ahani_saved_qrs') || '[]');
            if (!existingQRs.includes(campaignId)) {
              existingQRs.push(campaignId);
              localStorage.setItem('ahani_saved_qrs', JSON.stringify(existingQRs));
            }
            
            alert('Agency linked successfully! Your next scan is covered.');
            
          }).catch(console.error);
        },
        (errorMessage) => {
          // Silent continuous read failures
        }
      ).catch((err) => {
        console.error("Failed to start scanner", err);
        alert("Camera access denied or unavailable.");
        setShowQRScanner(false);
      });
    }, 200);
  };

  const stopLiveScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current?.clear();
        setShowQRScanner(false);
      }).catch((err) => {
        console.error("Failed to stop scanner", err);
        setShowQRScanner(false);
      });
    } else {
      setShowQRScanner(false);
    }
  };

  const checkUserSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserEmail(user.email || null);
      fetchUserCredits();
    }
  };

  const fetchUserCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('citizen_wallets')
        .select('monthly_free_scans_max, monthly_free_scans_used, purchased_credits')
        .eq('citizen_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const freeScansLeft = Math.max(0, (data.monthly_free_scans_max || 0) - (data.monthly_free_scans_used || 0));
        const paidCredits = data.purchased_credits || 0;
        setCreditBalance(freeScansLeft + paidCredits);
      } else {
        setCreditBalance(0);
      }
    } catch (e) {
      console.error('Failed fetching credits:', e);
      setCreditBalance(0);
    }
  };

  const fetchLanguages = async () => {
    const { data } = await supabase.from('supported_languages').select('language_name').order('language_name');
    if (data && data.length > 0) {
      setLanguages(data.map((l: any) => l.language_name));
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          if (width > 1600) {
            height = Math.round((height * 1600) / width);
            width = 1600;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.80);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (isPlaying) stopAudio();
    setIsLoading(true);
    setResultText(null);
    setAudioBase64(null);
    setCanShowFollowUp(false);
    setShowNoMatchModal(false);

    try {
      const rawFile = e.target.files[0];
      const compressedFile = await compressImage(rawFile);
      currentImageFile.current = compressedFile;

      await processDocument(compressedFile, false);
    } catch (error) {
      console.error("Capture Error:", error);
      setResultText('Could not capture image. Please try again.');
      setIsLoading(false);
    }
  };

  const processDocument = async (imageFile: File, allowCitizenBilling: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const savedQRs = JSON.parse(localStorage.getItem('ahani_saved_qrs') || '[]');
      const filePath = `scans/${Date.now()}_scan.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('ephemeral_scans')
        .upload(filePath, imageFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('read-mail', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: {
          filePath,
          targetLanguage: selectedLanguage,
          generateAudio: isVoiceMode,
          saved_qr_codes: savedQRs,
          allow_citizen_billing: allowCitizenBilling,
          use_personal_credits: allowCitizenBilling
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.billed_to && data.billed_to.startsWith('citizen')) {
        fetchUserCredits();
      }

      setResultText(data.result || 'Could not read document.');
      setAudioBase64(data.audioBase64);
      
      if (!isVoiceMode) setCanShowFollowUp(true);
      if (isVoiceMode && data.audioBase64) {
        playAudio(data.audioBase64);
      }
   } catch (error: any) {
      console.error("Raw Supabase Error:", error);
      
      const status = error?.context?.status || error?.status || 0;
      const errorStr = (typeof error === 'object' ? JSON.stringify(error) : String(error)).toLowerCase();

      if (status === 402 || errorStr.includes('402') || errorStr.includes('funds') || errorStr.includes('insufficient')) {
        setIsAgencyOffline(true);
        setShowNoMatchModal(true);
      } else if (status === 404 || errorStr.includes('404') || errorStr.includes('no matching agency')) {
        setIsAgencyOffline(false);
        setShowNoMatchModal(true);
      } else {
        setResultText('Could not read document. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateOtp = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    setIsSendingOtp(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput.trim(),
        options: {
          shouldCreateUser: true
        }
      });

      if (error) throw error;

      setShowNoMatchModal(false);
      setShowOtpModal(true);
    } catch (err: any) {
      alert(err.message || 'Error sending code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpVerified = async () => {
    setShowOtpModal(false);
    setShowEmailCapture(false);
    
    if (currentImageFile.current) {
       setTimeout(() => processDocument(currentImageFile.current!, true), 500);
    }
  };

  const askFollowUp = async (inputQuery: string) => {
    if (!inputQuery.trim() || !currentImageFile.current) return;
    
    if (isPlaying) stopAudio();
    setIsAskingQuestion(true);
    setCanShowFollowUp(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const savedQRs = JSON.parse(localStorage.getItem('ahani_saved_qrs') || '[]');
      const filePath = `scans/${Date.now()}_followup.jpg`;

      await supabase.storage.from('ephemeral_scans').upload(filePath, currentImageFile.current);

      const { data, error } = await supabase.functions.invoke('read-mail', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: {
          filePath,
          targetLanguage: selectedLanguage,
          generateAudio: isVoiceMode,
          question: inputQuery,
          saved_qr_codes: savedQRs,
          allow_citizen_billing: true,
          use_personal_credits: true
        }
      });

      if (error) throw error;

      setResultText(prev => `${prev}\n\nQ: ${inputQuery}\nA: ${data.result}`);
      setAudioBase64(data.audioBase64);
      
      if (!isVoiceMode) setCanShowFollowUp(true);
      if (isVoiceMode && data.audioBase64) playAudio(data.audioBase64);

    } catch (error) {
      console.error("Follow up error:", error);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const playAudio = (base64: string) => {
    if (audioRef.current) audioRef.current.pause();
    const snd = new Audio(`data:audio/mp3;base64,${base64}`);
    snd.onended = () => {
      setIsPlaying(false);
      setCanShowFollowUp(true);
    };
    audioRef.current = snd;
    snd.play();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCanShowFollowUp(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const filteredLanguages = languages.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()));
  const isListenDisabled = isAskingQuestion || isLoading || isRecording || !audioBase64;

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans relative">
      
      {/* Live Video Scanner Full-Screen Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="absolute top-6 right-6 z-[210]">
            <button 
              onClick={stopLiveScanner} 
              className="bg-slate-800 text-white p-3 rounded-full hover:bg-slate-700 transition"
            >
              <X size={24} />
            </button>
          </div>
          <div className="text-white font-extrabold text-xl mb-6 z-[210]">Scan Agency QR Code</div>
          
          <div 
            id="qr-reader" 
            className="w-full max-w-sm rounded-3xl overflow-hidden bg-black border-4 border-slate-800 shadow-2xl relative"
          ></div>
          
          <div className="text-slate-400 font-medium text-sm mt-8 text-center max-w-xs px-4 z-[210]">
            Point your camera at the QR code. It will scan automatically.
          </div>
        </div>
      )}

      {/* Discrete Floating Action Bar for Speech */}
      {canShowFollowUp && !isLoading && (
        <div className="fixed bottom-0 left-0 w-full bg-slate-50/95 backdrop-blur-xl border-t border-slate-200 px-4 pt-4 pb-8 sm:pb-6 z-40 animate-in slide-in-from-bottom-8">
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center">
            
            {/* Keeping the Mic mounted at all times prevents browser permission spam. Visually fades/shrinks when disabled. */}
            <div className={`transition-all duration-300 flex flex-col items-center justify-center ${
              (isPlaying || isAskingQuestion) ? 'opacity-40 pointer-events-none scale-95' : 'opacity-100 hover:scale-105'
            }`}>
              
              <div className="relative flex items-center justify-center mb-2">
                <div className={`transition-all duration-300 ${isAskingQuestion ? 'opacity-0 absolute pointer-events-none' : 'opacity-100 relative'} bg-white rounded-full shadow-sm ring-1 ring-slate-200 p-1`}>
                  <WhisperMicButton 
                    onTranscriptionCompleted={askFollowUp} 
                    onRecordingStart={() => {
                      setIsRecording(true);
                      stopAudio(); 
                    }}
                    onRecordingStop={() => setIsRecording(false)}
                  />
                </div>
                
                {isAskingQuestion && (
                  <div className="bg-purple-100 text-purple-900 rounded-full p-4 shadow-md absolute">
                    <Loader2 className="animate-spin" size={24}/>
                  </div>
                )}
              </div>
              
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-center">
                {isAskingQuestion ? 'Thinking...' : (isPlaying ? 'Speaking...' : 'Ask anything')}
              </span>
              
            </div>

          </div>
        </div>
      )}

      <header ref={headerRef} className="fixed top-0 left-0 w-full bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center z-[100]">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition"
          onClick={() => router.push('/')}
        >
          <Image alt="Ahani Logo" className="rounded-full w-8 h-8 sm:w-10 sm:h-10" height={32} src="/image_4fbdd3.png" width={32} />
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-purple-900 tracking-tight leading-none">Ahani</h1>
            {currentUserEmail && (
              <span className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium hidden sm:block">
                {currentUserEmail}
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex gap-2 items-center">
          <button 
            onClick={startLiveScanner}
            className="bg-purple-900 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5"
          >
            <QrCode size={16} /> Agency
          </button>
          <button 
            onClick={() => router.push('/buy-credits')}
            className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${
              (creditBalance ?? 0) <= 0 ? 'bg-red-100 text-red-900' : 'bg-purple-100 text-purple-900'
            }`}
          >
            <CreditCard size={16} />
            {creditBalance !== null ? `${creditBalance}` : 'Wallet'}
          </button>
          {currentUserEmail && (
            <button 
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 transition"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        <button 
          className="sm:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-3 sm:hidden animate-in slide-in-from-top-2">
            {currentUserEmail && (
              <p className="text-xs text-center text-slate-500 font-bold border-b border-slate-100 pb-2">
                Logged in as: {currentUserEmail}
              </p>
            )}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                startLiveScanner();
              }}
              className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2"
            >
              <QrCode size={18} /> Scan Agency QR
            </button>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push('/buy-credits');
              }}
              className={`w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 ${
                (creditBalance ?? 0) <= 0 ? 'bg-red-100 text-red-900' : 'bg-purple-900 text-white'
              }`}
            >
              <CreditCard size={18} />
              {creditBalance !== null ? `Wallet: ${creditBalance} Credits` : 'Open Wallet'}
            </button>
            {currentUserEmail && (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full bg-red-50 text-red-700 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2 border border-red-100"
              >
                <LogOut size={18} /> Sign Out
              </button>
            )}
          </div>
        )}
      </header>

      <main className={`flex-grow pt-20 p-6 flex flex-col max-w-2xl mx-auto w-full ${canShowFollowUp ? 'pb-32' : ''}`}>
        
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-2">
          
          <div className="relative" ref={langDropdownRef}>
            <button 
              onClick={() => {
                setIsLangDropdownOpen(!isLangDropdownOpen);
                setLangSearch('');
              }}
              className="w-full flex justify-between items-center bg-purple-50 border border-purple-100 text-purple-900 font-bold text-lg rounded-xl px-4 py-3 outline-none"
            >
              {selectedLanguage}
              <ChevronDown className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col max-h-72">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search language..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-800 font-medium placeholder-slate-400"
                  />
                </div>
                <div className="overflow-y-auto">
                  {filteredLanguages.map(l => (
                    <button
                      key={l}
                      onClick={() => {
                        setSelectedLanguage(l);
                        setIsLangDropdownOpen(false);
                        setLangSearch('');
                      }}
                      className={`w-full text-left px-4 py-3 font-medium transition ${
                        selectedLanguage === l ? 'bg-purple-100 text-purple-900' : 'text-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <div className="px-4 py-4 text-slate-500 text-center font-medium">
                      No languages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => { setIsVoiceMode(true); stopAudio(); }}
              className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition ${isVoiceMode ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              <Volume2 size={18} /> Voice
            </button>
            <button 
              onClick={() => { setIsVoiceMode(false); stopAudio(); }}
              className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition ${!isVoiceMode ? 'bg-purple-900 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              <AlignLeft size={18} /> Text
            </button>
          </div>
        </div>

        <div className="flex-grow bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 overflow-y-auto relative">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="animate-spin text-purple-600" size={40} />
              <p className="text-lg font-bold text-purple-900 animate-pulse">{loadingMessage}</p>
            </div>
          ) : resultText ? (
            <div className="space-y-4">
              {isVoiceMode && (
                <div className="flex justify-end sticky top-0 bg-white pb-2 border-b border-slate-50 z-10">
                  {/* Strict State Machine governing the Listen Button */}
                  <button 
                    disabled={isListenDisabled}
                    onClick={isPlaying ? stopAudio : () => audioBase64 && playAudio(audioBase64)}
                    className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${
                      isListenDisabled 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : isPlaying 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {isAskingQuestion ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isRecording ? (
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    ) : isPlaying ? (
                      <Square size={14} fill="currentColor"/>
                    ) : (
                      <Play size={14} fill="currentColor"/>
                    )}
                    {isAskingQuestion ? 'Thinking...' : isRecording ? 'Listening...' : isPlaying ? 'Stop' : 'Listen'}
                  </button>
                </div>
              )}
              
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                {resultText}
                
                {isAskingQuestion && (
                  <span className="flex items-center gap-2 text-purple-600 font-bold animate-pulse mt-4">
                    <Loader2 size={16} className="animate-spin" /> Generating response...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Camera size={48} className="mb-4 opacity-20" />
              <p>Tap Scan Document to start.</p>
            </div>
          )}
        </div>

        {(!isLoading && !isAskingQuestion && !isPlaying && !canShowFollowUp) && (
          <>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleCapture} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-purple-900 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-purple-800 transition active:scale-95"
            >
              <Camera size={28} />
              Scan Document
            </button>
          </>
        )}
      </main>

      {showNoMatchModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => {
                setShowNoMatchModal(false);
                setShowEmailCapture(false);
              }} 
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mt-2">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} className="text-purple-600" />
              </div>
              
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                Translation Options
              </h2>
              
              <p className="text-slate-500 mb-6 text-base font-medium">
                {isAgencyOffline 
                  ? 'The free office scanner is offline. Pay with your wallet to translate now.'
                  : 'Scan the office QR code for a free translation, or pay with your own wallet.'}
              </p>

              {!showEmailCapture ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setShowNoMatchModal(false);
                      startLiveScanner();
                    }}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                  >
                    <QrCode size={20} /> Scan Office QR Code
                  </button>

                  {currentUserEmail && (creditBalance ?? 0) > 0 ? (
                    <button 
                      onClick={() => {
                        setShowNoMatchModal(false);
                        if (currentImageFile.current) processDocument(currentImageFile.current, true);
                      }}
                      className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition"
                    >
                      Pay with Wallet (1 Credit)
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (currentUserEmail) {
                          router.push('/buy-credits');
                        } else {
                          setShowEmailCapture(true);
                        }
                      }}
                      className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition"
                    >
                      Pay with Credit Card
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <p className="text-sm font-semibold text-slate-700">
                    Enter your email to link your wallet:
                  </p>
                  <input 
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-900"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowEmailCapture(false)}
                      className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleInitiateOtp}
                      disabled={isSendingOtp || !emailInput.includes('@')}
                      className="flex-1 bg-purple-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSendingOtp ? <Loader2 className="animate-spin" size={18} /> : 'Send Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AhaniOtpModal 
        email={emailInput}
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}