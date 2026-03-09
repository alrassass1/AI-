import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Loader2, Phone, MapPin, 
  Calendar, Eye, Menu, X, Info, Activity, Shield, AlertCircle,
  ChevronLeft, ChevronUp, ChevronDown, MessageSquare, MessageCircle, Clock, Star, Baby, ArrowLeft,
  Mail, Headset, Globe, Heart, Camera, Upload, Download, FileText, QrCode,
  Code, Terminal, Copy, ExternalLink, Share2, Facebook, Twitter, Youtube,
  Home, Maximize, Bell, Moon, Sun, Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateMedicalResponse, analyzeEyeImage, isApiKeySet } from './services/geminiService';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import AiScanView from './components/AiScanView';

const TRANSLATIONS = {
  ar: {
    home: 'الرئيسية',
    chat: 'المساعد الذكي',
    ai_scan: 'الفحص الذكي (AI)',
    services: 'خدماتنا الطبية',
    branches: 'فروعنا',
    about: 'عن المستشفى',
    contact: 'اتصل بنا',
    developers: 'للمطورين',
    quick_booking: 'حجز موعد سريع',
    call_center: 'مركز الاتصال',
    online_now: 'المساعد متصل الآن',
    welcome_to: 'مرحباً بك في : رؤية لطب و جراحة العيون والشبكية AI',
    share_app: 'مشاركة البرنامج',
    scan_to_open: 'امسح للفتح',
    app_title: 'برنامج مستشفيات رؤية الذكي',
    app_desc: 'منصة متكاملة تقدم خدمات الاستشارة الطبية الفورية، فحص العين بالذكاء الاصطناعي، وحجز المواعيد في جميع فروعنا.',
    notifications: 'الإشعارات',
    no_notifications: 'لا توجد إشعارات جديدة حالياً.',
    theme_toggle: 'تغيير المظهر',
    lang_toggle: 'English',
    lang_code: 'EN',
    back_to_main: 'العودة للقائمة الرئيسية',
    processing: 'جاري معالجة طلبك...',
    type_placeholder: 'اكتب استفسارك الطبي هنا...',
    secure_data: 'بياناتك مشفرة وآمنة',
    premium_service: 'خدمة طبية متميزة',
    save: 'حفظ',
    name_prompt: 'هل ترغب في إخباري باسمك؟ (اختياري)',
    enter_name: 'ادخل اسمك هنا...',
    how_can_i_help: 'أنا مساعدك الطبي الذكي، كيف يمكنني مساعدتك اليوم؟',
    hi: 'مرحباً بك في رؤية AI',
    hi_user: 'مرحباً بك يا',
  },
  en: {
    home: 'Home',
    chat: 'AI Assistant',
    ai_scan: 'AI Scan',
    services: 'Medical Services',
    branches: 'Our Branches',
    about: 'About Us',
    contact: 'Contact Us',
    developers: 'Developers',
    quick_booking: 'Quick Booking',
    call_center: 'Call Center',
    online_now: 'Assistant Online',
    welcome_to: 'Welcome to: Roaya Eye & Retina Hospital AI',
    share_app: 'Share App',
    scan_to_open: 'Scan to Open',
    app_title: 'Roaya Hospital Smart App',
    app_desc: 'An integrated platform providing instant medical consultation, AI eye examination, and appointment booking.',
    notifications: 'Notifications',
    no_notifications: 'No new notifications at the moment.',
    theme_toggle: 'Toggle Theme',
    lang_toggle: 'العربية',
    lang_code: 'AR',
    back_to_main: 'Back to Main Menu',
    processing: 'Processing your request...',
    type_placeholder: 'Type your medical inquiry here...',
    secure_data: 'Your data is encrypted and secure',
    premium_service: 'Premium Medical Service',
    save: 'Save',
    name_prompt: 'Would you like to tell me your name? (Optional)',
    enter_name: 'Enter your name here...',
    how_can_i_help: 'I am your smart medical assistant, how can I help you today?',
    hi: 'Welcome to Roaya AI',
    hi_user: 'Welcome, ',
  }
};

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const SERVICES = [
  { 
    id: 'retina', 
    title: 'جراحة الشبكية والجسم الزجاجي', 
    icon: <Activity size={18} />,
    image: 'https://roayae.org/wp-content/uploads/2025/10/32.jpeg',
    description: 'علاج اعتلال الشبكية السكري، انفصال الشبكية، ونزيف الجسم الزجاجي بأحدث التقنيات الجراحية العالمية.'
  },
  { 
    id: 'lasik', 
    title: 'تصحيح الإبصار (الليزك)', 
    icon: <Sparkles size={18} />,
    image: 'https://roayae.org/wp-content/uploads/2025/10/24.jpeg',
    description: 'وداعاً للنظارات مع أحدث أجهزة الفيمتو ليزك لتصحيح قصر وطول النظر والاستجماتيزم بدقة متناهية.'
  },
  { 
    id: 'cataract', 
    title: 'إزالة المياه البيضاء (الفاكو)', 
    icon: <Eye size={18} />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDpygXY9-ySJQ8biB0M9I3CnCp9IcvTZY0Gg&s',
    description: 'عمليات الفاكو (الموجات فوق الصوتية) لإزالة المياه البيضاء وزراعة أحدث أنواع العدسات المطوية.'
  },
  { 
    id: 'glaucoma', 
    title: 'علاج المياه الزرقاء', 
    icon: <Activity size={18} />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpvH0AR4StIl9GridwT9AmY-KsY2tObEWw2w&s',
    description: 'تشخيص وعلاج ارتفاع ضغط العين (الجلوكوما) لحماية العصب البصري باستخدام أحدث الأدوية والجراحات.'
  },
  { 
    id: 'pediatric', 
    title: 'طب عيون الأطفال والحول', 
    icon: <Baby size={18} />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5a_Dk6OQlUkTfUrh2GXQ4pz-kXmDFg_UKLw&s',
    description: 'رعاية متخصصة لعيون الأطفال وعلاج حالات الحول الوظيفي والجمالي بأحدث الأساليب الطبية.'
  },
  { 
    id: 'camps', 
    title: 'المخيمات العلاجية الإنسانية', 
    icon: <Heart size={18} />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5Cp9bSa4GBlQkdh7FP-vkW27G3KpxpHm-Cg&s',
    description: 'تقديم الفحص والعلاج المجاني وإجراء العمليات للفئات الأشد احتياجاً في مختلف المناطق اليمنية.'
  },
];

const ROAYA_LOGO = "https://roayae.org/wp-content/uploads/elementor/thumbs/cropped-%D8%B4%D8%B9%D8%A7%D8%B1-%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89-%D8%B1%D8%A4%D9%8A%D8%A9-qf666fklyr7uf4ncdzpnajc09q6qujg5777ct93rdk.png";

