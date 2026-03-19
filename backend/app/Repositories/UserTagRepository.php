<?php

namespace App\Repositories;

use App\Database;
use PDO;

class UserTagRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/user_tags.json';
    }

    public function listByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            return [];
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT t.id, t.name FROM user_tag ut JOIN tag t ON ut.tag_id = t.id WHERE ut.user_id = :user_id ORDER BY t.id ASC');
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function replaceTags($userId, array $tagIds)
    {
        $tagIds = array_values(array_unique(array_map('intval', $tagIds)));
        if (count($tagIds) > 6) {
            $tagIds = array_slice($tagIds, 0, 6);
        }

        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $items = array_values(array_filter($items, function ($i) use ($userId) {
                return (int)$i['user_id'] !== (int)$userId;
            }));
            foreach ($tagIds as $tagId) {
                $items[] = ['user_id' => $userId, 'tag_id' => $tagId];
            }
            $this->writeFileStore($items);
            return true;
        }

        $pdo = Database::connection($this->config);
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('DELETE FROM user_tag WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
        if (!empty($tagIds)) {
            $insert = $pdo->prepare('INSERT INTO user_tag (user_id, tag_id) VALUES (:user_id, :tag_id)');
            foreach ($tagIds as $tagId) {
                $insert->execute(['user_id' => $userId, 'tag_id' => $tagId]);
            }
        }
        $pdo->commit();
        return true;
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
