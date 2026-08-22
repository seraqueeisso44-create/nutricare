"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AlimentoCompleto } from "@/lib/alimentos";
import { Star, X, Bookmark, Trash2, Check } from "lucide-react";

export interface ItemFavoritoSub {
  alimento: AlimentoCompleto;
  quantidade: number;
  medidaCaseira?: string;
  medidaCaseiraQtd?: number;
}

export interface GrupoFavoritoSub {
  id: string;
  nome: string;
  itens: ItemFavoritoSub[];
  criadoEm: number;
}

export const STORAGE_KEY_FAVORITOS_SUB = "nutricare_favoritos_substitutos";

function isCloud(): boolean {
  try { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) }
  catch { return false }
}

export function carregarFavoritosSub(): GrupoFavoritoSub[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITOS_SUB);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function salvarFavoritosSub(grupos: GrupoFavoritoSub[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITOS_SUB, JSON.stringify(grupos));
  } catch {
    /* ignore */
  }
  if (isCloud()) {
    fetch("/api/favoritos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(grupos) }).catch(() => {});
  }
}

interface SalvarProps {
  aberto: boolean;
  onClose: () => void;
  onSalvar: (nome: string) => void;
}

export function SalvarFavoritoModal({ aberto, onClose, onSalvar }: SalvarProps) {
  const [nome, setNome] = useState("");
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { onClose(); setNome("") }}>
      <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-turquesa" /> Salvar como favorito
          </h3>
          <button onClick={() => { onClose(); setNome("") }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nome do grupo salvo</label>
          <input
            type="text"
            autoFocus
            value={nome}
            onChange={e => setNome(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && nome.trim()) { onSalvar(nome.trim()); setNome("") } }}
            placeholder="ex: Substitutos para proteínas"
            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-white focus:ring-2 focus:ring-turquesa"
          />
          <p className="text-xs text-gray-400 mt-1.5">ex: Substitutos para proteínas, Substitutos para queijos, Substitutos para carnes...</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { onClose(); setNome("") }}>Cancelar</Button>
          <Button size="sm" disabled={!nome.trim()} onClick={() => { onSalvar(nome.trim()); setNome("") }}>
            <Check className="w-3.5 h-3.5" /> Salvar favorito
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UsarProps {
  aberto: boolean;
  onClose: () => void;
  grupos: GrupoFavoritoSub[];
  onUsar: (grupo: GrupoFavoritoSub) => void;
  onRemover: (id: string) => void;
}

export function UsarFavoritosModal({ aberto, onClose, grupos, onUsar, onRemover }: UsarProps) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" /> Usar substitutos favoritos
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {grupos.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">
              Nenhum grupo favorito salvo ainda.
              <br />Adicione substitutos a um alimento e use "Salvar substitutos atuais como favorito".
            </p>
          )}
          {[...grupos].sort((a, b) => a.nome.localeCompare(b.nome)).map(grupo => (
            <div key={grupo.id} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{grupo.nome}</p>
                  <p className="text-xs text-gray-500">{grupo.itens.length} substituto(s)</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onUsar(grupo)}
                    className="px-3 py-1.5 rounded-lg bg-turquesa text-white text-xs font-semibold hover:bg-petroleo transition-colors flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Usar
                  </button>
                  <button onClick={() => onRemover(grupo.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir favorito">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grupo.itens.map((it, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    {it.alimento.nome}
                    {it.medidaCaseira && <span className="text-amber-500">· {it.medidaCaseira}</span>}
                    <span className="text-amber-500">· {it.quantidade}g</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
