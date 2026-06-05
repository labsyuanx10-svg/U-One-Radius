<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RadacctController
{
    /**
     * Online users: acctstoptime IS NULL
     */
    public function online(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $groupFilter = $this->getGroupFilter($user);

        $query = \ORM::for_table('radacct')
            ->table_alias('r')
            ->select('r.*')
            ->select('u.fullname', 'customer_name')
            ->select('u.uid', 'customer_uid')
            ->select('u.phone', 'customer_phone')
            ->select('p.name', 'plan_name')
            ->left_outer_join('users', ['r.username', '=', 'u.username_radius'], 'u')
            ->left_outer_join('subscriptions', ['u.id', '=', 's.user_id'], 's')
            ->left_outer_join('plans', ['s.plan_id', '=', 'p.id'], 'p')
            ->where_null('r.acctstoptime');

        if ($groupFilter) {
            $query = $query->where('u.group_id', $groupFilter);
        }

        $params = $request->getQueryParams();
        if (!empty($params['search'])) {
            $s = $params['search'];
            $query = $query->where_raw(
                '(r.username LIKE ? OR u.fullname LIKE ? OR u.uid LIKE ?)',
                ["%$s%", "%$s%", "%$s%"]
            );
        }

        $sessions = $query->order_by_desc('r.acctstarttime')->find_many();

        $result = [];
        foreach ($sessions as $s) {
            $result[] = [
                'radacctid' => (int)$s->radacctid,
                'username' => $s->username,
                'customer_name' => $s->customer_name,
                'customer_uid' => $s->customer_uid,
                'customer_phone' => $s->customer_phone,
                'plan_name' => $s->plan_name,
                'framedipaddress' => $s->framedipaddress,
                'callingstationid' => $s->callingstationid,
                'nasipaddress' => $s->nasipaddress,
                'nasportid' => $s->nasportid,
                'acctstarttime' => $s->acctstarttime,
                'acctsessiontime' => (int)$s->acctsessiontime,
                'acctinputoctets' => (string)$s->acctinputoctets,
                'acctoutputoctets' => (string)$s->acctoutputoctets,
                'connectinfo_start' => $s->connectinfo_start,
            ];
        }

        // Pagination
        $total = count($result);
        $perPage = (int)($params['per_page'] ?? $total ?: 50);
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

    /**
     * RADIUS log history (session start/stop)
     */
    public function log(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $groupFilter = $this->getGroupFilter($user);

        $query = \ORM::for_table('radacct')
            ->table_alias('r')
            ->select('r.*')
            ->select('u.fullname', 'customer_name')
            ->select('u.uid', 'customer_uid')
            ->left_outer_join('users', ['r.username', '=', 'u.username_radius'], 'u')
            ->left_outer_join('subscriptions', ['u.id', '=', 's.user_id'], 's');

        if ($groupFilter) {
            $query = $query->where('u.group_id', $groupFilter);
        }

        $params = $request->getQueryParams();

        if (!empty($params['search'])) {
            $s = $params['search'];
            $query = $query->where_raw(
                '(r.username LIKE ? OR u.fullname LIKE ? OR u.uid LIKE ?)',
                ["%$s%", "%$s%", "%$s%"]
            );
        }

        // acctterminatecause filter: 'connect' is start, others are disconnect reasons
        if (!empty($params['type']) && $params['type'] === 'connect') {
            $query = $query->where_raw('r.acctterminatecause = "" OR r.acctterminatecause IS NULL');
        } elseif (!empty($params['type']) && $params['type'] === 'disconnect') {
            $query = $query->where_not_equal('r.acctterminatecause', '');
            $query = $query->where_not_null('r.acctterminatecause');
        }

        $sessions = $query->order_by_desc('r.radacctid')->limit(500)->find_many();

        $result = [];
        foreach ($sessions as $s) {
            $isStart = empty($s->acctterminatecause);
            $result[] = [
                'radacctid' => (int)$s->radacctid,
                'username' => $s->username,
                'customer_name' => $s->customer_name,
                'customer_uid' => $s->customer_uid,
                'action' => $isStart ? 'connect' : ($s->acctterminatecause ?? 'disconnect'),
                'acctterminatecause' => $s->acctterminatecause,
                'framedipaddress' => $s->framedipaddress,
                'callingstationid' => $s->callingstationid,
                'nasipaddress' => $s->nasipaddress,
                'acctstarttime' => $s->acctstarttime,
                'acctstoptime' => $s->acctstoptime,
                'acctsessiontime' => (int)$s->acctsessiontime,
                'acctinputoctets' => (string)$s->acctinputoctets,
                'acctoutputoctets' => (string)$s->acctoutputoctets,
                'connectinfo_start' => $s->connectinfo_start,
            ];
        }

        $total = count($result);
        $perPage = (int)($params['per_page'] ?? $total ?: 50);
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

    private function getGroupFilter($user)
    {
        if (!in_array($user->role, ['superadmin'])) {
            return $user->group_id;
        }
        return null;
    }
}
