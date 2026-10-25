'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/client';
import { Camera, Volume2, AlignLeft, ChevronDown, X, CreditCard, Play, Square, Loader2, QrCode, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import WhisperMicButton from '../../components/WhisperMicButton';
import AhaniOtpModal from '../../components/AhaniOtpModal';

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
  const supabase = createClient();
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
  
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Fallback Modal & Auth Flow States
  const [showNoMatchModal, setShowNoMatchModal] = useState(false);
  const [isAgencyOffline, setIsAgencyOffline] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Mobile Menu State & Click-Outside Ref
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const [followUpText, setFollowUpText] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentImageFile = useRef<File | null>(null);

  // Handle clicks outside of the mobile menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    checkUserSession();
    fetchLanguages();
  }, []);

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
      const savedQRs = JSON.parse(localStorage.getItem('ahani_saved_qrs') || '[]');
      const filePath = `scans/${Date.now()}_scan.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('ephemeral_scans')
        .upload(filePath, imageFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('read-mail', {
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
      const errorStr = error.toString().toLowerCase();
      if (errorStr.includes('402') || errorStr.includes('funds') || errorStr.includes('insufficient')) {
        setIsAgencyOffline(true);
        setShowNoMatchModal(true);
      } else if (errorStr.includes('404') || errorStr.includes('no matching agency')) {
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
    await checkUserSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('citizen_wallets')
        .select('monthly_free_scans_max, monthly_free_scans_used, purchased_credits')
        .eq('citizen_id', user.id)
        .single();
        
      const freeLeft = Math.max(0, (data?.monthly_free_scans_max || 0) - (data?.monthly_free_scans_used || 0));
      const paid = data?.purchased_credits || 0;
      const balance = freeLeft + paid;

      if (balance > 0) {
        if (currentImageFile.current) {
          processDocument(currentImageFile.current, true);
        }
      } else {
        router.push('/buy-credits');
      }
    }
  };

  const askFollowUp = async (inputQuery: string) => {
    if (!inputQuery.trim() || !currentImageFile.current) return;
    
    if (isPlaying) stopAudio();
    setIsAskingQuestion(true);
    setCanShowFollowUp(false);

    try {
      const savedQRs = JSON.parse(localStorage.getItem('ahani_saved_qrs') || '[]');
      const filePath = `scans/${Date.now()}_followup.jpg`;

      await supabase.storage.from('ephemeral_scans').upload(filePath, currentImageFile.current);

      const { data, error } = await supabase.functions.invoke('read-mail', {
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
      setFollowUpText('');
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

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans relative">
      
      {/* App Bar - Fixed to Top */}
      <header ref={headerRef} className="fixed top-0 left-0 w-full bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center z-[100]">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image alt="Ahani Logo" className="rounded-full w-8 h-8 sm:w-10 sm:h-10" height={32} src="/image_4fbdd3.png" width={32} />
          <h1 className="text-xl sm:text-2xl font-bold text-purple-900 tracking-tight">Ahani</h1>
        </div>

        {/* Desktop Navigation (Hidden on Mobile) */}
        <div className="hidden sm:flex gap-2">
          <button 
            onClick={() => qrInputRef.current?.click()}
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
        </div>

        {/* Mobile Hamburger Button (Visible only on Mobile) */}
        <button 
          className="sm:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-3 sm:hidden animate-in slide-in-from-top-2">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                qrInputRef.current?.click();
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
          </div>
        )}
      </header>

      {/* Hidden QR Code Picker */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={qrInputRef} 
        className="hidden" 
        onChange={async (e) => {
          if (!e.target.files?.[0]) return;
          alert('Agency QR scanned and linked to your session!');
        }} 
      />

      {/* Main Content */}
      <main className="flex-grow pt-20 p-6 flex flex-col max-w-2xl mx-auto w-full">
        
        {/* Language & Voice Selector */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-2">
          <div className="relative">
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full appearance-none bg-purple-50 border border-purple-100 text-purple-900 font-bold text-lg rounded-xl px-4 py-3 outline-none"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-900 pointer-events-none" />
          </div>
          
          <div className="flex gap-2">
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

        {/* Translation Output Box */}
        <div className="flex-grow bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="animate-spin text-purple-600" size={40} />
              <p className="text-lg font-bold text-purple-900 animate-pulse">{loadingMessage}</p>
            </div>
          ) : resultText ? (
            <div className="space-y-4">
              {isVoiceMode && (
                <div className="flex justify-end">
                  <button 
                    onClick={isPlaying ? stopAudio : () => audioBase64 && playAudio(audioBase64)}
                    className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${isPlaying ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}
                  >
                    {isPlaying ? <Square size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
                    {isPlaying ? 'Stop' : 'Listen'}
                  </button>
                </div>
              )}
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">
                {resultText}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Camera size={48} className="mb-4 opacity-20" />
              <p>Tap Scan Document to start.</p>
            </div>
          )}
        </div>

        {/* Follow-up Section */}
        {canShowFollowUp && !isLoading && (
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-purple-900 font-bold text-lg">Tap to Talk, Tap to Send</p>
              {isAskingQuestion ? (
                <Loader2 className="animate-spin text-purple-900" size={32}/>
              ) : (
                <WhisperMicButton onTranscriptionCompleted={askFollowUp} />
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-600"
                onKeyDown={(e) => e.key === 'Enter' && askFollowUp(followUpText)}
              />
              <button 
                onClick={() => askFollowUp(followUpText)}
                disabled={isAskingQuestion || !followUpText.trim()}
                className="bg-purple-900 text-white px-6 rounded-xl font-bold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Main Capture Trigger */}
        {(!isLoading && !isAskingQuestion && !isPlaying) && (
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

      {/* No Match Dialog (QR vs. Credit Choice) */}
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
                {isAgencyOffline ? 'Agency Service Offline' : 'Agency Not Found'}
              </h2>
              <p className="text-slate-500 mb-6 text-sm">
                {isAgencyOffline 
                  ? 'This agency translation service is temporarily unavailable. Pay with your personal wallet to translate immediately.'
                  : 'Scan an agency QR code to link this document, or pay with your personal credit card/wallet.'}
              </p>

              {!showEmailCapture ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setShowNoMatchModal(false);
                      qrInputRef.current?.click();
                    }}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                  >
                    <QrCode size={20} /> Scan Agency QR Code
                  </button>

                  {currentUserEmail && (creditBalance ?? 0) > 0 ? (
                    <button 
                      onClick={() => {
                        setShowNoMatchModal(false);
                        if (currentImageFile.current) processDocument(currentImageFile.current, true);
                      }}
                      className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition"
                    >
                      Pay with Personal Wallet (1 Credit)
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

      {/* OTP Verification Modal */}
      <AhaniOtpModal 
        email={emailInput}
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}