<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
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

// Pure PHP SMTP socket function (RFC 5321 Multiline Response uyumlu)
function smtpReadResponse($socket) {
    $full = '';
    $lastLine = '';
    $code = '';
    while (!feof($socket)) {
        $line = fgets($socket, 1024);
        if ($line === false) {
            break;
        }
        $full .= $line;
        $lastLine = $line;
        // RFC 5321: Çok satırlı yanıtlarda 4. karakter tire '-' olur (örn. 250-SIZE ...)
        // Son satırda 4. karakter boşluk ' ' olur veya sadece 3 basamaklı koddur.
        if (preg_match('/^([0-9]{3})([ -]|$)/', $line, $m)) {
            $code = $m[1];
            if (!isset($m[2]) || $m[2] === ' ' || $m[2] === '' || $m[2] === "\r" || $m[2] === "\n") {
                break;
            }
        }
    }
    return [
        'code' => $code,
        'full' => trim($full),
        'lastLine' => trim($lastLine),
    ];
}

function smtpOpenConnection($host, $port, $timeout = 15) {
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ]);
    $protocol = ($port == 465) ? 'ssl://' : 'tcp://';
    $remote = $protocol . $host . ':' . $port;
    $errno = 0;
    $errstr = '';
    $socket = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        $fallbackHost = ($port == 465 ? 'ssl://' : '') . $host;
        $socket = @fsockopen($fallbackHost, $port, $errno, $errstr, $timeout);
    }
    if ($socket) {
        stream_set_timeout($socket, $timeout);
    }
    return [$socket, $errno, $errstr];
}

function smtpPerformHandshakeAndAuth($socket, $host, $port, $user, $pass) {
    // 1. Karşılama bannerını (220) tüm satırlarıyla oku
    $banner = smtpReadResponse($socket);
    if ($banner['code'] !== '220') {
        return ['success' => false, 'error' => "SMTP sunucusu bağlantıyı kabul etmedi (" . ($banner['code'] ?: 'Cevap yok') . "): " . $banner['full']];
    }

    // 2. EHLO gönder ve çok satırlı cevabı tamamen tüket
    $ehloDomain = !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'akuzstickers.com';
    fputs($socket, "EHLO $ehloDomain\r\n");
    $ehlo = smtpReadResponse($socket);

    if ($ehlo['code'] !== '250') {
        fputs($socket, "HELO $ehloDomain\r\n");
        $helo = smtpReadResponse($socket);
        if ($helo['code'] !== '250') {
            return ['success' => false, 'error' => "EHLO/HELO reddedildi (" . $helo['code'] . "): " . $helo['full']];
        }
    }

    // 3. Port 587 STARTTLS desteği
    if ($port == 587) {
        fputs($socket, "STARTTLS\r\n");
        $tls = smtpReadResponse($socket);
        if ($tls['code'] === '220') {
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                return ['success' => false, 'error' => "TLS şifreleme başlatılamadı."];
            }
            fputs($socket, "EHLO $ehloDomain\r\n");
            $ehlo2 = smtpReadResponse($socket);
            if ($ehlo2['code'] !== '250') {
                return ['success' => false, 'error' => "TLS sonrası EHLO reddedildi: " . $ehlo2['full']];
            }
        }
    }

    // 4. AUTH LOGIN başlat
    fputs($socket, "AUTH LOGIN\r\n");
    $auth = smtpReadResponse($socket);
    if ($auth['code'] !== '334') {
        // Yedek: AUTH PLAIN dene
        $plainAuth = base64_encode("\0" . $user . "\0" . $pass);
        fputs($socket, "AUTH PLAIN $plainAuth\r\n");
        $plainResp = smtpReadResponse($socket);
        if ($plainResp['code'] === '235') {
            return ['success' => true];
        }
        return ['success' => false, 'error' => "AUTH LOGIN reddedildi (" . $auth['code'] . "): " . $auth['full']];
    }

    // 5. Kullanıcı Adı (Base64)
    fputs($socket, base64_encode($user) . "\r\n");
    $userResp = smtpReadResponse($socket);
    if ($userResp['code'] !== '334') {
        return ['success' => false, 'error' => "Kullanıcı adı kabul edilmedi (" . $userResp['code'] . "): " . $userResp['full']];
    }

    // 6. Şifre (Base64)
    fputs($socket, base64_encode($pass) . "\r\n");
    $passResp = smtpReadResponse($socket);
    if ($passResp['code'] !== '235') {
        $msg = "cPanel Kimlik Doğrulama Hatası (535): Girdiğiniz e-posta kullanıcı adı ('$user') veya hesap şifresi cPanel sunucusu tarafından reddedildi.";
        if (!empty($passResp['full'])) {
            $msg .= " Sunucu yanıtı: " . $passResp['full'];
        }
        return ['success' => false, 'error' => $msg];
    }

    return ['success' => true];
}

