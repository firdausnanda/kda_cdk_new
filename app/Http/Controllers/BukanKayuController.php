<?php

namespace App\Http\Controllers;

use App\Models\BukanKayu;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BukanKayuController extends Controller
{
  public function index(Request $request)
  {
    $query = BukanKayu::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $bukanKayu = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/BukanKayu/Index', [
      'bukanKayu' => $bukanKayu,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_bukan_kayu,name',
    ]);

    BukanKayu::create($request->all());

    return redirect()->route('bukan-kayu.index')->with('success', 'Data Bukan Kayu berhasil ditambahkan.');
  }

  public function update(Request $request, BukanKayu $bukanKayu)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_bukan_kayu,name,' . $bukanKayu->id,
    ]);

    $bukanKayu->update($request->only('name'));

    return redirect()->route('bukan-kayu.index')->with('success', 'Data Bukan Kayu berhasil diperbarui.');
  }

  public function destroy(BukanKayu $bukanKayu)
  {
    $bukanKayu->delete();

    return redirect()->route('bukan-kayu.index')->with('success', 'Data Bukan Kayu berhasil dihapus.');
  }
}
