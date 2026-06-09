<?php

namespace App\Helpers;

class WaAdapter
{
    private string $provider;
    private string $apiUrl;
    private string $apiKey;
    private string $session;

    public function __construct(string $provider, string $apiUrl, string $apiKey, string $session = 'default')
    {
        $this->provider = $provider;
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
        $this->session = $session;
    }

    /**
     * Get available providers list
     */
    public static function providers(): array
    {
        return [
            'openwa'   => ['name' => 'OpenWA', 'needs_session' => true],
            'fonnte'   => ['name' => 'Fonnte', 'needs_session' => false],
            'wablas'   => ['name' => 'Wablas', 'needs_session' => false],
            'twilio'   => ['name' => 'Twilio', 'needs_session' => false],
            'wabusiness' => ['name' => 'WA Business API', 'needs_session' => false],
        ];
    }

    /**
     * Send text message via configured provider
     */
    public function sendText(string $to, string $text): array
    {
        $method = 'send_' . $this->provider;
        if (!method_exists($this, $method)) {
            return ['success' => false, 'error' => "Provider '{$this->provider}' not supported"];
        }
        return $this->$method($to, $text);
    }

    /**
     * OpenWA — POST /api/sendText, header X-API-Key
     */
    private function send_openwa(string $to, string $text): array
    {
        return $this->curlPost(
            $this->apiUrl . '/api/sendText',
            ['session' => $this->session, 'to' => $to, 'text' => $text],
            ['X-API-Key: ' . $this->apiKey]
        );
    }

    /**
     * Fonnte — POST https://api.fonnte.com/send, header Authorization: token
     */
    private function send_fonnte(string $to, string $text): array
    {
        return $this->curlPost(
            'https://api.fonnte.com/send',
            ['target' => $to, 'message' => $text, 'countryCode' => '62'],
            ['Authorization: ' . $this->apiKey]
        );
    }

    /**
     * Wablas — POST {base_url}/api/send-message, token in query
     */
    private function send_wablas(string $to, string $text): array
    {
        $url = $this->apiUrl . '/api/send-message';
        return $this->curlPost(
            $url,
            ['phone' => $to, 'message' => $text, 'token' => $this->apiKey],
            ['Content-Type: application/json']
        );
    }

    /**
     * Twilio — POST to Twilio Messages API
     * api_url = Account SID, api_key = Auth Token, session = From number
     */
    private function send_twilio(string $to, string $text): array
    {
        $sid = $this->apiUrl;  // Account SID stored in api_url
        $token = $this->apiKey;
        $from = $this->session;

        $ch = curl_init("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'From' => 'whatsapp:' . $from,
                'To' => 'whatsapp:' . $to,
                'Body' => $text,
            ]),
            CURLOPT_USERPWD => "{$sid}:{$token}",
            CURLOPT_TIMEOUT => 15,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) return ['success' => false, 'error' => $error];
        $resp = json_decode($result, true);
        if ($httpCode >= 200 && $httpCode < 300) return ['success' => true, 'data' => $resp];
        return ['success' => false, 'error' => $resp['message'] ?? 'HTTP ' . $httpCode];
    }

    /**
     * WA Business API (Meta Cloud API) — POST to https://graph.facebook.com/v21.0/{phone-id}/messages
     * api_url = phone-number-id, api_key = permanent access token
     */
    private function send_wabusiness(string $to, string $text): array
    {
        $phoneId = $this->apiUrl;  // stored in api_url
        $token = $this->apiKey;

        $payload = json_encode([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'text',
            'text' => ['preview_url' => false, 'body' => $text],
        ]);

        return $this->curlPost(
            "https://graph.facebook.com/v21.0/{$phoneId}/messages",
            json_decode($payload, true),
            [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
            ]
        );
    }

    /**
     * Generic POST via cURL
     */
    private function curlPost(string $url, array $data, array $headers = []): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_TIMEOUT => 15,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) return ['success' => false, 'error' => $error];

        $resp = json_decode($result, true);
        if ($httpCode >= 200 && $httpCode < 300) return ['success' => true, 'data' => $resp ?? []];

        $errMsg = $resp['message'] ?? $resp['error'] ?? $resp['title'] ?? 'HTTP ' . $httpCode;
        if (is_array($errMsg)) $errMsg = json_encode($errMsg);
        return ['success' => false, 'error' => $errMsg];
    }
}
