<?php

namespace App\Controllers;

use App\Repositories\JobRepository;
use App\Repositories\JobTagRepository;
use App\Repositories\TagRepository;
use App\Repositories\InterviewRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Response;

class JobController
{
    private $jobs;
    private $jobTags;
    private $tags;
    private $interviews;
    private $users;

    public function __construct(JobRepository $jobs, JobTagRepository $jobTags, TagRepository $tags, InterviewRepository $interviews, UserRepository $users)
    {
        $this->jobs = $jobs;
        $this->jobTags = $jobTags;
        $this->tags = $tags;
        $this->interviews = $interviews;
        $this->users = $users;
    }

    public function create()
    {
        $company = Auth::requireRole($this->users, 1);
        $payload = $this->readJson();

        $required = ['title', 'salary_min', 'salary_max', 'interview_where', 'interview_when', 'interview_remark'];
        foreach ($required as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') {
                Response::error("missing field: $field", 400);
                return;
            }
        }

        $contentData = [
            'summary' => $payload['summary'] ?? ($payload['content'] ?? ''),
            'location' => $payload['location'] ?? '',
            'responsibilities' => $payload['responsibilities'] ?? [],
            'requirements' => $payload['requirements'] ?? [],
            'benefits' => $payload['benefits'] ?? []
        ];

        $job = $this->jobs->create([
            'title' => $payload['title'],
            'user_id' => (int)$company['id'],
            'content' => json_encode($contentData, JSON_UNESCAPED_UNICODE),
            'status' => (int)($payload['status'] ?? 1),
            'salary_min' => (int)$payload['salary_min'],
            'salary_max' => (int)$payload['salary_max'],
            'type' => (int)($payload['type'] ?? 0),
            'experience' => (int)($payload['experience'] ?? 0)
        ]);

        $tagIds = $payload['tag_ids'] ?? [];
        if (is_string($tagIds)) {
            $tagIds = array_filter(array_map('intval', explode(',', $tagIds)));
        }
        if (is_array($tagIds) && count($tagIds) > 4) {
            $tagIds = array_slice($tagIds, 0, 4);
        }
        if (is_array($tagIds) && !empty($tagIds)) {
            $this->jobTags->attach((int)$job['id'], $tagIds);
        }

        $tagNames = $payload['tag_names'] ?? [];
        if (is_string($tagNames)) {
            $tagNames = array_filter(array_map('trim', explode(',', $tagNames)));
        }
        if (is_array($tagNames) && !empty($tagNames)) {
            $tagMap = $this->tags->ensureByNames($tagNames);
            $tagIds = array_values($tagMap);
            if (!empty($tagIds)) {
                $this->jobTags->attach((int)$job['id'], $tagIds);
            }
        }

        $this->interviews->create(
            (int)$company['id'],
            (int)$job['id'],
            (string)$payload['interview_where'],
            (string)$payload['interview_when'],
            (string)$payload['interview_remark']
        );

