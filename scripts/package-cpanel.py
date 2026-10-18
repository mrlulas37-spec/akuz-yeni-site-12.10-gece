#!/usr/bin/env python3
import os
import shutil
import zipfile
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data_storage')
ARCHIVES_DIR = os.path.join(BASE_DIR, 'cpanel_archives')

os.makedirs(ARCHIVES_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Clean up any existing stale zip files inside public and dist
for folder in [PUBLIC_DIR, DIST_DIR]:
    if os.path.exists(folder):
        for f in os.listdir(folder):
            if f.endswith('.zip'):
                try:
                    os.remove(os.path.join(folder, f))
                except Exception:
                    pass

# 1b. PRE-BUILD SYNC: Sync all preview edits from data_storage into src/ & public/
print("[0/4] Syncing preview edits from data_storage into src/ & public/...")
sync_script = os.path.join(BASE_DIR, 'scripts', 'sync-preview-data.cjs')
if os.path.exists(sync_script):
    try:
        subprocess.run(['node', sync_script], cwd=BASE_DIR, check=True)
    except Exception as e:
        print(f"[SYNC WARN] Could not run sync-preview-data.cjs: {e}")

print("[1/4] Building Vite & esbuild server with latest preview data...")
subprocess.run(['npm', 'run', 'build'], cwd=BASE_DIR, check=True)

# README_KURULUM.txt content
README_CONTENT = """============================================================
  AKUZ STICKERS - cPanel KURULUM VE PAYTR ÖDEME REHBERİ
============================================================

Tebrikler! Bu paket AKUZ Stickers e-ticaret sitenizin, PayTR 
kredi kartı ödeme sistemi ve dinamik vitrin özellikleriyle 
birlikte cPanel için optimize edilmiş güncel sürümüdür.

------------------------------------------------------------
1. STATİK / PHP KURULUMU (ÖNERİLEN & EN HIZLI YOL)
------------------------------------------------------------
Dosya: cpanel_public_html_dist.zip

1. cPanel Dosya Yöneticisi'ne (File Manager) girin.
2. 'public_html' klasörünü açın.
3. Bu ZIP dosyasını yükleyin ve üzerine sağ tıklayıp 'Extract' (Çıkart) deyin.
4. Çıkan dosyalar doğrudan public_html içinde olmalıdır:
   - index.html
   - assets/ (CSS & JS dosyaları)
   - products/ (Görseller)
   - api/index.php (PayTR ve sipariş API motoru)
   - paytr-callback.php (PayTR bildirim adresi)
   - data_storage/ (Siparişler, ürünler ve PayTR ayarları)
   - uploads/ (Yüklenen ürün ve vitrin fotoğrafları)
   - .htaccess (Sayfa yönlendirmeleri ve API kuralları)

* data_storage ve uploads klasörlerinin yazma izninin (chmod) 755 veya 777 olduğundan 
  emin olun (Siparişlerin ve ürün fotoğraflarının kaydedilebilmesi için).

------------------------------------------------------------
2. PAYTR MAĞAZA PANELİ AYARLARI
------------------------------------------------------------
PayTR mağaza panelinize (https://www.paytr.com) giriş yapın:
1. Ayarlar -> Bildirim URL Ayarları bölümüne gidin.
2. Bildirim URL'inizi şu şekilde kaydedin:
   https://siteniz.com/paytr-callback.php
   veya
   https://siteniz.com/api/paytr/callback
3. 'Tekrar Kontrol Et' butonuna bastığınızda 'OK' yanıtı alınacak ve 
   sisteminiz yeşil yanacaktır.
4. Siteniz üzerinden /odeme sayfasına giderek bir test siparişi oluşturun.
   PayTR test kartı ile ödemeyi tamamlayın.
5. PayTR onayından sonra sitenizin Admin Panelinden (/admin)
   PayTR Canlı Modu'nu aktif edebilirsiniz.

------------------------------------------------------------
3. cPanel NODE.JS APP KURULUMU (İSTEĞE BAĞLI ALTERNATİF)
------------------------------------------------------------
Dosya: cpanel_full_app.zip

1. cPanel'de 'Setup Node.js App' bölümünü açın.
2. 'Create Application' deyin.
3. Node.js Version: 18.x veya 20.x seçin.
4. Application root: sitenizin klasörü
5. Application startup file: server.js veya app.js
6. ZIP içindeki dosyaları o klasöre çıkartın ve 'Run NPM Install' deyin.
7. 'Restart' butonuna basın.

Her iki kurulum yönteminde de PayTR Kredi Kartı (3D Secure) 
ödeme sistemi eksiksiz olarak çalışmaktadır.
============================================================
"""

# Write README to dist and public
with open(os.path.join(DIST_DIR, 'README_KURULUM.txt'), 'w', encoding='utf-8') as f:
    f.write(README_CONTENT)

# 2. Build cpanel_public_html_dist.zip
print("[2/4] Packaging cpanel_public_html_dist.zip...")
dist_zip_path = os.path.join(ARCHIVES_DIR, 'cpanel_public_html_dist.zip')
if os.path.exists(dist_zip_path):
    os.remove(dist_zip_path)

with zipfile.ZipFile(dist_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    # Track added paths to avoid duplicates
    added = set()
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            if file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, DIST_DIR)
            if rel_path not in added:
                zf.write(full_path, rel_path)
                added.add(rel_path)

    # Ensure .htaccess is included
    htaccess_path = os.path.join(PUBLIC_DIR, '.htaccess')
    if os.path.exists(htaccess_path) and '.htaccess' not in added:
        zf.write(htaccess_path, '.htaccess')
        added.add('.htaccess')

    # Ensure root index.php (PayTR security shield & SPA fallback) is included
    root_index_php = os.path.join(PUBLIC_DIR, 'index.php')
    if os.path.exists(root_index_php) and 'index.php' not in added:
        zf.write(root_index_php, 'index.php')
        added.add('index.php')

    # Ensure all api/*.php files (index.php, auth.php, google_auth.php, cart.php) are included
    api_dir = os.path.join(PUBLIC_DIR, 'api')
    if os.path.exists(api_dir):
        for root, dirs, files in os.walk(api_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.join('api', os.path.relpath(full_path, api_dir))
                if rel_path not in added:
                    zf.write(full_path, rel_path)
                    added.add(rel_path)

    # Ensure paytr-callback.php is included
    callback_php = os.path.join(PUBLIC_DIR, 'paytr-callback.php')
    if os.path.exists(callback_php) and 'paytr-callback.php' not in added:
        zf.write(callback_php, 'paytr-callback.php')
        added.add('paytr-callback.php')

    # Ensure data_storage is included with default configs
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.join('data_storage', os.path.relpath(full_path, DATA_DIR))
            if rel_path not in added:
                zf.write(full_path, rel_path)
                added.add(rel_path)

    # Ensure uploads folder is included for product photos
    uploads_dir = os.path.join(PUBLIC_DIR, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    for root, dirs, files in os.walk(uploads_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.join('uploads', os.path.relpath(full_path, uploads_dir))
            if rel_path not in added:
                zf.write(full_path, rel_path)
                added.add(rel_path)
    if 'uploads/.gitkeep' not in added:
        zf.writestr('uploads/.gitkeep', '')
        added.add('uploads/.gitkeep')

print(f"Created: {dist_zip_path} ({os.path.getsize(dist_zip_path)} bytes)")

# 3. Build cpanel_full_app.zip
print("[3/4] Packaging cpanel_full_app.zip...")
full_zip_path = os.path.join(ARCHIVES_DIR, 'cpanel_full_app.zip')
if os.path.exists(full_zip_path):
    os.remove(full_zip_path)

with zipfile.ZipFile(full_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    # Root essential files
    essential_files = [
        'package.json',
        'server.js',
        'app.js',
        'tsconfig.json',
        'vite.config.ts',
        '.env.example',
        'server.ts',
        'firebase-applet-config.json',
        'index.html',
    ]
    for ef in essential_files:
        ef_path = os.path.join(BASE_DIR, ef)
        if os.path.exists(ef_path):
            zf.write(ef_path, ef)

    zf.writestr('README_KURULUM.txt', README_CONTENT)

    # src/ directory (Tüm güncel site kaynak kodları)
    src_dir = os.path.join(BASE_DIR, 'src')
    if os.path.exists(src_dir):
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.join('src', os.path.relpath(full_path, src_dir))
                zf.write(full_path, rel_path)

    # dist directory
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            if file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.join('dist', os.path.relpath(full_path, DIST_DIR))
            zf.write(full_path, rel_path)

    # public directory (without any zip files)
    for root, dirs, files in os.walk(PUBLIC_DIR):
        for file in files:
            if file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.join('public', os.path.relpath(full_path, PUBLIC_DIR))
            zf.write(full_path, rel_path)

    # data_storage directory
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.join('data_storage', os.path.relpath(full_path, DATA_DIR))
            zf.write(full_path, rel_path)

print(f"Created: {full_zip_path} ({os.path.getsize(full_zip_path)} bytes)")

# 4. Copy to public/ and dist/ so both dev and prod URLs serve the latest files
print("[4/4] Syncing ZIPs to public/ and dist/...")
for src_name in ['cpanel_public_html_dist.zip', 'cpanel_full_app.zip']:
    src_file = os.path.join(ARCHIVES_DIR, src_name)
    shutil.copy2(src_file, os.path.join(PUBLIC_DIR, src_name))
    shutil.copy2(src_file, os.path.join(DIST_DIR, src_name))
    # Also create aliases download-cpanel-*.zip
    alt_name = src_name.replace('cpanel_public_html_dist', 'download-cpanel-dist').replace('cpanel_full_app', 'download-cpanel-full')
    shutil.copy2(src_file, os.path.join(PUBLIC_DIR, alt_name))
    shutil.copy2(src_file, os.path.join(DIST_DIR, alt_name))

print("All cPanel packages successfully created and synced!")
