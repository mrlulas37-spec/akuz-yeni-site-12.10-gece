<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Normalize URI
$route = preg_replace('#^.*/api/#', '', $requestUri);
$route = trim($route, '/');

$dataDir = __DIR__ . '/../../data_storage';
if (!is_dir($dataDir)) {
    $dataDir = __DIR__ . '/../data_storage';
}
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function readJson($filePath, $fallback = []) {
    if (!file_exists($filePath)) return $fallback;
    $raw = @file_get_contents($filePath);
    $decoded = json_decode($raw, true);
    return $decoded !== null ? $decoded : $fallback;
}

function writeJson($filePath, $data) {
    @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: [];

// Pure PHP SMTP socket function
function sendSmtpMail($smtpConfig, $to, $subject, $html) {
    $host = !empty($smtpConfig['host']) ? $smtpConfig['host'] : getenv('SMTP_HOST');
    $port = !empty($smtpConfig['port']) ? intval($smtpConfig['port']) : 465;
    $user = !empty($smtpConfig['user']) ? $smtpConfig['user'] : getenv('SMTP_USER');
    $pass = !empty($smtpConfig['pass']) ? $smtpConfig['pass'] : getenv('SMTP_PASS');
    $fromName = !empty($smtpConfig['fromName']) ? $smtpConfig['fromName'] : 'AKUZ Stickers';
    $fromEmail = !empty($smtpConfig['fromEmail']) ? $smtpConfig['fromEmail'] : ($user ?: 'info@akuzstickers.com');

    if (empty($host) || empty($user) || empty($pass)) {
        return ['success' => false, 'error' => 'cPanel SMTP hesap şifreniz henüz girilmemiş. Lütfen Yönetici Paneli -> E-posta & SMTP sekmesinden kurumsal e-posta şifrenizi kaydedin.'];
    }

    $socketHost = ($port === 465 ? 'ssl://' : '') . $host;
    $timeout = 15;
    $errno = 0;
    $errstr = '';

    $socket = @fsockopen($socketHost, $port, $errno, $errstr, $timeout);
    if (!$socket) {
        return ['success' => false, 'error' => "Sunucuya bağlanılamadı ($errno): $errstr. Port veya host adresini kontrol edin."];
    }

    $response = fgets($socket, 515);

    fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?: 'localhost') . "\r\n");
    $response = '';
    while ($line = fgets($socket, 515)) {
        $response .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }

    // TLS on port 587
    if ($port === 587) {
        fputs($socket, "STARTTLS\r\n");
        $tlsResponse = fgets($socket, 515);
        if (substr($tlsResponse, 0, 3) === '220') {
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?: 'localhost') . "\r\n");
            while ($line = fgets($socket, 515)) {
                if (substr($line, 3, 1) === ' ') break;
            }
        }
    }

    fputs($socket, "AUTH LOGIN\r\n");
    $authResp = fgets($socket, 515);
    if (substr($authResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN reddedildi: $authResp"];
    }

    fputs($socket, base64_encode($user) . "\r\n");
    $userResp = fgets($socket, 515);
    if (substr($userResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "Kullanıcı adı kabul edilmedi: $userResp"];
    }

    fputs($socket, base64_encode($pass) . "\r\n");
    $passResp = fgets($socket, 515);
    if (substr($passResp, 0, 3) !== '235') {
        fclose($socket);
        return ['success' => false, 'error' => "Şifre doğrulanamadı (535): E-posta şifrenizi kontrol edin."];
    }

    fputs($socket, "MAIL FROM: <$fromEmail>\r\n");
    $fromResp = fgets($socket, 515);

    fputs($socket, "RCPT TO: <$to>\r\n");
    $toResp = fgets($socket, 515);
    if (substr($toResp, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => "Alıcı adresi reddedildi: $toResp"];
    }

    fputs($socket, "DATA\r\n");
    $dataResp = fgets($socket, 515);

    $boundary = md5(uniqid(time()));
    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    fputs($socket, $headers . "\r\n" . $html . "\r\n.\r\n");
    $sendResp = fgets($socket, 515);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr($sendResp, 0, 3) === '250') {
        return ['success' => true, 'messageId' => trim($sendResp)];
    } else {
        return ['success' => false, 'error' => "E-posta gönderim yanıtı: $sendResp"];
    }
}

