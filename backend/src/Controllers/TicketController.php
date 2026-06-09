<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TicketController
{
    public function list(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $query = \ORM::for_table('tickets')
            ->select('tickets.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->join('users', ['tickets.user_id', '=', 'users.id']);

        // Filter by group via user's group
        if (!in_array($user->role, ['superadmin'])) {
            $query = $query->where('users.group_id', $user->group_id);
        }

        $params = $request->getQueryParams();
        if (!empty($params['status'])) {
            $query = $query->where('tickets.status', $params['status']);
        }
        if (!empty($params['user_id'])) {
            $query = $query->where('tickets.user_id', $params['user_id']);
        }
        if (!empty($params['priority'])) {
            $query = $query->where('tickets.priority', $params['priority']);
        }

        $tickets = $query->order_by_desc('tickets.id')->find_many();
        $result = array_map(function($t) { return $t->as_array(); }, $tickets);
        return jsonResponse($response, ['data' => $result]);
    }

    public function get(Request $request, Response $response, $args)
    {
        $ticket = \ORM::for_table('tickets')
            ->select('tickets.*')
            ->select('users.fullname', 'user_name')
            ->select('users.uid', 'user_uid')
            ->join('users', ['tickets.user_id', '=', 'users.id'])
            ->find_one($args['id']);

        if (!$ticket) {
            return jsonResponse($response, ['error' => 'Ticket not found'], 404);
        }
        return jsonResponse($response, ['data' => $ticket]);
    }

    public function create(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        $body = $request->getParsedBody();

        if (empty($body['description'])) {
            return jsonResponse($response, ['error' => 'description required'], 400);
        }

        // Generate ticket_no
        $ticketNo = $this->generateTicketNo();

        $ticket = \ORM::for_table('tickets')->create();
        $ticket->ticket_no = $ticketNo;
        $ticket->user_id = $body['user_id'] ?? 0;
        $ticket->category = $body['category'] ?? 'jaringan';
        $ticket->priority = $body['priority'] ?? 'sedang';
        $ticket->status = 'baru';
        $ticket->description = $body['description'];
        $ticket->subject = $body['subject'] ?? substr($body['description'], 0, 100);
        $ticket->assigned_to = $body['assigned_to'] ?? null;
        $ticket->created_by = $user->id;
        $ticket->save();

        // Log
        $log = \ORM::for_table('logs')->create();
        $log->user_id = $user->id;
        $log->action = 'ticket_create';
        $log->description = "Buat tiket {$ticketNo}: {$ticket->subject}";
        $log->ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $log->save();

        return jsonResponse($response, ['data' => $ticket], 201);
    }

    public function update(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');

        $ticket = \ORM::for_table('tickets')
            ->select('tickets.*')
            ->select('users.group_id', 'customer_group_id')
            ->join('users', ['tickets.user_id', '=', 'users.id'])
            ->where('tickets.id', $args['id'])
            ->find_one();

        if (!$ticket) {
            return jsonResponse($response, ['error' => 'Ticket not found'], 404);
        }

        // Group check for non-superadmin
        if (!in_array($user->role, ['superadmin'])) {
            if ($user->group_id != $ticket->customer_group_id) {
                return jsonResponse($response, ['error' => 'Forbidden: not your group'], 403);
            }
        }

        $body = $request->getParsedBody();

        // Teknisi: only status, solution, assigned_to
        if (in_array($user->role, ['teknisi'])) {
            if (isset($body['status'])) $ticket->status = $body['status'];
            if (isset($body['solution'])) $ticket->solution = $body['solution'];
            if (isset($body['assigned_to'])) $ticket->assigned_to = $body['assigned_to'];
        } else {
            // Admin & Superadmin: full
            if (isset($body['status'])) $ticket->status = $body['status'];
            if (isset($body['solution'])) $ticket->solution = $body['solution'];
            if (isset($body['category'])) $ticket->category = $body['category'];
            if (isset($body['priority'])) $ticket->priority = $body['priority'];
            if (isset($body['assigned_to'])) $ticket->assigned_to = $body['assigned_to'];
            if (isset($body['description'])) $ticket->description = $body['description'];
        }

        if (in_array($ticket->status, ['selesai', 'ditolak'])) {
            $ticket->closed_at = date('Y-m-d H:i:s');
            $ticket->closed_by = $user->id;
        }

        $ticket->save();

        return jsonResponse($response, ['data' => $ticket]);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $user = $request->getAttribute('user');
        if (!in_array($user->role, ['superadmin'])) {
            return jsonResponse($response, ['error' => 'Forbidden'], 403);
        }

        $ticket = \ORM::for_table('tickets')->find_one($args['id']);
        if (!$ticket) {
            return jsonResponse($response, ['error' => 'Ticket not found'], 404);
        }
        $ticket->delete();
        return jsonResponse($response, ['message' => 'Ticket deleted']);
    }

    private function generateTicketNo()
    {
        $date = date('Ymd');
        $last = \ORM::for_table('tickets')
            ->where_like('ticket_no', 'TKT-' . $date . '-%')
            ->order_by_desc('id')
            ->find_one();

        $num = 1;
        if ($last) {
            $parts = explode('-', $last->ticket_no);
            $num = (int)end($parts) + 1;
        }
        return 'TKT-' . $date . '-' . str_pad((string)$num, 4, '0', STR_PAD_LEFT);
    }
}
