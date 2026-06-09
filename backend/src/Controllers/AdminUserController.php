<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AdminUserController
{
    /**
     * List all admin users (role != customer)
     */
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');

        $query = \ORM::for_table('users')
            ->table_alias('u')
            ->select('u.*')
            ->select('g.name', 'group_name')
            ->left_outer_join('groups', ['u.group_id', '=', 'g.id'], 'g')
            ->where_raw('u.role != ?', ['customer']);

        // superadmin sees all; others see same level or below
        if ($user->role !== 'superadmin') {
            $query->where('u.id', $user->id); // admin can only see themselves
        }

        $admins = $query->order_by_desc('u.id')->find_array();

        $result = array_map(function ($u) {
            return [
                'id' => (int)$u['id'],
                'username' => $u['username'],
                'fullname' => $u['fullname'],
                'name' => $u['fullname'],
                'email' => $u['email'],
                'phone' => $u['phone'],
                'role' => $u['role'],
                'group_id' => $u['group_id'] ? (int)$u['group_id'] : null,
                'group_name' => $u['group_name'] ?? '',
                'status' => $u['status'],
                'last_login' => $u['last_login'] ?? null,
                'created_at' => $u['created_at'],
            ];
        }, $admins);

        return jsonResponse($response, ['data' => $result]);
    }

    /**
     * Get single admin user
     */
    public function get(Request $request, Response $response, $args)
    {
        $u = \ORM::for_table('users')
            ->table_alias('u')
            ->select('u.*')
            ->select('g.name', 'group_name')
            ->left_outer_join('groups', ['u.group_id', '=', 'g.id'], 'g')
            ->where('u.id', $args['id'])
            ->where_raw('u.role != ?', ['customer'])
            ->find_one();

        if (!$u) {
            return jsonResponse($response, ['error' => 'Admin not found'], 404);
        }

        return jsonResponse($response, ['data' => [
            'id' => (int)$u->id,
            'username' => $u->username,
            'fullname' => $u->fullname,
            'name' => $u->fullname,
            'email' => $u->email,
            'phone' => $u->phone,
            'role' => $u->role,
            'group_id' => $u->group_id ? (int)$u->group_id : null,
            'group_name' => $u->group_name ?? '',
            'status' => $u->status,
            'last_login' => $u->last_login,
            'created_at' => $u->created_at,
        ]]);
    }

    /**
     * Create admin user
     */
    public function create(Request $request, Response $response, $args)
    {
        $currentUser = $request->getAttribute('user');
        if ($currentUser->role !== 'superadmin') {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        $body = $request->getParsedBody();
        $errors = [];

        if (empty($body['username'])) $errors[] = 'Username harus diisi';
        if (empty($body['password'])) $errors[] = 'Password harus diisi';
        if (empty($body['fullname'])) $errors[] = 'Nama lengkap harus diisi';
        if (!empty($errors)) {
            return jsonResponse($response, ['error' => implode(', ', $errors)], 400);
        }

        // Validate role
        $allowedRoles = ['superadmin', 'admin', 'auditor'];
        $role = $body['role'] ?? 'admin';
        if (!in_array($role, $allowedRoles)) {
            return jsonResponse($response, ['error' => 'Invalid role'], 400);
        }

        // Check unique username
        $exists = \ORM::for_table('users')->where('username', $body['username'])->find_one();
        if ($exists) {
            return jsonResponse($response, ['error' => 'Username sudah digunakan'], 400);
        }

        $newUser = \ORM::for_table('users')->create();
        $newUser->username = $body['username'];
        $newUser->password = password_hash($body['password'], PASSWORD_BCRYPT);
        $newUser->fullname = $body['fullname'];
        $newUser->email = $body['email'] ?? '';
        $newUser->phone = $body['phone'] ?? '';
        $newUser->role = $role;
        $newUser->group_id = $body['group_id'] ?? null;
        $newUser->status = $body['status'] ?? 'active';
        $newUser->created_by = $currentUser->id;
        $newUser->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $currentUser->id;
        $log->action = 'create_admin';
        $log->description = "Created admin user {$newUser->username} ({$role})";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => [
            'id' => (int)$newUser->id,
            'username' => $newUser->username,
            'fullname' => $newUser->fullname,
            'email' => $newUser->email,
            'phone' => $newUser->phone,
            'role' => $newUser->role,
            'group_id' => $newUser->group_id ? (int)$newUser->group_id : null,
            'status' => $newUser->status,
        ]], 201);
    }

    /**
     * Update admin user
     */
    public function update(Request $request, Response $response, $args)
    {
        $currentUser = $request->getAttribute('user');
        if ($currentUser->role !== 'superadmin') {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        $target = \ORM::for_table('users')
            ->where('id', $args['id'])
            ->where_raw('role != ?', ['customer'])
            ->find_one();

        if (!$target) {
            return jsonResponse($response, ['error' => 'Admin not found'], 404);
        }

        $body = $request->getParsedBody();

        if (isset($body['username'])) {
            $exists = \ORM::for_table('users')
                ->where('username', $body['username'])
                ->where_not_equal('id', $args['id'])
                ->find_one();
            if ($exists) {
                return jsonResponse($response, ['error' => 'Username sudah digunakan'], 400);
            }
            $target->username = $body['username'];
        }
        if (!empty($body['password'])) {
            $target->password = password_hash($body['password'], PASSWORD_BCRYPT);
        }
        if (isset($body['fullname'])) $target->fullname = $body['fullname'];
        if (isset($body['email'])) $target->email = $body['email'];
        if (isset($body['phone'])) $target->phone = $body['phone'];
        if (isset($body['role'])) {
            $allowedRoles = ['superadmin', 'admin', 'auditor'];
            if (in_array($body['role'], $allowedRoles)) {
                $target->role = $body['role'];
            }
        }
        if (array_key_exists('group_id', $body)) $target->group_id = $body['group_id'] ?: null;
        if (isset($body['status'])) $target->status = $body['status'];
        $target->save();

        return jsonResponse($response, ['data' => [
            'id' => (int)$target->id,
            'username' => $target->username,
            'fullname' => $target->fullname,
            'email' => $target->email,
            'phone' => $target->phone,
            'role' => $target->role,
            'group_id' => $target->group_id ? (int)$target->group_id : null,
            'status' => $target->status,
        ]]);
    }

    /**
     * Delete admin user
     */
    public function delete(Request $request, Response $response, $args)
    {
        $currentUser = $request->getAttribute('user');
        if ($currentUser->role !== 'superadmin') {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        // Prevent self-delete
        if ((int)$args['id'] === (int)$currentUser->id) {
            return jsonResponse($response, ['error' => 'Tidak bisa menghapus akun sendiri'], 400);
        }

        $target = \ORM::for_table('users')
            ->where('id', $args['id'])
            ->where_raw('role != ?', ['customer'])
            ->find_one();

        if (!$target) {
            return jsonResponse($response, ['error' => 'Admin not found'], 404);
        }

        $target->delete();

        return jsonResponse($response, ['message' => 'Admin deleted']);
    }
}
