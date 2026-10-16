<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['fullname']) && !empty($data['email']) && !empty($data['password']) && !empty($data['phone'])) {
    
    // Şifreyi güvenli şekilde hash'le
    $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $db->prepare("INSERT INTO users (fullname, phone, email, password) VALUES (?, ?, ?, ?)");
    try {
        $stmt->execute([$data['fullname'], $data['phone'], $data['email'], $hashed_password]);
        echo json_encode(["status" => "success", "message" => "Kayıt başarılı!"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Bu e-posta zaten kayıtlı veya bir hata oluştu."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Lütfen tüm alanları doldurun."]);
}
?>
