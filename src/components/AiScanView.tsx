import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Download, FileText, QrCode, Loader2, 
  CheckCircle2, AlertCircle, ArrowRight, Share2, Phone, Mail,
  Sparkles, Eye, Shield, History, Trash2, ExternalLink, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeEyeImage } from '../services/geminiService';

const BRANCHES = [
  { id: 'seiyun', name: 'رؤية سيئون (المركز الرئيسي)', whatsapp: '774441177' },
  { id: 'aden', name: 'رؤية عدن', whatsapp: '782255557' },
  { id: 'mukalla', name: 'رؤية المكلا', whatsapp: '778844766' },
  { id: 'shihr', name: 'رؤية الشحر', whatsapp: '781765720' },
];

const ROAYA_LOGO = "https://roayae.org/wp-content/uploads/elementor/thumbs/cropped-%D8%B4%D8%B9%D8%A7%D8%B1-%D9%85%D8%B3%D8%AA%D8%B4%D9%81%D9%89-%D8%B1%D8%A4%D9%8A%D8%A9-qf666fklyr7uf4ncdzpnajc09q6qujg5777ct93rdk.png";
const SCAN_HERO_IMAGE = "https://roayae.org/wp-content/uploads/2026/02/%D9%83%D8%B4%D9%81-1024x680.jpg";

