const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");

const app = express();
// تعيين منفذ ديناميكي متوافق مع Render لمنع أخطاء التشغيل
const port = process.env.PORT || 8000;

const apiId = 35971272; 
const apiHash = "428aaf9f250bff93f61eee9d4aa343d1"; 

// نص الجلسة المحفوظ الخاص بحسابك
let savedSession = "1BAAOMTQ5LjE1NC4xNjcuOTEBuycEQcgmvwyhl1+7fFT8yM1fYyKNYgIilA9WpUJR2oDkoL0Uyl0iHgyLQpiRf0s4XRPsVxRCdfEliD7vDRGWGojKfoLOgIs5NTHq8ChuwtHmNFbEDIxHBQtMMpDSqWz6e+GCASk79rrRW2XfSqQ4pySvZ70EI2LU0xOcrf47sSRjFZKQPwsdU1FPMTAfQyp3zx6XYqmxg2FBb5av2huxEb7iEmlhtCf/Fb1MR67ScaNNBi2uBiNKf/79ZZdbrDdtzkjVHY9/djRgHxS9BKJqgwB5lQ8P5JWS4xrzkBeHv746BWeoMK0iVrfxhIFGTTW47JY6XGl3zR+IpHw8+oV0ClQ=";

const stringSession = new StringSession(savedSession);
const client = new TelegramClient(stringSession, apiId, apiHash, { 
    connectionRetries: 5,
    useWSS: true
});

// متغيرات نظام الطابور المانع للضغط والحظر
let requestQueue = [];
let isProcessing = false;

async function startTelegram() {
    try {
        console.log("📱 جاري الاتصال بتليجرام السحابي...");
        await client.connect();
        console.log("✅ تم تشغيل اتصال التليجرام بنجاح وبدون طلب كود تحقق!");
    } catch (error) {
        console.error("❌ فشل تسجيل الدخول والاتصال:", error.message);
    }
}

// دالة معالجة الطابور فائقة السرعة بالتتابع
async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    const currentRequest = requestQueue[0];

    try {
        const botUsername = "TrueCallers0BoT";
        console.log(`⚡ معالجة رقم من الطابور: ${currentRequest.targetNumber}. المتبقي في الانتظار: ${requestQueue.length - 1}`);
        
        // 1. إرسال الرقم المراد كشفه للبوت
        await client.sendMessage(botUsername, { message: currentRequest.targetNumber });
        
        // 2. الانتظار الآمن 2.5 ثانية ليلحق البوت بإرسال ردوده كاملة
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 3. جلب آخر 3 رسائل من البوت لقراءة النتائج كاملة
        const messages = await client.getMessages(botUsername, { limit: 3 });
        
        let combinedText = "";
        for (const msg of messages) {
            if (msg.message && !msg.message.includes(currentRequest.targetNumber)) {
                combinedText += "\n" + msg.message;
            }
        }
        
        // 4. فلترة وتصفية الأسماء فقط باستخدام تعبير نمطي (RegEx) ذكي
        const nameRegex = /^\d+\s*[\-:\.]\s*(.+)$/gm;
        let namesList = [];
        let match;

        while ((match = nameRegex.exec(combinedText)) !== null) {
            let cleanName = match[1].trim();
            if (cleanName) namesList.push(cleanName);
        }

        // 5. إعادة الاستجابة للمستخدم المناسب في الطابور بدعم كامل للغة العربية
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (namesList.length > 0) {
            console.log(`✅ تم تصفية ${namesList.length} اسماً للرقم ${currentRequest.targetNumber}`);
            currentRequest.res.json({ 
                success: true, 
                number: currentRequest.targetNumber, 
                count: namesList.length, 
                names: namesList 
            });
        } else {
            console.log(`⚠️ لم يتم استخراج أسماء، إرجاع النص كاملاً.`);
            currentRequest.res.json({ 
                success: true, 
                number: currentRequest.targetNumber, 
                raw_result: combinedText.trim() 
            });
        }

    } catch (err) {
        console.error(`❌ خطأ أثناء تدوير الطابور للرقم ${currentRequest.targetNumber}: ${err.message}`);
        currentRequest.res.status(500).json({ success: false, error: "حدث خطأ غير متوقع في السيرفر" });
    } finally {
        // إزالة الطلب الحالي بعد المعالجة، وفتح القفل للطلب التالي
        requestQueue.shift();
        isProcessing = false;
        
        // فترة راحة أمان قصيرة جداً (نصف ثانية) لحماية حسابك
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // استدعاء الدالة مجدداً لمعالجة الطلبات التالية إن وُجدت
        processQueue();
    }
}

// إعدادات الـ CORS لتسهيل الاتصالات من الأجهزة الخارجية
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// الصفحة الرئيسية لمعاينة حالة السيرفر وطول الطابور حالياً
app.get("/", (req, res) => {
    res.json({ status: "online", queue_length: requestQueue.length });
});

// صفحة استقبال طلبات الكشف وتوجيهها للطابور
app.get("/search", async (req, res) => {
    const targetNumber = req.query.num;
    if (!targetNumber) return res.status(400).json({ error: "يرجى تحديد الرقم المطلوب" });

    // وضع الطلب الحالي في طابور الانتظار
    requestQueue.push({ targetNumber, res });
    processQueue();
});

// تشغيل خادم الويب
app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 السيرفر يعمل بنجاح على المنفذ: ${port}`);
    await startTelegram();
});

// معالجة الأخطاء المفاجئة لمنع السيرفر من الانهيار (Crash)
process.on('uncaughtException', (error) => { console.error('❌ خطأ غير متوقع:', error); });
process.on('SIGINT', () => { process.exit(); });
