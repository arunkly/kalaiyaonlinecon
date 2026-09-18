<?php
declare(strict_types=1);

function page_home(): void {
  $all = stories_public(100);
  $headline = array_values(array_filter($all, fn($s) => $s['category'] === 'headline' || str_contains($s['categories'], 'headline')));
  $used = [];
  $pick = function (array $aliases, int $n) use ($all, &$used): array {
    $out = [];
    foreach ($all as $s) {
      if (isset($used[$s['id']])) continue;
      $blob = $s['category'] . ',' . $s['categories'];
      foreach ($aliases as $a) {
        if ($a !== '' && (str_contains($blob, $a) || $s['category'] === $a)) {
          $out[] = $s;
          $used[$s['id']] = true;
          break;
        }
      }
      if (count($out) >= $n) break;
    }
    return $out;
  };
  $lead = $headline[0] ?? $all[0] ?? null;
  $html = '';
  if ($lead) {
    $used[$lead['id']] = true;
    $html .= '<div class="hero-grid">' . story_card($lead, 'lead') . '<div class="stack">';
    foreach (array_slice($all, 0, 5) as $s) {
      if ($s['id'] === $lead['id']) continue;
      $html .= story_card($s);
      $used[$s['id']] = true;
    }
    $html .= '</div></div>';
  } else {
    $html .= '<p class="lead">अहिले प्रकाशित समाचार छैन। एडमिनबाट पहिलो रिपोर्ट लेख्नुहोस्।</p>';
  }
  $blocks = [
    ['local', 'स्थानीय', ['local', 'स्थानीय']],
    ['news', 'राष्ट्रिय', ['news', 'राष्ट्रिय']],
    ['politics', 'राजनीति', ['politics', 'राजनीति']],
    ['business', 'व्यापार', ['business', 'व्यापार']],
    ['sports', 'खेलकुद', ['sports', 'खेलकुद']],
    ['health', 'स्वास्थ्य', ['health', 'स्वास्थ्य']],
  ];
  foreach ($blocks as [$slug, $label, $aliases]) {
    $items = $pick($aliases, 4);
    if (!$items) continue;
    $html .= '<div class="section-head"><h2>' . e($label) . '</h2><a href="' . e(url('category/' . $slug)) . '">थप</a></div>';
    $html .= story_card($items[0], 'lead');
    if (count($items) > 1) {
      $html .= '<div class="stack" style="margin-top:.7rem">';
      foreach (array_slice($items, 1) as $s) $html .= story_card($s);
      $html .= '</div>';
    }
  }
  foreach (ads_for('home') as $ad) {
    $html .= '<aside class="card pad" style="margin-top:1rem"><div class="kicker">विज्ञापन</div><strong>' . e($ad['title']) . '</strong><p>' . e($ad['body']) . '</p></aside>';
  }
  layout(site_name(), $html, og_tags(site_name(), tagline(), '/', '/og.jpg'), 'home');
}

