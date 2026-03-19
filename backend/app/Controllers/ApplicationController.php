<?php

namespace App\Controllers;

use App\Repositories\UserResumeRepository;
use App\Repositories\UserRepository;
use App\Repositories\JobRepository;
use App\Repositories\ResumeRepository;
use App\Support\Auth;
use App\Support\Response;

class ApplicationController
{
    private $userResumes;
    private $users;
    private $jobs;
    private $resumes;

    public function __construct(UserResumeRepository $userResumes, UserRepository $users, JobRepository $jobs, ResumeRepository $resumes)
    {
        $this->userResumes = $userResumes;
        $this->users = $users;
        $this->jobs = $jobs;
        $this->resumes = $resumes;
    }

    public function apply()
    {
        $user = Auth::requireRole($this->users, 0);
        $payload = $this->readJson();
        $jobId = (int)($payload['job_id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job_id required', 400);
            return;
        }

        $resume = $this->resumes->findByUserId((int)$user['id']);
        if (!$resume) {
            Response::error('resume not found', 400);
            return;
        }

        $job = $this->jobs->findById($jobId);
        if (!$job) {
            Response::error('job not found', 404);
            return;
        }

        try {
            $item = $this->userResumes->create((int)$user['id'], (int)$resume['id'], $jobId);
        } catch (\Exception $e) {
            Response::error('apply failed', 500, ['detail' => $e->getMessage()]);
            return;
        }
        Response::ok($item, 'applied');
    }

    public function listMine()
    {
        $user = Auth::requireRole($this->users, 0);
        $items = $this->userResumes->listByUserId((int)$user['id']);
        Response::ok($items);
    }

    public function listByJob()
    {
        $company = Auth::requireRole($this->users, 1);
        $jobId = (int)($_GET['job_id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job_id required', 400);
            return;
        }

        $job = $this->jobs->findById($jobId);
        if (!$job || (int)$job['user_id'] !== (int)$company['id']) {
            Response::error('forbidden', 403);
            return;
        }

        $items = $this->userResumes->listByJobId($jobId);
        Response::ok($items);
    }

    public function updatePass()
    {
        $company = Auth::requireRole($this->users, 1);
        $payload = $this->readJson();
        $jobId = (int)($payload['job_id'] ?? 0);
        $userId = (int)($payload['user_id'] ?? 0);
        $pass = (int)($payload['pass'] ?? 0);

        if ($jobId <= 0 || $userId <= 0) {
            Response::error('job_id and user_id required', 400);
            return;
        }

        $job = $this->jobs->findById($jobId);
        if (!$job || (int)$job['user_id'] !== (int)$company['id']) {
            Response::error('forbidden', 403);
            return;
        }

        $ok = $this->userResumes->updatePass($userId, $jobId, $pass);
        Response::ok(['updated' => $ok]);
    }

    public function deleteMine()
    {
        $user = Auth::requireRole($this->users, 0);
        $jobId = (int)($_GET['job_id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job_id required', 400);
            return;
        }

        $ok = $this->userResumes->deleteByUserAndJob((int)$user['id'], $jobId);
        Response::ok(['deleted' => $ok]);
    }

    private function readJson()
    {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}
