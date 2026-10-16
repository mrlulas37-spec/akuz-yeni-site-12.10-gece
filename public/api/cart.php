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

$action    = $data['action'] ?? ($_GET['action'] ?? ($_REQUEST['action'] ?? 'list'));
$email     = strtolower(trim($data['email'] ?? ($_GET['email'] ?? ($_REQUEST['email'] ?? ''))));
$rawUserId = trim(strval(
    $data['userId'] ?? (
    $data['user_id'] ?? (
    $_GET['userId'] ?? (
    $_GET['user_id'] ?? (
    $_REQUEST['userId'] ?? (
    $_REQUEST['user_id'] ?? ''
)))))));
$userId    = !empty($email) ? $email : $rawUserId;
$productId = trim(strval($data['product_id'] ?? ($data['productId'] ?? ($_GET['product_id'] ?? ($_GET['productId'] ?? '')))));
$quantity  = intval($data['quantity'] ?? 1);
$item      = $data['item'] ?? null;
$items     = $data['items'] ?? ($data['cart'] ?? null);
$index     = isset($data['index']) ? intval($data['index']) : -1;

if (empty($userId) && empty($email)) {
    echo json_encode(["status" => "error", "message" => "Kullanıcı kimliği bulunamadı."]);
    exit;
}

// 1. MySQL cart tablosunun ve eksik tüm sütunlarının varlığını otomatik olarak garantile
if ($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS cart (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(191) NOT NULL,
            product_id VARCHAR(191) NOT NULL,
            quantity INT DEFAULT 1,
            color VARCHAR(100) NULL,
            dimension VARCHAR(100) NULL,
            finish VARCHAR(50) NULL,
            custom_text TEXT NULL,
            custom_font VARCHAR(100) NULL,
            calculated_price DECIMAL(10,2) NULL,
            item_data LONGTEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY user_idx (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {
        error_log("[cart schema upgrade error] " . $e->getMessage());
    }

    try {
        $userCols = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('cart', $userCols)) @$db->exec("ALTER TABLE users ADD COLUMN cart LONGTEXT NULL");
        if (!in_array('favorites', $userCols)) @$db->exec("ALTER TABLE users ADD COLUMN favorites TEXT NULL");
    } catch (Exception $e) {}
}

// EĞER user_id veya email formatındaysa users tablosundaki cart sütununu da güncelle (Çifte MySQL güvencesi)
function syncUserCartCol($db, $email, $userId, $cartArray) {
    if (!$db || !is_array($cartArray)) return;
    try {
        $jsonStr = json_encode(array_values($cartArray), JSON_UNESCAPED_UNICODE);
        if (!empty($email)) {
            $stmt = $db->prepare("UPDATE users SET cart = ? WHERE LOWER(email) = ?");
            $stmt->execute([$jsonStr, strtolower($email)]);
        }
        if (!empty($userId)) {
            $stmt = $db->prepare("UPDATE users SET cart = ? WHERE LOWER(email) = ? OR id = ?");
            $stmt->execute([$jsonStr, strtolower($userId), $userId]);
        }
    } catch (Exception $e) {
        error_log("[MySQL syncUserCartCol Error] " . $e->getMessage());
    }
}

// 1. Sepeti Listele
if ($action === 'list') {
    try {
        $cartItems = [];
        if ($db) {
            $cartCols = $db->query("SHOW COLUMNS FROM cart")->fetchAll(PDO::FETCH_COLUMN);
            $hasItemData = in_array('item_data', $cartCols);

            $stmt = $db->prepare("SELECT * FROM cart WHERE user_id = ? ORDER BY id ASC");
            $stmt->execute([$userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $r) {
                if ($hasItemData && !empty($r['item_data'])) {
                    $decoded = json_decode($r['item_data'], true);
                    if (is_array($decoded)) {
                        $cartItems[] = $decoded;
                        continue;
                    }
                }
                // Geriye dönük basit kayıt uyumluluğu
                $cartItems[] = [
                    'product' => ['id' => $r['product_id'] ?? 'prod', 'name' => 'AKUZ Sticker'],
                    'quantity' => intval($r['quantity'] ?? 1),
                    'selectedColor' => $r['color'] ?? 'Siyah',
                    'selectedDimension' => $r['dimension'] ?? 'Standart',
                    'selectedFinish' => $r['finish'] ?? 'Parlak',
                    'customText' => $r['custom_text'] ?? '',
                    'customFont' => $r['custom_font'] ?? '',
                    'calculatedPrice' => floatval($r['calculated_price'] ?? 0),
                ];
            }

            // Eğer cart tablosunda boşsa ve users tablosunda email varsa oradan da bak
            if (empty($cartItems) && strpos($userId, '@') !== false) {
                $userCols = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
                if (in_array('cart', $userCols)) {
                    $uStmt = $db->prepare("SELECT cart FROM users WHERE LOWER(email) = ?");
                    $uStmt->execute([strtolower($userId)]);
                    $userCart = $uStmt->fetchColumn();
                    if ($userCart) {
                        $decoded = json_decode($userCart, true);
                        if (is_array($decoded) && !empty($decoded)) {
                            $cartItems = $decoded;
                        }
                    }
                }
            }
        }

        echo json_encode(["status" => "success", "success" => true, "cart" => $cartItems]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 2. Tüm Sepeti Senkronize Et (Toplu Kayıt - Dosyalar silinse bile MySQL'de güvenle kalır)
if (($action === 'sync' || empty($action)) && is_array($items)) {
    if ($db) {
        // users.cart sütununu ilk ve kesin olarak güncelle
        syncUserCartCol($db, $email, $userId, $items);

        try {
            $db->prepare("DELETE FROM cart WHERE user_id = ?")->execute([$userId]);
            if (!empty($email) && $email !== $userId) {
                $db->prepare("DELETE FROM cart WHERE user_id = ?")->execute([$email]);
            }

            $ins = $db->prepare("INSERT INTO cart (user_id, product_id, quantity, color, dimension, finish, custom_text, custom_font, calculated_price, item_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($items as $it) {
                $pId = strval($it['product']['id'] ?? ($it['productId'] ?? ($it['product_id'] ?? 'prod')));
                $qty = intval($it['quantity'] ?? 1);
                $color = strval($it['selectedColor'] ?? ($it['color'] ?? ''));
                $dim = strval($it['selectedDimension'] ?? ($it['dimension'] ?? ''));
                $finish = strval($it['selectedFinish'] ?? ($it['finish'] ?? ''));
                $cText = strval($it['customText'] ?? ($it['custom_text'] ?? ''));
                $cFont = strval($it['customFont'] ?? ($it['custom_font'] ?? ''));
                $price = floatval($it['calculatedPrice'] ?? ($it['price'] ?? 0));
                $itemJson = json_encode($it, JSON_UNESCAPED_UNICODE);

                $ins->execute([$userId, $pId, $qty, $color, $dim, $finish, $cText, $cFont, $price, $itemJson]);
            }
        } catch (Exception $e) {
            error_log("[MySQL Cart Table Sync Error] " . $e->getMessage());
        }
    }

    // Dosya sistemine de yedekli yaz (Çifte güvence)
    $dataDir = __DIR__ . '/../../data_storage';
    if (!is_dir($dataDir)) $dataDir = __DIR__ . '/../data_storage';
    if (is_dir($dataDir)) {
        $cartsFile = $dataDir . '/carts.json';
        $allCarts = file_exists($cartsFile) ? (json_decode(file_get_contents($cartsFile), true) ?: []) : [];
        $allCarts[strtolower($userId)] = $items;
        if (!empty($email) && strtolower($email) !== strtolower($userId)) {
            $allCarts[strtolower($email)] = $items;
        }
        @file_put_contents($cartsFile, json_encode($allCarts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $usersFile = $dataDir . '/users.json';
        if (file_exists($usersFile)) {
            $usersList = json_decode(file_get_contents($usersFile), true) ?: [];
            foreach ($usersList as &$uObj) {
                $uEmail = strtolower($uObj['email'] ?? '');
                if ($uEmail === strtolower($userId) || (!empty($email) && $uEmail === strtolower($email))) {
                    $uObj['cart'] = $items;
                    break;
                }
            }
            @file_put_contents($usersFile, json_encode($usersList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
    }

    echo json_encode(["status" => "success", "success" => true, "message" => "Sepet MySQL ve veri deposunda güncellendi.", "count" => count($items), "cart" => $items]);
    exit;
}

// 3. Sepete Ürün Ekle (Add)
if ($action === 'add') {
    try {
        if ($db) {
            $pId = strval($item['product']['id'] ?? ($productId ?: 'prod'));
            $qty = intval($item['quantity'] ?? ($quantity ?: 1));
            $color = strval($item['selectedColor'] ?? ($data['color'] ?? ''));
            $dim = strval($item['selectedDimension'] ?? ($data['dimension'] ?? ''));
            $finish = strval($item['selectedFinish'] ?? ($data['finish'] ?? ''));
            $cText = strval($item['customText'] ?? ($data['customText'] ?? ''));
            $cFont = strval($item['customFont'] ?? ($data['customFont'] ?? ''));
            $price = floatval($item['calculatedPrice'] ?? ($data['price'] ?? 0));
            $itemJson = $item ? json_encode($item, JSON_UNESCAPED_UNICODE) : null;

            // Birebir aynı özelliklerde ürün var mı?
            $check = $db->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND IFNULL(color,'') = ? AND IFNULL(dimension,'') = ? AND IFNULL(custom_text,'') = ?");
            $check->execute([$userId, $pId, $color, $dim, $cText]);
            $existing = $check->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $upd = $db->prepare("UPDATE cart SET quantity = quantity + ? WHERE id = ?");
                $upd->execute([$qty, $existing['id']]);
            } else {
                $ins = $db->prepare("INSERT INTO cart (user_id, product_id, quantity, color, dimension, finish, custom_text, custom_font, calculated_price, item_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $ins->execute([$userId, $pId, $qty, $color, $dim, $finish, $cText, $cFont, $price, $itemJson]);
            }

            // Güncel tam sepeti çekip users tablosuna da kaydet
            if (is_array($items)) {
                syncUserCartCol($db, $email, $userId, $items);
            }
        }

        echo json_encode(["status" => "success", "success" => true, "message" => "Ürün MySQL sepet veritabanına eklendi."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 4. Sepetten Çıkar (Remove)
if ($action === 'remove') {
    try {
        if ($db) {
            if (!empty($productId)) {
                $del = $db->prepare("DELETE FROM cart WHERE (user_id = ? OR user_id = ?) AND product_id = ?");
                $del->execute([$userId, $email ?: $userId, $productId]);
            } elseif ($index >= 0) {
                $getRows = $db->prepare("SELECT id FROM cart WHERE user_id = ? ORDER BY id ASC");
                $getRows->execute([$userId]);
                $ids = $getRows->fetchAll(PDO::FETCH_COLUMN);
                if (isset($ids[$index])) {
                    $db->prepare("DELETE FROM cart WHERE id = ?")->execute([$ids[$index]]);
                }
            }

            if (is_array($items)) {
                syncUserCartCol($db, $email, $userId, $items);
            }
        }

        echo json_encode(["status" => "success", "success" => true, "message" => "Ürün MySQL veritabanından silindi."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 5. Sepeti Tamamen Temizle (Clear)
if ($action === 'clear') {
    try {
        if ($db) {
            $db->prepare("DELETE FROM cart WHERE user_id = ? OR user_id = ?")->execute([$userId, $email ?: $userId]);
            syncUserCartCol($db, $email, $userId, []);
        }
        echo json_encode(["status" => "success", "success" => true, "message" => "Sepet MySQL veritabanında temizlendi."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Geçersiz işlem."]);
?>
