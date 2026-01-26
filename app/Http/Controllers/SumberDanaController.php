<?php

namespace App\Http\Controllers;

use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SumberDanaController extends Controller
{
  public function index(Request $request)
  {
    $query = SumberDana::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $sumberDana = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/SumberDana/Index', [
      'sumberDana' => $sumberDana,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_sumber_dana,name',
    ]);

    SumberDana::create($request->all());

    return redirect()->route('sumber-dana.index')->with('success', 'Data Sumber Dana berhasil ditambahkan.');
  }

  public function update(Request $request, SumberDana $sumberDana)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_sumber_dana,name,' . $sumberDana->id,
    ]);

    $sumberDana->update($request->only('name'));

    return redirect()->route('sumber-dana.index')->with('success', 'Data Sumber Dana berhasil diperbarui.');
  }

  public function destroy(SumberDana $sumberDana)
  {
    $sumberDana->delete();

    return redirect()->route('sumber-dana.index')->with('success', 'Data Sumber Dana berhasil dihapus.');
  }
}
