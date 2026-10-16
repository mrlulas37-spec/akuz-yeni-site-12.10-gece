<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data['email'] ?? '');
$fullname = trim($data['fullname'] ?? $data['name'] ?? '');
$googleId = trim($data['google_id'] ?? $data['sub'] ?? '');

if (empty($email)) {
    echo json_encode(["status" => "error", "message" => "Google e-posta bilgisi alınamadı."]);
    exit;
}

try {
    // 1. Bu kullanıcı daha önce kayıt olmuş mu kontrol et
    $stmt = $db->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
    $stmt->execute([strtolower($email)]);
    $user = $stmt->fetch();

    if ($user) {
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

        // Zaten kayıtlı, direkt giriş yaptır
        echo json_encode([
            "status" => "success",
            "message" => "Google ile giriş başarılı!",
            "user" => [
                "id" => $user['id'],
                "fullname" => $user['fullname'] ?? ($user['name'] ?? $fullname),
                "name" => $user['fullname'] ?? ($user['name'] ?? $fullname),
                "email" => $user['email'],
                "phone" => $user['phone'] ?? '',
                "cart" => $userCart,
                "favorites" => $userFavs,
            ]
        ]);
    } else {
        // İlk defa geliyor, veritabanına yeni kullanıcı olarak kaydet
        // Şifre yerine rastgele veya özel bir işaret koyuyoruz
        $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        
        $insert = $db->prepare("INSERT INTO users (fullname, phone, email, password) VALUES (?, ?, ?, ?)");
        $insert->execute([$fullname, '', $email, $randomPass]);
        $newId = $db->lastInsertId();

        echo json_encode([
            "status" => "success",
            "message" => "Google ile yeni kullanıcı kaydedildi!",
            "user" => [
                "id" => $newId,
                "fullname" => $fullname,
                "email" => $email
            ]
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Veritabanı hatası: " . $e->getMessage()]);
}
?>
