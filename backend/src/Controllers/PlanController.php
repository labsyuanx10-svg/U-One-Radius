<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PlanController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('plans');

        // Filter by group: global (NULL) OR user's group
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

        $plans = $query->order_by_desc('id')->find_many();
        $result = array_map(function($p) { return $p->as_array(); }, $plans);
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $plan = \ORM::for_table('plans')->find_one($args['id']);
        if (!$plan) {
            return jsonResponse($response, ['error' => 'Plan not found'], 404);
        }
        return jsonResponse($response, ['data' => $plan]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name'])) {
            return jsonResponse($response, ['error' => 'name required'], 400);
        }

        // Admin: auto-assign group_id
        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }

        $plan = \ORM::for_table('plans')->create();
        $plan->name = $body['name'];
        $plan->type = $body['type'] ?? 'hotspot';
        $plan->price = $body['price'] ?? 0;
        $plan->bandwidth_download = $body['bandwidth_download'] ?? 0;
        $plan->bandwidth_upload = $body['bandwidth_upload'] ?? 0;
        $plan->burst_download = $body['burst_download'] ?? 0;
        $plan->burst_upload = $body['burst_upload'] ?? 0;
        $plan->burst_time = $body['burst_time'] ?? 0;
        $plan->ip_pool_id = $body['ip_pool_id'] ?? null;
        $plan->shared_users = $body['shared_users'] ?? 1;
        $plan->description = $body['description'] ?? '';
        $plan->group_id = $groupId;
        $plan->status = $body['status'] ?? 'active';
        $plan->save();

        return jsonResponse($response, ['data' => $plan], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $plan = \ORM::for_table('plans')->find_one($args['id']);
        if (!$plan) {
            return jsonResponse($response, ['error' => 'Plan not found'], 404);
        }

        $body = $request->getParsedBody();
        if (isset($body['name'])) $plan->name = $body['name'];
        if (isset($body['type'])) $plan->type = $body['type'];
        if (isset($body['price'])) $plan->price = $body['price'];
        if (isset($body['bandwidth_download'])) $plan->bandwidth_download = $body['bandwidth_download'];
        if (isset($body['bandwidth_upload'])) $plan->bandwidth_upload = $body['bandwidth_upload'];
        if (isset($body['burst_download'])) $plan->burst_download = $body['burst_download'];
        if (isset($body['burst_upload'])) $plan->burst_upload = $body['burst_upload'];
        if (isset($body['burst_time'])) $plan->burst_time = $body['burst_time'];
        if (isset($body['ip_pool_id'])) $plan->ip_pool_id = $body['ip_pool_id'];
        if (isset($body['shared_users'])) $plan->shared_users = $body['shared_users'];
        if (isset($body['description'])) $plan->description = $body['description'];
        if (isset($body['group_id'])) $plan->group_id = $body['group_id'];
        if (isset($body['status'])) $plan->status = $body['status'];
        $plan->save();

        return jsonResponse($response, ['data' => $plan]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $plan = \ORM::for_table('plans')->find_one($args['id']);
        if (!$plan) {
            return jsonResponse($response, ['error' => 'Plan not found'], 404);
        }
        $plan->delete();
        return jsonResponse($response, ['message' => 'Plan deleted']);
    }
}
