<?php

namespace App\Http\Controllers;

use App\Models\Regencies;
use App\Models\Provinces;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegencyController extends Controller
{
  public function index(Request $request)
  {
    $query = Regencies::with('province');

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $regencies = $query->paginate(10)->withQueryString();
    $provinces = Provinces::all();

    return Inertia::render('MasterData/Regencies/Index', [
      'regencies' => $regencies,
      'provinces' => $provinces,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'id' => 'required|numeric|unique:regencies,id',
      'province_id' => 'required|exists:provinces,id',
      'name' => 'required|string|max:255',
    ]);

    Regencies::create($request->all());

    return redirect()->route('regencies.index')->with('success', 'Kabupaten/Kota berhasil ditambahkan.');
  }

  public function update(Request $request, Regencies $regency)
  {
    $request->validate([
      'province_id' => 'required|exists:provinces,id',
      'name' => 'required|string|max:255',
    ]);

    $regency->update($request->all());

    return redirect()->route('regencies.index')->with('success', 'Kabupaten/Kota berhasil diperbarui.');
  }

  public function destroy(Regencies $regency)
  {
    $regency->delete();

    return redirect()->route('regencies.index')->with('success', 'Kabupaten/Kota berhasil dihapus.');
  }
}