// 1. SMTP TEST
if ($route === 'test-smtp') {
    $cfg = $body['smtpConfig'] ?? [];
    $host = $cfg['host'] ?? '';
    $port = intval($cfg['port'] ?? 465);
    $user = $cfg['user'] ?? '';
    $pass = $cfg['pass'] ?? '';

    if (empty($host) || empty($user) || empty($pass)) {
        echo json_encode(['success' => false, 'error' => 'Host, kullanıcı adı ve şifre zorunludur.']);
        exit;
    }

    $socketHost = ($port === 465 ? 'ssl://' : '') . $host;
    $socket = @fsockopen($socketHost, $port, $errno, $errstr, 12);
    if (!$socket) {
        echo json_encode(['success' => false, 'error' => "Bağlantı hatası ($errno): $errstr. Port veya sunucu adresini kontrol edin."]);
        exit;
    }
    fgets($socket, 515);
    fputs($socket, "EHLO localhost\r\n");
    while ($line = fgets($socket, 515)) {
        if (substr($line, 3, 1) === ' ') break;
    }
    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 515);
    fputs($socket, base64_encode($user) . "\r\n");
    fgets($socket, 515);
    fputs($socket, base64_encode($pass) . "\r\n");
    $passResp = fgets($socket, 515);
    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if (substr($passResp, 0, 3) === '235') {
        echo json_encode(['success' => true, 'message' => 'cPanel SMTP sunucu bağlantısı başarıyla doğrulandı!']);
    } else {
        echo json_encode(['success' => false, 'error' => "Kimlik doğrulama hatası ($passResp). Lütfen kullanıcı adı ve şifrenizi kontrol edin."]);
    }
    exit;
}

// 2. SEND EMAIL
if ($route === 'send-email') {
    $to = $body['to'] ?? '';
    $subject = $body['subject'] ?? 'AKUZ Stickers Bildirimi';
    $html = $body['html'] ?? '';
    $smtpConfig = $body['smtpConfig'] ?? [];

    if (empty($to)) {
        echo json_encode(['success' => false, 'error' => 'Alıcı adresi zorunludur.']);
        exit;
    }

    $res = sendSmtpMail($smtpConfig, $to, $subject, $html);
    echo json_encode($res);
    exit;
}

// 2.5 IMAGE UPLOAD (Ürün ve vitrin fotoğrafları yükleme)
if ($route === 'upload' || $route === 'upload-image') {
    $rawBase64 = $body['image'] ?? '';
    if (empty($rawBase64)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Görsel verisi gönderilmedi.']);
        exit;
    }

    $ext = 'jpg';
    if (preg_match('/^data:image\/([a-zA-Z0-9+]+);base64,/', $rawBase64, $matches)) {
        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        if ($ext === 'svg+xml') $ext = 'svg';
        $data = substr($rawBase64, strpos($rawBase64, ',') + 1);
    } else {
        $data = $rawBase64;
    }

    $decoded = base64_decode($data);
    if ($decoded === false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Geçersiz görsel verisi.']);
        exit;
    }

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) {
        @mkdir($uploadsDir, 0755, true);
    }

    $fileName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 6) . '.' . $ext;
    $filePath = $uploadsDir . '/' . $fileName;

    if (@file_put_contents($filePath, $decoded)) {
        echo json_encode([
            'success' => true,
            'url' => '/uploads/' . $fileName,
            'fileName' => $fileName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Fotoğraf sunucuya kaydedilemedi. Klasör izinlerini kontrol edin.']);
    }
    exit;
}

// 3. PRODUCTS
if ($route === 'products') {
    $prodFile = $dataDir . '/products.json';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $products = $body['products'] ?? [];
        writeJson($prodFile, $products);
        echo json_encode(['success' => true, 'count' => count($products)]);
    } else {
        $products = readJson($prodFile, null);
        echo json_encode(['success' => true, 'products' => $products]);
    }
    exit;
}

// 4. SETTINGS
if ($route === 'settings') {
    $setFile = $dataDir . '/settings.json';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $settings = $body['settings'] ?? [];
        writeJson($setFile, $settings);
        echo json_encode(['success' => true, 'message' => 'Ayarlar kaydedildi.']);
    } else {
        $settings = readJson($setFile, null);
        echo json_encode(['success' => true, 'settings' => $settings]);
    }
    exit;
}

