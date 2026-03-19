<?php

namespace App\Repositories;

use App\Database;
use PDO;

class JobRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/jobs.json';
    }

    public function findById($id)
    {
        if ($this->config['dev']['use_file_store']) {
            foreach ($this->readFileStore() as $job) {
                if ((int)$job['id'] === (int)$id) return $job;
            }
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT j.*, u.username AS company_name FROM job j JOIN user u ON j.user_id = u.id WHERE j.id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function create(array $data)
    {
        if ($this->config['dev']['use_file_store']) {
            $jobs = $this->readFileStore();
            $id = count($jobs) + 1;
            $job = array_merge($data, [
                'id' => $id,
                'created_at' => date('Y-m-d H:i:s')
            ]);
            $jobs[] = $job;
            $this->writeFileStore($jobs);
            return $job;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO job (title, user_id, content, status, salary_min, salary_max, type, experience, created_at) VALUES (:title, :user_id, :content, :status, :salary_min, :salary_max, :type, :experience, NOW())');
        $stmt->execute([
            'title' => $data['title'],
            'user_id' => $data['user_id'],
            'content' => $data['content'],
            'status' => $data['status'],
            'salary_min' => $data['salary_min'],
            'salary_max' => $data['salary_max'],
            'type' => $data['type'],
            'experience' => $data['experience'],
        ]);

        $id = (int)$pdo->lastInsertId();
        return array_merge($data, ['id' => $id, 'created_at' => date('Y-m-d H:i:s')]);
    }

    public function listByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            return array_values(array_filter($this->readFileStore(), function ($j) use ($userId) {
                return (int)$j['user_id'] === (int)$userId;
            }));
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT j.*, u.username AS company_name FROM job j JOIN user u ON j.user_id = u.id WHERE j.user_id = :user_id ORDER BY j.created_at DESC');
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function listByTagIds(array $tagIds)
    {
        if ($this->config['dev']['use_file_store']) {
            return $this->readFileStore();
        }

        $pdo = Database::connection($this->config);
        if (empty($tagIds)) {
            $stmt = $pdo->query('SELECT j.*, u.username AS company_name FROM job j JOIN user u ON j.user_id = u.id ORDER BY j.created_at DESC');
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }

        $placeholders = implode(',', array_fill(0, count($tagIds), '?'));
        $sql = "SELECT DISTINCT j.*, u.username AS company_name FROM job j JOIN user u ON j.user_id = u.id JOIN job_tag jt ON j.id = jt.job_id WHERE jt.tag_id IN ($placeholders) ORDER BY j.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($tagIds));
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function deleteById($jobId)
    {
        if ($this->config['dev']['use_file_store']) {
            $jobs = $this->readFileStore();
            $before = count($jobs);
            $jobs = array_values(array_filter($jobs, function ($j) use ($jobId) {
                return (int)$j['id'] !== (int)$jobId;
            }));
            $this->writeFileStore($jobs);
            return count($jobs) < $before;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM job WHERE id = :id');
        return $stmt->execute(['id' => $jobId]);
    }

    public function updateById($jobId, array $data)
    {
        if ($this->config['dev']['use_file_store']) {
            $jobs = $this->readFileStore();
            foreach ($jobs as &$job) {
                if ((int)$job['id'] === (int)$jobId) {
                    $job = array_merge($job, $data);
                }
            }
            $this->writeFileStore($jobs);
            return $this->findById($jobId);
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('UPDATE job SET title = :title, content = :content, status = :status, salary_min = :salary_min, salary_max = :salary_max, type = :type, experience = :experience WHERE id = :id');
        $stmt->execute([
            'title' => $data['title'],
            'content' => $data['content'],
            'status' => $data['status'],
            'salary_min' => $data['salary_min'],
            'salary_max' => $data['salary_max'],
            'type' => $data['type'],
            'experience' => $data['experience'],
            'id' => $jobId
        ]);

        return $this->findById($jobId);
    }

    private function readFileStore()
    {
        if (!file_exists($this->storePath)) return [];
        $raw = file_get_contents($this->storePath);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }

    private function writeFileStore(array $jobs)
    {
        file_put_contents($this->storePath, json_encode($jobs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
}
