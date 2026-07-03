const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const express = require("express");

const app = express();
const port = 8000;

const apiId = 35971272; 
const apiHash = "428aaf9f250bff93f61eee9d4aa343d1"; 

// ✅ تم إضافة نص الجلسة المحفوظ
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
        console.log("💡 نص الجلسة الحالي:");
        console.log("================================================");
        console.log(client.session.save());
        console.log("================================================");
        
    } catch (error) {
        console.error("❌ فشل تسجيل الدخول:", error.message);
        console.log("🔄 حاول إعادة تشغيل البرنامج");
    }
}

// إضافة CORS
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

// صفحة البحث الرئيسية
app.get("/search", async (req, res) => {
    const targetNumber = req.query.num;
    console.log(`📱 استلام طلب بحث عن رقم: ${targetNumber}`);
    
    if (!targetNumber) {
        return res.status(400).json({ 
            error: "يرجى تحديد الرقم",
            usage: "استخدم: /search?num=رقم_الهاتف"
        });
    }

    try {
        const botUsername = "TrueCallers0BoT";
        
        console.log(`🤖 جاري إرسال الرقم ${targetNumber} إلى البوت...`);
        await client.sendMessage(botUsername, { message: targetNumber });
        
        console.log(`⏳ انتظار رد البوت (5 ثواني)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const messages = await client.getMessages(botUsername, { limit: 3 });
        let botResponse = "لم يتم العثور على رد من البوت";
        
        for (const msg of messages) {
            if (msg.message && !msg.message.includes(targetNumber) && msg.message.length > 10) {
                botResponse = msg.message;
                break;
            }
        }
        
        console.log(`✅ تم العثور على الرد بنجاح`);
        res.json({ 
            success: true, 
            result: botResponse,
            number: targetNumber
        });

    } catch (err) {
        console.error(`❌ خطأ: ${err.message}`);
        res.status(500).json({ 
            success: false, 
            error: err.message,
            tip: "تأكد من أن بوت Truecallers0BoT موجود وتعمل حسابك بشكل صحيح"
        });
    }
});

// تشغيل السيرفر
app.listen(port, '0.0.0.0', async () => {
    console.log(`🚀 سيرفر الوسيط يعمل على: http://localhost:${port}`);
    console.log(`🌐 متاح للاتصالات من أي جهاز في الشبكة المحلية`);
    await startTelegram();
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

process.on('SIGINT', () => {
    console.log('🛑 إيقاف السيرفر...');
    process.exit();
});

// const { TelegramClient } = require("telegram");
// const { StringSession } = require("telegram/sessions");
// const input = require("input");
// const express = require("express");

// const app = express();
// const port = 8000;

// const apiId = 35971272; 
// const apiHash = "428aaf9f250bff93f61eee9d4aa343d1"; 

// // ✅ تم إضافة نص الجلسة المحفوظ
// let savedSession = "1BAAOMTQ5LjE1NC4xNjcuOTEBuycEQcgmvwyhl1+7fFT8yM1fYyKNYgIilA9WpUJR2oDkoL0Uyl0iHgyLQpiRf0s4XRPsVxRCdfEliD7vDRGWGojKfoLOgIs5NTHq8ChuwtHmNFbEDIxHBQtMMpDSqWz6e+GCASk79rrRW2XfSqQ4pySvZ70EI2LU0xOcrf47sSRjFZKQPwsdU1FPMTAfQyp3zx6XYqmxg2FBb5av2huxEb7iEmlhtCf/Fb1MR67ScaNNBi2uBiNKf/79ZZdbrDdtzkjVHY9/djRgHxS9BKJqgwB5lQ8P5JWS4xrzkBeHv746BWeoMK0iVrfxhIFGTTW47JY6XGl3zR+IpHw8+oV0ClQ=";

// const stringSession = new StringSession(savedSession);
// const client = new TelegramClient(stringSession, apiId, apiHash, { 
//     connectionRetries: 5,
//     useWSS: true
// });

// // ✅ دالة للتأكد من الاتصال
// async function ensureConnection() {
//     try {
//         if (!client.connected) {
//             console.log("🔄 جاري إعادة الاتصال بتليجرام...");
//             await client.connect();
//             console.log("✅ تم إعادة الاتصال بنجاح");
//         }
//         return true;
//     } catch (error) {
//         console.error("❌ فشل إعادة الاتصال:", error.message);
//         return false;
//     }
// }

// async function startTelegram() {
//     try {
//         console.log("📱 جاري الاتصال بتليجرام...");
        
//         await client.start({
//             phoneNumber: async () => {
//                 const phone = await input.text("📱 أدخل رقم هاتفك مع مفتاح الدولة (مثال: 9677XXXXXXXX): ");
//                 return phone;
//             },
//             password: async () => {
//                 const pass = await input.text("🔐 أدخل كلمة المرور (إذا وجدت): ");
//                 return pass;
//             },
//             phoneCode: async () => {
//                 const code = await input.text("📨 أدخل كود التليجرام المرسل إلى هاتفك: ");
//                 return code;
//             },
//             onError: (err) => {
//                 console.log("❌ خطأ:", err.message);
//                 return true;
//             }
//         });
        
//         console.log("✅ تم تشغيل اتصال التليجرام بنجاح!");
//         console.log("💡 نص الجلسة الحالي:");
//         console.log("================================================");
//         console.log(client.session.save());
//         console.log("================================================");
        
//     } catch (error) {
//         console.error("❌ فشل تسجيل الدخول:", error.message);
//         console.log("🔄 حاول إعادة تشغيل البرنامج");
//     }
// }

// // إضافة CORS
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });

// // صفحة التحقق
// app.get("/", (req, res) => {
//     res.json({ 
//         status: "online", 
//         message: "السيرفر الوسيط يعمل بنجاح ✅",
//         time: new Date().toISOString()
//     });
// });

// // صفحة البحث الرئيسية
// app.get("/search", async (req, res) => {
//     let targetNumber = req.query.num;
//     console.log(`📱 استلام طلب بحث عن رقم: ${targetNumber}`);
    
//     if (!targetNumber) {
//         return res.status(400).json({ 
//             error: "يرجى تحديد الرقم",
//             usage: "استخدم: /search?num=رقم_الهاتف"
//         });
//     }

//     // ✅ إضافة + قبل الرقم إذا لم تكن موجودة
//     if (!targetNumber.startsWith('+')) {
//         targetNumber = '+' + targetNumber;
//     }

//     try {
//         // ✅ التأكد من الاتصال قبل الإرسال
//         await ensureConnection();
        
//         // ✅ تم تغيير اسم البوت إلى TrueCalleRobot
//         const botUsername = "TrueCalleRobot";
        
//         console.log(`🤖 جاري إرسال الرقم ${targetNumber} إلى البوت...`);
//         await client.sendMessage(botUsername, { message: targetNumber });
        
//         console.log(`⏳ انتظار رد البوت (5 ثواني)...`);
//         await new Promise(resolve => setTimeout(resolve, 5000));
        
//         const messages = await client.getMessages(botUsername, { limit: 3 });
//         let botResponse = "لم يتم العثور على رد من البوت";
        
//         for (const msg of messages) {
//             if (msg.message && !msg.message.includes(targetNumber.replace('+', '')) && msg.message.length > 10) {
//                 botResponse = msg.message;
//                 break;
//             }
//         }
        
//         console.log(`✅ تم العثور على الرد بنجاح`);
//         res.json({ 
//             success: true, 
//             result: botResponse,
//             number: targetNumber
//         });

//     } catch (err) {
//         console.error(`❌ خطأ: ${err.message}`);
        
//         // ✅ محاولة إعادة الاتصال إذا كان الخطأ متعلق بالاتصال
//         if (err.message.includes("Not connected") || err.message.includes("connection")) {
//             console.log("🔄 محاولة إعادة الاتصال...");
//             await ensureConnection();
//         }
        
//         res.status(500).json({ 
//             success: false, 
//             error: err.message,
//             tip: "تأكد من أن بوت TrueCalleRobot موجود وتعمل حسابك بشكل صحيح"
//         });
//     }
// });

// // تشغيل السيرفر
// app.listen(port, '0.0.0.0', async () => {
//     console.log(`🚀 سيرفر الوسيط يعمل على: http://localhost:${port}`);
//     console.log(`🌐 متاح للاتصالات من أي جهاز في الشبكة المحلية`);
//     await startTelegram();
// });

// // معالجة الأخطاء
// process.on('uncaughtException', (error) => {
//     console.error('❌ خطأ غير متوقع:', error);
// });

// process.on('SIGINT', () => {
//     console.log('🛑 إيقاف السيرفر...');
//     process.exit();
// });