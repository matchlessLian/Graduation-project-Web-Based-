<?php

namespace App\Support;

class Response
{
    public static function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    public static function error($message, $status = 400, array $extra = [])
    {
        self::json(array_merge([
            'code' => $status,
            'message' => $message,
            'data' => null,
        ], $extra), $status);
    }

    public static function ok($data = null, $message = 'OK')
    {
        self::json([
            'code' => 0,
            'message' => $message,
            'data' => $data,
        ], 200);
    }
}