const BRANCHES = [
  { 
    id: 'seiyun', 
    name: 'رؤية سيئون (المركز الرئيسي)', 
    whatsapp: '774441177',
    addr: 'حضرموت – سيئون – شارع الجزائر – العمارة الخضراء – مقابل مركز غسيل الكلى',
    phones: ['05-441177', '05-408993'],
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d15346.012967138033!2d48.79036500000001!3d15.935075!3m2!1i1024!2i768!4f13.1!2m1!1z2KfZhNmF2LHZg9iyINin2YTYsdim2YrYs9mKIOKAkyDYsdik2YrYqSDYs9mK2KbZiNmGINit2LbYsdmF2YjYqiDigJMg2LPZitim2YjZhiDigJMg2LTYp9ix2Lkg2KfZhNis2LLYp9im2LEg4oCTINin2YTYudmF2KfYsdipINin2YTYrti22LHYp9ihIOKAkyDZhdmC2KfYqNmEINmF2LHZg9iyINi62LPZitmEINin2YTZg9mE2Yk!5e0!3m2!1sar!2sus!4v1773004790718!5m2!1sar!2sus',
    googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+سيئون'
  },
  { 
    id: 'aden', 
    name: 'رؤية عدن', 
    whatsapp: '782255557',
    addr: 'عدن – القاهرة – شارع السنافر، بجانب مكتب بريد القاهرة',
    phones: ['02-388150', '02-388151'],
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.5875991606426!2d44.98476782619154!3d12.869891817102591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3df5f7138f379d35%3A0x7011461d86e98799!2z2LHYpNmK2Kkg2YTYt9ioINmIINis2LHYp9it2Kkg2KfZhNi52YrZiNmGINmI2KfZhNi02KjZg9mK2Kkt2LnYr9mG!5e0!3m2!1sar!2sus!4v1773004972804!5m2!1sar!2sus',
    googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+عدن'
  },
  { 
    id: 'mukalla', 
    name: 'رؤية المكلا', 
    whatsapp: '778844766',
    addr: 'المكلا – الديس – الإشارة – بجانب مؤسسة الشامي – عمارة بن جميل',
    phones: ['05-310888'],
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d15447.553526801117!2d49.127344!3d14.548375!3m2!1i1024!2i768!4f13.1!2m1!1z2LHYpNmK2Kkg2KfZhNmF2YPZhNinINin2YTZhdmD2YTYpyDigJMg2KfZhNiv2YrYsyDigJMg2KfZhNil2LTYp9ix2Kkg4oCTINio2KzYp9mG2Kgg2YXYpNiz2LPYqSDYp9mE2LTYp9mF2Yog4oCTINi52YXYp9ix2Kkg2KjZhiDYrNmF2YrZhA!5e0!3m2!1sar!2sus!4v1773004899244!5m2!1sar!2sus',
    googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+المكلا'
  },
  { 
    id: 'shihr', 
    name: 'رؤية الشحر', 
    whatsapp: '781765720',
    addr: 'حي المنصورة – بجوار مدارس التفوق – مدينة الشحر – حضرموت',
    phones: ['781765720', '781765257'],
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.125103552969!2d49.598874830898524!3d14.761981041624157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3de8454393dca9e1%3A0x1e1eb2fb1023e009!2z2LHYpNmK2Kkg2YTYt9ioINmIINis2LHYp9it2Kkg2KfZhNi52YrZiNmGINmI2KfZhNi02KjZg9mK2Kkg2KfZhNi02K3YsQ!5e0!3m2!1sar!2sus!4v1773005008226!5m2!1sar!2sus',
    googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+الشحر'
  },
];

