<?php

namespace App\Repositories;

use App\Database;
use PDO;

class TagRepository
{
    private $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function listAll()
    {
        if ($this->config['dev']['use_file_store']) {
            return [];
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->query('SELECT * FROM tag ORDER BY id ASC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function ensureByNames(array $names)
    {
        if ($this->config['dev']['use_file_store']) {
            return [];
        }

        $pdo = Database::connection($this->config);
        $names = array_values(array_filter(array_map('trim', $names)));
        if (empty($names)) return [];

        $placeholders = implode(',', array_fill(0, count($names), '?'));
        $stmt = $pdo->prepare("SELECT * FROM tag WHERE name IN ($placeholders)");
        $stmt->execute($names);
        $existing = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $map = [];
        foreach ($existing as $row) {
            $map[$row['name']] = (int)$row['id'];
        }

        foreach ($names as $name) {
            if (!isset($map[$name])) {
                $insert = $pdo->prepare('INSERT INTO tag (name) VALUES (:name)');
                $insert->execute(['name' => $name]);
                $map[$name] = (int)$pdo->lastInsertId();
            }
        }

        return $map;
    }

    public function listByJobIds(array $jobIds)
    {
        if ($this->config['dev']['use_file_store']) {
            return [];
        }

        if (empty($jobIds)) return [];
        $pdo = Database::connection($this->config);
        $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
        $sql = "SELECT jt.job_id, t.id, t.name FROM job_tag jt JOIN tag t ON jt.tag_id = t.id WHERE jt.job_id IN ($placeholders)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($jobIds));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $map = [];
        foreach ($rows as $row) {
            $jobId = (int)$row['job_id'];
            if (!isset($map[$jobId])) $map[$jobId] = [];
            $map[$jobId][] = ['id' => (int)$row['id'], 'name' => $row['name']];
        }
        return $map;
    }
}