function page_article(string $slug): void {
  $s = story_by_slug($slug);
  if (!$s) {
    http_response_code(404);
    layout('भेटिएन', '<p>यो रिपोर्ट भेटिएन।</p>');
    return;
  }
  q('UPDATE desk_stories SET views = views + 1 WHERE id = ?', [$s['id']]);
  if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'comment') {
    csrf_check();
    $body = trim((string) ($_POST['body'] ?? ''));
    $name = trim((string) ($_POST['author'] ?? current_user()['name'] ?? 'पाठक'));
    if ($body !== '') {
      q('INSERT INTO desk_comments (slug, user_id, author, body) VALUES (?,?,?,?)', [
        $s['slug'], (int) (current_user()['id'] ?? 0), mb_substr($name, 0, 80), mb_substr($body, 0, 2000),
      ]);
      header('Location: ' . url('article/' . rawurlencode($slug)));
      exit;
    }
  }
  $comments = q('SELECT * FROM desk_comments WHERE slug = ? ORDER BY id DESC LIMIT 50', [$s['slug']])->fetchAll();
  $html = '<article class="card">';
  if ($s['image_url']) $html .= '<img class="cover" src="' . e($s['image_url']) . '" alt="">';
  $html .= '<div class="pad"><div class="kicker">' . e(cat_label($s['category'])) . ' · ' . e($s['location']) . '</div>';
  $html .= '<h1 class="h-title">' . e($s['title']) . '</h1>';
  $html .= '<p class="muted">' . e($s['author_name'] ?: 'कलैयाअनलाइन') . ' · ' . e($s['created_at']) . ' · ' . (int) $s['views'] . ' पटक</p>';
  $html .= '<div class="article-body">';
  foreach (preg_split("/\n\s*\n/", trim($s['body'])) as $p) {
    if (trim($p) !== '') $html .= '<p>' . nl2br(e(trim($p))) . '</p>';
  }
  $html .= '</div></div></article>';
  $html .= '<section class="card pad" style="margin-top:1rem"><h3>टिप्पणी</h3>';
  foreach ($comments as $c) {
    $html .= '<p><strong>' . e($c['author']) . '</strong> · <span class="muted">' . e($c['created_at']) . '</span><br>' . e($c['body']) . '</p>';
  }
  $html .= '<form method="post"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><input type="hidden" name="action" value="comment">';
  $html .= '<label>नाम</label><input name="author" value="' . e(current_user()['name'] ?? '') . '">';
  $html .= '<label>टिप्पणी</label><textarea name="body" rows="3" required></textarea><p><button class="btn" type="submit">पठाउनुहोस्</button></p></form></section>';
  $img = $s['image_url'] ?: '/og.jpg';
  layout($s['title'], $html, og_tags($s['title'], $s['excerpt'] ?: tagline(), 'article/' . $s['slug'], $img, 'article'), 'home');
}

function page_category(string $slug): void {
  $items = stories_public(60, $slug);
  $html = '<div class="section-head"><h2>' . e(cat_label($slug)) . '</h2></div><div class="stack">';
  foreach ($items as $s) $html .= story_card($s, 'lead');
  if (!$items) $html .= '<p>यो श्रेणीमा समाचार छैन।</p>';
  $html .= '</div>';
  layout(cat_label($slug), $html, og_tags(cat_label($slug), tagline(), 'category/' . $slug), 'home');
}

function page_search(): void {
  $qstr = trim((string) ($_GET['q'] ?? ''));
  $html = '<h1>खोज</h1><form method="get" action="' . e(url('search')) . '"><input name="q" value="' . e($qstr) . '" placeholder="समाचार खोज्नुहोस्"><p><button class="btn">खोज्नुहोस्</button></p></form>';
  if ($qstr !== '') {
    $like = '%' . $qstr . '%';
    $items = q('SELECT * FROM desk_stories WHERE published=1 AND deleted_at IS NULL AND (title LIKE ? OR excerpt LIKE ? OR body LIKE ?) ORDER BY created_at DESC LIMIT 40', [$like, $like, $like])->fetchAll();
    $html .= '<div class="stack">';
    foreach ($items as $s) $html .= story_card($s);
    if (!$items) $html .= '<p>केही भेटिएन।</p>';
    $html .= '</div>';
  }
  layout('खोज', $html);
}

