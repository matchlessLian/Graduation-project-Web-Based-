<?php

namespace App\Repositories;

use App\Database;
use PDO;

class UserResumeRepository
{
    private $config;
    private $storePath;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/applications.json';
    }

    public function create($userId, $resumeId, $jobId)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $items[] = [
                'user_id' => $userId,
                'resume_id' => $resumeId,
                'job_id' => $jobId,
                'pass' => 0
            ];
            $this->writeFileStore($items);
            return end($items);
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO user_resume (user_id, resume_id, job_id, pass) VALUES (:user_id, :resume_id, :job_id, 0)');
        $stmt->execute([
            'user_id' => $userId,
            'resume_id' => $resumeId,
            'job_id' => $jobId
        ]);
        return [
            'user_id' => $userId,
            'resume_id' => $resumeId,
            'job_id' => $jobId,
            'pass' => 0
        ];
    }

    public function listByUserId($userId)
    {
        if ($this->config['dev']['use_file_store']) {
            return array_values(array_filter($this->readFileStore(), function ($i) use ($userId) {
                return (int)$i['user_id'] === (int)$userId;
            }));
        }

        $pdo = Database::connection($this->config);
        $sql = 'SELECT ur.*, j.title AS job_title, j.salary_min, j.salary_max, j.created_at, u.username AS company_name FROM user_resume ur JOIN job j ON ur.job_id = j.id JOIN user u ON j.user_id = u.id WHERE ur.user_id = :user_id ORDER BY j.created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function listByJobId($jobId)
    {
        if ($this->config['dev']['use_file_store']) {
            return array_values(array_filter($this->readFileStore(), function ($i) use ($jobId) {
                return (int)$i['job_id'] === (int)$jobId;
            }));
        }

        $pdo = Database::connection($this->config);
        $sql = 'SELECT ur.*, u.username FROM user_resume ur JOIN user u ON ur.user_id = u.id WHERE ur.job_id = :job_id ORDER BY ur.user_id DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['job_id' => $jobId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function updatePass($userId, $jobId, $pass)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            foreach ($items as &$item) {
                if ((int)$item['user_id'] === (int)$userId && (int)$item['job_id'] === (int)$jobId) {
                    $item['pass'] = $pass;
                }
            }
            $this->writeFileStore($items);
            return true;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('UPDATE user_resume SET pass = :pass WHERE user_id = :user_id AND job_id = :job_id');
        return $stmt->execute([
            'pass' => $pass,
            'user_id' => $userId,
            'job_id' => $jobId
        ]);
    }

    public function deleteByUserAndJob($userId, $jobId)
    {
        if ($this->config['dev']['use_file_store']) {
            $items = $this->readFileStore();
            $before = count($items);
            $items = array_values(array_filter($items, function ($i) use ($userId, $jobId) {
                return !((int)$i['user_id'] === (int)$userId && (int)$i['job_id'] === (int)$jobId);
            }));
            $this->writeFileStore($items);
            return count($items) < $before;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('DELETE FROM user_resume WHERE user_id = :user_id AND job_id = :job_id');
        return $stmt->execute(['user_id' => $userId, 'job_id' => $jobId]);
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
