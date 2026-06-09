<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PoolController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('ip_pools');

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where_raw('(group_id IS NULL OR group_id = ?)', [$user->group_id]);
        }

        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('status', $params['status']);
        }
        if (!empty($params['group_id'])) {
            $query = $query->where('group_id', $params['group_id']);
        }

        $pools = $query->order_by_desc('id')->find_many();
        $result = array_map(function($p) { return $p->as_array(); }, $pools);
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $pool = \ORM::for_table('ip_pools')->find_one($args['id']);
        if (!$pool) {
            return jsonResponse($response, ['error' => 'IP Pool not found'], 404);
        }
        return jsonResponse($response, ['data' => $pool]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name']) || empty($body['range_ip'])) {
            return jsonResponse($response, ['error' => 'name and range_ip required'], 400);
        }

        // Admin: auto-assign group_id
        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }

        $pool = \ORM::for_table('ip_pools')->create();
        $pool->name = $body['name'];
        $pool->range_ip = $body['range_ip'];
        $pool->gateway = $body['gateway'] ?? '';
        $pool->dns1 = $body['dns1'] ?? '';
        $pool->dns2 = $body['dns2'] ?? '';
        $pool->router_id = $body['router_id'] ?? null;
        $pool->group_id = $groupId;
        $pool->status = $body['status'] ?? 'active';
        $pool->save();

        return jsonResponse($response, ['data' => $pool], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $pool = \ORM::for_table('ip_pools')->find_one($args['id']);
        if (!$pool) {
            return jsonResponse($response, ['error' => 'IP Pool not found'], 404);
        }

        $body = $request->getParsedBody();
        if (isset($body['name'])) $pool->name = $body['name'];
        if (isset($body['range_ip'])) $pool->range_ip = $body['range_ip'];
        if (isset($body['gateway'])) $pool->gateway = $body['gateway'];
        if (isset($body['dns1'])) $pool->dns1 = $body['dns1'];
        if (isset($body['dns2'])) $pool->dns2 = $body['dns2'];
        if (isset($body['router_id'])) $pool->router_id = $body['router_id'];
        if (isset($body['group_id'])) $pool->group_id = $body['group_id'];
        if (isset($body['status'])) $pool->status = $body['status'];
        $pool->save();

        return jsonResponse($response, ['data' => $pool]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $pool = \ORM::for_table('ip_pools')->find_one($args['id']);
        if (!$pool) {
            return jsonResponse($response, ['error' => 'IP Pool not found'], 404);
        }
        $pool->delete();
        return jsonResponse($response, ['message' => 'IP Pool deleted']);
    }
}
