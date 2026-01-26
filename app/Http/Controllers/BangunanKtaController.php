<?php

namespace App\Http\Controllers;

use App\Models\BangunanKta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BangunanKtaController extends Controller
{
  public function index(Request $request)
  {
    $query = BangunanKta::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $bangunanKta = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/BangunanKta/Index', [
      'bangunanKta' => $bangunanKta,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_bangunan_kta,name',
    ]);

    BangunanKta::create($request->all());

    return redirect()->route('bangunan-kta.index')->with('success', 'Data Bangunan KTA berhasil ditambahkan.');
  }

  public function update(Request $request, BangunanKta $bangunanKta)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_bangunan_kta,name,' . $bangunanKta->id,
    ]);

    $bangunanKta->update($request->only('name'));

    return redirect()->route('bangunan-kta.index')->with('success', 'Data Bangunan KTA berhasil diperbarui.');
  }

  public function destroy(BangunanKta $bangunanKta)
  {
    $bangunanKta->delete();

    return redirect()->route('bangunan-kta.index')->with('success', 'Data Bangunan KTA berhasil dihapus.');
  }
}
