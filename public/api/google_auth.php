<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true) ?: [];

$email    = strtolower(trim($data['email'] ?? ''));
$fullname = trim($data['fullname'] ?? ($data['name'] ?? ''));
$googleId = trim($data['google_id'] ?? ($data['sub'] ?? ''));

if (empty($email)) {
    echo json_encode(["status" => "error", "message" => "Google e-posta bilgisi alınamadı."]);
    exit;
}

if (empty($fullname)) {
    $fullname = explode('@', $email)[0];
}

// 1. data_storage/users.json Dizinini Belirle
$dataDir = __DIR__ . '/../../data_storage';
if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
$usersFile = $dataDir . '/users.json';

// 2. data_storage/users.json Dosyasına Kesin Olarak Kaydet (Admin panelinin anında görmesi için)
$jsonUsers = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];
if (!is_array($jsonUsers)) $jsonUsers = [];

$foundIndex = -1;
foreach ($jsonUsers as $k => $ju) {
    if (strtolower(trim($ju['email'] ?? '')) === $email) {
        $foundIndex = $k;
        break;
    }
}

$targetUser = null;

if ($foundIndex !== -1) {
    // Kullanıcı zaten var: Bilgilerini zenginleştir ve Google sağlayıcısını garantile
    if (empty($jsonUsers[$foundIndex]['name']) || strpos($jsonUsers[$foundIndex]['name'], '@') !== false) {
        $jsonUsers[$foundIndex]['name'] = $fullname;
    }
    $jsonUsers[$foundIndex]['full_name'] = $jsonUsers[$foundIndex]['name'];
    $jsonUsers[$foundIndex]['isGoogleUser'] = true;
    $jsonUsers[$foundIndex]['auth_provider'] = 'google';
    $jsonUsers[$foundIndex]['provider'] = 'google';
    $jsonUsers[$foundIndex]['authProvider'] = 'google';
    $jsonUsers[$foundIndex]['registeredVia'] = 'google';
    $jsonUsers[$foundIndex]['passwordHash'] = 'google_oauth_verified';
    $targetUser = $jsonUsers[$foundIndex];
} else {
    // Yeni Google kullanıcısı: users.json içine ekle
    $newUserId = 'usr_' . time() . '_' . mt_rand(100, 999);
    $newUser = [
        'id' => $newUserId,
        'user_id' => $newUserId,
        'name' => $fullname,
        'full_name' => $fullname,
        'email' => $email,
        'phone' => '',
        'passwordHash' => 'google_oauth_verified',
        'createdAt' => date('c'),
        'isGoogleUser' => true,
        'auth_provider' => 'google',
        'provider' => 'google',
        'authProvider' => 'google',
        'registeredVia' => 'google',
        'addresses' => [],
        'cart' => [],
        'favorites' => [],
        'recentlyViewed' => [],
    ];
    $jsonUsers[] = $newUser;
    $targetUser = $newUser;
}

@file_put_contents($usersFile, json_encode($jsonUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 3. MySQL Veritabanı da Mevcutsa Oraya da Eşitle (Çift yönlü tam güvence)
$mysqlId = null;
if (isset($db) && $db instanceof PDO) {
    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $existingMysql = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingMysql) {
            $mysqlId = $existingMysql['id'];
            @$db->prepare("UPDATE users SET auth_provider = 'google' WHERE LOWER(email) = ?")->execute([$email]);
        } else {
            $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
            $ins = $db->prepare("INSERT INTO users (fullname, phone, email, password, auth_provider) VALUES (?, ?, ?, ?, 'google')");
            $ins->execute([$fullname, '', $email, $randomPass]);
            $mysqlId = $db->lastInsertId();
        }
    } catch (Exception $e) {
        error_log("[Google Auth MySQL Sync Error] " . $e->getMessage());
    }
}

// 4. İstemciye Başarılı Yanıt Dön
$finalUserId = $targetUser['id'] ?? ($mysqlId ? String($mysqlId) : ('usr_' . md5($email)));

echo json_encode([
    "status" => "success",
    "success" => true,
    "message" => "Google ile giriş başarılı!",
    "user_id" => $finalUserId,
    "user" => [
        "id" => $finalUserId,
        "user_id" => $finalUserId,
        "fullname" => $targetUser['name'] ?? $fullname,
        "name" => $targetUser['name'] ?? $fullname,
        "email" => $email,
        "phone" => $targetUser['phone'] ?? '',
        "addresses" => $targetUser['addresses'] ?? [],
        "cart" => $targetUser['cart'] ?? [],
        "favorites" => $targetUser['favorites'] ?? [],
        "isGoogleUser" => true,
        "authProvider" => "google",
        "provider" => "google",
        "registeredVia" => "google",
    ]
]);
?>
