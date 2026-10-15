<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Gelen JSON veya Form gövdesini al
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);
if (!is_array($body) || empty($body)) {
    $body = $_POST;
}

$action = $body['action'] ?? ($_GET['action'] ?? '');

// 2. Merkezi Veri Depolama Klasörü (data_storage)
$dataDir = __DIR__ . '/../../data_storage';
if (!is_dir($dataDir)) {
    $dataDir = __DIR__ . '/../data_storage';
}
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$usersFile = $dataDir . '/users.json';

function readJsonUsers($filePath) {
    if (!file_exists($filePath)) return [];
    $raw = @file_get_contents($filePath);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeJsonUsers($filePath, $data) {
    @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// 3. MySQL Veritabanı Bağlantısı (Varsa PDO ile bağlanır, yoksa data_storage/users.json kullanır)
$pdo = null;
$dbHost = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: 'localhost');
$dbName = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: '');
$dbUser = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: '');
$dbPass = getenv('DB_PASS') ?: (getenv('MYSQL_PASSWORD') ?: '');

if (!empty($dbName) && !empty($dbUser)) {
    try {
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        // Tablo yoksa otomatik oluştur
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(150),
            email VARCHAR(150) UNIQUE,
            password_hash VARCHAR(255),
            plain_password VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (Exception $e) {
        $pdo = null; // MySQL bağlanamazsa güvenli JSON depolamaya devam et
    }
}

// ====================================================
// A. KAYIT OLMA (ACTION: 'register')
// JSON: { action: 'register', email: '...', password: '...', full_name: '...', phone: '...', address: '...' }
// ====================================================
if ($action === 'register') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = strval($body['password'] ?? '');
    $fullName = trim($body['full_name'] ?? ($body['name'] ?? ''));
    $phone = trim($body['phone'] ?? '');
    $address = trim($body['address'] ?? '');

    if (empty($fullName)) {
        echo json_encode(['success' => false, 'error' => 'Lütfen Ad ve Soyadınızı girin.']);
        exit;
    }

    if (empty($email) || strpos($email, '@') === false) {
        echo json_encode(['success' => false, 'error' => 'Geçerli bir e-posta adresi girin.']);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'error' => 'Şifreniz en az 6 karakter olmalıdır.']);
        exit;
    }

    // 1. MySQL veritabanı aktifse oraya kaydet
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.']);
                exit;
            }

            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $insert = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, plain_password, phone, address, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $insert->execute([$fullName, $email, $hashed, $password, $phone, $address]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Veritabanı kayıt hatası: ' . $e->getMessage()]);
            exit;
        }
    }

    // 2. Her durumda data_storage/users.json ile de senkronize et (çift emniyet)
    $users = readJsonUsers($usersFile);
    $exists = false;
    foreach ($users as $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $exists = true;
            break;
        }
    }

    if (!$exists) {
        $newUser = [
            'name' => $fullName,
            'full_name' => $fullName,
            'email' => $email,
            'passwordHash' => hash('sha256', $password . 'akuz_salt_2026'),
            'plainPassword' => $password,
            'phone' => $phone,
            'address' => $address,
            'createdAt' => date('c'),
            'addresses' => !empty($address) ? [
                [
                    'id' => 'addr-1',
                    'title' => 'Ev / Teslimat Adresim',
                    'recipientName' => $fullName,
                    'phone' => $phone,
                    'city' => 'Bursa',
                    'district' => 'Nilüfer',
                    'fullAddress' => $address,
                    'isDefault' => true,
                ]
            ] : [],
        ];
        $users[] = $newUser;
        writeJsonUsers($usersFile, $users);
    } else if (!$pdo) {
        echo json_encode(['success' => false, 'error' => 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.']);
        exit;
    }

    $responseUser = [
        'full_name' => $fullName,
        'name' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'address' => $address,
        'addresses' => !empty($address) ? [
            [
                'id' => 'addr-1',
                'title' => 'Ev / Teslimat Adresim',
                'recipientName' => $fullName,
                'phone' => $phone,
                'city' => 'Bursa',
                'district' => 'Nilüfer',
                'fullAddress' => $address,
                'isDefault' => true,
            ]
        ] : [],
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Kayıt başarılı, giriş yapabilirsiniz',
        'user' => $responseUser,
    ]);
    exit;
}

