<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class OdcController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('odc')
            ->select('odc.*')
            ->select('routers.name', 'router_name')
            ->left_outer_join('routers', ['odc.router_id', '=', 'routers.id']);

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('odc.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['group_id'])) {
            $query = $query->where('odc.group_id', $params['group_id']);
        }
        if (!empty($params['search'])) {
            $s = $params['search'];
            $query = $query->where_raw('(odc.name LIKE ? OR odc.code LIKE ?)', ["%$s%", "%$s%"]);
        }
        if (!empty($params['status'])) {
            $query = $query->where('odc.status', $params['status']);
        }

        $page = max(1, (int)($params['page'] ?? 1));
        $limit = max(1, min(100, (int)($params['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $total = $query->count();
        $items = $query->order_by_desc('odc.id')->offset($offset)->limit($limit)->find_many();

        $result = array_map(function($r) { return $r->as_array(); }, $items);
        return jsonResponse($response, ['data' => $result, 'total' => (int)$total, 'page' => $page, 'limit' => $limit]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $odc = \ORM::for_table('odc')
            ->select('odc.*')
            ->select('routers.name', 'router_name')
            ->left_outer_join('routers', ['odc.router_id', '=', 'routers.id'])
            ->find_one($args['id']);

        if (!$odc) {
            return jsonResponse($response, ['error' => 'ODC not found'], 404);
        }
        return jsonResponse($response, ['data' => $odc]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name']) || empty($body['code'])) {
            return jsonResponse($response, ['error' => 'name and code required'], 400);
        }

        // Check unique code
        $exists = \ORM::for_table('odc')->where('code', $body['code'])->find_one();
        if ($exists) {
            return jsonResponse($response, ['error' => 'Code already exists'], 400);
        }

        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }

        $odc = \ORM::for_table('odc')->create();
        $odc->name = $body['name'];
        $odc->code = $body['code'];
        $odc->address = $body['address'] ?? '';
        $odc->latitude = $body['latitude'] ?? 0;
        $odc->longitude = $body['longitude'] ?? 0;
        $odc->capacity = $body['capacity'] ?? 16;
        $odc->port_used = $body['port_used'] ?? 0;
        $odc->router_id = !empty($body['router_id']) ? (int)$body['router_id'] : null;
        $odc->status = $body['status'] ?? 'active';
        $odc->notes = $body['notes'] ?? '';
        $odc->group_id = $groupId;
        $odc->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odc_create';
        $log->description = "Buat ODC {$odc->code}: {$odc->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $odc], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $odc = \ORM::for_table('odc')->find_one($args['id']);

        if (!$odc) {
            return jsonResponse($response, ['error' => 'ODC not found'], 404);
        }

        $body = $request->getParsedBody();

        if (isset($body['code'])) {
            $exists = \ORM::for_table('odc')
                ->where('code', $body['code'])
                ->where_not_equal('id', $args['id'])
                ->find_one();
            if ($exists) {
                return jsonResponse($response, ['error' => 'Code already exists'], 400);
            }
            $odc->code = $body['code'];
        }

        if (isset($body['name'])) $odc->name = $body['name'];
        if (isset($body['address'])) $odc->address = $body['address'];
        if (isset($body['latitude'])) $odc->latitude = $body['latitude'];
        if (isset($body['longitude'])) $odc->longitude = $body['longitude'];
        if (isset($body['capacity'])) $odc->capacity = (int)$body['capacity'];
        if (isset($body['port_used'])) $odc->port_used = (int)$body['port_used'];
        if (isset($body['router_id'])) $odc->router_id = !empty($body['router_id']) ? (int)$body['router_id'] : null;
        if (isset($body['status'])) $odc->status = $body['status'];
        if (isset($body['notes'])) $odc->notes = $body['notes'];
        $odc->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odc_update';
        $log->description = "Update ODC {$odc->code}: {$odc->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $odc]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        if (!in_array($user->role, ['superadmin'])) {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        $odc = \ORM::for_table('odc')->find_one($args['id']);
        if (!$odc) {
            return jsonResponse($response, ['error' => 'ODC not found'], 404);
        }

        $code = $odc->code;
        $name = $odc->name;
        $odc->delete();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odc_delete';
        $log->description = "Hapus ODC {$code}: {$name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['message' => 'ODC deleted']);
    }
}
