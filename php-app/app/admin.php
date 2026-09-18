<?php
declare(strict_types=1);

function admin_nav(string $p): string {
  $items = [
    'stories' => 'समाचार',
    'gallery' => 'ग्यालरी',
    'directory' => 'डाइरेक्ट्री',
    'blood' => 'रक्त',
    'election' => 'निर्वाचन',
    'epaper' => 'ई-पेपर',
    'ads' => 'विज्ञापन',
    'users' => 'प्रयोगकर्ता',
    'settings' => 'सेटिङ',
    'about' => 'हाम्रोबारे',
    'privacy' => 'गोपनीयता',
    'contact' => 'सम्पर्क',
    'chat' => 'च्याट',
  ];
  $html = '<nav class="admin-nav">';
  foreach ($items as $k => $l) {
    $html .= '<a class="' . ($p === $k || ($p === 'story-edit' && $k === 'stories') ? 'active' : '') . '" href="' . e(url('admin?p=' . $k)) . '">' . e($l) . '</a>';
  }
  $html .= '</nav>';
  $f = take_flash();
  if ($f) $html .= '<div class="flash">' . e($f) . '</div>';
  return $html;
}

function admin_layout(string $title, string $inner, string $p): void {
  layout('एडमिन · ' . $title, admin_nav($p) . $inner, og_tags('एडमिन', tagline(), 'admin'), 'home');
}

function page_admin(): void {
  $u = current_user();
  if (!$u || $u['role'] === 'member') {
    header('Location: ' . url('login'));
    exit;
  }
  $p = (string) ($_GET['p'] ?? 'stories');
  match ($p) {
    'story-edit' => admin_story_edit($u),
    'gallery' => admin_gallery($u),
    'directory' => admin_directory($u),
    'blood' => admin_blood($u),
    'election' => admin_election($u),
    'epaper' => admin_epaper($u),
    'ads' => admin_ads($u),
    'users' => admin_users($u),
    'settings' => admin_settings($u),
    'about' => admin_about($u),
    'privacy' => admin_privacy($u),
    'contact' => admin_contact($u),
    'chat' => admin_chat($u),
    default => admin_stories($u),
  };
}

function admin_stories(array $u): void {
  require_cap('stories');
  if (($_POST['action'] ?? '') === 'trash') {
    csrf_check();
    q('UPDATE desk_stories SET deleted_at = NOW() WHERE id = ?', [(int) $_POST['id']]);
    flash('रिपोर्ट बिनमा गयो।');
    header('Location: ' . url('admin?p=stories'));
    exit;
  }
  $rows = q('SELECT * FROM desk_stories WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 200')->fetchAll();
  $html = '<p><a class="btn" href="' . e(url('admin?p=story-edit')) . '">नयाँ समाचार</a></p><table class="data"><tr><th>शीर्षक</th><th>श्रेणी</th><th>स्थिति</th><th></th></tr>';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['title']) . '</td><td>' . e($r['category']) . '</td><td>' . ($r['published'] ? 'प्रकाशित' : 'ड्राफ्ट') . '</td><td>';
    $html .= '<a href="' . e(url('admin?p=story-edit&id=' . $r['id'])) . '">सच्याउनुहोस्</a> ';
    $html .= '<form method="post" style="display:inline"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="trash"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><button class="btn ghost" type="submit">बिन</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('समाचार', $html, 'stories');
}

