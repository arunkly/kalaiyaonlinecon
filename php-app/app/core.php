<?php
declare(strict_types=1);

const ROLES = ['superadmin', 'admin', 'eadmin', 'nadmin', 'member'];

function config_path(): string {
  return dirname(__DIR__) . '/config.php';
}

function cfg(): array {
  static $c;
  if ($c) return $c;
  $file = config_path();
  if (!is_file($file)) {
    header('Location: install.php');
    exit;
  }
  $c = require $file;
  return $c;
}

function db(): PDO {
  static $pdo;
  if ($pdo) return $pdo;
  $c = cfg();
  $dsn = 'mysql:host=' . $c['db_host'] . ';dbname=' . $c['db_name'] . ';charset=utf8mb4';
  $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function e(?string $s): string {
  return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function site_url(): string {
  return rtrim((string) (cfg()['site_url'] ?? ''), '/');
}

function url(string $path = '/'): string {
  $base = site_url();
  if ($path === '' || $path === '/') return $base . '/';
  return $base . '/' . ltrim($path, '/');
}

function setting(string $key, string $fallback = ''): string {
  static $all;
  if ($all === null) {
    $all = [];
    try {
      foreach (db()->query('SELECT k, v FROM settings') as $row) {
        $all[$row['k']] = $row['v'];
      }
    } catch (Throwable) {
      $all = [];
    }
  }
  return $all[$key] ?? $fallback;
}

function set_setting(string $key, string $value): void {
  $st = db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
  $st->execute([$key, $value]);
}

function site_name(): string {
  return setting('site_name', cfg()['site_name'] ?? 'KalaiyaOnline');
}

function site_name_np(): string {
  return setting('site_name_np', cfg()['site_name_np'] ?? 'कलैयाअनलाइन');
}

function tagline(): string {
  return setting('tagline', cfg()['tagline'] ?? 'कलैया, बारा र मधेशको स्थानीय समाचार');
}

function boot(): void {
  if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
  }
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
  }
}

function csrf(): string {
  return (string) ($_SESSION['csrf'] ?? '');
}

function csrf_check(): void {
  $ok = hash_equals((string) ($_SESSION['csrf'] ?? ''), (string) ($_POST['_csrf'] ?? ''));
  if (!$ok) {
    http_response_code(400);
    exit('अवैध फारम। पछाडि गएर फेरि प्रयास गर्नुहोस्।');
  }
}

function current_user(): ?array {
  $id = (int) ($_SESSION['uid'] ?? 0);
  if ($id < 1) return null;
  $st = db()->prepare('SELECT id, email, name, role, image FROM users WHERE id = ?');
  $st->execute([$id]);
  $row = $st->fetch();
  return $row ?: null;
}

function can(?array $user, string $cap): bool {
  $role = $user['role'] ?? '';
  if ($role === 'superadmin') return true;
  $map = [
    'admin' => ['stories', 'gallery', 'directory', 'blood', 'ads', 'about', 'privacy', 'contact', 'chat', 'settings'],
    'eadmin' => ['election', 'epaper'],
    'nadmin' => ['stories'],
  ];
  return in_array($cap, $map[$role] ?? [], true);
}

function require_cap(string $cap): array {
  $u = current_user();
  if (!$u || !can($u, $cap)) {
    header('Location: ' . url('login'));
    exit;
  }
  return $u;
}

function slugify(string $title): string {
  $s = trim(mb_strtolower($title, 'UTF-8'));
  $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', $s) ?? '';
  $s = trim($s, '-');
  if ($s === '') $s = 'news-' . date('Ymd-His');
  return mb_substr($s, 0, 80, 'UTF-8');
}

function unique_slug(string $base, ?int $ignoreId = null): string {
  $slug = $base;
  $i = 2;
  while (true) {
    $sql = 'SELECT id FROM desk_stories WHERE slug = ?';
    $args = [$slug];
    if ($ignoreId) {
      $sql .= ' AND id <> ?';
      $args[] = $ignoreId;
    }
    $st = db()->prepare($sql);
    $st->execute($args);
    if (!$st->fetch()) return $slug;
    $slug = $base . '-' . $i;
    $i++;
  }
}