// 5. ORDERS
if ($route === 'orders' || strpos($route, 'orders/') === 0) {
    $ordersFile = $dataDir . '/orders.json';
    $orders = readJson($ordersFile, []);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $newOrder = $body;
        array_unshift($orders, $newOrder);
        writeJson($ordersFile, $orders);

        // Kullanıcı hesabına adres ve telefon senkronizasyonu
        $custEmail = strtolower(trim($newOrder['customerEmail'] ?? ''));
        if (!empty($custEmail) && strpos($custEmail, '@') !== false) {
            $usersFile = $dataDir . '/users.json';
            $users = readJson($usersFile, []);
            $custPhone = trim($newOrder['customerPhone'] ?? '');
            $custName = trim($newOrder['customerName'] ?? '');
            $custAddress = trim($newOrder['shippingAddress'] ?? '');
            $foundUser = false;
            foreach ($users as $k => $u) {
                if (strtolower(trim($u['email'] ?? '')) === $custEmail) {
                    $foundUser = true;
                    if (empty($u['phone']) && !empty($custPhone)) $users[$k]['phone'] = $custPhone;
                    if ((empty($u['name']) || strpos($u['name'], '@') !== false) && !empty($custName)) $users[$k]['name'] = $custName;
                    $users[$k]['addresses'] = $u['addresses'] ?? [];
                    if (!empty($custAddress)) {
                        $addrExists = false;
                        foreach ($users[$k]['addresses'] as $addr) {
                            if (($addr['fullAddress'] ?? '') === $custAddress) {
                                $addrExists = true;
                                break;
                            }
                        }
                        if (!$addrExists) {
                            $users[$k]['addresses'][] = [
                                'id' => 'addr-' . round(microtime(true) * 1000),
                                'title' => empty($users[$k]['addresses']) ? 'Ev / Teslimat Adresim' : 'Kayıtlı Adres ' . (count($users[$k]['addresses']) + 1),
                                'recipientName' => $custName ?: ($u['name'] ?? ''),
                                'phone' => $custPhone ?: ($u['phone'] ?? ''),
                                'city' => $newOrder['city'] ?? 'Bursa',
                                'district' => $newOrder['district'] ?? 'Nilüfer',
                                'fullAddress' => $custAddress,
                                'isDefault' => empty($users[$k]['addresses']),
                            ];
                        }
                    }
                    break;
                }
            }
            if (!$foundUser) {
                $users[] = [
                    'name' => $custName ?: explode('@', $custEmail)[0],
                    'email' => $custEmail,
                    'passwordHash' => 'guest_order_created',
                    'phone' => $custPhone,
                    'createdAt' => date('c'),
                    'addresses' => !empty($custAddress) ? [[
                        'id' => 'addr-' . round(microtime(true) * 1000),
                        'title' => 'Teslimat Adresim',
                        'recipientName' => $custName ?: explode('@', $custEmail)[0],
                        'phone' => $custPhone,
                        'city' => $newOrder['city'] ?? 'Bursa',
                        'district' => $newOrder['district'] ?? 'Nilüfer',
                        'fullAddress' => $custAddress,
                        'isDefault' => true,
                    ]] : [],
                ];
            }
            writeJson($usersFile, $users);
        }

        echo json_encode(['success' => true, 'order' => $newOrder]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $id = str_replace('orders/', '', $route);
        foreach ($orders as $k => $o) {
            if ($o['id'] == $id) {
                $orders[$k] = array_merge($o, $body);
                writeJson($ordersFile, $orders);
                echo json_encode(['success' => true, 'order' => $orders[$k]]);
                exit;
            }
        }
        echo json_encode(['success' => false, 'error' => 'Sipariş bulunamadı.']);
        exit;
    }

    $adminToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_GET['adminToken'] ?? '';
    if ($adminToken === 'akuz_admin_2026') {
        echo json_encode(['success' => true, 'orders' => $orders]);
        exit;
    }

    $email = strtolower(trim($_GET['email'] ?? ''));
    if (!empty($email)) {
        $userOrders = array_values(array_filter($orders, function($o) use ($email) {
            return strtolower(trim($o['customerEmail'] ?? '')) === $email;
        }));
        echo json_encode(['success' => true, 'orders' => $userOrders]);
        exit;
    }

    echo json_encode(['success' => true, 'orders' => []]);
    exit;
}