export default function AiScanView({ lang = 'ar', theme = 'light' }: { lang?: string, theme?: string }) {
  const isAr = lang === 'ar';
  const [step, setStep] = useState<'info' | 'upload' | 'analyzing' | 'result' | 'history'>('info');
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    age: '',
    chronicDiseases: ''
  });
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [fileNumber, setFileNumber] = useState(`ROAYA-${Math.floor(100000 + Math.random() * 900000)}`);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('roaya_scan_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveScanToHistory = (scanData: any) => {
    const newHistory = [scanData, ...history];
    setHistory(newHistory);
    localStorage.setItem('roaya_scan_history', JSON.stringify(newHistory));
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('roaya_scan_history', JSON.stringify(newHistory));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setStep('analyzing');
    try {
      // Resize image before analysis to ensure it's within limits
      const resizedImage = await resizeImage(image);
      const result = await analyzeEyeImage(resizedImage, userInfo);
      setAnalysis(result);
      
      if (saveToHistory) {
        const scanRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          userInfo: { ...userInfo },
          analysis: result,
          image: resizedImage,
          fileNumber
        };
        saveScanToHistory(scanRecord);
      }
      
      setStep('result');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "حدث خطأ أثناء تحليل الصورة. يرجى المحاولة مرة أخرى أو التأكد من جودة الصورة.";
      alert(errorMsg);
      setStep('upload');
    }
  };

  const resizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const viewHistoryItem = (item: any) => {
    setUserInfo(item.userInfo);
    setAnalysis(item.analysis);
    setImage(item.image);
    setFileNumber(item.fileNumber);
    setStep('result');
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = reportRef.current;
      
      // Use higher scale for better quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If report is longer than one page, we might need to handle it, 
      // but for now let's ensure it fits or scales.
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Roaya_Report_${userInfo.name}_${fileNumber}.pdf`);
    } catch (error) {
      console.error('PDF generation failed', error);
      alert('فشل تحميل ملف PDF. يرجى المحاولة مرة أخرى أو استخدام خيار الطباعة.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const sendToWhatsApp = () => {
    const message = `مرحباً مستشفى رؤية (${selectedBranch.name})،
أرغب في حجز موعد بناءً على تقرير الفحص الذكي.
رقم الملف: ${fileNumber}
الاسم: ${userInfo.name}
التشخيص الأولي: ${analysis?.diagnosis}
يرجى التواصل معي لتأكيد الموعد.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/967${selectedBranch.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <img 
            src={ROAYA_LOGO} 
            alt="Roaya Hospital Logo" 
            className="h-20 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
          <Sparkles size={16} className="animate-pulse" />
          تقنية الذكاء الاصطناعي المتطورة
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">الفحص الذكي للعين</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          قم برفع صورة لعينك وسيقوم نظامنا المدعوم بالذكاء الاصطناعي بتحليلها وتقديم تقرير أولي استرشادي في ثوانٍ.
        </p>
        
        {history.length > 0 && (
          <button 
            onClick={() => setStep('history')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-all"
          >
            <History size={16} />
            عرض سجل الفحوصات السابقة ({history.length})
          </button>
        )}
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-center items-center gap-4 mb-8">
        {[
          { id: 'info', label: 'البيانات' },
          { id: 'upload', label: 'الصورة' },
          { id: 'analyzing', label: 'التحليل' },
          { id: 'result', label: 'التقرير' }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div 
              className={`flex flex-col items-center gap-2 cursor-pointer ${step === s.id ? 'text-blue-600' : 'text-slate-400'}`}
              onClick={() => {
                if (['info', 'upload', 'result'].includes(step) && s.id !== 'analyzing') {
                  if (s.id === 'info') setStep('info');
                  if (s.id === 'upload' && userInfo.name) setStep('upload');
                  if (s.id === 'result' && analysis) setStep('result');
                }
              }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                {i + 1}
              </div>
              <span className="text-xs font-bold">{s.label}</span>
            </div>
            {i < 3 && <div className={`w-12 h-0.5 rounded-full ${i < ['info', 'upload', 'analyzing', 'result'].indexOf(step) ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'info' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <FileText className="text-blue-600" />
                  أدخل بيانات المريض
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">الاسم بالكامل</label>
                    <input 
                      type="text" 
                      value={userInfo.name}
                      onChange={e => setUserInfo({...userInfo, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all" 
                      placeholder="أدخل اسمك..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      value={userInfo.phone}
                      onChange={e => setUserInfo({...userInfo, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all" 
                      placeholder="7xxxxxxxx" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">العمر</label>
                    <input 
                      type="number" 
                      value={userInfo.age}
                      onChange={e => setUserInfo({...userInfo, age: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all" 
                      placeholder="مثال: 35" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">الأمراض المزمنة (إن وجدت)</label>
                    <input 
                      type="text" 
                      value={userInfo.chronicDiseases}
                      onChange={e => setUserInfo({...userInfo, chronicDiseases: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-500 transition-all" 
                      placeholder="مثال: سكري، ضغط..." 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                  <input 
                    type="checkbox" 
                    id="saveHistory"
                    checked={saveToHistory}
                    onChange={e => setSaveToHistory(e.target.checked)}
                    className="w-6 h-6 accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="saveHistory" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    أوافق على حفظ نتيجة الفحص في سجلي الخاص (محلياً) للرجوع إليها لاحقاً برقم الملف
                  </label>
                </div>
                <button 
                  onClick={() => userInfo.name && userInfo.phone && userInfo.age && setStep('upload')}
                  disabled={!userInfo.name || !userInfo.phone || !userInfo.age}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
                >
                  متابعة للفحص
                  <ArrowRight size={20} className="rotate-180" />
                </button>
              </div>
              
              <div className="hidden lg:block relative h-full min-h-[400px]">
                <div className="absolute inset-0 bg-blue-600/10 rounded-[3rem] -rotate-2" />
                <img 
                  src={SCAN_HERO_IMAGE} 
                  alt="Eye Examination" 
                  className="relative w-full h-full object-cover rounded-[3rem] shadow-2xl border-4 border-white rotate-2 transition-transform hover:rotate-0 duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 max-w-[200px] space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Shield size={20} />
                    <span className="text-xs font-black uppercase tracking-tighter">دقة عالية</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-tight">نستخدم أحدث خوارزميات الذكاء الاصطناعي لضمان أفضل النتائج الاسترشادية.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-12 text-center space-y-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              {image ? (
                <div className="relative w-64 h-64 mx-auto rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={40} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Camera size={48} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-slate-900">التقط أو ارفع صورة للعين</p>
                    <p className="text-slate-500">يرجى التأكد من وجود إضاءة جيدة ووضوح عالي</p>
                  </div>
                </div>
              )}
            </div>

            {image && (
              <div className="flex gap-4">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  تغيير الصورة
                </button>
                <button 
                  onClick={startAnalysis}
                  className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
                >
                  بدء التحليل الذكي
                  <Sparkles size={20} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center space-y-8 shadow-sm"
          >
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Eye size={48} className="animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-900">جاري تحليل الصورة...</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                يقوم الذكاء الاصطناعي الآن بفحص أجزاء العين وتحديد أي أعراض طبية محتملة بناءً على قاعدة بياناتنا الطبية.
              </p>
            </div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5 }}
                  className="h-full bg-blue-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Processing Image Data</p>
            </div>
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <History className="text-blue-600" />
                سجل الفحوصات السابقة
              </h3>
              <button 
                onClick={() => setStep('info')}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                العودة للفحص الجديد
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>لا يوجد سجل فحوصات حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() => viewHistoryItem(item)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                          <img src={item.image} alt="Scan" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black font-mono">
                              {item.fileNumber}
                            </span>
                            <p className="font-bold text-slate-900">{item.userInfo.name}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(item.timestamp).toLocaleDateString('ar-YE')}
                            </span>
                            <span>•</span>
                            <span>{item.userInfo.age} سنة</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="حذف من السجل"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <ExternalLink size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'result' && analysis && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Report Preview */}
            <div id="report-to-print" ref={reportRef} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl p-10 space-y-8 relative">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Eye size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">مستشفيات رؤية</h1>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">تقرير الفحص الذكي (AI)</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block">
                    <Barcode value={fileNumber} height={40} width={1.5} fontSize={10} />
                  </div>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">اسم المريض</p>
                  <p className="text-sm font-bold text-slate-900">{userInfo.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">رقم الهاتف</p>
                  <p className="text-sm font-bold text-slate-900" dir="ltr">{userInfo.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">العمر</p>
                  <p className="text-sm font-bold text-slate-900">{userInfo.age} سنة</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">رقم الملف</p>
                  <p className="text-sm font-bold text-blue-600">{fileNumber}</p>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                  <div className="rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                    <img src={image!} alt="Analyzed" className="w-full h-auto" />
                  </div>
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    analysis.urgency === 'مرتفع' ? 'bg-red-50 border-red-100 text-red-700' :
                    analysis.urgency === 'متوسط' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-green-50 border-green-100 text-green-700'
                  }`}>
                    <AlertCircle size={20} />
                    <div className="text-xs font-bold">مستوى الاستعجال: {analysis.urgency}</div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="text-blue-600" size={20} />
                      التشخيص الأولي
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                      {analysis.diagnosis}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">أجزاء العين المحددة</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.eyeParts.map((part: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{part}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">الأعراض المكتشفة</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.symptoms.map((sym: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">{sym}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">توصيات المساعد الذكي</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Detailed Report Section */}
              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 mb-4">التقرير الطبي المفصل</h4>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {analysis.detailedReport}
                </div>
              </div>

              {/* Report Footer */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between items-end text-[10px] text-slate-400">
                <div className="space-y-1">
                  <p>تاريخ الفحص: {new Date().toLocaleDateString('ar-YE')}</p>
                  <p>هذا التقرير تم توليده آلياً بواسطة نظام الذكاء الاصطناعي لمستشفيات رؤية.</p>
                  <p className="font-bold text-red-500">ملاحظة: هذا التقرير استرشادي فقط ولا يغني عن الفحص السريري.</p>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode size={40} className="opacity-20" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <Phone className="text-blue-600" />
                  حجز موعد في أحد فروعنا
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">اختر الفرع الأقرب إليك</label>
                    <div className="grid grid-cols-1 gap-2">
                      {BRANCHES.map(branch => (
                        <button 
                          key={branch.id}
                          onClick={() => setSelectedBranch(branch)}
                          className={`w-full p-4 rounded-2xl text-right text-sm font-bold border-2 transition-all ${
                            selectedBranch.id === branch.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {branch.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={sendToWhatsApp}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-3"
                  >
                    إرسال التقرير وحجز موعد عبر واتساب
                    <Share2 size={20} />
                  </button>
                  <a 
                    href={`mailto:support@roayae.org?subject=تقرير فحص ذكي - ${userInfo.name}&body=مرحباً، أود مشاركة تقرير الفحص الذكي الخاص بي.%0A%0Aالتشخيص: ${analysis.diagnosis}%0Aمستوى الاستعجال: ${analysis.urgency}%0Aرقم الملف: ${fileNumber}`}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    مشاركة التقرير عبر البريد الإلكتروني
                    <Mail size={20} />
                  </a>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6 flex flex-col justify-center">
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold">تحميل التقرير الطبي</h4>
                  <p className="text-slate-400 text-sm">يمكنك تحميل نسخة PDF من التقرير للرجوع إليها أو عرضها على الطبيب عند زيارة المستشفى.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                  >
                    {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    تحميل التقرير (PDF)
                  </button>
                  <button 
                    onClick={printReport}
                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
                  >
                    <FileText size={20} />
                    طباعة التقرير
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
                  <Shield size={12} />
                  بياناتك مشفرة وآمنة تماماً
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
