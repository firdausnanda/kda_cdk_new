<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Commodity;
use Inertia\Inertia;

class CommodityController extends Controller
{
    public function index(Request $request)
    {
        $query = Commodity::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $commodities = $query->paginate(10)->withQueryString();

        return Inertia::render('MasterData/Commodities/Index', [
            'commodities' => $commodities,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:m_commodities,name|max:255',
            'type' => 'nullable|string',
        ]);

        Commodity::create($request->all());

        return redirect()->route('commodities.index')->with('success', 'Komoditas berhasil ditambahkan');
    }

    public function update(Request $request, Commodity $commodity)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:m_commodities,name,' . $commodity->id,
            'type' => 'nullable|string',
        ]);

        $commodity->update($request->all());

        return redirect()->route('commodities.index')->with('success', 'Komoditas berhasil diperbarui');
    }

    public function destroy(Commodity $commodity)
    {
        $commodity->delete();

        return redirect()->route('commodities.index')->with('success', 'Komoditas berhasil dihapus');
    }
}