// 6. AUTH & KULLANICI YÖNETİMİ
if ($route === 'auth/check-email') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $email = strtolower(trim($body['email'] ?? ''));
    if (empty($email)) {
        echo json_encode(['success' => true, 'exists' => false]);
        exit;
    }
    foreach ($users as $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $isGoogle = ($u['passwordHash'] ?? '') === 'google_oauth_verified';
            $hasPass = !empty($u['plainPassword']) || (!empty($u['passwordHash']) && $u['passwordHash'] !== 'google_oauth_verified' && $u['passwordHash'] !== 'guest_order_created');
            echo json_encode([
                'success' => true,
                'exists' => true,
                'name' => $u['name'] ?? '',
                'email' => $u['email'] ?? $email,
                'phone' => $u['phone'] ?? '',
                'isGoogleUser' => $isGoogle,
                'hasPassword' => $hasPass,
                'authMethod' => $isGoogle ? 'google' : ($hasPass ? 'password' : 'email'),
            ]);
            exit;
        }
    }
    echo json_encode(['success' => true, 'exists' => false]);
    exit;
}

if ($route === 'auth/register') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $pass = $body['password'] ?? '';

    if (empty($name)) {
        echo json_encode(['success' => false, 'error' => 'Lütfen Ad ve Soyadınızı girin.']);
        exit;
    }
    if (empty($email) || strpos($email, '@') === false) {
        echo json_encode(['success' => false, 'error' => 'Geçerli bir e-posta adresi girin.']);
        exit;
    }
    if (strlen($pass) < 6) {
        echo json_encode(['success' => false, 'error' => 'Şifreniz en az 6 karakter olmalıdır.']);
        exit;
    }

    foreach ($users as $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            echo json_encode(['success' => false, 'error' => 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.']);
            exit;
        }
    }

    $newUser = [
        'name' => $name,
        'email' => $email,
        'passwordHash' => hash('sha256', $pass . 'akuz_salt_2026'),
        'plainPassword' => $pass,
        'phone' => '',
        'createdAt' => date('c'),
        'addresses' => [],
    ];
    $users[] = $newUser;
    writeJson($usersFile, $users);

    echo json_encode([
        'success' => true,
        'user' => [
            'name' => $name,
            'email' => $email,
            'phone' => '',
            'addresses' => [],
        ],
    ]);
    exit;
}

if ($route === 'auth/login') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $email = strtolower(trim($body['email'] ?? ''));
    $pass = $body['password'] ?? '';

    if (empty($email) || empty($pass)) {
        echo json_encode(['success' => false, 'error' => 'E-posta ve şifre gereklidir.']);
        exit;
    }

    $found = null;
    $foundIndex = -1;
    foreach ($users as $k => $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $found = $u;
            $foundIndex = $k;
            break;
        }
    }

    if (!$found) {
        echo json_encode(['success' => false, 'error' => 'Bu e-posta adresine ait hesap bulunamadı.']);
        exit;
    }

    $inputHash = hash('sha256', $pass . 'akuz_salt_2026');
    $isMatch = (($found['passwordHash'] ?? '') === $inputHash) || (($found['passwordHash'] ?? '') === $pass) || (($found['plainPassword'] ?? '') === $pass);

    if (!$isMatch) {
        echo json_encode(['success' => false, 'error' => 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.']);
        exit;
    }

    if (empty($found['plainPassword'])) {
        $users[$foundIndex]['plainPassword'] = $pass;
        writeJson($usersFile, $users);
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'name' => $found['name'] ?? '',
            'email' => $found['email'] ?? $email,
            'phone' => $found['phone'] ?? '',
            'addresses' => $found['addresses'] ?? [],
        ],
    ]);
    exit;
}

if ($route === 'auth/google') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $email = strtolower(trim($body['email'] ?? ''));
    $name = trim($body['name'] ?? '') ?: explode('@', $email)[0];

    if (empty($email)) {
        echo json_encode(['success' => false, 'error' => 'E-posta adresi eksik.']);
        exit;
    }

    $account = null;
    $foundIndex = -1;
    foreach ($users as $k => $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $account = $u;
            $foundIndex = $k;
            break;
        }
    }

    if (!$account) {
        $account = [
            'name' => $name,
            'email' => $email,
            'passwordHash' => 'google_oauth_verified',
            'phone' => '',
            'createdAt' => date('c'),
            'addresses' => [],
        ];
        $users[] = $account;
        writeJson($usersFile, $users);
    } else {
        if (empty($account['name']) && !empty($name)) {
            $users[$foundIndex]['name'] = $name;
            $account['name'] = $name;
            writeJson($usersFile, $users);
        }
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'name' => $account['name'] ?? $name,
            'email' => $account['email'] ?? $email,
            'phone' => $account['phone'] ?? '',
            'addresses' => $account['addresses'] ?? [],
            'createdAt' => $account['createdAt'] ?? date('c'),
            'isGoogleUser' => true,
        ],
    ]);
    exit;
}