function admin_story_edit(array $u): void {
  require_cap('stories');
  $id = (int) ($_GET['id'] ?? 0);
  $row = $id ? q('SELECT * FROM desk_stories WHERE id = ?', [$id])->fetch() : [];
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $title = trim((string) $_POST['title']);
    $slug = unique_slug(slugify((string) ($_POST['slug'] ?: $title)), $id ?: null);
    $img = handle_upload('image') ?: trim((string) $_POST['image_url']);
    if ($img === '' && $id) $img = (string) ($row['image_url'] ?? '');
    $fields = [
      $u['id'], $slug, $title, trim((string) $_POST['excerpt']), (string) $_POST['body'],
      (string) $_POST['category'], (string) $_POST['categories'], (string) $_POST['location'],
      (string) $_POST['tags'], $img, $u['name'] ?: $u['email'], isset($_POST['published']) ? 1 : 0,
    ];
    if ($id) {
      q('UPDATE desk_stories SET slug=?, title=?, excerpt=?, body=?, category=?, categories=?, location=?, tags=?, image_url=?, published=? WHERE id=?', [
        $slug, $title, $fields[3], $fields[4], $fields[5], $fields[6], $fields[7], $fields[8], $img, $fields[11], $id,
      ]);
    } else {
      q('INSERT INTO desk_stories (user_id, slug, title, excerpt, body, category, categories, location, tags, image_url, author_name, published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', $fields);
    }
    flash('समाचार सेभ भयो।');
    header('Location: ' . url('admin?p=stories'));
    exit;
  }
  $cats = categories();
  $html = '<form method="post" enctype="multipart/form-data" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '">';
  $html .= '<h1>' . ($id ? 'समाचार सच्याउनुहोस्' : 'नयाँ समाचार') . '</h1>';
  $html .= '<label>शीर्षक</label><input name="title" required value="' . e($row['title'] ?? '') . '">';
  $html .= '<label>स्लग</label><input name="slug" value="' . e($row['slug'] ?? '') . '">';
  $html .= '<label>सार</label><textarea name="excerpt" rows="2">' . e($row['excerpt'] ?? '') . '</textarea>';
  $html .= '<label>पूरा पाठ</label><textarea name="body" rows="12" required>' . e($row['body'] ?? '') . '</textarea>';
  $html .= '<label>श्रेणी</label><select name="category">';
  foreach ($cats as $c) {
    $sel = (($row['category'] ?? 'local') === $c['slug']) ? ' selected' : '';
    $html .= '<option value="' . e($c['slug']) . '"' . $sel . '>' . e($c['label']) . '</option>';
  }
  $html .= '</select><label>थप श्रेणी (comma)</label><input name="categories" value="' . e($row['categories'] ?? '') . '">';
  $html .= '<label>स्थान</label><input name="location" value="' . e($row['location'] ?? 'कलैया, बारा') . '">';
  $html .= '<label>ट्याग</label><input name="tags" value="' . e($row['tags'] ?? '') . '">';
  $html .= '<label>फिचर्ड इमेज URL</label><input name="image_url" value="' . e($row['image_url'] ?? '') . '">';
  $html .= '<label>वा फाइल अपलोड</label><input type="file" name="image" accept="image/*">';
  $html .= '<p><label><input type="checkbox" name="published" value="1"' . (($row['published'] ?? 1) ? ' checked' : '') . '> प्रकाशित</label></p>';
  $html .= '<button class="btn" type="submit">सेभ</button></form>';
  admin_layout('समाचार', $html, 'story-edit');
}

function admin_gallery(array $u): void {
  require_cap('gallery');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (($_POST['action'] ?? '') === 'delete') {
      q('DELETE FROM gallery_photos WHERE post_id = ?', [(int) $_POST['id']]);
      q('DELETE FROM gallery_posts WHERE id = ?', [(int) $_POST['id']]);
    } else {
      $title = trim((string) $_POST['title']);
      $slug = slugify($title);
      $cover = handle_upload('cover') ?: trim((string) $_POST['cover_url']);
      q('INSERT INTO gallery_posts (slug, title, place, blurb, category, cover_url) VALUES (?,?,?,?,?,?)', [
        $slug . '-' . time(), $title, $_POST['place'] ?? 'कलैया', $_POST['blurb'] ?? '', $_POST['category'] ?? 'local', $cover,
      ]);
      $pid = (int) db()->lastInsertId();
      $extra = handle_upload('photo');
      if ($extra) q('INSERT INTO gallery_photos (post_id, image_url, caption) VALUES (?,?,?)', [$pid, $extra, '']);
    }
    header('Location: ' . url('admin?p=gallery'));
    exit;
  }
  $rows = q('SELECT * FROM gallery_posts ORDER BY id DESC')->fetchAll();
  $html = '<form method="post" enctype="multipart/form-data" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><h3>नयाँ एल्बम</h3>';
  $html .= '<label>शीर्षक</label><input name="title" required><label>स्थान</label><input name="place" value="कलैया"><label>विवरण</label><textarea name="blurb"></textarea>';
  $html .= '<label>कभर URL</label><input name="cover_url"><label>कभर फाइल</label><input type="file" name="cover" accept="image/*"><label>फोटो</label><input type="file" name="photo" accept="image/*"><p><button class="btn">थप्नुहोस्</button></p></form>';
  $html .= '<table class="data"><tr><th>एल्बम</th><th></th></tr>';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['title']) . '</td><td><form method="post"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><button class="btn ghost">मेटाउनुहोस्</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('ग्यालरी', $html, 'gallery');
}

