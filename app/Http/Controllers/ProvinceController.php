<?php

namespace App\Http\Controllers;

use App\Models\Provinces;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProvinceController extends Controller
{
  public function index(Request $request)
  {
    $query = Provinces::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $provinces = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/Provinces/Index', [
      'provinces' => $provinces,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'id' => 'required|numeric|unique:provinces,id',
      'name' => 'required|string|max:255',
    ]);

    Provinces::create($request->all());

    return redirect()->route('provinces.index')->with('success', 'Provinsi berhasil ditambahkan.');
  }

  public function update(Request $request, Provinces $province)
  {
    $request->validate([
      'name' => 'required|string|max:255',
    ]);

    $province->update($request->only('name'));

    return redirect()->route('provinces.index')->with('success', 'Provinsi berhasil diperbarui.');
  }

  public function destroy(Provinces $province)
  {
    $province->delete();

    return redirect()->route('provinces.index')->with('success', 'Provinsi berhasil dihapus.');
  }
}
