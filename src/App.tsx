import { useState } from 'react';
import { 
  Layout, FileSpreadsheet, Undo2, Crop, Sparkles
} from 'lucide-react';
import IDGenerator from './components/IDGenerator';
import ResumeBuilder from './components/ResumeBuilder';
import ImageRestoration from './components/ImageRestoration';
import PhotoResizer from './components/PhotoResizer';

const App = () => {
  const [activeTab, setActiveTab] = useState('id-gen');
  const tabs = [
    { id: 'id-gen', label: 'RUSH ID', icon: Layout, color: 'text-blue-600' },
    { id: 'resume', label: 'RESUME TYPING', icon: FileSpreadsheet, color: 'text-indigo-600' },
    { id: 'restore', label: 'Image/Text Restoration', icon: Undo2, color: 'text-rose-600' },
    { id: 'resizer', label: 'Photo Resizer', icon: Crop, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white shadow-2xl rotate-3 shadow-slate-200">
                <Layout size={32} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles size={16} />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight uppercase italic text-slate-900 leading-none">
                YANDY <span className="text-blue-600">PRINTING</span> SHOP
              </h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] mt-2 ml-2">
                Premium Digital Printing Solutions
              </p>
            </div>
          </div>
          <nav className="relative flex flex-wrap items-center bg-white border border-slate-100 p-2 rounded-[32px] shadow-2xl shadow-slate-200/50">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`group relative flex items-center gap-3 px-7 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <tab.icon size={16} className={`${activeTab === tab.id ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <main className="relative min-h-[700px]">
          {activeTab === 'id-gen' && <IDGenerator />}
          {activeTab === 'resume' && <ResumeBuilder />}
          {activeTab === 'restore' && <ImageRestoration />}
          {activeTab === 'resizer' && <PhotoResizer />}
        </main>
        <footer className="mt-32 py-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic text-xl">Y</div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Yandy Printing Shop</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Professional Multi-Tool Partner</span>
            </div>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
            <span>300 DPI Export</span>
            <span>AI Integrated</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