const AppInfo = () => {
  const [isSharing, setIsSharing] = useState(false);
  const appUrl = window.location.origin;
  
  const handleShare = async () => {
    if (isSharing) return;
    
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: 'برنامج مستشفيات رؤية الذكي',
          text: 'اكتشف برنامج مستشفيات رؤية الذكي للعناية بالعيون والتشخيص بالذكاء الاصطناعي.',
          url: appUrl,
        });
      } catch (err: any) {
        // Ignore AbortError (user cancelled)
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          // Fallback to clipboard if share fails for other reasons
          navigator.clipboard.writeText(appUrl);
          alert('تم نسخ رابط البرنامج بنجاح!');
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      navigator.clipboard.writeText(appUrl);
      alert('تم نسخ رابط البرنامج بنجاح!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6 max-w-2xl mx-auto text-right"
    >
      <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
        <div className="bg-blue-50 p-4 rounded-[2rem] border border-blue-100 shrink-0 flex flex-col items-center gap-4">
          <img src={ROAYA_LOGO} alt="Logo" className="h-12 object-contain" />
          <QRCodeSVG value={appUrl} size={120} />
        </div>
        <div className="space-y-4 flex-1">
          <h3 className="text-xl font-bold text-slate-900">برنامج مستشفيات رؤية الذكي</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            منصة متكاملة تقدم خدمات الاستشارة الطبية الفورية، فحص العين بالذكاء الاصطناعي، وحجز المواعيد في جميع فروعنا. نسعى لتقديم أرقى مستويات الرعاية الصحية لعينيك باستخدام أحدث التقنيات العالمية.
          </p>
          <div className="flex gap-3 justify-start md:justify-end">
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              مشاركة البرنامج
            </button>
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-[10px] border border-blue-100">
              <QrCode size={14} />
              امسح للفتح
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ScrollControls = () => {
  const scrollUp = () => {
    const containers = document.querySelectorAll('.overflow-y-auto');
    containers.forEach(container => {
      container.scrollBy({ top: -window.innerHeight * 0.4, behavior: 'smooth' });
    });
  };
  
  const scrollDown = () => {
    const containers = document.querySelectorAll('.overflow-y-auto');
    containers.forEach(container => {
      container.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
    });
  };

  return (
    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 z-[70] flex flex-col gap-1 opacity-40 hover:opacity-100 transition-opacity">
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollUp}
        className="w-6 h-6 bg-gradient-to-b from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-white rounded shadow-sm flex items-center justify-center border border-white/20 backdrop-blur-sm"
        title="صعود"
      >
        <ChevronUp size={12} />
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollDown}
        className="w-6 h-6 bg-gradient-to-b from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-white rounded shadow-sm flex items-center justify-center border border-white/20 backdrop-blur-sm"
        title="هبوط"
      >
        <ChevronDown size={12} />
      </motion.button>
    </div>
  );
};

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookingData, setBookingData] = useState({ 
    name: '', 
    phone: '', 
    age: '',
    inquiry: '',
    branchId: BRANCHES[0].id 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStep('confirm');
  };

  const finalizeBooking = () => {
    setIsLoading(true);
    
    const selectedBranch = BRANCHES.find(b => b.id === bookingData.branchId) || BRANCHES[0];
    const message = `*طلب حجز موعد جديد*%0A%0A` +
      `*الاسم:* ${bookingData.name}%0A` +
      `*العمر:* ${bookingData.age}%0A` +
      `*رقم الجوال:* ${bookingData.phone}%0A` +
      `*الفرع:* ${selectedBranch.name}%0A` +
      `*الاستفسار:* ${bookingData.inquiry}`;
    
    const whatsappUrl = `https://wa.me/967${selectedBranch.whatsapp}?text=${message}`;
    
    setTimeout(() => {
      setIsLoading(false);
      window.open(whatsappUrl, '_blank');
      setBookingStep('success');
    }, 1000);
  };

  const resetBooking = () => {
    setIsBookingModalOpen(false);
    setBookingStep('form');
    setBookingData({ 
      name: '', 
      phone: '', 
      age: '',
      inquiry: '',
      branchId: BRANCHES[0].id 
    });
  };

  useEffect(() => {
    if (userName && messages.length === 0) {
      const initialGreeting: Message = {
        id: 'initial-greeting',
        role: 'bot',
        content: `مرحباً بك يا ${userName} في مستشفيات رؤية لطب وجراحة العيون والشبكية. أنا مساعدك الطبي الذكي، كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن أي شيء يخص صحة عينك، أو يمكنك تجربة "الفحص الذكي (AI Scan)" لتقييم حالة عينك من خلال صورة.`,
        timestamp: new Date(),
      };
      setMessages([initialGreeting]);
    }
  }, [userName, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const text = typeof e === 'string' ? e : input.trim();
    if (!text || isLoading) return;

    const contextPrefix = userName ? `أنا ${userName}. ` : '';
    const fullPrompt = contextPrefix + text;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (typeof e !== 'string') setInput('');
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const result = await generateMedicalResponse(fullPrompt);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: result.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      if (result.action === "NAVIGATE_TO_SCAN") {
        setTimeout(() => {
          setActiveTab('ai_scan');
          setIsSidebarOpen(false);
        }, 2000);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بنا مباشرة.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-blue-50/30 text-slate-900'} font-sans overflow-hidden transition-colors duration-300`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-72 bg-[#0F172A] text-white z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg p-1">
                <img src={ROAYA_LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">مستشفيات رؤية</h1>
                <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">للعيون والشبكية</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarLink 
              active={activeTab === 'home'} 
              onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
              icon={<Home size={18} />}
              label={t.home}
            />
            <SidebarLink 
              active={activeTab === 'chat'} 
              onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }}
              icon={<MessageSquare size={18} />}
              label={t.chat}
            />
            <SidebarLink 
              active={activeTab === 'ai_scan'} 
              onClick={() => { setActiveTab('ai_scan'); setIsSidebarOpen(false); }}
              icon={<Camera size={18} />}
              label={t.ai_scan}
            />
            <SidebarLink 
              active={activeTab === 'services'} 
              onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }}
              icon={<Activity size={18} />}
              label={t.services}
            />
            <SidebarLink 
              active={activeTab === 'branches'} 
              onClick={() => { setActiveTab('branches'); setIsSidebarOpen(false); }}
              icon={<MapPin size={18} />}
              label={t.branches}
            />
            <SidebarLink 
              active={activeTab === 'about'} 
              onClick={() => { setActiveTab('about'); setIsSidebarOpen(false); }}
              icon={<Info size={18} />}
              label={t.about}
            />
            
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {lang === 'ar' ? 'مواقعنا الإلكترونية' : 'Our Websites'}
            </div>
            <SidebarExternalLink 
              href="https://roayae.org" 
              icon={<Globe size={18} />} 
              label={lang === 'ar' ? 'موقع رؤية' : 'Roaya Website'} 
            />
            <SidebarExternalLink 
              href="https://roayae.org/branch-seiyun/" 
              icon={<MapPin size={18} />} 
              label={lang === 'ar' ? 'فرع سيئون' : 'Seiyun Branch'} 
            />
            <SidebarExternalLink 
              href="https://roayae.org/aden/" 
              icon={<MapPin size={18} />} 
              label={lang === 'ar' ? 'فرع عدن' : 'Aden Branch'} 
            />
            <SidebarExternalLink 
              href="https://roayae.org/mukalla-branch/" 
              icon={<MapPin size={18} />} 
              label={lang === 'ar' ? 'فرع المكلا' : 'Mukalla Branch'} 
            />
            <SidebarExternalLink 
              href="https://roayae.org/al-shehr/" 
              icon={<MapPin size={18} />} 
              label={lang === 'ar' ? 'فرع الشحر' : 'Shihr Branch'} 
            />
            <SidebarExternalLink 
              href="https://roayae.org/camps/" 
              icon={<Heart size={18} />} 
              label={lang === 'ar' ? 'المخيمات' : 'Camps'} 
            />

            <SidebarLink 
              active={activeTab === 'contact'} 
              onClick={() => { setActiveTab('contact'); setIsSidebarOpen(false); }}
              icon={<Headset size={18} />}
              label={t.contact}
            />
            <SidebarLink 
              active={activeTab === 'developers'} 
              onClick={() => { setActiveTab('developers'); setIsSidebarOpen(false); }}
              icon={<Code size={18} />}
              label={t.developers}
            />

            <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              الخدمات السريعة
            </div>
            {SERVICES.map(service => (
              <button
                key={service.id}
                onClick={() => handleSubmit(`أريد معلومات عن ${service.title}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group"
              >
                <span className="text-slate-500 group-hover:text-blue-400 transition-colors">{service.icon}</span>
                {service.title}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center">
                  <Phone size={14} />
                </div>
                <div className="text-xs">
                  <p className="text-slate-400">{t.call_center}</p>
                  <p className="font-bold">774441177</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsBookingModalOpen(true); setBookingStep('form'); }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                {t.quick_booking}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetBooking}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {bookingStep === 'form' && 'حجز موعد سريع'}
                    {bookingStep === 'confirm' && 'تأكيد الحجز'}
                    {bookingStep === 'success' && 'تم الحجز بنجاح'}
                  </h3>
                  <button onClick={resetBooking} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                {bookingStep === 'form' && (
                  <form onSubmit={handleQuickBooking} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 mr-2">الاسم الثلاثي</label>
                      <input 
                        required
                        type="text" 
                        value={bookingData.name}
                        onChange={e => setBookingData({...bookingData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="أدخل اسمك الثلاثي..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 mr-2">العمر</label>
                        <input 
                          required
                          type="number" 
                          value={bookingData.age}
                          onChange={e => setBookingData({...bookingData, age: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="مثال: 25"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 mr-2">رقم الجوال</label>
                        <input 
                          required
                          type="tel" 
                          value={bookingData.phone}
                          onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="7xxxxxxxx"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 mr-2">اختر الفرع</label>
                      <select 
                        value={bookingData.branchId}
                        onChange={e => setBookingData({...bookingData, branchId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                      >
                        {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 mr-2">شرح مختصر عن الاستفسار</label>
                      <textarea 
                        required
                        value={bookingData.inquiry}
                        onChange={e => setBookingData({...bookingData, inquiry: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[80px] resize-none"
                        placeholder="اكتب استفسارك هنا..."
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 mt-4"
                    >
                      متابعة الحجز
                    </button>
                  </form>
                )}

                {bookingStep === 'confirm' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">الاسم:</span>
                        <span className="font-bold text-slate-900">{bookingData.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">العمر:</span>
                        <span className="font-bold text-slate-900">{bookingData.age}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">رقم الهاتف:</span>
                        <span className="font-bold text-slate-900">{bookingData.phone}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">الفرع:</span>
                        <span className="font-bold text-blue-600">{BRANCHES.find(b => b.id === bookingData.branchId)?.name}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-400 block mb-1">الاستفسار:</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{bookingData.inquiry}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setBookingStep('form')}
                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                      >
                        تعديل
                      </button>
                      <button 
                        onClick={finalizeBooking}
                        disabled={isLoading}
                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                          <>
                            <MessageSquare size={18} />
                            إرسال عبر واتساب
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 'success' && (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-800 font-bold text-lg">شكراً لك يا {bookingData.name.split(' ')[0]}</p>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        تم استلام طلبك بنجاح. سيقوم فريق خدمة العملاء بالتواصل معك على الرقم <span className="font-bold text-blue-600" dir="ltr">{bookingData.phone}</span> خلال 30 دقيقة لتأكيد الموعد النهائي.
                      </p>
                    </div>
                    <button 
                      onClick={resetBooking}
                      className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className={`h-20 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 transition-colors`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-lg transition-colors`}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm p-1 border border-slate-100">
                <img src={ROAYA_LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className={`text-sm md:text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight`}>
                  {t.welcome_to}
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.online_now}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Action Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Language Toggle */}
              <button 
                onClick={toggleLang}
                className={`p-2 rounded-xl border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-blue-400' : 'border-slate-200 hover:bg-slate-50 text-blue-600'} transition-all flex items-center gap-1`}
                title={t.lang_toggle}
              >
                <Languages size={18} />
                <span className="text-[10px] font-black">{t.lang_code}</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-xl border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-50 text-slate-600'} transition-all`}
                title={t.theme_toggle}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-blue-400' : 'border-slate-200 hover:bg-slate-50 text-blue-600'} transition-all relative`}
                  title={t.notifications}
                >
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute top-full ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-64 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl shadow-2xl p-4 z-50`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.notifications}</h4>
                        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                      </div>
                      <div className="py-4 text-center">
                        <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-[10px] text-slate-500">{t.no_notifications}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-full text-xs font-medium`}>
              <Star size={14} className="text-amber-500 fill-amber-500" />
              {lang === 'ar' ? 'أعلى تقييم في جراحة العيون' : 'Top Rated in Eye Surgery'}
            </div>
            <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-50'} rounded-full flex items-center justify-center`}>
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <ScrollControls />
          {activeTab === 'home' ? (
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scroll-smooth custom-scrollbar">
              <div className="max-w-4xl mx-auto w-full">
                <HomeHero 
                  onScan={() => setActiveTab('ai_scan')}
                  onTabChange={(tab) => setActiveTab(tab)}
                  t={t}
                  theme={theme}
                  lang={lang}
                />
              </div>
            </div>
          ) : activeTab === 'chat' ? (
            <ChatView 
              messages={messages}
              isLoading={isLoading}
              input={input}
              setInput={setInput}
              handleSend={handleSubmit}
              messagesEndRef={messagesEndRef}
              userName={userName}
              setUserName={setUserName}
              showNamePrompt={showNamePrompt}
              setShowNamePrompt={setShowNamePrompt}
              t={t}
              theme={theme}
              lang={lang}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`mb-8 flex items-center gap-2 text-sm font-bold ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                >
                  <ChevronLeft size={18} className={lang === 'ar' ? "rotate-180" : ""} />
                  {t.back_to_main}
                </button>
                
                {activeTab === 'ai_scan' && <AiScanView lang={lang} theme={theme} />}
                {activeTab === 'services' && (
                  <ServicesView 
                    onBook={() => { setIsBookingModalOpen(true); setBookingStep('form'); }} 
                    onContact={() => setActiveTab('contact')} 
                    onTabChange={setActiveTab}
                    onScan={() => setActiveTab('ai_scan')}
                    t={t}
                    theme={theme}
                    lang={lang}
                  />
                )}
                {activeTab === 'branches' && <BranchesView onTabChange={setActiveTab} onScan={() => setActiveTab('ai_scan')} t={t} theme={theme} lang={lang} />}
                {activeTab === 'about' && <AboutView onTabChange={setActiveTab} onScan={() => setActiveTab('ai_scan')} t={t} theme={theme} lang={lang} />}
                {activeTab === 'developers' && <DevelopersView onTabChange={setActiveTab} onScan={() => setActiveTab('ai_scan')} t={t} theme={theme} lang={lang} />}
                {activeTab === 'contact' && <ContactUsView onTabChange={setActiveTab} onScan={() => setActiveTab('ai_scan')} t={t} theme={theme} lang={lang} />}
              </div>
            </div>
          )}
        </div>
      </main>


      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}

function ChatView({ 
  messages, 
  isLoading, 
  input, 
  setInput, 
  handleSend, 
  messagesEndRef, 
  userName, 
  setUserName, 
  showNamePrompt, 
  setShowNamePrompt, 
  t, 
  theme, 
  lang 
}: any) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : theme === 'dark' ? 'bg-slate-800 text-white rounded-tl-none' : 'bg-white text-slate-900 rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
                <span className="text-[10px] font-bold opacity-70">
                  {msg.sender === 'bot' ? 'Roaya AI' : (userName || (lang === 'ar' ? 'أنت' : 'You'))}
                </span>
              </div>
              <div className="text-sm leading-relaxed">
                <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
              </div>
              <div className="text-[8px] mt-2 opacity-50 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm flex items-center gap-3`}>
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-500">{t.processing}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        {showNamePrompt && (
          <div className={`mb-4 p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-blue-50'} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <p className="text-xs font-bold text-slate-600">{t.name_prompt}</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.enter_name}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => setShowNamePrompt(false)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                {t.save}
              </button>
            </div>
          </div>
        )}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.type_placeholder}
            className={`flex-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all`}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarExternalLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800"
    >
      {icon}
      {label}
      <ExternalLink size={12} className="mr-auto opacity-50" />
    </a>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function NavigationGrid({ onTabChange, onScan, t, theme, lang, compact = false, ultraCompact = false }: { onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string, compact?: boolean, ultraCompact?: boolean }) {
  if (ultraCompact) {
    return (
      <div className="flex items-center justify-center gap-2">
        <NavButton 
          icon={<Home size={10} />} 
          label={t.home} 
          onClick={() => onTabChange('home')} 
          ultraCompact={true}
          theme={theme}
        />
        <NavButton 
          icon={<Maximize size={10} />} 
          label={t.ai_scan} 
          onClick={onScan} 
          ultraCompact={true}
          theme={theme}
        />
        <NavButton 
          icon={<MessageSquare size={10} />} 
          label={t.chat} 
          onClick={() => onTabChange('chat')} 
          ultraCompact={true}
          theme={theme}
        />
        <NavButton 
          icon={<MapPin size={10} />} 
          label={t.branches} 
          onClick={() => onTabChange('branches')} 
          ultraCompact={true}
          theme={theme}
        />
      </div>
    );
  }

  return (
    <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'} mb-4`}>
      <NavButton 
        icon={<Home size={ultraCompact ? 10 : compact ? 12 : 16} />} 
        label={t.home} 
        onClick={() => onTabChange('home')} 
        compact={compact}
        ultraCompact={ultraCompact}
        theme={theme}
      />
      <NavButton 
        icon={<Maximize size={ultraCompact ? 10 : compact ? 12 : 16} />} 
        label={t.ai_scan} 
        onClick={onScan} 
        compact={compact}
        ultraCompact={ultraCompact}
        theme={theme}
      />
      <NavButton 
        icon={<MessageSquare size={ultraCompact ? 10 : compact ? 12 : 16} />} 
        label={t.chat} 
        onClick={() => onTabChange('chat')} 
        compact={compact}
        ultraCompact={ultraCompact}
        theme={theme}
      />
      <NavButton 
        icon={<MapPin size={ultraCompact ? 10 : compact ? 12 : 16} />} 
        label={t.branches} 
        onClick={() => onTabChange('branches')} 
        compact={compact}
        ultraCompact={ultraCompact}
        theme={theme}
      />
    </div>
  );
}

function NavButton({ icon, label, onClick, theme, compact = false, ultraCompact = false }: { icon: React.ReactNode, label: string, onClick: () => void, theme: string, compact?: boolean, ultraCompact?: boolean }) {
  if (ultraCompact) {
    return (
      <button 
        onClick={onClick}
        className={`p-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:bg-blue-50'} rounded-md border flex items-center justify-center transition-all active:scale-90 group`}
        title={label}
      >
        <div className="text-blue-600 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`
        ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:shadow-md hover:bg-blue-50'} rounded-xl md:rounded-2xl shadow-sm border flex flex-col items-center transition-all hover:-translate-y-1 active:scale-95 group
        ${compact ? 'p-1.5 gap-0.5' : 'p-3 md:p-4 gap-1.5 md:gap-2'}
      `}
    >
      <div className={`
        ${theme === 'dark' ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-lg md:rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-100
        ${compact ? 'w-6 h-6' : 'w-8 h-8 md:w-10 h-10'}
      `}>
        {icon}
      </div>
      <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} ${compact ? 'text-[7px]' : 'text-[10px] md:text-xs'}`}>{label}</span>
    </button>
  );
}


function HomeHero({ onScan, onTabChange, t, theme, lang }: { onScan: () => void, onTabChange: (tab: string) => void, t: any, theme: string, lang: string }) {
  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      
      {/* AI Title */}
      <div className="space-y-4 text-center">
        <h1 className={`text-3xl lg:text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight`}>
          {t.welcome_to}
        </h1>
        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          {lang === 'ar' ? 'نظام ذكاء اصطناعي متطور لخدمتكم' : 'Advanced AI System at Your Service'}
        </div>
      </div>

      {/* Hero Section */}
      <div className={`relative h-[550px] rounded-[3.5rem] overflow-hidden shadow-2xl border-8 ${theme === 'dark' ? 'border-slate-800' : 'border-white'} group`}>
        <img 
          src="https://roayae.org/wp-content/uploads/2026/02/%D9%83%D8%B4%D9%81-1024x680.jpg" 
          alt="Roeya Hospital Building" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end p-12">
          <div className="max-w-2xl space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/90 backdrop-blur-md text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
            >
              <Sparkles size={16} />
              {lang === 'ar' ? 'تقنية الذكاء الاصطناعي الثورية' : 'Revolutionary AI Technology'}
            </motion.div>
            <div className="space-y-4">
              <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
                {lang === 'ar' ? 'فحص الشبكية السريع' : 'Fast Retina Scan'}
              </h2>
              <p className="text-2xl text-blue-50 font-medium max-w-lg leading-relaxed opacity-90">
                {lang === 'ar' ? 'احصل على تقرير أولي دقيق لحالة عينيك في أقل من دقيقة واحدة.' : 'Get an accurate preliminary report of your eye condition in less than a minute.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={onScan}
                className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xl hover:bg-blue-50 transition-all flex items-center gap-4 shadow-2xl hover:-translate-y-1 active:scale-95"
              >
                <Camera size={28} className="text-blue-600" />
                {lang === 'ar' ? 'ابدأ الفحص الآن' : 'Start Scan Now'}
              </button>
              <button 
                onClick={() => onTabChange('chat')}
                className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-500 transition-all flex items-center gap-4 shadow-2xl hover:-translate-y-1 active:scale-95"
              >
                <MessageSquare size={28} />
                {t.chat}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickLinkCard 
          icon={<Activity size={20} />} 
          title={t.services} 
          onClick={() => onTabChange('services')}
          color="blue"
          theme={theme}
        />
        <QuickLinkCard 
          icon={<MapPin size={20} />} 
          title={t.branches} 
          onClick={() => onTabChange('branches')}
          color="blue"
          theme={theme}
        />
        <QuickLinkCard 
          icon={<Info size={20} />} 
          title={t.about} 
          onClick={() => onTabChange('about')}
          color="indigo"
          theme={theme}
        />
        <QuickLinkCard 
          icon={<Headset size={20} />} 
          title={t.contact} 
          onClick={() => onTabChange('contact')}
          color="slate"
          theme={theme}
        />
      </div>

      {/* Barcode & Social Section */}
      <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[3rem] border shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3`}>
        <div className="p-10 lg:col-span-2 space-y-8">
          <div className="space-y-2">
            <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {lang === 'ar' ? 'الوصول السريع للمعلومات' : 'Quick Access to Information'}
            </h3>
            <p className="text-slate-500">
              {lang === 'ar' ? 'تواصل معنا عبر منصاتنا الرسمية أو قم بزيارة موقعنا الإلكتروني للمزيد من التفاصيل.' : 'Connect with us via our official platforms or visit our website for more details.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`flex items-center gap-4 p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} rounded-3xl border`}>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</p>
                <a href="https://wa.me/967774441177" target="_blank" rel="noopener noreferrer" className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} hover:text-green-600 transition-colors`}>774441177</a>
              </div>
            </div>
            <div className={`flex items-center gap-4 p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} rounded-3xl border`}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'الرقم الموحد' : 'Unified Number'}</p>
                <a href="tel:05441177" className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} hover:text-blue-600 transition-colors`}>774441177</a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'تابعنا:' : 'Follow us:'}</p>
            <div className="flex gap-4">
              <SocialLink href="https://www.facebook.com/roayae1" icon={<Facebook size={20} />} color="hover:bg-blue-600" />
              <SocialLink href="https://twitter.com/roayae1" icon={<Twitter size={20} />} color="hover:bg-sky-500" />
              <SocialLink href="https://www.youtube.com/@Roayae1" icon={<Youtube size={20} />} color="hover:bg-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-10 flex flex-col items-center justify-center text-center space-y-6">
          <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl shadow-blue-500/20">
            <QRCodeSVG value="https://roayae.org" size={160} />
          </div>
          <div className="space-y-1">
            <p className="text-white font-bold">{lang === 'ar' ? 'امسح الكود' : 'Scan Code'}</p>
            <p className="text-slate-400 text-xs">{lang === 'ar' ? 'لزيارة موقعنا الرسمي roayae.org' : 'To visit our official website roayae.org'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function QuickLinkCard({ icon, title, onClick, color, theme }: { icon: React.ReactNode, title: string, onClick: () => void, color: string, theme: string }) {
  const colors: Record<string, string> = {
    blue: theme === 'dark' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    indigo: theme === 'dark' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-900/30 hover:bg-indigo-900/30' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
    slate: theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-[2rem] border ${colors[color]} transition-all flex flex-col items-center gap-4 text-center group active:scale-95`}
    >
      <div className="transition-transform group-hover:scale-110 duration-300">
        {icon}
      </div>
      <span className="font-black text-sm">{title}</span>
    </button>
  );
}