function q(string $sql, array $args = []): PDOStatement {
  $st = db()->prepare($sql);
  $st->execute($args);
  return $st;
}

function stories_public(int $limit = 80, string $category = ''): array {
  $sql = 'SELECT * FROM desk_stories WHERE published = 1 AND deleted_at IS NULL';
  $args = [];
  if ($category !== '') {
    $sql .= ' AND (category = ? OR categories LIKE ?)';
    $args[] = $category;
    $args[] = '%' . $category . '%';
  }
  $sql .= ' ORDER BY created_at DESC LIMIT ' . (int) $limit;
  return q($sql, $args)->fetchAll();
}

function story_by_slug(string $slug): ?array {
  $st = q('SELECT * FROM desk_stories WHERE slug = ? AND published = 1 AND deleted_at IS NULL LIMIT 1', [$slug]);
  $row = $st->fetch();
  return $row ?: null;
}

function categories(): array {
  return q('SELECT slug, label FROM desk_categories ORDER BY id')->fetchAll();
}

function cat_label(string $slug): string {
  foreach (categories() as $c) {
    if ($c['slug'] === $slug) return $c['label'];
  }
  return $slug;
}

function ads_for(string $slot): array {
  return q('SELECT * FROM ads WHERE slot = ? AND active = 1 ORDER BY id DESC', [$slot])->fetchAll();
}

function abs_url(string $pathOrUrl): string {
  $v = trim($pathOrUrl);
  if ($v === '') return url('og.jpg');
  if (str_starts_with($v, 'https://') || str_starts_with($v, 'http://')) return $v;
  if (str_starts_with($v, '/')) return site_url() . $v;
  return url('og.jpg');
}

function og_tags(string $title, string $desc, string $path, string $image = '', string $type = 'website'): string {
  $t = $title !== '' ? $title : site_name();
  $d = $desc !== '' ? $desc : tagline();
  $u = url(ltrim($path, '/'));
  $img = abs_url($image ?: '/og.jpg');
  $bits = [
    '<title>' . e($t) . ' | ' . e(site_name()) . '</title>',
    '<meta name="description" content="' . e($d) . '">',
    '<meta property="og:type" content="' . e($type) . '">',
    '<meta property="og:locale" content="ne_NP">',
    '<meta property="og:site_name" content="' . e(site_name()) . '">',
    '<meta property="og:title" content="' . e($t) . '">',
    '<meta property="og:description" content="' . e($d) . '">',
    '<meta property="og:url" content="' . e($u) . '">',
    '<meta property="og:image" content="' . e($img) . '">',
    '<meta property="og:image:secure_url" content="' . e($img) . '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' . e($t) . '">',
    '<meta name="twitter:image" content="' . e($img) . '">',
    '<link rel="canonical" href="' . e($u) . '">',
  ];
  return implode("\n", $bits);
}

function nav_items(): array {
  return [
    ['home', 'गृह', '/'],
    ['gallery', 'ग्यालरी', '/gallery'],
    ['directory', 'डाइरेक्ट्री', '/directory'],
    ['blood', 'रक्तदाता', '/blood'],
    ['election', 'निर्वाचन', '/election'],
    ['epaper', 'ई-पेपर', '/epaper'],
    ['chat', 'च्याट', '/chat'],
    ['members', 'सदस्य', '/members'],
    ['about', 'हाम्रोबारे', '/about'],
    ['privacy', 'गोपनीयता', '/privacy'],
  ];
}

