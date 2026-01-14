<?php

namespace App\Http\Controllers;

use App\Models\RehabLahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $currentYear = date('Y');
        $prevYear = $currentYear - 1;

        $totalCurrentYear = RehabLahan::where('year', $currentYear)->where('status', 'final')->sum('realization');
        $totalPrevYear = RehabLahan::where('year', $prevYear)->where('status', 'final')->sum('realization');

        $growthPercentage = 0;
        if ($totalPrevYear > 0) {
            $growthPercentage = (($totalCurrentYear - $totalPrevYear) / $totalPrevYear) * 100;
        } elseif ($totalCurrentYear > 0) {
            $growthPercentage = 100; // If previous year was 0 and current has data, it's 100% growth
        }

        return Inertia::render('Dashboard', [
            'rehabStats' => [
                'total' => $totalCurrentYear,
                'growth' => round($growthPercentage, 1),
                'prevTotal' => $totalPrevYear
            ]
        ]);
    }
}
