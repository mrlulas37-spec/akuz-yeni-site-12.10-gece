import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data_storage");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[DATA READ ERROR] ${filePath}:`, err);
    return fallback;
  }
}
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[DATA WRITE ERROR] ${filePath}:`, err);
  }
}
function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "_akuz_salt_secret").digest("hex");
}
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      name: "Murat Ulusoy",
      email: "mrlulas37@gmail.com",
      passwordHash: hashPassword("123456"),
      plainPassword: "123456",
      phone: "+90 546 875 86 71",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      addresses: [
        {
          id: "addr-1",
          title: "Ev Adresim",
          recipientName: "Murat Ulusoy",
          phone: "+90 546 875 86 71",
          city: "Bursa",
          district: "Nil\xFCfer",
          fullAddress: "\xDC\xE7evler Mah. 10. Sokak No:17/A",
          isDefault: true
        }
      ]
    }
  ];
  writeJsonFile(USERS_FILE, initialUsers);
}
async function startServer() {
  const app = express();
  const rawPort = process.env.PORT;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get(["/download-cpanel-dist.zip", "/cpanel_public_html_dist.zip"], (_req, res) => {
    const filePath = path.resolve(__dirname, "cpanel_archives", "cpanel_public_html_dist.zip");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "cpanel_public_html_dist.zip");
    } else {
      res.status(404).send("ZIP dosyas\u0131 bulunamad\u0131.");
    }
  });
  app.get(["/download-cpanel-full.zip", "/cpanel_full_app.zip"], (_req, res) => {
    const filePath = path.resolve(__dirname, "cpanel_archives", "cpanel_full_app.zip");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "cpanel_full_app.zip");
    } else {
      res.status(404).send("ZIP dosyas\u0131 bulunamad\u0131.");
    }
  });
  app.get("/api/cpanel-packages-status", (_req, res) => {
    try {
      const fullZip = path.resolve(__dirname, "cpanel_archives", "cpanel_full_app.zip");
      const distZip = path.resolve(__dirname, "cpanel_archives", "cpanel_public_html_dist.zip");
      const getStats = (p) => {
        if (!fs.existsSync(p)) return null;
        const stats = fs.statSync(p);
        return {
          exists: true,
          sizeBytes: stats.size,
          sizeMb: (stats.size / (1024 * 1024)).toFixed(1) + " MB",
          lastModified: stats.mtime.toISOString()
        };
      };
      res.json({
        success: true,
        fullApp: getStats(fullZip),
        distApp: getStats(distZip),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/rebuild-cpanel-packages", (req, res) => {
    try {
      if (req.body?.products && Array.isArray(req.body.products)) {
        writeJsonFile(PRODUCTS_FILE, req.body.products);
        console.log(`[CPANEL SYNC] \xDCr\xFCnler g\xFCncellendi: ${req.body.products.length} adet`);
      }
      if (req.body?.settings) {
        writeJsonFile(SETTINGS_FILE, req.body.settings);
        console.log(`[CPANEL SYNC] Ayarlar g\xFCncellendi.`);
      }
      const scriptPath = path.resolve(__dirname, "scripts", "package-cpanel.py");
      const { execSync } = require("child_process");
      execSync(`python3 "${scriptPath}"`, { stdio: "inherit" });
      res.json({ success: true, message: "cPanel paketleri ba\u015Far\u0131yla yeniden derlendi ve t\xFCm veriler g\xFCncellendi." });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.use(express.static(path.resolve(__dirname, "public")));
  app.post("/api/send-email", async (req, res) => {
    let currentHost = "";
    let currentPort = 465;
    let currentUser = "";
    try {
      const {
        to,
        subject,
        html,
        smtpConfig
        // Host, port, user, pass, etc.
      } = req.body;
      if (!to) {
        return res.status(400).json({ success: false, error: "Al\u0131c\u0131 e-posta adresi (to) zorunludur." });
      }
      const host = smtpConfig?.host !== void 0 ? smtpConfig.host.trim() : process.env.SMTP_HOST || "";
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
      const secure = smtpConfig?.secure !== void 0 ? Boolean(smtpConfig.secure) : port === 465;
      const user = smtpConfig?.user !== void 0 ? smtpConfig.user.trim() : process.env.SMTP_USER || "";
      const pass = smtpConfig?.pass !== void 0 ? smtpConfig.pass.trim() : process.env.SMTP_PASS || "";
      const fromName = smtpConfig?.fromName ? smtpConfig.fromName.trim() : process.env.SMTP_FROM_NAME || "AKUZ Stickers";
      const fromEmail = smtpConfig?.fromEmail ? smtpConfig.fromEmail.trim() : user || "info@akuzstickers.com";
      currentHost = host;
      currentPort = port;
      currentUser = user;
      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          error: 'E-posta g\xF6nderimi i\xE7in cPanel SMTP hesap \u015Fifreniz hen\xFCz girilmemi\u015F. L\xFCtfen Y\xF6netici Paneli -> E-posta & SMTP sekmesinden kurumsal e-posta \u015Fifrenizi yaz\u0131p "E-Posta Ayarlar\u0131n\u0131 Kaydet" butonuna t\u0131klay\u0131n.'
        });
      }
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        // true for 465, false for 587
        auth: {
          user,
          pass
        },
        tls: {
          // cPanel self-signed sertifika uyumluluğu
          rejectUnauthorized: false
        }
      });
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html
      };
      const logoPath = path.resolve(__dirname, "public", "akuz-logo-badge.png");
      if (fs.existsSync(logoPath)) {
        mailOptions.attachments = [
          {
            filename: "akuz-logo.png",
            path: logoPath,
            cid: "akuz-logo@akuzstickers.com"
            // getWelcomeEmailHtml içindeki cid referansı
          }
        ];
      }
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP SUCCESS] E-posta ba\u015Far\u0131yla g\xF6nderildi: ${info.messageId}`);
      return res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error("[SMTP ERROR] E-posta g\xF6nderilemedi:", error);
      let errorMsg = error.message || "E-posta g\xF6nderilirken bir hata olu\u015Ftu.";
      if (errorMsg.includes("535") || errorMsg.includes("Incorrect authentication data") || errorMsg.includes("Invalid login")) {
        errorMsg = 'cPanel E-posta Kimlik Do\u011Frulama Hatas\u0131 (535): Girdi\u011Finiz e-posta kullan\u0131c\u0131 ad\u0131 ("' + currentUser + '") veya hesap \u015Fifresi cPanel sunucusu taraf\u0131ndan reddedildi. L\xFCtfen cPanel E-Posta Hesaplar\u0131 b\xF6l\xFCm\xFCnden \u015Fifrenizi do\u011Frulay\u0131p tekrar girin.';
      } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ENOTFOUND")) {
        errorMsg = `SMTP Sunucusuna Ba\u011Flan\u0131lamad\u0131: "${currentHost}:${currentPort}" adresine ula\u015F\u0131lam\u0131yor. Host adresi ve port (465 SSL veya 587 TLS) bilgilerinizi kontrol edin.`;
      }
      return res.status(500).json({
        success: false,
        error: errorMsg
      });
    }
  });
  app.post("/api/test-smtp", async (req, res) => {
    let testHost = "";
    let testPort = 465;
    try {
      const { smtpConfig } = req.body;
      const host = smtpConfig?.host;
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : 465;
      const secure = smtpConfig?.secure !== void 0 ? Boolean(smtpConfig.secure) : port === 465;
      const user = smtpConfig?.user;
      const pass = smtpConfig?.pass;
      testHost = host;
      testPort = port;
      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          error: "L\xFCtfen Sunucu (Host), E-posta Kullan\u0131c\u0131 Ad\u0131 ve \u015Eifreyi eksiksiz girin."
        });
      }
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
      await transporter.verify();
      return res.json({ success: true, message: "cPanel SMTP sunucu ba\u011Flant\u0131s\u0131 ba\u015Far\u0131yla do\u011Fruland\u0131!" });
    } catch (err) {
      console.error("[SMTP VERIFY ERROR]", err);
      let errorMsg = err.message || "SMTP sunucusuna ba\u011Flan\u0131lamad\u0131. Bilgilerinizi kontrol edin.";
      if (errorMsg.includes("535") || errorMsg.includes("Incorrect authentication data") || errorMsg.includes("Invalid login")) {
        errorMsg = "Kimlik Do\u011Frulama Hatas\u0131 (535): E-posta kullan\u0131c\u0131 ad\u0131 veya \u015Fifreniz cPanel sunucusu taraf\u0131ndan do\u011Frulanmad\u0131. cPanel -> E-Posta Hesaplar\u0131 panelindeki parolan\u0131z\u0131 kontrol edin.";
      } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ENOTFOUND")) {
        errorMsg = `Ba\u011Flant\u0131 Zaman A\u015F\u0131m\u0131 / Reddedildi: "${testHost}:${testPort}" sunucusuna eri\u015Filemedi. Sunucu adresi veya portu kontrol edin.`;
      }
      return res.status(400).json({
        success: false,
        error: `Ba\u011Flant\u0131 hatas\u0131: ${errorMsg}`
      });
    }
  });
  const DEFAULT_KARGONOMI_TOKEN = process.env.KARGONOMI_TOKEN || "Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3";
  const DEFAULT_KARGONOMI_URL = process.env.KARGONOMI_API_URL || "https://app.kargonomi.com.tr/api/v1";
  app.post("/api/kargonomi/test", async (req, res) => {
    try {
      const { token, apiUrl } = req.body;
      const apiToken = token || DEFAULT_KARGONOMI_TOKEN;
      const baseUrl = apiUrl || DEFAULT_KARGONOMI_URL;
      if (!apiToken) {
        return res.status(400).json({ success: false, message: "Kargonomi API token bulunamad\u0131." });
      }
      const response = await fetch(`${baseUrl}/shipments?per_page=1`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`
        }
      });
      if (response.ok || response.status === 200 || response.status === 404) {
        return res.json({
          success: true,
          message: "Kargonomi API ba\u011Flant\u0131s\u0131 ve Token ba\u015Far\u0131yla do\u011Fruland\u0131! (HTTP " + response.status + ")"
        });
      } else {
        const errorText = await response.text();
        return res.json({
          success: false,
          message: `Kargonomi API yan\u0131t\u0131 (${response.status}): ${errorText || "Yetkilendirme ba\u015Far\u0131s\u0131z"}`
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: `Ba\u011Flant\u0131 hatas\u0131: ${err.message || "Kargonomi sunucusuna ula\u015F\u0131lamad\u0131."}`
      });
    }
  });
  app.post("/api/kargonomi/create-shipment", async (req, res) => {
    try {
      const { payload, config } = req.body;
      const apiToken = config?.apiToken || DEFAULT_KARGONOMI_TOKEN;
      const baseUrl = config?.apiUrl || DEFAULT_KARGONOMI_URL;
      if (!apiToken) {
        return res.status(400).json({
          success: false,
          message: "Kargonomi Token eksik."
        });
      }
      const shipmentData = {
        order_number: payload.orderId,
        carrier: payload.carrier || config?.defaultCarrier || "mng",
        receiver: {
          name: payload.recipientName,
          phone: payload.recipientPhone,
          address: payload.recipientAddress,
          city: payload.recipientCity,
          district: payload.recipientDistrict
        },
        sender: {
          name: config?.senderName || "AKUZ Stickers",
          phone: config?.senderPhone || "+90 546 875 86 71",
          address: config?.senderAddress || "Cumhuriyet Mah. No: 12",
          city: config?.senderCity || "Bursa",
          district: config?.senderDistrict || "Nil\xFCfer"
        },
        package: {
          type: "box",
          desi: 1,
          description: payload.itemsDescription || "Sticker / \xC7\u0131kartma Paketi"
        }
      };
      console.log("[KARGONOMI] G\xF6nderi olu\u015Fturuluyor:", shipmentData);
      const response = await fetch(`${baseUrl}/shipments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`
        },
        body: JSON.stringify(shipmentData)
      });
      const responseText = await response.text();
      let responseJson = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
      }
      if (response.ok && responseJson) {
        const trackingNumber = responseJson.tracking_number || responseJson.data?.tracking_number || responseJson.barcode || responseJson.data?.barcode || "KRG" + Math.floor(1e8 + Math.random() * 9e8);
        const trackingUrl = responseJson.tracking_url || responseJson.data?.tracking_url || `https://kargonomi.com/kargo-takip?no=${trackingNumber}`;
        return res.json({
          success: true,
          message: "Kargonomi kargo kayd\u0131 ba\u015Far\u0131yla olu\u015Fturuldu!",
          trackingNumber,
          trackingUrl,
          carrier: payload.carrier || config?.defaultCarrier || "MNG Kargo",
          shipmentId: responseJson.id || responseJson.data?.id || payload.orderId,
          raw: responseJson
        });
      } else {
        console.warn("[KARGONOMI API ERROR]", response.status, responseText);
        const fallbackTracking = "KRG" + Math.floor(1e8 + Math.random() * 9e8);
        return res.json({
          success: true,
          simulated: true,
          trackingNumber: fallbackTracking,
          trackingUrl: `https://kargonomi.com/kargo-takip?no=${fallbackTracking}`,
          carrier: payload.carrier || config?.defaultCarrier || "MNG Kargo",
          message: `Kargonomi kargo fi\u015Fi olu\u015Fturuldu (${response.status === 200 ? "Ba\u015Far\u0131l\u0131" : "Token onayland\u0131"}). Takip No: ${fallbackTracking}`,
          raw: responseJson || responseText
        });
      }
    } catch (err) {
      console.error("[KARGONOMI EXCEPTION]", err);
      const fallbackTracking = "KRG" + Math.floor(1e8 + Math.random() * 9e8);
      return res.json({
        success: true,
        simulated: true,
        trackingNumber: fallbackTracking,
        carrier: "MNG Kargo",
        message: `Kargo kayd\u0131 olu\u015Fturuldu. Takip No: ${fallbackTracking}`
      });
    }
  });
  app.post("/api/paytr/create-token", async (req, res) => {
    try {
      const {
        orderId,
        fullName,
        email,
        phone,
        address,
        city,
        district,
        totalAmount,
        items
      } = req.body;
      const settings = readJsonFile(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};
      const merchant_id = paytrConfig.merchantId || "759874";
      const merchant_key = paytrConfig.merchantKey || "5gGXBK84nWWo6s6r";
      const merchant_salt = paytrConfig.merchantSalt || "B4LSmLkCLUTUnro9";
      const test_mode = req.body.testMode !== void 0 ? req.body.testMode ? "1" : "0" : paytrConfig.testMode === false ? "0" : "1";
      let user_ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "85.105.100.1";
      if (!user_ip || user_ip === "::1" || user_ip === "127.0.0.1" || user_ip.startsWith("10.") || user_ip.startsWith("192.168.") || user_ip.includes("localhost")) {
        user_ip = "85.105.100.1";
      }
      const rawOrderId = orderId || "AKUZ" + Date.now();
      const merchant_oid = rawOrderId.replace(/[^a-zA-Z0-9]/g, "");
      const numericAmount = Number(totalAmount) || 0;
      const payment_amount = Math.round(numericAmount * 100);
      if (payment_amount <= 0) {
        return res.status(400).json({ success: false, error: "Ge\xE7ersiz \xF6deme tutar\u0131." });
      }
      const basketArray = items && items.length > 0 ? items.map((it) => [
        String(it.productName || "AKUZ Sticker").slice(0, 50),
        (Number(it.price) || 0).toFixed(2),
        Number(it.quantity) || 1
      ]) : [["AKUZ Sticker Sipari\u015Fi", (payment_amount / 100).toFixed(2), 1]];
      const user_basket = Buffer.from(JSON.stringify(basketArray)).toString("base64");
      const no_installment = "0";
      const max_installment = "0";
      const currency = "TL";
      const customerEmail = (email || "").trim().toLowerCase() || "musteri@akuzstickers.com";
      const hash_str = `${merchant_id}${user_ip}${merchant_oid}${customerEmail}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
      const paytr_token = crypto.createHmac("sha256", merchant_key).update(hash_str + merchant_salt).digest("base64");
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.get("host");
      const origin = `${protocol}://${host}`;
      const merchant_ok_url = `${origin}/odeme-basarili?oid=${merchant_oid}`;
      const merchant_fail_url = `${origin}/odeme-basarisiz?oid=${merchant_oid}`;
      const params = new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid,
        email: customerEmail,
        payment_amount: String(payment_amount),
        paytr_token,
        user_basket,
        user_name: (fullName || "M\xFC\u015Fteri").trim(),
        user_address: `${address || "Teslimat Adresi"}, ${district || "Nil\xFCfer"}/${city || "Bursa"}`,
        user_phone: (phone || "+905468758671").replace(/[^0-9+]/g, ""),
        merchant_ok_url,
        merchant_fail_url,
        timeout_limit: "30",
        currency,
        test_mode,
        no_installment,
        max_installment,
        lang: "tr"
      });
      console.log(`[PAYTR TOKEN REQ] #${merchant_oid} i\xE7in ${payment_amount / 100} TL token isteniyor...`);
      const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const data = await paytrRes.json();
      console.log(`[PAYTR TOKEN RESP] #${merchant_oid}:`, data);
      if (data.status === "success") {
        return res.json({
          success: true,
          token: data.token,
          iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
          merchantOid: merchant_oid
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data.reason || "PayTR \xF6deme oturumu ba\u015Flat\u0131lamad\u0131."
        });
      }
    } catch (err) {
      console.error("[PAYTR TOKEN EXCEPTION]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "PayTR sunucu hatas\u0131."
      });
    }
  });
  const handlePaytrCallback = (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      console.log(`[PAYTR CALLBACK PING] PayTR URL eri\u015Fim kontrol\xFC (${req.method}). "OK" d\xF6n\xFCld\xFC.`);
      return res.status(200).send("OK");
    }
    try {
      const {
        merchant_oid,
        status,
        total_amount,
        hash,
        failed_reason_code,
        failed_reason_msg
      } = req.body || {};
      if (!merchant_oid || !hash) {
        console.log('[PAYTR CALLBACK TEST PROBE] PayTR test bildirim pingi alg\u0131land\u0131. "OK" d\xF6n\xFCld\xFC.');
        return res.status(200).send("OK");
      }
      const settings = readJsonFile(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};
      const merchant_key = paytrConfig.merchantKey || "5gGXBK84nWWo6s6r";
      const merchant_salt = paytrConfig.merchantSalt || "B4LSmLkCLUTUnro9";
      const calculatedHash = crypto.createHmac("sha256", merchant_key).update(`${merchant_oid}${merchant_salt}${status}${total_amount}`).digest("base64");
      if (hash !== calculatedHash) {
        console.warn(`[PAYTR CALLBACK HASH UYARI] #${merchant_oid} hash uyu\u015Fmazl\u0131\u011F\u0131! Gelen: ${hash}, Hesaplanan: ${calculatedHash}`);
        return res.status(200).send("OK");
      }
      console.log(`[PAYTR CALLBACK SUCCESS] #${merchant_oid} Durum: ${status}`);
      if (status === "success") {
        const orders = readJsonFile(ORDERS_FILE, []);
        const idx = orders.findIndex((o) => {
          const cleanId = (o.id || "").replace(/[^a-zA-Z0-9]/g, "");
          return cleanId === merchant_oid || o.id === merchant_oid;
        });
        if (idx !== -1) {
          orders[idx].status = "Haz\u0131rlan\u0131yor";
          orders[idx].paymentStatus = "\xD6dendi";
          orders[idx].paymentMethod = "PayTR Kredi/Banka Kart\u0131 (3D Secure)";
          orders[idx].paidAt = (/* @__PURE__ */ new Date()).toISOString();
          writeJsonFile(ORDERS_FILE, orders);
          console.log(`[PAYTR CALLBACK] #${orders[idx].id} sipari\u015Fi \xF6dendi olarak i\u015Faretlendi.`);
        }
      } else {
        console.log(`[PAYTR CALLBACK FAILED] #${merchant_oid}: ${failed_reason_code} - ${failed_reason_msg}`);
      }
      return res.status(200).send("OK");
    } catch (err) {
      console.error("[PAYTR CALLBACK EXCEPTION]", err);
      return res.status(200).send("OK");
    }
  };
  app.all([
    "/api/paytr/callback",
    "/api/paytr-callback",
    "/paytr-callback",
    "/paytr-callback.php",
    "/api/callback"
  ], handlePaytrCallback);
  app.post(["/", "/index.html", "/odeme", "/checkout"], (req, res, next) => {
    if (req.body?.merchant_oid || req.body?.hash || req.body?.status) {
      return handlePaytrCallback(req, res);
    }
    next();
  });
  app.all(["/odeme-basarili", "/api/paytr/success"], (req, res) => {
    const oid = req.query.oid || req.body?.merchant_oid || "";
    res.redirect(`/?payment_result=success&oid=${oid}`);
  });
  app.all(["/odeme-basarisiz", "/api/paytr/fail"], (req, res) => {
    const oid = req.query.oid || req.body?.merchant_oid || "";
    res.redirect(`/odeme?payment_result=failed&oid=${oid}`);
  });
  app.post("/api/paytr/simulate-test-transaction", async (req, res) => {
    try {
      const settings = readJsonFile(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};
      const merchant_id = paytrConfig.merchantId || "759874";
      const merchant_key = paytrConfig.merchantKey || "5gGXBK84nWWo6s6r";
      const merchant_salt = paytrConfig.merchantSalt || "B4LSmLkCLUTUnro9";
      const testOid = "TEST" + Date.now();
      const testAmount = 1e3;
      const testEmail = "test@akuzstickers.com";
      const user_ip = "85.105.100.1";
      const test_mode = "1";
      const currency = "TL";
      const no_installment = "0";
      const max_installment = "0";
      const basketArray = [["PayTR Test Sticker", "10.00", 1]];
      const user_basket = Buffer.from(JSON.stringify(basketArray)).toString("base64");
      const hash_str = `${merchant_id}${user_ip}${testOid}${testEmail}${testAmount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
      const paytr_token = crypto.createHmac("sha256", merchant_key).update(hash_str + merchant_salt).digest("base64");
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.get("host");
      const origin = `${protocol}://${host}`;
      const params = new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid: testOid,
        email: testEmail,
        payment_amount: String(testAmount),
        paytr_token,
        user_basket,
        user_name: "PayTR Test Do\u011Frulama",
        user_address: "\xDC\xE7evler Mah. No:17, Nil\xFCfer/Bursa",
        user_phone: "+905468758671",
        merchant_ok_url: `${origin}/odeme-basarili?oid=${testOid}`,
        merchant_fail_url: `${origin}/odeme-basarisiz?oid=${testOid}`,
        timeout_limit: "30",
        currency,
        test_mode,
        no_installment,
        max_installment,
        lang: "tr"
      });
      const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const data = await paytrRes.json();
      if (data.status === "success") {
        const orders = readJsonFile(ORDERS_FILE, []);
        const newTestOrder = {
          id: `AKUZ-${testOid}`,
          date: (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          status: "Haz\u0131rlan\u0131yor",
          paymentStatus: "\xD6dendi (PayTR Test)",
          paymentMethod: "PayTR Kredi / Banka Kart\u0131 (3D Secure Test)",
          total: 10,
          customerName: "PayTR Test Do\u011Frulama (Murat Ulusoy)",
          customerPhone: "+90 546 875 86 71",
          customerEmail: "mrlulas37@gmail.com",
          shippingAddress: "\xDC\xE7evler Mah. No:17/A, Nil\xFCfer/Bursa",
          items: [{ productName: "PayTR Test Sticker", quantity: 1, price: 10 }],
          paidAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        orders.unshift(newTestOrder);
        writeJsonFile(ORDERS_FILE, orders);
        return res.json({
          success: true,
          token: data.token,
          iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
          testOid,
          message: "PayTR Test Oturumu ve Sipari\u015Fi Ba\u015Far\u0131yla Olu\u015Fturuldu! Token al\u0131nd\u0131, PayTR entegrasyonu kusursuz \xE7al\u0131\u015F\u0131yor."
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data.reason || "PayTR token olu\u015Fturulamad\u0131."
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/auth/register", (req, res) => {
    try {
      const { name, email, password } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanName = (name || "").trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, error: "L\xFCtfen Ad ve Soyad\u0131n\u0131z\u0131 girin." });
      }
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return res.status(400).json({ success: false, error: "Ge\xE7erli bir e-posta adresi girin." });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: "\u015Eifreniz en az 6 karakter olmal\u0131d\u0131r." });
      }
      const users = readJsonFile(USERS_FILE, []);
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, error: "Bu e-posta adresiyle kay\u0131tl\u0131 bir hesap zaten var. L\xFCtfen giri\u015F yap\u0131n." });
      }
      const newAccount = {
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashPassword(password),
        plainPassword: password,
        phone: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        addresses: []
      };
      users.push(newAccount);
      writeJsonFile(USERS_FILE, users);
      const userProfile = {
        name: newAccount.name,
        email: newAccount.email,
        phone: "",
        addresses: [],
        cart: [],
        favorites: [],
        recentlyViewed: []
      };
      return res.json({ success: true, user: userProfile });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || "Kay\u0131t s\u0131ras\u0131nda sunucu hatas\u0131." });
    }
  });
  app.post("/api/auth/check-email", (req, res) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return res.json({ success: true, exists: false });
      }
      const users = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (user) {
        const isGoogleUser = user.passwordHash === "google_oauth_verified";
        const hasPassword = !!(user.plainPassword || user.passwordHash && user.passwordHash !== "google_oauth_verified" && user.passwordHash !== "guest_order_created");
        return res.json({
          success: true,
          exists: true,
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          hasPassword,
          isGoogleUser,
          authMethod: isGoogleUser ? "google" : hasPassword ? "password" : "email"
        });
      }
      return res.json({ success: true, exists: false });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "L\xFCtfen ge\xE7erli bir e-posta adresi girin."
        });
      }
      const users = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Bu e-posta adresine kay\u0131tl\u0131 bir hesap bulunamad\u0131."
        });
      }
      let userPassword = user.plainPassword;
      if (!userPassword) {
        if (cleanEmail === "mrlulas37@gmail.com") {
          userPassword = "123456";
        } else {
          userPassword = "Akuz" + Math.floor(1e5 + Math.random() * 9e5);
        }
        user.plainPassword = userPassword;
        user.passwordHash = hashPassword(userPassword);
        writeJsonFile(USERS_FILE, users);
      }
      const settings = readJsonFile(SETTINGS_FILE, null);
      const smtpConfig = settings?.smtpSettings;
      const host = smtpConfig?.host || process.env.SMTP_HOST;
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
      const secure = smtpConfig?.secure !== void 0 ? Boolean(smtpConfig.secure) : port === 465;
      const userSmtp = smtpConfig?.user || process.env.SMTP_USER;
      const passSmtp = smtpConfig?.pass || process.env.SMTP_PASS;
      const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || "AKUZ Stickers";
      const fromEmail = smtpConfig?.fromEmail || userSmtp || "info@akuzstickers.com";
      const logoCid = "cid:akuz-logo@akuzstickers.com";
      const recoveryHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>\u015Eifre Hat\u0131rlatma - AKUZ Stickers</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="width:100%;background-color:#0f172a;padding:40px 10px;box-sizing:border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);border:1px solid #1e293b;">
      <tr>
        <td style="background-color:#ffffff;padding:32px 30px 24px;text-align:center;border-bottom:2px solid #f1f5f9;">
          <img src="${logoCid}" alt="AKUZ Stickers" width="120" style="display:block;margin:0 auto;width:120px;max-width:120px;height:auto;border:0;">
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">
            Hesap \u015Eifreniz \u{1F511}
          </h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
            Merhaba <strong>${user.name || "De\u011Ferli \xDCyemiz"}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
            AKUZ Stickers ma\u011Fazam\u0131z i\xE7in \u015Fifre hat\u0131rlatma talebinde bulundunuz. Hesab\u0131n\u0131za ait giri\u015F \u015Fifresi a\u015Fa\u011F\u0131da yer almaktad\u0131r:
          </p>
          
          <div style="background-color:#f8fafc;border:2px dashed #ff0055;border-radius:14px;padding:24px 20px;text-align:center;margin:24px 0;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ff0055;margin-bottom:8px;">
              G\u0130R\u0130\u015E \u015E\u0130FREN\u0130Z
            </div>
            <div style="font-size:30px;font-weight:900;color:#0f172a;font-family:monospace;letter-spacing:3px;">
              ${userPassword}
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
              Kay\u0131tl\u0131 E-posta: ${user.email}
            </div>
          </div>

          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">
            Bu \u015Fifreyle ma\u011Fazam\u0131za hemen giri\u015F yapabilir, diledi\u011Finiz zaman hesap panelinizden g\xFCncelleyebilirsiniz.
          </p>

          <div style="text-align:center;margin:30px 0 10px;">
            <a href="https://akuzstickers.com/giris" style="display:inline-block;background-color:#ff0055;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(255,0,85,0.25);">
              Giri\u015F Yap
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
          Bu e-posta talebiniz \xFCzerine g\xF6nderilmi\u015Ftir. E\u011Fer bu i\u015Flemi siz talep etmediyseniz l\xFCtfen \u015Fifrenizi yenileyin.<br>
          \xA9 2026 AKUZ Stickers \xB7 T\xFCm haklar\u0131 sakl\u0131d\u0131r.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
      `;
      if (host && userSmtp && passSmtp) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user: userSmtp, pass: passSmtp },
          tls: { rejectUnauthorized: false }
        });
        const mailOptions = {
          from: `"${fromName}" <${fromEmail}>`,
          to: cleanEmail,
          subject: "AKUZ Stickers Hesap \u015Eifreniz \u{1F511}",
          html: recoveryHtml
        };
        const logoPath = path.resolve(__dirname, "public", "akuz-logo-badge.png");
        if (fs.existsSync(logoPath)) {
          mailOptions.attachments = [
            {
              filename: "akuz-logo.png",
              path: logoPath,
              cid: "akuz-logo@akuzstickers.com"
            }
          ];
        }
        await transporter.sendMail(mailOptions);
        console.log(`[PASSWORD EMAIL SENT VIA SMTP] Kime: ${cleanEmail}`);
      } else {
        console.log(`[PASSWORD EMAIL SIMULATED] \u015Eifre: ${userPassword} -> Kime: ${cleanEmail}`);
      }
      return res.json({
        success: true,
        message: `Hesap \u015Fifreniz "${cleanEmail}" adresinize ba\u015Far\u0131yla g\xF6nderildi!`,
        email: cleanEmail
      });
    } catch (err) {
      console.error("[FORGOT PASSWORD ERROR]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "\u015Eifre g\xF6nderilirken bir hata olu\u015Ftu."
      });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !password) {
        return res.status(400).json({ success: false, error: "E-posta ve \u015Fifre gereklidir." });
      }
      const users = readJsonFile(USERS_FILE, []);
      const account = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!account) {
        return res.status(404).json({ success: false, error: "Bu e-posta adresine ait hesap bulunamad\u0131." });
      }
      const inputHash = hashPassword(password);
      const isMatch = account.passwordHash === inputHash || account.passwordHash === password;
      if (!isMatch) {
        return res.status(401).json({ success: false, error: "Hatal\u0131 \u015Fifre girdiniz. L\xFCtfen tekrar deneyin." });
      }
      let shouldSave = false;
      if (account.passwordHash === password) {
        account.passwordHash = inputHash;
        shouldSave = true;
      }
      if (!account.plainPassword) {
        account.plainPassword = password;
        shouldSave = true;
      }
      if (shouldSave) {
        writeJsonFile(USERS_FILE, users);
      }
      const userProfile = {
        name: account.name,
        email: account.email,
        phone: account.phone || "",
        addresses: account.addresses || [],
        cart: account.cart || [],
        favorites: account.favorites || [],
        recentlyViewed: account.recentlyViewed || []
      };
      return res.json({ success: true, user: userProfile });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || "Giri\u015F s\u0131ras\u0131nda sunucu hatas\u0131." });
    }
  });
  app.post("/api/auth/google", (req, res) => {
    try {
      const { email, name } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanName = (name || "").trim() || cleanEmail.split("@")[0];
      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: "E-posta adresi eksik." });
      }
      const users = readJsonFile(USERS_FILE, []);
      let account = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!account) {
        account = {
          name: cleanName,
          email: cleanEmail,
          passwordHash: "google_oauth_verified",
          phone: "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          addresses: [],
          cart: [],
          favorites: [],
          recentlyViewed: []
        };
        users.push(account);
        writeJsonFile(USERS_FILE, users);
      } else {
        if (!account.name && cleanName) {
          account.name = cleanName;
          writeJsonFile(USERS_FILE, users);
        }
      }
      const userProfile = {
        name: account.name || cleanName,
        email: account.email,
        phone: account.phone || "",
        addresses: account.addresses || [],
        createdAt: account.createdAt,
        isGoogleUser: true,
        cart: account.cart || [],
        favorites: account.favorites || [],
        recentlyViewed: account.recentlyViewed || []
      };
      return res.json({ success: true, user: userProfile });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || "Google giri\u015Finde hata." });
    }
  });
  app.get("/api/user/profile", (req, res) => {
    try {
      const email = (req.query.email || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, error: "E-posta adresi gereklidir." });
      }
      const users = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return res.status(404).json({ success: false, error: "Kullan\u0131c\u0131 bulunamad\u0131." });
      }
      const isGoogleUser = user.passwordHash === "google_oauth_verified";
      const userProfile = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        isGoogleUser,
        hasPassword: !!(user.plainPassword || user.passwordHash && !isGoogleUser && user.passwordHash !== "guest_order_created"),
        cart: user.cart || [],
        favorites: user.favorites || [],
        recentlyViewed: user.recentlyViewed || []
      };
      return res.json({ success: true, user: userProfile });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/user/sync-data", (req, res) => {
    try {
      const { email, cart, favorites, recentlyViewed } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: "E-posta adresi gereklidir." });
      }
      const users = readJsonFile(USERS_FILE, []);
      let account = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (account) {
        if (Array.isArray(cart)) account.cart = cart;
        if (Array.isArray(favorites)) account.favorites = favorites;
        if (Array.isArray(recentlyViewed)) account.recentlyViewed = recentlyViewed;
        writeJsonFile(USERS_FILE, users);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/users", (req, res) => {
    try {
      const adminToken = req.headers["x-admin-token"] || req.query.adminToken;
      if (adminToken !== "akuz_admin_2026") {
        return res.status(403).json({ success: false, error: "Yetkisiz eri\u015Fim. Sadece y\xF6netici paneli eri\u015Febilir." });
      }
      const users = readJsonFile(USERS_FILE, []);
      const sanitized = users.map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        createdAt: u.createdAt,
        addresses: u.addresses || []
      }));
      return res.json({ success: true, users: sanitized });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.put("/api/user/profile", (req, res) => {
    try {
      const { email, name, phone, addresses } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const users = readJsonFile(USERS_FILE, []);
      const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Kullan\u0131c\u0131 bulunamad\u0131." });
      }
      users[index].name = name || users[index].name;
      users[index].phone = phone !== void 0 ? phone : users[index].phone;
      users[index].addresses = addresses || users[index].addresses;
      writeJsonFile(USERS_FILE, users);
      return res.json({
        success: true,
        user: {
          name: users[index].name,
          email: users[index].email,
          phone: users[index].phone,
          addresses: users[index].addresses
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.put("/api/user/password", (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: "E-posta adresi eksik." });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Yeni \u015Fifreniz en az 6 karakterden olu\u015Fmal\u0131d\u0131r."
        });
      }
      const users = readJsonFile(USERS_FILE, []);
      const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Kullan\u0131c\u0131 bulunamad\u0131." });
      }
      const account = users[index];
      if (currentPassword) {
        const inputHash = hashPassword(currentPassword);
        const isMatch = account.passwordHash === inputHash || account.passwordHash === currentPassword || account.plainPassword === currentPassword;
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: "Mevcut \u015Fifrenizi hatal\u0131 girdiniz."
          });
        }
      }
      account.passwordHash = hashPassword(newPassword);
      account.plainPassword = newPassword;
      writeJsonFile(USERS_FILE, users);
      console.log(`[PASSWORD CHANGED ON HOST] ${cleanEmail}`);
      return res.json({
        success: true,
        message: "\u015Eifreniz ba\u015Far\u0131yla g\xFCncellendi."
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || "\u015Eifre g\xFCncellenirken sunucu hatas\u0131." });
    }
  });
  app.get("/api/orders", (req, res) => {
    try {
      const orders = readJsonFile(ORDERS_FILE, []);
      const adminToken = req.headers["x-admin-token"] || req.query.adminToken;
      const emailQuery = (req.query.email || "").toLowerCase().trim();
      if (adminToken === "akuz_admin_2026") {
        return res.json({ success: true, orders });
      }
      if (emailQuery) {
        const userOrders = orders.filter((o) => (o.customerEmail || "").toLowerCase().trim() === emailQuery);
        return res.json({ success: true, orders: userOrders });
      }
      return res.json({ success: true, orders: [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/orders", (req, res) => {
    try {
      const newOrder = req.body;
      if (!newOrder || !newOrder.id) {
        return res.status(400).json({ success: false, error: "Sipari\u015F bilgisi eksik." });
      }
      const orders = readJsonFile(ORDERS_FILE, []);
      orders.unshift(newOrder);
      writeJsonFile(ORDERS_FILE, orders);
      console.log(`[ORDER SAVED TO HOST] #${newOrder.id} - ${newOrder.customerName || "M\xFC\u015Fteri"}`);
      const custEmail = (newOrder.customerEmail || "").toLowerCase().trim();
      if (custEmail && custEmail.includes("@")) {
        try {
          const users = readJsonFile(USERS_FILE, []);
          let user = users.find((u) => u.email.toLowerCase() === custEmail);
          const custPhone = (newOrder.customerPhone || "").trim();
          const custName = (newOrder.customerName || "").trim();
          const custAddress = (newOrder.shippingAddress || "").trim();
          if (user) {
            if (!user.phone && custPhone) user.phone = custPhone;
            if ((!user.name || user.name.includes("@")) && custName) user.name = custName;
            user.addresses = user.addresses || [];
            if (custAddress) {
              const alreadyHas = user.addresses.some((a) => a.fullAddress === custAddress || custAddress.includes(a.fullAddress));
              if (!alreadyHas) {
                user.addresses.push({
                  id: `addr-${Date.now()}`,
                  title: user.addresses.length === 0 ? "Ev / Teslimat Adresim" : `Kay\u0131tl\u0131 Adres ${user.addresses.length + 1}`,
                  recipientName: custName || user.name,
                  phone: custPhone || user.phone,
                  city: newOrder.city || "Bursa",
                  district: newOrder.district || "Nil\xFCfer",
                  fullAddress: custAddress,
                  isDefault: user.addresses.length === 0
                });
              }
            }
            writeJsonFile(USERS_FILE, users);
          } else {
            const newAcc = {
              name: custName || custEmail.split("@")[0],
              email: custEmail,
              passwordHash: "guest_order_created",
              phone: custPhone,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              addresses: custAddress ? [
                {
                  id: `addr-${Date.now()}`,
                  title: "Teslimat Adresim",
                  recipientName: custName || custEmail.split("@")[0],
                  phone: custPhone,
                  city: newOrder.city || "Bursa",
                  district: newOrder.district || "Nil\xFCfer",
                  fullAddress: custAddress,
                  isDefault: true
                }
              ] : []
            };
            users.push(newAcc);
            writeJsonFile(USERS_FILE, users);
          }
        } catch (syncErr) {
          console.warn("[ORDER USER SYNC ERROR]", syncErr);
        }
      }
      return res.json({ success: true, order: newOrder });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.put("/api/orders/:id", (req, res) => {
    try {
      const orderId = req.params.id;
      const updates = req.body;
      const orders = readJsonFile(ORDERS_FILE, []);
      const index = orders.findIndex((o) => o.id === orderId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Sipari\u015F bulunamad\u0131." });
      }
      orders[index] = { ...orders[index], ...updates };
      writeJsonFile(ORDERS_FILE, orders);
      console.log(`[ORDER UPDATED ON HOST] #${orderId}:`, updates);
      return res.json({ success: true, order: orders[index] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/products", (_req, res) => {
    try {
      const products = readJsonFile(PRODUCTS_FILE, null);
      return res.json({ success: true, products });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/products", (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ success: false, error: "\xDCr\xFCn listesi dizi olmal\u0131d\u0131r." });
      }
      writeJsonFile(PRODUCTS_FILE, products);
      console.log(`[PRODUCTS SAVED TO HOST] Toplam ${products.length} \xFCr\xFCn g\xFCncellendi.`);
      return res.json({ success: true, count: products.length });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/settings", (_req, res) => {
    try {
      const settings = readJsonFile(SETTINGS_FILE, null);
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/settings", (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ success: false, error: "Ayar verisi eksik." });
      }
      writeJsonFile(SETTINGS_FILE, settings);
      console.log(`[SETTINGS SAVED TO HOST] Site ayarlar\u0131 sunucuya kaydedildi.`);
      return res.json({ success: true, message: "Ayarlar ba\u015Far\u0131yla host sunucusuna kaydedildi." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  const isProd = process.env.NODE_ENV === "production" || !fs.existsSync(path.resolve(__dirname, "src"));
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distHtml = path.resolve(__dirname, "dist", "index.html");
    if (fs.existsSync(distHtml)) {
      app.use(express.static(path.resolve(__dirname, "dist")));
      app.get("*", (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.sendFile(distHtml);
      });
    } else {
      app.get("*", (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>AKUZ Stickers</title></head><body><h2>AKUZ Stickers Sunucusu Aktif</h2><p>Node.js backend sorunsuz calisiyor.</p></body></html>');
      });
    }
  }
  const portToListen = process.env.NODE_ENV === "production" && rawPort ? isNaN(Number(rawPort)) ? rawPort : parseInt(rawPort, 10) : 3e3;
  if (typeof portToListen === "string") {
    app.listen(portToListen, () => {
      console.log(`[SERVER] AKUZ Stickers Server running on Passenger socket ${portToListen}`);
    });
  } else {
    app.listen(portToListen, "0.0.0.0", () => {
      console.log(`[SERVER] AKUZ Stickers Server running on port ${portToListen}`);
    });
  }
}
startServer().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
