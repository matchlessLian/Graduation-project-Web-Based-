<?php

namespace App\Repositories;

use App\Database;
use PDO;

class UserRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/users.json';
    }

    public function findById($id)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $user) {
                if ((int)$user['id'] === (int)$id) return $user;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM user WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByUsername($username)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $user) {
                if ($user['username'] === $username) return $user;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM user WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByEmail($email)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $user) {
                if (!empty($email) && $user['email'] === $email) return $user;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM user WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByPhone($phone)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $user) {
                if (!empty($phone) && $user['phone'] === $phone) return $user;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM user WHERE phone = :phone LIMIT 1');
        $stmt->execute(['phone' => $phone]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByEmailOrPhone($account)
    {
        if ($account === '') return null;
        $user = $this->findByEmail($account);
        if ($user) return $user;
        return $this->findByPhone($account);
    }

    public function create($username, $passwordHash, $email, $phone, $flag)
    {
        if ($this->config['dev']['use_file_store']) {
            $users = $this->readFileStore();
            $id = count($users) + 1;
            $user = [
                'id' => $id,
                'email' => $email,
                'phone' => $phone,
                'username' => $username,
                'flag' => $flag,
                'password_hash' => $passwordHash,
                'created_at' => date('Y-m-d H:i:s')
            ];
            $users[] = $user;
            $this->writeFileStore($users);
            return $user;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO user (email, phone, username, flag, password_hash, created_at) VALUES (:email, :phone, :username, :flag, :password_hash, NOW())');
        $stmt->execute([
            'email' => $email,
            'phone' => $phone,
            'username' => $username,
            'flag' => $flag,
            'password_hash' => $passwordHash
        ]);

        $id = (int)$pdo->lastInsertId();
        return [
            'id' => $id,
            'email' => $email,
            'phone' => $phone,
            'username' => $username,
            'flag' => $flag,
            'password_hash' => $passwordHash,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    public function updateUsername($id, $username)
    {
        if ($this->config['dev']['use_file_store']) {
            $users = $this->readFileStore();
            foreach ($users as &$user) {
                if ((int)$user['id'] === (int)$id) {
                    $user['username'] = $username;
                }
            }
            $this->writeFileStore($users);
            return true;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('UPDATE user SET username = :username WHERE id = :id');
        return $stmt->execute(['username' => $username, 'id' => $id]);
    }

    public function deleteById($id)
    {
        if ($this->config['dev']['use_file_store']) {
            $users = $this->readFileStore();
            $before = count($users);
            $users = array_values(array_filter($users, function ($u) use ($id) {
                return (int)$u['id'] !== (int)$id;
            }));
            $this->writeFileStore($users);
            return count($users) < $before;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM user WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function listAll()
    {
        if ($this->config['dev']['use_file_store']) {
            return $this->readFileStore();
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->query('SELECT id, username, flag, email, phone, created_at FROM user ORDER BY id DESC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function readFileStore()
    {
        if (!file_exists($this->storePath)) return [];
        $raw = file_get_contents($this->storePath);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }

    private function writeFileStore(array $users)
    {
        file_put_contents($this->storePath, json_encode($users, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
}
