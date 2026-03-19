<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ResumeRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/resumes.json';
    }

    public function create($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $id = count($items) + 1;
            $item = [
                'id' => $id,
                'user_id' => $userId,
                'created_at' => date('Y-m-d H:i:s')
            ];
            $items[] = $item;
            $this->writeFileStore($items);
            return $item;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO resume (user_id, created_at) VALUES (:user_id, NOW())');
        $stmt->execute(['user_id' => $userId]);
        $id = (int)$pdo->lastInsertId();
        return [
            'id' => $id,
            'user_id' => $userId,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    public function findByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $item) {
                if ((int)$item['user_id'] === (int)$userId) return $item;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM resume WHERE user_id = :user_id ORDER BY id DESC LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function deleteByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = array_values(array_filter($this->readFileStore(), function ($i) use ($userId) {
                return (int)$i['user_id'] !== (int)$userId;
            }));
            $this->writeFileStore($items);
            return;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM resume WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }

    public function deleteById($id, $userId)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $before = count($items);
            $items = array_values(array_filter($items, function ($i) use ($id, $userId) {
                return (int)$i['id'] !== (int)$id || (int)$i['user_id'] !== (int)$userId;
            }));
            $this->writeFileStore($items);
            return count($items) < $before;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM resume WHERE id = :id AND user_id = :user_id');
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }

    private function readFileStore()
    {
        if (!file_exists($this->storePath)) return [];
        $raw = file_get_contents($this->storePath);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }

    private function writeFileStore(array $items)
    {
        file_put_contents($this->storePath, json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
}
