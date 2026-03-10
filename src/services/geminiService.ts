import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

// Robust API key retrieval for various environments
const getApiKey = () => {
  const isPlaceholder = (key: string) => {
    return !key || 
           key.includes('MY_GEMINI') || 
           key.includes('YOUR_API_KEY') || 
           key.includes('process.env') || 
           key.length < 20;
  };

  // 1. Try VITE_GEMINI_API_KEY (Standard for Vite deployments like Vercel/Netlify)
  try {
    // @ts-ignore
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === 'string' && !isPlaceholder(viteKey)) {
      return viteKey;
    }
  } catch (e) {}

  // 2. Try GEMINI_API_KEY (Standard for Node.js or some CI/CD)
  try {
    // @ts-ignore
    const processKey = process.env.GEMINI_API_KEY;
    if (processKey && typeof processKey === 'string' && !isPlaceholder(processKey)) {
      return processKey;
    }
  } catch (e) {}

  // 3. Hardcoded fallback provided by the user
  const hardcodedKey = "AIzaSyAoBkCpf8Ytbcwblp6xXZ4Vz6kX6k4tFOM";
  if (hardcodedKey && !isPlaceholder(hardcodedKey)) {
    return hardcodedKey;
  }

  return "";
};

export const isApiKeySet = !!getApiKey() && !getApiKey().includes('MY_GEMINI') && getApiKey().length > 20;

export const OFFICIAL_APP_URL = "https://ai.studio/apps/a5f580ca-d9b1-4316-bec9-8f9b4d3b9ed7?fullscreenApplet=true";

// No official URL needed for production standalone

// Helper to get AI instance with current key
const getAI = () => {
  const key = getApiKey();
  return new GoogleGenAI({ apiKey: key });
};

const SYSTEM_INSTRUCTION = `أنت المساعد الذكي الرسمي لمجموعة مستشفيات رؤية لطب وجراحة العيون والشبكية. 
مهمتك هي الإجابة على استفسارات المرضى حول صحة العيون، جراحات الشبكية، الليزك، والمياه البيضاء، وتزويدهم بمعلومات الفروع والتواصل الصحيحة.

فروعنا ومعلومات التواصل:
1. المركز الرئيسي - رؤية سيئون: حضرموت، شارع الجزائر، مقابل مركز غسيل الكلى. هاتف: [05-408993](tel:05408993) / [05-441177](tel:05441177)، واتساب: [774441177](https://wa.me/967774441177). الموقع: [خرائط جوجل](https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+سيئون)
2. رؤية عدن: المنصورة، شارع السنافر، بجانب بريد القاهرة. هاتف: [02-388150](tel:02388150) / [02-388151](tel:02388151)، واتساب: [782255557](https://wa.me/967782255557). الموقع: [خرائط جوجل](https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+عدن)
3. رؤية المكلا: الديس، الإشارة، بجانب مؤسسة الشامي. هاتف: [05-310888](tel:05310888)، واتساب: [778844766](https://wa.me/967778844766) / [730009097](https://wa.me/967730009097). الموقع: [خرائط جوجل](https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+المكلا)
4. رؤية الشحر: حي المنصورة، بجوار مدارس التفوق. واتساب: [781765720](https://wa.me/967781765720) / [781765257](https://wa.me/967781765257). الموقع: [خرائط جوجل](https://www.google.com/maps?q=رؤية+لطب+وجراحة+العيون+والشبكية+الشحر)

مواعيد الدوام: جميع الأيام ما عدا الجمعة. الفترة الصباحية (8:30 ص - 1:30 ظ)، الفترة المسائية (4:30 م - 8:30 م). ملاحظة: لا توجد فترة مسائية يوم الخميس في فروع عدن والمكلا والشحر.

تعليمات هامة:
1. إذا ذكر المستخدم اسمه، رحب به باسمه بحرارة وبشكل شخصي في بداية الرد.
2. كن دائماً مهذباً، ودوداً، وقم بشكر المستخدم على ثقته بمستشفيات رؤية.
3. إذا سأل المستخدم عن تشخيص لحالة عينه أو طلب فحصاً أو ذكر أعراضاً بصرية، قدم له إجابة طبية عامة مفيدة أولاً بناءً على خبرتك، ثم وجهه لاستخدام ميزة "الفحص الذكي (AI Scan)" المتوفرة في البرنامج، حيث يمكنه رفع صورة لعينه والحصول على تقييم أولي وقياس للنظر.
4. استخدم وظيفة 'navigateToScan' فقط عندما تقترح على المستخدم إجراء الفحص الذكي بشكل صريح وبعد تقديم الإجابة الأولية.
5. يجب أن تكون إجاباتك طبية، دقيقة، ودودة، وباللغة العربية.
6. عند ذكر أرقام الهواتف أو الواتساب، استخدم صيغة الروابط المذكورة أعلاه دائماً.
7. دائماً ذكر المستخدم أن هذه المعلومات استرشادية ولا تغني عن زيارة الطبيب المختص في المستشفى.
8. تحدث عن خدمات مستشفى رؤية بمهنية وفخر، واحرص على استخدام كلمات مفتاحية طبية دقيقة (مثل: جراحة الشبكية، الليزك، المياه البيضاء، تصحيح النظر) لتعزيز الوعي الطبي.`;

