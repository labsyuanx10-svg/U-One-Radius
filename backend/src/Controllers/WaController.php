<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WaController
{
    public function test(Request $request, Response $response, $args)
    {
        $body = $request->getParsedBody();
        $phone = $body['phone'] ?? '';
        $message = $body['message'] ?? 'Test dari U-One Radius';

        if (!$phone) {
            return jsonResponse($response, ['error' => 'Phone required'], 400);
        }

        // Get WA gateway settings
        $waUrl = \ORM::for_table('settings')->where('key', 'wa_api_url')->find_one();
        $waKey = \ORM::for_table('settings')->where('key', 'wa_api_key')->find_one();
        $waSession = \ORM::for_table('settings')->where('key', 'wa_session')->find_one();

        $waUrl = $waUrl ? $waUrl->value : '';
        $waKey = $waKey ? $waKey->value : '';
        $waSession = $waSession ? $waSession->value : 'default';

        if (empty($waUrl) || empty($waKey)) {
            return jsonResponse($response, ['error' => 'Konfigurasi WA Gateway belum diatur'], 400);
        }

        // Format phone
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($cleanPhone, 0, 1) === '0') {
            $cleanPhone = '62' . substr($cleanPhone, 1);
        } elseif (substr($cleanPhone, 0, 2) !== '62') {
            $cleanPhone = '62' . $cleanPhone;
        }

        $payload = json_encode([
            'session' => $waSession,
            'to' => $cleanPhone,
            'text' => $message
        ]);

        $apiUrl = rtrim($waUrl, '/') . '/api/sendText';

        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $waKey
            ],
            CURLOPT_TIMEOUT => 15
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return jsonResponse($response, ['error' => 'Gagal terhubung: ' . $error], 500);
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return jsonResponse($response, ['message' => 'Pesan test berhasil dikirim ke ' . $cleanPhone]);
        }

        $resp = json_decode($result, true);
        $errMsg = $resp['message'] ?? $resp['error'] ?? 'HTTP ' . $httpCode;
        return jsonResponse($response, ['error' => 'WA Gateway error: ' . $errMsg], 500);
    }
}