function SocialLink({ href, icon, color }: { href: string, icon: React.ReactNode, color: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center transition-all hover:text-white ${color} active:scale-90`}
    >
      {icon}
    </a>
  );
}

function ServicesView({ onBook, onContact, onTabChange, onScan, t, theme, lang }: { onBook: () => void, onContact: () => void, onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <Activity size={12} />
          {lang === 'ar' ? 'رعاية تخصصية' : 'Specialized Care'}
        </div>
        <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{t.services}</h2>
        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
          {lang === 'ar' ? 'نلتزم بتقديم رؤية طبية متطورة تجمع بين الخبرة البشرية والتقنية الحديثة لنمنحك رؤية أوضح وحياة أفضل.' : 'We are committed to providing advanced medical vision that combines human expertise and modern technology to give you clearer vision and a better life.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERVICES.map((s, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className={`group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all duration-300`}
          >
            <div className="h-56 overflow-hidden relative">
              <img 
                src={s.image} 
                alt={s.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className={`absolute top-4 right-4 w-12 h-12 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20 text-blue-600`}>
                {s.icon}
              </div>
            </div>
            
            <div className="p-8 space-y-4">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-blue-600 transition-colors leading-tight`}>{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                {s.description}
              </p>
              <div className={`pt-4 flex items-center justify-between border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-50'}`}>
                <button 
                  onClick={onBook}
                  className="text-blue-600 text-xs font-bold flex items-center gap-2 hover:gap-3 transition-all"
                >
                  {lang === 'ar' ? 'احجز الآن' : 'Book Now'}
                  <ArrowLeft size={14} className={lang === 'ar' ? "" : "rotate-180"} />
                </button>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  <div className={`w-8 h-8 rounded-full border-2 ${theme === 'dark' ? 'border-slate-900 bg-slate-700' : 'border-white bg-blue-50'} flex items-center justify-center text-blue-600 shadow-sm`}>
                    <User size={14} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-3xl font-bold tracking-tight">{lang === 'ar' ? 'هل ترغب في استشارة طبية؟' : 'Do you want a medical consultation?'}</h3>
            <p className="text-slate-400 max-w-md">{lang === 'ar' ? 'فريقنا الطبي المتخصص جاهز للرد على جميع استفساراتك وتقديم الرعاية اللازمة.' : 'Our specialized medical team is ready to answer all your inquiries and provide the necessary care.'}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={onBook}
              className="px-8 py-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              {lang === 'ar' ? 'احجز موعدك الآن' : 'Book Your Appointment Now'}
            </button>
            <button 
              onClick={onContact}
              className="px-8 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md active:scale-95"
            >
              {t.contact}
            </button>
          </div>
        </div>
      </div>

      <div className={`pt-12 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      </div>
    </div>
  );
}



function BranchesView({ onTabChange, onScan, t, theme, lang }: { onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string }) {
  const branches = [
    { 
      name: lang === 'ar' ? 'المركز الرئيسي – رؤية سيئون' : 'Main Center – Roaya Seiyun', 
      addr: lang === 'ar' ? 'حضرموت – سيئون – شارع الجزائر – العمارة الخضراء – مقابل مركز غسيل الكلى' : 'Hadramout – Seiyun – Algeria St – Green Bldg – Opposite Dialysis Center',
      phones: ['05-441177', '05-408993'],
      whatsapp: '774441177',
      hours: {
        morning: lang === 'ar' ? 'الفترة الصباحية: 8:30 ص – 1:30 ظ' : 'Morning: 8:30 AM – 1:30 PM',
        evening: lang === 'ar' ? 'الفترة المسائية: 4:30 م – 8:30 م' : 'Evening: 4:30 PM – 8:30 PM',
        friday: lang === 'ar' ? 'الجمعة: إجازة' : 'Friday: Holiday'
      },
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d15346.012967138033!2d48.79036500000001!3d15.935075!3m2!1i1024!2i768!4f13.1!2m1!1z2KfZhNmF2LHZg9iyINin2YTYsdim2YrYs9mKIOKAkyDYsdik2YrYqSDYs9mK2KbZiNmGINit2LbYsdmF2YjYqiDigJMg2LPZitim2YjZhiDigJMg2LTYp9ix2Lkg2KfZhNis2LLYp9im2LEg4oCTINin2YTYudmF2KfYsdipINin2YTYrti22LHYp9ihIOKAkyDZhdmC2KfYqNmEINmF2LHZg9iyINi62LPZitmEINin2YTZg9mE2Yk!5e0!3m2!1sar!2sus!4v1773004790718!5m2!1sar!2sus',
      googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+سيئون'
    },
    { 
      name: lang === 'ar' ? 'رؤية عدن' : 'Roaya Aden', 
      addr: lang === 'ar' ? 'عدن – القاهرة – شارع السنافر، بجانب مكتب بريد القاهرة' : 'Aden – Al-Mansoura – Al-Sanafer St – Next to Cairo Post Office',
      phones: ['02-388150', '02-388151'],
      whatsapp: '782255557',
      hours: {
        morning: lang === 'ar' ? 'الفترة الصباحية: 8:30 ص – 1:30 ظ' : 'Morning: 8:30 AM – 1:30 PM',
        evening: lang === 'ar' ? 'الفترة المسائية: 4:30 م – 8:30 م' : 'Evening: 4:30 PM – 8:30 PM',
        note: lang === 'ar' ? 'الخميس: لا توجد فترة مسائية' : 'Thursday: No evening shift',
        friday: lang === 'ar' ? 'الجمعة: إجازة' : 'Friday: Holiday'
      },
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.5875991606426!2d44.98476782619154!3d12.869891817102591!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3df5f7138f379d35%3A0x7011461d86e98799!2z2LHYpNmK2Kkg2YTYt9ioINmIINis2LHYp9it2Kkg2KfZhNi52YrZiNmGINmI2KfZhNi02KjZg9mK2Kkt2LnYr9mG!5e0!3m2!1sar!2sus!4v1773004972804!5m2!1sar!2sus',
      googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+عدن'
    },
    { 
      name: lang === 'ar' ? 'رؤية المكلا' : 'Roaya Mukalla', 
      addr: lang === 'ar' ? 'المكلا – الديس – الإشارة – بجانب مؤسسة الشامي – عمارة بن جميل' : 'Mukalla – Al-Dis – Traffic Light – Next to Al-Shami Foundation',
      phones: ['05-310888'],
      whatsapp: '778844766',
      hours: {
        morning: lang === 'ar' ? 'الفترة الصباحية: 8:30 ص – 1:30 ظ' : 'Morning: 8:30 AM – 1:30 PM',
        evening: lang === 'ar' ? 'الفترة المسائية: 4:30 م – 8:30 م' : 'Evening: 4:30 PM – 8:30 PM',
        note: lang === 'ar' ? 'الخميس: لا توجد فترة مسائية' : 'Thursday: No evening shift',
        friday: lang === 'ar' ? 'الجمعة: إجازة' : 'Friday: Holiday'
      },
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d15447.553526801117!2d49.127344!3d14.548375!3m2!1i1024!2i768!4f13.1!2m1!1z2LHYpNmK2Kkg2KfZhNmF2YPZhNinINin2YTZhdmD2YTYpyDigJMg2KfZhNiv2YrYsyDigJMg2KfZhNil2LTYp9ix2Kkg4oCTINio2KzYp9mG2Kgg2YXYpNiz2LPYqSDYp9mE2LTYp9mF2Yog4oCTINi52YXYp9ix2Kkg2KjZhiDYrNmF2YrZhA!5e0!3m2!1sar!2sus!4v1773004899244!5m2!1sar!2sus',
      googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+المكلا'
    },
    { 
      name: lang === 'ar' ? 'رؤية الشحر' : 'Roaya Shihr', 
      addr: lang === 'ar' ? 'حي المنصورة – بجوار مدارس التفوق – مدينة الشحر – حضرموت' : 'Al-Mansoura – Next to Al-Tafawuq Schools – Shihr – Hadramout',
      phones: ['781765720', '781765257'],
      whatsapp: '781765720',
      hours: {
        morning: lang === 'ar' ? 'الفترة الصباحية: 8:30 ص – 1:30 ظ' : 'Morning: 8:30 AM – 1:30 PM',
        evening: lang === 'ar' ? 'الفترة المسائية: 4:30 م – 8:30 م' : 'Evening: 4:30 PM – 8:30 PM',
        note: lang === 'ar' ? 'الخميس: لا توجد فترة مسائية' : 'Thursday: No evening shift',
        friday: lang === 'ar' ? 'الجمعة: إجازة' : 'Friday: Holiday'
      },
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.125103552969!2d49.598874830898524!3d14.761981041624157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3de8454393dca9e1%3A0x1e1eb2fb1023e009!2z2LHYpNmK2Kkg2YTYt9ioINmIINis2LHYp9it2Kkg2KfZhNi52YrZiNmGINmI2KfZhNi02KjZg9mK2Kkg2KfZhNi02K3YsQ!5e0!3m2!1sar!2sus!4v1773005008226!5m2!1sar!2sus',
      googleMapsLink: 'https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+الشحر'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-2">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.branches}</h2>
        <p className="text-slate-500">{lang === 'ar' ? 'مجموعة مستشفيات رؤية.. رعاية تخصصية قريبة منك في مختلف المحافظات.' : 'Roaya Hospital Group.. Specialized care near you in various governorates.'}</p>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {branches.map((b, i) => (
          <div key={i} className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2.5rem] border shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col`}>
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                  {b.name}
                </h3>
                <div className="flex items-start gap-2 text-slate-500">
                  <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{b.addr}</p>
                </div>
              </div>

              {/* Working Hours Box */}
              <div className={`${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50/80'} backdrop-blur-sm rounded-3xl p-6 flex gap-4 items-start`}>
                <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-2xl flex items-center justify-center shadow-sm text-blue-600 shrink-0`}>
                  <Clock size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400 font-medium">{b.hours.morning}</p>
                  <p className="text-sm text-slate-400 font-medium">{b.hours.evening}</p>
                  {b.hours.note && <p className="text-sm text-slate-400 font-medium">{b.hours.note}</p>}
                  <p className="text-sm text-slate-500">{b.hours.friday}</p>
                </div>
              </div>

              {/* Phone Buttons */}
              <div className="flex flex-wrap gap-3">
                {b.phones.map((phone, idx) => (
                  <a 
                    key={idx}
                    href={`tel:${phone.replace(/-/g, '')}`}
                    className={`flex items-center gap-2 px-6 py-3 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200/50 text-slate-700'} rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors border`}
                  >
                    <span dir="ltr">{phone}</span>
                    <Phone size={16} className="text-slate-400" />
                  </a>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <a 
                  href={`https://wa.me/967${b.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#00a859] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-bold text-lg hover:bg-[#008f4c] transition-all shadow-lg shadow-green-200"
                >
                  <MessageCircle size={24} />
                  {lang === 'ar' ? 'حجز عبر واتساب' : 'Book via WhatsApp'}
                </a>
                <a 
                  href={b.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-16 h-16 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'} rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-all border`}
                >
                  <MapPin size={28} />
                </a>
              </div>
            </div>

            {/* Map Embed */}
            <div className="h-64 relative group">
              <iframe 
                src={b.mapEmbed}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-all duration-700"
              ></iframe>
              <div className="absolute top-4 left-4">
                <a 
                  href={b.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 text-xs font-bold text-slate-900 flex items-center gap-2 hover:bg-white transition-colors"
                >
                  <ExternalLink size={14} />
                  {lang === 'ar' ? 'الفتح في "خرائط Google"' : 'Open in Google Maps'}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`pt-12 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      </div>
    </div>
  );
}

function DevelopersView({ onTabChange, onScan, t, theme, lang }: { onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string }) {
  const appUrl = window.location.origin;
  const embedCode = `<iframe src="${appUrl}" width="100%" height="800px" frameborder="0" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);"></iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(lang === 'ar' ? 'تم نسخ الكود بنجاح!' : 'Code copied successfully!');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded-full text-xs font-bold uppercase tracking-wider`}>
          <Terminal size={12} />
          {lang === 'ar' ? 'أدوات المطورين' : 'Developer Tools'}
        </div>
        <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{t.developers}</h2>
        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
          {lang === 'ar' ? 'يمكنك الآن تضمين برنامج مستشفيات رؤية الذكي في موقعك الإلكتروني أو مدونة وورد بريس بسهولة تامة.' : 'You can now easily embed the Roaya Hospital Smart Program into your website or WordPress blog.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-100'} rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl border`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Code className="text-blue-400" />
                {lang === 'ar' ? 'كود التضمين (HTML)' : 'Embed Code (HTML)'}
              </h3>
              <button 
                onClick={() => copyToClipboard(embedCode)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <Copy size={20} />
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl p-5 font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed border border-white/10">
              {embedCode}
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{lang === 'ar' ? 'طريقة الاستخدام في وورد بريس:' : 'How to use in WordPress:'}</p>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                  {lang === 'ar' ? 'قم بنسخ الكود البرمجي أعلاه.' : 'Copy the code above.'}
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                  {lang === 'ar' ? 'في محرر وورد بريس، أضف مكون "Custom HTML".' : 'In the WordPress editor, add a "Custom HTML" block.'}
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                  {lang === 'ar' ? 'قم بلصق الكود وحفظ الصفحة.' : 'Paste the code and save the page.'}
                </li>
              </ol>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-[2.5rem] border p-8 space-y-6 shadow-sm`}>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
              <ExternalLink className="text-blue-600" />
              {lang === 'ar' ? 'رابط مباشر للمعاينة' : 'Direct Preview Link'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {lang === 'ar' ? 'يمكنك أيضاً استخدام هذا الزر الاحترافي لفتح البرنامج في نافذة جديدة مباشرة.' : 'You can also use this professional button to open the program in a new window directly.'}
            </p>
            <a 
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
            >
              <Eye size={20} />
              {lang === 'ar' ? 'فتح البرنامج في نافذة جديدة' : 'Open Program in New Window'}
            </a>
          </div>
        </div>

      <div className="space-y-6">
          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'} rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-6 border`}>
            <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-2`}>
              <QrCode size={32} />
            </div>
            <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'امسح الباركود' : 'Scan Barcode'}</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {lang === 'ar' ? 'استخدم كاميرا هاتفك لمسح الكود وفتح البرنامج مباشرة على جوالك.' : 'Use your phone camera to scan the code and open the program directly on your mobile.'}
            </p>
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border-4 border-white">
              <QRCodeSVG value={appUrl} size={200} />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-white px-4 py-2 rounded-full shadow-sm">
              <Globe size={14} />
              {appUrl}
            </div>
          </div>
        </div>
      </div>

      <div className={`pt-12 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      </div>
    </div>
  );
}


