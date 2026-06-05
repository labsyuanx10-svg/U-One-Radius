<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UserController
{
    private function getUserGroupFilter($user)
    {
        // superadmin: no filter
        // admin/auditor: only their group
        if (!in_array($user->role, ['superadmin'])) {
            return $user->group_id;
        }
        return null;
    }

    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $groupFilter = $this->getUserGroupFilter($user);

        $query = \ORM::for_table('users')
            ->table_alias('u')
            ->select('u.*')
            ->select('g.name', 'group_name')
            ->select('p.name', 'plan_name')
            ->select('s.expired_at', 'expired_at')
            ->select('s.status', 'sub_status')
            ->left_outer_join('groups', ['u.group_id', '=', 'g.id'], 'g')
            ->left_outer_join('subscriptions', ['u.id', '=', 's.user_id'], 's')
            ->left_outer_join('plans', ['s.plan_id', '=', 'p.id'], 'p')
            ->where('u.role', 'customer');

        if ($groupFilter) {
            $query = $query->where('u.group_id', $groupFilter);
        }

        // Optional filters
        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('u.status', $params['status']);
        }
        if (!empty($params['group_id'])) {
            $query = $query->where('u.group_id', $params['group_id']);
        }
        if (!empty($params['search'])) {
            $query = $query->where_raw(
                '(u.username LIKE ? OR u.fullname LIKE ? OR u.phone LIKE ? OR u.uid LIKE ?)',
                ["%{$params['search']}%", "%{$params['search']}%", "%{$params['search']}%", "%{$params['search']}%"]
            );
        }

        $query = $query->order_by_desc('u.id');
        $users = $query->find_many();

        $result = [];
        foreach ($users as $u) {
            $item = $this->sanitize($u);
            $item['group_name'] = $u->group_name;
            $item['plan_name'] = $u->plan_name;
            $item['expired_at'] = $u->expired_at;
            $result[] = $item;
        }

        // Pagination
        $total = count($result);
        $perPage = (int)($params['per_page'] ?? $total);
        $page = (int)($params['page'] ?? 1);
        $offset = ($page - 1) * $perPage;
        $paginated = array_slice($result, $offset, $perPage);

        return jsonResponse($response, [
            'data' => $paginated,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $groupFilter = $this->getUserGroupFilter($user);
        if ($groupFilter && $target->group_id != $groupFilter) {
            return jsonResponse($response, ['error' => 'Forbidden'], 403);
        }

        return jsonResponse($response, ['data' => $this->sanitize($target)]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        $required = ['fullname'];
        $errors = [];

        if (empty($body['fullname'])) {
            $errors[] = 'Nama lengkap harus diisi';
        }

        if (!empty($errors)) {
            return jsonResponse($response, ['error' => implode(', ', $errors)], 400);
        }

        // Check unique username
        $exists = \ORM::for_table('users')->where('username', $body['username'])->find_one();
        if ($exists) {
            return jsonResponse($response, ['error' => 'Username already exists'], 400);
        }

        // Auto-generate UID
        $prefix = $this->getSetting('uid_prefix', 'C');
        $digits = (int)$this->getSetting('uid_digits', '4');

        $maxUid = \ORM::for_table('users')
            ->where_like('uid', $prefix . '%')
            ->order_by_desc('uid')
            ->find_one();

        $lastNum = 0;
        if ($maxUid) {
            $lastNum = (int)substr($maxUid->uid, strlen($prefix));
        }
        $newNum = $lastNum + 1;
        $uid = $prefix . str_pad((string)$newNum, $digits, '0', STR_PAD_LEFT);

        // Check collision
        $uidCheck = \ORM::for_table('users')->where('uid', $uid)->find_one();
        while ($uidCheck) {
            $newNum++;
            $uid = $prefix . str_pad((string)$newNum, $digits, '0', STR_PAD_LEFT);
            $uidCheck = \ORM::for_table('users')->where('uid', $uid)->find_one();
        }

        $newUser = \ORM::for_table('users')->create();
        $newUser->uid = $uid;
        // Customer doesn't need web login - use placeholder
        $newUser->username = $uid;
        $newUser->password = '';
        $newUser->fullname = $body['fullname'];
        $newUser->email = $body['email'] ?? '';
        $newUser->nik = $body['nik'] ?? '';
        $newUser->phone = $body['phone'] ?? '';
        $newUser->address = $body['address'] ?? '';
        $newUser->village = $body['village'] ?? '';
        $newUser->district = $body['district'] ?? '';
        $newUser->city = $body['city'] ?? '';
        $newUser->coordinates = $body['coordinates'] ?? '';
        $newUser->device_merk = $body['device_merk'] ?? '';
        $newUser->device_serial = $body['device_serial'] ?? '';
        $newUser->role = 'customer';
        $newUser->group_id = $body['group_id'] ?? ($user->group_id ?? null);
        $newUser->status = $body['status'] ?? 'active';
        $newUser->notes = $body['notes'] ?? '';
        $newUser->created_by = $user->id;
        $newUser->save();

        // If plan_id provided, create subscription
        if (!empty($body['plan_id'])) {
            // Validate PPPoE credentials
            $subErrors = [];
            if (empty($body['username_radius'])) $subErrors[] = 'Username PPPoE harus diisi';
            if (empty($body['password_radius'])) $subErrors[] = 'Password PPPoE harus diisi';
            if (!empty($subErrors)) {
                return jsonResponse($response, ['error' => implode(', ', $subErrors)], 400);
            }

            $plan = \ORM::for_table('plans')->find_one($body['plan_id']);
            if ($plan) {
                $this->createSubscription($newUser, $plan, $body, $user->id);
            }
        }

        // Log
        $this->logAction($user->id, 'create_user', 'Created user ' . $newUser->username);

        return jsonResponse($response, ['data' => $this->sanitize($newUser)], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $groupFilter = $this->getUserGroupFilter($user);
        if ($groupFilter && $target->group_id != $groupFilter) {
            return jsonResponse($response, ['error' => 'Forbidden'], 403);
        }

        $body = $request->getParsedBody();

        if (isset($body['username'])) {
            $exists = \ORM::for_table('users')
                ->where('username', $body['username'])
                ->where_not_equal('id', $args['id'])
                ->find_one();
            if ($exists) {
                return jsonResponse($response, ['error' => 'Username already exists'], 400);
            }
            $target->username = $body['username'];
        }
        if (!empty($body['password'])) {
            $target->password = password_hash($body['password'], PASSWORD_BCRYPT);
        }
        if (isset($body['fullname'])) $target->fullname = $body['fullname'];
        if (isset($body['email'])) $target->email = $body['email'];
        if (isset($body['nik'])) $target->nik = $body['nik'];
        if (isset($body['phone'])) $target->phone = $body['phone'];
        if (isset($body['address'])) $target->address = $body['address'];
        if (isset($body['village'])) $target->village = $body['village'];
        if (isset($body['district'])) $target->district = $body['district'];
        if (isset($body['city'])) $target->city = $body['city'];
        if (isset($body['coordinates'])) $target->coordinates = $body['coordinates'];
        if (isset($body['device_merk'])) $target->device_merk = $body['device_merk'];
        if (isset($body['device_serial'])) $target->device_serial = $body['device_serial'];
        if (isset($body['status'])) $target->status = $body['status'];
        if (isset($body['notes'])) $target->notes = $body['notes'];
        $target->save();

        $this->logAction($user->id, 'update_user', 'Updated user ' . $target->username);

        return jsonResponse($response, ['data' => $this->sanitize($target)]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $groupFilter = $this->getUserGroupFilter($user);
        if ($groupFilter && $target->group_id != $groupFilter) {
            return jsonResponse($response, ['error' => 'Forbidden'], 403);
        }

        // Cleanup radcheck/radreply
        $subs = \ORM::for_table('subscriptions')->where('user_id', $target->id)->find_many();
        foreach ($subs as $sub) {
            \ORM::for_table('radcheck')->where('username', $sub->username_radius)->delete_many();
            \ORM::for_table('radreply')->where('username', $sub->username_radius)->delete_many();
            $sub->delete();
        }

        $username = $target->username;
        $target->delete();

        $this->logAction($user->id, 'delete_user', 'Deleted user ' . $username);

        return jsonResponse($response, ['message' => 'User deleted']);
    }

    public function transactions(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $trxs = \ORM::for_table('transactions')
            ->where('user_id', $target->id)
            ->order_by_desc('id')
            ->find_many();

        return jsonResponse($response, ['data' => $trxs]);
    }

    public function tickets(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $tickets = \ORM::for_table('tickets')
            ->where('user_id', $target->id)
            ->order_by_desc('id')
            ->find_many();

        return jsonResponse($response, ['data' => $tickets]);
    }

    public function subscriptions(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $target = \ORM::for_table('users')->find_one($args['id']);

        if (!$target) {
            return jsonResponse($response, ['error' => 'User not found'], 404);
        }

        $subs = \ORM::for_table('subscriptions')
            ->where('user_id', $target->id)
            ->order_by_desc('id')
            ->find_many();

        return jsonResponse($response, ['data' => $subs]);
    }

    // ── Helpers ──

    private function sanitize($u)
    {
        return [
            'id' => (int)$u->id,
            'uid' => $u->uid,
            'username' => $u->username,
            'fullname' => $u->fullname,
            'name' => $u->fullname,
            'email' => $u->email,
            'nik' => $u->nik,
            'phone' => $u->phone,
            'address' => $u->address,
            'village' => $u->village,
            'district' => $u->district,
            'city' => $u->city,
            'coordinates' => $u->coordinates,
            'device_merk' => $u->device_merk,
            'device_serial' => $u->device_serial,
            'role' => $u->role,
            'group_id' => $u->group_id ? (int)$u->group_id : null,
            'status' => $u->status,
            'notes' => $u->notes,
            'created_by' => $u->created_by ? (int)$u->created_by : null,
            'last_login' => $u->last_login,
            'created_at' => $u->created_at,
            'updated_at' => $u->updated_at,
        ];
    }

    private function getSetting($key, $default = '')
    {
        $s = \ORM::for_table('settings')->where('key', $key)->find_one();
        return $s ? $s->value : $default;
    }

    private function createSubscription($newUser, $plan, $body, $createdBy)
    {
        $usernameRadius = $body['username_radius'];
        $passwordRadius = $body['password_radius'];
        $durationDays = (int)($body['duration_days'] ?? 30);
        $billingDate = $body['billing_date'] ?? null;
        $routerId = $body['router_id'] ?? null;

        // Find any router if not specified
        if (!$routerId) {
            $router = \ORM::for_table('routers')
                ->where('status', 'active')
                ->where('group_id', $newUser->group_id)
                ->find_one();
            if ($router) {
                $routerId = $router->id;
            } else {
                $router = \ORM::for_table('routers')->where('status', 'active')->find_one();
                if ($router) {
                    $routerId = $router->id;
                }
            }
        }

        if (!$routerId) {
            return; // can't create sub without router
        }

        $startDate = !empty($body['started_at']) ? $body['started_at'] : date('Y-m-d H:i:s');
        $expDate = date('Y-m-d H:i:s', strtotime($startDate . ' + ' . $durationDays . ' days'));

        $sub = \ORM::for_table('subscriptions')->create();
        $sub->user_id = $newUser->id;
        $sub->plan_id = $plan->id;
        $sub->router_id = $routerId;
        $sub->ip_address = $body['ip_address'] ?? '';
        $sub->username_radius = $usernameRadius;
        $sub->password_radius = $passwordRadius;
        $sub->started_at = $startDate;
        $sub->expired_at = $expDate;
        $sub->billing_date = $billingDate;
        $sub->status = 'active';
        $sub->created_by = $createdBy;
        $sub->save();

        // Sync to radcheck
        $rc = \ORM::for_table('radcheck')->create();
        $rc->username = $usernameRadius;
        $rc->attribute = 'Cleartext-Password';
        $rc->op = ':=';
        $rc->value = $passwordRadius;
        $rc->save();

        // Sync to radreply
        $rr = \ORM::for_table('radreply')->create();
        $rr->username = $usernameRadius;
        $rr->attribute = 'Mikrotik-Rate-Limit';
        $rr->op = ':=';
        $bwDown = $plan->bandwidth_download;
        $bwUp = $plan->bandwidth_upload;
        $rr->value = $bwDown . 'k/' . $bwUp . 'k';
        $rr->save();

        // Create transaction
        $invoiceNo = $this->generateInvoiceNo();
        $trx = \ORM::for_table('transactions')->create();
        $trx->invoice_no = $invoiceNo;
        $trx->user_id = $newUser->id;
        $trx->subscription_id = $sub->id;
        $trx->amount = $plan->price;
        $trx->bill_type = 'subscription';
        $trx->status = 'unpaid';
        $trx->due_date = date('Y-m-d', strtotime($expDate));
        $trx->period_start = date('Y-m-d');
        $trx->period_end = date('Y-m-d', strtotime($expDate));
        $trx->save();
    }

    private function generatePassword($length = 8)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, $length);
    }

    private function generateInvoiceNo()
    {
        $date = date('Ymd');
        $last = \ORM::for_table('transactions')
            ->where_like('invoice_no', 'INV-' . $date . '-%')
            ->order_by_desc('id')
            ->find_one();

        $num = 1;
        if ($last) {
            $parts = explode('-', $last->invoice_no);
            $num = (int)end($parts) + 1;
        }
        return 'INV-' . $date . '-' . str_pad((string)$num, 4, '0', STR_PAD_LEFT);
    }

    private function logAction($userId, $action, $description)
    {
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $userId;
        $log->action = $action;
        $log->description = $description;
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();
    }
}
