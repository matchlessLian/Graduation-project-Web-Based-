<?php

namespace App\Support;

class Router
{
    private $routes = [];

    public function add($method, $path, $handler)
    {
        $this->routes[] = [$method, $path, $handler];
    }

    public function dispatch($method, $path)
    {
        foreach ($this->routes as $route) {
            [$routeMethod, $routePath, $handler] = $route;
            if ($method === $routeMethod && $path === $routePath) {
                call_user_func($handler);
                return;
            }
        }

        Response::error('Not Found', 404);
    }
}