        Response::ok($this->shapeJob($job), 'job_created');
    }

    public function listByTags()
    {
        $tagsParam = $_GET['tags'] ?? '';
        $tagIds = array_filter(array_map('intval', explode(',', $tagsParam)));
        $jobs = $this->jobs->listByTagIds($tagIds);
        $jobIds = array_map(function ($j) { return (int)$j['id']; }, $jobs);
        $tagMap = $this->tags->listByJobIds($jobIds);
        $interviewMap = $this->interviews->listByJobIds($jobIds);
        $items = [];
        foreach ($jobs as $job) {
            $items[] = $this->shapeJob($job, $tagMap[(int)$job['id']] ?? [], $interviewMap[(int)$job['id']] ?? null);
        }
        Response::ok($items);
    }

    public function detail()
    {
        $jobId = (int)($_GET['id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job id required', 400);
            return;
        }

        $job = $this->jobs->findById($jobId);
        if (!$job) {
            Response::error('job not found', 404);
            return;
        }

        $tagMap = $this->tags->listByJobIds([$jobId]);
        $interview = $this->interviews->findByJobId($jobId);
        Response::ok($this->shapeJob($job, $tagMap[$jobId] ?? [], $interview));
    }

    public function listByCompany()
    {
        $company = Auth::requireRole($this->users, 1);
        $jobs = $this->jobs->listByUserId((int)$company['id']);
        $jobIds = array_map(function ($j) { return (int)$j['id']; }, $jobs);
        $tagMap = $this->tags->listByJobIds($jobIds);
        $interviewMap = $this->interviews->listByJobIds($jobIds);
        $items = [];
        foreach ($jobs as $job) {
            $items[] = $this->shapeJob($job, $tagMap[(int)$job['id']] ?? [], $interviewMap[(int)$job['id']] ?? null);
        }
        Response::ok($items);
    }

    public function update()
    {
        $company = Auth::requireRole($this->users, 1);
        $payload = $this->readJson();
        $jobId = (int)($payload['id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job id required', 400);
            return;
        }

        $job = $this->jobs->findById($jobId);
        if (!$job || (int)$job['user_id'] !== (int)$company['id']) {
            Response::error('forbidden', 403);
            return;
        }

        $required = ['title', 'salary_min', 'salary_max', 'interview_where', 'interview_when', 'interview_remark'];
        foreach ($required as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') {
                Response::error("missing field: $field", 400);
                return;
            }
        }

        $contentData = [
            'summary' => $payload['summary'] ?? ($payload['content'] ?? ''),
            'location' => $payload['location'] ?? '',
            'responsibilities' => $payload['responsibilities'] ?? [],
            'requirements' => $payload['requirements'] ?? [],
            'benefits' => $payload['benefits'] ?? []
        ];

        $updated = $this->jobs->updateById($jobId, [
            'title' => $payload['title'],
            'content' => json_encode($contentData, JSON_UNESCAPED_UNICODE),
            'status' => (int)($payload['status'] ?? ($job['status'] ?? 1)),
            'salary_min' => (int)$payload['salary_min'],
            'salary_max' => (int)$payload['salary_max'],
            'type' => (int)($payload['type'] ?? ($job['type'] ?? 0)),
            'experience' => (int)($payload['experience'] ?? ($job['experience'] ?? 0))
        ]);

        $tagIds = $payload['tag_ids'] ?? [];
        if (is_string($tagIds)) {
            $tagIds = array_filter(array_map('intval', explode(',', $tagIds)));
        }
        if (!is_array($tagIds)) {
            $tagIds = [];
        }
        $this->jobTags->replaceTags($jobId, $tagIds);

        $this->interviews->upsert(
            (int)$company['id'],
            $jobId,
            (string)$payload['interview_where'],
            (string)$payload['interview_when'],
            (string)$payload['interview_remark']
        );

        $tagMap = $this->tags->listByJobIds([$jobId]);
        $interview = $this->interviews->findByJobId($jobId);
        Response::ok($this->shapeJob($updated, $tagMap[$jobId] ?? [], $interview), 'job_updated');
    }

    public function delete()
    {
        $user = Auth::requireLogin($this->users);
        $jobId = (int)($_GET['id'] ?? 0);
        if ($jobId <= 0) {
            Response::error('job id required', 400);
            return;
        }

        if ((int)$user['flag'] !== 1 && (int)$user['flag'] !== 2) {
            Response::error('forbidden', 403);
            return;
        }

        if ((int)$user['flag'] === 1) {
            $job = $this->jobs->findById($jobId);
            if (!$job || (int)$job['user_id'] !== (int)$user['id']) {
                Response::error('forbidden', 403);
                return;
            }
        }

        $ok = $this->jobs->deleteById($jobId);
        Response::ok(['deleted' => $ok]);
    }

    private function shapeJob(array $job, array $tags = [], $interview = null)
    {
        $content = $this->decodeContent($job['content'] ?? '');
        return [
            'id' => (int)$job['id'],
            'title' => $job['title'] ?? '',
            'company' => $job['company_name'] ?? '',
            'location' => $content['location'] ?? '',
            'salary_min' => (int)($job['salary_min'] ?? 0),
            'salary_max' => (int)($job['salary_max'] ?? 0),
            'content' => $content,
            'summary' => $content['summary'] ?? '',
            'responsibilities' => $content['responsibilities'] ?? [],
            'requirements' => $content['requirements'] ?? [],
            'benefits' => $content['benefits'] ?? [],
            'created_at' => $job['created_at'] ?? '',
            'tags' => $tags,
            'interview' => $interview
        ];
    }

    private function decodeContent($raw)
    {
        $raw = trim($raw);
        if ($raw === '') return [];
        $data = json_decode($raw, true);
        if (is_array($data)) return $data;
        return ['summary' => $raw];
    }

    private function readJson()
    {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}