function AboutView({ onTabChange, onScan, t, theme, lang }: { onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className={`relative h-96 rounded-[3rem] overflow-hidden shadow-2xl border-8 ${theme === 'dark' ? 'border-slate-800' : 'border-white'}`}>
        <img 
          src="https://roayae.org/wp-content/uploads/2023/11/ju-1024x662.jpg" 
          alt="Roeya Hospital Building" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent' : 'bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent'} flex items-end p-10`}>
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-2">
              <img src="https://roayahospital.com/wp-content/uploads/2023/10/logo-roaya.png" alt="Logo" className="h-12 bg-white p-2 rounded-xl" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">{t.about}</h2>
            <p className="text-blue-400 font-bold text-xl">{lang === 'ar' ? 'رؤية أوضح لحياة أفضل منذ عام 2004' : 'Clearer Vision for a Better Life since 2004'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
              <Info className="text-blue-600" />
              {lang === 'ar' ? 'عن مجموعة مستشفيات رؤية' : 'About Roaya Hospital Group'}
            </h3>
            <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'ar' ? 'تعد مجموعة مستشفيات رؤية لطب وجراحة العيون والشبكية واحدة من أكبر وأحدث المؤسسات الطبية المتخصصة في اليمن. منذ تأسيسنا، وضعنا نصب أعيننا تقديم رعاية طبية تضاهي المستويات العالمية، مستعينين بأحدث ما توصل إليه العلم في مجال جراحات العيون المجهرية وتقنيات الليزر.' : 'Roaya Hospital Group for Ophthalmology and Retina is one of the largest and most modern specialized medical institutions in Yemen. Since our inception, we have aimed to provide world-class medical care, utilizing the latest scientific advancements in micro-eye surgery and laser technology.'}
            </p>
            <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {lang === 'ar' ? 'نحن نفخر بامتلاكنا لأحدث غرف العمليات المجهزة بنظام الفلترة الهوائية (Laminar Flow) لضمان أعلى مستويات التعقيم، بالإضافة إلى أحدث أجهزة تشخيص وعلاج أمراض الشبكية والمياه البيضاء والزرقاء وتصحيح الإبصار.' : 'We pride ourselves on having the latest operating rooms equipped with a Laminar Flow air filtration system to ensure the highest levels of sterilization, in addition to the latest diagnostic and treatment devices for retina diseases, cataracts, glaucoma, and vision correction.'}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-8 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2rem] border shadow-sm space-y-3`}>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Star size={24} />
              </div>
              <h4 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                {lang === 'ar' ? 'أن نكون الخيار الأول والرائد في مجال طب وجراحة العيون في اليمن، بتقديم خدمات طبية متميزة.' : 'To be the first and leading choice in the field of ophthalmology in Yemen, by providing distinguished medical services.'}
              </p>
            </div>
            <div className={`p-8 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2rem] border shadow-sm space-y-3`}>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h4 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'قيمنا' : 'Our Values'}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                {lang === 'ar' ? 'النزاهة، الجودة، الرعاية الإنسانية، والابتكار المستمر في تقديم الخدمات الطبية.' : 'Integrity, quality, human care, and continuous innovation in providing medical services.'}
              </p>
            </div>
            <div className={`p-8 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2rem] border shadow-sm space-y-3`}>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <h4 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'رسالتنا' : 'Our Mission'}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                {lang === 'ar' ? 'توفير رعاية صحية للعيون بجودة عالية وتكلفة مناسبة، باستخدام أحدث التقنيات وأفضل الكوادر.' : 'Providing high-quality eye healthcare at an affordable cost, using the latest technologies and the best personnel.'}
              </p>
            </div>
          </div>

          <section className={`p-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-900'} rounded-[2.5rem] text-white space-y-6`}>
            <h4 className="text-xl font-bold flex items-center gap-3">
              <Sparkles className="text-blue-400" />
              {lang === 'ar' ? 'قيمنا الجوهرية' : 'Our Core Values'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(lang === 'ar' ? ['الرحمة', 'الاحترافية', 'النزاهة', 'التطوير المستمر', 'العناية بالمريض كأولوية قصوى'] : ['Compassion', 'Professionalism', 'Integrity', 'Continuous Development', 'Patient Care as Top Priority']).map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  {v}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className={`bg-blue-600 rounded-[2.5rem] p-8 text-white text-center space-y-6 shadow-xl ${theme === 'dark' ? 'shadow-blue-900/20' : 'shadow-blue-200'}`}>
            <div className="space-y-1">
              <div className="text-5xl font-black">+20</div>
              <div className="text-sm font-bold opacity-80 uppercase tracking-widest">{lang === 'ar' ? 'سنة من الخبرة' : 'Years of Experience'}</div>
            </div>
            <div className="h-px bg-white/20" />
            <div className="space-y-1">
              <div className="text-5xl font-black">+50</div>
              <div className="text-sm font-bold opacity-80 uppercase tracking-widest">{lang === 'ar' ? 'طبيب استشاري' : 'Consultant Doctor'}</div>
            </div>
            <div className="h-px bg-white/20" />
            <div className="space-y-1">
              <div className="text-5xl font-black">+100k</div>
              <div className="text-sm font-bold opacity-80 uppercase tracking-widest">{lang === 'ar' ? 'عملية ناجحة' : 'Successful Operation'}</div>
            </div>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[2.5rem] border p-8 space-y-4 shadow-sm`}>
            <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'لماذا تختار رؤية؟' : 'Why Choose Roaya?'}</h4>
            <ul className="space-y-3">
              {(lang === 'ar' ? [
                'أحدث أجهزة الليزر والجراحة الميكروسكوبية',
                'نخبة من كبار الاستشاريين في اليمن',
                'رعاية طبية متكاملة لجميع أفراد الأسرة',
                'مخيمات علاجية إنسانية دورية'
              ] : [
                'Latest laser and microscopic surgery devices',
                'Elite senior consultants in Yemen',
                'Integrated medical care for all family members',
                'Periodic humanitarian treatment camps'
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
                  <div className="mt-1 w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Star size={10} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={`pt-12 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      </div>
    </div>
  );
}


