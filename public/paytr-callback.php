<?php
// PayTR Doğrudan Bildirim URL Sayfası (Standalone Callback)
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// PayTR botu ping kontrolü veya GET isteği
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'HEAD') {
    echo 'OK';
    exit;
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: [];
$postData = $_POST ?: $body;

$merchant_oid = $postData['merchant_oid'] ?? '';
$status = $postData['status'] ?? '';
$total_amount = $postData['total_amount'] ?? '';
$hash = $postData['hash'] ?? '';

if (empty($merchant_oid) || empty($hash)) {
    // PayTR test kontrol pingi
    echo 'OK';
    exit;
}

$dataDir = __DIR__ . '/../data_storage';
if (!is_dir($dataDir)) {
    $dataDir = __DIR__ . '/data_storage';
}
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$setFile = $dataDir . '/settings.json';
$settings = [];
if (file_exists($setFile)) {
    $settings = json_decode(file_get_contents($setFile), true) ?: [];
}
$paytrConfig = $settings['paytrSettings'] ?? [];
$merchant_key = $paytrConfig['merchantKey'] ?? '5gGXBK84nWWo6s6r';
$merchant_salt = $paytrConfig['merchantSalt'] ?? 'B4LSmLkCLUTUnro9';

$calculatedHash = base64_encode(hash_hmac('sha256', $merchant_oid . $merchant_salt . $status . $total_amount, $merchant_key, true));

if ($hash === $calculatedHash && $status === 'success') {
    $ordersFile = $dataDir . '/orders.json';
    $orders = [];
    if (file_exists($ordersFile)) {
        $orders = json_decode(file_get_contents($ordersFile), true) ?: [];
    }
    foreach ($orders as $k => $o) {
        $cleanId = preg_replace('/[^a-zA-Z0-9]/', '', $o['id'] ?? '');
        if ($cleanId === $merchant_oid || ($o['id'] ?? '') === $merchant_oid) {
            $orders[$k]['status'] = 'Hazırlanıyor';
            $orders[$k]['paymentStatus'] = 'Ödendi';
            $orders[$k]['paymentMethod'] = 'PayTR Kredi / Banka Kartı (3D Secure)';
            $orders[$k]['paidAt'] = date('c');
            @file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            break;
        }
    }
}

// PayTR her zaman plain text OK bekler
echo 'OK';
exit;
