<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class SettingController
{
    public function list(Request $request, Response $response, $args)
    {
        $settings = \ORM::for_table('settings')->find_many();
        $result = [];
        foreach ($settings as $s) {
            $result[$s->key] = $s->value;
        }
        return jsonResponse($response, ['data' => $result]);
    }

    public function update(Request $request, Response $response, $args)
    {
        $body = $request->getParsedBody();

        if (!$body || !is_array($body)) {
            return jsonResponse($response, ['error' => 'Invalid data, expected key-value pairs'], 400);
        }

        foreach ($body as $key => $value) {
            $setting = \ORM::for_table('settings')->where('key', $key)->find_one();
            if ($setting) {
                $setting->value = $value;
                $setting->save();
            } else {
                $setting = \ORM::for_table('settings')->create();
                $setting->key = $key;
                $setting->value = $value;
                $setting->category = 'general';
                $setting->save();
            }
        }

        return jsonResponse($response, ['message' => 'Settings updated']);
    }
}
