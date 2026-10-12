<?php
/**
 * AKUZ Stickers - Ana Giriş & Güvenlik Kalkanı
 * 
 * Bu dosya cPanel ortamında iki kritik görevi yerine getirir:
 * 1. PayTR Bildirim Botu Koruması: Eğer PayTR Mağaza Paneli'nde bildirim URL'si olarak
 *    yanlışlıkla doğrudan site adresi (https://site.com/) veya /odeme tanımlanmışsa,
 *    PayTR'a HTML tasarımı yerine anında plain-text "OK" yanıtı dönerek onaylanmasını sağlar.
 * 2. Normal ziyaretçilere kesintisiz şekilde React SPA (index.html) uygulamasını sunar.
 */

// PayTR bildirim veya kontrol isteği kontrolü
$isPaytrPost = ($_SERVER['REQUEST_METHOD'] === 'POST') ||
    isset($_POST['merchant_oid']) ||
    isset($_POST['hash']) ||
    isset($_POST['status']) ||
    (isset($_SERVER['REQUEST_URI']) && (
        strpos($_SERVER['REQUEST_URI'], 'paytr') !== false ||
        strpos($_SERVER['REQUEST_URI'], 'callback') !== false
    ));

$isPaytrProbe = isset($_GET['paytr']) || isset($_GET['merchant_oid']);

if ($isPaytrPost || $isPaytrProbe) {
    if (file_exists(__DIR__ . '/paytr-callback.php')) {
        require_once __DIR__ . '/paytr-callback.php';
        exit;
    }
    header('Content-Type: text/plain; charset=utf-8');
    echo 'OK';
    exit;
}

// Normal web sitesi ziyaretçileri için React SPA uygulamasını sun
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
}

echo 'AKUZ Stickers Online Store';
