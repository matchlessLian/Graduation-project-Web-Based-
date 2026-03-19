<?php

namespace App\Controllers;

use App\Repositories\ResumeRepository;
use App\Repositories\UserRepository;
use App\Repositories\UserResumeRepository;
use App\Repositories\JobRepository;
use App\Support\Auth;
use App\Support\Response;

class ResumeController
{
    private $resumes;
    private $users;
    private $userResumes;
    private $jobs;

    public function __construct(ResumeRepository $resumes, UserRepository $users, UserResumeRepository $userResumes, JobRepository $jobs)
    {
        $this->resumes = $resumes;
        $this->users = $users;
        $this->userResumes = $userResumes;
        $this->jobs = $jobs;
    }

    public function me()
    {
        $user = Auth::requireRole($this->users, 0);
        $resume = $this->resumes->findByUserId((int)$user['id']);
        $filePath = $this->resolveResumePath((int)$user['id']);
        $ext = $filePath ? strtolower(pathinfo($filePath, PATHINFO_EXTENSION)) : null;
        Response::ok([
            'resume' => $resume,
            'has_file' => $filePath ? true : false,
            'file_ext' => $ext
        ]);
    }

    public function create()
    {
        $user = Auth::requireRole($this->users, 0);
        $resume = $this->resumes->create((int)$user['id']);
        Response::ok($resume, 'resume_created');
    }

    public function upload()
    {
        $user = Auth::requireRole($this->users, 0);

        if (!isset($_FILES['resume'])) {
            Response::error('resume file required', 400);
            return;
        }

        $file = $_FILES['resume'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('upload failed', 400);
            return;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $ext = $ext ? strtolower($ext) : '';

        $allowed = ['pdf', 'doc', 'docx'];
        if (!in_array($ext, $allowed, true)) {
            Response::error('invalid file type', 400, ['allowed' => $allowed]);
            return;
        }

        $targetDir = __DIR__ . '/../../storage/resume';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $targetPath = $targetDir . '/' . $user['id'] . '.' . $ext;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::error('unable to save file', 500);
            return;
        }

        $this->resumes->deleteByUserId((int)$user['id']);
        $record = $this->resumes->create((int)$user['id']);

        Response::ok([
            'resume' => $record,
            'file_path' => $targetPath,
            'file_ext' => $ext
        ], 'resume_uploaded');
    }

    public function download()
    {
        $user = Auth::requireLogin($this->users);
        $userId = (int)($_GET['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('user_id required', 400);
            return;
        }

        if ((int)$user['flag'] === 1) {
            $jobId = (int)($_GET['job_id'] ?? 0);
            if ($jobId <= 0) {
                Response::error('job_id required', 400);
                return;
            }
            $job = $this->jobs->findById($jobId);
            if (!$job || (int)$job['user_id'] !== (int)$user['id']) {
                Response::error('forbidden', 403);
                return;
            }
        } elseif ((int)$user['flag'] !== 2 && (int)$user['id'] !== $userId) {
            Response::error('forbidden', 403);
            return;
        }

        $filePath = $this->resolveResumePath($userId);
        if (!$filePath || !file_exists($filePath)) {
            Response::error('resume file not found', 404);
            return;
        }

        $mime = $this->guessMimeType($filePath);
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $inline = isset($_GET['inline']) && $_GET['inline'] === '1';
        $disposition = ($inline && $ext === 'pdf') ? 'inline' : 'attachment';
        header('Content-Type: ' . $mime);
        header('Content-Disposition: ' . $disposition . '; filename="resume_' . $userId . '.' . $ext . '"');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    }

    public function delete()
    {
        $user = Auth::requireRole($this->users, 0);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::error('resume id required', 400);
            return;
        }
        $filePath = $this->resolveResumePath((int)$user['id']);
        if ($filePath && file_exists($filePath)) {
            @unlink($filePath);
        }
        $ok = $this->resumes->deleteById($id, (int)$user['id']);
        Response::ok(['deleted' => $ok]);
    }

    private function resolveResumePath($userId)
    {
        $dir = __DIR__ . '/../../storage/resume';
        $matches = glob($dir . '/' . $userId . '.*');
        if (!$matches || count($matches) === 0) return null;
        return $matches[0];
    }

    private function guessMimeType($path)
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        switch ($ext) {
            case 'pdf': return 'application/pdf';
            case 'doc': return 'application/msword';
            case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default: return 'application/octet-stream';
        }
    }
}
