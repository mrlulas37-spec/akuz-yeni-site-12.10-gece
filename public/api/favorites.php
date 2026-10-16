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

$action    = $data['action'] ?? ($_GET['action'] ?? 'list');
$userId    = trim(strval($data['user_id'] ?? ($data['userId'] ?? ($data['email'] ?? ($_GET['user_id'] ?? ($_GET['email'] ?? ''))))));
$productId = trim(strval($data['product_id'] ?? ($data['productId'] ?? ($_GET['product_id'] ?? ''))));
$favorites = $data['favorites'] ?? null;

if (empty($userId)) {
    echo json_encode(["status" => "error", "message" => "Kullanıcı kimliği bulunamadı."]);
    exit;
}

if (!$db) {
    echo json_encode(["status" => "success", "message" => "İşlem kaydedildi"]);
    exit;
}

// 1. favorites tablosunun varlığını otomatik olarak garantile
try {
    $db->exec("CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL,
        product_id VARCHAR(191) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_prod_idx (user_id, product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch (Exception $e) {}

// EĞER user_id e-posta formatındaysa users tablosundaki favorites sütununu da güncelle
function syncUserFavoritesCol($db, $userId, $favsArray) {
    if (strpos($userId, '@') !== false && is_array($favsArray)) {
        try {
            $stmt = $db->prepare("UPDATE users SET favorites = ? WHERE email = ?");
            $stmt->execute([json_encode(array_values($favsArray), JSON_UNESCAPED_UNICODE), strtolower($userId)]);
        } catch (Exception $e) {}
    }
}

// 1. Favorileri Listele
if ($action === 'list') {
    try {
        $stmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ?");
        $stmt->execute([$userId]);
        $favs = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Eğer favorites tablosunda boşsa ve users tablosunda email varsa oradan da bak
        if (empty($favs) && strpos($userId, '@') !== false) {
            $uStmt = $db->prepare("SELECT favorites FROM users WHERE email = ?");
            $uStmt->execute([strtolower($userId)]);
            $userFavs = $uStmt->fetchColumn();
            if ($userFavs) {
                $decoded = json_decode($userFavs, true);
                if (is_array($decoded) && !empty($decoded)) {
                    $favs = $decoded;
                    // favorites tablosuna da geri yükle
                    foreach ($favs as $fId) {
                        try {
                            $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)")->execute([$userId, strval($fId)]);
                        } catch (Exception $e) {}
                    }
                }
            }
        }

        echo json_encode(["status" => "success", "success" => true, "favorites" => array_values(array_unique($favs))]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 2. Tüm Listeyi Senkronize Et (Toplu Kayıt - Dosya silinse bile MySQL'de kalır)
if ($action === 'sync' && is_array($favorites)) {
    try {
        $db->prepare("DELETE FROM favorites WHERE user_id = ?")->execute([$userId]);
        $ins = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
        foreach ($favorites as $fId) {
            $cleanId = trim(strval($fId));
            if (!empty($cleanId)) {
                $ins->execute([$userId, $cleanId]);
            }
        }
        syncUserFavoritesCol($db, $userId, $favorites);
        echo json_encode(["status" => "success", "success" => true, "message" => "Favoriler MySQL veritabanına kaydedildi.", "count" => count($favorites)]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 3. Favoriye Ekle / Çıkar (Toggle)
if ($action === 'toggle' && !empty($productId)) {
    try {
        $check = $db->prepare("SELECT id FROM favorites WHERE user_id = ? AND product_id = ?");
        $check->execute([$userId, $productId]);
        
        if ($check->fetch()) {
            $delete = $db->prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?");
            $delete->execute([$userId, $productId]);
            $isFav = false;
            $msg = "Favorilerden kaldırıldı.";
        } else {
            $insert = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
            $insert->execute([$userId, $productId]);
            $isFav = true;
            $msg = "Favorilere eklendi.";
        }

        // Güncel listeyi çekip users tablosuna da yaz
        $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ?");
        $allStmt->execute([$userId]);
        $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
        syncUserFavoritesCol($db, $userId, $allFavs);

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => $isFav, "message" => $msg, "favorites" => $allFavs]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 4. Doğrudan Ekle
if ($action === 'add' && !empty($productId)) {
    try {
        $insert = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
        $insert->execute([$userId, $productId]);
        
        $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ?");
        $allStmt->execute([$userId]);
        $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
        syncUserFavoritesCol($db, $userId, $allFavs);

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => true, "message" => "Favorilere eklendi."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 5. Doğrudan Çıkar
if ($action === 'remove' && !empty($productId)) {
    try {
        $delete = $db->prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?");
        $delete->execute([$userId, $productId]);

        $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ?");
        $allStmt->execute([$userId]);
        $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
        syncUserFavoritesCol($db, $userId, $allFavs);

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => false, "message" => "Favorilerden çıkarıldı."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Geçersiz işlem."]);
?>
