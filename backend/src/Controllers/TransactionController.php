<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TransactionController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('transactions')
            ->select('transactions.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->join('users', ['transactions.user_id', '=', 'users.id']);

        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('users.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('transactions.status', $params['status']);
        }
        if (!empty($params['user_id'])) {
            $query = $query->where('transactions.user_id', $params['user_id']);
        }
        if (!empty($params['date_from'])) {
            $query = $query->where_gte('transactions.created_at', $params['date_from'] . ' 00:00:00');
        }
        if (!empty($params['date_to'])) {
            $query = $query->where_lte('transactions.created_at', $params['date_to'] . ' 23:59:59');
        }
        if (!empty($params['group_id'])) {
            $query = $query->where('users.group_id', $params['group_id']);
        }

        $trxs = $query->order_by_desc('transactions.id')->find_many();
        $result = array_map(function($t) { return $t->as_array(); }, $trxs);
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $trx = \ORM::for_table('transactions')
            ->select('transactions.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->join('users', ['transactions.user_id', '=', 'users.id'])
            ->find_one($args['id']);

        if (!$trx) {
            return jsonResponse($response, ['error' => 'Transaction not found'], 404);
        }
        return jsonResponse($response, ['data' => $trx]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['user_id']) || !isset($body['amount'])) {
            return jsonResponse($response, ['error' => 'user_id and amount required'], 400);
        }

        $invoiceNo = $this->generateInvoiceNo();

        $trx = \ORM::for_table('transactions')->create();
        $trx->invoice_no = $invoiceNo;
        $trx->user_id = $body['user_id'];
        $trx->subscription_id = $body['subscription_id'] ?? null;
        $trx->amount = $body['amount'];
        $trx->bill_type = $body['bill_type'] ?? 'subscription';
        $trx->status = 'unpaid';
        $trx->payment_method = $body['payment_method'] ?? 'manual';
        $trx->payment_note = $body['payment_note'] ?? '';
        $trx->due_date = $body['due_date'] ?? date('Y-m-d', strtotime('+30 days'));
        $trx->period_start = $body['period_start'] ?? date('Y-m-d');
        $trx->period_end = $body['period_end'] ?? date('Y-m-d', strtotime('+30 days'));
        $trx->save();

        return jsonResponse($response, ['data' => $trx], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $trx = \ORM::for_table('transactions')->find_one($args['id']);

        if (!$trx) {
            return jsonResponse($response, ['error' => 'Transaction not found'], 404);
        }

        $body = $request->getParsedBody();

        // If marking as paid, auto-extend subscription
        if (isset($body['status']) && $body['status'] === 'paid' && $trx->status !== 'paid') {
            $trx->status = 'paid';
            $trx->paid_at = date('Y-m-d H:i:s');
            $trx->paid_by = $user->id;
            if (isset($body['payment_method'])) $trx->payment_method = $body['payment_method'];
            if (isset($body['payment_note'])) $trx->payment_note = $body['payment_note'];
            $trx->save();

            // Auto-extend subscription
            if ($trx->subscription_id) {
                $sub = \ORM::for_table('subscriptions')->find_one($trx->subscription_id);
                if ($sub) {
                    $plan = \ORM::for_table('plans')->find_one($sub->plan_id);
                    if ($plan) {
                        // Calculate duration from plan or use 30 days default
                        $newExp = date('Y-m-d H:i:s', strtotime($sub->expired_at . ' +30 days'));
                        $sub->expired_at = $newExp;
                        $sub->status = 'active';
                        $sub->save();
                    }
                }
            }

            // Also update user status if expired
            $cust = \ORM::for_table('users')->find_one($trx->user_id);
            if ($cust && $cust->status === 'expired') {
                $cust->status = 'active';
                $cust->save();
            }
        } else {
            if (isset($body['status'])) $trx->status = $body['status'];
            if (isset($body['amount'])) $trx->amount = $body['amount'];
            if (isset($body['payment_method'])) $trx->payment_method = $body['payment_method'];
            if (isset($body['payment_note'])) $trx->payment_note = $body['payment_note'];
            if (isset($body['due_date'])) $trx->due_date = $body['due_date'];
            $trx->save();
        }

        return jsonResponse($response, ['data' => $trx]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $trx = \ORM::for_table('transactions')->find_one($args['id']);
        if (!$trx) {
            return jsonResponse($response, ['error' => 'Transaction not found'], 404);
        }
        $trx->delete();
        return jsonResponse($response, ['message' => 'Transaction deleted']);
    }

    public function pdf(Request $request, Response $response, $args)
    {
        $trx = \ORM::for_table('transactions')
            ->select('transactions.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->select('users.address', 'user_address')
            ->select('users.phone', 'user_phone')
            ->select('subscriptions.username_radius', 'radius_username')
            ->select('plans.name', 'plan_name')
            ->select('plans.price', 'plan_price')
            ->join('users', ['transactions.user_id', '=', 'users.id'])
            ->left_outer_join('subscriptions', ['transactions.subscription_id', '=', 'subscriptions.id'])
            ->left_outer_join('plans', ['subscriptions.plan_id', '=', 'plans.id'])
            ->find_one($args['id']);

        if (!$trx) {
            return jsonResponse($response, ['error' => 'Transaction not found'], 404);
        }

        $header = $this->getSetting('invoice_header', 'NetFlow ISP');
        $address = $this->getSetting('invoice_address', '');
        $footer = $this->getSetting('invoice_footer', 'Terima Kasih');
        $showPpn = $this->getSetting('invoice_show_ppn', '1');
        $ppnPercent = (int)$this->getSetting('ppn_percent', '11');
        $bankName = $this->getSetting('bank_name', '');
        $bankAccount = $this->getSetting('bank_account', '');
        $bankHolder = $this->getSetting('bank_holder', '');
        $currency = $this->getSetting('currency', 'Rp');

        $subtotal = (float)$trx->amount;
        $ppn = $showPpn === '1' ? $subtotal * $ppnPercent / 100 : 0;
        $total = $subtotal + $ppn;

        $statusBadge = $trx->status === 'paid' ? 'LUNAS' : 'BELUM LUNAS';
        $statusClass = $trx->status === 'paid' ? 'paid' : 'unpaid';

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice {$trx->invoice_no}</title>
<style>
    @page { margin: 10mm; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; color: #000; }
    .header { text-align: center; margin-bottom: 10px; }
    .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
    .header p { margin: 2px 0; font-size: 10px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
    .row span { font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    table th, table td { text-align: left; padding: 3px 0; }
    table th { border-bottom: 1px solid #000; }
    .total-row td { font-weight: bold; border-top: 1px solid #000; }
    .status-badge { text-align: center; font-size: 14px; font-weight: bold; padding: 5px; margin: 5px 0; }
    .status-badge.paid { color: green; }
    .status-badge.unpaid { color: red; }
    .footer { text-align: center; margin-top: 10px; font-size: 10px; }
    .bank-info { font-size: 10px; margin: 5px 0; }
</style>
</head>
<body>
<div class="header">
    <h2>{$header}</h2>
    <p>{$address}</p>
</div>
<div class="divider"></div>
<div class="status-badge {$statusClass}">{$statusBadge}</div>
<div class="divider"></div>
<div class="row"><span>Invoice:</span><span>{$trx->invoice_no}</span></div>
<div class="row"><span>Tanggal:</span><span>" . date('d/m/Y H:i', strtotime($trx->created_at)) . "</span></div>
<div class="row"><span>Customer:</span><span>{$trx->user_name} ({$trx->user_uid})</span></div>
<div class="row"><span>Paket:</span><span>{$trx->plan_name}</span></div>
<div class="row"><span>Username:</span><span>{$trx->radius_username}</span></div>
HTML;

        // Only show period if available
        if ($trx->period_start) {
            $html .= '<div class="row"><span>Periode:</span><span>' . date('d/m/Y', strtotime($trx->period_start)) . ' - ' . date('d/m/Y', strtotime($trx->period_end)) . '</span></div>';
        }

        $html .= <<<HTML
<div class="divider"></div>
<table>
    <tr><th>Item</th><th style="text-align:right">Jumlah</th></tr>
    <tr><td>Biaya Layanan Internet {$trx->plan_name}</td><td style="text-align:right">{$currency} " . number_format($subtotal, 0, ',', '.') . "</td></tr>
HTML;

        if ($ppn > 0) {
            $html .= '<tr><td>PPN ' . $ppnPercent . '%</td><td style="text-align:right">' . $currency . ' ' . number_format($ppn, 0, ',', '.') . '</td></tr>';
        }

        $html .= <<<HTML
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">{$currency} " . number_format($total, 0, ',', '.') . "</td></tr>
</table>
<div class="divider"></div>
HTML;

        if ($bankName) {
            $html .= <<<HTML
<div class="bank-info">
    <strong>Pembayaran:</strong><br>
    {$bankName} - {$bankAccount}<br>
    a.n. {$bankHolder}
</div>
HTML;
        }

        $html .= <<<HTML
<div class="divider"></div>
<div class="footer">{$footer}</div>
</body>
</html>
HTML;

        $response->getBody()->write($html);
        return $response->withHeader('Content-Type', 'text/html; charset=utf-8');
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

    private function getSetting($key, $default = '')
    {
        $s = \ORM::for_table('settings')->where('key', $key)->find_one();
        return $s ? $s->value : $default;
    }
}