const navigateToScanTool: FunctionDeclaration = {
  name: "navigateToScan",
  description: "توجيه المستخدم إلى صفحة الفحص الذكي (AI Scan) لرفع صورة العين وتحليلها.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const LOCAL_KNOWLEDGE: Record<string, string> = {
  "مواعيد": "مواعيد الدوام في مستشفيات رؤية هي من السبت إلى الخميس. الفترة الصباحية: 8:30 ص - 1:30 ظ، والفترة المسائية: 4:30 م - 8:30 م. (ملاحظة: لا توجد فترة مسائية يوم الخميس في فروع عدن والمكلا والشحر).",
  "فروع": "لدينا 4 فروع رئيسية: \n1. سيئون (المركز الرئيسي): 05-408993\n2. عدن: 02-388150\n3. المكلا: 05-310888\n4. الشحر: 781765720",
  "ليزك": "نقدم أحدث تقنيات الليزك وتصحيح النظر في مستشفيات رؤية بأيدي أمهر الأطباء. يمكنك حجز موعد للفحص الأولي للتأكد من ملاءمة العملية لعينيك.",
  "مياه بيضاء": "تجري مستشفيات رؤية عمليات إزالة المياه البيضاء (الفاكو) وزراعة أحدث أنواع العدسات بتقنيات متطورة ونسب نجاح عالية جداً.",
  "شبكية": "نحن متخصصون في جراحة الشبكية والجسم الزجاجي، ونمتلك أحدث الأجهزة لتشخيص وعلاج اعتلال الشبكية السكري وانفصال الشبكية.",
  "حجز": "يمكنك حجز موعد عبر الاتصال المباشر بأرقام الفروع أو عبر الواتساب الموضح في قسم 'فروعنا'. كما يمكنك استخدام ميزة 'الفحص الذكي' في هذا البرنامج.",
  "فحص": "ميزة الفحص الذكي (AI Scan) تتيح لك رفع صورة لعينك والحصول على تقييم أولي استرشادي. يمكنك الوصول إليها من القائمة الجانبية.",
  "من أنتم": "نحن مجموعة مستشفيات رؤية لطب وجراحة العيون والشبكية، نسعى لتقديم أرقى الخدمات الطبية في مجال العيون في اليمن باستخدام أحدث التقنيات العالمية.",
  "أسعار": "تختلف الأسعار حسب نوع الخدمة والفرع. يرجى التواصل مع أقرب فرع لك للحصول على قائمة الأسعار الحالية أو حجز موعد للمعاينة.",
  "تواصل": "يمكنك التواصل معنا عبر أرقام الهواتف المذكورة في قسم الفروع، أو عبر الواتساب، أو من خلال صفحاتنا على وسائل التواصل الاجتماعي.",
  "أسئلة": "الأسئلة الشائعة تشمل: مواعيد الدوام، الفروع المتوفرة، خدمات الليزك والمياه البيضاء، وكيفية حجز المواعيد. يمكنك سؤال المساعد عن أي من هذه المواضيع.",
  "شكراً": "عفواً! نحن في مستشفيات رؤية دائماً في خدمتكم. هل لديك أي استفسار آخر؟",
  "مرحبا": "أهلاً بك! أنا مساعد مستشفيات رؤية الذكي. كيف يمكنني مساعدتك اليوم؟",
  "سلام": "وعليكم السلام ورحمة الله وبركاته! كيف يمكنني مساعدتك اليوم في مستشفيات رؤية؟",
  "صباح": "صباح الخير! نحن في مستشفيات رؤية نتمنى لك يوماً سعيداً. كيف يمكننا مساعدتك؟",
  "مساء": "مساء الخير! كيف يمكن لمساعد مستشفيات رؤية الذكي خدمتك اليوم؟",
  "من انت": "أنا المساعد الطبي الذكي لمجموعة مستشفيات رؤية، متخصص في تقديم المعلومات الطبية الأولية وتوجيه المرضى.",
  "عملية": "تجري مستشفيات رؤية مجموعة واسعة من العمليات الجراحية المتقدمة للعيون والشبكية باستخدام أحدث التقنيات. يرجى حجز موعد للمعاينة وتحديد نوع العملية المناسبة.",
  "نظارة": "نقدم خدمات فحص النظر وتجهيز النظارات الطبية والعدسات اللاصقة في فروعنا. يمكنك استخدام ميزة 'الفحص الذكي' للحصول على قياس تقريبي أولي."
};

