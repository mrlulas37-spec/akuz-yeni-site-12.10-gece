<?php
$host = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: 'localhost');
$dbname = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: 'akuzstic_data');
$username = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: 'akuzstic_data');
$password = getenv('DB_PASS') ?: (getenv('MYSQL_PASSWORD') ?: 'Mert830801?');

// Check .env files in standard cPanel root locations
$envPaths = [
    __DIR__ . '/../../.env',
    __DIR__ . '/../.env',
    __DIR__ . '/.env',
    dirname(__DIR__, 2) . '/.env',
];
foreach ($envPaths as $ep) {
    if (file_exists($ep) && is_readable($ep)) {
        $lines = file($ep, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($key, $val) = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val, " \t\n\r\0\x0B\"'");
                    if (in_array($key, ['DB_HOST', 'MYSQL_HOST']) && !empty($val)) $host = $val;
                    if (in_array($key, ['DB_NAME', 'MYSQL_DATABASE']) && !empty($val)) $dbname = $val;
                    if (in_array($key, ['DB_USER', 'MYSQL_USER']) && !empty($val)) $username = $val;
                    if (in_array($key, ['DB_PASS', 'DB_PASSWORD', 'MYSQL_PASSWORD']) && !empty($val)) $password = $val;
                }
            }
        }
        break;
    }
}

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    // If running in standalone or dev without active local MySQL, provide null instead of fatal crash
    $db = null;
    error_log("[MySQL Connection Error] " . $e->getMessage());
}

/**
 * Hesabında değişiklik yapan kullanıcının tüm bilgilerini MySQL veritabanında günceller.
 * Tablo veya sütunlar eksikse otomatik olarak güvenle oluşturur/uyarlar.
 * 
 * @param PDO|null $db
 * @param array $data ['email', 'fullname'|'name', 'phone', 'addresses', 'address', 'password']
 * @return bool
 */
function syncUserToMysql($db, $data) {
    if (!$db) return false;

    $email = strtolower(trim($data['email'] ?? ''));
    if (empty($email)) return false;

    $fullname = trim($data['fullname'] ?? ($data['name'] ?? ''));
    $phone = trim($data['phone'] ?? ($data['telephone'] ?? ''));
    $password = $data['password'] ?? null;
    $addresses = $data['addresses'] ?? null;
    $address = trim($data['address'] ?? '');

    // Eğer adresler dizisi verilmiş ve tek satırlık address boşsa, birincil adresten üret
    if (is_array($addresses) && !empty($addresses) && empty($address)) {
        $firstAddr = $addresses[0];
        $address = trim(($firstAddr['fullAddress'] ?? '') . ' ' . ($firstAddr['district'] ?? '') . '/' . ($firstAddr['city'] ?? ''));
    }

    try {
        // 1. Tablo ve sütunları tespit et
        $stmtCols = $db->query("SHOW COLUMNS FROM users");
        $existingCols = $stmtCols->fetchAll(PDO::FETCH_COLUMN);

        // Eksik sütunları güvenle ekle (hata vermez)
        if (!in_array('addresses', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN addresses TEXT NULL");
            $existingCols[] = 'addresses';
        }
        if (!in_array('address', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN address TEXT NULL");
            $existingCols[] = 'address';
        }
        if (!in_array('phone', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL");
            $existingCols[] = 'phone';
        }
        if (!in_array('auth_provider', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'");
            $existingCols[] = 'auth_provider';
        }
        if (!in_array('cart', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN cart LONGTEXT NULL");
            $existingCols[] = 'cart';
        }
        if (!in_array('favorites', $existingCols)) {
            @$db->exec("ALTER TABLE users ADD COLUMN favorites TEXT NULL");
            $existingCols[] = 'favorites';
        }

        // 2. Kullanıcı veritabanında var mı kontrol et
        $check = $db->prepare("SELECT id, password FROM users WHERE email = ?");
        $check->execute([$email]);
        $existingUser = $check->fetch(PDO::FETCH_ASSOC);

        if (!$existingUser) {
            // Kullanıcı MySQL'de henüz yoksa oluştur
            $hashedPass = $password ? password_hash($password, PASSWORD_BCRYPT) : password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
            
            $insertCols = ['email'];
            $insertPlaceholders = ['?'];
            $insertValues = [$email];

            if (in_array('fullname', $existingCols)) {
                $insertCols[] = 'fullname';
                $insertPlaceholders[] = '?';
                $insertValues[] = $fullname;
            } elseif (in_array('name', $existingCols)) {
                $insertCols[] = 'name';
                $insertPlaceholders[] = '?';
                $insertValues[] = $fullname;
            }

            if (in_array('phone', $existingCols)) {
                $insertCols[] = 'phone';
                $insertPlaceholders[] = '?';
                $insertValues[] = $phone;
            }

            if (in_array('password', $existingCols)) {
                $insertCols[] = 'password';
                $insertPlaceholders[] = '?';
                $insertValues[] = $hashedPass;
            }

            if (in_array('addresses', $existingCols) && $addresses !== null) {
                $insertCols[] = 'addresses';
                $insertPlaceholders[] = '?';
                $insertValues[] = is_string($addresses) ? $addresses : json_encode($addresses, JSON_UNESCAPED_UNICODE);
            }

            if (in_array('address', $existingCols) && !empty($address)) {
                $insertCols[] = 'address';
                $insertPlaceholders[] = '?';
                $insertValues[] = $address;
            }

            $sql = "INSERT INTO users (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $insertPlaceholders) . ")";
            $insStmt = $db->prepare($sql);
            $insStmt->execute($insertValues);
            return true;
        }

        // 3. Kullanıcı zaten varsa: Güncelleme SQL'i hazırla
        $setClauses = [];
        $params = [];

        if (!empty($fullname)) {
            if (in_array('fullname', $existingCols)) {
                $setClauses[] = "fullname = ?";
                $params[] = $fullname;
            }
            if (in_array('name', $existingCols)) {
                $setClauses[] = "name = ?";
                $params[] = $fullname;
            }
        }

        if ($phone !== '') {
            if (in_array('phone', $existingCols)) {
                $setClauses[] = "phone = ?";
                $params[] = $phone;
            }
        }

        if (!empty($password)) {
            if (in_array('password', $existingCols)) {
                $setClauses[] = "password = ?";
                $params[] = password_hash($password, PASSWORD_BCRYPT);
            }
        }

        if ($addresses !== null) {
            if (in_array('addresses', $existingCols)) {
                $setClauses[] = "addresses = ?";
                $params[] = is_string($addresses) ? $addresses : json_encode($addresses, JSON_UNESCAPED_UNICODE);
            }
        }

        if (!empty($address)) {
            if (in_array('address', $existingCols)) {
                $setClauses[] = "address = ?";
                $params[] = $address;
            }
        }

        if (in_array('updated_at', $existingCols)) {
            $setClauses[] = "updated_at = NOW()";
        }

        if (!empty($setClauses)) {
            $params[] = $email;
            $sql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE email = ?";
            $updStmt = $db->prepare($sql);
            $updStmt->execute($params);
        }

        return true;
    } catch (Exception $e) {
        error_log("[MySQL User Sync Error] " . $e->getMessage());
        return false;
    }
}
?>
