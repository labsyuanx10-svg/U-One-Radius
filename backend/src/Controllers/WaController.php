<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\WaAdapter;

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
        $settings = $this->getSettings();
        if (empty($settings['url']) || empty($settings['key'])) {
            return jsonResponse($response, ['error' => 'Konfigurasi WA Gateway belum diatur'], 400);
        }

        // Format phone
        $cleanPhone = $this->formatPhone($phone);

        $adapter = new WaAdapter(
            $settings['provider'],
            $settings['url'],
            $settings['key'],
            $settings['session']
        );

        $result = $adapter->sendText($cleanPhone, $message);

        if ($result['success']) {
            return jsonResponse($response, ['message' => "Pesan test berhasil dikirim ke {$cleanPhone}"]);
        }

        return jsonResponse($response, ['error' => 'WA Gateway error: ' . $result['error']], 500);
    }

    /**
     * Get WA providers list for frontend dropdown
     */
    public function providers(Request $request, Response $response, $args)
    {
        return jsonResponse($response, ['data' => WaAdapter::providers()]);
    }

    private function getSettings(): array
    {
        $waUrl = \ORM::for_table('settings')->where('key', 'wa_api_url')->find_one();
        $waKey = \ORM::for_table('settings')->where('key', 'wa_api_key')->find_one();
        $waSession = \ORM::for_table('settings')->where('key', 'wa_session')->find_one();
        $waProvider = \ORM::for_table('settings')->where('key', 'wa_provider')->find_one();

        return [
            'url' => $waUrl ? $waUrl->value : '',
            'key' => $waKey ? $waKey->value : '',
            'session' => $waSession ? $waSession->value : 'default',
            'provider' => $waProvider ? $waProvider->value : 'openwa',
        ];
    }

    private function formatPhone(string $phone): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (substr($clean, 0, 1) === '0') {
            return '62' . substr($clean, 1);
        }
        if (substr($clean, 0, 2) !== '62') {
            return '62' . $clean;
        }
        return $clean;
    }
}
