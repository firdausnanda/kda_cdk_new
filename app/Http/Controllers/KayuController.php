<?php

namespace App\Http\Controllers;

use App\Models\Kayu;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KayuController extends Controller
{
  public function index(Request $request)
  {
    $query = Kayu::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $kayu = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/Kayu/Index', [
      'kayu' => $kayu,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_kayu,name',
    ]);

    Kayu::create($request->all());

    return redirect()->route('kayu.index')->with('success', 'Data Kayu berhasil ditambahkan.');
  }

  public function update(Request $request, Kayu $kayu)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_kayu,name,' . $kayu->id,
    ]);

    $kayu->update($request->only('name'));

    return redirect()->route('kayu.index')->with('success', 'Data Kayu berhasil diperbarui.');
  }

  public function destroy(Kayu $kayu)
  {
    $kayu->delete();

    return redirect()->route('kayu.index')->with('success', 'Data Kayu berhasil dihapus.');
  }
}
