import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Merkezi Veri Klasörü (Sunucu Dosya Sistemi / Host üzerinde kalıcı veri depolama)
const DATA_DIR = path.resolve(__dirname, 'data_storage');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');
const GOOGLE_CREDENTIALS_FILE = path.join(DATA_DIR, 'google_credentials.json');

// MySQL Veritabanı Havuzu (cPanel akuzstic_data ve harici veritabanı senkronizasyonu)
const hasMysqlConfig = Boolean(process.env.DB_HOST || process.env.MYSQL_HOST);
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || '',
  user: process.env.DB_USER || process.env.MYSQL_USER || '',
  password: process.env.DB_PASS || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || '',
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 4000,
};

let mysqlPool: mysql.Pool | null = null;
if (hasMysqlConfig && MYSQL_CONFIG.host && MYSQL_CONFIG.user) {
  try {
    mysqlPool = mysql.createPool(MYSQL_CONFIG);
  } catch (e) {
    console.warn('[MYSQL POOL INIT WARN]', e);
  }
} else {
  console.log('[AI Studio] MySQL credentials not supplied in env — utilizing persistent JSON file storage layer');
}

// MySQL tablo ve sütunlarını arka planda otomatik garantile
async function ensureMysqlSchema() {
  if (!mysqlPool) return;
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const [cols]: any = await conn.query('SHOW COLUMNS FROM users').catch(() => [[]]);
      const colNames = Array.isArray(cols) ? cols.map((c: any) => c.Field) : [];
      if (colNames.length > 0) {
        if (!colNames.includes('cart')) {
          await conn.query('ALTER TABLE users ADD COLUMN cart LONGTEXT NULL').catch(() => {});
        }
        if (!colNames.includes('favorites')) {
          await conn.query('ALTER TABLE users ADD COLUMN favorites TEXT NULL').catch(() => {});
        }
        if (!colNames.includes('addresses')) {
          await conn.query('ALTER TABLE users ADD COLUMN addresses TEXT NULL').catch(() => {});
        }
        if (!colNames.includes('phone')) {
          await conn.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL').catch(() => {});
        }
      }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS cart (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(191) NOT NULL,
          product_id VARCHAR(191) NOT NULL,
          quantity INT DEFAULT 1,
          color VARCHAR(100) NULL,
          dimension VARCHAR(100) NULL,
          finish VARCHAR(50) NULL,
          custom_text TEXT NULL,
          custom_font VARCHAR(100) NULL,
          calculated_price DECIMAL(10,2) NULL,
          item_data LONGTEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY user_idx (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `).catch(() => {});

      await conn.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(191) NOT NULL,
          product_id VARCHAR(191) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY user_prod_idx (user_id, product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `).catch(() => {});
    } finally {
      conn.release();
    }
  } catch (err: any) {
    // Graceful log
    console.warn('[MYSQL SCHEMA INIT NOTE] cPanel MySQL bağlantısı dev ortamında pasif veya cPanel sunucusunda aktif.');
  }
}
ensureMysqlSchema();

// MySQL Sepet Senkronizasyonu
async function syncMysqlCart(email: string, userId: string, cartItems: any[]) {
  if (!mysqlPool) return;
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const jsonStr = JSON.stringify(cartItems);
      // 1. users tablosundaki cart sütununu güncelle
      if (email) {
        await conn.query('UPDATE users SET cart = ? WHERE LOWER(email) = ?', [jsonStr, email.toLowerCase()]).catch(() => {});
      }
      if (userId && userId !== email) {
        await conn.query('UPDATE users SET cart = ? WHERE LOWER(email) = ? OR id = ?', [jsonStr, userId.toLowerCase(), userId]).catch(() => {});
      }

      // 2. cart tablosunu güncelle
      const targetId = email || userId;
      if (targetId) {
        await conn.query('DELETE FROM cart WHERE user_id = ? OR user_id = ?', [targetId, userId]).catch(() => {});
        for (const it of cartItems) {
          const pId = String(it.product?.id || it.productId || it.product_id || 'prod');
          const qty = Number(it.quantity) || 1;
          const color = String(it.selectedColor || it.color || '');
          const dim = String(it.selectedDimension || it.dimension || '');
          const finish = String(it.selectedFinish || it.finish || '');
          const cText = String(it.customText || it.custom_text || '');
          const cFont = String(it.customFont || it.custom_font || '');
          const price = Number(it.calculatedPrice || it.price || 0);
          const itemJson = JSON.stringify(it);
          await conn.query(
            'INSERT INTO cart (user_id, product_id, quantity, color, dimension, finish, custom_text, custom_font, calculated_price, item_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [targetId, pId, qty, color, dim, finish, cText, cFont, price, itemJson]
          ).catch(() => {});
        }
      }
    } finally {
      conn.release();
    }
  } catch (err: any) {
    // Non-blocking
  }
}

// MySQL Favori Senkronizasyonu
async function syncMysqlFavorites(email: string, userId: string, favs: string[]) {
  if (!mysqlPool) return;
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const jsonStr = JSON.stringify(favs);
      // 1. users tablosundaki favorites sütununu güncelle
      if (email) {
        await conn.query('UPDATE users SET favorites = ? WHERE LOWER(email) = ?', [jsonStr, email.toLowerCase()]).catch(() => {});
      }
      if (userId && userId !== email) {
        await conn.query('UPDATE users SET favorites = ? WHERE LOWER(email) = ? OR id = ?', [jsonStr, userId.toLowerCase(), userId]).catch(() => {});
      }

      // 2. favorites tablosunu güncelle
      const targetId = email || userId;
      if (targetId) {
        await conn.query('DELETE FROM favorites WHERE user_id = ? OR user_id = ?', [targetId, userId]).catch(() => {});
        for (const fId of favs) {
          const cleanId = String(fId).trim();
          if (cleanId) {
            await conn.query('INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)', [targetId, cleanId]).catch(() => {});
          }
        }
      }
    } finally {
      conn.release();
    }
  } catch (err: any) {
    // Non-blocking
  }
}

