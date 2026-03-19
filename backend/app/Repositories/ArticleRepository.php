<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ArticleRepository
{
    private $2;
    private $2;

    public $2)
    {
        $this->config = $config;
        $this->storePath = __DIR__ . '/../../storage/articles.json';
    }

    // TODO: DB schema placeholder
    // Table: articles
    // Columns:
    //   id (VARCHAR or INT, PK)
    //   category (VARCHAR)
    //   link (TEXT)
    //   cover_image (TEXT)
    //   date (DATE)
    //   title (VARCHAR)
    //   created_at (DATETIME)

    public $2->config['dev']['use_file_store']) {
            return $this->readFileStore();
        }

        $pdo = Database::connection($this->config);
        $stmt = $pdo->query('SELECT * FROM articles ORDER BY date DESC');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows ?: [];
    }

    private $2->storePath)) return [];
        $raw = file_get_contents($this->storePath);
        $data = $raw ? json_decode($raw, true) : [];
        return is_array($data) ? $data : [];
    }
}