function page_gallery(?string $slug): void {
  if ($slug) {
    $post = q('SELECT * FROM gallery_posts WHERE slug = ?', [$slug])->fetch();
    if (!$post) { http_response_code(404); layout('भेटिएन', '<p>ग्यालरी भेटिएन।</p>', '', 'gallery'); return; }
    q('UPDATE gallery_posts SET views = views + 1 WHERE id = ?', [$post['id']]);
    $photos = q('SELECT * FROM gallery_photos WHERE post_id = ? ORDER BY id', [$post['id']])->fetchAll();
    $html = '<h1>' . e($post['title']) . '</h1><p class="muted">' . e($post['place']) . '</p><p>' . e($post['blurb']) . '</p><div class="grid3">';
    foreach ($photos as $p) $html .= '<div class="card"><img class="cover" src="' . e($p['image_url']) . '" alt=""><div class="pad">' . e($p['caption']) . '</div></div>';
    $html .= '</div>';
    layout($post['title'], $html, og_tags($post['title'], $post['blurb'], 'gallery/' . $post['slug'], $post['cover_url']), 'gallery');
    return;
  }
  $posts = q('SELECT * FROM gallery_posts ORDER BY created_at DESC LIMIT 60')->fetchAll();
  $html = '<h1>ग्यालरी</h1><div class="grid3">';
  foreach ($posts as $p) {
    $html .= '<a class="card" href="' . e(url('gallery/' . rawurlencode($p['slug']))) . '">';
    if ($p['cover_url']) $html .= '<img class="cover" src="' . e($p['cover_url']) . '" alt="">';
    $html .= '<div class="pad"><strong>' . e($p['title']) . '</strong><div class="muted">' . e($p['place']) . '</div></div></a>';
  }
  if (!$posts) $html .= '<p>अहिले ग्यालरी खाली छ।</p>';
  $html .= '</div>';
  layout('ग्यालरी', $html, og_tags('ग्यालरी', tagline(), 'gallery'), 'gallery');
}

function page_directory(?int $id): void {
  if ($id) {
    $row = q('SELECT * FROM dir_entries WHERE id = ?', [$id])->fetch();
    if (!$row) { http_response_code(404); layout('भेटिएन', '<p>सूची भेटिएन।</p>', '', 'directory'); return; }
    q('UPDATE dir_entries SET views = views + 1 WHERE id = ?', [$id]);
    $html = '<div class="card pad"><h1>' . e($row['name']) . '</h1><p>' . e($row['place']) . ' · ' . e($row['category']) . '</p><p>' . e($row['note']) . '</p>';
    if ($row['phone']) $html .= '<p>फोन: <a href="tel:' . e($row['phone']) . '">' . e($row['phone']) . '</a></p>';
    $html .= '</div>';
    layout($row['name'], $html, og_tags($row['name'], $row['note'], 'directory/' . $id), 'directory');
    return;
  }
  $rows = q('SELECT * FROM dir_entries ORDER BY name LIMIT 200')->fetchAll();
  $html = '<h1>डाइरेक्ट्री</h1><div class="stack">';
  foreach ($rows as $r) {
    $html .= '<a class="mini" href="' . e(url('directory/' . $r['id'])) . '"><span class="ph"></span><span><strong>' . e($r['name']) . '</strong><br><span class="muted">' . e($r['place']) . ' · ' . e($r['phone']) . '</span></span></a>';
  }
  if (!$rows) $html .= '<p>सूची खाली छ।</p>';
  $html .= '</div>';
  layout('डाइरेक्ट्री', $html, og_tags('डाइरेक्ट्री', tagline(), 'directory'), 'directory');
}

function page_blood(): void {
  $donors = q('SELECT * FROM blood_donors WHERE available = 1 ORDER BY id DESC LIMIT 200')->fetchAll();
  $reqs = q('SELECT * FROM blood_requests WHERE active = 1 ORDER BY id DESC LIMIT 50')->fetchAll();
  $html = '<h1>रक्तदाता</h1><div class="section-head"><h2>आवश्यकता</h2></div>';
  foreach ($reqs as $r) {
    $html .= '<div class="card pad" style="margin-bottom:.6rem"><strong>' . e($r['patient']) . '</strong> — ' . e($r['blood_group']) . '<div class="muted">' . e($r['hospital'] . ' · ' . $r['place']) . '</div></div>';
  }
  $html .= '<div class="section-head"><h2>दाता</h2></div><div class="grid3">';
  foreach ($donors as $d) {
    $html .= '<div class="card pad"><strong>' . e($d['name']) . '</strong><div>' . e($d['blood_group']) . ' · ' . e($d['place']) . '</div><div class="muted">' . e($d['phone']) . '</div></div>';
  }
  $html .= '</div>';
  layout('रक्तदाता', $html, og_tags('रक्तदाता', tagline(), 'blood'), 'blood');
}

