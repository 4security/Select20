<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddAuthTokenHeader
{
    public function handle(Request $request, Closure $next)
    {
        $cookie_name = "supercookie";

        if (!$request->bearerToken()) {
            if ($request->hasCookie($cookie_name)) {
                $token = $request->cookie($cookie_name);

                try {
                    $request->headers->add([
                        'Authorization' => 'Bearer ' . $token,
                    ]);
                } catch (\Throwable$th) {

                }
            }
        }
        return $next($request);
    }
}