function getLocalResponse(prompt: string): string | null {
  const p = prompt.toLowerCase();
  for (const key in LOCAL_KNOWLEDGE) {
    if (p.includes(key)) return LOCAL_KNOWLEDGE[key];
  }
  return null;
}

export async function generateMedicalResponse(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [navigateToScanTool] }]
      }
    });

    // Check for function calls
    if (response.functionCalls) {
      const call = response.functionCalls.find(f => f.name === "navigateToScan");
      if (call) {
        return {
          text: response.text || "حسناً، سأقوم بتوجيهك الآن إلى صفحة الفحص الذكي لرفع صورة عينك وتحليلها.",
          action: "NAVIGATE_TO_SCAN"
        };
      }
    }

    return {
      text: response.text || "عذراً، لم أتمكن من الحصول على إجابة حالياً. يرجى المحاولة مرة أخرى.",
      action: null
    };
  } catch (error: any) {
    console.error("Error generating medical response:", error);
    
    // Try local fallback first on error
    const localResponse = getLocalResponse(prompt);
    if (localResponse) {
      return {
        text: localResponse + "\n\n(ملاحظة: هذا الرد من قاعدة البيانات المحلية نظراً لتعذر الاتصال بالذكاء الاصطناعي حالياً).",
        action: null
      };
    }

    const message = error?.message || "";
    if (message.includes("API_KEY_INVALID") || message.includes("403") || !getApiKey()) {
      return {
        text: `عذراً، يبدو أن هناك مشكلة في تفعيل خدمات الذكاء الاصطناعي. يرجى التأكد من إعدادات مفتاح البرمجة (API Key) في بيئة الاستضافة الخاصة بك.`,
        action: null
      };
    }
    return {
      text: "عذراً، حدث خطأ أثناء الاتصال بخدمات الذكاء الاصطناعي. يرجى التأكد من جودة اتصالك بالإنترنت أو المحاولة لاحقاً.",
      action: null
    };
  }
}

export async function analyzeEyeImage(imageData: string, userInfo: { name: string, age: string, chronicDiseases: string }) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData.includes(',') ? imageData.split(',')[1] : imageData,
            },
          },
          {
            text: `بصفتك خبيراً في طب وجراحة العيون في مستشفيات رؤية، قم بتحليل هذه الصورة للعين.
          المريض: ${userInfo.name}، العمر: ${userInfo.age}، الأمراض المزمنة: ${userInfo.chronicDiseases || 'لا يوجد'}.
          
          المطلوب:
          1. تحديد أجزاء العين الظاهرة في الصورة (مثل القرنية، القزحية، الملتحمة، إلخ).
          2. تحديد أي إصابات أو أعراض ظاهرة (مثل احمرار، مياه بيضاء، التهاب، إلخ).
          3. تقديم تقرير طبي مفصل باللغة العربية يتضمن التشخيص الأولي (الاسترشادي).
          4. تقديم نصائح طبية أولية.
          5. التأكيد على ضرورة زيارة أقرب فرع لمستشفيات رؤية للفحص السريري.
          
          يجب أن يكون الرد بتنسيق JSON يحتوي على الحقول المطلوبة.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            eyeParts: { type: Type.ARRAY, items: { type: Type.STRING } },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgency: { type: Type.STRING },
            detailedReport: { type: Type.STRING }
          },
          required: ["diagnosis", "eyeParts", "symptoms", "recommendations", "urgency", "detailedReport"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error analyzing eye image:", error);
    const message = error?.message || "";
    if (message.includes("API_KEY_INVALID") || message.includes("403") || !getApiKey()) {
      throw new Error(`عذراً، مفتاح البرمجة (API Key) غير صالح أو غير مفعل. يرجى التأكد من إعدادات المفتاح.`);
    }
    throw new Error("عذراً، حدث خطأ أثناء تحليل الصورة. يرجى التأكد من جودة الاتصال أو المحاولة لاحقاً.");
  }
}

export async function startChat() {
  const ai = getAI();
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
}
