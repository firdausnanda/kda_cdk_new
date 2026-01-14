<?php

namespace App\Http\Controllers;

use App\Models\RehabLahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $currentYear = date('Y');
        $prevYear = $currentYear - 1;
        $chartYear = $request->input('year', $currentYear);

        // Stats always use current year
        $totalCurrentYear = RehabLahan::where('year', $currentYear)->where('status', 'final')->sum('realization');
        $totalPrevYear = RehabLahan::where('year', $prevYear)->where('status', 'final')->sum('realization');

        $growthPercentage = 0;
        if ($totalPrevYear > 0) {
            $growthPercentage = (($totalCurrentYear - $totalPrevYear) / $totalPrevYear) * 100;
        } elseif ($totalCurrentYear > 0) {
            $growthPercentage = 100; // If previous year was 0 and current has data, it's 100% growth
        }

        // Get monthly data for chart using selected year
        $monthlyData = RehabLahan::selectRaw('month, SUM(realization) as total')
            ->where('year', $chartYear)
            ->where('status', 'final')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->pluck('total', 'month');

        // Fill in missing months with 0
        $chartData = [];
        for ($i = 1; $i <= 12; $i++) {
            $chartData[] = $monthlyData->get($i, 0);
        }

        // Get available years from database
        $availableYears = RehabLahan::selectRaw('DISTINCT year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // Ensure current year is in the list
        if (!in_array(date('Y'), $availableYears)) {
            $availableYears[] = (int) date('Y');
            rsort($availableYears);
        }

        return Inertia::render('Dashboard', [
            'rehabStats' => [
                'total' => $totalCurrentYear,
                'growth' => round($growthPercentage, 1),
                'prevTotal' => $totalPrevYear,
                'monthlyData' => $chartData
            ],
            'filters' => [
                'year' => (int) $chartYear
            ],
            'availableYears' => $availableYears
        ]);
    }
}
