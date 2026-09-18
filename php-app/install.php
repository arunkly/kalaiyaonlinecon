<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (is_file($configFile) && !isset($_GET['force'])) {
  echo '<!doctype html><meta charset="utf-8"><p>इन्स्टल सकिएको छ। <a href="index.php">साइट खोल्नुहोस्</a></p>';
  exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $host = trim((string) $_POST['db_host']);
  $name = trim((string) $_POST['db_name']);
  $user = trim((string) $_POST['db_user']);
  $pass = (string) $_POST['db_pass'];
  $url = rtrim(trim((string) $_POST['site_url']), '/');
  $adminEmail = trim((string) $_POST['admin_email']);
  $adminPass = (string) $_POST['admin_pass'];
  $adminName = trim((string) $_POST['admin_name']) ?: 'Superadmin';
  try {
    if ($adminPass === '' || strlen($adminPass) < 8) {
      throw new RuntimeException('पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।');
    }
    $safeName = str_replace(['`', '/', '\\'], '', $name);
    try {
      $pdo = new PDO('mysql:host=' . $host . ';dbname=' . $safeName . ';charset=utf8mb4', $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      ]);
    } catch (PDOException) {
      $pdo = new PDO('mysql:host=' . $host . ';charset=utf8mb4', $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      ]);
      $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . $safeName . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      $pdo->exec('USE `' . $safeName . '`');
    }
    $raw = (string) file_get_contents(__DIR__ . '/schema.sql');
    foreach (array_filter(array_map('trim', explode(';', $raw))) as $stmt) {
      if ($stmt === '' || str_starts_with($stmt, '--')) continue;
      $pdo->exec($stmt);
    }
    $hash = password_hash($adminPass, PASSWORD_DEFAULT);
    $st = $pdo->prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?,?)');
    $st->execute([$adminEmail, $adminName, $hash, 'superadmin']);
    $cfg = "<?php\nreturn " . var_export([
      'db_host' => $host,
      'db_name' => $safeName,
      'db_user' => $user,
      'db_pass' => $pass,
      'site_url' => $url,
      'site_name' => 'KalaiyaOnline',
      'site_name_np' => 'कलैयाअनलाइन',
      'tagline' => 'कलैया, बारा र मधेशको स्थानीय समाचार',
    ], true) . ";\n";
    if (file_put_contents($configFile, $cfg) === false) {
      throw new RuntimeException('config.php लेख्न सकिएन। फोल्डरलाई लेख्ने अनुमति दिनुहोस्।');
    }
    header('Location: login');
    exit;
  } catch (Throwable $e) {
    $error = $e->getMessage();
  }
}

$guessUrl = ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http')
  . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
?>
<!doctype html>
<html lang="ne">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>कलैयाअनलाइन इन्स्टल</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="assets/app.css">
</head>
<body>
<main class="wrap" style="max-width:36rem;padding:2rem 0">
  <h1>कलैयाअनलाइन · PHP इन्स्टल</h1>
  <p class="muted">cPanel MySQL डाटाबेस बनाएर तल भर्नुहोस्। यो फाइल इन्स्टलपछि आफैं बन्द हुन्छ।</p>
  <?php if ($error): ?><div class="flash err"><?= htmlspecialchars($error) ?></div><?php endif; ?>
  <form method="post" class="card pad">
    <label>MySQL होस्ट</label>
    <input name="db_host" value="localhost" required>
    <label>डाटाबेस नाम</label>
    <input name="db_name" required>
    <label>डाटाबेस युजर</label>
    <input name="db_user" required>
    <label>डाटाबेस पासवर्ड</label>
    <input name="db_pass" type="password">
    <label>साइट URL</label>
    <input name="site_url" value="<?= htmlspecialchars($guessUrl) ?>" required>
    <label>सुपरएडमिन नाम</label>
    <input name="admin_name" value="Arun Kumar Sah">
    <label>सुपरएडमिन इमेल</label>
    <input name="admin_email" type="email" value="arunkly@gmail.com" required>
    <label>सुपरएडमिन पासवर्ड</label>
    <input name="admin_pass" type="password" required minlength="8">
    <p><button class="btn" type="submit">इन्स्टल गर्नुहोस्</button></p>
  </form>
</main>
</body>
</html>