function sendSmtpMail($smtpConfig, $to, $subject, $html) {
    $host = !empty($smtpConfig['host']) ? trim($smtpConfig['host']) : (getenv('SMTP_HOST') ?: 'mail.akuzstickers.com');
    $port = !empty($smtpConfig['port']) ? intval($smtpConfig['port']) : 465;
    $user = !empty($smtpConfig['user']) ? trim($smtpConfig['user']) : (getenv('SMTP_USER') ?: 'info@akuzstickers.com');
    $pass = !empty($smtpConfig['pass']) ? trim($smtpConfig['pass']) : getenv('SMTP_PASS');
    $fromName = !empty($smtpConfig['fromName']) ? trim($smtpConfig['fromName']) : 'AKUZ Stickers';
    $fromEmail = !empty($smtpConfig['fromEmail']) ? trim($smtpConfig['fromEmail']) : ($user ?: 'info@akuzstickers.com');

    if (empty($host) || empty($user) || empty($pass)) {
        return ['success' => false, 'error' => 'cPanel SMTP hesap şifreniz henüz girilmemiş. Lütfen Yönetici Paneli -> E-posta & SMTP sekmesinden kurumsal e-posta şifrenizi kaydedin.'];
    }

    list($socket, $errno, $errstr) = smtpOpenConnection($host, $port, 15);
    if (!$socket) {
        return ['success' => false, 'error' => "SMTP Sunucusuna Bağlanılamadı ($errno): $errstr. ($host:$port)"];
    }

    $auth = smtpPerformHandshakeAndAuth($socket, $host, $port, $user, $pass);
    if (!$auth['success']) {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return $auth;
    }

    // MAIL FROM
    fputs($socket, "MAIL FROM: <$fromEmail>\r\n");
    $fromResp = smtpReadResponse($socket);
    if ($fromResp['code'] !== '250') {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return ['success' => false, 'error' => "Gönderici adresi reddedildi: " . $fromResp['full']];
    }

    // RCPT TO
    fputs($socket, "RCPT TO: <$to>\r\n");
    $toResp = smtpReadResponse($socket);
    if ($toResp['code'] !== '250') {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return ['success' => false, 'error' => "Alıcı adresi reddedildi: " . $toResp['full']];
    }

    // DATA
    fputs($socket, "DATA\r\n");
    $dataResp = smtpReadResponse($socket);
    if ($dataResp['code'] !== '354') {
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return ['success' => false, 'error' => "DATA komutu reddedildi: " . $dataResp['full']];
    }

    // Logo doğrudan https://akuzstickers.com/akuz-logo-badge.png üzerinden yüklenir.
    // Ek (attachment) eklenmez; böylece Gmail veya mobil posta istemcilerinde altta 'akuz-logo.png' ek kutucuğu gözükmez.
    $sanitizedHtml = str_replace('cid:akuz-logo@akuzstickers.com', 'https://akuzstickers.com/akuz-logo-badge.png', $html);

    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    fputs($socket, $headers . "\r\n" . $sanitizedHtml . "\r\n.\r\n");
    $sendResp = smtpReadResponse($socket);

    fputs($socket, "QUIT\r\n");
    smtpReadResponse($socket);
    fclose($socket);

    if ($sendResp['code'] === '250') {
        return ['success' => true, 'messageId' => trim($sendResp['full'])];
    } else {
        return ['success' => false, 'error' => "E-posta gönderim yanıtı: " . $sendResp['full']];
    }
}

