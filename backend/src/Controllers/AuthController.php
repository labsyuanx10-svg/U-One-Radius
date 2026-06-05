<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
    public function login(Request $request, Response $response, $args)
    {
        $body = $request->getParsedBody();
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';

        if (empty($username) || empty($password)) {
            return jsonResponse($response, ['error' => 'Username and password required'], 400);
        }

        $user = \ORM::for_table('users')->where('username', $username)->find_one();

        if (!$user || !password_verify($password, $user->password)) {
            return jsonResponse($response, ['error' => 'Invalid credentials'], 401);
        }

        if ($user->status !== 'active') {
            return jsonResponse($response, ['error' => 'Account is not active'], 403);
        }

        // Update last login
        $user->last_login = date('Y-m-d H:i:s');
        $user->save();

        // Generate token
        $payload = [
            'user_id' => (int)$user->id,
            'role' => $user->role,
            'exp' => time() + 86400,
        ];
        $token = base64_encode(json_encode($payload));

        return jsonResponse($response, [
            'token' => $token,
            'user' => [
                'id' => (int)$user->id,
                'uid' => $user->uid,
                'username' => $user->username,
                'fullname' => $user->fullname,
                'role' => $user->role,
                'group_id' => $user->group_id ? (int)$user->group_id : null,
                'status' => $user->status,
            ],
        ]);
    }

    public function me(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');

        return jsonResponse($response, [
            'id' => (int)$user->id,
            'uid' => $user->uid,
            'username' => $user->username,
            'fullname' => $user->fullname,
            'phone' => $user->phone,
            'address' => $user->address,
            'role' => $user->role,
            'group_id' => $user->group_id ? (int)$user->group_id : null,
            'status' => $user->status,
            'last_login' => $user->last_login,
        ]);
    }
}
