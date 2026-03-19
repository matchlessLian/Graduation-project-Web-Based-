<?php

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Support\Response;

class AuthController
{
    private $users;

    public function __construct(UserRepository $users)
    {
        $this->users = $users;
    }

    public function register()
    {
        $payload = $this->readJson();
        $username = trim($payload['username'] ?? '');
        $password = trim($payload['password'] ?? '');
        $email = trim($payload['email'] ?? '');
        $phone = trim($payload['phone'] ?? '');
        $flag = (int)($payload['flag'] ?? 0);
        if ($flag !== 1) {
            $flag = 0;
        }

        if ($username === '' || $password === '' || $email === '' || $phone === '') {
            Response::error('username, password, email and phone are required', 400);
            return;
        }

        if (strlen($password) < 4) {
            Response::error('password too short', 400);
            return;
        }

        if ($this->users->findByUsername($username)) {
            Response::error('username already exists', 409);
            return;
        }
        if ($this->users->findByEmail($email)) {
            Response::error('email already exists', 409);
            return;
        }
        if ($this->users->findByPhone($phone)) {
            Response::error('phone already exists', 409);
            return;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $user = $this->users->create($username, $hash, $email, $phone, $flag);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        Response::ok([
            'id' => $user['id'],
            'username' => $user['username'],
            'flag' => $user['flag']
        ], 'registered');
    }

    public function login()
    {
        $payload = $this->readJson();
        $account = trim($payload['account'] ?? '');
        $password = trim($payload['password'] ?? '');

        if ($account === '' || $password === '') {
            Response::error('account and password are required', 400);
            return;
        }

        $user = $this->users->findByEmailOrPhone($account);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('invalid credentials', 401);
            return;
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        Response::ok([
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'] ?? null,
            'phone' => $user['phone'] ?? null,
            'flag' => $user['flag']
        ], 'logged_in');
    }

    public function logout()
    {
        session_destroy();
        Response::ok(null, 'logged_out');
    }

    public function me()
    {
        if (!isset($_SESSION['user_id'])) {
            Response::error('unauthorized', 401);
            return;
        }

        $user = $this->users->findById((int)$_SESSION['user_id']);
        if (!$user) {
            Response::error('unauthorized', 401);
            return;
        }

        Response::ok([
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'] ?? null,
            'phone' => $user['phone'] ?? null,
            'flag' => $user['flag']
        ]);
    }

    private function readJson()
    {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}
