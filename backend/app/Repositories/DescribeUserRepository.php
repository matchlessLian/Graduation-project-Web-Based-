<?php

namespace App\Repositories;

use App\Database;
use PDO;

class DescribeUserRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/describeuser.json';
    }

    public function findByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $row) {
                if ((int)$row['user_id'] === (int)$userId) return $row;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM describeuser WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function upsert($userId, array $data)
    {
        $payload = [
            'user_id' => (int)$userId,
            'purpose_role' => (string)($data['purpose_role'] ?? ''),
            'introduce' => (string)($data['introduce'] ?? ''),
            'address' => (string)($data['address'] ?? ''),
            'contact' => (string)($data['contact'] ?? '')
        ];

        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $found = false;
            foreach ($items as &$item) {
                if ((int)$item['user_id'] === (int)$userId) {
                    $item = array_merge($item, $payload);
                    $found = true;
                }
            }
            if (!$found) $items[] = $payload;
            $this->writeFileStore($items);
            return $payload;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT user_id FROM describeuser WHERE user_id = :user_id LIMIT 1');
        $stmt->execute(['user_id' => $userId]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($exists) {
            $update = $pdo->prepare('UPDATE describeuser SET purpose_role = :purpose_role, introduce = :introduce, address = :address, contact = :contact WHERE user_id = :user_id');
            $update->execute($payload);
        } else {
            $insert = $pdo->prepare('INSERT INTO describeuser (user_id, purpose_role, introduce, address, contact) VALUES (:user_id, :purpose_role, :introduce, :address, :contact)');
            $insert->execute($payload);
        }
        return $payload;
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