// 1. SMTP TEST
if ($route === 'test-smtp') {
    $cfg = $body['smtpConfig'] ?? [];
    $host = !empty($cfg['host']) ? trim($cfg['host']) : (getenv('SMTP_HOST') ?: 'mail.akuzstickers.com');
    $port = !empty($cfg['port']) ? intval($cfg['port']) : 465;
    $user = !empty($cfg['user']) ? trim($cfg['user']) : (getenv('SMTP_USER') ?: 'info@akuzstickers.com');
    $pass = !empty($cfg['pass']) ? trim($cfg['pass']) : getenv('SMTP_PASS');

    if (empty($host) || empty($user) || empty($pass)) {
        echo json_encode(['success' => false, 'error' => 'Host, kullanıcı adı ve şifre zorunludur. Lütfen cPanel e-posta şifrenizi girin.']);
        exit;
    }

    list($socket, $errno, $errstr) = smtpOpenConnection($host, $port, 15);
    if (!$socket) {
        echo json_encode(['success' => false, 'error' => "Bağlantı hatası ($errno): $errstr. Sunucu: $host:$port"]);
        exit;
    }

    $auth = smtpPerformHandshakeAndAuth($socket, $host, $port, $user, $pass);
    fputs($socket, "QUIT\r\n");
    smtpReadResponse($socket);
    fclose($socket);

    if ($auth['success']) {
        echo json_encode(['success' => true, 'message' => 'cPanel SMTP sunucu bağlantısı ve kimlik doğrulama başarıyla doğrulandı!']);
    } else {
        echo json_encode(['success' => false, 'error' => $auth['error']]);
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

// 2b. CART (Sepet senkronizasyonu - MySQL ve JSON)
if ($route === 'cart' || $route === 'cart.php' || strpos($route, 'cart') === 0) {
    if (file_exists(__DIR__ . '/cart.php')) {
        require __DIR__ . '/cart.php';
        exit;
    }
}

// 2c. FAVORITES (Favori senkronizasyonu - MySQL ve JSON)
if ($route === 'favorites' || $route === 'favorites.php' || strpos($route, 'favorites') === 0) {
    if (file_exists(__DIR__ . '/favorites.php')) {
        require __DIR__ . '/favorites.php';
        exit;
    }
}

// 3. PRODUCTS
if ($route === 'products' || preg_match('#^products/#', $route)) {
    $prodFile = $dataDir . '/products.json';
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || $route === 'products/delete') {
        $id = $_GET['id'] ?? ($body['id'] ?? '');
        if (empty($id) && preg_match('#^products/(.+)$#', $route, $matches)) {
            $id = $matches[1];
        }
        $products = readJson($prodFile, []);
        $filtered = array_values(array_filter($products, function($p) use ($id) {
            return ($p['id'] ?? '') !== $id && ($p['slug'] ?? '') !== $id;
        }));
        writeJson($prodFile, $filtered);
        echo json_encode(['success' => true, 'count' => count($filtered), 'deletedId' => $id]);
        exit;
    }
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

// ACTION tabanlı veya route tabanlı Kayıt Olma (MySQL & JSON)
if ($route === 'auth/register' || $route === 'auth.php' && ($body['action'] ?? '') === 'register' || ($body['action'] ?? '') === 'register') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $name = trim($body['full_name'] ?? ($body['name'] ?? ''));
    $email = strtolower(trim($body['email'] ?? ''));
    $pass = strval($body['password'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $address = trim($body['address'] ?? '');

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

    $addresses = !empty($address) ? [
        [
            'id' => 'addr-1',
            'title' => 'Ev / Teslimat Adresim',
            'recipientName' => $name,
            'phone' => $phone,
            'city' => 'Bursa',
            'district' => 'Nilüfer',
            'fullAddress' => $address,
            'isDefault' => true,
        ]
    ] : [];

    $newUser = [
        'name' => $name,
        'full_name' => $name,
        'email' => $email,
        'passwordHash' => hash('sha256', $pass . 'akuz_salt_2026'),
        'plainPassword' => $pass,
        'phone' => $phone,
        'address' => $address,
        'createdAt' => date('c'),
        'addresses' => $addresses,
    ];
    $users[] = $newUser;
    writeJson($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'Kayıt başarılı, giriş yapabilirsiniz',
        'user' => [
            'name' => $name,
            'full_name' => $name,
            'email' => $email,
            'phone' => $phone,
            'address' => $address,
            'addresses' => $addresses,
        ],
    ]);
    exit;
}

// ACTION tabanlı veya route tabanlı Giriş Yapma (MySQL & JSON)
if ($route === 'auth/login' || $route === 'auth.php' && ($body['action'] ?? '') === 'login' || ($body['action'] ?? '') === 'login') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $email = strtolower(trim($body['email'] ?? ''));
    $pass = strval($body['password'] ?? '');

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
        echo json_encode(['success' => false, 'error' => 'Bu e-posta adresine ait hesap bulunamadı. Lütfen kayıt olun.']);
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

    $fullName = $found['full_name'] ?? ($found['name'] ?? explode('@', $email)[0]);
    $phone = $found['phone'] ?? '';
    $addrStr = $found['address'] ?? ($found['addresses'][0]['fullAddress'] ?? '');
    $addresses = $found['addresses'] ?? [];
    if (empty($addresses) && !empty($addrStr)) {
        $addresses = [
            [
                'id' => 'addr-1',
                'title' => 'Kayıtlı Adresim',
                'recipientName' => $fullName,
                'phone' => $phone,
                'city' => 'Bursa',
                'district' => 'Nilüfer',
                'fullAddress' => $addrStr,
                'isDefault' => true,
            ]
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Giriş başarılı',
        'user' => [
            'name' => $fullName,
            'full_name' => $fullName,
            'email' => $found['email'] ?? $email,
            'phone' => $phone,
            'address' => $addrStr,
            'addresses' => $addresses,
        ],
    ]);
    exit;
}

if ($route === 'auth/google' || $route === 'google_auth' || $route === 'google_auth.php') {
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    $email = strtolower(trim($body['email'] ?? ''));
    $name = trim($body['name'] ?? ($body['fullname'] ?? '')) ?: explode('@', $email)[0];

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
        $userId = 'usr_' . time() . '_' . mt_rand(100, 999);
        $account = [
            'id' => $userId,
            'user_id' => $userId,
            'name' => $name,
            'full_name' => $name,
            'email' => $email,
            'passwordHash' => 'google_oauth_verified',
            'phone' => '',
            'createdAt' => date('c'),
            'auth_provider' => 'google',
            'provider' => 'google',
            'authProvider' => 'google',
            'registeredVia' => 'google',
            'addresses' => [],
            'cart' => [],
            'favorites' => [],
        ];
        $users[] = $account;
        writeJson($usersFile, $users);
    } else {
        $users[$foundIndex]['auth_provider'] = 'google';
        $users[$foundIndex]['provider'] = 'google';
        $users[$foundIndex]['authProvider'] = 'google';
        $users[$foundIndex]['registeredVia'] = 'google';
        if (empty($account['name']) && !empty($name)) {
            $users[$foundIndex]['name'] = $name;
            $users[$foundIndex]['full_name'] = $name;
            $account['name'] = $name;
        }
        writeJson($usersFile, $users);
    }

    if (isset($db) && $db instanceof PDO) {
        try {
            $stmt = $db->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
            $stmt->execute([$email]);
            $existingMysql = $stmt->fetch();
            if ($existingMysql) {
                @$db->prepare("UPDATE users SET auth_provider = 'google' WHERE LOWER(email) = ?")->execute([$email]);
            } else {
                $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
                $ins = $db->prepare("INSERT INTO users (fullname, phone, email, password, auth_provider) VALUES (?, ?, ?, ?, 'google')");
                $ins->execute([$name, '', $email, $randomPass]);
            }
        } catch (Exception $e) {}
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $account['id'] ?? ('usr_' . md5($email)),
            'name' => $account['name'] ?? $name,
            'fullname' => $account['name'] ?? $name,
            'email' => $account['email'] ?? $email,
            'phone' => $account['phone'] ?? '',
            'addresses' => $account['addresses'] ?? [],
            'createdAt' => $account['createdAt'] ?? date('c'),
            'isGoogleUser' => true,
            'authProvider' => 'google',
            'provider' => 'google',
            'registeredVia' => 'google',
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

        // Önce MySQL'den en güncel verileri çekmeyi dene
        if (isset($db) && $db) {
            try {
                $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $mysqlUser = $stmt->fetch();
                if ($mysqlUser) {
                    $mAddrs = [];
                    if (!empty($mysqlUser['addresses'])) {
                        $dec = json_decode($mysqlUser['addresses'], true);
                        if (is_array($dec)) $mAddrs = $dec;
                    } elseif (!empty($mysqlUser['address'])) {
                        $mAddrs = [[
                            'id' => 'addr-1',
                            'title' => 'Kayıtlı Adresim',
                            'recipientName' => $mysqlUser['fullname'] ?? ($mysqlUser['name'] ?? ''),
                            'phone' => $mysqlUser['phone'] ?? '',
                            'fullAddress' => $mysqlUser['address'],
                            'isDefault' => true,
                        ]];
                    }

                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'name' => $mysqlUser['fullname'] ?? ($mysqlUser['name'] ?? ''),
                            'fullname' => $mysqlUser['fullname'] ?? ($mysqlUser['name'] ?? ''),
                            'email' => $mysqlUser['email'],
                            'phone' => $mysqlUser['phone'] ?? '',
                            'addresses' => $mAddrs,
                            'isGoogleUser' => ($mysqlUser['auth_provider'] ?? '') === 'google',
                            'hasPassword' => !empty($mysqlUser['password']),
                        ],
                    ]);
                    exit;
                }
            } catch (Exception $e) {}
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

    if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = strtolower(trim($body['email'] ?? ''));
        $name = trim($body['name'] ?? ($body['fullname'] ?? ''));
        $phone = trim($body['phone'] ?? '');
        $addresses = $body['addresses'] ?? null;
        $address = trim($body['address'] ?? '');

        if (empty($email)) {
            echo json_encode(['success' => false, 'error' => 'E-posta adresi eksik.']);
            exit;
        }

        // 1. MySQL Veritabanında güncelle (Hesapta yapılan tüm değişiklikler)
        if (function_exists('syncUserToMysql') && isset($db)) {
            syncUserToMysql($db, [
                'email' => $email,
                'fullname' => $name,
                'name' => $name,
                'phone' => $phone,
                'addresses' => $addresses,
                'address' => $address,
            ]);
        }

        // 2. data_storage/users.json dosyasını da senkronize tut
        $foundUser = false;
        foreach ($users as $k => $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                if (isset($body['name'])) $users[$k]['name'] = $name;
                if (isset($body['phone'])) $users[$k]['phone'] = $phone;
                if (isset($body['addresses'])) $users[$k]['addresses'] = $addresses;
                $foundUser = true;
                break;
            }
        }
        if (!$foundUser && !empty($email)) {
            $users[] = [
                'name' => $name ?: explode('@', $email)[0],
                'email' => $email,
                'phone' => $phone,
                'addresses' => $addresses ?: [],
                'createdAt' => date('c'),
            ];
        }
        writeJson($usersFile, $users);

        echo json_encode([
            'success' => true,
            'message' => 'Hesap bilgileri MySQL veritabanında güncellendi.',
            'user' => [
                'name' => $name,
                'fullname' => $name,
                'email' => $email,
                'phone' => $phone,
                'addresses' => $addresses ?: [],
            ],
        ]);
        exit;
    }
}

