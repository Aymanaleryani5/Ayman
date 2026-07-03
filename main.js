const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const express = require("express");

const app = express();

// 🛠️ تعديل مهم جداً لـ Render لقراءة المنفذ ديناميكياً أو استخدام 8000 محلياً
const port = process.env.PORT || 8000;

const apiId = 35971272; 
const apiHash = "428aaf9f250bff93f61eee9d4aa343d1"; 

// ✅ نص الجلسة المحفوظ الخاص بك
let savedSession = "1BAAOMTQ5LjE1NC4xNjcuOTEBuycEQcgmvwyhl1+7fFT8yM1fYyKNYgIilA9WpUJR2oDkoL0Uyl0iHgyLQpiRf0s4XRPsVxRCdfEliD7vDRGWGojKfoLOgIs5NTHq8ChuwtHmNFbEDIxHBQtMMpDSqWz6e+GCASk79rrRW2XfSqQ4pySvZ70EI2LU0xOcrf47sSRjFZKQPwsdU1FPMTAfQyp3zx6XYqmxg2FBb5av2huxEb7iEmlhtCf/Fb1MR67ScaNNBi2uBiNKf/79ZZdbrDdtzkjVHY9/djRgHxS9BKJqgwB5lQ8P5JWS4xrzkBeHv746BWeoMK0iVrfxhIFGTTW47JY6XGl3zR+IpHw8+oV0ClQ=";

const stringSession = new StringSession(savedSession);
const client = new TelegramClient(stringSession, apiId, apiHash, { 
    connectionRetries: 5,
    useWSS: true
});

async function startTelegram() {
    try {
        console.log("📱 جاري الاتصال بتليجرام...");
        
        await client.start({
            phoneNumber: async () => {
                const phone = await input.text("📱 أدخل رقم هاتفك مع مفتاح الدولة (مثال: 9677XXXXXXXX): ");
                return phone;
            },
            password: async () => {
                const pass = await input.text("🔐 أدخل كلمة المرور (إذا وجدت): ");
                return pass;
            },
            phoneCode: async () => {
                const code = await input.text("📨 أدخل كود التليجرام المرسل إلى هاتفك: ");
                return code;
            },
            onError: (err) => {
                console.log("❌ خطأ:", err.message);
                return true;
            }
        });
        
        console.log("✅ تم تشغيل اتصال التليجرام بنجاح!");
        
    } catch (error) {
        console.error("❌ فشل تسجيل الدخول:", error.message);
    }
}

// إضافة CORS للوصول من أي مكان
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// صفحة التحقق
app.get("/", (req, res) => {
    res.json({ 
        status: "online", 
        message: "السيرفر الوسيط يعمل بنجاح ✅",
        time: new Date().toISOString()
    });
});

// صفحة البحث الرئيسية المحدثة لفلترة الأسماء فقط
app.get("/search", async (req, res) => {
    const targetNumber = req.query.num;
    console.log(`📱 استلام طلب بحث عن رقم: ${targetNumber}`);
    
    if (!targetNumber) {
        return res.status(400).json({ error: "يرجى تحديد الرقم" });
    }

    try {
        const botUsername = "TrueCallers0BoT";
        
        console.log(`🤖 جاري إرسال الرقم ${targetNumber} إلى البوت...`);
        await client.sendMessage(botUsername, { message: targetNumber });
        
        console.log(`⏳ انتظار رد البوت (5 ثواني)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const messages = await client.getMessages(botUsername, { limit: 3 });
        
        let combinedText = "";
        for (const msg of messages) {
            if (msg.message && !msg.message.includes(targetNumber)) {
                combinedText += "\n" + msg.message;
            }
        }
        
        // ذكاء الفلترة عبر تعبير Regular Expression
        const nameRegex = /^\d+\s*[\-:\.]\s*(.+)$/gm;
        let namesList = [];
        let match;

        while ((match = nameRegex.exec(combinedText)) !== null) {
            let cleanName = match[1].trim();
            if (cleanName) {
                namesList.push(cleanName);
            }
        }

        if (namesList.length > 0) {
            console.log(`✅ تم استخراج ${namesList.length} اسماً بنجاح.`);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.json({ 
                success: true, 
                number: targetNumber,
                count: namesList.length,
                names: namesList
            });
        } else {
            console.log(`⚠️ لم يتم العثور على قائمة أسماء، إرجاع النص كاملاً.`);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.json({ 
                success: true, 
                number: targetNumber,
                raw_result: combinedText.trim()
            });
        }

    } catch (err) {
        console.error(`❌ خطأ: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

// تشغيل السيرفر بالمنفذ المتغير
app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 سيرفر الوسيط يعمل بنجاح على المنفذ: ${port}`);
    await startTelegram();
});

// معالجة الأخطاء الاستثنائية لمنع انهيار السيرفر
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

process.on('SIGINT', () => {
    console.log('🛑 إيقاف السيرفر...');
    process.exit();
});
