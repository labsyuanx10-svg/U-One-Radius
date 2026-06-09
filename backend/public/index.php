<?php

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

date_default_timezone_set($_ENV['TZ'] ?? 'Asia/Jakarta');

// DB config
require __DIR__ . '/../src/Config/Database.php';

// CORS helper
function corsHeaders()
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
}

corsHeaders();

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// DI container
$containerBuilder = new ContainerBuilder();
$container = $containerBuilder->build();
AppFactory::setContainer($container);

$app = AppFactory::create();
$app->setBasePath('');
$app->addBodyParsingMiddleware();

// JSON response helper — kept in global namespace
function jsonResponse($response, $data, $code = 200)
{
    $response->getBody()->write(json_encode($data));
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($code);
}

// Error middleware
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Import middleware
$authMiddleware = new App\Middleware\AuthMiddleware();
$adminMiddleware = new App\Middleware\AdminMiddleware();

// ── Auth routes (no middleware) ──
$app->post('/api/auth/login', 'App\Controllers\AuthController:login');
$app->get('/api/auth/me', 'App\Controllers\AuthController:me')->add($authMiddleware);

// ── Dashboard ──
$app->get('/api/dashboard/stats', 'App\Controllers\DashboardController:stats')->add($authMiddleware);

// ── Groups (superadmin only) ──
$app->group('/api/groups', function ($group) use ($authMiddleware, $adminMiddleware) {
    $group->get('', 'App\Controllers\GroupController:list');
    $group->get('/{id}', 'App\Controllers\GroupController:get');
    $group->post('', 'App\Controllers\GroupController:create');
    $group->put('/{id}', 'App\Controllers\GroupController:update');
    $group->delete('/{id}', 'App\Controllers\GroupController:delete');
})->add($adminMiddleware)->add($authMiddleware);

// ── Users / Customers ──
$app->group('/api/users', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\UserController:list');
    $group->get('/{id}', 'App\Controllers\UserController:get');
    $group->post('', 'App\Controllers\UserController:create');
    $group->put('/{id}', 'App\Controllers\UserController:update');
    $group->delete('/{id}', 'App\Controllers\UserController:delete');
    $group->get('/{id}/transactions', 'App\Controllers\UserController:transactions');
    $group->get('/{id}/tickets', 'App\Controllers\UserController:tickets');
    $group->get('/{id}/subscriptions', 'App\Controllers\UserController:subscriptions');
})->add($authMiddleware);

// ── Customers alias (frontend compatibility) ──
$app->group('/api/customers', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\UserController:list');
    $group->get('/{id}', 'App\Controllers\UserController:get');
    $group->post('', 'App\Controllers\UserController:create');
    $group->put('/{id}', 'App\Controllers\UserController:update');
    $group->delete('/{id}', 'App\Controllers\UserController:delete');
    $group->get('/{id}/transactions', 'App\Controllers\UserController:transactions');
    $group->get('/{id}/tickets', 'App\Controllers\UserController:tickets');
    $group->get('/{id}/subscriptions', 'App\Controllers\UserController:subscriptions');
})->add($authMiddleware);

// ── Plans ──
$app->group('/api/plans', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\PlanController:list');
    $group->get('/{id}', 'App\Controllers\PlanController:get');
    $group->post('', 'App\Controllers\PlanController:create');
    $group->put('/{id}', 'App\Controllers\PlanController:update');
    $group->delete('/{id}', 'App\Controllers\PlanController:delete');
})->add($authMiddleware);

// ── IP Pools ──
$app->group('/api/ip-pools', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\PoolController:list');
    $group->get('/{id}', 'App\Controllers\PoolController:get');
    $group->post('', 'App\Controllers\PoolController:create');
    $group->put('/{id}', 'App\Controllers\PoolController:update');
    $group->delete('/{id}', 'App\Controllers\PoolController:delete');
})->add($authMiddleware);

// ── Routers ──
$app->group('/api/routers', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\RouterController:list');
    $group->get('/{id}', 'App\Controllers\RouterController:get');
    $group->post('', 'App\Controllers\RouterController:create');
    $group->put('/{id}', 'App\Controllers\RouterController:update');
    $group->delete('/{id}', 'App\Controllers\RouterController:delete');
})->add($authMiddleware);

// ── Subscriptions ──
$app->group('/api/subscriptions', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\SubscriptionController:list');
    $group->get('/{id}', 'App\Controllers\SubscriptionController:get');
    $group->post('', 'App\Controllers\SubscriptionController:create');
    $group->put('/{id}', 'App\Controllers\SubscriptionController:update');
    $group->delete('/{id}', 'App\Controllers\SubscriptionController:delete');
})->add($authMiddleware);

// ── Transactions ──
$app->group('/api/transactions', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\TransactionController:list');
    $group->get('/{id}', 'App\Controllers\TransactionController:get');
    $group->post('', 'App\Controllers\TransactionController:create');
    $group->put('/{id}', 'App\Controllers\TransactionController:update');
    $group->delete('/{id}', 'App\Controllers\TransactionController:delete');
    $group->get('/{id}/pdf', 'App\Controllers\TransactionController:pdf');
    $group->post('/{id}/send-wa', 'App\Controllers\TransactionController:sendWa');
})->add($authMiddleware);

// ── Tickets ──
$app->group('/api/tickets', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\TicketController:list');
    $group->get('/{id}', 'App\Controllers\TicketController:get');
    $group->post('', 'App\Controllers\TicketController:create');
    $group->put('/{id}', 'App\Controllers\TicketController:update');
    $group->delete('/{id}', 'App\Controllers\TicketController:delete');
})->add($authMiddleware);

// ── Admin Users (superadmin only) ──
$app->group('/api/admin-users', function ($group) use ($authMiddleware, $adminMiddleware) {
    $group->get('', 'App\Controllers\AdminUserController:list');
    $group->get('/{id}', 'App\Controllers\AdminUserController:get');
    $group->post('', 'App\Controllers\AdminUserController:create');
    $group->put('/{id}', 'App\Controllers\AdminUserController:update');
    $group->delete('/{id}', 'App\Controllers\AdminUserController:delete');
})->add($adminMiddleware)->add($authMiddleware);

// ── WhatsApp Gateway ──
$app->post('/api/wa/test', 'App\Controllers\WaController:test')->add($authMiddleware);
$app->get('/api/wa/providers', 'App\Controllers\WaController:providers')->add($authMiddleware);

// ── RADIUS Accounting ──
$app->group('/api/radacct', function ($group) use ($authMiddleware) {
    $group->get('/online', 'App\Controllers\RadacctController:online');
    $group->get('/log', 'App\Controllers\RadacctController:log');
})->add($authMiddleware);

// ── Settings ──
$app->group('/api/settings', function ($group) use ($authMiddleware) {
    $group->get('', 'App\Controllers\SettingController:list');
    $group->put('', 'App\Controllers\SettingController:update');
})->add($authMiddleware);

// ── Cron ──
$app->get('/api/cron/isolir', 'App\Controllers\CronController:isolir');

$app->run();
