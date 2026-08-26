"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { buscarAlimentos, bancoAlimentos, medidasDisponiveis, rotuloMedidaPorGramas } from "@/lib/alimentos";
import type { AlimentoCompleto, MedidaDisponivel } from "@/lib/alimentos";
import { ArrowLeftRight, X, Search, Plus } from "lucide-react";

interface Props {
  aberto: boolean;
  onClose: () => void;
  onSelecionar: (alimento: AlimentoCompleto, qtd: number, medidaCaseira?: string) => void;
  alimentoPrincipal?: AlimentoCompleto | null;
  qtdPrincipal?: number;
}

export function SubstitutoModal({ aberto, onClose, onSelecionar, alimentoPrincipal, qtdPrincipal = 0 }: Props) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [qtd, setQtd] = useState(20);
  const [sel, setSel] = useState<AlimentoCompleto | null>(null);
  const [gramas, setGramas] = useState(100);
  const [medidaSel, setMedidaSel] = useState<MedidaDisponivel | null>(null);

  const resultados = useMemo(() => {
    const base = busca.length >= 2 ? buscarAlimentos(busca) : bancoAlimentos;
    if (categoria === "todas") return base;
    return base.filter(a => a.nome.toLowerCase().includes(categoria.toLowerCase()));
  }, [busca, categoria]);

  const medidas = useMemo(() => (sel ? medidasDisponiveis(sel) : []), [sel]);

  if (!aberto) return null;

  const handleClose = () => { setBusca(""); setCategoria("todas"); setQtd(20); setSel(null); setGramas(100); setMedidaSel(null); onClose() }

  const medidaPreview = medidaSel ? rotuloMedidaPorGramas(gramas, medidaSel) : null;

  const macrosEm = (a: AlimentoCompleto, g: number) => ({
    kcal: a.kcal * g / (a.gramas || 100),
    P: a.proteinas * g / (a.gramas || 100),
    L: a.lipidios * g / (a.gramas || 100),
    C: a.carboidratos * g / (a.gramas || 100),
  });
  const subM = sel ? macrosEm(sel, gramas) : null;
  const mainM = alimentoPrincipal ? macrosEm(alimentoPrincipal, gramas) : null;
  const diffOk = (d: number, b: number) => Math.abs(d) <= Math.max(2, Math.abs(b) * 0.15);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
        <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-turquesa" /> Adicionar Substituto
            </h3>
            <button onClick={handleClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar na TACO (635 alimentos)..." value={busca}
                onChange={e => { setBusca(e.target.value); setQtd(20); setSel(null); setMedidaSel(null) }}
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-turquesa" autoFocus />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: "todas", label: "Todas" },
                { key: "Arroz", label: "Cereais" },
                { key: "Feijão", label: "Leguminosas" },
                { key: "Frango", label: "Carnes" },
                { key: "Ovo", label: "Ovos/Laticínios" },
                { key: "Banana", label: "Frutas" },
                { key: "Batata", label: "Legumes" },
                { key: "Azeite", label: "Gorduras" },
                { key: "Castanha", label: "Oleaginosas" },
                { key: "Peixe", label: "Peixes" },
                { key: "Queijo", label: "Queijos" },
                { key: "Pão", label: "Panificados" },
                { key: "Leite", label: "Bebidas" },
              ].map(cat => (
                <button key={cat.key} onClick={() => setCategoria(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${categoria === cat.key ? 'bg-petroleo text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {resultados.slice(0, qtd).map(alim => (
              <button key={alim.id} onClick={() => { setSel(alim); setGramas(alim.gramas || 100); setMedidaSel(null) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${sel?.id === alim.id ? 'border-turquesa bg-turquesa/10 ring-1 ring-turquesa' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{alim.nome}</span>
                  <span className="text-xs font-medium text-gray-500">{alim.kcal} kcal</span>
                </div>
                <p className="text-xs text-gray-400">P:{alim.proteinas}g L:{alim.lipidios}g C:{alim.carboidratos}g</p>
              </button>
            ))}
            {resultados.length > qtd && (
              <button onClick={() => setQtd(p => p + 20)} className="w-full text-center text-xs text-turquesa font-medium py-2">
                Ver +{Math.min(20, resultados.length - qtd)}
              </button>
            )}
            {resultados.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhum resultado</p>}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 shrink-0 space-y-3">
            {sel && medidas.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Medida caseira:</label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg p-1">
                  {medidas.map((med, i) => (
                    <button key={`med_${i}`} onClick={() => { setMedidaSel(med); setGramas(med.gramas) }}
                      title={`${med.gramas}g`}
                      className={`flex-1 text-left px-2 py-1 rounded text-xs transition-all ${medidaSel?.rotulo === med.rotulo && medidaSel?.gramas === med.gramas
                        ? 'bg-turquesa/10 text-turquesa font-medium border border-turquesa/30'
                        : med.custom
                          ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-200/50 dark:border-amber-800/50'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {med.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sel && alimentoPrincipal && subM && mainM && (
              <div className="rounded-lg border border-petroleo/20 dark:border-petroleo/40 bg-petroleo/5 p-3">
                <p className="text-xs font-semibold text-petroleo dark:text-turquesa mb-2">
                  Comparativo a {gramas}g do alimento:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-white dark:bg-gray-800 border border-amber-200 p-2">
                    <p className="font-medium text-amber-700 dark:text-amber-400">{sel.nome}</p>
                    <p className="text-gray-600 dark:text-gray-300">{Math.round(subM.kcal)} kcal</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      P:{subM.P.toFixed(1)} L:{subM.L.toFixed(1)} C:{subM.C.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-md bg-white dark:bg-gray-800 border border-petroleo/30 p-2">
                    <p className="font-medium text-petroleo dark:text-turquesa">{alimentoPrincipal.nome}</p>
                    <p className="text-gray-600 dark:text-gray-300">{Math.round(mainM.kcal)} kcal</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      P:{mainM.P.toFixed(1)} L:{mainM.L.toFixed(1)} C:{mainM.C.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2 text-xs">
                  {([
                    ["P", subM.P - mainM.P],
                    ["L", subM.L - mainM.L],
                    ["C", subM.C - mainM.C],
                  ] as [string, number][]).map(([k, d]) => (
                    <span key={k} className={`px-1.5 py-0.5 rounded font-bold ${diffOk(d, k === "P" ? mainM.P : k === "L" ? mainM.L : mainM.C)
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"}`}>
                      {k} {d >= 0 ? "+" : ""}{d.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="w-28">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Quantidade (g)</label>
                <input type="number" value={gramas} onChange={e => setGramas(Math.max(0.1, parseFloat(e.target.value) || 100))}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              {sel && (
                <div className="flex-1 text-xs text-gray-500 pb-1">
                  <span className="font-medium text-gray-900">{sel.nome}</span>
                  {medidaPreview && <p className="text-turquesa font-medium">Medida: {medidaPreview}</p>}
                  <p>{Math.round(sel.kcal * gramas / sel.gramas)} kcal</p>
                </div>
              )}
              <Button size="sm" disabled={!sel} onClick={() => {
                if (sel) {
                  onSelecionar(sel, gramas, medidaSel ? rotuloMedidaPorGramas(gramas, medidaSel) : undefined)
                  onClose(); setSel(null); setGramas(100); setMedidaSel(null); setBusca(""); setQtd(20)
                }
              }}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
