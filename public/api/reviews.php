<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/../../data_storage';
if (!is_dir($dataDir)) {
    $dataDir = __DIR__ . '/../data_storage';
}
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$reviewsFile = $dataDir . '/reviews.json';
$ordersFile = $dataDir . '/orders.json';
$productsFile = $dataDir . '/products.json';

function readJson($filePath, $fallback = []) {
    if (!file_exists($filePath)) return $fallback;
    $raw = @file_get_contents($filePath);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function writeJson($filePath, $data) {
    @file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function isProductInOrder($order, $productId, $products) {
    if (!isset($order['items']) || !is_array($order['items'])) return false;
    $targetName = '';
    $targetId = strtolower(trim($productId));
    $targetSlug = $targetId;

    foreach ($products as $p) {
        if ((isset($p['id']) && $p['id'] === $productId) || (isset($p['slug']) && $p['slug'] === $productId)) {
            $targetName = mb_strtolower(trim($p['name'] ?? ''));
            $targetId = mb_strtolower(trim($p['id'] ?? ''));
            $targetSlug = mb_strtolower(trim($p['slug'] ?? ''));
            break;
        }
    }

    foreach ($order['items'] as $item) {
        if (!is_array($item)) continue;
        $itemId = mb_strtolower(trim($item['productId'] ?? $item['id'] ?? $item['product']['id'] ?? ''));
        $itemSlug = mb_strtolower(trim($item['slug'] ?? $item['productSlug'] ?? ''));
        $itemName = mb_strtolower(trim($item['productName'] ?? $item['name'] ?? $item['product']['name'] ?? ''));

        if ($targetId !== '' && ($itemId === $targetId || $itemSlug === $targetId)) return true;
        if ($targetSlug !== '' && ($itemId === $targetSlug || $itemSlug === $targetSlug)) return true;
        if ($targetName !== '' && $itemName !== '' && (strpos($itemName, $targetName) !== false || strpos($targetName, $itemName) !== false)) {
            return true;
        }
    }
    return false;
}

function isOrderDelivered($order) {
    $st = mb_strtolower(trim($order['status'] ?? ''));
    return $st === 'teslim edildi' || $st === 'teslim_edildi' || $st === 'delivered' || strpos($st, 'teslim') !== false;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check eligibility endpoint
    if (isset($_GET['action']) && $_GET['action'] === 'check-eligibility' || isset($_GET['check_eligibility'])) {
        $email = mb_strtolower(trim($_GET['email'] ?? ''));
        $productId = trim($_GET['productId'] ?? '');

        if ($email === '') {
            echo json_encode(['success' => true, 'canReview' => false, 'reason' => 'Yorum yapabilmek için lütfen önce giriş yapınız.']);
            exit;
        }

        $orders = readJson($ordersFile, []);
        $products = readJson($productsFile, []);

        $matchingOrders = [];
        foreach ($orders as $ord) {
            $ordEmail = mb_strtolower(trim($ord['customerEmail'] ?? ''));
            if ($ordEmail === $email && isProductInOrder($ord, $productId, $products)) {
                $matchingOrders[] = $ord;
            }
        }

        if (empty($matchingOrders)) {
            echo json_encode([
                'success' => true,
                'canReview' => false,
                'reason' => 'Bu ürünü henüz satın almadınız. Yalnızca bu ürünü sipariş verip teslim almış olan müşterilerimiz değerlendirme yapabilir.'
            ]);
            exit;
        }

        $delivered = null;
        foreach ($matchingOrders as $ord) {
            if (isOrderDelivered($ord)) {
                $delivered = $ord;
                break;
            }
        }

        if (!$delivered) {
            $latest = $matchingOrders[0];
            $st = $latest['status'] ?? 'Hazırlanıyor';
            echo json_encode([
                'success' => true,
                'canReview' => false,
                'orderStatus' => $st,
                'orderId' => $latest['id'] ?? '',
                'reason' => "Bu ürün için siparişiniz bulunmaktadır ancak siparişinizin mevcut durumu \"{$st}\". Ürününüz size ulaşıp teslim edildikten sonra yorum yapabilirsiniz."
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'canReview' => true,
            'orderId' => $delivered['id'] ?? '',
            'orderStatus' => $delivered['status'] ?? 'Teslim Edildi'
        ]);
        exit;
    }

    $reviews = readJson($reviewsFile, []);
    $productId = trim($_GET['productId'] ?? '');
    if ($productId !== '') {
        $filtered = array_values(array_filter($reviews, function($r) use ($productId) {
            return ($r['productId'] ?? '') === $productId;
        }));
        echo json_encode(['success' => true, 'reviews' => $filtered, 'count' => count($filtered)]);
        exit;
    }

    echo json_encode(['success' => true, 'reviews' => $reviews, 'count' => count($reviews)]);
    exit;
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true) ?: [];

    $productId = trim($body['productId'] ?? '');
    $userName = trim($body['userName'] ?? 'Doğrulanmış Müşteri');
    $userEmail = mb_strtolower(trim($body['userEmail'] ?? ''));
    $rating = max(1, min(5, intval($body['rating'] ?? 5)));
    $comment = trim($body['comment'] ?? '');

    if ($productId === '' || mb_strlen($comment) < 3 || $userEmail === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Geçersiz yorum verisi veya eksik e-posta.']);
        exit;
    }

    $orders = readJson($ordersFile, []);
    $products = readJson($productsFile, []);

    $isEligible = false;
    $deliveredId = '';
    foreach ($orders as $ord) {
        $ordEmail = mb_strtolower(trim($ord['customerEmail'] ?? ''));
        if ($ordEmail === $userEmail && isProductInOrder($ord, $productId, $products) && isOrderDelivered($ord)) {
            $isEligible = true;
            $deliveredId = $ord['id'] ?? '';
            break;
        }
    }

    if (!$isEligible) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Bu ürüne yalnızca siparişi teslim edilmiş müşterilerimiz değerlendirme yapabilir.']);
        exit;
    }

    $reviews = readJson($reviewsFile, []);
    $newReview = [
        'id' => 'rev_' . time() . '_' . substr(md5(uniqid()), 0, 5),
        'productId' => $productId,
        'userName' => $userName,
        'userEmail' => $userEmail,
        'rating' => $rating,
        'comment' => $comment,
        'date' => date('d.m.Y'),
        'createdAt' => date('c'),
        'orderId' => $deliveredId,
        'verifiedPurchase' => true
    ];

    array_unshift($reviews, $newReview);
    writeJson($reviewsFile, $reviews);

    // Update product rating and reviewsCount
    foreach ($products as &$p) {
        if (($p['id'] ?? '') === $productId || ($p['slug'] ?? '') === $productId) {
            $pRevs = array_filter($reviews, function($r) use ($productId) {
                return ($r['productId'] ?? '') === $productId;
            });
            $p['reviewsCount'] = count($pRevs);
            $sum = array_sum(array_column($pRevs, 'rating'));
            $p['rating'] = count($pRevs) > 0 ? round($sum / count($pRevs), 1) : 5;
            break;
        }
    }
    unset($p);
    writeJson($productsFile, $products);

    echo json_encode([
        'success' => true,
        'message' => 'Yorum başarıyla yayınlandı.',
        'review' => $newReview,
        'reviews' => $reviews
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
