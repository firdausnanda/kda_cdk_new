<?php

namespace App\Http\Controllers;

use App\Models\SkemaPerhutananSosial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SkemaPerhutananSosialController extends Controller
{
  public function index(Request $request)
  {
    $query = SkemaPerhutananSosial::query();

    if ($request->has('search')) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $skema = $query->paginate(10)->withQueryString();

    return Inertia::render('MasterData/SkemaPerhutananSosial/Index', [
      'skema' => $skema,
      'filters' => $request->only(['search']),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_skema_perhutanan_sosial,name',
    ]);

    SkemaPerhutananSosial::create($request->all());

    return redirect()->route('skema-perhutanan-sosial.index')->with('success', 'Data Skema Perhutanan Sosial berhasil ditambahkan.');
  }

  public function update(Request $request, SkemaPerhutananSosial $skemaPerhutananSosial)
  {
    $request->validate([
      'name' => 'required|string|max:255|unique:m_skema_perhutanan_sosial,name,' . $skemaPerhutananSosial->id,
    ]);

    $skemaPerhutananSosial->update($request->only('name'));

    return redirect()->route('skema-perhutanan-sosial.index')->with('success', 'Data Skema Perhutanan Sosial berhasil diperbarui.');
  }

  public function destroy(SkemaPerhutananSosial $skemaPerhutananSosial)
  {
    $skemaPerhutananSosial->delete();

    return redirect()->route('skema-perhutanan-sosial.index')->with('success', 'Data Skema Perhutanan Sosial berhasil dihapus.');
  }
}
