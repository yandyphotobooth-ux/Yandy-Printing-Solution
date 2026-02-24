import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, UserCheck, Briefcase, Type, Download, 
  Loader2, Pipette, CheckCircle2, Columns, DownloadCloud, FileImage, FileType, Minus, Plus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ai, MODELS } from '../services/geminiService';
import { 
  VARIATIONS, PHOTO_SIZES, BACKGROUND_COLORS, SUIT_COLORS, CASUAL_COLORS, GENDERS, TRAY_TABS, PRINT_PACKAGE_SIZES 
} from '../constants';
import { Packer, injectDpiIntoJpeg, processCanvasImage } from '../utils';

const IDGenerator = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(PHOTO_SIZES[0]);
  const [selectedSuit, setSelectedSuit] = useState(SUIT_COLORS[0]);
  const [selectedCasual, setSelectedCasual] = useState(CASUAL_COLORS[0]);
  const [selectedGender, setSelectedGender] = useState(GENDERS[0]);
  const [customSuitColor, setCustomSuitColor] = useState('#000000');
  const [isUsingCustomSuit, setIsUsingCustomSuit] = useState(false);
  const [customCasualColor, setCustomCasualColor] = useState('#ffffff');
  const [isUsingCustomCasual, setIsUsingCustomCasual] = useState(false);
  const [changeAttireInOriginal, setChangeAttireInOriginal] = useState(false);
  
  const [cardNameplates, setCardNameplates] = useState<Record<string, boolean>>({
    [VARIATIONS.FORMAL]: false,
    [VARIATIONS.NON_FORMAL_PROFESSIONAL]: false,
    [VARIATIONS.PROFESSIONAL_ORIGINAL]: false
  });
  
  const [variations, setVariations] = useState<Record<string, string | null>>({ 
    [VARIATIONS.FORMAL]: null, [VARIATIONS.FORMAL_WITH_NAME]: null,
    [VARIATIONS.NON_FORMAL_PROFESSIONAL]: null, [VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME]: null,
    [VARIATIONS.PROFESSIONAL_ORIGINAL]: null, [VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME]: null 
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState("JUAN DELA CRUZ");
  
  const [savedVariations, setSavedVariations] = useState<any[]>([]); 
  const [packageConfigs, setPackageConfigs] = useState<Record<string, any>>({}); 
  const [packageSource, setPackageSource] = useState<string | null>(null); 
  const [trayFilter, setTrayFilter] = useState('ALL'); 
  const [packagePreview, setPackagePreview] = useState<string | null>(null);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trayFileInputRef = useRef<HTMLInputElement>(null);
  const isAnyLoading = Object.values(loading).some(v => v);

  const getConfig = (id: string, sizeId: string) => (packageConfigs[id] && packageConfigs[id][sizeId]) ? (packageConfigs[id][sizeId] as number) : 0;
  const getTotalForVar = (id: string): number => (Object.values(packageConfigs[id] || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalPackageItems = savedVariations.reduce((sum, sv) => sum + getTotalForVar(sv.id), 0);

  const handleConfigChange = (id: string | null, sizeId: string, delta: number) => {
    if (!id) return;
    setPackageConfigs(prev => {
      const current = prev[id] || {};
      const newVal = Math.max(0, (current[sizeId] || 0) + delta);
      return { ...prev, [id]: { ...current, [sizeId]: newVal } };
    });
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (event) => {
            setOriginalImage(event.target?.result as string);
            setVariations({ 
              [VARIATIONS.FORMAL]: null, [VARIATIONS.FORMAL_WITH_NAME]: null,
              [VARIATIONS.NON_FORMAL_PROFESSIONAL]: null, [VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME]: null,
              [VARIATIONS.PROFESSIONAL_ORIGINAL]: null, [VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME]: null 
            });
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const callGeminiImageToImage = async (base64Data: string, prompt: string, variationKey: string) => {
    setLoading(prev => ({ ...prev, [variationKey]: true }));
    const finalPrompt = `
      TASK: Generate a high-quality professional ID photo.
      STRICT REQUIREMENTS:
      1. BACKGROUND: MUST BE ${selectedBg.value}. Completely remove any original background.
      2. ATTIRE: ${prompt}
      3. COMPOSITION: Keep the face exactly as is. IF THE UPLOAD IS A HEADSHOT, YOU MUST GENERATE/OUTPAINT THE SHOULDERS AND UPPER CHEST to complete the professional look.
      4. LIGHTING: Use premium soft studio lighting.
      5. QUALITY: High resolution, sharp details, no artifacts.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: {
          parts: [
            { text: finalPrompt },
            { inlineData: { mimeType: "image/png", data: base64Data } }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const generatedBase64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedBase64) {
        const imageUrl = `data:image/png;base64,${generatedBase64}`;
        setVariations(prev => ({ ...prev, [variationKey]: imageUrl }));
        const newId = Math.random().toString(36).substr(2, 9);
        setSavedVariations(prev => [...prev, { id: newId, base64: imageUrl, type: variationKey, userName }]);
        
        let nameVariationKey = null;
        if (variationKey === VARIATIONS.FORMAL) nameVariationKey = VARIATIONS.FORMAL_WITH_NAME;
        if (variationKey === VARIATIONS.NON_FORMAL_PROFESSIONAL) nameVariationKey = VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME;
        if (variationKey === VARIATIONS.PROFESSIONAL_ORIGINAL) nameVariationKey = VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME;
        
        if (nameVariationKey) {
          setVariations(prev => ({ ...prev, [nameVariationKey]: imageUrl }));
          const nameId = Math.random().toString(36).substr(2, 9);
          setSavedVariations(prev => [...prev, { id: nameId, base64: imageUrl, type: nameVariationKey, userName }]);
        }
      }
    } catch (err) {
      console.error("Gemini Error:", err);
    }
    setLoading(prev => ({ ...prev, [variationKey]: false }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
      setVariations({ 
        [VARIATIONS.FORMAL]: null, [VARIATIONS.FORMAL_WITH_NAME]: null,
        [VARIATIONS.NON_FORMAL_PROFESSIONAL]: null, [VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME]: null,
        [VARIATIONS.PROFESSIONAL_ORIGINAL]: null, [VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME]: null 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTrayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems: any[] = [];
    let loadedCount = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newId = Math.random().toString(36).substr(2, 9);
        newItems.push({
          id: newId, base64: event.target?.result as string, type: 'MANUAL',
          userName: file.name.replace(/\.[^/.]+$/, "").toUpperCase()
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setSavedVariations(prev => [...prev, ...newItems]);
          setPackageSource(newItems[0].id);
        }
      };
      reader.readAsDataURL(file);
    });
    if (trayFileInputRef.current) trayFileInputRef.current.value = '';
  };

  const generateVariation = async (type: string) => {
    if (!originalImage) return;
    const base64 = originalImage.split(',')[1];
    switch (type) {
      case VARIATIONS.FORMAL:
        const sColor = isUsingCustomSuit ? customSuitColor : selectedSuit.value;
        const suitAttire = selectedGender.name === 'Male' ? `professional ${sColor} business suit and tie` : `professional ${sColor} business blazer/suit`;
        await callGeminiImageToImage(base64, `Subject MUST wear ${suitAttire}.`, VARIATIONS.FORMAL);
        break;
      case VARIATIONS.NON_FORMAL_PROFESSIONAL:
        const cColor = isUsingCustomCasual ? customCasualColor : selectedCasual.value;
        await callGeminiImageToImage(base64, `Subject MUST wear a ${cColor} collared polo shirt.`, VARIATIONS.NON_FORMAL_PROFESSIONAL);
        break;
      case VARIATIONS.PROFESSIONAL_ORIGINAL:
        let attireP = changeAttireInOriginal ? `Replace attire with a ${isUsingCustomSuit ? customSuitColor : selectedSuit.value} formal suit.` : "Keep the original attire exactly as it is.";
        await callGeminiImageToImage(base64, attireP, VARIATIONS.PROFESSIONAL_ORIGINAL);
        break;
      default: break;
    }
  };

  const generateAll = async () => {
    if (!originalImage) return;
    await generateVariation(VARIATIONS.FORMAL);
    await generateVariation(VARIATIONS.NON_FORMAL_PROFESSIONAL);
    await generateVariation(VARIATIONS.PROFESSIONAL_ORIGINAL);
  };

  const downloadImage = (imageUrl: string, type: string) => {
    const canvas = document.createElement('canvas'); 
    canvas.width = selectedSize.width; 
    canvas.height = selectedSize.height;
    const ctx = canvas.getContext('2d'); 
    if (!ctx) return;
    const img = new Image(); 
    img.crossOrigin = "anonymous";
    img.onload = () => { 
      processCanvasImage(ctx, img, type, selectedSize.width, selectedSize.height, userName); 
      const link = document.createElement('a'); 
      link.download = `ID_${type}.png`; 
      link.href = canvas.toDataURL('image/png', 1.0); 
      link.click(); 
    };
    img.src = imageUrl;
  };

  const handleDownloadPackagePDF = () => {
    if (!packagePreview) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(packagePreview, 'JPEG', 0, 0, 210, 297);
    pdf.save(`Print_Package_A4_${Date.now()}.pdf`);
  };

  const handleGeneratePackage = () => {
    if (totalPackageItems === 0) return alert("Please select quantities for at least one variation in the tray.");
    setIsGeneratingPackage(true);
    setTimeout(() => {
      const items: any[] = [];
      savedVariations.forEach(sv => {
        const conf = packageConfigs[sv.id] || {};
        PRINT_PACKAGE_SIZES.forEach(sizeDef => {
          const count = conf[sizeDef.id] || 0;
          for(let i=0; i<count; i++) items.push({ w: sizeDef.w, h: sizeDef.h, srcItem: sv });
        });
      });
      items.sort((a, b) => (b.w * b.h) - (a.w * a.h));
      const uniqueItems = [...new Set(items.map(i => i.srcItem))];
      const loadedImages: Record<string, HTMLImageElement> = {};
      let loadedCount = 0;
      
      if (uniqueItems.length === 0) {
        setIsGeneratingPackage(false);
        return;
      }

      uniqueItems.forEach(sv => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => { 
          loadedImages[sv.id] = img; 
          loadedCount++; 
          if (loadedCount === uniqueItems.length) drawLayout(); 
        };
        img.src = sv.base64;
      });

      const drawLayout = () => {
        const A4_W = 2480; const A4_H = 3508;
        const canvas = document.createElement('canvas'); canvas.width = A4_W; canvas.height = A4_H;
        const ctx = canvas.getContext('2d'); 
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, A4_W, A4_H);
        const marginY = 60; const usableWidth = A4_W; const usableHeight = A4_H - marginY;
        const packer = new Packer(usableWidth, usableHeight); packer.fit(items);
        let maxX = 0; let allFit = true;
        items.forEach(item => { if (item.fit) { maxX = Math.max(maxX, item.fit.x + item.w); } else { allFit = false; } });
        if (!allFit) { alert("Notice: Not all requested photos could fit on a single A4 page. Maximize paper usage by reducing quantities."); }
        let offsetX = Math.max(0, (A4_W - maxX) / 2); let offsetY = marginY;
        items.forEach(item => {
          if (item.fit) {
            const drawX = offsetX + item.fit.x; const drawY = offsetY + item.fit.y;
            const tempCanvas = document.createElement('canvas'); tempCanvas.width = item.w; tempCanvas.height = item.h;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            processCanvasImage(tempCtx, loadedImages[item.srcItem.id], item.srcItem.type, item.w, item.h, item.srcItem.userName);
            ctx.drawImage(tempCanvas, drawX, drawY);
            ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2; ctx.strokeRect(drawX + 1, drawY + 1, item.w - 2, item.h - 2);
          }
        });
        const rawJpeg = canvas.toDataURL('image/jpeg', 0.95);
        const printReadyJpeg = injectDpiIntoJpeg(rawJpeg, 300);
        setPackagePreview(printReadyJpeg); setIsGeneratingPackage(false);
      };
    }, 100);
  };

  const filteredTray = savedVariations.filter(sv => trayFilter === 'ALL' || sv.type === trayFilter);

  const getTrayLabel = (type: string) => {
     if (type === 'MANUAL') return 'EXTERNAL';
     if (type === VARIATIONS.FORMAL_WITH_NAME) return 'FORMAL + NAME';
     if (type === VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME) return 'CASUAL + NAME';
     if (type === VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME) return 'ORIGINAL + NAME';
     if (type === VARIATIONS.FORMAL) return 'FORMAL';
     if (type === VARIATIONS.NON_FORMAL_PROFESSIONAL) return 'CASUAL';
     if (type === VARIATIONS.PROFESSIONAL_ORIGINAL) return 'ORIGINAL';
     return 'PHOTO';
  };

  const CARDS = [
    { title: "Formal Suit", type: VARIATIONS.FORMAL, icon: Briefcase, desc: "Professional suit conversion." },
    { title: "Professional Casual", type: VARIATIONS.NON_FORMAL_PROFESSIONAL, icon: UserCheck, desc: "Smart casual conversion." },
    { title: "Studio Original", type: VARIATIONS.PROFESSIONAL_ORIGINAL, icon: Camera, desc: "Original portrait, lighting fix." }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white/70 backdrop-blur-md p-4 rounded-[32px] border border-white shadow-xl">
        <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 h-[52px]">
          {GENDERS.map(g => (
            <button key={g.name} onClick={() => setSelectedGender(g)} disabled={isAnyLoading} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase h-full ${selectedGender.name === g.name ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}>
              <g.icon size={12} /> {g.name}
            </button>
          ))}
        </div>
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm h-[52px]">
          <div className="px-3 border-r border-slate-100 text-slate-400 font-black text-[10px] uppercase">Suit</div>
          <div className="flex items-center gap-1 px-2">
            {SUIT_COLORS.map(c => (
              <button key={c.name} onClick={() => { setSelectedSuit(c); setIsUsingCustomSuit(false); }} className={`w-7 h-7 rounded-full border-2 transition-all ${!isUsingCustomSuit && selectedSuit.name === c.name ? 'border-blue-500 scale-110' : 'border-transparent'} ${c.class}`} />
            ))}
            <div className="relative w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden" style={{ backgroundColor: customSuitColor }}>
              <input type="color" value={customSuitColor} onChange={(e) => { setCustomSuitColor(e.target.value); setIsUsingCustomSuit(true); }} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Pipette size={10} className={parseInt(customSuitColor.replace('#',''), 16) > 0x888888 ? 'text-black' : 'text-white'} />
            </div>
          </div>
        </div>
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm h-[52px]">
          <div className="px-3 border-r border-slate-100 text-slate-400 font-black text-[10px] uppercase">Casual</div>
          <div className="flex items-center gap-1 px-2">
            {CASUAL_COLORS.map(c => (
              <button key={c.name} onClick={() => { setSelectedCasual(c); setIsUsingCustomCasual(false); }} className={`w-7 h-7 rounded-full border-2 transition-all ${!isUsingCustomCasual && selectedCasual.name === c.name ? 'border-blue-500 scale-110' : 'border-transparent'} ${c.class}`} />
            ))}
            <div className="relative w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden" style={{ backgroundColor: customCasualColor }}>
              <input type="color" value={customCasualColor} onChange={(e) => { setCustomCasualColor(e.target.value); setIsUsingCustomCasual(true); }} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Pipette size={10} className={parseInt(customCasualColor.replace('#',''), 16) > 0x888888 ? 'text-black' : 'text-white'} />
            </div>
          </div>
        </div>
        <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 h-[52px]">
          <div className="px-3 border-r border-slate-100 text-slate-400 font-black text-[10px] uppercase">BG</div>
          {BACKGROUND_COLORS.map(b => (
            <button key={b.name} onClick={() => setSelectedBg(b)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all h-full ${selectedBg.name === b.name ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>{b.name}</button>
          ))}
        </div>
        <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 h-[52px]">
          {PHOTO_SIZES.map(s => (
            <button key={s.name} onClick={() => { setSelectedSize(s); setVariations({ [VARIATIONS.FORMAL]: null, [VARIATIONS.FORMAL_WITH_NAME]: null, [VARIATIONS.NON_FORMAL_PROFESSIONAL]: null, [VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME]: null, [VARIATIONS.PROFESSIONAL_ORIGINAL]: null, [VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME]: null }); }} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all h-full ${selectedSize.name === s.name ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>{s.label}</button>
          ))}
        </div>

        <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center shadow-sm h-[52px]">
          <div className="relative h-full flex items-center">
            <Type className="absolute left-3 text-slate-300" size={14} />
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value.toUpperCase())} className="w-48 h-full pl-9 pr-3 text-[10px] font-black outline-none uppercase bg-transparent" placeholder="NAMEPLATE TEXT" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {originalImage && (
            <div className="w-[52px] h-[52px] rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative group bg-slate-100">
               <img src={originalImage} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all pointer-events-none" />
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase h-[52px] shadow-lg active:scale-95">Upload</button>
          {originalImage && <button onClick={generateAll} disabled={isAnyLoading} className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl font-bold text-[10px] uppercase h-[52px]">{isAnyLoading ? <Loader2 className="animate-spin" size={14} /> : "Generate All"}</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map(card => {
          const isNameplateOn = cardNameplates[card.type] && userName.trim() !== '';
          const downloadType = isNameplateOn ? card.type + '_name' : card.type;
          return (
          <div key={card.type} className="group bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-500">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100"><card.icon size={16} /></div>
                <h3 className="font-black text-slate-800 text-[12px] uppercase">{card.title}</h3>
              </div>
              {variations[card.type] && (
                <button onClick={() => downloadImage(variations[card.type]!, downloadType)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"><Download size={14} /></button>
              )}
            </div>
            <div className="relative bg-slate-50 flex items-center justify-center overflow-hidden transition-all duration-300" style={{ aspectRatio: `${selectedSize.width}/${selectedSize.height}` }}>
              {loading[card.type] ? (
                <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-blue-500" size={32} /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing...</span></div>
              ) : variations[card.type] ? (
                <div className="relative w-full h-full">
                  <img src={variations[card.type]!} className="w-full h-full object-cover" />
                  {isNameplateOn && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white h-[12%] flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                         <text x="100" y="20" textAnchor="middle" dominantBaseline="middle" fill="black" fontWeight="900" fontFamily="Arial, sans-serif" fontSize="22" textLength="180" lengthAdjust="spacingAndGlyphs">
                           {userName.toUpperCase()}
                         </text>
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white"><CheckCircle2 size={14} /></div>
                </div>
              ) : (
                <button onClick={() => generateVariation(card.type)} disabled={!originalImage || isAnyLoading} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all uppercase shadow-md active:scale-95">Process AI</button>
              )}
            </div>
            <div className="p-5 mt-auto">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-wide">{card.desc}</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setCardNameplates(prev => ({...prev, [card.type]: !prev[card.type]}))}>
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${cardNameplates[card.type] ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}>
                    {cardNameplates[card.type] && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Add Nameplate</span>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>

      <div className="mt-8 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-6 mb-6 gap-4">
          <div>
            <h3 className="text-lg font-black uppercase text-slate-800 flex items-center gap-2"><Columns size={20} className="text-blue-600"/> Multi-Person A4 Print Tray</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Combine different photos and sizes on a single 300 DPI A4 page</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-thin border-b border-slate-100">
               {TRAY_TABS.map(tab => {
                  const count = savedVariations.filter(sv => sv.type === tab.id).length;
                  if (tab.id !== 'ALL' && tab.id !== 'MANUAL' && count === 0) return null;
                  return (
                     <button key={tab.id} onClick={() => setTrayFilter(tab.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 ${trayFilter === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'}`}>
                       {tab.label} {count > 0 && tab.id !== 'ALL' && <span className="bg-white text-slate-900 px-1.5 rounded-md">{count}</span>}
                     </button>
                  );
               })}
            </div>
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">1. Select Photo from Tray</label>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {(trayFilter === 'ALL' || trayFilter === 'MANUAL') && (
                  <>
                    <input type="file" ref={trayFileInputRef} onChange={handleTrayUpload} className="hidden" accept="image/*" multiple />
                    <button onClick={() => trayFileInputRef.current?.click()} className="group relative w-28 h-32 flex-shrink-0 rounded-[20px] border-4 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-blue-500">
                      <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase text-center px-2 leading-tight">Upload<br/>External</span>
                    </button>
                  </>
                )}
                {filteredTray.length === 0 && trayFilter !== 'ALL' && trayFilter !== 'MANUAL' && (
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-[20px] text-[10px] font-black uppercase text-slate-300 tracking-widest">No generated photos for this tab</div>
                )}
                {filteredTray.map((sv) => (
                  <button key={sv.id} onClick={() => setPackageSource(sv.id)} className={`group relative w-28 h-32 flex-shrink-0 rounded-[20px] border-4 overflow-hidden transition-all ${packageSource === sv.id ? 'border-blue-600 scale-105 shadow-xl' : 'border-white hover:border-blue-200 shadow-sm'}`}>
                    <img src={sv.base64} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-1.5 flex flex-col items-center">
                       <span className="text-[9px] text-white font-black truncate w-full text-center">{getTrayLabel(sv.type)}</span>
                       <span className="text-[7px] text-slate-300 truncate w-full text-center tracking-widest">{sv.userName}</span>
                    </div>
                    {packageSource === sv.id && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-md"><CheckCircle2 size={12}/></div>}
                    {getTotalForVar(sv.id) > 0 && <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md border border-white">{getTotalForVar(sv.id)} pcs</div>}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3 flex justify-between">
                <span>2. Add Quantities to Selected Photo</span>
                {packageSource && <span className="text-blue-600 font-bold">{getTotalForVar(packageSource)} items for this photo</span>}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PRINT_PACKAGE_SIZES.map(s => (
                  <div key={s.id} className={`bg-slate-50 p-4 rounded-2xl border transition-all ${packageSource ? 'border-slate-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="text-[11px] font-black uppercase text-slate-700 mb-3 text-center">{s.label}</div>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => handleConfigChange(packageSource, s.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-500 rounded-lg transition-all"><Minus size={14}/></button>
                      <span className="font-black text-sm w-6 text-center">{getConfig(packageSource || "", s.id)}</span>
                      <button onClick={() => handleConfigChange(packageSource, s.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-500 rounded-lg transition-all"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <button onClick={handleGeneratePackage} disabled={isGeneratingPackage || totalPackageItems === 0} className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingPackage ? <Loader2 className="animate-spin" size={18}/> : <Columns size={18}/>}
                {isGeneratingPackage ? "Packing Layout..." : `Build Exact 300 DPI A4 Layout (${totalPackageItems} Total Photos)`}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-[28px] p-8 relative">
             {packagePreview ? (
                <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
                   <div className="relative w-full max-w-[220px] bg-white shadow-xl border border-slate-200 aspect-[1/1.414] overflow-hidden mb-8 group cursor-pointer hover:scale-105 transition-all" onClick={handleDownloadPackagePDF}>
                      <img src={packagePreview} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                        <FileType size={28} className="text-white mb-3" />
                        <span className="text-white font-black text-[10px] uppercase tracking-widest">Click to Save PDF</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-3 w-full">
                       <button onClick={handleDownloadPackagePDF} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-500 transition-all flex items-center justify-center gap-3 w-full">
                         <FileType size={16} /> Download A4 PDF
                       </button>
                       <button onClick={() => { const link = document.createElement('a'); link.download = `Print_Package_${Date.now()}.jpg`; link.href = packagePreview!; link.click(); }} className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 w-full">
                         <DownloadCloud size={14} /> Download JPG (Backup)
                       </button>
                   </div>
                </div>
             ) : (
                <div className="text-center opacity-40">
                  <div className="w-24 h-24 bg-slate-200 rounded-3xl mx-auto flex items-center justify-center mb-6"><FileImage size={32} className="text-slate-400" /></div>
                  <h4 className="font-black text-xs uppercase text-slate-600 mb-1">No Layout Yet</h4>
                  <p className="font-bold text-[9px] uppercase tracking-widest text-slate-500 max-w-[160px] mx-auto">Set quantities and click build to preview</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDGenerator;