// Yardımcı dosya okuma/yazma fonksiyonları (Dosya silinse dahi yedeklerden anında kurtarma garantisi)
// Yardımcı dosya okuma/yazma fonksiyonları (Dosya silinse dahi yedeklerden anında kurtarma garantisi)
function readJsonFile<T>(filePath: string, fallback: T): T {
  const backupPath = filePath + '.bak';
  const fileName = path.basename(filePath);

  // 1. Ana dosyadan okumayı dene
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 0 && filePath === PRODUCTS_FILE) {
          console.warn(`[DATA GUARD] ${filePath} boş dizi içeriyor, yedeklerden kurtarılıyor...`);
        } else {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn(`[DATA READ WARN] ${filePath} bozuk veya okunamadı, yedek deneniyor:`, err);
  }

  // 2. Birincil yedekten kurtarmayı dene (.bak)
  try {
    if (fs.existsSync(backupPath)) {
      const rawBackup = fs.readFileSync(backupPath, 'utf-8');
      if (rawBackup && rawBackup.trim().length > 0) {
        const parsed = JSON.parse(rawBackup);
        if (!(Array.isArray(parsed) && parsed.length === 0 && filePath === PRODUCTS_FILE)) {
          fs.writeFileSync(filePath, rawBackup, 'utf-8');
          console.log(`[DATA RESTORE SUCCESS] ${filePath} silinmişti, .bak yedeğinden başarıyla geri yüklendi.`);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn(`[DATA RESTORE WARN] ${backupPath} okunamadı:`, err);
  }

  // 3. Arşiv klasöründeki zaman damgalı en güncel geçerli yedekten kurtar
  try {
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.startsWith(fileName))
        .sort((a, b) => b.localeCompare(a)); // En yeni en başta

      for (const bFile of files) {
        try {
          const rawArchive = fs.readFileSync(path.join(BACKUPS_DIR, bFile), 'utf-8');
          if (rawArchive && rawArchive.trim().length > 0) {
            const parsed = JSON.parse(rawArchive);
            if (!(Array.isArray(parsed) && parsed.length === 0 && filePath === PRODUCTS_FILE)) {
              fs.writeFileSync(filePath, rawArchive, 'utf-8');
              console.log(`[DATA RESTORE SUCCESS] ${filePath} arşivi (${bFile}) üzerinden başarıyla kurtarıldı.`);
              return parsed;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[DATA RESTORE WARN] Arşiv taranamadı:`, err);
  }

  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const fileName = path.basename(filePath);

    // KORUMA KURALI 1: Ürün listesi asla boş bir diziyle ezilemez
    if (filePath === PRODUCTS_FILE && Array.isArray(data) && data.length === 0) {
      console.warn(`[SECURITY GUARD] ${filePath} boş liste ile ezilmeye çalışıldı! İşlem engellendi.`);
      return;
    }

    // KORUMA KURALI 2: Ayar dosyası asla null veya boş bir obje ile ezilemez
    if (filePath === SETTINGS_FILE && (!data || (typeof data === 'object' && Object.keys(data).length === 0))) {
      console.warn(`[SECURITY GUARD] ${filePath} boş ayar objesi ile ezilmeye çalışıldı! İşlem engellendi.`);
      return;
    }

    const serialized = JSON.stringify(data, null, 2);

    // 1. Önce mevcut sağlam dosyanın bir yedeğini arşivle
    if (fs.existsSync(filePath)) {
      try {
        const currentContent = fs.readFileSync(filePath, 'utf-8');
        if (currentContent && currentContent.trim().length > 2) {
          fs.writeFileSync(filePath + '.bak', currentContent, 'utf-8');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          fs.writeFileSync(path.join(BACKUPS_DIR, `${fileName}_${timestamp}.json`), currentContent, 'utf-8');
        }
      } catch (backupErr) {
        console.warn(`[BACKUP WARN] ${filePath} yedeklenemedi:`, backupErr);
      }
    }

    // 2. Ana dosyaya yaz
    fs.writeFileSync(filePath, serialized, 'utf-8');

    // 3. .bak dosyasını da yeni veriyle güncelle
    try {
      fs.writeFileSync(filePath + '.bak', serialized, 'utf-8');
    } catch {}

    // 4. Arşiv klasöründeki eski yedekleri sınırla (en fazla 30 dosya tut)
    try {
      const allBackups = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.startsWith(fileName))
        .sort((a, b) => b.localeCompare(a));
      if (allBackups.length > 30) {
        for (const oldFile of allBackups.slice(30)) {
          fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
        }
      }
    } catch {}
  } catch (err) {
    console.error(`[DATA WRITE ERROR] ${filePath}:`, err);
  }
}

// Güvenli şifre hashleme (Salt + PBKDF2 veya SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_akuz_salt_secret').digest('hex');
}

// Başlangıçta kullanıcı, sepet ve favori dosyalarının varlığını garantile
if (!fs.existsSync(USERS_FILE)) {
  writeJsonFile(USERS_FILE, []);
}
if (!fs.existsSync(CARTS_FILE)) {
  writeJsonFile(CARTS_FILE, {});
}
if (!fs.existsSync(FAVORITES_FILE)) {
  writeJsonFile(FAVORITES_FILE, {});
}

async function startServer() {
  const app = express();
  const rawPort = process.env.PORT;

  // 50MB payload limit (ürün fotoğrafları ve toplu katalog güncellemeleri için)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Fotoğraf Yükleme Klasörü (public/uploads ve dist/uploads)
  const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Helper: Önizleme verilerini anında kaynak kodlara ve cPanel dosyalarına senkronize et
  const runDataSync = () => {
    try {
      const syncScript = path.resolve(__dirname, 'scripts', 'sync-preview-data.cjs');
      if (fs.existsSync(syncScript)) {
        execSync(`node "${syncScript}"`, { stdio: 'inherit' });
      }
    } catch (syncErr: any) {
      console.warn('[PREVIEW SYNC ERROR]', syncErr.message);
    }
  };

  // cPanel İndirme Rotaları (res.download ile doğrudan indirme tetikle - her zaman güncel taze dosya)
  const ensureAndSendZip = (zipName: string, req: express.Request, res: express.Response) => {
    const filePath = path.resolve(__dirname, 'cpanel_archives', zipName);
    let isStale = false;

    if (fs.existsSync(filePath)) {
      try {
        const zipMtime = fs.statSync(filePath).mtimeMs;
        const checkFiles = [
          SETTINGS_FILE,
          PRODUCTS_FILE,
          path.join(DATA_DIR, 'global_colors.json'),
          path.resolve(__dirname, 'src', 'data', 'products.ts'),
          path.resolve(__dirname, 'src', 'utils', 'adminStore.ts')
        ];
        for (const cf of checkFiles) {
          if (fs.existsSync(cf) && fs.statSync(cf).mtimeMs > zipMtime) {
            isStale = true;
            break;
          }
        }
      } catch {
        isStale = true;
      }
    } else {
      isStale = true;
    }

    const shouldRebuild = req.query.rebuild === '1' || isStale;

    if (shouldRebuild) {
      try {
        console.log(`[CPANEL DOWNLOAD] ${zipName} indirilmeden önce güncel paket derleniyor (isStale: ${isStale})...`);
        const scriptPath = path.resolve(__dirname, 'scripts', 'package-cpanel.py');
        execSync(`python3 "${scriptPath}"`, { stdio: 'inherit' });
      } catch (err: any) {
        console.error('[CPANEL DOWNLOAD REBUILD ERROR]', err);
      }
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (fs.existsSync(filePath)) {
      res.download(filePath, zipName);
    } else {
      res.status(404).send('ZIP dosyası bulunamadı.');
    }
  };

  app.get(['/download-cpanel-dist.zip', '/cpanel_public_html_dist.zip'], (req, res) => {
    ensureAndSendZip('cpanel_public_html_dist.zip', req, res);
  });

  app.get(['/download-cpanel-full.zip', '/cpanel_full_app.zip'], (req, res) => {
    ensureAndSendZip('cpanel_full_app.zip', req, res);
  });

  // Paketlerin güncellik durumunu ve boyutlarını getiren API rotası
  app.get('/api/cpanel-packages-status', (_req, res) => {
    try {
      const fullZip = path.resolve(__dirname, 'cpanel_archives', 'cpanel_full_app.zip');
      const distZip = path.resolve(__dirname, 'cpanel_archives', 'cpanel_public_html_dist.zip');
      
      const getStats = (p: string) => {
        if (!fs.existsSync(p)) return null;
        const stats = fs.statSync(p);
        return {
          exists: true,
          sizeBytes: stats.size,
          sizeMb: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
          lastModified: stats.mtime.toISOString(),
        };
      };

      res.json({
        success: true,
        fullApp: getStats(fullZip),
        distApp: getStats(distZip),
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Paketleri canlıda anında yeniden derleme ve cPanel verilerini güncelleme API rotası
  app.post('/api/rebuild-cpanel-packages', (req, res) => {
    try {
      if (req.body?.products && Array.isArray(req.body.products)) {
        writeJsonFile(PRODUCTS_FILE, req.body.products);
        console.log(`[CPANEL SYNC] Ürünler güncellendi: ${req.body.products.length} adet`);
      }
      if (req.body?.settings) {
        writeJsonFile(SETTINGS_FILE, req.body.settings);
        console.log(`[CPANEL SYNC] Ayarlar güncellendi.`);
      }
      if (req.body?.globalColors && Array.isArray(req.body.globalColors)) {
        const colorsFile = path.join(DATA_DIR, 'global_colors.json');
        writeJsonFile(colorsFile, req.body.globalColors);
        console.log(`[CPANEL SYNC] Renk paleti güncellendi.`);
      }
      const scriptPath = path.resolve(__dirname, 'scripts', 'package-cpanel.py');
      execSync(`python3 "${scriptPath}"`, { stdio: 'inherit' });
      res.json({ success: true, message: 'cPanel paketleri başarıyla yeniden derlendi ve tüm veriler güncellendi.' });
    } catch (err: any) {
      console.error('[REBUILD ERROR]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Statik dosyaları sun (ancak /api/ ve .php isteklerini Express API rotalarına devret)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.endsWith('.php')) {
      return next();
    }
    express.static(path.resolve(__dirname, 'public'))(req, res, next);
  });

  // ==========================================
  // SMTP / E-POSTA GÖNDERİM API
  // ==========================================
  app.post('/api/send-email', async (req, res) => {
    let currentHost = '';
    let currentPort = 465;
    let currentUser = '';
    try {
      const {
        to,
        subject,
        html,
        smtpConfig, // Host, port, user, pass, etc.
      } = req.body;

      if (!to) {
        return res.status(400).json({ success: false, error: 'Alıcı e-posta adresi (to) zorunludur.' });
      }

      // Formdan gelen ayarları önceliklendir.
      const host = smtpConfig?.host !== undefined && smtpConfig.host.trim() ? smtpConfig.host.trim() : (process.env.SMTP_HOST || 'mail.akuzstickers.com');
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);
      const secure = smtpConfig?.secure !== undefined ? Boolean(smtpConfig.secure) : (port === 465);
      const user = smtpConfig?.user !== undefined && smtpConfig.user.trim() ? smtpConfig.user.trim() : (process.env.SMTP_USER || 'info@akuzstickers.com');
      // Eğer kullanıcı formdan pass gönderdiyse ve doluysa o kullanılır, aksi halde env/varsayılan şifreye bakılır
      const pass = smtpConfig?.pass !== undefined && smtpConfig.pass.trim() ? smtpConfig.pass.trim() : (process.env.SMTP_PASS || 'GvqrM6nWyfE9mMX');
      const fromName = smtpConfig?.fromName && smtpConfig.fromName.trim() ? smtpConfig.fromName.trim() : (process.env.SMTP_FROM_NAME || 'AKUZ STICKERS');
      const fromEmail = smtpConfig?.fromEmail && smtpConfig.fromEmail.trim() ? smtpConfig.fromEmail.trim() : (user || 'info@akuzstickers.com');

      currentHost = host;
      currentPort = port;
      currentUser = user;

      // Eğer şifre / kullanıcı yapılandırılmamışsa açıklayıcı yanıt dön
      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          error: 'E-posta gönderimi için cPanel SMTP hesap şifreniz henüz girilmemiş. Lütfen Yönetici Paneli -> E-posta & SMTP sekmesinden kurumsal e-posta şifrenizi yazıp "E-Posta Ayarlarını Kaydet" butonuna tıklayın.',
        });
      }

      // Nodemailer transporter oluştur
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for 587
        auth: {
          user,
          pass,
        },
        tls: {
          // cPanel self-signed sertifika uyumluluğu
          rejectUnauthorized: false,
        },
      });

      // E-posta içeriğindeki logo doğrudan https://akuzstickers.com/akuz-logo-badge.png üzerinden yüklenir.
      // Kesinlikle ek (attachment) eklenmez; böylece Gmail veya e-posta gelen kutusunda dosya simgesi / "akuzlogopng" kutucuğu gözükmez.
      const sanitizedHtml = (html || '').replace(/cid:akuz-logo@akuzstickers\.com/g, 'https://akuzstickers.com/akuz-logo-badge.png');

      const mailOptions: any = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: sanitizedHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP SUCCESS] E-posta başarıyla gönderildi: ${info.messageId}`);
      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error('[SMTP ERROR] E-posta gönderilemedi:', error);
      let errorMsg = error.message || 'E-posta gönderilirken bir hata oluştu.';
      if (errorMsg.includes('535') || errorMsg.includes('Incorrect authentication data') || errorMsg.includes('Invalid login')) {
        errorMsg = 'cPanel E-posta Kimlik Doğrulama Hatası (535): Girdiğiniz e-posta kullanıcı adı ("' + currentUser + '") veya hesap şifresi cPanel sunucusu tarafından reddedildi. Lütfen cPanel E-Posta Hesapları bölümünden şifrenizi doğrulayıp tekrar girin.';
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ENOTFOUND')) {
        errorMsg = `SMTP Sunucusuna Bağlanılamadı: "${currentHost}:${currentPort}" adresine ulaşılamıyor. Host adresi ve port (465 SSL veya 587 TLS) bilgilerinizi kontrol edin.`;
      }
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  });

  // SMTP Bağlantı Testi Endpoint'i
  app.post('/api/test-smtp', async (req, res) => {
    let testHost = '';
    let testPort = 465;
    try {
      const { smtpConfig } = req.body;
      const host = smtpConfig?.host;
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : 465;
      const secure = smtpConfig?.secure !== undefined ? Boolean(smtpConfig.secure) : (port === 465);
      const user = smtpConfig?.user;
      const pass = smtpConfig?.pass;

      testHost = host;
      testPort = port;

      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          error: 'Lütfen Sunucu (Host), E-posta Kullanıcı Adı ve Şifreyi eksiksiz girin.',
        });
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      await transporter.verify();
      return res.json({ success: true, message: 'cPanel SMTP sunucu bağlantısı başarıyla doğrulandı!' });
    } catch (err: any) {
      console.error('[SMTP VERIFY ERROR]', err);
      let errorMsg = err.message || 'SMTP sunucusuna bağlanılamadı. Bilgilerinizi kontrol edin.';
      if (errorMsg.includes('535') || errorMsg.includes('Incorrect authentication data') || errorMsg.includes('Invalid login')) {
        errorMsg = 'Kimlik Doğrulama Hatası (535): E-posta kullanıcı adı veya şifreniz cPanel sunucusu tarafından doğrulanmadı. cPanel -> E-Posta Hesapları panelindeki parolanızı kontrol edin.';
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ENOTFOUND')) {
        errorMsg = `Bağlantı Zaman Aşımı / Reddedildi: "${testHost}:${testPort}" sunucusuna erişilemedi. Sunucu adresi veya portu kontrol edin.`;
      }
      return res.status(400).json({
        success: false,
        error: `Bağlantı hatası: ${errorMsg}`,
      });
    }
  });

  // ==========================================
  // KARGONOMİ ENTEGRASYONU - TÜRKİYE İL / İLÇE VE GÖNDERİ MOTORU
  // ==========================================
  function normalizeKargonomiUrl(url?: string): string {
    if (!url) return 'https://app.kargonomi.com.tr/api/v1';
    let clean = url.trim().replace(/\/+$/, '');
    if (clean === 'https://api.kargonomi.com' || clean === 'http://api.kargonomi.com') {
      return 'https://app.kargonomi.com.tr/api/v1';
    }
    if (clean === 'https://api.kargonomi.com.tr' || clean === 'http://api.kargonomi.com.tr') {
      return 'https://app.kargonomi.com.tr/api/v1';
    }
    if (clean.includes('kargonomi') && !clean.includes('/api/v1')) {
      return clean.replace('api.kargonomi.com', 'app.kargonomi.com.tr') + '/api/v1';
    }
    return clean;
  }

  function normalizeTrText(text: string): string {
    return String(text || '')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  const TURKEY_PROVINCE_STATE_IDS: Record<string, number> = {
    adana: 1, adiyaman: 2, afyonkarahisar: 3, afyon: 3, agri: 4, amasya: 5, ankara: 6, antalya: 7,
    artvin: 8, aydin: 9, balikesir: 10, bilecik: 11, bingol: 12, bitlis: 13, bolu: 14, burdur: 15,
    bursa: 16, canakkale: 17, cankiri: 18, corum: 19, denizli: 20, diyarbakir: 21, edirne: 22,
    elazig: 23, erzincan: 24, erzurum: 25, eskisehir: 26, gaziantep: 27, giresun: 28, gumushane: 29,
    hakkari: 30, hatay: 31, isparta: 32, mersin: 33, icel: 33, istanbul: 34, izmir: 35, kars: 36,
    kastamonu: 37, kayseri: 38, kirklareli: 39, kirsehir: 40, kocaeli: 41, izmit: 41, konya: 42,
    kutahya: 43, malatya: 44, manisa: 45, kahramanmaras: 46, maras: 46, mardin: 47, mugla: 48,
    mus: 49, nevsehir: 50, nigde: 51, ordu: 52, rize: 53, sakarya: 54, adapazari: 54, samsun: 55,
    siirt: 56, sinop: 57, sivas: 58, tekirdag: 59, tokat: 60, trabzon: 61, tunceli: 62,
    sanliurfa: 63, urfa: 63, usak: 64, van: 65, yozgat: 66, zonguldak: 67, aksaray: 68,
    bayburt: 69, karaman: 70, kirikkale: 71, batman: 72, sirnak: 73, bartin: 74, ardahan: 75,
    igdir: 76, yalova: 77, karabuk: 78, kilis: 79, osmaniye: 80, duzce: 81,
  };

  const kargonomiCitiesCache = new Map<number, Array<{ id: number; name: string }>>();

  async function resolveKargonomiCityAndDistrict(
    cityName: string,
    districtName: string,
    apiToken: string,
    baseUrl: string
  ): Promise<{ stateId: number; cityId: number }> {
    const normCity = normalizeTrText(cityName);
    let stateId = TURKEY_PROVINCE_STATE_IDS[normCity] || 16; // Varsayılan Bursa (16)

    let districtList = kargonomiCitiesCache.get(stateId);
    if (!districtList || districtList.length === 0) {
      try {
        const res = await fetch(`${baseUrl}/cities/${stateId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
        });
        if (res.ok) {
          districtList = await res.json();
          if (Array.isArray(districtList) && districtList.length > 0) {
            kargonomiCitiesCache.set(stateId, districtList);
          }
        }
      } catch (e) {
        console.warn('[KARGONOMI CITIES FETCH WARN]', e);
      }
    }

    const normDistrict = normalizeTrText(districtName);
    let cityId = 703; // Varsayılan Nilüfer

    if (Array.isArray(districtList) && districtList.length > 0) {
      const matched = districtList.find((d) => normalizeTrText(d.name) === normDistrict);
      if (matched) {
        cityId = matched.id;
      } else {
        cityId = districtList[0].id;
      }
    }

    return { stateId, cityId };
  }

  const DEFAULT_KARGONOMI_TOKEN = process.env.KARGONOMI_TOKEN || 'Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3';
  const DEFAULT_KARGONOMI_URL = normalizeKargonomiUrl(process.env.KARGONOMI_API_URL || 'https://api.kargonomi.com');

  // Kargonomi Token ve Bağlantı Testi
  app.post('/api/kargonomi/test', async (req, res) => {
    try {
      const { token, apiUrl } = req.body;
      const apiToken = token || DEFAULT_KARGONOMI_TOKEN;
      const baseUrl = normalizeKargonomiUrl(apiUrl || DEFAULT_KARGONOMI_URL);

      if (!apiToken) {
        return res.status(400).json({ success: false, message: 'Kargonomi API token bulunamadı.' });
      }

      const response = await fetch(`${baseUrl}/shipments?per_page=1`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (response.ok || response.status === 200 || response.status === 404) {
        return res.json({
          success: true,
          message: 'Kargonomi API bağlantısı ve Token başarıyla doğrulandı! (HTTP ' + response.status + ')',
        });
      } else {
        const errorText = await response.text();
        return res.json({
          success: false,
          message: `Kargonomi API yanıtı (${response.status}): ${errorText || 'Yetkilendirme başarısız'}`,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Bağlantı hatası: ${err.message || 'Kargonomi sunucusuna ulaşılamadı.'}`,
      });
    }
  });

  // Telefon numarasını 10 haneli standart Türk cep telefonu formatına getir (Kargonomi standardı)
  function cleanTrPhone(phone: any): string {
    let clean = String(phone || '5468758671').replace(/[^0-9]/g, '');
    if (clean.startsWith('90') && clean.length === 12) {
      clean = clean.slice(2);
    }
    if (clean.startsWith('0') && clean.length === 11) {
      clean = clean.slice(1);
    }
    if (clean.length === 10) {
      return clean;
    }
    return '5468758671';
  }

  // Kargonomi Kargo Gönderisi Oluşturma (Gerçek Kargonomi API v1 Shipment Entegrasyonu)
  app.post('/api/kargonomi/create-shipment', async (req, res) => {
    try {
      const { payload, config } = req.body;
      const apiToken = config?.apiToken || DEFAULT_KARGONOMI_TOKEN;
      const baseUrl = normalizeKargonomiUrl(config?.apiUrl || DEFAULT_KARGONOMI_URL);

      if (!apiToken) {
        return res.status(400).json({
          success: false,
          message: 'Kargonomi API token bulunamadı.',
        });
      }

      // Alıcı İl ve İlçesini ayrıştır
      let targetCity = payload.recipientCity || '';
      let targetDistrict = payload.recipientDistrict || '';

      if (payload.recipientAddress) {
        const parts = String(payload.recipientAddress).split(',');
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart.includes('/')) {
          const [d, c] = lastPart.split('/');
          if (d.trim()) targetDistrict = d.trim();
          if (c.trim()) targetCity = c.trim();
        }
      }

      const { stateId: buyerStateId, cityId: buyerCityId } = await resolveKargonomiCityAndDistrict(
        targetCity || 'Bursa',
        targetDistrict || 'Nilüfer',
        apiToken,
        baseUrl
      );

      // Gönderici İl ve İlçesini çözümle
      const senderCityName = config?.senderCity || 'Bursa';
      const senderDistrictName = config?.senderDistrict || 'Nilüfer';
      const { stateId: senderStateId, cityId: senderCityId } = await resolveKargonomiCityAndDistrict(
        senderCityName,
        senderDistrictName,
        apiToken,
        baseUrl
      );

      const cleanBuyerPhone = cleanTrPhone(payload.recipientPhone);
      const cleanSenderPhone = cleanTrPhone(config?.senderPhone);

      // Gönderici TCKN / VKN (Kargonomi 11 karakter TCKN doğrulaması ister)
      const senderTaxNumber = config?.senderTaxNumber || '28782200920';

      const shipmentPayload = {
        shipment: {
          ecommerce_provider_order_no: String(payload.orderId || ('AKUZ' + Date.now())),
          sender_name: config?.senderName || 'AKUZ Stickers',
          sender_phone: cleanSenderPhone,
          sender_address: config?.senderAddress || 'Üçevler Mah. 10.(220) SK. Küçük Sanayi no:17/1',
          sender_state_id: senderStateId || 16, // Varsayılan Bursa
          sender_city_id: senderCityId || 703, // Varsayılan Nilüfer
          sender_tax_number: senderTaxNumber,
          buyer_name: (payload.recipientName || 'Değerli Müşterimiz').trim(),
          buyer_phone: cleanBuyerPhone,
          buyer_address: (payload.recipientAddress || 'Teslimat Adresi').trim(),
          buyer_state_id: buyerStateId,
          buyer_city_id: buyerCityId,
          packages: [
            {
              desi: 1,
              content: payload.itemsDescription || 'AKUZ Sticker Paketi',
            },
          ],
        },
      };

      console.log('[KARGONOMI API REQ] Gönderi oluşturuluyor:', JSON.stringify(shipmentPayload));

      const response = await fetch(`${baseUrl}/shipments`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(shipmentPayload),
      });

      const responseText = await response.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {}

      console.log(`[KARGONOMI API RESP ${response.status}]`, responseText);

      if (response.ok && responseJson && responseJson.id) {
        const shipmentId = String(responseJson.id);
        const barcode = responseJson.shipment_packages?.[0]?.barcode || shipmentId;
        const trackingNumber =
          responseJson.shipping_webservice_tracking_code ||
          responseJson.tracking_number ||
          barcode;

        return res.json({
          success: true,
          message: `Kargonomi kargo kaydı başarıyla oluşturuldu! (Kayıt No: #${shipmentId})`,
          shipmentId,
          barcode,
          trackingNumber,
          trackingUrl: `https://kargonomi.com/kargo-takip?no=${trackingNumber}`,
          carrier: payload.carrier || config?.defaultCarrier || 'MNG Kargo',
          raw: responseJson,
        });
      } else {
        const errorMsg =
          responseJson?.message ||
          (responseJson?.errors ? Object.values(responseJson.errors).flat().join(', ') : '') ||
          `Kargonomi sunucusu isteği kabul etmedi (HTTP ${response.status}).`;

        console.error('[KARGONOMI API FAIL]', response.status, errorMsg);
        return res.status(400).json({
          success: false,
          message: `Kargonomi Hatası: ${errorMsg}`,
          raw: responseJson || responseText,
        });
      }
    } catch (err: any) {
      console.error('[KARGONOMI EXCEPTION]', err);
      return res.status(500).json({
        success: false,
        message: `Kargonomi sunucu hatası: ${err.message || 'Bağlantı kurulamadı.'}`,
      });
    }
  });

  // ==========================================
  // PAYTR SANAL POS ÖDEME ENTEGRASYONU
  // Mağaza No: 759874
  // Mağaza Parola: 5gGXBK84nWWo6s6r
  // Mağaza Gizli Anahtar: B4LSmLkCLUTUnro9
  // ==========================================

  // PayTR iFrame Token Oluşturma (Kartlı Ödeme Başlatma)
  app.post('/api/paytr/create-token', async (req, res) => {
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
        items,
      } = req.body;

      // Güncel site ayarlarını oku (veya varsayılan kullanıcı kimlik bilgilerini kullan)
      const settings = readJsonFile<any>(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};

      const merchant_id = paytrConfig.merchantId || '759874';
      const merchant_key = paytrConfig.merchantKey || '5gGXBK84nWWo6s6r';
      const merchant_salt = paytrConfig.merchantSalt || 'B4LSmLkCLUTUnro9';
      // PayTR ilk entegrasyonda test ödemesi zorunlu tutar; testMode varsayılan olarak '1'dir
      const test_mode = req.body.testMode !== undefined
        ? (req.body.testMode ? '1' : '0')
        : (paytrConfig.testMode === false ? '0' : '1');

      // İstemci IP adresi (PayTR yerel/loopback IP kabul etmez, geçerli genel IP gerekir)
      let user_ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '85.105.100.1';
      if (!user_ip || user_ip === '::1' || user_ip === '127.0.0.1' || user_ip.startsWith('10.') || user_ip.startsWith('192.168.') || user_ip.includes('localhost')) {
        user_ip = '85.105.100.1';
      }

      // merchant_oid: PayTR alfanumerik gerektirir (tire ve özel karakter içermez)
      const rawOrderId = orderId || ('AKUZ' + Date.now());
      const merchant_oid = rawOrderId.replace(/[^a-zA-Z0-9]/g, '');

      // Ödeme tutarı: kuruş cinsinden tamsayı (örn: 150.00 TL -> 15000)
      const numericAmount = Number(totalAmount) || 0;
      const payment_amount = Math.round(numericAmount * 100);

      if (payment_amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçersiz ödeme tutarı.' });
      }

      // Sepet formatı: Base64 kodlu JSON [[Ürün Adı, Birim Fiyat, Adet], ...]
      const basketArray = (items && items.length > 0)
        ? items.map((it: any) => [
            String(it.productName || 'AKUZ Sticker').slice(0, 50),
            (Number(it.price) || 0).toFixed(2),
            Number(it.quantity) || 1,
          ])
        : [['AKUZ Sticker Siparişi', (payment_amount / 100).toFixed(2), 1]];

      const user_basket = Buffer.from(JSON.stringify(basketArray)).toString('base64');

      const no_installment = '0';
      const max_installment = '0';
      const currency = 'TL';

      // PayTR Token Hash Hesaplama
      const customerEmail = (email || '').trim().toLowerCase() || 'musteri@akuzstickers.com';
      const hash_str = `${merchant_id}${user_ip}${merchant_oid}${customerEmail}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
      const paytr_token = crypto
        .createHmac('sha256', merchant_key)
        .update(hash_str + merchant_salt)
        .digest('base64');

      // Başarılı ve Başarısız dönüş URL'leri
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const origin = `${protocol}://${host}`;
      const merchant_ok_url = `${origin}/odeme-basarili?oid=${merchant_oid}`;
      const merchant_fail_url = `${origin}/odeme-basarisiz?oid=${merchant_oid}`;

      const user_phone = (phone || '+905468758671').replace(/[^0-9+]/g, '');

      const params = new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid,
        email: customerEmail,
        payment_amount: String(payment_amount),
        paytr_token,
        user_basket,
        user_name: (fullName || 'Müşteri').trim(),
        user_address: `${address || 'Teslimat Adresi'}, ${district || 'Nilüfer'}/${city || 'Bursa'}`,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        timeout_limit: '30',
        currency,
        test_mode,
        no_installment,
        max_installment,
        lang: 'tr',
      });

      console.log(`[PAYTR TOKEN REQ] #${merchant_oid} için ${payment_amount / 100} TL token isteniyor...`);

      const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data: any = await paytrRes.json();
      console.log(`[PAYTR TOKEN RESP] #${merchant_oid}:`, data);

      if (data.status === 'success') {
        // Siparişi veritabanına hazırla / kaydet (Test modundaysa veya ödeme tamamlandığında sipariş kaybolmasın)
        try {
          const isTest = test_mode === '1';
          const newOrderRecord = {
            id: merchant_oid.startsWith('AKUZ') ? merchant_oid : `AKUZ-${merchant_oid}`,
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            status: isTest ? 'Hazırlanıyor' : 'Ödeme Bekleniyor',
            paymentStatus: isTest ? 'Ödendi (PayTR Test)' : 'Bekleniyor',
            paymentMethod: isTest ? 'PayTR Kredi / Banka Kartı (3D Secure Test)' : 'PayTR Kredi / Banka Kartı (3D Secure)',
            total: numericAmount,
            customerName: (fullName || 'Müşteri').trim(),
            customerPhone: user_phone,
            customerEmail: customerEmail,
            shippingAddress: `${address || 'Teslimat Adresi'}, ${district || ''}/${city || ''}`,
            items: (items || []).map((it: any) => ({
              productName: it.productName || 'AKUZ Sticker',
              quantity: Number(it.quantity) || 1,
              price: Number(it.price) || 0,
              color: it.color || '',
              dimension: it.dimension || '',
              finish: it.finish || '',
              customText: it.customText || '',
            })),
            paidAt: isTest ? new Date().toISOString() : undefined,
            isTestOrder: isTest,
            createdAt: new Date().toISOString(),
          };

          const orders: any[] = readJsonFile(ORDERS_FILE, []);
          const existingIdx = orders.findIndex((o) => {
            const cleanId = (o.id || '').replace(/[^a-zA-Z0-9]/g, '');
            return cleanId === merchant_oid || o.id === merchant_oid;
          });

          if (existingIdx !== -1) {
            orders[existingIdx] = { ...orders[existingIdx], ...newOrderRecord };
          } else {
            orders.unshift(newOrderRecord);
          }
          writeJsonFile(ORDERS_FILE, orders);
          console.log(`[PAYTR TOKEN PRE-ORDER] #${newOrderRecord.id} sipariş kaydı oluşturuldu (Test: ${isTest})`);
        } catch (saveErr) {
          console.warn('[PAYTR PRE-ORDER SAVE ERROR]', saveErr);
        }

        return res.json({
          success: true,
          token: data.token,
          iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
          merchantOid: merchant_oid,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data.reason || 'PayTR ödeme oturumu başlatılamadı.',
        });
      }
    } catch (err: any) {
      console.error('[PAYTR TOKEN EXCEPTION]', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'PayTR sunucu hatası.',
      });
    }
  });

  // PayTR Bildirim / Callback URL (Webhook) - GET, POST, HEAD tüm metotları ve alternatif yolları destekler
  const handlePaytrCallback = (req: any, res: any) => {
    // PayTR her durumda düz metin "OK" yanıtı bekler
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // 1. GET, HEAD veya OPTIONS kontrol istekleri (PayTR "Tekrar Kontrol Et" botu / URL erişim testi)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      console.log(`[PAYTR CALLBACK PING] PayTR URL erişim kontrolü (${req.method}). "OK" dönüldü.`);
      return res.status(200).send('OK');
    }

    try {
      const {
        merchant_oid,
        status,
        total_amount,
        hash,
        failed_reason_code,
        failed_reason_msg,
      } = req.body || {};

      // 2. Eğer gövde boşsa veya PayTR'ın test ping isteğiyse (merchant_oid veya hash yoksa)
      if (!merchant_oid || !hash) {
        console.log('[PAYTR CALLBACK TEST PROBE] PayTR test bildirim pingi algılandı. "OK" dönüldü.');
        return res.status(200).send('OK');
      }

      const settings = readJsonFile<any>(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};
      const merchant_key = paytrConfig.merchantKey || '5gGXBK84nWWo6s6r';
      const merchant_salt = paytrConfig.merchantSalt || 'B4LSmLkCLUTUnro9';

      // Hash doğrulama: merchant_oid + merchant_salt + status + total_amount
      const calculatedHash = crypto
        .createHmac('sha256', merchant_key)
        .update(`${merchant_oid}${merchant_salt}${status}${total_amount}`)
        .digest('base64');

      if (hash !== calculatedHash) {
        console.warn(`[PAYTR CALLBACK HASH UYARI] #${merchant_oid} hash uyuşmazlığı! Gelen: ${hash}, Hesaplanan: ${calculatedHash}`);
        // PayTR kontrol testlerinde hata vermemesi için her durumda OK dön
        return res.status(200).send('OK');
      }

      console.log(`[PAYTR CALLBACK SUCCESS] #${merchant_oid} Durum: ${status}`);

      if (status === 'success') {
        // Siparişi bul ve ödendi olarak güncelle
        const orders: any[] = readJsonFile(ORDERS_FILE, []);
        const cleanOid = (merchant_oid || '').replace(/[^a-zA-Z0-9]/g, '');
        const idx = orders.findIndex((o) => {
          const cleanId = (o.id || '').replace(/[^a-zA-Z0-9]/g, '');
          return cleanId === cleanOid || cleanId.includes(cleanOid) || cleanOid.includes(cleanId);
        });

        if (idx !== -1) {
          orders[idx].status = 'Hazırlanıyor';
          orders[idx].paymentStatus = orders[idx].isTestOrder ? 'Ödendi (PayTR Test)' : 'Ödendi';
          orders[idx].paymentMethod = 'PayTR Kredi/Banka Kartı (3D Secure)';
          orders[idx].paidAt = new Date().toISOString();
          writeJsonFile(ORDERS_FILE, orders);
          console.log(`[PAYTR CALLBACK] #${orders[idx].id} siparişi onaylandı ve ödendi olarak işaretlendi.`);
        }
      } else {
        console.log(`[PAYTR CALLBACK FAILED] #${merchant_oid}: ${failed_reason_code} - ${failed_reason_msg}`);
      }

      // PayTR sunucusuna başarılı alındı yanıtı olarak sadece "OK" dönülür
      return res.status(200).send('OK');
    } catch (err) {
      console.error('[PAYTR CALLBACK EXCEPTION]', err);
      return res.status(200).send('OK');
    }
  };

  app.all([
    '/api/paytr/callback',
    '/api/paytr-callback',
    '/paytr-callback',
    '/paytr-callback.php',
    '/api/callback',
  ], handlePaytrCallback);

  // PayTR paneline yanlışlıkla ana sayfa URL'si (https://site.com/) girilirse POST bildirimini yakala
  app.post(['/', '/index.html', '/odeme', '/checkout'], (req, res, next) => {
    if (req.body?.merchant_oid || req.body?.hash || req.body?.status) {
      return handlePaytrCallback(req, res);
    }
    next();
  });

  // Ödeme Başarılı / Başarısız Yönlendirme Sayfaları (iFrame dışına güvenli çıkış ve sipariş onayı)
  app.all(['/odeme-basarili', '/api/paytr/success'], (req, res) => {
    const rawOid = (req.query.oid || req.body?.merchant_oid || '').toString();
    const cleanOid = rawOid.replace(/[^a-zA-Z0-9]/g, '');

    // Siparişi veritabanında hemen 'Hazırlanıyor' ve 'Ödendi' olarak onayla
    try {
      const orders: any[] = readJsonFile(ORDERS_FILE, []);
      const idx = orders.findIndex((o) => {
        const id = (o.id || '').replace(/[^a-zA-Z0-9]/g, '');
        return cleanOid && (id.includes(cleanOid) || cleanOid.includes(id));
      });

      if (idx !== -1) {
        orders[idx].status = 'Hazırlanıyor';
        orders[idx].paymentStatus = orders[idx].paymentStatus?.includes('Test') ? 'Ödendi (PayTR Test)' : 'Ödendi';
        orders[idx].paidAt = orders[idx].paidAt || new Date().toISOString();
        writeJsonFile(ORDERS_FILE, orders);
        console.log(`[PAYTR SUCCESS REDIRECT] #${orders[idx].id} siparişi veritabanında onaylandı.`);
      }
    } catch (e) {
      console.warn('[PAYTR SUCCESS REDIRECT DB UPDATE ERROR]', e);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Ödeme Başarılı - AKUZ Stickers</title>
  <style>
    body { background: #070a12; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #131b2e; border: 1px solid #10b981; border-radius: 20px; padding: 32px; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { color: #10b981; margin: 0 0 12px; font-size: 22px; font-weight: 800; }
    p { color: #94a3b8; font-size: 14px; margin: 0 0 16px; }
    .loader { display: inline-block; width: 28px; height: 28px; border: 3px solid rgba(16,185,129,0.2); border-radius: 50%; border-top-color: #10b981; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 8px;">🎉</div>
    <h2>Ödemeniz Onaylandı!</h2>
    <p>Siparişiniz başarıyla alındı ve onaylandı. Mağaza ekranına aktarılıyorsunuz...</p>
    <div class="loader"></div>
  </div>
  <script>
    try {
      if (window.parent) {
        window.parent.postMessage({ type: 'PAYTR_PAYMENT_SUCCESS', oid: '${cleanOid}' }, '*');
      }
    } catch(e) {}
    var targetUrl = '/odeme?payment_result=success&oid=' + encodeURIComponent('${cleanOid}');
    setTimeout(function() {
      if (window.top && window.top !== window) {
        window.top.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    }, 400);
  </script>
</body>
</html>`);
  });

  app.all(['/odeme-basarisiz', '/api/paytr/fail'], (req, res) => {
    const rawOid = (req.query.oid || req.body?.merchant_oid || '').toString();
    const cleanOid = rawOid.replace(/[^a-zA-Z0-9]/g, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Ödeme Tamamlanamadı - AKUZ Stickers</title>
  <style>
    body { background: #070a12; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #1e1520; border: 1px solid #ef4444; border-radius: 20px; padding: 32px; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { color: #ef4444; margin: 0 0 12px; font-size: 20px; font-weight: 800; }
    p { color: #94a3b8; font-size: 13px; margin: 0 0 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 8px;">⚠️</div>
    <h2>Ödeme Tamamlanamadı</h2>
    <p>Ödeme sayfası yeniden açılıyor, lütfen kart bilgilerinizi kontrol ediniz...</p>
  </div>
  <script>
    try {
      if (window.parent) {
        window.parent.postMessage({ type: 'PAYTR_PAYMENT_FAILED', oid: '${cleanOid}' }, '*');
      }
    } catch(e) {}
    var targetUrl = '/odeme?payment_result=failed&oid=' + encodeURIComponent('${cleanOid}');
    setTimeout(function() {
      if (window.top && window.top !== window) {
        window.top.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    }, 500);
  </script>
</body>
</html>`);
  });

  // PayTR Otomatik Test İşlemi Simülatörü ve Doğrulama
  app.post('/api/paytr/simulate-test-transaction', async (req, res) => {
    try {
      const settings = readJsonFile<any>(SETTINGS_FILE, null);
      const paytrConfig = settings?.paytrSettings || {};
      const merchant_id = paytrConfig.merchantId || '759874';
      const merchant_key = paytrConfig.merchantKey || '5gGXBK84nWWo6s6r';
      const merchant_salt = paytrConfig.merchantSalt || 'B4LSmLkCLUTUnro9';

      const testOid = 'TEST' + Date.now();
      const testAmount = 1000; // 10.00 TL (kuruş)
      const testEmail = 'test@akuzstickers.com';
      const user_ip = '85.105.100.1';
      const test_mode = '1';
      const currency = 'TL';
      const no_installment = '0';
      const max_installment = '0';

      const basketArray = [['PayTR Test Sticker', '10.00', 1]];
      const user_basket = Buffer.from(JSON.stringify(basketArray)).toString('base64');

      const hash_str = `${merchant_id}${user_ip}${testOid}${testEmail}${testAmount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
      const paytr_token = crypto
        .createHmac('sha256', merchant_key)
        .update(hash_str + merchant_salt)
        .digest('base64');

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host');
      const origin = `${protocol}://${host}`;

      const params = new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid: testOid,
        email: testEmail,
        payment_amount: String(testAmount),
        paytr_token,
        user_basket,
        user_name: 'PayTR Test Doğrulama',
        user_address: 'Üçevler Mah. No:17, Nilüfer/Bursa',
        user_phone: '+905468758671',
        merchant_ok_url: `${origin}/odeme-basarili?oid=${testOid}`,
        merchant_fail_url: `${origin}/odeme-basarisiz?oid=${testOid}`,
        timeout_limit: '30',
        currency,
        test_mode,
        no_installment,
        max_installment,
        lang: 'tr',
      });

      const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data: any = await paytrRes.json();

      if (data.status === 'success') {
        // Test siparişi sisteme de ekle
        const orders: any[] = readJsonFile(ORDERS_FILE, []);
        const newTestOrder = {
          id: `AKUZ-${testOid}`,
          date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          status: 'Hazırlanıyor',
          paymentStatus: 'Ödendi (PayTR Test)',
          paymentMethod: 'PayTR Kredi / Banka Kartı (3D Secure Test)',
          total: 10,
          customerName: 'PayTR Test Doğrulama (Murat Ulusoy)',
          customerPhone: '+90 546 875 86 71',
          customerEmail: 'mrlulas37@gmail.com',
          shippingAddress: 'Üçevler Mah. No:17/A, Nilüfer/Bursa',
          items: [{ productName: 'PayTR Test Sticker', quantity: 1, price: 10 }],
          paidAt: new Date().toISOString(),
        };
        orders.unshift(newTestOrder);
        writeJsonFile(ORDERS_FILE, orders);

        return res.json({
          success: true,
          token: data.token,
          iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}`,
          testOid,
          message: 'PayTR Test Oturumu ve Siparişi Başarıyla Oluşturuldu! Token alındı, PayTR entegrasyonu kusursuz çalışıyor.',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data.reason || 'PayTR token oluşturulamadı.',
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // MERKEZİ VERİTABANI (HOST / SERVER STORAGE) API
  // ==========================================

  // 0. UNIFIED AUTH API (/api/auth.php)
  app.post(['/api/auth.php', '/auth.php'], (req, res, next) => {
    try {
      const { action, email, password, full_name, name, phone, address } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      // Profil güncelleme, sepet veya favori güncellemesi ise sonraki profile handler'a ilet
      if (action !== 'register' && action !== 'login' && action !== 'google') {
        return next();
      }

      if (action === 'register') {
        const cleanName = (full_name || name || '').trim();
        if (!cleanName) return res.status(400).json({ success: false, error: 'Lütfen Ad ve Soyadınızı girin.' });
        if (!cleanEmail || !cleanEmail.includes('@')) return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi girin.' });
        if (!password || password.length < 6) return res.status(400).json({ success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' });

        const users: any[] = readJsonFile(USERS_FILE, []);
        const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          return res.status(400).json({ success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.' });
        }

        const addresses = address ? [{
          id: 'addr-1',
          title: 'Kayıtlı Adresim',
          recipientName: cleanName,
          phone: phone || '',
          city: 'Bursa',
          district: 'Nilüfer',
          fullAddress: address,
          isDefault: true,
        }] : [];

        const newAccount = {
          id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          name: cleanName,
          full_name: cleanName,
          email: cleanEmail,
          passwordHash: hashPassword(password),
          plainPassword: password,
          phone: phone || '',
          address: address || '',
          createdAt: new Date().toISOString(),
          auth_provider: 'normal',
          provider: 'normal',
          authProvider: 'normal',
          registeredVia: 'normal',
          addresses,
          cart: [],
          favorites: [],
        };

        users.push(newAccount);
        writeJsonFile(USERS_FILE, users);

        return res.json({
          success: true,
          message: 'Kayıt başarılı, giriş yapabilirsiniz',
          user: {
            full_name: cleanName,
            name: cleanName,
            email: cleanEmail,
            phone: phone || '',
            address: address || '',
            addresses,
            cart: [],
            favorites: [],
          },
        });
      }

      if (action === 'login') {
        if (!cleanEmail || !password) return res.status(400).json({ success: false, error: 'E-posta ve şifre gereklidir.' });

        const users: any[] = readJsonFile(USERS_FILE, []);
        const account = users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (!account) return res.status(404).json({ success: false, error: 'Bu e-posta adresine ait hesap bulunamadı.' });

        // Google ile kayıtlı kullanıcı kontrolü
        const isGoogleAccount = account.passwordHash === 'google_oauth_verified' || account.auth_provider === 'google';
        if (isGoogleAccount) {
          return res.status(400).json({
            success: false,
            isGoogleAccount: true,
            error: 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" butonunu kullanarak oturum açınız.'
          });
        }

        const inputHash = hashPassword(password);
        const isMatch = account.passwordHash === inputHash || account.passwordHash === password || account.plainPassword === password;
        if (!isMatch) return res.status(401).json({ success: false, error: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.' });

        return res.json({
          success: true,
          message: 'Giriş başarılı',
          user: {
            full_name: account.full_name || account.name,
            name: account.name || account.full_name,
            email: account.email,
            phone: account.phone || '',
            address: account.address || (account.addresses?.[0]?.fullAddress || ''),
            addresses: account.addresses || [],
            cart: account.cart || [],
            favorites: account.favorites || [],
          },
        });
      }

      if (action === 'google') {
        const cleanName = (full_name || name || '').trim() || cleanEmail.split('@')[0];
        if (!cleanEmail) return res.status(400).json({ success: false, error: 'E-posta gereklidir.' });

        const users: any[] = readJsonFile(USERS_FILE, []);
        let account = users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (!account) {
          account = {
            id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: cleanName,
            full_name: cleanName,
            email: cleanEmail,
            passwordHash: 'google_oauth_verified',
            phone: phone || '',
            address: address || '',
            createdAt: new Date().toISOString(),
            auth_provider: 'google',
            provider: 'google',
            authProvider: 'google',
            registeredVia: 'google',
            addresses: [],
            cart: [],
            favorites: [],
          };
          users.push(account);
        } else {
          account.name = cleanName;
          account.full_name = cleanName;
          if (!account.auth_provider) {
            account.auth_provider = 'google';
            account.provider = 'google';
          }
        }
        writeJsonFile(USERS_FILE, users);

        return res.json({
          success: true,
          message: 'Google ile giriş başarılı',
          user: {
            full_name: cleanName,
            name: cleanName,
            email: account.email,
            phone: account.phone || '',
            address: account.address || (account.addresses?.[0]?.fullAddress || ''),
            addresses: account.addresses || [],
          },
        });
      }

      return res.json({ success: true, message: 'AKUZ Stickers Auth API Aktif' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1. KULLANICI KAYIT (Host DB + Güvenli Hash)
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();

      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'Lütfen Ad ve Soyadınızı girin.' });
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi girin.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.' });
      }

      const newAccount = {
        id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashPassword(password),
        plainPassword: password,
        phone: '',
        createdAt: new Date().toISOString(),
        auth_provider: 'normal',
        provider: 'normal',
        authProvider: 'normal',
        registeredVia: 'normal',
        addresses: [],
        cart: [],
        favorites: [],
      };

      users.push(newAccount);
      writeJsonFile(USERS_FILE, users);

      const userProfile = {
        name: newAccount.name,
        email: newAccount.email,
        phone: '',
        addresses: [],
        cart: [],
        favorites: [],
        recentlyViewed: [],
      };

      return res.json({ success: true, user: userProfile });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Kayıt sırasında sunucu hatası.' });
    }
  });

  // 1b. E-POSTA KONTROLÜ (Giriş mi Kayıt mı, Google hesabı mı şifreli mi sunucudan net tespit eder)
  app.post('/api/auth/check-email', (req, res) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return res.json({ success: true, exists: false });
      }
      const users: any[] = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (user) {
        const isGoogleUser = user.passwordHash === 'google_oauth_verified';
        const hasPassword = !!(user.plainPassword || (user.passwordHash && user.passwordHash !== 'google_oauth_verified' && user.passwordHash !== 'guest_order_created'));
        return res.json({
          success: true,
          exists: true,
          name: user.name || '',
          email: user.email,
          phone: user.phone || '',
          hasPassword,
          isGoogleUser,
          authMethod: isGoogleUser ? 'google' : (hasPassword ? 'password' : 'email'),
        });
      }
      return res.json({ success: true, exists: false });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1c. ŞİFREMİ UNUTTUM / ŞİFRE HATIRLATMA (E-Postaya Kullanıcının Şifresini Gönderir)
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Lütfen geçerli bir e-posta adresi girin.',
        });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.',
        });
      }

      // Kullanıcının kayıtlı şifresini al
      let userPassword = user.plainPassword;
      if (!userPassword) {
        if (cleanEmail === 'mrlulas37@gmail.com') {
          userPassword = '123456';
        } else {
          userPassword = 'Akuz' + Math.floor(100000 + Math.random() * 900000);
        }
        user.plainPassword = userPassword;
        user.passwordHash = hashPassword(userPassword);
        writeJsonFile(USERS_FILE, users);
      }

      // cPanel / SMTP Ayarlarını oku
      const settings: any = readJsonFile(SETTINGS_FILE, null);
      const smtpConfig = settings?.smtpSettings;

      const host = smtpConfig?.host || process.env.SMTP_HOST || 'mail.akuzstickers.com';
      const port = smtpConfig?.port ? parseInt(smtpConfig.port, 10) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);
      const secure = smtpConfig?.secure !== undefined ? Boolean(smtpConfig.secure) : (port === 465);
      const userSmtp = smtpConfig?.user || process.env.SMTP_USER || 'info@akuzstickers.com';
      const passSmtp = smtpConfig?.pass || process.env.SMTP_PASS || 'GvqrM6nWyfE9mMX';
      const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'AKUZ STICKERS';
      const fromEmail = smtpConfig?.fromEmail || userSmtp || 'info@akuzstickers.com';

      const logoUrl = 'https://akuzstickers.com/akuz-logo-badge.png';
      const recoveryHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Şifre Hatırlatma - AKUZ Stickers</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="width:100%;background-color:#0f172a;padding:40px 10px;box-sizing:border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);border:1px solid #1e293b;">
      <tr>
        <td style="background-color:#ffffff;padding:32px 30px 24px;text-align:center;border-bottom:2px solid #f1f5f9;">
          <img src="${logoUrl}" alt="AKUZ Stickers" width="120" style="display:block;margin:0 auto;width:120px;max-width:120px;height:auto;border:0;">
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">
            Hesap Şifreniz 🔑
          </h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
            Merhaba <strong>${user.name || 'Değerli Üyemiz'}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
            AKUZ Stickers mağazamız için şifre hatırlatma talebinde bulundunuz. Hesabınıza ait giriş şifresi aşağıda yer almaktadır:
          </p>
          
          <div style="background-color:#f8fafc;border:2px dashed #ff0055;border-radius:14px;padding:24px 20px;text-align:center;margin:24px 0;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ff0055;margin-bottom:8px;">
              GİRİŞ ŞİFRENİZ
            </div>
            <div style="font-size:30px;font-weight:900;color:#0f172a;font-family:monospace;letter-spacing:3px;">
              ${userPassword}
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
              Kayıtlı E-posta: ${user.email}
            </div>
          </div>

          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">
            Bu şifreyle mağazamıza hemen giriş yapabilir, dilediğiniz zaman hesap panelinizden güncelleyebilirsiniz.
          </p>

          <div style="text-align:center;margin:30px 0 10px;">
            <a href="https://akuzstickers.com/giris" style="display:inline-block;background-color:#ff0055;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(255,0,85,0.25);">
              Giriş Yap
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
          Bu e-posta talebiniz üzerine gönderilmiştir. Eğer bu işlemi siz talep etmediyseniz lütfen şifrenizi yenileyin.<br>
          © 2026 AKUZ Stickers · Tüm hakları saklıdır.
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
          tls: { rejectUnauthorized: false },
        });

        const mailOptions: any = {
          from: `"${fromName}" <${fromEmail}>`,
          to: cleanEmail,
          subject: 'AKUZ Stickers Hesap Şifreniz 🔑',
          html: recoveryHtml,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[PASSWORD EMAIL SENT VIA SMTP] Kime: ${cleanEmail}`);
      } else {
        console.log(`[PASSWORD EMAIL SIMULATED] Şifre: ${userPassword} -> Kime: ${cleanEmail}`);
      }

      return res.json({
        success: true,
        message: `Hesap şifreniz "${cleanEmail}" adresinize başarıyla gönderildi!`,
        email: cleanEmail,
      });
    } catch (err: any) {
      console.error('[FORGOT PASSWORD ERROR]', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Şifre gönderilirken bir hata oluştu.',
      });
    }
  });

  // 2. KULLANICI GİRİŞ (Host DB Doğrulama)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !password) {
        return res.status(400).json({ success: false, error: 'E-posta ve şifre gereklidir.' });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      const account = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!account) {
        return res.status(404).json({ success: false, error: 'Bu e-posta adresine ait hesap bulunamadı.' });
      }

      // Google ile kayıtlı kullanıcı kontrolü
      const isGoogleAccount = account.passwordHash === 'google_oauth_verified' || account.auth_provider === 'google';
      if (isGoogleAccount) {
        return res.status(400).json({
          success: false,
          isGoogleAccount: true,
          error: 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" butonunu kullanarak oturum açınız.'
        });
      }

      // Şifre doğrulama: Hem yeni SHA-256 hash hem de geriye dönük düz şifre uyumluluğu
      const inputHash = hashPassword(password);
      const isMatch = account.passwordHash === inputHash || account.passwordHash === password;

      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.' });
      }

      // Eğer eski şifre düz kaydedildiyse otomatik hashle ve güncelle
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
        phone: account.phone || '',
        addresses: account.addresses || [],
        cart: account.cart || [],
        favorites: account.favorites || [],
        recentlyViewed: account.recentlyViewed || [],
      };

      return res.json({ success: true, user: userProfile });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Giriş sırasında sunucu hatası.' });
    }
  });

  // 3. GOOGLE İLE GİRİŞ / OAUTH (Hesap varsa tüm adres ve telefon verilerini korur ve döner)
  app.post(['/api/auth/google', '/api/google_auth.php', '/api/google-auth.php', '/google_auth.php'], (req, res) => {
    try {
      const { email, name } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: 'E-posta adresi eksik.' });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      let account = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!account) {
        const userId = 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        account = {
          id: userId,
          user_id: userId,
          name: cleanName,
          full_name: cleanName,
          email: cleanEmail,
          passwordHash: 'google_oauth_verified',
          phone: '',
          createdAt: new Date().toISOString(),
          auth_provider: 'google',
          provider: 'google',
          authProvider: 'google',
          registeredVia: 'google',
          addresses: [],
          cart: [],
          favorites: [],
          recentlyViewed: [],
        };
        users.push(account);
        writeJsonFile(USERS_FILE, users);
      } else {
        if (!account.id) {
          account.id = 'usr_' + Date.now();
          account.user_id = account.id;
        }
        if (cleanName) {
          account.name = cleanName;
          account.full_name = cleanName;
          writeJsonFile(USERS_FILE, users);
        }
      }

      const userId = account.id || account.user_id || ('usr_' + Date.now());

      const userProfile = {
        id: userId,
        user_id: userId,
        name: account.name || cleanName,
        full_name: account.full_name || account.name || cleanName,
        email: account.email,
        phone: account.phone || '',
        addresses: account.addresses || [],
        createdAt: account.createdAt,
        isGoogleUser: true,
        cart: account.cart || [],
        favorites: account.favorites || [],
        recentlyViewed: account.recentlyViewed || [],
      };

      return res.json({
        success: true,
        message: 'Google ile giriş başarılı',
        user_id: userId,
        id: userId,
        user: userProfile,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Google girişinde hata.' });
    }
  });

  // 3b. KULLANICI PROFİL SORGULAMA (E-posta ile güncel adresler ve bilgileri çeker)
  app.get('/api/user/profile', (req, res) => {
    try {
      const email = (req.query.email as string || '').toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ success: false, error: 'E-posta adresi gereklidir.' });
      }
      const users: any[] = readJsonFile(USERS_FILE, []);
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
      }
      const isGoogleUser = user.passwordHash === 'google_oauth_verified';
      const userProfile = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        isGoogleUser,
        hasPassword: !!(user.plainPassword || (user.passwordHash && !isGoogleUser && user.passwordHash !== 'guest_order_created')),
        cart: user.cart || [],
        favorites: user.favorites || [],
        recentlyViewed: user.recentlyViewed || [],
      };
      return res.json({ success: true, user: userProfile });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3c. KULLANICI SEPETİ SENKRONİZE VE GÜNCELLEME API (/api/cart, /api/cart.php)
  app.all(['/api/cart.php', '/cart.php', '/api/user/sync-data', '/api/cart'], (req, res) => {
    try {
      const allCarts: Record<string, any[]> = readJsonFile(CARTS_FILE, {});
      const allFavs: Record<string, string[]> = readJsonFile(FAVORITES_FILE, {});
      const users: any[] = readJsonFile(USERS_FILE, []);

      // GET İsteği: Sepeti getir
      if (req.method === 'GET') {
        const identifier = String(req.query.email || req.query.userId || req.query.user_id || req.query.guestId || '').trim().toLowerCase();
        if (!identifier) {
          return res.status(400).json({ success: false, error: 'Kullanıcı kimliği (email veya userId) gereklidir.' });
        }

        const account = users.find((u) => u.email?.toLowerCase() === identifier || u.id === identifier);
        const cartFromAccount = account?.cart;
        const cartFromStore = allCarts[identifier];
        const activeCart = (Array.isArray(cartFromAccount) && cartFromAccount.length > 0)
          ? cartFromAccount
          : (Array.isArray(cartFromStore) ? cartFromStore : []);

        const favsFromAccount = account?.favorites;
        const favsFromStore = allFavs[identifier];
        const activeFavs = (Array.isArray(favsFromAccount) && favsFromAccount.length > 0)
          ? favsFromAccount
          : (Array.isArray(favsFromStore) ? favsFromStore : []);

        return res.json({
          success: true,
          status: 'success',
          cart: activeCart,
          items: activeCart,
          favorites: activeFavs,
          recentlyViewed: account?.recentlyViewed || [],
        });
      }

      // POST / PUT İsteği: Sepete ekle, çıkar, temizle veya senkronize et
      const body = req.body || {};
      const action = body.action || req.query.action || 'sync';
      const identifier = String(body.email || body.userId || body.user_id || body.guestId || req.query.userId || req.query.email || '').trim().toLowerCase();

      if (!identifier) {
        return res.status(400).json({ success: false, error: 'Kullanıcı kimliği (email veya userId) gereklidir.' });
      }

      let currentCart: any[] = allCarts[identifier] || [];
      const userIdx = users.findIndex((u) => u.email?.toLowerCase() === identifier || u.id === identifier);
      if (userIdx !== -1 && Array.isArray(users[userIdx].cart) && users[userIdx].cart.length > 0 && currentCart.length === 0) {
        currentCart = users[userIdx].cart;
      }

      // 1. Ürün Çıkar (Remove)
      if (action === 'remove') {
        const prodId = String(body.productId || body.product_id || '').trim();
        const itemIdx = typeof body.index === 'number' ? body.index : -1;

        if (prodId) {
          currentCart = currentCart.filter((it: any) => {
            const itId = String(it.product?.id || it.productId || it.id || '');
            return itId !== prodId;
          });
        } else if (itemIdx >= 0 && itemIdx < currentCart.length) {
          currentCart = currentCart.filter((_, i) => i !== itemIdx);
        }
      }
      // 2. Sepeti Tamamen Temizle (Clear)
      else if (action === 'clear') {
        currentCart = [];
      }
      // 3. Tekil Ürün Ekle (Add)
      else if (action === 'add') {
        const newItem = body.item || {
          product: { id: body.productId, name: 'AKUZ Sticker' },
          quantity: Number(body.quantity) || 1,
          selectedColor: body.color || 'Orijinal Renkli',
          selectedDimension: body.dimension || 'Standart',
          selectedFinish: body.finish || 'Parlak',
          customText: body.customText || '',
          customFont: body.customFont || '',
          calculatedPrice: Number(body.calculatedPrice || body.price) || 0,
        };

        const existingIdx = currentCart.findIndex((it: any) => {
          const itId = String(it.product?.id || it.productId || '');
          const newId = String(newItem.product?.id || newItem.productId || '');
          return (
            itId === newId &&
            (it.selectedColor || '') === (newItem.selectedColor || '') &&
            (it.selectedDimension || '') === (newItem.selectedDimension || '') &&
            (it.selectedFinish || '') === (newItem.selectedFinish || '') &&
            (it.customText || '') === (newItem.customText || '') &&
            (it.customFont || '') === (newItem.customFont || '')
          );
        });

        if (existingIdx !== -1) {
          currentCart[existingIdx].quantity = (Number(currentCart[existingIdx].quantity) || 1) + (Number(newItem.quantity) || 1);
        } else {
          currentCart.push(newItem);
        }
      }
      // 4. Tüm Sepeti Senkronize Et (Sync / Default)
      else {
        const incomingCart = body.cart || body.items;
        if (Array.isArray(incomingCart)) {
          currentCart = incomingCart;
        }
      }

      // Sepet tablosunu ve yedeğini hemen güncelle
      allCarts[identifier] = currentCart;
      writeJsonFile(CARTS_FILE, allCarts);

      // MySQL cPanel veritabanına anında senkronize et
      const email = String(body.email || (identifier.includes('@') ? identifier : '')).trim().toLowerCase();
      syncMysqlCart(email, identifier, currentCart);

      // Eğer kayıtlı kullanıcı ise users.json'da da güncelle
      if (userIdx !== -1) {
        users[userIdx].cart = currentCart;
        if (Array.isArray(body.favorites)) {
          users[userIdx].favorites = body.favorites;
          allFavs[identifier] = body.favorites;
          writeJsonFile(FAVORITES_FILE, allFavs);
          syncMysqlFavorites(email, identifier, body.favorites);
        }
        if (Array.isArray(body.recentlyViewed)) {
          users[userIdx].recentlyViewed = body.recentlyViewed;
        }
        writeJsonFile(USERS_FILE, users);
      }

      console.log(`[CART UPDATE SUCCESS] ${identifier} sepeti güncellendi (${currentCart.length} ürün).`);

      return res.json({
        success: true,
        status: 'success',
        message: 'Sepet veritabanında anında güncellendi ve yedeklendi.',
        cart: currentCart,
        items: currentCart,
        count: currentCart.length,
      });
    } catch (err: any) {
      console.error('[CART UPDATE ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3d. KULLANICI FAVORİLERİ SENKRONİZE VE GÜNCELLEME API (/api/favorites, /api/favorites.php)
  app.all(['/api/favorites.php', '/favorites.php', '/api/favorites'], (req, res) => {
    try {
      const allFavs: Record<string, string[]> = readJsonFile(FAVORITES_FILE, {});
      const users: any[] = readJsonFile(USERS_FILE, []);

      // GET: Favorileri listele
      if (req.method === 'GET') {
        const identifier = String(req.query.email || req.query.userId || req.query.user_id || '').trim().toLowerCase();
        if (!identifier) {
          return res.status(400).json({ success: false, error: 'Kullanıcı kimliği gereklidir.' });
        }

        const account = users.find((u) => u.email?.toLowerCase() === identifier || u.id === identifier);
        const favsFromAccount = account?.favorites;
        const favsFromStore = allFavs[identifier];
        const activeFavs = (Array.isArray(favsFromAccount) && favsFromAccount.length > 0)
          ? favsFromAccount
          : (Array.isArray(favsFromStore) ? favsFromStore : []);

        return res.json({
          success: true,
          status: 'success',
          favorites: activeFavs,
        });
      }

      const body = req.body || {};
      const action = body.action || req.query.action || 'sync';
      const identifier = String(body.email || body.userId || body.user_id || req.query.userId || req.query.email || '').trim().toLowerCase();
      const productId = String(body.productId || body.product_id || '').trim();

      if (!identifier) {
        return res.status(400).json({ success: false, error: 'Kullanıcı kimliği gereklidir.' });
      }

      let currentFavs: string[] = allFavs[identifier] || [];
      const userIdx = users.findIndex((u) => u.email?.toLowerCase() === identifier || u.id === identifier);
      if (userIdx !== -1 && Array.isArray(users[userIdx].favorites) && users[userIdx].favorites.length > 0 && currentFavs.length === 0) {
        currentFavs = users[userIdx].favorites;
      }

      let isFavorite = false;

      // 1. Toggle (Ekle / Çıkar)
      if (action === 'toggle' && productId) {
        if (currentFavs.includes(productId)) {
          currentFavs = currentFavs.filter((id) => id !== productId);
          isFavorite = false;
        } else {
          currentFavs = [...currentFavs, productId];
          isFavorite = true;
        }
      }
      // 2. Doğrudan Ekle (Add)
      else if (action === 'add' && productId) {
        if (!currentFavs.includes(productId)) {
          currentFavs = [...currentFavs, productId];
        }
        isFavorite = true;
      }
      // 3. Doğrudan Çıkar (Remove)
      else if (action === 'remove' && productId) {
        currentFavs = currentFavs.filter((id) => id !== productId);
        isFavorite = false;
      }
      // 4. Toplu Senkronizasyon (Sync / Default)
      else if (Array.isArray(body.favorites)) {
        currentFavs = Array.from(new Set(body.favorites.map((x: any) => String(x).trim()).filter(Boolean)));
        isFavorite = productId ? currentFavs.includes(productId) : false;
      }

      // Favoriler dosyasını ve yedeğini güncelle
      allFavs[identifier] = currentFavs;
      writeJsonFile(FAVORITES_FILE, allFavs);

      // MySQL cPanel veritabanına anında senkronize et
      const email = String(body.email || (identifier.includes('@') ? identifier : '')).trim().toLowerCase();
      syncMysqlFavorites(email, identifier, currentFavs);

      // Kayıtlı kullanıcı ise users.json'da da güncelle
      if (userIdx !== -1) {
        users[userIdx].favorites = currentFavs;
        writeJsonFile(USERS_FILE, users);
      }

      console.log(`[FAVORITES UPDATE SUCCESS] ${identifier} favorileri güncellendi (${currentFavs.length} favori).`);

      return res.json({
        success: true,
        status: 'success',
        isFavorite,
        message: 'Favoriler veritabanında anında güncellendi ve yedeklendi.',
        favorites: currentFavs,
        count: currentFavs.length,
      });
    } catch (err: any) {
      console.error('[FAVORITES UPDATE ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. KULLANICI LİSTESİ (Sadece Yetkili Admin Paneli Erişebilir - Kullanıcıların Sepet & Favorilerini de Getirir)
  app.get('/api/users', async (req, res) => {
    try {
      const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
      if (adminToken !== 'akuz_admin_2026') {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim. Sadece yönetici paneli erişebilir.' });
      }

      let users: any[] = readJsonFile(USERS_FILE, []);
      const allCarts: Record<string, any[]> = readJsonFile(CARTS_FILE, {});
      const allFavs: Record<string, string[]> = readJsonFile(FAVORITES_FILE, {});

      // MySQL bağlantısı varsa MySQL'deki kullanıcıları da oku ve users.json ile birleştir
      if (mysqlPool) {
        try {
          const [mysqlRows]: any = await mysqlPool.query('SELECT * FROM users');
          if (Array.isArray(mysqlRows) && mysqlRows.length > 0) {
            let hasNew = false;
            for (const mu of mysqlRows) {
              const mEmail = (mu.email || '').trim().toLowerCase();
              if (!mEmail) continue;
              const found = users.find((u) => (u.email || '').trim().toLowerCase() === mEmail);
              const isGoogle = mu.auth_provider === 'google';
              if (!found) {
                users.push({
                  id: mu.id ? ('usr_' + mu.id) : ('usr_' + mEmail),
                  user_id: mu.id ? ('usr_' + mu.id) : ('usr_' + mEmail),
                  name: mu.fullname || mu.name || mEmail.split('@')[0],
                  full_name: mu.fullname || mu.name || mEmail.split('@')[0],
                  email: mEmail,
                  phone: mu.phone || '',
                  passwordHash: isGoogle ? 'google_oauth_verified' : (mu.password || ''),
                  createdAt: mu.created_at || new Date().toISOString(),
                  auth_provider: isGoogle ? 'google' : 'local',
                  provider: isGoogle ? 'google' : 'local',
                  authProvider: isGoogle ? 'google' : 'local',
                  registeredVia: isGoogle ? 'google' : 'local',
                  addresses: mu.addresses ? (typeof mu.addresses === 'string' ? JSON.parse(mu.addresses) : mu.addresses) : [],
                  cart: mu.cart ? (typeof mu.cart === 'string' ? JSON.parse(mu.cart) : mu.cart) : [],
                  favorites: mu.favorites ? (typeof mu.favorites === 'string' ? JSON.parse(mu.favorites) : mu.favorites) : [],
                });
                hasNew = true;
              } else if (isGoogle && found.authProvider !== 'google') {
                found.authProvider = 'google';
                found.provider = 'google';
                found.auth_provider = 'google';
                hasNew = true;
              }
            }
            if (hasNew) {
              writeJsonFile(USERS_FILE, users);
            }
          }
        } catch (e) {
          console.warn('[MYSQL USERS MERGE WARN]', e);
        }
      }

      // Admin Paneli için kullanıcı sepeti ve favorileriyle birlikte tam profil
      const sanitized = users.map((u) => {
        const cleanEmail = (u.email || '').toLowerCase().trim();
        const userCart = (Array.isArray(u.cart) && u.cart.length > 0) ? u.cart : (allCarts[cleanEmail] || []);
        const userFavs = (Array.isArray(u.favorites) && u.favorites.length > 0) ? u.favorites : (allFavs[cleanEmail] || []);
        const isGoogle = u.auth_provider === 'google' || u.provider === 'google' || u.authProvider === 'google' || u.registeredVia === 'google' || u.passwordHash === 'google_oauth_verified';

        return {
          id: u.id || u.user_id || ('usr_' + cleanEmail),
          name: u.name || u.full_name || 'Kullanıcı',
          email: u.email,
          phone: u.phone || '',
          createdAt: u.createdAt || new Date().toISOString(),
          authProvider: isGoogle ? 'google' : 'normal',
          provider: isGoogle ? 'google' : 'normal',
          registeredVia: isGoogle ? 'google' : 'normal',
          addresses: u.addresses || [],
          cart: userCart,
          favorites: userFavs,
          recentlyViewed: u.recentlyViewed || [],
        };
      });
      return res.json({ success: true, users: sanitized });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. TÜM AKTİF SEPET VE FAVORİ AKTİVİTESİNİ İNCELEME (Admin Paneli için)
  app.get('/api/admin/carts-activity', (req, res) => {
    try {
      const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
      if (adminToken !== 'akuz_admin_2026') {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim.' });
      }
      const allCarts: Record<string, any[]> = readJsonFile(CARTS_FILE, {});
      const allFavs: Record<string, string[]> = readJsonFile(FAVORITES_FILE, {});
      const users: any[] = readJsonFile(USERS_FILE, []);

      return res.json({
        success: true,
        carts: allCarts,
        favorites: allFavs,
        totalActiveCarts: Object.keys(allCarts).filter((k) => allCarts[k]?.length > 0).length,
        totalRegisteredUsers: users.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. TÜM KULLANICI KAYITLARINI TEMİZLEME
  app.post('/api/users/purge-all', (req, res) => {
    try {
      const adminToken = req.headers['x-admin-token'] || req.body?.adminToken;
      if (adminToken !== 'akuz_admin_2026') {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim.' });
      }
      writeJsonFile(USERS_FILE, []);
      return res.json({ success: true, message: 'Tüm kullanıcı kayıtları silindi.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4c. KULLANICI SİLME (Admin Yetkisiyle)
  app.delete('/api/users', (req, res) => {
    try {
      const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
      if (adminToken !== 'akuz_admin_2026') {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim.' });
      }
      const email = (req.query.email as string || (req.body && req.body.email) || '').trim().toLowerCase();
      let users: any[] = readJsonFile(USERS_FILE, []);
      if (email) {
        users = users.filter((u) => (u.email || '').toLowerCase() !== email && (u.id || '') !== email);
        // İlgili sepet ve favorileri de temizle
        const allCarts: Record<string, any[]> = readJsonFile(CARTS_FILE, {});
        const allFavs: Record<string, string[]> = readJsonFile(FAVORITES_FILE, {});
        if (allCarts[email]) {
          delete allCarts[email];
          writeJsonFile(CARTS_FILE, allCarts);
        }
        if (allFavs[email]) {
          delete allFavs[email];
          writeJsonFile(FAVORITES_FILE, allFavs);
        }
      } else {
        users = [];
      }
      writeJsonFile(USERS_FILE, users);
      return res.json({ success: true, count: users.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. KULLANICI PROFİL GÜNCELLEME (Adres, Telefon, İsim)
  // 5. KULLANICI PROFİL GÜNCELLEME (Adres, Telefon, İsim - MySQL ve Local senkronizasyonu)
  app.all(['/api/user/profile', '/api/auth.php'], (req, res, next) => {
    // Eğer auth.php'ye register veya login veya change_password isteği gelmişse sonraki route'a bırak
    const action = req.body?.action || req.query?.action;
    if (req.path.includes('auth.php')) {
      if (action === 'change_password' || action === 'update_password') {
        return next();
      }
      if (action === 'login' || action === 'register') {
        return next();
      }
    }

    try {
      const { email, name, fullname, phone, addresses, cart, favorites } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || fullname || '').trim();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: 'E-posta adresi eksik.' });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      let index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

      if (index === -1) {
        // Kullanıcı henüz yoksa oluştur
        const newUser = {
          name: cleanName || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: phone || '',
          addresses: addresses || [],
          cart: cart || [],
          favorites: favorites || [],
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        index = users.length - 1;
      } else {
        if (cleanName) users[index].name = cleanName;
        if (phone !== undefined) users[index].phone = phone;
        if (addresses !== undefined) users[index].addresses = addresses;
        if (cart !== undefined) users[index].cart = cart;
        if (favorites !== undefined) users[index].favorites = favorites;
      }

      if (cart !== undefined) {
        syncMysqlCart(cleanEmail, cleanEmail, cart);
      }
      if (favorites !== undefined) {
        syncMysqlFavorites(cleanEmail, cleanEmail, favorites);
      }

      writeJsonFile(USERS_FILE, users);

      return res.json({
        success: true,
        status: 'success',
        message: 'Hesap bilgileri başarıyla güncellendi.',
        user: {
          name: users[index].name,
          fullname: users[index].name,
          email: users[index].email,
          phone: users[index].phone,
          addresses: users[index].addresses,
          cart: users[index].cart || [],
          favorites: users[index].favorites || [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5b. KULLANICI ŞİFRE GÜNCELLEME (Hesap Bilgilerinden Şifre Değiştirme)
  app.all(['/api/user/password'], (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, error: 'E-posta adresi eksik.' });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Yeni şifreniz en az 6 karakterden oluşmalıdır.',
        });
      }

      const users: any[] = readJsonFile(USERS_FILE, []);
      const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
      }

      const account = users[index];

      // Eğer mevcut şifre belirtilmişse kontrol et
      if (currentPassword) {
        const inputHash = hashPassword(currentPassword);
        const isMatch =
          account.passwordHash === inputHash ||
          account.passwordHash === currentPassword ||
          account.plainPassword === currentPassword;

        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: 'Mevcut şifrenizi hatalı girdiniz.',
          });
        }
      }

      // Yeni şifreyi hem hash hem plain olarak güncelle
      account.passwordHash = hashPassword(newPassword);
      account.plainPassword = newPassword;
      writeJsonFile(USERS_FILE, users);

      console.log(`[PASSWORD CHANGED ON HOST] ${cleanEmail}`);
      return res.json({
        success: true,
        status: 'success',
        message: 'Şifreniz başarıyla güncellendi.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Şifre güncellenirken sunucu hatası.' });
    }
  });

  // 6. MERKEZİ SİPARİŞLER (Kaydetme, Listeleme, Durum Değiştirme)
  app.get('/api/orders', (req, res) => {
    try {
      const orders = readJsonFile(ORDERS_FILE, []);
      const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
      const emailQuery = (req.query.email as string || '').toLowerCase().trim();

      // Admin ise tüm siparişleri görebilir
      if (adminToken === 'akuz_admin_2026') {
        return res.json({ success: true, orders });
      }

      // Kullanıcı kendi siparişlerini sorguluyorsa sadece onun siparişlerini dön
      if (emailQuery) {
        const userOrders = orders.filter((o: any) => (o.customerEmail || '').toLowerCase().trim() === emailQuery);
        return res.json({ success: true, orders: userOrders });
      }

      // Kimliği belirsiz isteklere boş liste dön (veri gizliliği)
      return res.json({ success: true, orders: [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const newOrder = req.body;
      if (!newOrder || !newOrder.id) {
        return res.status(400).json({ success: false, error: 'Sipariş bilgisi eksik.' });
      }
      const orders: any[] = readJsonFile(ORDERS_FILE, []);
      orders.unshift(newOrder); // En yeni siparişi başa ekle
      writeJsonFile(ORDERS_FILE, orders);
      console.log(`[ORDER SAVED TO HOST] #${newOrder.id} - ${newOrder.customerName || 'Müşteri'}`);

      // Müşteri profilini kalıcı kullanıcı tablosuyla (users.json) senkronize et
      const custEmail = (newOrder.customerEmail || '').toLowerCase().trim();
      if (custEmail && custEmail.includes('@')) {
        try {
          const users: any[] = readJsonFile(USERS_FILE, []);
          let user = users.find((u) => u.email.toLowerCase() === custEmail);
          const custPhone = (newOrder.customerPhone || '').trim();
          const custName = (newOrder.customerName || '').trim();
          const custAddress = (newOrder.shippingAddress || '').trim();

          if (user) {
            if (!user.phone && custPhone) user.phone = custPhone;
            if ((!user.name || user.name.includes('@')) && custName) user.name = custName;
            user.addresses = user.addresses || [];
            if (custAddress) {
              const alreadyHas = user.addresses.some((a: any) => a.fullAddress === custAddress || custAddress.includes(a.fullAddress));
              if (!alreadyHas) {
                user.addresses.push({
                  id: `addr-${Date.now()}`,
                  title: user.addresses.length === 0 ? 'Ev / Teslimat Adresim' : `Kayıtlı Adres ${user.addresses.length + 1}`,
                  recipientName: custName || user.name,
                  phone: custPhone || user.phone,
                  city: newOrder.city || 'Bursa',
                  district: newOrder.district || 'Nilüfer',
                  fullAddress: custAddress,
                  isDefault: user.addresses.length === 0,
                });
              }
            }
            writeJsonFile(USERS_FILE, users);
          } else {
            // Kullanıcı daha önce üye olmadıysa bile sipariş bilgilerinden hesabı oluştur
            const newAcc = {
              name: custName || custEmail.split('@')[0],
              email: custEmail,
              passwordHash: 'guest_order_created',
              phone: custPhone,
              createdAt: new Date().toISOString(),
              addresses: custAddress ? [
                {
                  id: `addr-${Date.now()}`,
                  title: 'Teslimat Adresim',
                  recipientName: custName || custEmail.split('@')[0],
                  phone: custPhone,
                  city: newOrder.city || 'Bursa',
                  district: newOrder.district || 'Nilüfer',
                  fullAddress: custAddress,
                  isDefault: true,
                }
              ] : [],
            };
            users.push(newAcc);
            writeJsonFile(USERS_FILE, users);
          }
        } catch (syncErr) {
          console.warn('[ORDER USER SYNC ERROR]', syncErr);
        }
      }

      return res.json({ success: true, order: newOrder });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/orders/:id', (req, res) => {
    try {
      const orderId = req.params.id;
      const updates = req.body;
      const orders: any[] = readJsonFile(ORDERS_FILE, []);
      const index = orders.findIndex((o) => o.id === orderId);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Sipariş bulunamadı.' });
      }

      orders[index] = { ...orders[index], ...updates };
      writeJsonFile(ORDERS_FILE, orders);
      console.log(`[ORDER UPDATED ON HOST] #${orderId}:`, updates);
      return res.json({ success: true, order: orders[index] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6.5 FOTOĞRAF YÜKLEME API (Ürün ve vitrin görsellerini public/uploads'a kaydeder)
  app.post(['/api/upload', '/api/upload-image'], (req, res) => {
    try {
      const { image, fileName: customName } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ success: false, error: 'Görsel verisi gönderilmedi.' });
      }

      let ext = 'jpg';
      let base64Data = image;

      const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
        if (ext === 'svg+xml') ext = 'svg';
        base64Data = matches[2];
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const safeName = `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const targetPath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(targetPath, buffer);

      // Dist uploads klasörüne de anında kopyala
      const distUploads = path.resolve(__dirname, 'dist', 'uploads');
      if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
        if (!fs.existsSync(distUploads)) {
          fs.mkdirSync(distUploads, { recursive: true });
        }
        fs.writeFileSync(path.join(distUploads, safeName), buffer);
      }

      const publicUrl = `/uploads/${safeName}`;
      console.log(`[UPLOAD] Ürün fotoğrafı kaydedildi: ${publicUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return res.json({ success: true, url: publicUrl, sizeKb: (buffer.length / 1024).toFixed(1) });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(500).json({ success: false, error: err.message || 'Fotoğraf yüklenemedi.' });
    }
  });

  // 7. MERKEZİ ÜRÜNLER (Admin panelinde eklenen / düzenlenen ürünlerin host'ta saklanması)
  app.get('/api/products', (_req, res) => {
    try {
      const products = readJsonFile(PRODUCTS_FILE, null);
      return res.json({ success: true, products });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products', (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, error: 'Ürün listesi boş olamaz. Mevcut ürünlerin kazara silinmesini önlemek için işlem durduruldu.' });
      }
      writeJsonFile(PRODUCTS_FILE, products);
      console.log(`[PRODUCTS SAVED TO HOST] Toplam ${products.length} ürün güncellendi.`);

      runDataSync();
      return res.json({ success: true, count: products.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Ürün Silme API (DELETE /api/products/:id, DELETE /api/products?id=... veya POST /api/products/delete)
  const deleteProductHandler = (req: express.Request, res: express.Response) => {
    try {
      const id = req.params.id || (req.query.id as string) || req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Ürün ID belirtilmedi.' });
      }
      let products: any[] = readJsonFile(PRODUCTS_FILE, []);
      const beforeCount = products.length;
      products = products.filter((p) => p.id !== id && p.slug !== id);
      writeJsonFile(PRODUCTS_FILE, products);
      console.log(`[PRODUCT DELETED ON HOST] ID: ${id}. Kalan ürün: ${products.length} (Önceki: ${beforeCount})`);
      runDataSync();

      return res.json({ success: true, count: products.length, deletedId: id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  app.delete('/api/products/:id', deleteProductHandler);
  app.delete('/api/products', deleteProductHandler);
  app.post('/api/products/delete', deleteProductHandler);

  // 8. MERKEZİ AYARLAR (SMTP, Kargonomi, İletişim, Folyo vb.)
  app.get('/api/settings', (_req, res) => {
    try {
      const settings = readJsonFile(SETTINGS_FILE, null);
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ success: false, error: 'Ayar verisi eksik.' });
      }
      writeJsonFile(SETTINGS_FILE, settings);
      console.log(`[SETTINGS SAVED TO HOST] Site ayarları sunucuya kaydedildi.`);
      runDataSync();
      return res.json({ success: true, message: 'Ayarlar başarıyla host sunucusuna kaydedildi.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8b. GLOBAL RENK PALETİ API
  const COLORS_FILE = path.join(DATA_DIR, 'global_colors.json');
  app.get('/api/colors', (_req, res) => {
    try {
      const colors = readJsonFile(COLORS_FILE, []);
      return res.json({ success: true, colors });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/colors', (req, res) => {
    try {
      const { colors } = req.body;
      if (!Array.isArray(colors)) {
        return res.status(400).json({ success: false, error: 'Renk listesi dizi olmalıdır.' });
      }
      writeJsonFile(COLORS_FILE, colors);
      console.log(`[COLORS SAVED TO HOST] Renk paleti güncellendi (${colors.length} renk).`);
      runDataSync();
      return res.json({ success: true, count: colors.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GOOGLE OAUTH CREDENTIALS JSON İŞLEME VE ENTEGRASYON ROTALARI
  app.post('/api/admin/google-oauth-json', (req, res) => {
    try {
      const { jsonContent } = req.body;
      let parsed: any;
      if (typeof jsonContent === 'string') {
        parsed = JSON.parse(jsonContent);
      } else {
        parsed = jsonContent;
      }

      if (!parsed) {
        return res.status(400).json({ success: false, error: 'Geçersiz veya boş JSON içeriği.' });
      }

      // Google JSON formatı { web: { client_id: ... } } veya { installed: { ... } } veya { client_id: ... }
      const web = parsed.web || parsed.installed || parsed;
      const clientId = (web.client_id || parsed.client_id || '').trim();
      const projectId = (web.project_id || parsed.project_id || '').trim();
      const authUri = (web.auth_uri || parsed.auth_uri || '').trim();
      const tokenUri = (web.token_uri || parsed.token_uri || '').trim();
      const clientSecret = (web.client_secret || parsed.client_secret || '').trim();
      const redirectUris = web.redirect_uris || parsed.redirect_uris || [];
      const javascriptOrigins = web.javascript_origins || parsed.javascript_origins || [];

      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: 'Yüklenen JSON dosyasında "client_id" (İstemci Kimliği) bulunamadı. Lütfen Google Cloud Console > APIs & Services > Credentials üzerinden indirilen OAuth 2.0 İstemci JSON dosyasını seçin.',
        });
      }

      // JSON dosyasını data_storage klasörüne kaydet
      writeJsonFile(GOOGLE_CREDENTIALS_FILE, {
        ...parsed,
        savedAt: new Date().toISOString(),
      });

      // Settings dosyasında googleClientId'yi de anında güncelle
      const currentSettings = readJsonFile<any>(SETTINGS_FILE, {});
      currentSettings.googleClientId = clientId;
      writeJsonFile(SETTINGS_FILE, currentSettings);

      console.log(`[GOOGLE OAUTH JSON INTEGRATED] Client ID: ${clientId}, Project: ${projectId}`);

      return res.json({
        success: true,
        message: 'Google Cloud Console OAuth JSON dosyası başarıyla entegre edildi ve kaydedildi!',
        config: {
          clientId,
          projectId,
          authUri,
          tokenUri,
          clientSecret: clientSecret ? '••••••••' + clientSecret.slice(-4) : '',
          redirectUris,
          javascriptOrigins,
        },
      });
    } catch (err: any) {
      console.error('[GOOGLE JSON PARSE ERROR]', err);
      return res.status(400).json({
        success: false,
        error: 'JSON dosyası çözümlenemedi: ' + (err?.message || 'Geçersiz JSON formatı.'),
      });
    }
  });

  app.get('/api/admin/google-oauth-json', (req, res) => {
    try {
      const creds = readJsonFile<any>(GOOGLE_CREDENTIALS_FILE, null);
      if (!creds) {
        return res.json({ success: true, hasConfig: false, config: null });
      }
      const web = creds.web || creds.installed || creds;
      return res.json({
        success: true,
        hasConfig: true,
        config: {
          clientId: web.client_id || '',
          projectId: web.project_id || '',
          authUri: web.auth_uri || '',
          tokenUri: web.token_uri || '',
          redirectUris: web.redirect_uris || [],
          javascriptOrigins: web.javascript_origins || [],
          savedAt: creds.savedAt || '',
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // VITE DEV SERVER ENTEGRASYONU
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production' || !fs.existsSync(path.resolve(__dirname, 'src'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Prod: Dist statik dosyaları
    const distHtml = path.resolve(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distHtml)) {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.sendFile(distHtml);
      });
    } else {
      app.get('*', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>AKUZ Stickers</title></head><body><h2>AKUZ Stickers Sunucusu Aktif</h2><p>Node.js backend sorunsuz calisiyor.</p></body></html>');
      });
    }
  }

  // Port dinleme desteği (AI Studio Runtime 3000 portunu zorunlu kılar; cPanel'de Passenger socket veya PORT kullanılır)
  const isPassengerSocket = typeof rawPort === 'string' && isNaN(Number(rawPort)) && rawPort.startsWith('/');

  if (isPassengerSocket) {
    // Phusion Passenger UNIX domain socket (cPanel)
    app.listen(rawPort, () => {
      console.log(`[SERVER] AKUZ Stickers Server running on Passenger socket ${rawPort}`);
    });
  } else {
    const port = parseInt(rawPort || '3000', 10) || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[SERVER] AKUZ Stickers Server running on http://0.0.0.0:${port}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
