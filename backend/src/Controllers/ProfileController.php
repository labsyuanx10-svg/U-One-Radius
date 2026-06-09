<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ProfileController
{
    public function get(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        return jsonResponse($response, ['data' => [
            'id' => (int)$user->id,
            'uid' => $user->uid,
            'username' => $user->username,
            'fullname' => $user->fullname,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'group_id' => $user->group_id ? (int)$user->group_id : null,
            'status' => $user->status,
            'last_login' => $user->last_login,
        ]]);
    }

    public function changePassword(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        $oldPassword = $body['old_password'] ?? '';
        $newPassword = $body['new_password'] ?? '';
        $confirmPassword = $body['confirm_password'] ?? '';

        if (empty($oldPassword) || empty($newPassword) || empty($confirmPassword)) {
            return jsonResponse($response, ['error' => 'old_password, new_password, and confirm_password required'], 400);
        }

        if (!password_verify($oldPassword, $user->password)) {
            return jsonResponse($response, ['error' => 'Password lama salah'], 400);
        }

        if ($newPassword !== $confirmPassword) {
            return jsonResponse($response, ['error' => 'Password baru dan konfirmasi tidak cocok'], 400);
        }

        if (strlen($newPassword) < 6) {
            return jsonResponse($response, ['error' => 'Password baru minimal 6 karakter'], 400);
        }

        $user->password = password_hash($newPassword, PASSWORD_BCRYPT);
        $user->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'change_password';
        $log->description = 'User ' . $user->username . ' changed password';
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['message' => 'Password berhasil diubah']);
    }
}