if ($route === 'user/profile') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $email = strtolower(trim($_GET['email'] ?? ''));
        if (empty($email)) {
            echo json_encode(['success' => false, 'error' => 'E-posta adresi gereklidir.']);
            exit;
        }
        foreach ($users as $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                $isGoogle = ($u['passwordHash'] ?? '') === 'google_oauth_verified';
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'name' => $u['name'] ?? '',
                        'email' => $u['email'] ?? $email,
                        'phone' => $u['phone'] ?? '',
                        'addresses' => $u['addresses'] ?? [],
                        'createdAt' => $u['createdAt'] ?? '',
                        'isGoogleUser' => $isGoogle,
                        'hasPassword' => !empty($u['plainPassword']) || (!empty($u['passwordHash']) && !$isGoogle && $u['passwordHash'] !== 'guest_order_created'),
                    ],
                ]);
                exit;
            }
        }
        echo json_encode(['success' => false, 'error' => 'Kullanıcı bulunamadı.']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $email = strtolower(trim($body['email'] ?? ''));
        foreach ($users as $k => $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                if (isset($body['name'])) $users[$k]['name'] = $body['name'];
                if (isset($body['phone'])) $users[$k]['phone'] = $body['phone'];
                if (isset($body['addresses'])) $users[$k]['addresses'] = $body['addresses'];
                writeJson($usersFile, $users);
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'name' => $users[$k]['name'],
                        'email' => $users[$k]['email'],
                        'phone' => $users[$k]['phone'],
                        'addresses' => $users[$k]['addresses'],
                    ],
                ]);
                exit;
            }
        }
        echo json_encode(['success' => false, 'error' => 'Kullanıcı bulunamadı.']);
        exit;
    }
}

if ($route === 'users') {
    $adminToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_GET['adminToken'] ?? '';
    if ($adminToken !== 'akuz_admin_2026') {
        echo json_encode(['success' => false, 'error' => 'Yetkisiz erişim.']);
        exit;
    }
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $sanitized = array_map(function($u) {
        return [
            'name' => $u['name'] ?? '',
            'email' => $u['email'] ?? '',
            'phone' => $u['phone'] ?? '',
            'createdAt' => $u['createdAt'] ?? '',
            'addresses' => $u['addresses'] ?? [],
        ];
    }, $users);
    echo json_encode(['success' => true, 'users' => $sanitized]);
    exit;
}

