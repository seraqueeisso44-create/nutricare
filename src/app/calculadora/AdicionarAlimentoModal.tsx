"use client";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { bancoAlimentos, buscarAlimentos, carregarMedidasCustom, criarMedidaCustom, removerMedidaCustom } from "@/lib/alimentos";
import type { AlimentoCompleto } from "@/lib/alimentos";
import type { MedidaCaseiraCustom } from "@/lib/alimentos";
import { Plus, X, Search, Trash2, Ruler } from "lucide-react";

interface MedidaCaseira {
  rotulo: string
  gramas: number
}

function gerarMedidas(alimento: AlimentoCompleto): MedidaCaseira[] {
  const medidas: MedidaCaseira[] = []
  const b = alimento.gramas
  const k = alimento.kcal ?? 0
  const densidade = k > 0 ? Math.min(1.5, Math.max(0.3, k / 200)) : 0.8
  const est = (ml: number) => Math.round(ml * densidade)
  const m = alimento.medidaCaseira

  if (m && m.includes(";")) {
    const partes = m.split(";")
    for (const p of partes) {
      const match = p.match(/(.+?)\s*=\s*([\d.]+)\s*g\s*/)
      if (match) {
        const rotulo = match[1].trim().replace(/\s+/g, " ")
        const gramas = parseFloat(match[2])
        medidas.push({ rotulo, gramas })
      }
    }
  } else if (m && m !== `${b}g`) {
    const partes = m.match(/^([\d\/,.]+)?\s*(.+)/)
    if (partes) {
      const unidade = (partes[2] || m).trim()
      medidas.push({ rotulo: `1 ${unidade}`, gramas: b })
      medidas.push({ rotulo: `1/2 ${unidade}`, gramas: Math.round(b / 2) })
      medidas.push({ rotulo: `2 ${unidade}`, gramas: b * 2 })
    }
  }

  medidas.push({ rotulo: `${b}g (padrão)`, gramas: b })
  medidas.push({ rotulo: `Colher de café`, gramas: Math.max(1, est(2)) })
  medidas.push({ rotulo: `Colher de chá`, gramas: Math.max(1, est(5)) })
  medidas.push({ rotulo: `Colher de sopa`, gramas: Math.max(1, est(15)) })
  medidas.push({ rotulo: `Colher de servir`, gramas: Math.max(1, est(30)) })
  medidas.push({ rotulo: `Concha média`, gramas: Math.max(1, est(100)) })
  medidas.push({ rotulo: `Escumadeira média`, gramas: Math.max(1, est(80)) })
  medidas.push({ rotulo: `Pegador médio`, gramas: Math.max(1, est(80)) })
  medidas.push({ rotulo: `Xícara de chá (200mL)`, gramas: Math.max(1, est(200)) })
  medidas.push({ rotulo: `Copo americano (200mL)`, gramas: Math.max(1, est(200)) })
  medidas.push({ rotulo: `Prato raso`, gramas: Math.max(1, est(250)) })
  medidas.push({ rotulo: `Unidade média`, gramas: b })
  medidas.push({ rotulo: `Fatia média`, gramas: Math.round(b * 0.6) })
  medidas.push({ rotulo: `½ unidade`, gramas: Math.round(b / 2) })

  const vistos = new Set<number>()
  return medidas.filter(m => { if (vistos.has(m.gramas)) return false; vistos.add(m.gramas); return true })
}

interface Props {
  aberto: boolean
  onClose: () => void
  onAdicionar: (alimento: AlimentoCompleto, gramas: number, medidaCaseira?: string) => void
  nomeRefeicao: string
}

