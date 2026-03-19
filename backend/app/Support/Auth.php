<?php

namespace App\Support;

use App\Repositories\UserRepository;

class Auth
{
    public static function requireLogin(UserRepository $users)
    {
        if (!isset($_SESSION['user_id'])) {
            Response::error('unauthorized', 401);
            exit;
        }

        $user = $users->findById((int)$_SESSION['user_id']);
        if (!$user) {
            Response::error('unauthorized', 401);
            exit;
        }

        return $user;
    }

    public static function requireRole(UserRepository $users, $flag)
    {
        $user = self::requireLogin($users);
        if ((int)$user['flag'] !== (int)$flag) {
            Response::error('forbidden', 403);
            exit;
        }
        return $user;
    }
}