function page_election(): void {
  $row = q("SELECT payload FROM election_desk WHERE id = 'main'")->fetch();
  $data = $row ? json_decode((string) $row['payload'], true) : [];
  $title = $data['title'] ?? 'निर्वाचन डेस्क';
  $seats = $data['seats'] ?? [];
  $html = '<h1>' . e((string) $title) . '</h1>';
  if (!$seats) $html .= '<p>निर्वाचन परिणाम अहिले एडमिनबाट राखिनेछ।</p>';
  foreach ($seats as $seat) {
    if (!is_array($seat)) continue;
    $html .= '<div class="card pad" style="margin-bottom:.7rem"><h3>' . e((string) ($seat['name'] ?? 'क्षेत्र')) . '</h3>';
    foreach (($seat['candidates'] ?? []) as $c) {
      if (!is_array($c)) continue;
      $html .= '<p>' . e((string) ($c['name'] ?? '')) . ' — ' . e((string) ($c['party'] ?? '')) . ' · ' . e((string) ($c['votes'] ?? '0')) . ' मत</p>';
    }
    $html .= '</div>';
  }
  layout('निर्वाचन', $html, og_tags('निर्वाचन', tagline(), 'election'), 'election');
}

function page_epaper(): void {
  $rows = q('SELECT * FROM epaper_issues ORDER BY issue_date DESC, id DESC LIMIT 100')->fetchAll();
  $html = '<h1>ई-पेपर</h1><div class="stack">';
  foreach ($rows as $r) {
    $html .= '<a class="mini" href="' . e($r['drive_url']) . '" target="_blank" rel="noopener"><span class="ph"></span><span><strong>' . e($r['title'] ?: $r['issue_date']) . '</strong><br><span class="muted">' . e($r['issue_date']) . '</span></span></a>';
  }
  if (!$rows) $html .= '<p>ई-पेपर छैन।</p>';
  $html .= '</div>';
  layout('ई-पेपर', $html, og_tags('ई-पेपर', tagline(), 'epaper'), 'epaper');
}

function page_chat(): void {
  $user = current_user();
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $body = trim((string) ($_POST['body'] ?? ''));
    if ($body !== '' && $user) {
      q('INSERT INTO chat_messages (user_id, author, body) VALUES (?,?,?)', [$user['id'], $user['name'] ?: $user['email'], mb_substr($body, 0, 500)]);
      header('Location: ' . url('chat'));
      exit;
    }
  }
  $msgs = q('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 80')->fetchAll();
  $html = '<h1>च्याट</h1>';
  if ($user) {
    $html .= '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><textarea name="body" rows="2" required placeholder="सन्देश..."></textarea><p><button class="btn">पठाउनुहोस्</button></p></form>';
  } else {
    $html .= '<p><a class="btn" href="' . e(url('login')) . '">च्याट गर्न लगइन गर्नुहोस्</a></p>';
  }
  $html .= '<div class="stack" style="margin-top:1rem">';
  foreach ($msgs as $m) {
    $html .= '<div class="card pad"><strong>' . e($m['author']) . '</strong> <span class="muted">' . e($m['created_at']) . '</span><p>' . e($m['body']) . '</p></div>';
  }
  $html .= '</div>';
  layout('च्याट', $html, og_tags('च्याट', tagline(), 'chat'), 'chat');
}

function page_members(): void {
  $rows = q("SELECT id, name, email, role FROM users WHERE role <> 'member' OR name <> '' ORDER BY id DESC LIMIT 100")->fetchAll();
  $html = '<h1>दर्ता सदस्य</h1><div class="stack">';
  foreach ($rows as $u) {
    $html .= '<div class="mini"><span class="ph"></span><span><strong>' . e($u['name'] ?: $u['email']) . '</strong><br><span class="muted">' . e($u['role']) . '</span></span></div>';
  }
  $html .= '</div>';
  layout('सदस्य', $html, og_tags('सदस्य', tagline(), 'members'), 'members');
}

