<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true) ?: [];

// Gelen isteğin türü (register / login / update_profile / change_password)
$action = $data['action'] ?? ($_GET['action'] ?? '');

// Olası form alanlarını yakalama
$fullname = trim($data['fullname'] ?? $data['name'] ?? ($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''));
$phone    = trim($data['phone'] ?? $data['telephone'] ?? '');
$email    = strtolower(trim($data['email'] ?? ($_GET['email'] ?? '')));
$password = trim($data['password'] ?? $data['pass'] ?? '');
$addresses = $data['addresses'] ?? null;
$address  = trim($data['address'] ?? '');
$cart     = $data['cart'] ?? null;
$favorites = $data['favorites'] ?? null;

// 0. GOOGLE İLE GİRİŞ
if ($action === 'google') {
    if (empty($email)) {
        echo json_encode(["status" => "error", "message" => "E-posta adresi eksik."]);
        exit;
    }
    if (empty($fullname)) {
        $fullname = explode('@', $email)[0];
    }

    $dataDir = __DIR__ . '/../../data_storage';
    if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
    if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
    $usersFile = $dataDir . '/users.json';
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
        if (empty($jsonUsers[$foundIndex]['name']) || strpos($jsonUsers[$foundIndex]['name'], '@') !== false) {
            $jsonUsers[$foundIndex]['name'] = $fullname;
            $jsonUsers[$foundIndex]['full_name'] = $fullname;
        }
        $jsonUsers[$foundIndex]['auth_provider'] = 'google';
        $jsonUsers[$foundIndex]['provider'] = 'google';
        $jsonUsers[$foundIndex]['authProvider'] = 'google';
        $jsonUsers[$foundIndex]['registeredVia'] = 'google';
        $targetUser = $jsonUsers[$foundIndex];
    } else {
        $newUserId = 'usr_' . time() . '_' . mt_rand(100, 999);
        $targetUser = [
            'id' => $newUserId,
            'user_id' => $newUserId,
            'name' => $fullname,
            'full_name' => $fullname,
            'email' => $email,
            'phone' => '',
            'passwordHash' => 'google_oauth_verified',
            'createdAt' => date('c'),
            'auth_provider' => 'google',
            'provider' => 'google',
            'authProvider' => 'google',
            'registeredVia' => 'google',
            'addresses' => [],
            'cart' => [],
            'favorites' => [],
        ];
        $jsonUsers[] = $targetUser;
    }
    @file_put_contents($usersFile, json_encode($jsonUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

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
                $ins->execute([$fullname, '', $email, $randomPass]);
            }
        } catch (Exception $e) {}
    }

    echo json_encode([
        "status" => "success",
        "success" => true,
        "message" => "Google ile giriş başarılı!",
        "user" => [
            "id" => $targetUser['id'] ?? ('usr_' . md5($email)),
            "user_id" => $targetUser['id'] ?? ('usr_' . md5($email)),
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
    exit;
}

// 1. PROFİL GÜNCELLEME (İsim, Telefon, Adresler, Sepet, Favoriler) - Hesaptaki tüm değişiklikler anında MySQL'e yazılır
if ($action === 'update_profile' || $action === 'update' || $action === 'save_profile' || $cart !== null || $favorites !== null || (!empty($fullname) && !empty($email) && empty($password) && ($addresses !== null || !empty($phone)))) {
    if (empty($email)) {
        echo json_encode(["status" => "error", "message" => "E-posta adresi eksik."]);
        exit;
    }

    $syncSuccess = syncUserToMysql($db, [
        'email' => $email,
        'fullname' => $fullname,
        'phone' => $phone,
        'addresses' => $addresses,
        'address' => $address,
        'cart' => $cart,
        'favorites' => $favorites,
    ]);

    // Ayrıca data_storage/users.json dosyasını da senkronize tut
    $dataDir = __DIR__ . '/../../data_storage';
    if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
    $usersFile = $dataDir . '/users.json';
    if (file_exists($usersFile)) {
        $jsonUsers = json_decode(file_get_contents($usersFile), true) ?: [];
        foreach ($jsonUsers as $k => $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                if (!empty($fullname)) $jsonUsers[$k]['name'] = $fullname;
                if (!empty($phone)) $jsonUsers[$k]['phone'] = $phone;
                if ($addresses !== null) $jsonUsers[$k]['addresses'] = $addresses;
                if ($cart !== null) $jsonUsers[$k]['cart'] = $cart;
                if ($favorites !== null) $jsonUsers[$k]['favorites'] = $favorites;
                break;
            }
        }
        @file_put_contents($usersFile, json_encode($jsonUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        "status" => "success",
        "success" => true,
        "message" => "Hesap bilgileri veritabanında başarıyla güncellendi!",
        "user" => [
            "name" => $fullname,
            "fullname" => $fullname,
            "email" => $email,
            "phone" => $phone,
            "addresses" => $addresses ?: [],
        ]
    ]);
    exit;
}

// 2. ŞİFRE GÜNCELLEME - Hesaptaki yeni şifre anında MySQL'de hash'lenerek kaydedilir
if ($action === 'change_password' || $action === 'update_password') {
    $newPassword = $data['newPassword'] ?? ($data['new_password'] ?? $password);
    $currentPassword = $data['currentPassword'] ?? ($data['current_password'] ?? '');

    if (empty($email) || empty($newPassword)) {
        echo json_encode(["status" => "error", "message" => "E-posta ve yeni şifre gereklidir."]);
        exit;
    }

    if (strlen($newPassword) < 6) {
        echo json_encode(["status" => "error", "message" => "Yeni şifreniz en az 6 karakter olmalıdır."]);
        exit;
    }

    // Kullanıcı varsa mevcut şifreyi kontrol et
    if ($db) {
        $stmt = $db->prepare("SELECT id, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $userRow = $stmt->fetch();
        if ($userRow && !empty($currentPassword) && !empty($userRow['password'])) {
            if (!password_verify($currentPassword, $userRow['password'])) {
                echo json_encode(["status" => "error", "message" => "Mevcut şifreniz hatalı."]);
                exit;
            }
        }
    }

    syncUserToMysql($db, [
        'email' => $email,
        'password' => $newPassword,
    ]);

    // data_storage/users.json güncelle
    $dataDir = __DIR__ . '/../../data_storage';
    if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
    $usersFile = $dataDir . '/users.json';
    if (file_exists($usersFile)) {
        $jsonUsers = json_decode(file_get_contents($usersFile), true) ?: [];
        foreach ($jsonUsers as $k => $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                $jsonUsers[$k]['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
                $jsonUsers[$k]['plainPassword'] = $newPassword;
                break;
            }
        }
        @file_put_contents($usersFile, json_encode($jsonUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        "status" => "success",
        "success" => true,
        "message" => "Şifreniz MySQL veritabanında başarıyla güncellendi!"
    ]);
    exit;
}

// 3. KAYIT İŞLEMİ (Eğer action 'register' ise veya isim alanı dolu geldiyse)
if ($action === 'register' || (!empty($fullname) && !empty($password) && !empty($email))) {
    if (empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "E-posta ve şifre zorunludur."]);
        exit;
    }

    $syncSuccess = syncUserToMysql($db, [
        'email' => $email,
        'fullname' => $fullname,
        'phone' => $phone,
        'password' => $password,
        'addresses' => $addresses,
        'address' => $address,
    ]);

    if ($syncSuccess) {
        echo json_encode([
            "status" => "success",
            "success" => true,
            "message" => "Kayıt başarılı!",
            "user" => ["fullname" => $fullname, "name" => $fullname, "email" => $email, "phone" => $phone]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Kayıt sırasında hata oluştu veya bu e-posta zaten kayıtlı."]);
    }
    exit;
}

// 4. GİRİŞ İŞLEMİ
if ($action === 'login' || (!empty($email) && !empty($password))) {
    if ($db) {
        $stmt = $db->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && (!empty($user['password']) ? password_verify($password, $user['password']) : true)) {
            $userAddresses = [];
            if (!empty($user['addresses'])) {
                $decoded = json_decode($user['addresses'], true);
                if (is_array($decoded)) $userAddresses = $decoded;
            } elseif (!empty($user['address'])) {
                $userAddresses = [[
                    'id' => 'addr-1',
                    'title' => 'Kayıtlı Adresim',
                    'recipientName' => $user['fullname'] ?? ($user['name'] ?? ''),
                    'phone' => $user['phone'] ?? '',
                    'fullAddress' => $user['address'],
                    'isDefault' => true,
                ]];
            }

            $userCart = [];
            if (!empty($user['cart'])) {
                $decodedCart = is_string($user['cart']) ? json_decode($user['cart'], true) : $user['cart'];
                if (is_array($decodedCart)) $userCart = $decodedCart;
            }

            $userFavs = [];
            if (!empty($user['favorites'])) {
                $decodedFavs = is_string($user['favorites']) ? json_decode($user['favorites'], true) : $user['favorites'];
                if (is_array($decodedFavs)) $userFavs = $decodedFavs;
            }

            echo json_encode([
                "status" => "success",
                "success" => true,
                "message" => "Giriş başarılı!",
                "user" => [
                    "id" => $user['id'],
                    "fullname" => $user['fullname'] ?? ($user['name'] ?? ''),
                    "name" => $user['fullname'] ?? ($user['name'] ?? ''),
                    "email" => $user['email'],
                    "phone" => $user['phone'] ?? '',
                    "addresses" => $userAddresses,
                    "cart" => $userCart,
                    "favorites" => $userFavs,
                ]
            ]);
            exit;
        }
    }

    echo json_encode(["status" => "error", "message" => "Hatalı e-posta veya şifre."]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Geçersiz işlem."]);
?>
