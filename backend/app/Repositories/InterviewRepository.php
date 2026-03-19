<?php

namespace App\Repositories;

use App\Database;
use PDO;

class InterviewRepository
{
    private $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function create($userId, $jobId, $where, $when, $remark)
    {
        if ($this->config['dev']['use_file_store']) {
            return;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('INSERT INTO interview (user_id, job_id, interview_where, interview_when, interview_remark, created_at) VALUES (:user_id, :job_id, :interview_where, :interview_when, :interview_remark, NOW())');
        $stmt->execute([
            'user_id' => $userId,
            'job_id' => $jobId,
            'interview_where' => $where,
            'interview_when' => $when,
            'interview_remark' => $remark
        ]);
    }

    public function findByJobId($jobId)
    {
        if ($this->config['dev']['use_file_store']) {
            return null;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT * FROM interview WHERE job_id = :job_id LIMIT 1');
        $stmt->execute(['job_id' => $jobId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function listByJobIds(array $jobIds)
    {
        if ($this->config['dev']['use_file_store']) {
            return [];
        }

        if (empty($jobIds)) return [];
        $pdo = Database::connection($this->config);
        $placeholders = implode(',', array_fill(0, count($jobIds), '?'));
        $stmt = $pdo->prepare("SELECT * FROM interview WHERE job_id IN ($placeholders)");
        $stmt->execute(array_values($jobIds));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $map = [];
        foreach ($rows as $row) {
            $map[(int)$row['job_id']] = $row;
        }
        return $map;
    }

    public function upsert($userId, $jobId, $where, $when, $remark)
    {
        if ($this->config['dev']['use_file_store']) {
            return;
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->prepare('SELECT id FROM interview WHERE job_id = :job_id LIMIT 1');
        $stmt->execute(['job_id' => $jobId]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($exists) {
            $update = $pdo->prepare('UPDATE interview SET interview_where = :interview_where, interview_when = :interview_when, interview_remark = :interview_remark WHERE job_id = :job_id');
            $update->execute([
                'interview_where' => $where,
                'interview_when' => $when,
                'interview_remark' => $remark,
                'job_id' => $jobId
            ]);
            return;
        }

        $this->create($userId, $jobId, $where, $when, $remark);
    }
}
