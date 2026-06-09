<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class LogController
{
    /**
     * List activity logs
     */
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $params = $request->getQueryParams();

        $query = \ORM::for_table('logs')
            ->table_alias('l')
            ->select('l.*')
            ->select('u.fullname', 'user_name')
            ->select('u.role', 'user_role')
            ->left_outer_join('users', ['l.user_id', '=', 'u.id'], 'u');

        // Filter by group via user's group
        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('u.group_id', $user->group_id);
        }

        // Filters
        if (!empty($params['action'])) {
            $query = $query->where('l.action', $params['action']);
        }
        if (!empty($params['user_id'])) {
            $query = $query->where('l.user_id', $params['user_id']);
        }
        if (!empty($params['date_from'])) {
            $query = $query->where_gte('l.created_at', $params['date_from'] . ' 00:00:00');
        }
        if (!empty($params['date_to'])) {
            $query = $query->where_lte('l.created_at', $params['date_to'] . ' 23:59:59');
        }

        $logs = $query->order_by_desc('l.id')->limit(200)->find_many();

        $result = array_map(function ($l) {
            return [
                'id' => (int)$l->id,
                'user_id' => (int)$l->user_id,
                'user_name' => $l->user_name ?? 'System',
                'user_role' => $l->user_role ?? '',
                'action' => $l->action,
                'description' => $l->description,
                'ip_address' => $l->ip_address,
                'created_at' => $l->created_at,
            ];
        }, $logs);

        return jsonResponse($response, ['data' => $result]);
    }
}
