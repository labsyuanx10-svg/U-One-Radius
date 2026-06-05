<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GroupController
{
    public function list(Request $request, Response $response, $args)
    {
        $groups = \ORM::for_table('groups')->find_many();
        $result = [];
        foreach ($groups as $g) {
            $result[] = [
                'id' => (int)$g->id,
                'code' => $g->code,
                'name' => $g->name,
                'address' => $g->address,
                'phone' => $g->phone,
                'email' => $g->email,
                'status' => $g->status,
                'created_at' => $g->created_at,
                'updated_at' => $g->updated_at,
            ];
        }
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $group = \ORM::for_table('groups')->find_one($args['id']);
        if (!$group) {
            return jsonResponse($response, ['error' => 'Group not found'], 404);
        }
        return jsonResponse($response, ['data' => $group]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $body = $request->getParsedBody();
        if (empty($body['code']) || empty($body['name'])) {
            return jsonResponse($response, ['error' => 'code and name required'], 400);
        }

        $exists = \ORM::for_table('groups')->where('code', $body['code'])->find_one();
        if ($exists) {
            return jsonResponse($response, ['error' => 'Code already exists'], 400);
        }

        $group = \ORM::for_table('groups')->create();
        $group->code = $body['code'];
        $group->name = $body['name'];
        $group->address = $body['address'] ?? '';
        $group->phone = $body['phone'] ?? '';
        $group->email = $body['email'] ?? '';
        $group->status = $body['status'] ?? 'active';
        $group->save();

        return jsonResponse($response, ['data' => $group], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $group = \ORM::for_table('groups')->find_one($args['id']);
        if (!$group) {
            return jsonResponse($response, ['error' => 'Group not found'], 404);
        }

        $body = $request->getParsedBody();
        if (isset($body['code'])) {
            $exists = \ORM::for_table('groups')
                ->where('code', $body['code'])
                ->where_not_equal('id', $args['id'])
                ->find_one();
            if ($exists) {
                return jsonResponse($response, ['error' => 'Code already exists'], 400);
            }
            $group->code = $body['code'];
        }
        if (isset($body['name'])) $group->name = $body['name'];
        if (isset($body['address'])) $group->address = $body['address'];
        if (isset($body['phone'])) $group->phone = $body['phone'];
        if (isset($body['email'])) $group->email = $body['email'];
        if (isset($body['status'])) $group->status = $body['status'];
        $group->save();

        return jsonResponse($response, ['data' => $group]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $group = \ORM::for_table('groups')->find_one($args['id']);
        if (!$group) {
            return jsonResponse($response, ['error' => 'Group not found'], 404);
        }
        $group->delete();
        return jsonResponse($response, ['message' => 'Group deleted']);
    }
}
