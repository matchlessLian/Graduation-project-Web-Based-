<?php

return [
    'app' => [
        'env' => 'local',
        'debug' => true,
        'cors' => [
            'allow_origin' => 'http://qzds',
            'allow_methods' => 'GET,POST,PUT,DELETE,OPTIONS',
            'allow_headers' => 'Content-Type, Authorization'
        ]
    ],
    'db' => [
        'driver' => 'mysql',
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'qzds',
        'username' => 'root',
        'password' => 'lian',
        'charset' => 'utf8'
    ],
    'dev' => [
        'use_file_store' => false
    ]
];
