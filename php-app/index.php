<?php
declare(strict_types=1);

require __DIR__ . '/app/core.php';
require __DIR__ . '/app/pages.php';
require __DIR__ . '/app/admin.php';

boot();

$path = path_info();
if ($path === '/index.php') $path = '/';

if ($path === '/' || $path === '') {
  page_home();
  exit;
}

if ($path === '/login') { page_login(); exit; }
if ($path === '/logout') { page_logout(); exit; }
if ($path === '/admin') { page_admin(); exit; }
if ($path === '/search') { page_search(); exit; }
if ($path === '/gallery') { page_gallery(null); exit; }
if (preg_match('#^/gallery/([^/]+)$#', $path, $m)) { page_gallery(rawurldecode($m[1])); exit; }
if ($path === '/directory') { page_directory(null); exit; }
if (preg_match('#^/directory/(\d+)$#', $path, $m)) { page_directory((int) $m[1]); exit; }
if ($path === '/blood') { page_blood(); exit; }
if ($path === '/election') { page_election(); exit; }
if ($path === '/epaper') { page_epaper(); exit; }
if ($path === '/chat') { page_chat(); exit; }
if ($path === '/members') { page_members(); exit; }
if ($path === '/about') { page_about(); exit; }
if ($path === '/privacy') { page_privacy(); exit; }
if ($path === '/contact') { page_contact(); exit; }
if (preg_match('#^/category/([^/]+)$#', $path, $m)) { page_category(rawurldecode($m[1])); exit; }
if (preg_match('#^/article/([^/]+)$#', $path, $m)) { page_article(rawurldecode($m[1])); exit; }

http_response_code(404);
layout('पृष्ठ भेटिएन', '<h1>पृष्ठ भेटिएन</h1><p><a href="' . e(url('/')) . '">गृहपृष्ठ</a></p>');
