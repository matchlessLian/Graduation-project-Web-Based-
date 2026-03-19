<?php

namespace App\Repositories;

use App\Database;
use PDO;

class CoverageRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/news.json';
    }

    public function listAll()
    {
        if ($this->config['dev']['use_file_store']) {
            return $this->readFileStore();
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->query('SELECT * FROM coverage ORDER BY created_at DESC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function create(array $data)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $id = count($items) + 1;
            $item = array_merge($data, [
                'id' => $id,
                'created_at' => date('Y-m-d H:i:s')
            ]);
            $items[] = $item;
            $this->writeFileStore($items);
            return $item;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO coverage (kernel, title, author, content, created_at) VALUES (:kernel, :title, :author, :content, NOW())');
        $stmt->execute([
            'kernel' => $data['kernel'],
            'title' => $data['title'],
            'author' => $data['author'],
            'content' => $data['content']
        ]);
        $id = (int)$pdo->lastInsertId();
        return array_merge($data, ['id' => $id, 'created_at' => date('Y-m-d H:i:s')]);
    }

    public function deleteById($id)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $before = count($items);
            $items = array_values(array_filter($items, function ($i) use ($id) {
                return (int)$i['id'] !== (int)$id;
            }));
            $this->writeFileStore($items);
            return count($items) < $before;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM coverage WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function updateById($id, array $data)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            foreach ($items as &$item) {
                if ((int)$item['id'] === (int)$id) {
                    $item = array_merge($item, $data);
                }
            }
            $this->writeFileStore($items);
            return $this->findById($id);
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('UPDATE coverage SET kernel = :kernel, title = :title, author = :author, content = :content WHERE id = :id');
        $stmt->execute([
            'kernel' => $data['kernel'],
            'title' => $data['title'],
            'author' => $data['author'],
            'content' => $data['content'],
            'id' => $id
        ]);
        return $this->findById($id);
    }

    public function findById($id)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $item) {
                if ((int)$item['id'] === (int)$id) return $item;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM coverage WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
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
