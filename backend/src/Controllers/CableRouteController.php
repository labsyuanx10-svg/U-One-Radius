<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CableRouteController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('cable_routes')
            ->select('cable_routes.*')
            ->select('odc.name', 'odc_name')
            ->select('odc.code', 'odc_code')
            ->select('odp.name', 'odp_name')
            ->select('odp.code', 'odp_code')
            ->left_outer_join('odc', ['cable_routes.odc_id', '=', 'odc.id'])
            ->left_outer_join('odp', ['cable_routes.odp_id', '=', 'odp.id']);

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('cable_routes.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['group_id'])) {
            $query = $query->where('cable_routes.group_id', $params['group_id']);
        }
        if (!empty($params['type'])) {
            $query = $query->where('cable_routes.type', $params['type']);
        }
        if (!empty($params['odc_id'])) {
            $query = $query->where('cable_routes.odc_id', (int)$params['odc_id']);
        }
        if (!empty($params['odp_id'])) {
            $query = $query->where('cable_routes.odp_id', (int)$params['odp_id']);
        }
        if (!empty($params['search'])) {
            $s = $params['search'];
            $query = $query->where_like('cable_routes.name', "%$s%");
        }

        $page = max(1, (int)($params['page'] ?? 1));
        $limit = max(1, min(100, (int)($params['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $total = $query->count();
        $items = $query->order_by_desc('cable_routes.id')->offset($offset)->limit($limit)->find_many();

        $result = array_map(function($r) { return $r->as_array(); }, $items);
        return jsonResponse($response, ['data' => $result, 'total' => (int)$total, 'page' => $page, 'limit' => $limit]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $route = \ORM::for_table('cable_routes')
            ->select('cable_routes.*')
            ->select('odc.name', 'odc_name')
            ->select('odc.code', 'odc_code')
            ->select('odp.name', 'odp_name')
            ->select('odp.code', 'odp_code')
            ->left_outer_join('odc', ['cable_routes.odc_id', '=', 'odc.id'])
            ->left_outer_join('odp', ['cable_routes.odp_id', '=', 'odp.id'])
            ->find_one($args['id']);

        if (!$route) {
            return jsonResponse($response, ['error' => 'Cable route not found'], 404);
        }
        return jsonResponse($response, ['data' => $route]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name'])) {
            return jsonResponse($response, ['error' => 'name required'], 400);
        }

        $coordinates = $body['coordinates'] ?? '[]';
        if (is_array($coordinates)) {
            $coordinates = json_encode($coordinates);
        }

        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }

        $route = \ORM::for_table('cable_routes')->create();
        $route->name = $body['name'];
        $route->type = $body['type'] ?? 'distribution';
        $route->odc_id = !empty($body['odc_id']) ? (int)$body['odc_id'] : null;
        $route->odp_id = !empty($body['odp_id']) ? (int)$body['odp_id'] : null;
        $route->coordinates = $coordinates;
        $route->distance_km = $body['distance_km'] ?? 0;
        $route->notes = $body['notes'] ?? '';
        $route->group_id = $groupId;
        $route->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'cable_route_create';
        $log->description = "Buat cable route {$route->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $route], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $route = \ORM::for_table('cable_routes')->find_one($args['id']);

        if (!$route) {
            return jsonResponse($response, ['error' => 'Cable route not found'], 404);
        }

        $body = $request->getParsedBody();

        if (isset($body['name'])) $route->name = $body['name'];
        if (isset($body['type'])) $route->type = $body['type'];
        if (isset($body['odc_id'])) $route->odc_id = !empty($body['odc_id']) ? (int)$body['odc_id'] : null;
        if (isset($body['odp_id'])) $route->odp_id = !empty($body['odp_id']) ? (int)$body['odp_id'] : null;
        if (isset($body['coordinates'])) {
            $coordinates = $body['coordinates'];
            if (is_array($coordinates)) {
                $coordinates = json_encode($coordinates);
            }
            $route->coordinates = $coordinates;
        }
        if (isset($body['distance_km'])) $route->distance_km = (float)$body['distance_km'];
        if (isset($body['notes'])) $route->notes = $body['notes'];
        $route->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'cable_route_update';
        $log->description = "Update cable route {$route->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $route]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        if (!in_array($user->role, ['superadmin'])) {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        $route = \ORM::for_table('cable_routes')->find_one($args['id']);
        if (!$route) {
            return jsonResponse($response, ['error' => 'Cable route not found'], 404);
        }

        $name = $route->name;
        $route->delete();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'cable_route_delete';
        $log->description = "Hapus cable route {$name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['message' => 'Cable route deleted']);
    }
}
