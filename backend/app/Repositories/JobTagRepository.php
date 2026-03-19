<?php

namespace App\Repositories;

use App\Database;
use PDO;

class JobTagRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/job_tags.json';
    }

    public function attach($jobId, array $tagIds)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            foreach ($tagIds as $tagId) {
                $items[] = ['job_id' => $jobId, 'tag_id' => $tagId];
            }
            $this->writeFileStore($items);
            return;
        }

        if (empty($tagIds)) return;
        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT IGNORE INTO job_tag (job_id, tag_id) VALUES (:job_id, :tag_id)');
        foreach ($tagIds as $tagId) {
            $stmt->execute(['job_id' => $jobId, 'tag_id' => $tagId]);
        }
    }

    public function replaceTags($jobId, array $tagIds)
    {
        $tagIds = array_values(array_unique(array_map('intval', $tagIds)));
        if (count($tagIds) > 4) {
            $tagIds = array_slice($tagIds, 0, 4);
        }

        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $items = array_values(array_filter($items, function ($i) use ($jobId) {
                return (int)$i['job_id'] !== (int)$jobId;
            }));
            foreach ($tagIds as $tagId) {
                $items[] = ['job_id' => $jobId, 'tag_id' => $tagId];
            }
            $this->writeFileStore($items);
            return true;
        }

        $pdo = Database::connection($this->config);
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('DELETE FROM job_tag WHERE job_id = :job_id');
        $stmt->execute(['job_id' => $jobId]);
        if (!empty($tagIds)) {
            $insert = $pdo->prepare('INSERT INTO job_tag (job_id, tag_id) VALUES (:job_id, :tag_id)');
            foreach ($tagIds as $tagId) {
                $insert->execute(['job_id' => $jobId, 'tag_id' => $tagId]);
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
