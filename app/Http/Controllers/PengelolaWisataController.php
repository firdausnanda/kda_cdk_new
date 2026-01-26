<?php

namespace App\Http\Controllers;

use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengelolaWisataController extends Controller
{
  public function index(Request $request)
  {
    $query = PengelolaWisata::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $pengelolaWisata = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/PengelolaWisata/Index', [
      'pengelolaWisata' => $pengelolaWisata,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_pengelola_wisata,name',
    ]);

    PengelolaWisata::create($request->all());

    return redirect()->route('pengelola-wisata.index')->with('success', 'Data Pengelola Wisata berhasil ditambahkan.');
  }

  public function update(Request $request, PengelolaWisata $pengelolaWisata)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_pengelola_wisata,name,' . $pengelolaWisata->id,
    ]);

    $pengelolaWisata->update($request->only('name'));

    return redirect()->route('pengelola-wisata.index')->with('success', 'Data Pengelola Wisata berhasil diperbarui.');
  }

  public function destroy(PengelolaWisata $pengelolaWisata)
  {
    $pengelolaWisata->delete();

    return redirect()->route('pengelola-wisata.index')->with('success', 'Data Pengelola Wisata berhasil dihapus.');
  }
}