// ====================================================
// B. GİRİŞ YAPMA (ACTION: 'login')
// JSON: { action: 'login', email: '...', password: '...' }
// ====================================================
if ($action === 'login') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = strval($body['password'] ?? '');

    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'E-posta ve şifre gereklidir.']);
        exit;
    }

    $foundUser = null;

    // 1. Önce MySQL veritabanını kontrol et
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $dbRow = $stmt->fetch();
            if ($dbRow) {
                $hash = $dbRow['password_hash'] ?? '';
                if ($hash === 'google_oauth_verified' || ($dbRow['auth_provider'] ?? '') === 'google') {
                    echo json_encode([
                        'success' => false,
                        'isGoogleAccount' => true,
                        'error' => 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" seçeneğini kullanarak oturum açınız.'
                    ]);
                    exit;
                }
                $plain = $dbRow['plain_password'] ?? '';
                $match = false;

                if (!empty($hash) && password_verify($password, $hash)) {
                    $match = true;
                } else if ($plain === $password || $hash === $password || $hash === hash('sha256', $password . 'akuz_salt_2026')) {
                    $match = true;
                }

                if ($match) {
                    $addrStr = $dbRow['address'] ?? '';
                    $fullName = $dbRow['full_name'] ?? explode('@', $email)[0];
                    $phone = $dbRow['phone'] ?? '';
                    $foundUser = [
                        'full_name' => $fullName,
                        'name' => $fullName,
                        'email' => $dbRow['email'],
                        'phone' => $phone,
                        'address' => $addrStr,
                        'addresses' => !empty($addrStr) ? [
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
                        ] : [],
                    ];
                } else {
                    echo json_encode(['success' => false, 'error' => 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.']);
                    exit;
                }
            }
        } catch (Exception $e) {
            // MySQL sorgu hatasında JSON depolamadan dene
        }
    }

    // 2. MySQL'de bulunamadıysa veya MySQL yoksa data_storage/users.json'dan kontrol et
    if (!$foundUser) {
        $users = readJsonUsers($usersFile);
        $account = null;
        foreach ($users as $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                $account = $u;
                break;
            }
        }

        if (!$account) {
            echo json_encode(['success' => false, 'error' => 'Bu e-posta adresine ait hesap bulunamadı. Lütfen kayıt olun.']);
            exit;
        }

        if (($account['passwordHash'] ?? '') === 'google_oauth_verified' || ($account['auth_provider'] ?? '') === 'google') {
            echo json_encode([
                'success' => false,
                'isGoogleAccount' => true,
                'error' => 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" seçeneğini kullanarak oturum açınız.'
            ]);
            exit;
        }

        $inputHash = hash('sha256', $password . 'akuz_salt_2026');
        $isMatch = (($account['passwordHash'] ?? '') === $inputHash)
            || (($account['passwordHash'] ?? '') === $password)
            || (($account['plainPassword'] ?? '') === $password);

        if (!$isMatch) {
            echo json_encode(['success' => false, 'error' => 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.']);
            exit;
        }

        $fullName = $account['name'] ?? ($account['full_name'] ?? explode('@', $email)[0]);
        $phone = $account['phone'] ?? '';
        $addrStr = $account['address'] ?? ($account['addresses'][0]['fullAddress'] ?? '');
        $addresses = $account['addresses'] ?? [];
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

        $foundUser = [
            'full_name' => $fullName,
            'name' => $fullName,
            'email' => $account['email'] ?? $email,
            'phone' => $phone,
            'address' => $addrStr,
            'addresses' => $addresses,
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Giriş başarılı',
        'user' => $foundUser,
    ]);
    exit;
}

// ====================================================
// C. GOOGLE İLE GİRİŞ & İSİM SOYİSİM SENKRONİZASYONU (ACTION: 'google')
// ====================================================
if ($action === 'google') {
    $email = strtolower(trim($body['email'] ?? ''));
    $fullName = trim($body['full_name'] ?? ($body['name'] ?? ''));
    if (empty($fullName)) {
        $fullName = explode('@', $email)[0];
    }

    if (empty($email)) {
        echo json_encode(['success' => false, 'error' => 'E-posta eksik.']);
        exit;
    }

    $foundUser = null;

    // 1. MySQL varsa kullanıcıyı bul veya ekle/güncelle
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $dbRow = $stmt->fetch();
            if ($dbRow) {
                // İsmi güncelle
                $up = $pdo->prepare("UPDATE users SET full_name = ? WHERE email = ?");
                $up->execute([$fullName, $email]);
                $addrStr = $dbRow['address'] ?? '';
                $phone = $dbRow['phone'] ?? '';
            } else {
                $ins = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, plain_password, phone, address) VALUES (?, ?, ?, ?, ?, ?)");
                $ins->execute([$fullName, $email, 'google_oauth_user', '', '', '']);
                $addrStr = '';
                $phone = '';
            }

            $foundUser = [
                'full_name' => $fullName,
                'name' => $fullName,
                'email' => $email,
                'phone' => $phone,
                'address' => $addrStr,
                'addresses' => !empty($addrStr) ? [
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
                ] : [],
            ];
        } catch (Exception $e) {
            // MySQL hata verirse JSON'a devam et
        }
    }

    // 2. data_storage/users.json'da da senkronize tut
    $users = readJsonUsers($usersFile);
    $idx = -1;
    foreach ($users as $k => $u) {
        if (strtolower(trim($u['email'] ?? '')) === $email) {
            $idx = $k;
            break;
        }
    }

    if ($idx !== -1) {
        $users[$idx]['name'] = $fullName;
        $users[$idx]['full_name'] = $fullName;
        if (!$foundUser) {
            $foundUser = [
                'full_name' => $fullName,
                'name' => $fullName,
                'email' => $email,
                'phone' => $users[$idx]['phone'] ?? '',
                'address' => $users[$idx]['address'] ?? '',
                'addresses' => $users[$idx]['addresses'] ?? [],
            ];
        }
    } else {
        $newUser = [
            'name' => $fullName,
            'full_name' => $fullName,
            'email' => $email,
            'passwordHash' => 'google_oauth_user',
            'plainPassword' => '',
            'phone' => '',
            'address' => '',
            'createdAt' => date('c'),
            'addresses' => [],
        ];
        $users[] = $newUser;
        if (!$foundUser) {
            $foundUser = [
                'full_name' => $fullName,
                'name' => $fullName,
                'email' => $email,
                'phone' => '',
                'address' => '',
                'addresses' => [],
            ];
        }
    }
    writeJsonUsers($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'Google ile giriş başarılı',
        'user' => $foundUser,
    ]);
    exit;
}

// ====================================================
// D. DURUM / API KONTROLÜ
// ====================================================
echo json_encode([
    'success' => true,
    'message' => 'AKUZ Stickers MySQL Auth API Aktif',
    'actions' => ['register', 'login', 'google'],
]);
