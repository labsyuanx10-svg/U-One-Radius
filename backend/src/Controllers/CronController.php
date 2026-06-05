<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CronController
{
    public function isolir(Request $request, Response $response, $args)
    {
        $autoIsolir = $this->getSetting('auto_isolir', '1');
        if ($autoIsolir !== '1') {
            return jsonResponse($response, ['message' => 'Auto isolir disabled', 'processed' => 0]);
        }

        $isolirMethod = $this->getSetting('isolir_method', 'disable');
        $isolirPlanId = $this->getSetting('isolir_plan_id', '');
        $now = date('Y-m-d H:i:s');

        // Find expired active subscriptions
        $expiredSubs = \ORM::for_table('subscriptions')
            ->where('status', 'active')
            ->where_lte('expired_at', $now)
            ->find_many();

        $count = 0;

        foreach ($expiredSubs as $sub) {
            $count++;

            // Update subscription status
            $sub->status = 'expired';
            $sub->save();

            // Update user status
            $user = \ORM::for_table('users')->find_one($sub->user_id);
            if ($user) {
                $user->status = 'expired';
                $user->save();
            }

            if ($isolirMethod === 'disable') {
                // Delete radcheck/radreply entries → user can't login
                \ORM::for_table('radcheck')->where('username', $sub->username_radius)->delete_many();
                \ORM::for_table('radreply')->where('username', $sub->username_radius)->delete_many();
            } elseif ($isolirMethod === 'move_package' && !empty($isolirPlanId)) {
                // Update radreply to isolir plan's bandwidth
                $isolirPlan = \ORM::for_table('plans')->find_one($isolirPlanId);
                if ($isolirPlan) {
                    // Delete existing radreply for rate limit
                    \ORM::for_table('radreply')
                        ->where('username', $sub->username_radius)
                        ->where('attribute', 'Mikrotik-Rate-Limit')
                        ->delete_many();

                    $rr = \ORM::for_table('radreply')->create();
                    $rr->username = $sub->username_radius;
                    $rr->attribute = 'Mikrotik-Rate-Limit';
                    $rr->op = ':=';
                    $rr->value = $isolirPlan->bandwidth_download . 'k/' . $isolirPlan->bandwidth_upload . 'k';
                    $rr->save();
                }
            }

            // Log to notifications
            $this->addNotification($sub->user_id, 'Akun Anda telah diisolir karena masa aktif berakhir.');
        }

        return jsonResponse($response, [
            'message' => 'Isolir processed',
            'processed' => $count,
            'method' => $isolirMethod,
        ]);
    }

    private function getSetting($key, $default = '')
    {
        $s = \ORM::for_table('settings')->where('key', $key)->find_one();
        return $s ? $s->value : $default;
    }

    private function addNotification($userId, $message)
    {
        // Logs table used as simple notification store
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $userId;
        $log->action = 'isolir_notification';
        $log->description = $message;
        $log->ip_address = '';
        $log->save();
    }
}
