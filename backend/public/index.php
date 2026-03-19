<?php
declare(strict_types=1);

session_start();

$config = require __DIR__ . '/../app/config.php';

$allowOrigin = $config['app']['cors']['allow_origin'] ?? '*';
if ($allowOrigin === '*') {
    header('Access-Control-Allow-Origin: *');
} else {
    header('Access-Control-Allow-Origin: ' . $allowOrigin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: ' . $config['app']['cors']['allow_methods']);
header('Access-Control-Allow-Headers: ' . $config['app']['cors']['allow_headers']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
if ($path !== '/' && substr($path, -1) === '/') {
    $path = rtrim($path, '/');
}
if ($path === '/' || $path === '/index.php') {
    $indexFile = __DIR__ . '/index.html';
    if (file_exists($indexFile)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($indexFile);
        exit;
    }
}

require __DIR__ . '/../app/Database.php';
require __DIR__ . '/../app/Support/Response.php';
require __DIR__ . '/../app/Support/Router.php';
require __DIR__ . '/../app/Support/Auth.php';
require __DIR__ . '/../app/Repositories/UserRepository.php';
require __DIR__ . '/../app/Repositories/JobRepository.php';
require __DIR__ . '/../app/Repositories/JobTagRepository.php';
require __DIR__ . '/../app/Repositories/UserTagRepository.php';
require __DIR__ . '/../app/Repositories/DescribeUserRepository.php';
require __DIR__ . '/../app/Repositories/TagRepository.php';
require __DIR__ . '/../app/Repositories/InterviewRepository.php';
require __DIR__ . '/../app/Repositories/CoverageRepository.php';
require __DIR__ . '/../app/Repositories/ResumeRepository.php';
require __DIR__ . '/../app/Repositories/UserResumeRepository.php';
require __DIR__ . '/../app/Controllers/AuthController.php';
require __DIR__ . '/../app/Controllers/JobController.php';
require __DIR__ . '/../app/Controllers/CoverageController.php';
require __DIR__ . '/../app/Controllers/ResumeController.php';
require __DIR__ . '/../app/Controllers/ApplicationController.php';
require __DIR__ . '/../app/Controllers/UserController.php';
require __DIR__ . '/../app/Controllers/TagController.php';

use App\Support\Router;
use App\Support\Response;
use App\Repositories\UserRepository;
use App\Repositories\JobRepository;
use App\Repositories\JobTagRepository;
use App\Repositories\UserTagRepository;
use App\Repositories\DescribeUserRepository;
use App\Repositories\TagRepository;
use App\Repositories\InterviewRepository;
use App\Repositories\CoverageRepository;
use App\Repositories\ResumeRepository;
use App\Repositories\UserResumeRepository;
use App\Controllers\AuthController;
use App\Controllers\JobController;
use App\Controllers\CoverageController;
use App\Controllers\ResumeController;
use App\Controllers\ApplicationController;
use App\Controllers\UserController;
use App\Controllers\TagController;

$router = new Router();

$usersRepo = new UserRepository($config);
$jobsRepo = new JobRepository($config);
$jobTagsRepo = new JobTagRepository($config);
$userTagsRepo = new UserTagRepository($config);
$describeRepo = new DescribeUserRepository($config);
$tagsRepo = new TagRepository($config);
$interviewsRepo = new InterviewRepository($config);
$coverageRepo = new CoverageRepository($config);
$resumeRepo = new ResumeRepository($config);
$userResumeRepo = new UserResumeRepository($config);

$authController = new AuthController($usersRepo);
$jobController = new JobController($jobsRepo, $jobTagsRepo, $tagsRepo, $interviewsRepo, $usersRepo);
$coverageController = new CoverageController($coverageRepo, $usersRepo);
$resumeController = new ResumeController($resumeRepo, $usersRepo, $userResumeRepo, $jobsRepo);
$applicationController = new ApplicationController($userResumeRepo, $usersRepo, $jobsRepo, $resumeRepo);
$userController = new UserController($usersRepo, $userTagsRepo, $describeRepo);
$tagController = new TagController($tagsRepo);

$router->add('GET', '/api/health', function () {
    Response::ok(['status' => 'ok']);
});

$router->add('GET', '/api/tags', [$tagController, 'listAll']);
$router->add('GET', '/api/user/tags', [$userController, 'listTags']);
$router->add('PUT', '/api/user/tags', [$userController, 'updateTags']);
$router->add('GET', '/api/profile', [$userController, 'profile']);
$router->add('PUT', '/api/profile', [$userController, 'updateProfile']);
$router->add('GET', '/api/profile/view', [$userController, 'viewProfile']);

// Auth
$router->add('POST', '/api/auth/register', [$authController, 'register']);
$router->add('POST', '/api/auth/login', [$authController, 'login']);
$router->add('POST', '/api/auth/logout', [$authController, 'logout']);
$router->add('GET', '/api/auth/me', [$authController, 'me']);
$router->add('POST', '/api/auth/me', [$authController, 'me']);

// Job
$router->add('POST', '/api/jobs', [$jobController, 'create']);
$router->add('PUT', '/api/jobs', [$jobController, 'update']);
$router->add('GET', '/api/jobs', [$jobController, 'listByTags']);
$router->add('GET', '/api/jobs/detail', [$jobController, 'detail']);
$router->add('GET', '/api/company/jobs', [$jobController, 'listByCompany']);
$router->add('DELETE', '/api/jobs', [$jobController, 'delete']);

// Coverage
$router->add('GET', '/api/coverage', [$coverageController, 'listAll']);
$router->add('POST', '/api/coverage', [$coverageController, 'create']);
$router->add('PUT', '/api/coverage', [$coverageController, 'update']);
$router->add('DELETE', '/api/coverage', [$coverageController, 'delete']);
$router->add('POST', '/api/coverage/upload', [$coverageController, 'upload']);

// Resume
$router->add('GET', '/api/resumes/me', [$resumeController, 'me']);
$router->add('POST', '/api/resumes', [$resumeController, 'create']);
$router->add('POST', '/api/resumes/upload', [$resumeController, 'upload']);
$router->add('GET', '/api/resumes/download', [$resumeController, 'download']);
$router->add('DELETE', '/api/resumes', [$resumeController, 'delete']);

// Applications
$router->add('POST', '/api/applications', [$applicationController, 'apply']);
$router->add('GET', '/api/my/applications', [$applicationController, 'listMine']);
$router->add('GET', '/api/jobs/applications', [$applicationController, 'listByJob']);
$router->add('PUT', '/api/applications/pass', [$applicationController, 'updatePass']);
$router->add('DELETE', '/api/applications', [$applicationController, 'deleteMine']);

// Admin
$router->add('DELETE', '/api/users', [$userController, 'delete']);
$router->add('GET', '/api/users', [$userController, 'listAll']);

$method = $_SERVER['REQUEST_METHOD'];
$router->dispatch($method, $path);