function admin_directory(array $u): void {
  require_cap('directory');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (($_POST['action'] ?? '') === 'delete') {
      q('DELETE FROM dir_entries WHERE id = ?', [(int) $_POST['id']]);
    } else {
      q('INSERT INTO dir_entries (name, category, place, note, phone, email) VALUES (?,?,?,?,?,?)', [
        $_POST['name'], $_POST['category'] ?? 'local', $_POST['place'] ?? 'कलैया', $_POST['note'] ?? '', $_POST['phone'] ?? '', $_POST['email'] ?? '',
      ]);
    }
    header('Location: ' . url('admin?p=directory'));
    exit;
  }
  $rows = q('SELECT * FROM dir_entries ORDER BY id DESC')->fetchAll();
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><h3>नयाँ सूची</h3><label>नाम</label><input name="name" required><label>स्थान</label><input name="place" value="कलैया"><label>फोन</label><input name="phone"><label>नोट</label><textarea name="note"></textarea><p><button class="btn">थप्नुहोस्</button></p></form><table class="data">';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['name']) . '<div class="muted">' . e($r['phone']) . '</div></td><td><form method="post"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><button class="btn ghost">मेटाउनुहोस्</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('डाइरेक्ट्री', $html, 'directory');
}

function admin_blood(array $u): void {
  require_cap('blood');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $kind = $_POST['kind'] ?? 'donor';
    if ($kind === 'donor') {
      q('INSERT INTO blood_donors (name, blood_group, phone, place, note, available) VALUES (?,?,?,?,?,1)', [
        $_POST['name'], $_POST['blood_group'], $_POST['phone'] ?? '', $_POST['place'] ?? '', $_POST['note'] ?? '',
      ]);
    } else {
      q('INSERT INTO blood_requests (patient, blood_group, hospital, place, phone, note, active) VALUES (?,?,?,?,?,?,1)', [
        $_POST['name'], $_POST['blood_group'], $_POST['hospital'] ?? '', $_POST['place'] ?? '', $_POST['phone'] ?? '', $_POST['note'] ?? '',
      ]);
    }
    header('Location: ' . url('admin?p=blood'));
    exit;
  }
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><label>प्रकार</label><select name="kind"><option value="donor">दाता</option><option value="req">आवश्यकता</option></select>';
  $html .= '<label>नाम/बिरामी</label><input name="name" required><label>ग्रुप</label><input name="blood_group" placeholder="A+" required><label>फोन</label><input name="phone"><label>स्थान/अस्पताल</label><input name="place"><input name="hospital" placeholder="अस्पताल"><p><button class="btn">सेभ</button></p></form>';
  admin_layout('रक्त', $html, 'blood');
}

function admin_election(array $u): void {
  require_cap('election');
  $row = q("SELECT payload FROM election_desk WHERE id='main'")->fetch();
  $payload = $row['payload'] ?? '{"title":"निर्वाचन डेस्क","seats":[]}';
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $json = (string) $_POST['payload'];
    json_decode($json);
    if (json_last_error() === JSON_ERROR_NONE) {
      q("INSERT INTO election_desk (id, payload) VALUES ('main', ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)", [$json]);
      flash('निर्वाचन डेस्क सेभ भयो।');
    } else {
      flash('JSON मिलेन।');
    }
    header('Location: ' . url('admin?p=election'));
    exit;
  }
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><p>सीटहरू यस ढाँचामा राख्नुहोस्:</p><pre>{"title":"मधेश चुनाव","seats":[{"name":"बारा १","candidates":[{"name":"उम्मेदवार","party":"पार्टी","votes":0}]}]}</pre>';
  $html .= '<textarea name="payload" rows="16">' . e($payload) . '</textarea><p><button class="btn">सेभ</button></p></form>';
  admin_layout('निर्वाचन', $html, 'election');
}

