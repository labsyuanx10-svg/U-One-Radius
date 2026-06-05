<?php

namespace App\Config;

use ORM;

class Database
{
    public static function init()
    {
        ORM::configure('mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';port=' . ($_ENV['DB_PORT'] ?? '3306') . ';dbname=' . ($_ENV['DB_NAME'] ?? 'billing'));
        ORM::configure('username', $_ENV['DB_USER'] ?? 'billing');
        ORM::configure('password', $_ENV['DB_PASS'] ?? 'billing');
        ORM::configure('driver_options', [
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        ]);
    }
}

Database::init();
