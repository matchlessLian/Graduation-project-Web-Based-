<?php

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Repositories\UserTagRepository;
use App\Repositories\DescribeUserRepository;
use App\Support\Auth;
use App\Support\Response;

class UserController
{
    private $users;
    private $userTags;
    private $describe;

    public function __construct(UserRepository $users, UserTagRepository $userTags, DescribeUserRepository $describe)
    {
        $this->users = $users;
        $this->userTags = $userTags;
        $this->describe = $describe;
    }

    public function delete()
    {
        Auth::requireRole($this->users, 2);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::error('user id required', 400);
            return;
        }

        $ok = $this->users->deleteById($id);
        Response::ok(['deleted' => $ok]);
    }

    public function listAll()
    {
        Auth::requireRole($this->users, 2);
        $items = $this->users->listAll();
        Response::ok($items);
    }

    public function listTags()
    {
        $user = Auth::requireLogin($this->users);
        $items = $this->userTags->listByUserId((int)$user['id']);
        Response::ok($items);
    }

    public function updateTags()
    {
        $user = Auth::requireLogin($this->users);
        $payload = $this->readJson();
        $tagIds = $payload['tag_ids'] ?? [];
        if (is_string($tagIds)) {
            $tagIds = array_filter(array_map('intval', explode(',', $tagIds)));
        }
        if (!is_array($tagIds)) {
            $tagIds = [];
        }
        $this->userTags->replaceTags((int)$user['id'], $tagIds);
        Response::ok(['updated' => true, 'tag_ids' => array_values(array_unique(array_map('intval', $tagIds)))]);
    }

    public function profile()
    {
        $user = Auth::requireLogin($this->users);
        $profile = $this->describe->findByUserId((int)$user['id']);
        Response::ok($profile ?: []);
    }

    public function updateProfile()
    {
        $user = Auth::requireLogin($this->users);
        $payload = $this->readJson();
        $username = trim($payload['username'] ?? '');
        if ($username !== '' && $username !== $user['username']) {
            if ($this->users->findByUsername($username)) {
                Response::error('username already exists', 409);
                return;
            }
            $this->users->updateUsername((int)$user['id'], $username);
            $_SESSION['username'] = $username;
            $user['username'] = $username;
        }

        $profile = $this->describe->upsert((int)$user['id'], [
            'purpose_role' => $payload['purpose_role'] ?? '',
            'introduce' => $payload['introduce'] ?? '',
            'address' => $payload['address'] ?? '',
            'contact' => $payload['contact'] ?? ''
        ]);

        Response::ok([
            'username' => $user['username'],
            'profile' => $profile
        ]);
    }

    public function viewProfile()
    {
        $viewer = Auth::requireLogin($this->users);
        if ((int)$viewer['flag'] !== 1 && (int)$viewer['flag'] !== 2) {
            Response::error('forbidden', 403);
            return;
        }

        $userId = (int)($_GET['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('user id required', 400);
            return;
        }

        $user = $this->users->findById($userId);
        if (!$user) {
            Response::error('user not found', 404);
            return;
        }

        $profile = $this->describe->findByUserId($userId);
        $tags = $this->userTags->listByUserId($userId);

        Response::ok([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'flag' => $user['flag']
            ],
            'profile' => $profile ?: [],
            'tags' => $tags
        ]);
    }

    private function readJson()
    {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}
