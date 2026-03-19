<?php

namespace App;

use PDO;
use PDOException;

class Database
{
    private static $pdo = null;

    public static function connection(array $config)
    {
        if (self::$pdo) {
            return self::$pdo;
        }

        $db = $config['db'];
        $dsn = sprintf(
            '%s:host=%s;port=%d;dbname=%s;charset=%s',
            $db['driver'],
            $db['host'],
            $db['port'],
            $db['database'],
            $db['charset']
        );

        try {
            self::$pdo = new PDO($dsn, $db['username'], $db['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            self::$pdo->exec('SET NAMES utf8');
        } catch (PDOException $e) {
            throw new PDOException('Database connection failed: ' . $e->getMessage());
        }

        return self::$pdo;
    }
}
