<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RouterController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('routers');

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('status', $params['status']);
        }
        if (!empty($params['group_id'])) {
            $query = $query->where('group_id', $params['group_id']);
        }

        $routers = $query->order_by_desc('id')->find_many();
        $result = array_map(function($r) { return $r->as_array(); }, $routers);
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $router = \ORM::for_table('routers')->find_one($args['id']);
        if (!$router) {
            return jsonResponse($response, ['error' => 'Router not found'], 404);
        }
        return jsonResponse($response, ['data' => $router]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name']) || empty($body['ip_address']) || empty($body['secret'])) {
            return jsonResponse($response, ['error' => 'name, ip_address, secret required'], 400);
        }

        // Admin: auto-assign group_id
        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }
        if (empty($groupId)) {
            return jsonResponse($response, ['error' => 'group_id required'], 400);
        }

        $router = \ORM::for_table('routers')->create();
        $router->name = $body['name'];
        $router->ip_address = $body['ip_address'];
        $router->secret = $body['secret'];
        $router->type = $body['type'] ?? 'pppoe';
        $router->group_id = $groupId;
        $router->description = $body['description'] ?? '';
        $router->status = $body['status'] ?? 'active';
        $router->save();

        return jsonResponse($response, ['data' => $router], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $router = \ORM::for_table('routers')->find_one($args['id']);
        if (!$router) {
            return jsonResponse($response, ['error' => 'Router not found'], 404);
        }

        $body = $request->getParsedBody();
        if (isset($body['name'])) $router->name = $body['name'];
        if (isset($body['ip_address'])) $router->ip_address = $body['ip_address'];
        if (isset($body['secret'])) $router->secret = $body['secret'];
        if (isset($body['type'])) $router->type = $body['type'];
        if (isset($body['group_id'])) $router->group_id = $body['group_id'];
        if (isset($body['description'])) $router->description = $body['description'];
        if (isset($body['status'])) $router->status = $body['status'];
        $router->save();

        return jsonResponse($response, ['data' => $router]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $router = \ORM::for_table('routers')->find_one($args['id']);
        if (!$router) {
            return jsonResponse($response, ['error' => 'Router not found'], 404);
        }
        $router->delete();
        return jsonResponse($response, ['message' => 'Router deleted']);
    }
}
