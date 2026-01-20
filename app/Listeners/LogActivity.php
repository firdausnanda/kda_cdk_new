<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;
use Spatie\Activitylog\Facades\LogBatch;
use Spatie\Activitylog\Models\Activity;

class LogActivity
{
  public function onLogin(Login $event)
  {
    activity()
      ->causedBy($event->user)
      ->withProperties([
        'ip' => request()->getClientIp(),
        'agent' => request()->header('User-Agent'),
      ])
      ->log('logged in');
  }

  public function onLogout(Logout $event)
  {
    if ($event->user) {
      activity()
        ->causedBy($event->user)
        ->withProperties(['ip' => request()->ip(), 'agent' => request()->userAgent()])
        ->log('logged out');
    }
  }

  public function subscribe(Dispatcher $events): array
  {
    return [
      Login::class => 'onLogin',
      Logout::class => 'onLogout',
    ];
  }
}
