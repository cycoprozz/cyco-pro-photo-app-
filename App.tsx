import React, { useState, useEffect, useRef } from 'react';
import { generateTransformation, editImageWithPrompt, generateAppLogo, analyzeImageContent } from './services/geminiService';
import { HeadshotStyle, BackgroundOption, AppStep, HistoryItem } from './types';
import { ImageUpload } from './components/ImageUpload';
import { Selector, STYLES, BACKGROUNDS, getIconForStyle, getIconForBackground } from './components/StyleSelector';
import { Button } from './components/Button';
import { Wand2, ArrowLeft, Download, RefreshCw, Sparkles, Bot, PenTool, ImagePlus, History, Sliders, Undo2, ChevronRight, ChevronLeft, Sun, Contrast, Eye, Smile, Send, MessageSquare } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalFile, setOriginalFile] = useState<{ data: string, mimeType: string } | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const currentResult = historyIndex >= 0 ? history[historyIndex].image : null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration State
  const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  // Chat/Vision State
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Branding State
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
       const logo = await generateAppLogo();
       if (logo) setAppLogo(logo);
    };
    fetchLogo();
  }, []);

  const addToHistory = (image: string, label: string) => {
    const newItem: HistoryItem = {
      image,
      timestamp: Date.now(),
      label
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newItem];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleFileSelected = async (base64: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const processed = await processFile(base64, mimeType);
      setOriginalFile(processed);
      setStep(AppStep.CONFIG);
    } catch (err: any) {
      setError("Failed to process file. It might be an unsupported or corrupted format.");
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = async (base64: string, mimeType: string): Promise<{data: string, mimeType: string}> => {
    const SUPPORTED_MIMES = [
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gp',
      'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
      'application/pdf', 'text/plain', 'text/html', 'text/markdown', 'text/csv', 'text/xml', 'text/rtf'
    ];

    // If already supported, return as is
    if (SUPPORTED_MIMES.includes(mimeType)) {
      return { data: base64, mimeType };
    }

    // If it's an image but not supported, try to convert via Canvas
    if (mimeType.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const newData = canvas.toDataURL('image/jpeg', 0.9);
            resolve({
              data: newData.split(',')[1],
              mimeType: 'image/jpeg'
            });
          } else {
            resolve({ data: base64, mimeType: 'image/jpeg' }); // Fallback attempt
          }
        };
        img.onerror = () => {
          // If browser can't load it (like RAW), we can't convert it easily on client
          // We'll try to pass it as image/jpeg anyway as a "hail mary" or let it fail gracefully later
          resolve({ data: base64, mimeType: 'image/jpeg' });
        };
        img.src = `data:${mimeType};base64,${base64}`;
      });
    }

    // For other types, try to map to a generic supported type or pass through
    if (mimeType.startsWith('video/')) return { data: base64, mimeType: 'video/mp4' };
    if (mimeType.startsWith('audio/')) return { data: base64, mimeType: 'audio/mp3' };
    if (mimeType.startsWith('text/')) return { data: base64, mimeType: 'text/plain' };

    return { data: base64, mimeType };
  };

  const handleRefImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
         if (typeof reader.result === 'string') {
            setReferenceImage(reader.result);
         }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!originalFile) return;
    
    if (!selectedStyle && !userPrompt) {
      setError("Please select a style or enter a custom prompt.");
      return;
    }

    setStep(AppStep.PROCESSING);
    setIsLoading(true);
    setError(null);
    setChatResponse(null); // Clear previous chat

    const styleP = selectedStyle?.promptModifier || "";
    const bgP = selectedBackground?.promptModifier || "Simple professional background";
    
    try {
      const result = await generateTransformation(originalFile.data, originalFile.mimeType, referenceImage, styleP, bgP, userPrompt);
      addToHistory(result, "Generation");
      setStep(AppStep.RESULT);
    } catch (err: any) {
      setError(err.message || "Generation failed.");
      setStep(AppStep.CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (prompt: string, label: string = "Edit") => {
    if (!currentResult || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await editImageWithPrompt(currentResult, prompt);
      addToHistory(result, label);
      setEditPrompt(""); 
    } catch (err: any) {
      setError(err.message || "Failed to apply edit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisionChat = async () => {
    if (!originalFile || !chatInput.trim()) return;
    setIsChatLoading(true);
    try {
      const response = await analyzeImageContent(originalFile.data, originalFile.mimeType, chatInput);
      setChatResponse(response);
    } catch (e: any) {
      setChatResponse(e.message || "Error analyzing file.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setOriginalFile(null);
    setReferenceImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedStyle(null);
    setSelectedBackground(null);
    setUserPrompt("");
    setChatResponse(null);
    setChatInput("");
    setStep(AppStep.UPLOAD);
    setError(null);
  };

  const navigateHistory = (direction: 'back' | 'forward') => {
    if (direction === 'back' && historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    } else if (direction === 'forward' && historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const downloadImage = () => {
    if (currentResult) {
      const link = document.createElement('a');
      link.href = currentResult;
      link.download = `cyco-pro-result-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#e7e5e4] selection:bg-[#ea580c]/30 pb-20">
      
      {/* Header */}
      <header className="border-b border-[#292524] bg-[#0c0a09]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-[#ea580c] p-2 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.4)] border border-[#c2410c]">
               {appLogo ? (
                 <img src={appLogo} alt="CyCo" className="w-6 h-6 object-cover rounded" />
               ) : (
                 <Bot size={24} className="text-white" />
               )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest uppercase font-orbitron text-white">
                CyCo <span className="text-[#ea580c]">Pro</span>
              </h1>
              <p className="text-[10px] text-[#a8a29e] tracking-wider uppercase">Visual Synthesis Unit</p>
            </div>
          </div>
          {step !== AppStep.UPLOAD && (
             <Button variant="outline" onClick={handleReset} className="!py-2 !px-4 text-xs">
               Reset Unit
             </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-12">
        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-900/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
             <div className="bg-red-500/20 p-2 rounded-full"><Sparkles size={16} /></div>
             <p>{error}</p>
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === AppStep.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-block mb-4 px-3 py-1 border border-[#ea580c]/30 rounded-full bg-[#ea580c]/5 text-[#ea580c] text-xs uppercase tracking-widest">
                Universal System Online
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-6 font-orbitron text-white">
                REFORGE YOUR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] to-[#fcd34d]">REALITY</span>
              </h2>
              <p className="text-lg text-[#a8a29e] max-w-lg mx-auto">
                Upload any file type or codec. Engage Gemini 2.5 multimodal architecture. <br/>Transform or analyze any asset instantly.
              </p>
            </div>
            <ImageUpload onFileSelected={handleFileSelected} />
          </div>
        )}

        {/* STEP 2: Configuration */}
        {step === AppStep.CONFIG && originalFile && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Preview & Ref */}
            <div className="lg:col-span-4 lg:order-1 order-2 space-y-6">
              <div className="sticky top-28 space-y-4">
                 <div className="bg-[#1c1917] border border-[#292524] rounded-xl p-4">
                    <p className="text-xs font-bold text-[#78716c] mb-3 uppercase tracking-widest">Input Source</p>
                    {originalFile.mimeType.startsWith('image/') ? (
                      <img src={`data:${originalFile.mimeType};base64,${originalFile.data}`} alt="Original" className="w-full rounded-lg border border-[#44403c] shadow-lg" />
                    ) : originalFile.mimeType.startsWith('video/') ? (
                      <video 
                        src={`data:${originalFile.mimeType};base64,${originalFile.data}`} 
                        controls 
                        className="w-full rounded-lg border border-[#44403c] shadow-lg"
                      />
                    ) : originalFile.mimeType.startsWith('audio/') ? (
                      <div className="w-full p-4 bg-[#0c0a09] rounded-lg border border-[#44403c] flex flex-col items-center gap-2">
                        <Bot size={32} className="text-[#ea580c]" />
                        <audio 
                          src={`data:${originalFile.mimeType};base64,${originalFile.data}`} 
                          controls 
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-[#0c0a09] flex flex-col items-center justify-center rounded-lg border border-[#44403c] p-4 text-center">
                        <Bot size={48} className="text-[#ea580c] mb-2" />
                        <span className="text-xs font-mono break-all">{originalFile.mimeType}</span>
                        <span className="text-[10px] text-[#78716c] mt-1 uppercase tracking-tighter">Binary Data Stream</span>
                      </div>
                    )}
                 </div>

                 <div className="bg-[#1c1917] border border-[#292524] border-dashed rounded-xl p-4 relative group hover:border-[#ea580c]/50 transition-colors">
                    <p className="text-xs font-bold text-[#78716c] mb-3 uppercase tracking-widest">Style Reference (Inspo)</p>
                    
                    {referenceImage ? (
                      <div className="relative">
                         <img src={referenceImage} alt="Ref" className="w-full h-32 object-cover rounded-lg border border-[#44403c]" />
                         <button 
                           onClick={() => setReferenceImage(null)}
                           className="absolute top-2 right-2 bg-red-900/80 p-1.5 rounded-md hover:bg-red-800 text-white"
                         >
                           <ArrowLeft size={14} className="rotate-45" />
                         </button>
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-[#57534e] group-hover:text-[#ea580c] cursor-pointer">
                         <ImagePlus size={32} className="mb-2" />
                         <span className="text-xs font-medium">Click to Add Inspo Image</span>
                         <input 
                           type="file" 
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={handleRefImageSelected}
                         />
                      </div>
                    )}
                 </div>

                 <Button onClick={handleGenerate} className="w-full !py-4 text-lg shadow-[0_0_20px_rgba(234,88,12,0.3)] mt-4">
                    INITIALIZE GENERATION
                 </Button>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-8 lg:order-2 order-1 space-y-10">
              
              {/* Custom Prompt Card Box */}
              <div className="bg-[#1c1917] border border-[#ea580c]/30 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#ea580c]/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-[#ea580c]/10"></div>
                <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
                   <PenTool size={18} />
                   <h3 className="font-orbitron font-bold tracking-wider">Custom Prompt Override</h3>
                </div>
                <textarea
                   value={userPrompt}
                   onChange={(e) => setUserPrompt(e.target.value)}
                   placeholder="Describe your vision (e.g., 'Turn this shoe into a futuristic hover-boot' or 'Make this person look like an oil painting')..."
                   className="w-full bg-[#0c0a09] border border-[#44403c] rounded-lg p-4 text-[#e7e5e4] placeholder-[#57534e] focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] outline-none h-32 transition-all resize-none"
                />
                <p className="text-xs text-[#78716c] mt-2">
                  *Input in this card box takes priority over selected styles below.
                </p>
              </div>

              {/* Styles */}
              <div>
                 <h3 className="text-sm font-bold text-[#78716c] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 bg-[#ea580c] rounded-full"></span> Select Style Protocol
                 </h3>
                 <Selector<HeadshotStyle> 
                    options={STYLES} 
                    selectedId={selectedStyle?.id || null} 
                    onSelect={setSelectedStyle}
                    renderIcon={getIconForStyle}
                 />
              </div>

              {/* Backgrounds */}
              <div>
                 <h3 className="text-sm font-bold text-[#78716c] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="w-2 h-2 bg-[#ea580c] rounded-full"></span> Select Environment
                 </h3>
                 <Selector<BackgroundOption>
                    options={BACKGROUNDS} 
                    selectedId={selectedBackground?.id || null} 
                    onSelect={setSelectedBackground}
                    renderIcon={getIconForBackground}
                 />
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Processing */}
        {step === AppStep.PROCESSING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
             <div className="relative w-32 h-32 mb-8">
               <div className="absolute inset-0 border border-[#292524] rounded-full"></div>
               <div className="absolute inset-0 border-t-2 border-[#ea580c] rounded-full animate-spin"></div>
               <div className="absolute inset-4 border-b-2 border-[#ea580c] rounded-full animate-spin reverse" style={{animationDuration: '1.5s'}}></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Bot size={48} className="text-[#ea580c] animate-bounce" />
               </div>
             </div>
             <h2 className="text-2xl font-orbitron font-bold text-white mb-2 tracking-widest">PROCESSING ASSET</h2>
             <p className="text-[#a8a29e] font-mono text-sm">Engaging Neural Transformation...</p>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === AppStep.RESULT && currentResult && (
           <div className="animate-fade-in max-w-6xl mx-auto">
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(AppStep.CONFIG)} className="p-2 hover:bg-[#1c1917] rounded-full transition-colors text-[#a8a29e] hover:text-white">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-orbitron font-bold text-white">FINAL OUTPUT</h2>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(AppStep.CONFIG)}>
                    Modify Params
                  </Button>
                  <Button onClick={downloadImage}>
                    <Download size={18} /> DOWNLOAD
                  </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               {/* Image Display & History */}
               <div className="space-y-4">
                 <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(234,88,12,0.25)] bg-[#0c0a09] border border-[#292524] group">
                    <img src={currentResult} alt="Generated" className="w-full h-auto object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ea580c] to-[#fcd34d]"></div>
                 </div>

                 {/* History Scrubber */}
                 <div className="bg-[#1c1917] p-4 rounded-xl border border-[#292524] flex items-center justify-between">
                    <button 
                      onClick={() => navigateHistory('back')}
                      disabled={historyIndex <= 0}
                      className="p-2 hover:bg-[#292524] rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft />
                    </button>
                    <div className="flex gap-2 overflow-x-auto px-2 max-w-[300px] scrollbar-hide">
                      {history.map((item, idx) => (
                        <div 
                          key={item.timestamp}
                          onClick={() => setHistoryIndex(idx)}
                          className={`
                            relative w-12 h-12 flex-shrink-0 cursor-pointer rounded overflow-hidden border-2
                            ${idx === historyIndex ? 'border-[#ea580c]' : 'border-transparent opacity-50 hover:opacity-80'}
                          `}
                        >
                          <img src={item.image} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => navigateHistory('forward')}
                      disabled={historyIndex >= history.length - 1}
                      className="p-2 hover:bg-[#292524] rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight />
                    </button>
                 </div>
               </div>

               {/* Controls & Edit */}
               <div className="space-y-6">
                 
                 {/* Quick Fine-Tuning */}
                 <div className="bg-[#1c1917] rounded-xl p-6 border border-[#292524]">
                    <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
                       <Sliders size={20} />
                       <h3 className="font-orbitron font-bold text-white tracking-wide">Fine-Tune Protocol</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleEdit("Increase brightness and improve lighting balance", "Lighting +")}
                         className="flex items-center justify-center gap-2 bg-[#292524] hover:bg-[#44403c] py-3 rounded-lg text-xs font-bold uppercase transition-colors"
                       >
                         <Sun size={14} /> Boost Light
                       </button>
                       <button 
                         onClick={() => handleEdit("Increase contrast and sharpness, enhance details", "Contrast +")}
                         className="flex items-center justify-center gap-2 bg-[#292524] hover:bg-[#44403c] py-3 rounded-lg text-xs font-bold uppercase transition-colors"
                       >
                         <Contrast size={14} /> Enhance Detail
                       </button>
                       <button 
                         onClick={() => handleEdit("Fix imperfections, smooth surfaces/skin, remove noise", "Retouch")}
                         className="flex items-center justify-center gap-2 bg-[#292524] hover:bg-[#44403c] py-3 rounded-lg text-xs font-bold uppercase transition-colors"
                       >
                         <Wand2 size={14} /> AI Retouch
                       </button>
                       <button 
                         onClick={() => handleEdit("Make colors more vibrant and cinematic", "Vibrance")}
                         className="flex items-center justify-center gap-2 bg-[#292524] hover:bg-[#44403c] py-3 rounded-lg text-xs font-bold uppercase transition-colors"
                       >
                         <Sparkles size={14} /> Vibrance
                       </button>
                    </div>
                 </div>

                 {/* Multimodal Link (LLM Chat) */}
                 <div className="bg-[#1c1917] rounded-xl p-6 border border-[#292524]">
                    <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
                       <MessageSquare size={20} />
                       <h3 className="font-orbitron font-bold text-white tracking-wide">Multimodal Link</h3>
                    </div>
                    
                    {chatResponse && (
                      <div className="mb-4 bg-[#0c0a09] p-3 rounded-lg text-sm text-[#a8a29e] border border-[#292524] max-h-40 overflow-y-auto">
                        <span className="text-[#ea580c] font-bold">AI: </span> {chatResponse}
                      </div>
                    )}

                    <div className="flex gap-2">
                       <input
                         type="text"
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         placeholder="Ask about the file (e.g., 'Summarize this video', 'Transcribe this audio')..."
                         className="flex-1 bg-[#0c0a09] border border-[#44403c] rounded-lg px-4 py-3 text-sm text-white placeholder-[#57534e] focus:border-[#ea580c] outline-none"
                         onKeyDown={(e) => e.key === 'Enter' && handleVisionChat()}
                       />
                       <button 
                         onClick={handleVisionChat}
                         disabled={isChatLoading || !chatInput.trim()}
                         className="bg-[#292524] hover:bg-[#ea580c] text-white p-3 rounded-lg transition-colors disabled:opacity-50"
                       >
                         {isChatLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                       </button>
                    </div>
                 </div>

                 {/* Custom Refinement */}
                 <div className="bg-[#1c1917] rounded-xl p-6 border border-[#292524]">
                   <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
                     <PenTool size={20} />
                     <h3 className="font-orbitron font-bold text-white tracking-wide">Magic Edit</h3>
                   </div>
                   
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={editPrompt}
                       onChange={(e) => setEditPrompt(e.target.value)}
                       placeholder="e.g. Turn the background blue..."
                       className="flex-1 bg-[#0c0a09] border border-[#44403c] rounded-lg px-4 py-3 text-white placeholder-[#57534e] focus:border-[#ea580c] outline-none transition-all"
                       onKeyDown={(e) => e.key === 'Enter' && handleEdit(editPrompt)}
                     />
                     <Button 
                        onClick={() => handleEdit(editPrompt)} 
                        disabled={!editPrompt.trim() || isLoading}
                        isLoading={isLoading}
                        className="!px-4"
                     >
                       <Wand2 size={18} />
                     </Button>
                   </div>
                 </div>
                 
                 <div className="flex justify-between items-center text-xs text-[#78716c]">
                    <span>History: {historyIndex + 1} / {history.length}</span>
                    <button onClick={() => {
                        if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
                    }} className="flex items-center gap-1 hover:text-[#ea580c]">
                        <Undo2 size={12} /> Undo
                    </button>
                 </div>

               </div>
             </div>
           </div>
        )}
      </main>
    </div>
  );
}
