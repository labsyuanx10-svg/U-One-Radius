<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DashboardController
{
    public function stats(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $groupFilter = '';

        $groupCond = '';
        $params = [];
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            $groupCond = 'WHERE group_id = ?';
            $params = [$user->group_id];
        } elseif ($user->role === 'admin' && $user->group_id) {
            $groupCond = 'WHERE group_id = ?';
            $params = [$user->group_id];
        }

        $totalUsers = \ORM::for_table('users')
            ->where('role', 'customer')
            ->where_raw($groupCond ?: '1', $params);
        if ($groupCond) {
            $totalUsers = $totalUsers->where_raw(str_replace('WHERE ', '', $groupCond), $params);
        }
        // simpler approach
        $totalUsers = \ORM::for_table('users')
            ->where('role', 'customer');
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $totalUsers = $totalUsers->where('group_id', $user->group_id);
        }
        $totalUsers = $totalUsers->count();

        $activeSubs = \ORM::for_table('subscriptions')
            ->where('status', 'active');
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $activeSubs = $activeSubs
                ->join('users', ['subscriptions.user_id', '=', 'users.id'])
                ->where('users.group_id', $user->group_id);
        }
        $activeSubs = $activeSubs->count();

        $expiredSubs = \ORM::for_table('subscriptions')
            ->where('status', 'expired');
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $expiredSubs = $expiredSubs
                ->join('users', ['subscriptions.user_id', '=', 'users.id'])
                ->where('users.group_id', $user->group_id);
        }
        $expiredSubs = $expiredSubs->count();

        $totalPlans = \ORM::for_table('plans')->where('status', 'active');
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $totalPlans = $totalPlans
                ->where_raw('(group_id IS NULL OR group_id = ?)', [$user->group_id]);
        }
        $totalPlans = $totalPlans->count();

        $totalRouters = \ORM::for_table('routers');
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $totalRouters = $totalRouters->where('group_id', $user->group_id);
        }
        $totalRouters = $totalRouters->count();

        // Revenue this month
        $monthStart = date('Y-m-01 00:00:00');
        $revenue = \ORM::for_table('transactions')
            ->where('status', 'paid')
            ->where_gte('paid_at', $monthStart);
        if (!in_array($user->role, ['superadmin']) && $user->group_id) {
            $revenue = $revenue
                ->join('users', ['transactions.user_id', '=', 'users.id'])
                ->where('users.group_id', $user->group_id);
        }
        $revenue = $revenue->sum('amount');

        return jsonResponse($response, [
            'total_users' => (int)$totalUsers,
            'active_subs' => (int)$activeSubs,
            'expired_subs' => (int)$expiredSubs,
            'total_plans' => (int)$totalPlans,
            'total_routers' => (int)$totalRouters,
            'revenue_month' => (float)($revenue ?: 0),
        ]);
    }
}
