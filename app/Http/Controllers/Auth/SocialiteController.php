<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
  public function redirect($provider)
  {
    return Socialite::driver($provider)->redirect();
  }

  public function callback($provider)
  {
    try {
      $socialUser = Socialite::driver($provider)->user();

      $user = User::where('google_id', $socialUser->getId())
        ->orWhere('email', $socialUser->getEmail())
        ->first();

      if ($user) {
        // Determine if we need to update the existing user
        $updates = [];
        if (!$user->google_id) {
          $updates['google_id'] = $socialUser->getId();
        }
        if (!$user->avatar) {
          $updates['avatar'] = $socialUser->getAvatar();
        }

        if (!empty($updates)) {
          $user->update($updates);
        }

        Auth::login($user);

        if ($user->roles->isEmpty()) {
          return redirect()->route('public.dashboard');
        }

        return redirect()->intended(route('dashboard'));
      } else {
        // Create new user
        $newUser = User::create([
          'name' => Str::upper($socialUser->getName()),
          'email' => $socialUser->getEmail(),
          'username' => $this->generateUniqueUsername($socialUser->getName()),
          'google_id' => $socialUser->getId(),
          'avatar' => $socialUser->getAvatar(),
          'password' => bcrypt(Str::random(16)), // Random password for security
        ]);

        // Assign default role if using Spatie Permission
        if (method_exists($newUser, 'assignRole')) {
          // Assuming 'user' or 'guest' is a default role, adjusting to 'pimpinan' or existing role if known.
          // For safety, maybe no role or a basic role. Let's assume no role for now or 'pimpinan' as safe default?
          // Actually, based on existing roles, 'pelaksana' might be safe. 
          // Let's safe-guard this: we won't auto-assign role unless we know the business rule.
          // User can assign manually.
        }

        Auth::login($newUser);

        if ($newUser->roles->isEmpty()) {
          return redirect()->route('public.dashboard');
        }

        return redirect()->intended(route('dashboard'));
      }

    } catch (\Exception $e) {
      \Illuminate\Support\Facades\Log::error('Socialite Login Error: ' . $e->getMessage());
      return redirect()->route('login')->with('error', 'Login gagal: ' . $e->getMessage());
    }
  }

  private function generateUniqueUsername($name)
  {
    $baseUsername = Str::slug($name);
    $username = $baseUsername;
    $counter = 1;

    while (User::where('username', $username)->exists()) {
      $username = $baseUsername . $counter;
      $counter++;
    }

    return $username;
  }
}
