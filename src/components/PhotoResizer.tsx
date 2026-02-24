import React, { useState, useRef, useEffect } from 'react';
import { 
  Crop, Upload, RefreshCw, DownloadCloud, Loader2, Trash2, CheckCircle2, Download, ImagePlus, FileType
} from 'lucide-react';
import { PHOTO_PRINT_SIZES_RESIZER } from '../constants';
import { injectDpiIntoJpeg } from '../utils';

const PhotoResizer = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [globalSize, setGlobalSize] = useState('4r');
  const [globalFitMode, setGlobalFitMode] = useState('cover');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf('image') !== -1) { const file = items[i].getAsFile(); if (file) pastedFiles.push(file); } }
      if (pastedFiles.length > 0) {
        const newPhotosPromises = pastedFiles.map(file => {
          return new Promise((resolve) => {
            const src = URL.createObjectURL(file); const img = new Image();
            img.onload = () => { resolve({ id: Math.random().toString(36).substr(2, 9), file, originalSrc: src, targetSizeId: globalSize, fitMode: globalFitMode, resultSrc: null, status: 'pending', isLandscape: img.width > img.height }); };
            img.src = src;
          });
        });
        Promise.all(newPhotosPromises).then(newPhotos => { setPhotos(prev => [...prev, ...newPhotos]); });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [globalSize, globalFitMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotosPromises = files.map(file => {
      return new Promise((resolve) => {
        const src = URL.createObjectURL(file); const img = new Image();
        img.onload = () => { resolve({ id: Math.random().toString(36).substr(2, 9), file, originalSrc: src, targetSizeId: globalSize, fitMode: globalFitMode, resultSrc: null, status: 'pending', isLandscape: img.width > img.height }); };
        img.src = src;
      });
    });
    const newPhotos = await Promise.all(newPhotosPromises);
    setPhotos(prev => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resizeSingleImage = (photoDef: any): Promise<string> => {
    return new Promise((resolve) => {
      const sizeDef = PHOTO_PRINT_SIZES_RESIZER.find(s => s.id === photoDef.targetSizeId);
      if (!sizeDef) return resolve("");
      const img = new Image();
      img.onload = () => {
        const isLandscape = img.width > img.height; const TARGET_DPI = 300;
        let tw = sizeDef.width * TARGET_DPI; let th = sizeDef.height * TARGET_DPI;
        if (isLandscape && tw < th) { let temp = tw; tw = th; th = temp; }
        else if (!isLandscape && tw > th) { let temp = tw; tw = th; th = temp; }
        const canvas = document.createElement('canvas'); canvas.width = tw; canvas.height = th;
        const ctx = canvas.getContext('2d'); 
        if (!ctx) return resolve("");
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, tw, th);
        const imgAspect = img.width / img.height; const targetAspect = tw / th;
        let drawW, drawH, drawX, drawY;
        if (photoDef.fitMode === 'cover') { if (imgAspect > targetAspect) { drawH = th; drawW = img.width * (th / img.height); drawX = (tw - drawW) / 2; drawY = 0; } else { drawW = tw; drawH = img.height * (tw / img.width); drawX = 0; drawY = (th - drawH) / 2; } }
        else { if (imgAspect > targetAspect) { drawW = tw; drawH = img.height * (tw / img.width); drawX = 0; drawY = (th - drawH) / 2; } else { drawH = th; drawW = img.width * (th / img.height); drawX = (tw - drawW) / 2; drawY = 0; } }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        const printReadyDataUrl = injectDpiIntoJpeg(canvas.toDataURL('image/jpeg', 0.95), TARGET_DPI);
        resolve(printReadyDataUrl);
      };
      img.src = photoDef.originalSrc;
    });
  };

  const processAll = async () => {
    setIsProcessing(true);
    let updatedPhotos = [...photos];
    for (let i = 0; i < updatedPhotos.length; i++) {
      if (updatedPhotos[i].status === 'done' && updatedPhotos[i].resultSrc) continue;
      updatedPhotos[i].status = 'processing'; setPhotos([...updatedPhotos]);
      const resultSrc = await resizeSingleImage(updatedPhotos[i]);
      updatedPhotos[i].resultSrc = resultSrc; updatedPhotos[i].status = 'done'; setPhotos([...updatedPhotos]);
    }
    setIsProcessing(false);
  };

  const processSingle = async (id: string) => {
    const photoIndex = photos.findIndex(p => p.id === id); if (photoIndex === -1) return;
    let updatedPhotos = [...photos]; updatedPhotos[photoIndex].status = 'processing'; setPhotos([...updatedPhotos]);
    const resultSrc = await resizeSingleImage(updatedPhotos[photoIndex]);
    updatedPhotos[photoIndex].resultSrc = resultSrc; updatedPhotos[photoIndex].status = 'done'; setPhotos([...updatedPhotos]);
  };

  const downloadAll = async () => {
    const donePhotos = photos.filter(p => p.status === 'done' && p.resultSrc);
    if (donePhotos.length === 0) { alert("No processed images to download."); return; }
    for (let i = 0; i < donePhotos.length; i++) {
      const p = donePhotos[i]; const link = document.createElement('a');
      const sizeDef = PHOTO_PRINT_SIZES_RESIZER.find(s => s.id === p.targetSizeId);
      if (!sizeDef) continue;
      link.download = `Print_${sizeDef.label.replace(/[^a-zA-Z0-9]/g, '_')}_${p.file.name}`;
      link.href = p.resultSrc; link.click(); await new Promise(r => setTimeout(r, 400));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-8">
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-[40px] border border-white shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4"><div className="p-4 rounded-3xl bg-emerald-600 text-white shadow-lg"><Crop size={24} /></div><div><h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Batch Resizer</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">300 DPI Print Preparation</p></div></div>
        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3 w-full xl:w-auto">
           <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 w-full sm:w-auto justify-between"><select className="bg-transparent text-[11px] font-black uppercase text-slate-600 outline-none px-2" value={globalSize} onChange={(e) => setGlobalSize(e.target.value)}>{PHOTO_PRINT_SIZES_RESIZER.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div><select className="bg-transparent text-[11px] font-black uppercase text-slate-600 outline-none px-2" value={globalFitMode} onChange={(e) => setGlobalFitMode(e.target.value)}><option value="cover">Crop to Fill</option><option value="contain">Fit with Border</option></select><button onClick={() => setPhotos(prev => prev.map(p => ({ ...p, targetSizeId: globalSize, fitMode: globalFitMode, resultSrc: null, status: 'pending' })))} className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-black text-[10px] uppercase shadow-sm border border-slate-200">Apply All</button></div>
           <div className="flex items-center gap-2 w-full sm:w-auto justify-center"><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple /><button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg flex items-center gap-2"><Upload size={14} /> Add Photos</button>
             {photos.length > 0 && <button onClick={processAll} disabled={isProcessing} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg flex items-center gap-2">{isProcessing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}{isProcessing ? "Processing..." : "Generate All"}</button>}
             {photos.some(p => p.status === 'done') && <button onClick={downloadAll} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg flex items-center gap-2"><DownloadCloud size={14} /> Download All</button>}
           </div>
        </div>
      </div>
      {photos.length === 0 ? (<div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-slate-200 rounded-[48px] h-[500px] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all shadow-sm group"><div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner"><ImagePlus size={40} /></div><h3 className="font-black text-slate-900 text-2xl uppercase mb-3">Drop Photos Here</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-widest text-center max-w-sm">Select multiple files at once.</p></div>) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="relative h-48 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-50">
                 {photo.status === 'processing' ? (<div className="flex flex-col items-center gap-3 text-emerald-500"><Loader2 className="animate-spin" size={32} /><span className="text-[10px] font-black uppercase tracking-widest">Resizing...</span></div>) : photo.resultSrc ? (<img src={photo.resultSrc} className="w-full h-full object-contain drop-shadow-md" />) : (<img src={photo.originalSrc} className="w-full h-full object-cover rounded-xl opacity-60" />)}
                 {photo.isLandscape !== undefined && (<div className="absolute bottom-3 left-3 px-2 py-1 bg-slate-900/80 backdrop-blur-md text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm pointer-events-none">{photo.isLandscape ? 'Landscape' : 'Portrait'}</div>)}
                 <button onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))} className="absolute top-3 right-3 p-2 bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl shadow-sm transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                 {photo.status === 'done' && <div className="absolute top-3 left-3 p-1.5 bg-green-500 text-white rounded-full shadow-md"><CheckCircle2 size={12}/></div>}
              </div>
              <div className="p-5 space-y-4 bg-white flex-1 flex flex-col justify-between">
                 <div className="space-y-3"><div className="flex items-center gap-2"><FileType size={14} className="text-slate-400" /><select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 outline-none focus:border-emerald-400" value={photo.targetSizeId} onChange={(e) => setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, targetSizeId: e.target.value, resultSrc: null, status: 'pending' } : p))}>{PHOTO_PRINT_SIZES_RESIZER.map(s => (<option key={s.id} value={s.id}>{s.label.split(' (')[0]} ({photo.isLandscape ? `${s.height}x${s.width}"` : `${s.width}x${s.height}"`})</option>))}</select></div></div>
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50"><button onClick={() => processSingle(photo.id)} disabled={photo.status === 'processing'} className="py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5">{photo.status === 'processing' ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12}/>}{photo.status === 'done' ? 'Redo' : 'Process'}</button><button onClick={() => { if (!photo.resultSrc) return; const link = document.createElement('a'); const sDef = PHOTO_PRINT_SIZES_RESIZER.find(s => s.id === photo.targetSizeId); if (!sDef) return; link.download = `Print_${sDef.label}_${photo.file.name}`; link.href = photo.resultSrc; link.click(); }} disabled={photo.status !== 'done'} className="py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 shadow-sm"><Download size={12}/> Save</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoResizer;
