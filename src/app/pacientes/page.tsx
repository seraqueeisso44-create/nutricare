"use client"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { TopNav } from "@/components/layout/TopNav"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { PacienteModal } from "./PacienteModal"
import {
  carregarPacientes, criarPaciente, atualizarPaciente, removerPaciente,
  calcularIdade, calcularIMC, type Paciente,
} from "@/lib/pacientes"
import {
  Plus, Search, Users, UserCheck, UserX, Pencil, Trash2,
  Calculator, Mail, Phone, Target, Activity, ArrowRight,
} from "lucide-react"

export default function PacientesPage() {
  const { addToast } = useToast()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<"todos" | "ativo" | "inativo">("todos")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Paciente | null>(null)
  const [confirmarRemocao, setConfirmarRemocao] = useState<Paciente | null>(null)

  useEffect(() => { carregarPacientes().then(setPacientes) }, [])

  const recarregar = async () => { const lista = await carregarPacientes(); setPacientes(lista) }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return pacientes.filter(p => {
      const matchBusca = !q || p.nome.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.telefone.includes(q)
      const matchFiltro = filtro === "todos" || p.status === filtro
      return matchBusca && matchFiltro
    })
  }, [pacientes, busca, filtro])

  const stats = useMemo(() => ({
    total: pacientes.length,
    ativos: pacientes.filter(p => p.status === "ativo").length,
    inativos: pacientes.filter(p => p.status === "inativo").length,
  }), [pacientes])

  const abrirNovo = () => { setEditando(null); setModalAberto(true) }
  const abrirEdicao = (p: Paciente) => { setEditando(p); setModalAberto(true) }

  const handleSalvar = async (dados: Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">) => {
    if (editando) {
      await atualizarPaciente(editando.id, dados)
      addToast("success", "Paciente atualizado")
    } else {
      await criarPaciente(dados)
      addToast("success", "Paciente cadastrado")
    }
    setModalAberto(false)
    setEditando(null)
    await recarregar()
  }

  const handleRemover = async () => {
    if (!confirmarRemocao) return
    await removerPaciente(confirmarRemocao.id)
    addToast("success", "Paciente removido")
    setConfirmarRemocao(null)
    await recarregar()
  }

  const statCards = [
    {
      label: "Total de pacientes", valor: stats.total, icon: Users,
      gradient: "from-petroleo to-verde",
      iconBg: "bg-white/20",
    },
    {
      label: "Ativos", valor: stats.ativos, icon: UserCheck,
      gradient: "from-[#1B4D3A] to-[#2E6B4F]",
      iconBg: "bg-white/20",
    },
    {
      label: "Inativos", valor: stats.inativos, icon: UserX,
      gradient: "from-[#8B7355] to-[#A08B6A]",
      iconBg: "bg-white/20",
    },
  ]

  return (
    <div className="min-h-screen bg-bege dark:bg-[#0B1F17] transition-colors duration-300">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-verde-escuro-txt dark:text-branco-suave tracking-tight">
              Pacientes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cadastre e gerencie seus pacientes de forma simples
            </p>
          </div>
          <Button onClick={abrirNovo} className="btn-gradient text-white shadow-lg">
            <Plus className="w-4 h-4" /> Novo Paciente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(c => {
            const Icon = c.icon
            return (
              <div key={c.label}
                className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-br ${c.gradient}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
                <div className="relative flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${c.iconBg} backdrop-blur-sm flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">{c.valor}</p>
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{c.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-[#123328] rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors duration-300">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar por nome, e-mail ou telefone..." value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-11 pr-4 h-11 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-turquesa/50 focus:border-turquesa dark:text-white transition-all placeholder:text-gray-400" />
            </div>
            <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
              {([["todos", "Todos"], ["ativo", "Ativos"], ["inativo", "Inativos"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setFiltro(k)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    filtro === k
                      ? "bg-petroleo text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-petroleo/5 dark:bg-petroleo/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-petroleo/30 dark:text-turquesa/30" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {pacientes.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado."}
              </p>
              {pacientes.length === 0 && (
                <Button className="mt-6" size="sm" onClick={abrirNovo}>
                  <Plus className="w-4 h-4" /> Cadastrar primeiro paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filtrados.map(p => {
                const idade = calcularIdade(p.dataNascimento)
                const imc = calcularIMC(p.peso, p.altura)
                return (
                  <div key={p.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 hover:bg-bege/50 dark:hover:bg-white/[0.02] transition-colors duration-200">
                    <Link href={`/pacientes/${p.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0 group">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: "linear-gradient(135deg, #0F3D2E 0%, #245C45 100%)",
                        }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-verde-escuro-txt dark:text-branco-suave truncate group-hover:text-turquesa transition-colors duration-200">
                            {p.nome}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            p.status === "ativo"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {p.status === "ativo" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {p.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {p.email}</span>}
                          {p.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.telefone}</span>}
                          {p.objetivo && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {p.objetivo}</span>}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-5 text-xs text-gray-500 lg:mr-4">
                      {idade > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-verde-escuro-txt dark:text-branco-suave text-sm">{idade}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">anos</p>
                        </div>
                      )}
                      {p.peso > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-verde-escuro-txt dark:text-branco-suave text-sm">{p.peso}<span className="text-[10px] font-normal">kg</span></p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">peso</p>
                        </div>
                      )}
                      {imc > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-verde-escuro-txt dark:text-branco-suave text-sm">{imc}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">IMC</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/calculadora?paciente=${p.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-turquesa hover:bg-turquesa/10 transition-all duration-200"
                        title="Calcular dieta">
                        <Calculator className="w-4 h-4" /> Calcular
                        <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </Link>
                      <button onClick={() => abrirEdicao(p)}
                        className="p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 text-gray-400 hover:text-amber-500 transition-all duration-200" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmarRemocao(p)}
                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-all duration-200" title="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <PacienteModal
        aberto={modalAberto}
        paciente={editando}
        onClose={() => { setModalAberto(false); setEditando(null) }}
        onSalvar={handleSalvar}
      />

      {confirmarRemocao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setConfirmarRemocao(null)}>
          <div className="bg-white dark:bg-[#123328] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800/50"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-verde-escuro-txt dark:text-branco-suave mb-1">Remover paciente</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Tem certeza que deseja remover <strong>{confirmarRemocao.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmarRemocao(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleRemover}>Remover</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
