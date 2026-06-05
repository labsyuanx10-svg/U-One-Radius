<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class SubscriptionController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('subscriptions')
            ->select('subscriptions.*')
            ->select('users.fullname', 'user_name')
            ->select('plans.name', 'plan_name')
            ->select('routers.name', 'router_name')
            ->join('users', ['subscriptions.user_id', '=', 'users.id'])
            ->join('plans', ['subscriptions.plan_id', '=', 'plans.id'])
            ->join('routers', ['subscriptions.router_id', '=', 'routers.id']);

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('users.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('subscriptions.status', $params['status']);
        }
        if (!empty($params['user_id'])) {
            $query = $query->where('subscriptions.user_id', $params['user_id']);
        }

        $subs = $query->order_by_desc('subscriptions.id')->find_many();
        $result = [];
        foreach ($subs as $s) {
            $result[] = [
                'id' => (int)$s->id,
                'user_id' => (int)$s->user_id,
                'plan_id' => (int)$s->plan_id,
                'router_id' => (int)$s->router_id,
                'ip_address' => $s->ip_address,
                'username_radius' => $s->username_radius,
                'password_radius' => $s->password_radius,
                'started_at' => $s->started_at,
                'expired_at' => $s->expired_at,
                'status' => $s->status,
                'created_by' => $s->created_by ? (int)$s->created_by : null,
                'created_at' => $s->created_at,
                'updated_at' => $s->updated_at,
                'user_name' => $s->user_name,
                'plan_name' => $s->plan_name,
                'router_name' => $s->router_name,
            ];
        }

        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $sub = \ORM::for_table('subscriptions')
            ->select('subscriptions.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->select('plans.name', 'plan_name')
            ->select('plans.bandwidth_download', 'bw_down')
            ->select('plans.bandwidth_upload', 'bw_up')
            ->select('routers.name', 'router_name')
            ->select('routers.ip_address', 'router_ip')
            ->join('users', ['subscriptions.user_id', '=', 'users.id'])
            ->join('plans', ['subscriptions.plan_id', '=', 'plans.id'])
            ->join('routers', ['subscriptions.router_id', '=', 'routers.id'])
            ->find_one($args['id']);

        if (!$sub) {
            return jsonResponse($response, ['error' => 'Subscription not found'], 404);
        }

        return jsonResponse($response, ['data' => $sub]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['user_id']) || empty($body['plan_id']) || empty($body['router_id'])) {
            return jsonResponse($response, ['error' => 'user_id, plan_id, router_id required'], 400);
        }

        if (empty($body['username_radius']) || empty($body['password_radius'])) {
            return jsonResponse($response, ['error' => 'username_radius and password_radius required'], 400);
        }

        $customer = \ORM::for_table('users')->find_one($body['user_id']);
        if (!$customer) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $plan = \ORM::for_table('plans')->find_one($body['plan_id']);
        if (!$plan) {
            return jsonResponse($response, ['error' => 'Plan not found'], 404);
        }

        $router = \ORM::for_table('routers')->find_one($body['router_id']);
        if (!$router) {
            return jsonResponse($response, ['error' => 'Router not found'], 404);
        }

        $usernameRadius = $body['username_radius'];
        $passwordRadius = $body['password_radius'];
        $durationDays = (int)($body['duration_days'] ?? 30);
        $billingDate = $body['billing_date'] ?? null;
        $startDate = !empty($body['started_at']) ? $body['started_at'] : date('Y-m-d H:i:s');
        $expDate = date('Y-m-d H:i:s', strtotime($startDate . ' + ' . $durationDays . ' days'));

        $sub = \ORM::for_table('subscriptions')->create();
        $sub->user_id = $customer->id;
        $sub->plan_id = $plan->id;
        $sub->router_id = $router->id;
        $sub->ip_address = $body['ip_address'] ?? '';
        $sub->username_radius = $usernameRadius;
        $sub->password_radius = $passwordRadius;
        $sub->started_at = $startDate;
        $sub->expired_at = $expDate;
        $sub->billing_date = $billingDate;
        $sub->status = 'active';
        $sub->created_by = $user->id;
        $sub->save();

        // Sync radcheck
        $rc = \ORM::for_table('radcheck')->create();
        $rc->username = $usernameRadius;
        $rc->attribute = 'Cleartext-Password';
        $rc->op = ':=';
        $rc->value = $passwordRadius;
        $rc->save();

        // Sync radreply
        $rr = \ORM::for_table('radreply')->create();
        $rr->username = $usernameRadius;
        $rr->attribute = 'Mikrotik-Rate-Limit';
        $rr->op = ':=';
        $bwDown = $plan->bandwidth_download;
        $bwUp = $plan->bandwidth_upload;
        $rr->value = $bwDown . 'k/' . $bwUp . 'k';
        $rr->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'create_subscription';
        $log->description = 'Created subscription for ' . $customer->username . ' - ' . $plan->name;
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $sub], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $sub = \ORM::for_table('subscriptions')->find_one($args['id']);

        if (!$sub) {
            return jsonResponse($response, ['error' => 'Subscription not found'], 404);
        }

        $body = $request->getParsedBody();
        $oldUsername = $sub->username_radius;

        if (isset($body['plan_id'])) {
            $plan = \ORM::for_table('plans')->find_one($body['plan_id']);
            if (!$plan) {
                return jsonResponse($response, ['error' => 'Plan not found'], 404);
            }
            $sub->plan_id = $body['plan_id'];

            // Update radreply bandwidth
            \ORM::for_table('radreply')
                ->where('username', $oldUsername)
                ->where('attribute', 'Mikrotik-Rate-Limit')
                ->delete_many();

            $rr = \ORM::for_table('radreply')->create();
            $rr->username = $sub->username_radius;
            $rr->attribute = 'Mikrotik-Rate-Limit';
            $rr->op = ':=';
            $rr->value = $plan->bandwidth_download . 'k/' . $plan->bandwidth_upload . 'k';
            $rr->save();
        }

        if (isset($body['router_id'])) $sub->router_id = $body['router_id'];
        if (isset($body['ip_address'])) $sub->ip_address = $body['ip_address'];
        if (isset($body['username_radius'])) {
            // Update radcheck/radreply username
            $newUsername = $body['username_radius'];
            \ORM::for_table('radcheck')->where('username', $oldUsername)->update_many(['username' => $newUsername]);
            \ORM::for_table('radreply')->where('username', $oldUsername)->update_many(['username' => $newUsername]);
            $sub->username_radius = $newUsername;
        }
        if (isset($body['password_radius'])) {
            $sub->password_radius = $body['password_radius'];
            // Update radcheck password
            \ORM::for_table('radcheck')
                ->where('username', $sub->username_radius)
                ->where('attribute', 'Cleartext-Password')
                ->update_many(['value' => $body['password_radius']]);
        }
        if (isset($body['expired_at'])) $sub->expired_at = $body['expired_at'];
        if (isset($body['status'])) $sub->status = $body['status'];
        if (isset($body['started_at'])) $sub->started_at = $body['started_at'];
        $sub->save();

        return jsonResponse($response, ['data' => $sub]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $sub = \ORM::for_table('subscriptions')->find_one($args['id']);

        if (!$sub) {
            return jsonResponse($response, ['error' => 'Subscription not found'], 404);
        }

        // Cleanup radcheck/radreply
        \ORM::for_table('radcheck')->where('username', $sub->username_radius)->delete_many();
        \ORM::for_table('radreply')->where('username', $sub->username_radius)->delete_many();

        $sub->delete();

        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'delete_subscription';
        $log->description = 'Deleted subscription #' . $args['id'];
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['message' => 'Subscription deleted']);
    }

    private function generatePassword($length = 8)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, $length);
    }
}
