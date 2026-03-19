<?php

namespace App\Controllers;

use App\Repositories\ProjectRepository;
use App\Repositories\ArticleRepository;
use App\Support\Response;

class ContentController
{
    private $2;
    private $2;

    public $2, ArticleRepository $articles)
    {
        $this->projects = $projects;
        $this->articles = $articles;
    }

    public $2 = $this->projects->all();
        Response::ok($items);
    }

    public $2 = $this->articles->all();
        Response::ok($items);
    }
}