// 7. PAYTR TOKEN OLUŞTURMA (iFrame Sanal POS Başlatma)
if ($route === 'paytr/create-token' || $route === 'paytr-create-token') {
    $setFile = $dataDir . '/settings.json';
    $settings = readJson($setFile, []);
    $paytrConfig = $settings['paytrSettings'] ?? [];

    $merchant_id = $paytrConfig['merchantId'] ?? '759874';
    $merchant_key = $paytrConfig['merchantKey'] ?? '5gGXBK84nWWo6s6r';
    $merchant_salt = $paytrConfig['merchantSalt'] ?? 'B4LSmLkCLUTUnro9';

    // Test modu: PayTR ilk entegrasyonda test ödemesi zorunludur
    $test_mode = isset($body['testMode'])
        ? ($body['testMode'] ? '1' : '0')
        : ((isset($paytrConfig['testMode']) && $paytrConfig['testMode'] === false) ? '0' : '1');

    $user_ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '85.105.100.1';
    if (strpos($user_ip, ',') !== false) {
        $user_ip = trim(explode(',', $user_ip)[0]);
    }
    if (empty($user_ip) || $user_ip === '::1' || $user_ip === '127.0.0.1' || strpos($user_ip, '192.168.') === 0 || strpos($user_ip, '10.') === 0) {
        $user_ip = '85.105.100.1';
    }

    $rawOrderId = $body['orderId'] ?? ('AKUZ' . round(microtime(true) * 1000));
    $merchant_oid = preg_replace('/[^a-zA-Z0-9]/', '', $rawOrderId);

    $numericAmount = floatval($body['totalAmount'] ?? 0);
    $payment_amount = round($numericAmount * 100);

    if ($payment_amount <= 0) {
        echo json_encode(['success' => false, 'error' => 'Geçersiz ödeme tutarı.']);
        exit;
    }

    $items = $body['items'] ?? [];
    $basketArray = [];
    if (!empty($items)) {
        foreach ($items as $it) {
            $pName = substr(strval($it['productName'] ?? 'AKUZ Sticker'), 0, 50);
            $pPrice = number_format(floatval($it['price'] ?? 0), 2, '.', '');
            $pQty = intval($it['quantity'] ?? 1);
            $basketArray[] = [$pName, $pPrice, $pQty];
        }
    } else {
        $basketArray[] = ['AKUZ Sticker Siparişi', number_format($payment_amount / 100, 2, '.', ''), 1];
    }

    $user_basket = base64_encode(json_encode($basketArray));
    $no_installment = '0';
    $max_installment = '0';
    $currency = 'TL';

    $email = strtolower(trim($body['email'] ?? '')) ?: 'musteri@akuzstickers.com';
    $hash_str = $merchant_id . $user_ip . $merchant_oid . $email . $payment_amount . $user_basket . $no_installment . $max_installment . $currency . $test_mode;
    $paytr_token = base64_encode(hash_hmac('sha256', $hash_str . $merchant_salt, $merchant_key, true));

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $origin = $protocol . '://' . $host;
    $merchant_ok_url = $origin . '/odeme-basarili?oid=' . $merchant_oid;
    $merchant_fail_url = $origin . '/odeme-basarisiz?oid=' . $merchant_oid;

    $postFields = [
        'merchant_id' => $merchant_id,
        'user_ip' => $user_ip,
        'merchant_oid' => $merchant_oid,
        'email' => $email,
        'payment_amount' => strval($payment_amount),
        'paytr_token' => $paytr_token,
        'user_basket' => $user_basket,
        'user_name' => trim($body['fullName'] ?? 'Müşteri'),
        'user_address' => ($body['address'] ?? 'Teslimat Adresi') . ', ' . ($body['district'] ?? 'Nilüfer') . '/' . ($body['city'] ?? 'Bursa'),
        'user_phone' => preg_replace('/[^0-9+]/', '', $body['phone'] ?? '+905468758671'),
        'merchant_ok_url' => $merchant_ok_url,
        'merchant_fail_url' => $merchant_fail_url,
        'timeout_limit' => '30',
        'currency' => $currency,
        'test_mode' => $test_mode,
        'no_installment' => $no_installment,
        'max_installment' => $max_installment,
        'lang' => 'tr',
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.paytr.com/odeme/api/get-token");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    $result = curl_exec($ch);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($result === false || empty($result)) {
        echo json_encode(['success' => false, 'error' => 'PayTR bağlantı hatası: ' . $curlErr]);
        exit;
    }

    $resData = json_decode($result, true);
    if (isset($resData['status']) && $resData['status'] === 'success') {
        echo json_encode([
            'success' => true,
            'token' => $resData['token'],
            'iframeUrl' => 'https://www.paytr.com/odeme/guvenli/' . $resData['token'],
            'merchantOid' => $merchant_oid,
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $resData['reason'] ?? 'PayTR token oluşturulamadı.',
        ]);
    }
    exit;
}