function admin_epaper(array $u): void {
  require_cap('epaper');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (($_POST['action'] ?? '') === 'delete') {
      q('DELETE FROM epaper_issues WHERE id = ?', [(int) $_POST['id']]);
    } else {
      q('INSERT INTO epaper_issues (issue_date, title, drive_url) VALUES (?,?,?)', [
        $_POST['issue_date'], $_POST['title'] ?? '', $_POST['drive_url'],
      ]);
    }
    header('Location: ' . url('admin?p=epaper'));
    exit;
  }
  $rows = q('SELECT * FROM epaper_issues ORDER BY issue_date DESC')->fetchAll();
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><label>मिति</label><input type="date" name="issue_date" required><label>शीर्षक</label><input name="title"><label>PDF / Drive URL</label><input name="drive_url" required><p><button class="btn">थप्नुहोस्</button></p></form><table class="data">';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['issue_date'] . ' ' . $r['title']) . '</td><td><form method="post"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><button class="btn ghost">मेटाउनुहोस्</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('ई-पेपर', $html, 'epaper');
}

function admin_ads(array $u): void {
  require_cap('ads');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    q('INSERT INTO ads (slot, kind, title, body, image_url, href, active) VALUES (?,?,?,?,?,?,1)', [
      $_POST['slot'] ?? 'home', 'text', $_POST['title'] ?? '', $_POST['body'] ?? '', $_POST['image_url'] ?? '', $_POST['href'] ?? '',
    ]);
    header('Location: ' . url('admin?p=ads'));
    exit;
  }
  $rows = q('SELECT * FROM ads ORDER BY id DESC')->fetchAll();
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><label>स्लट</label><input name="slot" value="home"><label>शीर्षक</label><input name="title"><label>पाठ</label><textarea name="body"></textarea><p><button class="btn">थप्नुहोस्</button></p></form><table class="data">';
  foreach ($rows as $r) $html .= '<tr><td>' . e($r['slot'] . ' · ' . $r['title']) . '</td></tr>';
  $html .= '</table>';
  admin_layout('विज्ञापन', $html, 'ads');
}

function admin_users(array $u): void {
  if ($u['role'] !== 'superadmin') { header('Location: ' . url('admin')); exit; }
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (($_POST['action'] ?? '') === 'role') {
      q('UPDATE users SET role = ? WHERE id = ?', [$_POST['role'], (int) $_POST['id']]);
    } elseif (($_POST['action'] ?? '') === 'create') {
      q('INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?,?)', [
        $_POST['email'], $_POST['name'], password_hash((string) $_POST['password'], PASSWORD_DEFAULT), $_POST['role'] ?? 'nadmin',
      ]);
    }
    header('Location: ' . url('admin?p=users'));
    exit;
  }
  $rows = q('SELECT id, email, name, role FROM users ORDER BY id')->fetchAll();
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="create"><h3>नयाँ प्रयोगकर्ता</h3><label>नाम</label><input name="name"><label>इमेल</label><input name="email" type="email" required><label>पासवर्ड</label><input name="password" type="password" required><label>रोल</label><select name="role">';
  foreach (ROLES as $r) $html .= '<option>' . e($r) . '</option>';
  $html .= '</select><p><button class="btn">बनाउनुहोस्</button></p></form><table class="data">';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['email']) . '<div class="muted">' . e($r['name']) . '</div></td><td><form method="post">';
    $html .= '<input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="role"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><select name="role">';
    foreach (ROLES as $role) $html .= '<option' . ($role === $r['role'] ? ' selected' : '') . '>' . e($role) . '</option>';
    $html .= '</select> <button class="btn ghost">सेभ</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('प्रयोगकर्ता', $html, 'users');
}

