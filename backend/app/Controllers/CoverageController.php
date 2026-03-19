<?php

namespace App\Controllers;

use App\Repositories\CoverageRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Response;

class CoverageController
{
    private $coverage;
    private $users;

    public function __construct(CoverageRepository $coverage, UserRepository $users)
    {
        $this->coverage = $coverage;
        $this->users = $users;
    }

    public function listAll()
    {
        $items = $this->coverage->listAll();
        Response::ok($items);
    }

    public function create()
    {
        Auth::requireRole($this->users, 2);
        $payload = $this->readJson();

        $required = ['kernel', 'title', 'author', 'content'];
        foreach ($required as $field) {
            if (!isset($payload[$field])) {
                Response::error("missing field: $field", 400);
                return;
            }
        }

        $item = $this->coverage->create([
            'kernel' => $payload['kernel'],
            'title' => $payload['title'],
            'author' => $payload['author'],
            'content' => $payload['content']
        ]);

        Response::ok($item, 'coverage_created');
    }

    public function delete()
    {
        Auth::requireRole($this->users, 2);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::error('coverage id required', 400);
            return;
        }

        $ok = $this->coverage->deleteById($id);
        Response::ok(['deleted' => $ok]);
    }

    public function update()
    {
        Auth::requireRole($this->users, 2);
        $payload = $this->readJson();
        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            Response::error('coverage id required', 400);
            return;
        }

        $required = ['kernel', 'title', 'author', 'content'];
        foreach ($required as $field) {
            if (!isset($payload[$field])) {
                Response::error("missing field: $field", 400);
                return;
            }
        }

        $item = $this->coverage->updateById($id, [
            'kernel' => $payload['kernel'],
            'title' => $payload['title'],
            'author' => $payload['author'],
            'content' => $payload['content']
        ]);

        Response::ok($item, 'coverage_updated');
    }

    public function upload()
    {
        Auth::requireRole($this->users, 2);
        if (!isset($_FILES['image'])) {
            Response::error('image file required', 400);
            return;
        }

        $file = $_FILES['image'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('upload failed', 400);
            return;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        if (!in_array($ext, $allowed, true)) {
            Response::error('invalid file type', 400);
            return;
        }

        $targetDir = __DIR__ . '/../../public/uploads/news';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $filename = 'news_' . uniqid('', true) . '.' . $ext;
        $targetPath = $targetDir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::error('save failed', 500);
            return;
        }

        $publicUrl = '/uploads/news/' . $filename;
        Response::ok(['url' => $publicUrl]);
    }

    private function readJson()
    {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}
