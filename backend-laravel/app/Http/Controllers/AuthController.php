<?php

namespace App\Http\Controllers;

use App\Models\History;
use App\Models\User;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

    /**
     * @OA\Post(
     * path="/login",
     * summary="Sign in",
     * description="Login by email, password",
     * operationId="authLogin",
     * tags={"auth"},
     * @OA\RequestBody(
     *    required=true,
     *    description="Pass user credentials",
     *    @OA\JsonContent(
     *       required={"email","password"},
     *       @OA\Property(property="email", type="string", format="email", example="user1@mail.com"),
     *       @OA\Property(property="password", type="string", format="password", example="PassWord12345"),
     *       @OA\Property(property="persistent", type="boolean", example="true"),
     *    ),
     * ),
     * @OA\Response(
     *    response=422,
     *    description="Wrong credentials response",
     *    @OA\JsonContent(
     *       @OA\Property(property="message", type="string", example="Sorry, wrong email address or password. Please try again")
     *        )
     *     )
     * )
     */
    public function login(Request $request)
    {
        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:12',
            ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!$token = auth()->attempt($validator->validated())) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $this->saveHistory("Log in");
        return $this->createNewToken($token);
    }

    public function register(Request $request)
    {
        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'name' => 'required|string|min:3|max:100',
                'email' => 'required|string|email|max:100|unique:users',
                'password' => 'required|string|min:12',
                'nextcloudkey' => 'required|string|min:12',
                'nextcloudurl' => 'required|string|min:20',
            ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create(
            array_merge(
                $validator->validated(),
                ['password' => bcrypt($request->password)]
            )
        );

        return response()->json([
            'message' => 'User successfully registered',
            'user' => $user,
        ], 201);
    }

    public function register_free_account(Request $request)
    {
        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'name' => 'required|string|min:3|max:100',
                'email' => 'required|string|email|max:100|unique:users',
                'password' => 'required|string|min:12',
            ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create(
            array_merge(
                $validator->validated(),
                ['nextcloudurl' => env('NEXTCLOUD_URL', 'nope') . $request->name . "/"],
                ['nextcloudkey' => env('NEXTCLOUD_KEY', 'nope')],
                ['password' => bcrypt($request->password)]
            )
        );
        $add_user = curl_init();
        curl_setopt($add_user, CURLOPT_URL, $user->nextcloudurl);
        curl_setopt($add_user, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($add_user, CURLOPT_POSTFIELDS, '');
        curl_setopt($add_user, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($add_user, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($add_user);
        curl_close($add_user);
        return response($server_output, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    public function logout()
    {
        $this->saveHistory("Logged out");
        auth()->logout();

        return response()->json(['message' => 'User successfully signed out']);
    }

    public function refresh()
    {
        $this->saveHistory("Refresh");
        return $this->createNewToken(auth()->refresh());
    }

    protected function createNewToken($token)
    {
        $cookie = $this->getCookie($token);
        return response()->json([
            'expires_in' => auth()->factory()->getTTL() * 60,
        ])->withCookie($cookie);
    }

    /**
     *
     * @param  string  $token
     * @return \Symfony\Component\HttpFoundation\Cookie
     */
    private function getCookie($token): Cookie
    {
        return cookie(
            "supercookie",
            $token,
            auth()->factory()->getTTL(),
            null,
            null,
            env('APP_DEBUG') ? false : true,
            true,
            false,
            'None'
        );
    }

    public function saveHistory($log_message, $user_id = -1)
    {
        if ($user_id != -1) {
            $user = JWTAuth::user();
            $user_id = $user->id;
        }

        $history = new History();
        $history->user_id_fk = $user_id;
        $history->log_message = $log_message;
        $history->save();
    }
}