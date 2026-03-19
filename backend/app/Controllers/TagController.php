<?php

namespace App\Controllers;

use App\Repositories\TagRepository;
use App\Support\Response;

class TagController
{
    private $tags;

    public function __construct(TagRepository $tags)
    {
        $this->tags = $tags;
    }

    public function listAll()
    {
        $items = $this->tags->listAll();
        Response::ok($items);
    }
}
