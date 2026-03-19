<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ProjectRepository
{
    private $2;
    private $2;

    public $2)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/projects.json';
    }

    // TODO: DB schema placeholder
    // Table: projects
    // Columns:
    //   id (VARCHAR or INT, PK)
    //   category (VARCHAR)
    //   image (TEXT)
    //   bilibili_id (VARCHAR)
    //   figma_url (TEXT)
    //   website_url (TEXT)
    //   github_url (TEXT)
    //   title (VARCHAR)
    //   subtitle (VARCHAR)
    //   description (TEXT)
    //   role (VARCHAR)
    //   tags (JSON)
    //   concept (TEXT)
    //   created_at (DATETIME)

    public $2->config['dev']['use_file_store']) {
            return $this->readFileStore();
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->query('SELECT * FROM projects ORDER BY created_at DESC');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows ?: [];
    }

    private $2->storePath)) return [];
        $raw = file_get_contents($this->storePath);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}