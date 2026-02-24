import { 
  Mars, Venus, FileText, Layout, Sparkles, AlignCenter, LayoutTemplate, FileSpreadsheet 
} from 'lucide-react';

export const VARIATIONS = {
  FORMAL: 'formal',
  FORMAL_WITH_NAME: 'formal_name',
  NON_FORMAL_PROFESSIONAL: 'non_formal_prof',
  NON_FORMAL_PROFESSIONAL_WITH_NAME: 'non_formal_prof_name',
  PROFESSIONAL_ORIGINAL: 'prof_original',
  PROFESSIONAL_ORIGINAL_WITH_NAME: 'prof_original_name'
};

export const PHOTO_SIZES = [
  { name: '2x2"', label: 'Standard 2x2"', width: 600, height: 600 },
  { name: 'Passport', label: '35x45mm (Passport)', width: 413, height: 531 }
];

export const BACKGROUND_COLORS = [
  { name: 'White', value: 'solid clean studio white', class: 'bg-white' },
  { name: 'Blue', value: 'solid professional studio blue (royal blue)', class: 'bg-blue-600' },
  { name: 'Red', value: 'solid professional studio red', class: 'bg-red-600' },
  { name: 'Light Gray', value: 'solid clean studio light gray', class: 'bg-slate-200' }
];

export const SUIT_COLORS = [
  { name: 'Black', value: 'black', class: 'bg-black' },
  { name: 'Navy', value: 'navy blue', class: 'bg-blue-900' },
  { name: 'Royal', value: 'royal blue', class: 'bg-blue-600' },
  { name: 'Red', value: 'dark red', class: 'bg-red-700' },
  { name: 'Pink', value: 'professional soft pink', class: 'bg-pink-400' }
];

export const CASUAL_COLORS = [
  { name: 'White', value: 'crisp white', class: 'bg-white border-slate-200' },
  { name: 'Light Blue', value: 'light sky blue', class: 'bg-blue-200' },
  { name: 'Navy', value: 'navy blue', class: 'bg-blue-900' },
  { name: 'Olive', value: 'olive green', class: 'bg-[#556b2f]' },
  { name: 'Maroon', value: 'deep maroon', class: 'bg-red-900' }
];

export const GENDERS = [{ name: 'Male', icon: Mars }, { name: 'Female', icon: Venus }];

export const CV_TEMPLATES = [
  { id: 'classic', name: 'Executive', icon: FileText },
  { id: 'sidebar', name: 'Modern', icon: Layout },
  { id: 'modern', name: 'Premium Bold', icon: Sparkles },
  { id: 'minimal', name: 'Minimalist', icon: AlignCenter },
  { id: 'corporate', name: 'Corporate', icon: LayoutTemplate },
  { id: 'form', name: 'Biodata Form', icon: FileSpreadsheet }
];

export const PAPER_SIZES = {
  short: { name: 'Short (8.5" x 11")', width: '8.5in', height: '11in', cssSize: '8.5in 11in', pdfFormat: [8.5, 11] as [number, number] },
  a4: { name: 'A4 (8.27" x 11.69")', width: '8.27in', height: '11.69in', cssSize: '210mm 297mm', pdfFormat: 'a4' as const },
  long: { name: 'Long (8.5" x 13")', width: '8.5in', height: '13in', cssSize: '8.5in 13in', pdfFormat: [8.5, 13] as [number, number] }
};

export const FONT_OPTIONS = [
  { id: 'font-sans', name: 'Sans Serif' },
  { id: 'font-serif', name: 'Serif Classic' },
  { id: 'font-mono', name: 'Monospace' }
];

export const OBJECTIVE_TRAITS = [
  { id: 'hardworking', label: 'Hardworking' },
  { id: 'punctual', label: 'Punctual' },
  { id: 'independent', label: 'Independent' },
  { id: 'fastlearner', label: 'Fast Learner' },
  { id: 'teamplayer', label: 'Team Player' },
  { id: 'reliable', label: 'Reliable' }
];

export const PRINT_PACKAGE_SIZES = [
  { id: '2x2', label: '2x2"', w: 600, h: 600 },
  { id: 'passport', label: 'Passport', w: 413, h: 531 },
  { id: '1.5x1.5', label: '1.5x1.5"', w: 450, h: 450 },
  { id: '1x1', label: '1x1"', w: 300, h: 300 }
];

export const TRAY_TABS = [
  { id: 'ALL', label: 'All Photos' },
  { id: VARIATIONS.FORMAL, label: 'Formal' },
  { id: VARIATIONS.FORMAL_WITH_NAME, label: 'Formal w/ Name' },
  { id: VARIATIONS.NON_FORMAL_PROFESSIONAL, label: 'Casual' },
  { id: VARIATIONS.NON_FORMAL_PROFESSIONAL_WITH_NAME, label: 'Casual w/ Name' },
  { id: VARIATIONS.PROFESSIONAL_ORIGINAL, label: 'Original' },
  { id: VARIATIONS.PROFESSIONAL_ORIGINAL_WITH_NAME, label: 'Original w/ Name' },
  { id: 'MANUAL', label: 'External' }
];

export const PHOTO_PRINT_SIZES_RESIZER = [
  { id: 'cute', label: 'Cute Size (2x3")', width: 2, height: 3 },
  { id: 'wallet', label: 'Wallet Size (2.5x3.5")', width: 2.5, height: 3.5 },
  { id: '3r', label: '3R (3.5x5")', width: 3.5, height: 5 },
  { id: '4r', label: '4R (4x6")', width: 4, height: 6 },
  { id: '5r', label: '5R (5x7")', width: 5, height: 7 },
  { id: '8r', label: '8R (8x10")', width: 8, height: 10 },
  { id: 'a4', label: 'A4 (8.27x11.69")', width: 8.27, height: 11.69 },
  { id: 'short', label: 'Short (8.5x11")', width: 8.5, height: 11 },
  { id: 'long', label: 'Long (8.5x13")', width: 8.5, height: 13 },
];
