<?php

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;

class AdminMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler)
    {
        $user = $request->getAttribute('user');

        if (!$user || !in_array($user->role, ['superadmin', 'admin'])) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Forbidden: admin only']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(403);
        }

        return $handler->handle($request);
    }
}