function ContactUsView({ onTabChange, onScan, t, theme, lang }: { onTabChange: (tab: string) => void, onScan: () => void, t: any, theme: string, lang: string }) {
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: 'info@roayae.org' // Target email updated
        })
      });
      
      if (response.ok) {
        setFormStatus('sent');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error(error);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.' : 'An error occurred during sending. Please try again.');
      setFormStatus('idle');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-700'} rounded-full text-xs font-bold uppercase tracking-wider`}>
          <Headset size={12} />
          {lang === 'ar' ? 'خدمة العملاء' : 'Customer Service'}
        </div>
        <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{t.contact}</h2>
        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
          {lang === 'ar' ? 'نحن هنا للإجابة على جميع استفساراتكم على مدار الساعة. لا تتردد في التواصل معنا عبر أي من القنوات التالية.' : 'We are here to answer all your inquiries around the clock. Feel free to contact us through any of the following channels.'}
        </p>
      </div>

      <div className={`relative h-64 rounded-[2.5rem] overflow-hidden shadow-lg border-4 ${theme === 'dark' ? 'border-slate-800' : 'border-white'}`}>
        <img 
          src="https://roayae.org/wp-content/uploads/2026/02/%D9%83%D8%B4%D9%81-1024x680.jpg" 
          alt="Contact Header" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-900/20'} backdrop-blur-[2px]`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-4">
          <ContactCard 
            icon={<Phone className="text-blue-600" />} 
            title={lang === 'ar' ? 'مركز الاتصال (سيئون)' : 'Contact Center (Seiyun)'} 
            value="774441177" 
            sub={lang === 'ar' ? 'متاح خلال فترات الدوام' : 'Available during working hours'}
            href="tel:05441177"
            theme={theme}
          />
          <ContactCard 
            icon={<Mail className="text-blue-600" />} 
            title={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} 
            value="info@roayae.org" 
            sub={lang === 'ar' ? 'نرد خلال 24 ساعة' : 'We respond within 24 hours'}
            href="mailto:info@roayae.org"
            theme={theme}
          />
          <ContactCard 
            icon={<Globe className="text-blue-600" />} 
            title={lang === 'ar' ? 'الموقع الرسمي' : 'Official Website'} 
            value="www.roayae.org" 
            sub={lang === 'ar' ? 'تصفح خدماتنا أونلاين' : 'Browse our services online'}
            href="https://roayae.org"
            theme={theme}
          />
          
          <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'تابعنا على' : 'Follow us on'}</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/roayae1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com/roayae1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all">
                <Twitter size={20} />
              </a>
              <a href="https://www.youtube.com/@Roayae1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all">
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className={`lg:col-span-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-[2.5rem] border p-8 shadow-sm`}>
          {formStatus === 'sent' ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
                <Shield size={40} />
              </div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'تم إرسال رسالتك!' : 'Your message has been sent!'}</h3>
              <p className="text-slate-500 max-w-xs">{lang === 'ar' ? 'شكراً لتواصلك معنا. سيقوم أحد ممثلي خدمة العملاء بالرد عليك في أقرب وقت ممكن.' : 'Thank you for contacting us. One of our customer service representatives will get back to you as soon as possible.'}</p>
              <button 
                onClick={() => setFormStatus('idle')}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send another message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all`} 
                    placeholder={lang === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className={`w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all`} 
                    placeholder="01xxxxxxxxx" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 mr-2">{lang === 'ar' ? 'الموضوع' : 'Subject'}</label>
                <input 
                  required 
                  type="text" 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className={`w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all`} 
                  placeholder={lang === 'ar' ? 'ما هو موضوع استفسارك؟' : 'What is the subject of your inquiry?'} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 mr-2">{lang === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea 
                  required 
                  rows={4} 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className={`w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all resize-none`} 
                  placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                ></textarea>
              </div>
              <button 
                disabled={formStatus === 'sending'}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
              >
                {formStatus === 'sending' ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className={lang === 'ar' ? 'rotate-180' : ''} />}
                {lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{lang === 'ar' ? 'موقع المركز الرئيسي' : 'Main Center Location'}</h3>
          <div className="flex items-center gap-2 text-blue-600 text-sm font-bold">
            <MapPin size={16} />
            {lang === 'ar' ? 'سيئون، حضرموت' : 'Seiyun, Hadramout'}
          </div>
        </div>
        <div className={`h-[400px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} rounded-[3rem] overflow-hidden border-4 ${theme === 'dark' ? 'border-slate-700' : 'border-white'} shadow-xl relative group`}>
          <img 
            src="https://roayae.org/wp-content/uploads/2026/02/%D9%83%D8%B4%D9%81-1024x680.jpg" 
            alt="Roeya Hospital Examination" 
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-blue-950/20' : 'bg-blue-900/10'} pointer-events-none`} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 scale-150" />
              <div className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 relative z-10 border-4 border-blue-500">
                <Eye size={32} />
              </div>
            </div>
          </div>
          <div className={`absolute bottom-6 right-6 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-md p-4 rounded-2xl shadow-lg border ${theme === 'dark' ? 'border-slate-700' : 'border-white/20'} max-w-xs`}>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-1`}>{lang === 'ar' ? 'العنوان بالتفصيل:' : 'Detailed Address:'}</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">{lang === 'ar' ? 'حضرموت – سيئون – شارع الجزائر – العمارة الخضراء – مقابل مركز غسيل الكلى.' : 'Hadramout – Seiyun – Algeria St – Green Bldg – Opposite Dialysis Center.'}</p>
          </div>
        </div>
      </div>

      <div className={`pt-12 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <NavigationGrid onTabChange={onTabChange} onScan={onScan} t={t} theme={theme} lang={lang} />
      </div>
    </div>
  );
}

function ContactCard({ icon, title, value, sub, href, theme }: { icon: React.ReactNode, title: string, value: string, sub: string, href?: string, theme: string }) {
  const CardContent = (
    <>
      <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'} rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400 mb-1">{title}</p>
      <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-1`}>{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </>
  );

  if (href) {
    return (
      <a 
        href={href} 
        target={href.startsWith('http') ? "_blank" : undefined}
        rel={href.startsWith('http') ? "noopener noreferrer" : undefined}
        className={`block ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-6 rounded-3xl border shadow-sm hover:border-blue-500 transition-colors group`}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <div className={`block ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-6 rounded-3xl border shadow-sm group`}>
      {CardContent}
    </div>
  );
}



