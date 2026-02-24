import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, RefreshCw, Sparkles, FileType, ImagePlus, Upload, CheckCircle2, Download
} from 'lucide-react';
import { ai, MODELS } from '../services/geminiService';

const ImageRestoration = () => {
  const [image, setImage] = useState<string | null>(null);
  const [restored, setRestored] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'photo'>('text'); 
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (event) => { setImage(event.target?.result as string); setRestored(null); };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
      const reader = new FileReader(); 
      reader.onload = (event) => { setImage(event.target?.result as string); setRestored(null); }; 
      reader.readAsDataURL(file); 
    }
  };

  const handleRestore = async () => {
    if (!image) return;
    setLoading(true);
    
    const textPrompt = `
      TASK: Precise Colored Document Restoration. 
      MODE: Full-Color High-Fidelity Signal Reconstruction. 
      INSTRUCTIONS:
      1. Remove all noise, dirt, shadows, and color casts from the background. 
      2. Set background to solid pure white.
      3. CRITICAL: PRESERVE ORIGINAL COLORS. If the text, stamps, signatures, or logos are colored (e.g., blue ink, red stamps, colored logos), they MUST remain in their original colors. Do NOT convert to grayscale or black and white.
      4. Strictly preserve the visual identity of every character and mark.
      5. DO NOT rewrite, replace, or hallucinate details. 
      6. The output must look exactly like the original source text, just professional, clean, and high-contrast.
    `;
    
    const photoPrompt = "TASK: Restore this portrait. MODE: High Fidelity AI Restoration. Remove blur and grain. Enhance lighting. Preserve all original facial features exactly.";

    const prompt = mode === 'text' ? textPrompt : photoPrompt;

    try {
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: image.split(',')[1] } }
          ]
        }
      });

      const generatedBase64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedBase64) {
        setRestored(`data:image/png;base64,${generatedBase64}`);
      }
    } catch (err) {
      console.error("Restoration Error:", err);
      alert("AI Restoration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white/70 backdrop-blur-md p-6 rounded-[40px] border border-white shadow-xl">
         <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl text-white shadow-lg ${mode === 'text' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
               {mode === 'text' ? <FileType size={24} /> : <ImagePlus size={24} />}
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">AI Restoration</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini AI</p>
            </div>
         </div>
         <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button onClick={() => { setMode('text'); setRestored(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${mode === 'text' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
               <FileType size={14}/> Text / Doc (AI Color)
            </button>
            <button onClick={() => { setMode('photo'); setRestored(null); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${mode === 'photo' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
               <ImagePlus size={14}/> Photo / Image (AI)
            </button>
         </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="group relative bg-white border-2 border-dashed border-slate-200 rounded-[40px] h-[500px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden shadow-sm hover:shadow-xl">
               <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
               {image ? <img src={image} className="w-full h-full object-contain p-4" /> : (
                  <div className="text-center p-8">
                     <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                     <h3 className="font-black text-slate-900 text-lg uppercase mb-2">Upload Original</h3>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">Click or Paste Image (Ctrl+V)</p>
                  </div>
               )}
            </div>
            {image && (
               <button onClick={handleRestore} disabled={loading} className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-white ${mode === 'text' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {loading ? "Processing..." : `AI Restore ${mode === 'text' ? 'Document' : 'Photo'}`}
               </button>
            )}
         </div>
         <div className="relative bg-slate-50 border border-slate-200 rounded-[40px] h-[500px] flex items-center justify-center overflow-hidden shadow-inner">
            {restored ? (
               <div className="relative w-full h-full p-4 group">
                  <img src={restored} className="w-full h-full object-contain" />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"><CheckCircle2 size={12} /> Restored</div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { const link = document.createElement('a'); link.download = `Restored_${mode}_${Date.now()}.png`; link.href = restored!; link.click(); }} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Download size={14} /> Download</button>
                  </div>
               </div>
            ) : (
               <div className="text-center opacity-30">
                  <RefreshCw size={48} className={`mx-auto mb-4 ${loading ? 'animate-spin' : ''}`} />
                  <p className="font-black text-xs uppercase tracking-widest">{loading ? "AI is restoring clarity..." : "Waiting for result"}</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImageRestoration;
