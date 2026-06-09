<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class OdpController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('odp')
            ->select('odp.*')
            ->select('odc.name', 'odc_name')
            ->select('odc.code', 'odc_code')
            ->left_outer_join('odc', ['odp.odc_id', '=', 'odc.id']);

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('odp.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['group_id'])) {
            $query = $query->where('odp.group_id', $params['group_id']);
        }
        if (!empty($params['odc_id'])) {
            $query = $query->where('odp.odc_id', (int)$params['odc_id']);
        }
        if (!empty($params['search'])) {
            $s = $params['search'];
            $query = $query->where_raw('(odp.name LIKE ? OR odp.code LIKE ?)', ["%$s%", "%$s%"]);
        }
        if (!empty($params['status'])) {
            $query = $query->where('odp.status', $params['status']);
        }

        $page = max(1, (int)($params['page'] ?? 1));
        $limit = max(1, min(100, (int)($params['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $total = $query->count();
        $items = $query->order_by_desc('odp.id')->offset($offset)->limit($limit)->find_many();

        $result = array_map(function($r) { return $r->as_array(); }, $items);
        return jsonResponse($response, ['data' => $result, 'total' => (int)$total, 'page' => $page, 'limit' => $limit]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $odp = \ORM::for_table('odp')
            ->select('odp.*')
            ->select('odc.name', 'odc_name')
            ->select('odc.code', 'odc_code')
            ->left_outer_join('odc', ['odp.odc_id', '=', 'odc.id'])
            ->find_one($args['id']);

        if (!$odp) {
            return jsonResponse($response, ['error' => 'ODP not found'], 404);
        }
        return jsonResponse($response, ['data' => $odp]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['name']) || empty($body['code'])) {
            return jsonResponse($response, ['error' => 'name and code required'], 400);
        }

        $exists = \ORM::for_table('odp')->where('code', $body['code'])->find_one();
        if ($exists) {
            return jsonResponse($response, ['error' => 'Code already exists'], 400);
        }

        $groupId = $body['group_id'] ?? null;
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $groupId = $user->group_id;
        }

        $odp = \ORM::for_table('odp')->create();
        $odp->name = $body['name'];
        $odp->code = $body['code'];
        $odp->address = $body['address'] ?? '';
        $odp->latitude = $body['latitude'] ?? 0;
        $odp->longitude = $body['longitude'] ?? 0;
        $odp->capacity = $body['capacity'] ?? 8;
        $odp->port_used = $body['port_used'] ?? 0;
        $odp->odc_id = !empty($body['odc_id']) ? (int)$body['odc_id'] : null;
        $odp->status = $body['status'] ?? 'active';
        $odp->notes = $body['notes'] ?? '';
        $odp->group_id = $groupId;
        $odp->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odp_create';
        $log->description = "Buat ODP {$odp->code}: {$odp->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $odp], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $odp = \ORM::for_table('odp')->find_one($args['id']);

        if (!$odp) {
            return jsonResponse($response, ['error' => 'ODP not found'], 404);
        }

        $body = $request->getParsedBody();

        if (isset($body['code'])) {
            $exists = \ORM::for_table('odp')
                ->where('code', $body['code'])
                ->where_not_equal('id', $args['id'])
                ->find_one();
            if ($exists) {
                return jsonResponse($response, ['error' => 'Code already exists'], 400);
            }
            $odp->code = $body['code'];
        }

        if (isset($body['name'])) $odp->name = $body['name'];
        if (isset($body['address'])) $odp->address = $body['address'];
        if (isset($body['latitude'])) $odp->latitude = $body['latitude'];
        if (isset($body['longitude'])) $odp->longitude = $body['longitude'];
        if (isset($body['capacity'])) $odp->capacity = (int)$body['capacity'];
        if (isset($body['port_used'])) $odp->port_used = (int)$body['port_used'];
        if (isset($body['odc_id'])) $odp->odc_id = !empty($body['odc_id']) ? (int)$body['odc_id'] : null;
        if (isset($body['status'])) $odp->status = $body['status'];
        if (isset($body['notes'])) $odp->notes = $body['notes'];
        $odp->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odp_update';
        $log->description = "Update ODP {$odp->code}: {$odp->name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $odp]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        if (!in_array($user->role, ['superadmin'])) {
            return jsonResponse($response, ['error' => 'Forbidden: superadmin only'], 403);
        }

        $odp = \ORM::for_table('odp')->find_one($args['id']);
        if (!$odp) {
            return jsonResponse($response, ['error' => 'ODP not found'], 404);
        }

        $code = $odp->code;
        $name = $odp->name;
        $odp->delete();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'odp_delete';
        $log->description = "Hapus ODP {$code}: {$name}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['message' => 'ODP deleted']);
    }
}