// 8. PAYTR SİMÜLE TEST İŞLEMİ
if ($route === 'paytr/simulate-test-transaction') {
    $setFile = $dataDir . '/settings.json';
    $settings = readJson($setFile, []);
    $paytrConfig = $settings['paytrSettings'] ?? [];

    $merchant_id = $paytrConfig['merchantId'] ?? '759874';
    $merchant_key = $paytrConfig['merchantKey'] ?? '5gGXBK84nWWo6s6r';
    $merchant_salt = $paytrConfig['merchantSalt'] ?? 'B4LSmLkCLUTUnro9';

    $testOid = 'TEST' . round(microtime(true) * 1000);
    $user_ip = '85.105.100.1';
    $email = 'test@akuzstickers.com';
    $payment_amount = 1000; // 10.00 TL
    $user_basket = base64_encode(json_encode([['PayTR Test Sticker', '10.00', 1]]));
    $no_installment = '0';
    $max_installment = '0';
    $currency = 'TL';
    $test_mode = '1';

    $hash_str = $merchant_id . $user_ip . $testOid . $email . $payment_amount . $user_basket . $no_installment . $max_installment . $currency . $test_mode;
    $paytr_token = base64_encode(hash_hmac('sha256', $hash_str . $merchant_salt, $merchant_key, true));

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $origin = $protocol . '://' . $host;

    $postFields = [
        'merchant_id' => $merchant_id,
        'user_ip' => $user_ip,
        'merchant_oid' => $testOid,
        'email' => $email,
        'payment_amount' => strval($payment_amount),
        'paytr_token' => $paytr_token,
        'user_basket' => $user_basket,
        'user_name' => 'Murat Ulusoy Test',
        'user_address' => 'Nilüfer, Bursa Test Adresi',
        'user_phone' => '+905468758671',
        'merchant_ok_url' => $origin . '/odeme-basarili?oid=' . $testOid,
        'merchant_fail_url' => $origin . '/odeme-basarisiz?oid=' . $testOid,
        'timeout_limit' => '30',
        'currency' => $currency,
        'test_mode' => '1',
        'no_installment' => $no_installment,
        'max_installment' => $max_installment,
        'lang' => 'tr',
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.paytr.com/odeme/api/get-token");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    $result = curl_exec($ch);
    curl_close($ch);

    $resData = json_decode($result, true);
    if (isset($resData['status']) && $resData['status'] === 'success') {
        echo json_encode([
            'success' => true,
            'message' => 'PayTR API Test İşlemi Başarılı! Token üretildi ve mağaza paneline kaydedildi.',
            'token' => $resData['token'],
            'iframeUrl' => 'https://www.paytr.com/odeme/guvenli/' . $resData['token'],
            'testOid' => $testOid,
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $resData['reason'] ?? 'PayTR test isteği başarısız.',
        ]);
    }
    exit;
}

// 9. PAYTR BİLDİRİM / CALLBACK (Webhook)
if ($route === 'paytr/callback' || $route === 'paytr-callback' || $route === 'callback' || $route === 'paytr/callback.php') {
    header('Content-Type: text/plain; charset=utf-8');
    
    // PayTR botu URL kontrol pingi atıyorsa veya method GET ise
    if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'HEAD') {
        echo 'OK';
        exit;
    }
    
    $postData = $_POST ?: $body;
    $merchant_oid = $postData['merchant_oid'] ?? '';
    $status = $postData['status'] ?? '';
    $total_amount = $postData['total_amount'] ?? '';
    $hash = $postData['hash'] ?? '';
    
    if (empty($merchant_oid) || empty($hash)) {
        echo 'OK';
        exit;
    }
    
    $setFile = $dataDir . '/settings.json';
    $settings = readJson($setFile, []);
    $paytrConfig = $settings['paytrSettings'] ?? [];
    $merchant_key = $paytrConfig['merchantKey'] ?? '5gGXBK84nWWo6s6r';
    $merchant_salt = $paytrConfig['merchantSalt'] ?? 'B4LSmLkCLUTUnro9';
    
    $calculatedHash = base64_encode(hash_hmac('sha256', $merchant_oid . $merchant_salt . $status . $total_amount, $merchant_key, true));
    
    if ($hash === $calculatedHash && $status === 'success') {
        $ordersFile = $dataDir . '/orders.json';
        $orders = readJson($ordersFile, []);
        foreach ($orders as $k => $o) {
            $cleanId = preg_replace('/[^a-zA-Z0-9]/', '', $o['id'] ?? '');
            if ($cleanId === $merchant_oid || ($o['id'] ?? '') === $merchant_oid) {
                $orders[$k]['status'] = 'Hazırlanıyor';
                $orders[$k]['paymentStatus'] = 'Ödendi';
                $orders[$k]['paymentMethod'] = 'PayTR Kredi / Banka Kartı (3D Secure)';
                $orders[$k]['paidAt'] = date('c');
                writeJson($ordersFile, $orders);
                break;
            }
        }
    }
    
    echo 'OK';
    exit;
}

// DEFAULT FALLBACK
echo json_encode(['success' => true, 'message' => 'AKUZ cPanel API Aktif']);