function page_about(): void {
  $row = q('SELECT * FROM about_page WHERE id = 1')->fetch() ?: [];
  $html = '<article class="card pad"><h1>' . e($row['title'] ?? 'हाम्रोबारे') . '</h1><div class="article-body">';
  foreach (preg_split("/\n\s*\n/", (string) ($row['body'] ?? '')) as $p) {
    if (trim($p)) $html .= '<p>' . nl2br(e(trim($p))) . '</p>';
  }
  $html .= '<p>' . e($row['address'] ?? '') . '<br>' . e($row['phone'] ?? '') . '<br>' . e($row['email'] ?? '') . '</p></div></article>';
  layout('हाम्रोबारे', $html, og_tags('हाम्रोबारे', tagline(), 'about'), 'about');
}

function page_privacy(): void {
  $row = q('SELECT * FROM privacy_page WHERE id = 1')->fetch() ?: [];
  $html = '<article class="card pad"><h1>गोपनीयता नीति</h1><p class="muted">' . e(site_url()) . '</p><div class="article-body">';
  foreach (preg_split("/\n\s*\n/", trim(($row['intro'] ?? '') . "\n\n" . ($row['extra'] ?? ''))) as $p) {
    if (trim($p)) $html .= '<p>' . nl2br(e(trim($p))) . '</p>';
  }
  $html .= '</div></article>';
  layout('गोपनीयता', $html, og_tags('गोपनीयता नीति', tagline(), 'privacy'), 'privacy');
}

function page_contact(): void {
  $msg = '';
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    q('INSERT INTO contact_messages (name, email, phone, body) VALUES (?,?,?,?)', [
      mb_substr(trim((string) $_POST['name']), 0, 120),
      mb_substr(trim((string) $_POST['email']), 0, 120),
      mb_substr(trim((string) $_POST['phone']), 0, 40),
      mb_substr(trim((string) $_POST['body']), 0, 4000),
    ]);
    $msg = '<div class="flash">सन्देश पठाइयो।</div>';
  }
  $html = $msg . '<form method="post" class="card pad"><input type="hidden" name="_csrf" value="' . e(csrf()) . '">';
  $html .= '<h1>सम्पर्क</h1><label>नाम</label><input name="name" required><label>इमेल</label><input name="email" type="email"><label>फोन</label><input name="phone"><label>सन्देश</label><textarea name="body" rows="5" required></textarea><p><button class="btn">पठाउनुहोस्</button></p></form>';
  layout('सम्पर्क', $html);
}

function page_login(): void {
  $err = '';
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = trim((string) ($_POST['email'] ?? ''));
    $pass = (string) ($_POST['password'] ?? '');
    $st = q('SELECT * FROM users WHERE email = ? LIMIT 1', [$email]);
    $u = $st->fetch();
    if ($u && password_verify($pass, $u['password_hash'])) {
      $_SESSION['uid'] = (int) $u['id'];
      header('Location: ' . url('admin'));
      exit;
    }
    $err = '<div class="flash err">इमेल वा पासवर्ड मिलेन।</div>';
  }
  $html = $err . '<form method="post" class="card pad" style="max-width:28rem"><input type="hidden" name="_csrf" value="' . e(csrf()) . '"><h1>लगइन</h1>';
  $html .= '<label>इमेल</label><input name="email" type="email" required><label>पासवर्ड</label><input name="password" type="password" required><p><button class="btn">भित्र छिर्नुहोस्</button></p></form>';
  layout('लगइन', $html);
}

function page_logout(): void {
  $_SESSION = [];
  session_destroy();
  header('Location: ' . url('/'));
  exit;
}
