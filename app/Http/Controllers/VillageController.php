<?php

namespace App\Http\Controllers;

use App\Models\Villages;
use App\Models\Districts;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VillageController extends Controller
{
  public function index(Request $request)
  {
    $query = Villages::with('district.regency');

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $villages = $query->paginate(10)->withQueryString();
    // Similarly, districts list might be large.
    $districts = Districts::all();

    return Inertia::render('MasterData/Villages/Index', [
      'villages' => $villages,
      'districts' => $districts,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'id' => 'required|numeric|unique:villages,id',
      'district_id' => 'required|exists:districts,id',
      'name' => 'required|string|max:255',
    ]);

    Villages::create($request->all());

    return redirect()->route('villages.index')->with('success', 'Desa/Kelurahan berhasil ditambahkan.');
  }

  public function update(Request $request, Villages $village)
  {
    $request->validate([
      'district_id' => 'required|exists:districts,id',
      'name' => 'required|string|max:255',
    ]);

    $village->update($request->all());

    return redirect()->route('villages.index')->with('success', 'Desa/Kelurahan berhasil diperbarui.');
  }

  public function destroy(Villages $village)
  {
    $village->delete();

    return redirect()->route('villages.index')->with('success', 'Desa/Kelurahan berhasil dihapus.');
  }
}