function layout(string $title, string $html, string $extraHead = '', string $active = 'home'): void {
  $user = current_user();
  $nav = nav_items();
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="ne"><head><meta charset="utf-8">';
  echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
  echo '<meta name="theme-color" content="#14934E">';
  echo $extraHead !== '' ? $extraHead : og_tags($title, tagline(), '/');
  echo '<link rel="icon" href="' . e(url('favicon.svg')) . '">';
  echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap">';
  echo '<link rel="stylesheet" href="' . e(url('assets/app.css')) . '">';
  echo '</head><body>';
  echo '<div class="top"><div class="wrap"><span>' . e(tagline()) . '</span>';
  echo '<span>';
  if ($user) {
    echo e($user['name'] ?: $user['email']) . ' · <a href="' . e(url('admin')) . '" style="color:#fff">एडमिन</a> · <a href="' . e(url('logout')) . '" style="color:#fff">बाहिर</a>';
  } else {
    echo '<a href="' . e(url('login')) . '" style="color:#fff">लगइन</a>';
  }
  echo '</span></div></div>';
  echo '<header class="wrap">';
  echo '<a class="brand" href="' . e(url('/')) . '">';
  echo '<img src="' . e(url('logo.jpg')) . '" alt="">';
  echo '<span><b>' . e(site_name_np()) . '</b><span>' . e(site_name()) . '</span></span></a>';
  echo '<nav class="nav">';
  foreach ($nav as [$key, $label, $href]) {
    $cls = $active === $key ? ' active' : '';
    echo '<a class="' . $cls . '" href="' . e(url(ltrim($href, '/'))) . '">' . e($label) . '</a>';
  }
  echo '</nav></header>';
  echo '<main class="wrap">' . $html . '</main>';
  echo '<footer class="footer"><div class="wrap">';
  echo '<p><strong>' . e(site_name_np()) . '</strong> — ' . e(tagline()) . '</p>';
  echo '<p><a href="' . e(url('about')) . '">हाम्रोबारे</a> · <a href="' . e(url('privacy')) . '">गोपनीयता</a> · <a href="' . e(url('contact')) . '">सम्पर्क</a></p>';
  echo '<p>© ' . date('Y') . ' ' . e(site_name()) . '</p>';
  echo '</div></footer>';
  echo '<nav class="bottom">';
  foreach ([['home','गृह','/'],['gallery','ग्यालरी','gallery'],['directory','डाइरेक्ट्री','directory'],['election','निर्वाचन','election'],['chat','च्याट','chat']] as [$k,$l,$h]) {
    echo '<a class="' . ($active === $k ? 'active' : '') . '" href="' . e(url($h === '/' ? '/' : $h)) . '">' . e($l) . '</a>';
  }
  echo '</nav></body></html>';
}

function story_card(array $s, string $variant = 'mini'): string {
  $href = url('article/' . rawurlencode($s['slug']));
  $img = $s['image_url'] ? '<img src="' . e($s['image_url']) . '" alt="">' : '<span class="ph"></span>';
  if ($variant === 'lead') {
    return '<a class="card" href="' . e($href) . '">' .
      ($s['image_url'] ? '<img class="cover" src="' . e($s['image_url']) . '" alt="">' : '') .
      '<div class="pad"><div class="kicker">' . e(cat_label($s['category'])) . '</div>' .
      '<h2 class="h-title">' . e($s['title']) . '</h2>' .
      '<p class="muted">' . e(mb_substr($s['excerpt'], 0, 160, 'UTF-8')) . '</p></div></a>';
  }
  return '<a class="mini" href="' . e($href) . '">' . $img . '<span><strong>' . e($s['title']) . '</strong><br><span class="muted">' . e($s['created_at']) . '</span></span></a>';
}

function handle_upload(string $field): string {
  if (empty($_FILES[$field]['tmp_name']) || !is_uploaded_file($_FILES[$field]['tmp_name'])) return '';
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime = (string) finfo_file($finfo, $_FILES[$field]['tmp_name']);
  $ok = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
  if (!isset($ok[$mime])) return '';
  $name = date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $ok[$mime];
  $dir = dirname(__DIR__) . '/uploads';
  if (!is_dir($dir)) mkdir($dir, 0755, true);
  $dest = $dir . '/' . $name;
  if (!move_uploaded_file($_FILES[$field]['tmp_name'], $dest)) return '';
  return url('uploads/' . $name);
}

function path_info(): string {
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
  $script = dirname($_SERVER['SCRIPT_NAME'] ?? '');
  if ($script !== '/' && $script !== '\\' && str_starts_with($uri, $script)) {
    $uri = substr($uri, strlen($script)) ?: '/';
  }
  return '/' . trim($uri, '/');
}

function flash(string $msg): void {
  $_SESSION['flash'] = $msg;
}

function take_flash(): string {
  $m = (string) ($_SESSION['flash'] ?? '');
  unset($_SESSION['flash']);
  return $m;
}
