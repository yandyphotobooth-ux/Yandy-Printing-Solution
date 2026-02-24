import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Loader2, Sparkles, Mail, Phone, UserRound, BrainCircuit, Image as ImageIcon, DownloadCloud, Edit3, Eye, Type, FileType
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { ai, MODELS } from '../services/geminiService';
import { 
  CV_TEMPLATES, PAPER_SIZES, FONT_OPTIONS, OBJECTIVE_TRAITS 
} from '../constants';

const ResumeBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [paperSize, setPaperSize] = useState('short');
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [customColor, setCustomColor] = useState('#1e293b');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [resumePhoto, setResumePhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit'); 
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState({
    name: '', email: '', phone: '', objective: '', address: '',
    age: '', dob: '', pob: '', citizenship: '', civilStatus: '',
    height: '', weight: '', religion: '', motherName: '', fatherName: '',
    emergencyName: '', emergencyPhone: '',
    experiences: [{ id: 'exp_1', title: '', company: '', date: '', desc: '' }],
    skills: [{ id: 'skill_1', value: '' }],
    education: {
      college: { school: '', course: '', year: '' }, vocational: { school: '', course: '', year: '' },
      seniorhigh: { school: '', strand: '', year: '' }, highschool: { school: '', year: '' }
    },
    trainingsBefore: [{ id: 'tb_1', title: '', year: '' }], trainingsAfter: [{ id: 'ta_1', title: '', year: '' }]
  });

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (viewMode !== 'edit') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (event) => setResumePhoto(event.target?.result as string);
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [viewMode]);

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    const element = document.getElementById('resume-preview-content');
    if (!element) { 
      setIsPdfGenerating(false); 
      return; 
    }
    const opt = {
      margin: [0.5, 0, 0.5, 0] as [number, number, number, number], 
      filename: `${data.name || 'Resume'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'in', format: PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].pdfFormat, orientation: 'portrait' as const },
      pagebreak: { mode: 'css', avoid: ['.avoid-break', 'section', 'tr'] }
    };
    html2pdf().set(opt).from(element).save().then(() => { 
      setIsPdfGenerating(false); 
    }).catch(() => { 
      setIsPdfGenerating(false); 
    });
  };

  const formatText = (text: string) => {
    if (!text) return "";
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleInputChange = (field: string, value: string) => { 
    setData(prev => ({ ...prev, [field]: field === 'email' ? value : formatText(value) })); 
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      const reader = new FileReader(); 
      reader.onload = (event) => setResumePhoto(event.target?.result as string); 
      reader.readAsDataURL(file); 
    } 
  };

  const toggleTrait = (label: string) => { 
    setSelectedTraits(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]); 
  };

  const handleAIGenerateObjective = async () => {
    setIsAiLoading(true);
    const traitsStr = selectedTraits.length > 0 ? selectedTraits.join(' and ').toLowerCase() : 'hardworking and reliable';
    const prompt = `Write a short, professional resume objective for a candidate named ${data.name || 'a professional'}. Emphasize traits: ${traitsStr}. Short, straightforward, loyal. No quotes.`;
    try {
      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: prompt
      });
      const text = response.text;
      if (text) { 
        setData(prev => ({ ...prev, objective: text.trim().toUpperCase() })); 
      }
    } catch (err) {
      console.error("AI Error:", err);
    }
    setIsAiLoading(false);
  };

  const ResumeFooter = () => (
     <div className="mt-auto pt-8 border-t border-slate-200 avoid-break">
       <p className="text-[10px] italic text-slate-500 mb-8 text-center">I hereby certify that the information above are true and correct.</p>
       <div className="flex justify-end">
         <div className="text-center">
           <div className="font-black uppercase text-sm border-b border-slate-900 pb-1 px-4 min-w-[200px]">{data.name || "SIGNATURE"}</div>
           <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Signature over Printed Name</p>
         </div>
       </div>
     </div>
  );

  const BiodataForm = () => (
    <div className={`w-full h-full p-8 text-slate-800 flex flex-col bg-white border border-slate-200 ${selectedFont}`} style={{ minHeight: '100%' }}>
       <div className="flex justify-between items-center border-b-4 border-slate-900 pb-4 mb-6">
          <div><h1 className="text-xl font-black uppercase tracking-tighter" style={{ color: customColor }}>Information Record</h1></div>
          <div className="w-20 h-20 border-2 border-slate-400 flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner">{resumePhoto && <img src={resumePhoto} className="w-full h-full object-cover" />}</div>
       </div>
       <div className="space-y-3 flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-9 font-black text-[9px] uppercase border px-2 py-1">{data.name}</div>
            {data.age && <div className="col-span-3 font-black text-[9px] uppercase border px-2 py-1">{data.age}</div>}
          </div>
          {data.address && <div className="font-black text-[8px] uppercase border px-2 py-1">{data.address}</div>}
          <div className="grid grid-cols-3 gap-2">
            {data.dob && <div className="text-[8px] border px-2 py-1">{data.dob}</div>}
            {data.citizenship && <div className="text-[8px] border px-2 py-1">{data.citizenship}</div>}
            {data.civilStatus && <div className="text-[8px] border px-2 py-1">{data.civilStatus}</div>}
          </div>
       </div>
       <div className="mt-auto pt-4 flex justify-between items-end border-t border-slate-100"><p className="text-[5px] font-black text-slate-300 uppercase">Yandy Printing Studio</p><div className="text-center w-32 border-t-2 border-slate-900 pt-1 text-[7px] font-black uppercase">Signature</div></div>
    </div>
  );

  const TemplateClassic = () => (
    <div id="resume-preview-content" className={`w-full p-12 bg-white text-slate-800 flex flex-col ${selectedFont}`} style={{ minHeight: '100%' }}>
       <div className="flex justify-between items-start mb-12">
          <div className="flex-1"><h1 className="text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: customColor }}>{data.name || "YOUR NAME"}</h1><div className="flex flex-wrap gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-t pt-4">
            {data.email && <span className="flex items-center gap-1.5"><Mail size={10} style={{color: customColor}}/> {data.email}</span>}
            {data.phone && <span className="flex items-center gap-1.5"><Phone size={10} style={{color: customColor}}/> {data.phone}</span>}
          </div></div>
          {resumePhoto && <div className="w-32 h-32 border-4 border-white shadow-xl overflow-hidden bg-slate-50 ml-8 flex-shrink-0 rounded-lg"><img src={resumePhoto} className="w-full h-full object-cover" /></div>}
       </div>
       <div className="grid grid-cols-12 gap-12 flex-1">
          <div className="col-span-8 space-y-10">
             {data.objective && <section className="avoid-break"><h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 pb-1 border-b-2" style={{ borderColor: customColor, color: customColor }}>Objective</h4><p className="text-sm italic leading-relaxed text-slate-600">{data.objective}</p></section>}
             {data.experiences.some(e => e.title) && <section className="avoid-break"><h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6" style={{ color: customColor }}>Work Experience</h4><div className="grid grid-cols-2 gap-x-8 gap-y-6">{data.experiences.map(e => e.title && (<div key={e.id} className="relative pl-6 border-l-2 border-slate-100 avoid-break"><h5 className="font-black text-sm uppercase">{e.title}</h5><p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">{e.company} | {e.date}</p>{e.desc && <p className="text-[10px] leading-relaxed whitespace-pre-wrap">{e.desc}</p>}</div>))}</div></section>}
          </div>
          <div className="col-span-4 space-y-8">
             <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 avoid-break"><h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: customColor }}>Personal Info</h4><div className="space-y-2 text-[10px]">{data.age && <div className="flex justify-between border-b border-slate-200/50 pb-1"><strong>Age</strong> <span>{data.age}</span></div>}{data.dob && <div className="flex justify-between border-b border-slate-200/50 pb-1"><strong>Birthday</strong> <span>{data.dob}</span></div>}</div></section>
          </div>
       </div>
       <ResumeFooter />
    </div>
  );

  const TemplateSidebar = () => (
    <div id="resume-preview-content" className={`w-full flex bg-white text-slate-800 ${selectedFont}`} style={{ minHeight: '100%' }}>
       <div className="w-[35%] p-10 text-white flex flex-col" style={{ backgroundColor: customColor }}>
          {resumePhoto && <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden mb-8 shadow-2xl self-center flex-shrink-0"><img src={resumePhoto} className="w-full h-full object-cover" /></div>}
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-10 leading-tight">{data.name || "YOUR NAME"}</h1>
       </div>
       <div className="flex-1 p-12 flex flex-col"><div className="space-y-10 flex-1">{data.objective && <section className="avoid-break"><h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: customColor }}>Professional Summary</h4><p className="text-sm italic text-slate-600 leading-relaxed">{data.objective}</p></section>}</div><ResumeFooter /></div>
    </div>
  );

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'sidebar': return <TemplateSidebar />;
      case 'form': return <BiodataForm />;
      default: return <TemplateClassic />;
    }
  };

  return (
    <div className="bg-white rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-5"><div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100"><FileText size={32} /></div><div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">RESUME TYPING</h2></div></div>
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2"><button onClick={() => setViewMode('edit')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><Edit3 size={12}/> Edit Data</button><button onClick={() => setViewMode('preview')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><Eye size={12}/> Full Preview</button></div>
           <div className="flex items-center gap-3"><div className="relative w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: customColor }}><input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200"><FileType size={12} className="text-slate-400"/><select className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600" value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>{Object.entries(PAPER_SIZES).map(([key, size]) => (<option key={key} value={key}>{size.name}</option>))}</select></div>
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200"><Type size={12} className="text-slate-400"/><select className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600" value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}>{FONT_OPTIONS.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
           <select className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>{CV_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        </div>
      </div>
      <div className="min-h-[800px]">{viewMode === 'edit' ? (<div className="max-w-4xl mx-auto animate-in slide-in-from-left-4 duration-500 pb-20"><div className="space-y-8"><section className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 space-y-6 text-center"><h3 className="font-black text-blue-600 text-[11px] uppercase tracking-[0.3em] flex items-center gap-2 justify-center"><ImageIcon size={16}/> Portrait Upload</h3><div className="relative w-32 h-32 mx-auto bg-white rounded-3xl overflow-hidden border-4 border-white shadow-md flex items-center justify-center">{resumePhoto ? <img src={resumePhoto} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-100" size={48} />}</div><input type="file" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" /><button onClick={() => photoInputRef.current?.click()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Select Photo</button></section><section className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 space-y-6"><h3 className="font-black text-blue-600 text-[11px] uppercase tracking-[0.3em] flex items-center gap-2"><UserRound size={16}/> Essentials</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder="FULL NAME" className="w-full px-5 py-4 border rounded-2xl focus:border-blue-500 outline-none font-black text-sm uppercase" value={data.name} onChange={e => handleInputChange('name', e.target.value)} /><input type="email" placeholder="EMAIL" className="w-full px-5 py-4 border rounded-2xl focus:border-blue-500 outline-none text-sm uppercase" value={data.email} onChange={e => setData({...data, email: e.target.value.toUpperCase()})} /></div><div className="pt-4 border-t border-slate-200 space-y-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={14} className="text-blue-500" /> Auto AI Humble Objective</label><button onClick={handleAIGenerateObjective} disabled={isAiLoading} className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-sm">{isAiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}{isAiLoading ? "Generating..." : "Generate with AI"}</button></div><div className="flex flex-wrap gap-2">{OBJECTIVE_TRAITS.map(trait => (<button key={trait.id} onClick={() => toggleTrait(trait.label)} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all border ${selectedTraits.includes(trait.label) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}>{trait.label}</button>))}</div><textarea placeholder="Write your objective here..." className="w-full px-5 py-4 border rounded-2xl focus:border-blue-500 outline-none text-sm h-24 resize-none italic uppercase" value={data.objective} onChange={e => setData({...data, objective: e.target.value.toUpperCase()})} /></div></section></div></div>) : (<div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500"><div className="sticky top-4 z-50 mb-8 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-slate-800"><button onClick={() => setViewMode('edit')} className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all"><Edit3 size={14}/> Edit</button><div className="w-px h-6 bg-slate-700"></div><button onClick={handleDownloadPdf} disabled={isPdfGenerating} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">{isPdfGenerating ? <Loader2 className="animate-spin" size={16}/> : <DownloadCloud size={16}/>}{isPdfGenerating ? "Generating..." : "Download PDF"}</button></div><div className="flex justify-center bg-slate-100/50 p-4 md:p-16 rounded-[48px] border border-slate-200 shadow-inner overflow-auto max-w-full"><div className="bg-white shadow-2xl origin-top transition-all duration-300" style={{ width: PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].width, minHeight: PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].height }}>{renderTemplate()}</div></div></div>)}</div>
    </div>
  );
};

export default ResumeBuilder;
