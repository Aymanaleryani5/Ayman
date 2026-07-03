const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");

const app = express();
const port = process.env.PORT || 8000;

const apiId = 35971272; 
const apiHash = "428aaf9f250bff93f61eee9d4aa343d1"; 
let savedSession = "1BAAOMTQ5LjE1NC4xNjcuOTEBuycEQcgmvwyhl1+7fFT8yM1fYyKNYgIilA9WpUJR2oDkoL0Uyl0iHgyLQpiRf0s4XRPsVxRCdfEliD7vDRGWGojKfoLOgIs5NTHq8ChuwtHmNFbEDIxHBQtMMpDSqWz6e+GCASk79rrRW2XfSqQ4pySvZ70EI2LU0xOcrf47sSRjFZKQPwsdU1FPMTAfQyp3zx6XYqmxg2FBb5av2huxEb7iEmlhtCf/Fb1MR67ScaNNBi2uBiNKf/79ZZdbrDdtzkjVHY9/djRgHxS9BKJqgwB5lQ8P5JWS4xrzkBeHv746BWeoMK0iVrfxhIFGTTW47JY6XGl3zR+IpHw8+oV0ClQ=";

const stringSession = new StringSession(savedSession);
const client = new TelegramClient(stringSession, apiId, apiHash, { 
    connectionRetries: 5,
    useWSS: true
});

let requestQueue = [];
let isProcessing = false;

async function startTelegram() {
    try {
        console.log("📱 جاري الاتصال بتليجرام...");
        await client.connect();
        console.log("✅ تم تشغيل اتصال التليجرام بنجاح!");
    } catch (error) {
        console.error("❌ فشل تسجيل الدخول:", error.message);
    }
}

// دالة معالجة الطابور فائقة السرعة
async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    const currentRequest = requestQueue[0];

    try {
        const botUsername = "TrueCallers0BoT";
        console.log(`⚡ معالجة سريعة: الرقم ${currentRequest.targetNumber}. المتبقي: ${requestQueue.length - 1}`);
        
        // 1. إرسال الرقم
        await client.sendMessage(botUsername, { message: currentRequest.targetNumber });
        
        // 2. ⚡ تقليل الانتظار لـ 2.5 ثانية فقط (الحد الأدنى لكي يلحق البوت بالرد)
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 3. جلب الرسائل
        const messages = await client.getMessages(botUsername, { limit: 3 });
        
        let combinedText = "";
        for (const msg of messages) {
            if (msg.message && !msg.message.includes(currentRequest.targetNumber)) {
                combinedText += "\n" + msg.message;
            }
        }
        
        // 4. الفلترة
        const nameRegex = /^\d+\s*[\-:\.]\s*(.+)$/gm;
        let namesList = [];
        let match;

        while ((match = nameRegex.exec(combinedText)) !== null) {
            let cleanName = match[1].trim();
            if (cleanName) namesList.push(cleanName);
        }

        if (namesList.length > 0) {
            currentRequest.res.json({ success: true, number: currentRequest.targetNumber, count: namesList.length, names: namesList });
        } else {
            currentRequest.res.json({ success: true, number: currentRequest.targetNumber, raw_result: combinedText.trim() });
        }

    } catch (err) {
        console.error(`❌ خطأ: ${err.message}`);
        currentRequest.res.status(500).json({ success: false, error: "خطأ في السيرفر" });
    } finally {
        requestQueue.shift();
        isProcessing = false;
        
        // ⚡ تقليل الراحة بين الطلبات لـ 500 مللي ثانية (نصف ثانية فقط) لتسريع الطابور للمستخدم التالي
        await new Promise(resolve => setTimeout(resolve, 500));
        
        processQueue();
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get("/", (req, res) => {
    res.json({ status: "online", queue_length: requestQueue.length });
});

app.get("/search", async (req, res) => {
    const targetNumber = req.query.num;
    if (!targetNumber) return res.status(400).json({ error: "يرجى تحديد الرقم" });

    requestQueue.push({ targetNumber, res });
    processQueue();
});

app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 سيرفر الطابور السريع يعمل على المنفذ: ${port}`);
    await startTelegram();
});

process.on('uncaughtException', (error) => { console.error(error); });
process.on('SIGINT', () => { process.exit(); });