function admin_settings(array $u): void {
  require_cap('settings');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    foreach (['site_name', 'site_name_np', 'tagline'] as $k) {
      set_setting($k, trim((string) ($_POST[$k] ?? '')));
    }
    flash('सेटिङ सेभ भयो।');
    header('Location: ' . url('admin?p=settings'));
    exit;
  }
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '">';
  $html .= '<label>अंग्रेजी नाम</label><input name="site_name" value="' . e(site_name()) . '">';
  $html .= '<label>नेपाली नाम</label><input name="site_name_np" value="' . e(site_name_np()) . '">';
  $html .= '<label>ट्यागलाइन</label><input name="tagline" value="' . e(tagline()) . '"><p><button class="btn">सेभ</button></p></form>';
  admin_layout('सेटिङ', $html, 'settings');
}

function admin_about(array $u): void {
  require_cap('about');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    q('UPDATE about_page SET title=?, body=?, phone=?, email=?, address=?, facebook=?, website=? WHERE id=1', [
      $_POST['title'], $_POST['body'], $_POST['phone'], $_POST['email'], $_POST['address'], $_POST['facebook'], $_POST['website'],
    ]);
    flash('हाम्रोबारे सेभ भयो।');
    header('Location: ' . url('admin?p=about'));
    exit;
  }
  $row = q('SELECT * FROM about_page WHERE id=1')->fetch() ?: [];
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '">';
  $html .= '<label>शीर्षक</label><input name="title" value="' . e($row['title'] ?? '') . '"><label>पाठ</label><textarea name="body" rows="8">' . e($row['body'] ?? '') . '</textarea>';
  $html .= '<label>फोन</label><input name="phone" value="' . e($row['phone'] ?? '') . '"><label>इमेल</label><input name="email" value="' . e($row['email'] ?? '') . '">';
  $html .= '<label>ठेगाना</label><input name="address" value="' . e($row['address'] ?? '') . '"><label>Facebook</label><input name="facebook" value="' . e($row['facebook'] ?? '') . '">';
  $html .= '<label>वेबसाइट</label><input name="website" value="' . e($row['website'] ?? '') . '"><p><button class="btn">सेभ</button></p></form>';
  admin_layout('हाम्रोबारे', $html, 'about');
}

function admin_privacy(array $u): void {
  require_cap('privacy');
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    q('UPDATE privacy_page SET intro=?, extra=? WHERE id=1', [$_POST['intro'], $_POST['extra']]);
    flash('गोपनीयता सेभ भयो।');
    header('Location: ' . url('admin?p=privacy'));
    exit;
  }
  $row = q('SELECT * FROM privacy_page WHERE id=1')->fetch() ?: [];
  $html = '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><label>परिचय</label><textarea name="intro" rows="8">' . e($row['intro'] ?? '') . '</textarea><label>थप</label><textarea name="extra" rows="8">' . e($row['extra'] ?? '') . '</textarea><p><button class="btn">सेभ</button></p></form>';
  admin_layout('गोपनीयता', $html, 'privacy');
}

function admin_contact(array $u): void {
  require_cap('contact');
  $rows = q('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 100')->fetchAll();
  $html = '<table class="data"><tr><th>नाम</th><th>सन्देश</th></tr>';
  foreach ($rows as $r) $html .= '<tr><td>' . e($r['name'] . ' · ' . $r['email'] . ' · ' . $r['phone']) . '</td><td>' . e($r['body']) . '</td></tr>';
  $html .= '</table>';
  admin_layout('सम्पर्क', $html, 'contact');
}

function admin_chat(array $u): void {
  require_cap('chat');
  if (($_POST['action'] ?? '') === 'delete') {
    csrf_check();
    q('DELETE FROM chat_messages WHERE id = ?', [(int) $_POST['id']]);
    header('Location: ' . url('admin?p=chat'));
    exit;
  }
  $rows = q('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 200')->fetchAll();
  $html = '<table class="data">';
  foreach ($rows as $r) {
    $html .= '<tr><td>' . e($r['author'] . ': ' . $r['body']) . '</td><td><form method="post"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . (int) $r['id'] . '"><button class="btn ghost">मेटाउनुहोस्</button></form></td></tr>';
  }
  $html .= '</table>';
  admin_layout('च्याट', $html, 'chat');
}