// 6b. KULLANICI ŞİFRE GÜNCELLEME (Hesap Bilgilerinden Şifre Değiştirme)
if ($route === 'user/password') {
    $email = strtolower(trim($body['email'] ?? ''));
    $newPassword = $body['newPassword'] ?? ($body['password'] ?? '');
    $currentPassword = $body['currentPassword'] ?? '';

    if (empty($email) || empty($newPassword)) {
        echo json_encode(['success' => false, 'error' => 'E-posta ve yeni şifre gereklidir.']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        echo json_encode(['success' => false, 'error' => 'Yeni şifreniz en az 6 karakterden oluşmalıdır.']);
        exit;
    }

    // 1. MySQL Veritabanında güncelle
    if (function_exists('syncUserToMysql') && isset($db)) {
        syncUserToMysql($db, [
            'email' => $email,
            'password' => $newPassword,
        ]);
    }

    // 2. data_storage/users.json güncelle
    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);
    foreach ($users as $k => $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $users[$k]['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
            $users[$k]['plainPassword'] = $newPassword;
            writeJson($usersFile, $users);
            break;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Şifreniz MySQL veritabanında başarıyla güncellendi.',
    ]);
    exit;
}

if ($route === 'users') {
    $adminToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_GET['adminToken'] ?? '';
    if ($adminToken !== 'akuz_admin_2026') {
        echo json_encode(['success' => false, 'error' => 'Yetkisiz erişim.']);
        exit;
    }

    $usersFile = $dataDir . '/users.json';
    $users = readJson($usersFile, []);

    // 1. Eğer MySQL veritabanı aktifse, MySQL'deki kullanıcıları da oku ve users.json ile tam eşitle
    if (isset($db) && $db instanceof PDO) {
        try {
            $stmt = $db->query("SELECT * FROM users");
            $mysqlUsers = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            $hasChanges = false;

            foreach ($mysqlUsers as $mu) {
                $mEmail = strtolower(trim($mu['email'] ?? ''));
                if (empty($mEmail)) continue;

                $foundIdx = -1;
                foreach ($users as $idx => $ju) {
                    if (strtolower(trim($ju['email'] ?? '')) === $mEmail) {
                        $foundIdx = $idx;
                        break;
                    }
                }

                $mName = trim($mu['fullname'] ?? ($mu['name'] ?? ''));
                $mPhone = trim($mu['phone'] ?? '');
                $mAddresses = [];
                if (!empty($mu['addresses'])) {
                    $dec = json_decode($mu['addresses'], true);
                    if (is_array($dec)) $mAddresses = $dec;
                } elseif (!empty($mu['address'])) {
                    $mAddresses = [['id' => 'addr-1', 'title' => 'Adres', 'fullAddress' => $mu['address'], 'isDefault' => true]];
                }
                $mCart = !empty($mu['cart']) ? (json_decode($mu['cart'], true) ?: []) : [];
                $mFavs = !empty($mu['favorites']) ? (json_decode($mu['favorites'], true) ?: []) : [];
                $isGoogle = ($mu['auth_provider'] ?? '') === 'google';

                if ($foundIdx === -1) {
                    $users[] = [
                        'id' => $mu['id'] ? ('usr_' . $mu['id']) : ('usr_' . md5($mEmail)),
                        'name' => $mName ?: explode('@', $mEmail)[0],
                        'full_name' => $mName ?: explode('@', $mEmail)[0],
                        'email' => $mEmail,
                        'phone' => $mPhone,
                        'createdAt' => $mu['created_at'] ?? date('c'),
                        'auth_provider' => $isGoogle ? 'google' : 'local',
                        'provider' => $isGoogle ? 'google' : 'local',
                        'authProvider' => $isGoogle ? 'google' : 'local',
                        'registeredVia' => $isGoogle ? 'google' : 'local',
                        'passwordHash' => $isGoogle ? 'google_oauth_verified' : ($mu['password'] ?? ''),
                        'addresses' => $mAddresses,
                        'cart' => $mCart,
                        'favorites' => $mFavs,
                    ];
                    $hasChanges = true;
                } else {
                    if ($isGoogle && ($users[$foundIdx]['authProvider'] ?? '') !== 'google') {
                        $users[$foundIdx]['authProvider'] = 'google';
                        $users[$foundIdx]['provider'] = 'google';
                        $users[$foundIdx]['auth_provider'] = 'google';
                        $hasChanges = true;
                    }
                }
            }

            if ($hasChanges) {
                writeJson($usersFile, $users);
            }
        } catch (Exception $e) {
            error_log("[MySQL Admin Users Merge Error] " . $e->getMessage());
        }
    }

    // Kullanıcı Silme (DELETE veya ?delete=1)
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || isset($_GET['delete'])) {
        $emailToDelete = strtolower(trim($_GET['email'] ?? $body['email'] ?? ''));
        if (!empty($emailToDelete)) {
            $users = array_values(array_filter($users, function($u) use ($emailToDelete) {
                $uEmail = strtolower(trim($u['email'] ?? ''));
                $uId = strtolower(trim($u['id'] ?? ''));
                return $uEmail !== $emailToDelete && $uId !== $emailToDelete;
            }));
            writeJson($usersFile, $users);
            if (isset($db) && $db instanceof PDO) {
                try {
                    $delStmt = $db->prepare("DELETE FROM users WHERE LOWER(email) = ?");
                    $delStmt->execute([$emailToDelete]);
                } catch (Exception $e) {}
            }
        }
        echo json_encode(['success' => true, 'count' => count($users)]);
        exit;
    }

    $sanitized = array_map(function($u) {
        $isGoogle = ($u['isGoogleUser'] ?? false) === true || ($u['auth_provider'] ?? '') === 'google' || ($u['provider'] ?? '') === 'google' || ($u['authProvider'] ?? '') === 'google' || ($u['registeredVia'] ?? '') === 'google' || ($u['passwordHash'] ?? '') === 'google_oauth_verified';
        return [
            'id' => $u['id'] ?? ('usr_' . md5($u['email'] ?? '')),
            'name' => $u['name'] ?? $u['full_name'] ?? 'Kullanıcı',
            'email' => $u['email'] ?? '',
            'phone' => $u['phone'] ?? '',
            'createdAt' => $u['createdAt'] ?? date('c'),
            'isGoogleUser' => $isGoogle,
            'authProvider' => $isGoogle ? 'google' : 'normal',
            'auth_provider' => $isGoogle ? 'google' : 'normal',
            'provider' => $isGoogle ? 'google' : 'normal',
            'registeredVia' => $isGoogle ? 'google' : 'normal',
            'addresses' => $u['addresses'] ?? [],
            'cart' => $u['cart'] ?? [],
            'favorites' => $u['favorites'] ?? [],
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
?>