export function AdicionarAlimentoModal({ aberto, onClose, onAdicionar, nomeRefeicao }: Props) {
  const [busca, setBusca] = useState("")
  const [categoria, setCategoria] = useState("todas")
  const [sel, setSel] = useState<AlimentoCompleto | null>(null)
  const [medidaSel, setMedidaSel] = useState<MedidaCaseira | null>(null)
  const [medidaQtd, setMedidaQtd] = useState(1)
  const [medidasCustom, setMedidasCustom] = useState<MedidaCaseiraCustom[]>([])
  const [criando, setCriando] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [novoGramas, setNovoGramas] = useState<number>(0)

  useEffect(() => {
    if (sel) {
      setMedidasCustom(carregarMedidasCustom(sel.id))
      setMedidaSel(null)
      setMedidaQtd(1)
      setCriando(false)
      setNovoNome("")
      setNovoGramas(0)
    }
  }, [sel])

  const resultados = useMemo(() => {
    const base = busca.length >= 2 ? buscarAlimentos(busca) : bancoAlimentos
    if (categoria === "todas") return base
    return base.filter(a => a.nome.toLowerCase().includes(categoria.toLowerCase()))
  }, [busca, categoria])

  const reset = () => {
    setBusca(""); setCategoria("todas"); setSel(null); setMedidaSel(null); setMedidaQtd(1)
    setCriando(false); setNovoNome(""); setNovoGramas(0); setMedidasCustom([])
  }

  const handleCriar = async () => {
    if (!sel || !novoNome.trim() || !novoGramas) return
    const nova = await criarMedidaCustom(sel.id, novoNome.trim(), novoGramas)
    setMedidasCustom(carregarMedidasCustom(sel.id))
    setMedidaSel({ rotulo: nova.rotulo, gramas: nova.gramas })
    setNovoNome("")
    setNovoGramas(0)
    setCriando(false)
  }

  const handleExcluir = async (id: string) => {
    await removerMedidaCustom(id)
    setMedidasCustom(carregarMedidasCustom(sel?.id || ""))
    if (medidaSel) setMedidaSel(null)
  }

  if (!aberto) return null

  const todasMedidas: (MedidaCaseira & { custom?: boolean; customId?: string })[] = [
    ...medidasCustom.map(m => ({ rotulo: m.rotulo, gramas: m.gramas, custom: true, customId: m.id })),
    ...gerarMedidas(sel || bancoAlimentos[0]),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { onClose(); reset() }}>
      <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-turquesa" /> Adicionar a: {nomeRefeicao}
          </h3>
          <button onClick={() => { onClose(); reset() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar na TACO (597 alimentos)..." value={busca}
              onChange={e => { setBusca(e.target.value); setSel(null); setMedidaSel(null) }}
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-turquesa dark:text-white" autoFocus />
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoria === cat.key ? 'bg-petroleo text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {resultados.slice(0, 60).map(alim => (
            <button key={alim.id} onClick={() => setSel(alim)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${sel?.id === alim.id ? 'border-turquesa bg-turquesa/10 ring-1 ring-turquesa' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{alim.nome}</span>
                <span className="text-xs font-medium text-gray-500">{alim.kcal} kcal</span>
              </div>
              <p className="text-xs text-gray-400">P:{alim.proteinas}g L:{alim.lipidios}g C:{alim.carboidratos}g</p>
            </button>
          ))}
          {resultados.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhum resultado. Digite pelo menos 2 caracteres.</p>}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-3">
          {sel && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Medida:</label>
                <button onClick={() => setCriando(!criando)}
                  className="flex items-center gap-1 text-xs font-medium text-turquesa hover:text-turquesa/80 transition-colors px-2 py-0.5 rounded hover:bg-turquesa/10">
                  <Ruler className="w-3 h-3" /> Criar medida caseira
                </button>
              </div>

              {criando && (
                <div className="flex items-end gap-2 p-2.5 mb-2 bg-turquesa/5 border border-turquesa/20 rounded-lg">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">Nome da medida</label>
                    <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                      placeholder="Ex: Concha grande, Pires, etc."
                      className="w-full h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs dark:text-white" />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">Gramas</label>
                    <input type="number" value={novoGramas || ""} onChange={e => setNovoGramas(parseFloat(e.target.value) || 0)}
                      placeholder="g" min={0} step={1}
                      className="w-full h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-center dark:text-white" />
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={handleCriar}
                    disabled={!novoNome.trim() || !novoGramas}>
                    <Plus className="w-3 h-3" /> Salvar
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg p-1">
                {todasMedidas.map((med, i) => (
                  <div key={`${med.custom ? "c" : "s"}_${i}`}
                    className={`flex items-center gap-1 group ${medidaSel?.rotulo === med.rotulo && medidaSel?.gramas === med.gramas ? '' : ''}`}>
                    <button onClick={() => setMedidaSel(med)} title={`${med.gramas}g`}
                      className={`flex-1 text-left px-2 py-1 rounded text-xs transition-all ${medidaSel?.rotulo === med.rotulo && medidaSel?.gramas === med.gramas
                        ? 'bg-turquesa/10 text-turquesa font-medium border border-turquesa/30'
                        : med.custom
                          ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium border border-amber-200/50 dark:border-amber-700/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                      {med.rotulo}
                    </button>
                    {med.custom && (
                      <button onClick={() => handleExcluir(med.customId!)}
                        className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Excluir medida">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="w-24">
              <label className="text-xs text-gray-500 mb-1 block">Qtd</label>
              <input type="number" value={medidaQtd} min={0.1} step={0.5} onChange={e => setMedidaQtd(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-full h-9 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center dark:text-white" />
            </div>
            {sel && (
              <div className="flex-1 text-xs text-gray-500 pb-1">
                <span className="font-medium text-gray-900 dark:text-white">{sel.nome}</span>
                <p>{(medidaSel?.gramas ?? 0) * medidaQtd}g · {Math.round(sel.kcal * (medidaSel?.gramas ?? sel.gramas) * medidaQtd / sel.gramas)} kcal</p>
              </div>
            )}
            <Button size="sm" disabled={!sel}
              onClick={() => {
                if (!sel) return
                const gramas = (medidaSel?.gramas ?? sel.gramas) * medidaQtd
                const medidaBase = medidaSel?.rotulo ?? `${sel.gramas}g (padrão)`
                const medidaTexto = medidaQtd === 1 ? medidaBase : `${medidaQtd}x ${medidaBase}`
                onAdicionar(sel, gramas, medidaTexto)
                reset()
              }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
