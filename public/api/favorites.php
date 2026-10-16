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
$email     = strtolower(trim($data['email'] ?? ($_GET['email'] ?? ($_REQUEST['email'] ?? ''))));
$rawUserId = trim(strval($data['user_id'] ?? ($data['userId'] ?? ($_GET['user_id'] ?? ($_GET['userId'] ?? '')))));
$userId    = !empty($email) ? $email : $rawUserId;
$productId = trim(strval($data['product_id'] ?? ($data['productId'] ?? ($_GET['product_id'] ?? ''))));
$favorites = $data['favorites'] ?? ($data['items'] ?? null);

if (empty($userId) && empty($email)) {
    echo json_encode(["status" => "error", "message" => "Kullanıcı kimliği bulunamadı."]);
    exit;
}

// 1. MySQL favorites tablosunun ve users.favorites sütununun varlığını otomatik olarak garantile
if ($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(191) NOT NULL,
            product_id VARCHAR(191) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_prod_idx (user_id, product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {}

    try {
        $colCheck = $db->query("SHOW COLUMNS FROM users LIKE 'favorites'")->fetch();
        if (!$colCheck) {
            @$db->exec("ALTER TABLE users ADD COLUMN favorites TEXT NULL");
        }
    } catch (Exception $e) {}
}

// EĞER email veya user_id formatındaysa users tablosundaki favorites sütununu da güncelle
function syncUserFavoritesCol($db, $email, $userId, $favsArray) {
    if (!$db || !is_array($favsArray)) return;
    try {
        $jsonStr = json_encode(array_values($favsArray), JSON_UNESCAPED_UNICODE);
        if (!empty($email)) {
            $stmt = $db->prepare("UPDATE users SET favorites = ? WHERE LOWER(email) = ?");
            $stmt->execute([$jsonStr, strtolower($email)]);
        }
        if (!empty($userId)) {
            $stmt = $db->prepare("UPDATE users SET favorites = ? WHERE LOWER(email) = ? OR id = ?");
            $stmt->execute([$jsonStr, strtolower($userId), $userId]);
        }
    } catch (Exception $e) {
        error_log("[MySQL syncUserFavoritesCol Error] " . $e->getMessage());
    }
}

// 1. Favorileri Listele
if ($action === 'list') {
    try {
        $favs = [];
        if ($db) {
            $stmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ? OR user_id = ?");
            $stmt->execute([$userId, $email ?: $userId]);
            $favs = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Eğer favorites tablosunda boşsa ve users tablosunda email varsa oradan da bak
            if (empty($favs) && !empty($email)) {
                $uStmt = $db->prepare("SELECT favorites FROM users WHERE LOWER(email) = ?");
                $uStmt->execute([strtolower($email)]);
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
        }

        echo json_encode(["status" => "success", "success" => true, "favorites" => array_values(array_unique($favs))]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 2. Tüm Listeyi Senkronize Et (Toplu Kayıt - Dosya silinse bile MySQL'de kalır)
if (($action === 'sync' || empty($action)) && is_array($favorites)) {
    if ($db) {
        // users.favorites sütununu ilk ve kesin olarak güncelle
        syncUserFavoritesCol($db, $email, $userId, $favorites);

        try {
            $db->prepare("DELETE FROM favorites WHERE user_id = ?")->execute([$userId]);
            if (!empty($email) && $email !== $userId) {
                $db->prepare("DELETE FROM favorites WHERE user_id = ?")->execute([$email]);
            }

            $ins = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
            foreach ($favorites as $fId) {
                $cleanId = trim(strval($fId));
                if (!empty($cleanId)) {
                    $ins->execute([$userId, $cleanId]);
                }
            }
        } catch (Exception $e) {
            error_log("[MySQL Favorites Table Sync Error] " . $e->getMessage());
        }
    }

    // Dosya sistemine de yedekli yaz (Çifte güvence)
    $dataDir = __DIR__ . '/../../data_storage';
    if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
    if (is_dir($dataDir)) {
        $favsFile = $dataDir . '/favorites.json';
        $allFavs = file_exists($favsFile) ? (json_decode(file_get_contents($favsFile), true) ?: []) : [];
        $allFavs[strtolower($userId)] = $favorites;
        if (!empty($email) && strtolower($email) !== strtolower($userId)) {
            $allFavs[strtolower($email)] = $favorites;
        }
        @file_put_contents($favsFile, json_encode($allFavs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $usersFile = $dataDir . '/users.json';
        if (file_exists($usersFile)) {
            $usersList = json_decode(file_get_contents($usersFile), true) ?: [];
            foreach ($usersList as &$uObj) {
                $uEmail = strtolower($uObj['email'] ?? '');
                if ($uEmail === strtolower($userId) || (!empty($email) && $uEmail === strtolower($email))) {
                    $uObj['favorites'] = $favorites;
                    break;
                }
            }
            @file_put_contents($usersFile, json_encode($usersList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
    }

    echo json_encode(["status" => "success", "success" => true, "message" => "Favoriler MySQL ve veri deposunda güncellendi.", "count" => count($favorites), "favorites" => $favorites]);
    exit;
}

// 3. Favoriye Ekle / Çıkar (Toggle)
if ($action === 'toggle' && !empty($productId)) {
    try {
        $isFav = false;
        $msg = '';
        if ($db) {
            $check = $db->prepare("SELECT id FROM favorites WHERE (user_id = ? OR user_id = ?) AND product_id = ?");
            $check->execute([$userId, $email ?: $userId, $productId]);
            
            if ($check->fetch()) {
                $delete = $db->prepare("DELETE FROM favorites WHERE (user_id = ? OR user_id = ?) AND product_id = ?");
                $delete->execute([$userId, $email ?: $userId, $productId]);
                $isFav = false;
                $msg = "Favorilerden kaldırıldı.";
            } else {
                $insert = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
                $insert->execute([$userId, $productId]);
                $isFav = true;
                $msg = "Favorilere eklendi.";
            }

            // Güncel listeyi çekip users tablosuna da yaz
            $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ? OR user_id = ?");
            $allStmt->execute([$userId, $email ?: $userId]);
            $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
            syncUserFavoritesCol($db, $email, $userId, $allFavs);
        }

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => $isFav, "message" => $msg]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 4. Doğrudan Ekle
if ($action === 'add' && !empty($productId)) {
    try {
        if ($db) {
            $insert = $db->prepare("INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)");
            $insert->execute([$userId, $productId]);
            
            $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ? OR user_id = ?");
            $allStmt->execute([$userId, $email ?: $userId]);
            $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
            syncUserFavoritesCol($db, $email, $userId, $allFavs);
        }

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => true, "message" => "Favorilere eklendi."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 5. Doğrudan Çıkar
if ($action === 'remove' && !empty($productId)) {
    try {
        if ($db) {
            $delete = $db->prepare("DELETE FROM favorites WHERE (user_id = ? OR user_id = ?) AND product_id = ?");
            $delete->execute([$userId, $email ?: $userId, $productId]);

            $allStmt = $db->prepare("SELECT product_id FROM favorites WHERE user_id = ? OR user_id = ?");
            $allStmt->execute([$userId, $email ?: $userId]);
            $allFavs = $allStmt->fetchAll(PDO::FETCH_COLUMN);
            syncUserFavoritesCol($db, $email, $userId, $allFavs);
        }

        echo json_encode(["status" => "success", "success" => true, "isFavorite" => false, "message" => "Favorilerden çıkarıldı."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Geçersiz işlem."]);
?>
