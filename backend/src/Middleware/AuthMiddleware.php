<?php

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;

class AuthMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler)
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $token = substr($authHeader, 7);
        $decoded = json_decode(base64_decode($token), true);

        if (!$decoded || !isset($decoded['user_id']) || !isset($decoded['exp']) || $decoded['exp'] < time()) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Invalid or expired token']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $user = \ORM::for_table('users')->find_one($decoded['user_id']);
        if (!$user || $user->status !== 'active') {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'User not found or inactive']));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $request = $request->withAttribute('user', $user);
        return $handler->handle($request);
    }
}
