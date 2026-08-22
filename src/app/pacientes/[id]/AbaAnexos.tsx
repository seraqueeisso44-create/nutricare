"use client"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import type { Anexo } from "@/lib/pacientes"
import { Upload, FileText, Trash2, Download, X } from "lucide-react"

interface Props {
  titulo: string
  descricao: string
  anexos: Anexo[]
  somenteImagens?: boolean
  onChange: (anexos: Anexo[]) => void
}

function lerArquivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AbaAnexos({ titulo, descricao, anexos, somenteImagens, onChange }: Props) {
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Anexo | null>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const novos: Anexo[] = []
    for (const file of Array.from(files)) {
      if (file.size > 4 * 1024 * 1024) {
        addToast("error", `"${file.name}" excede 4MB e não foi anexado`)
        continue
      }
      try {
        const conteudo = await lerArquivo(file)
        novos.push({
          id: `ax_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          nome: file.name,
          tipo: file.type,
          data: new Date().toISOString(),
          descricao: "",
          conteudo,
        })
      } catch {
        addToast("error", `Falha ao ler "${file.name}"`)
      }
    }
    if (novos.length) {
      onChange([...novos, ...anexos])
      addToast("success", `${novos.length} arquivo(s) anexado(s)`)
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  const remover = (id: string) => onChange(anexos.filter(a => a.id !== id))
  const isImagem = (a: Anexo) => a.tipo.startsWith("image/")

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{titulo}</h2>
          <p className="text-xs text-gray-500">{descricao}</p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()}><Upload className="w-4 h-4" /> Anexar</Button>
        <input ref={inputRef} type="file" multiple accept={somenteImagens ? "image/*" : "*"} className="hidden"
          onChange={e => handleUpload(e.target.files)} />
      </div>

      <div onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-turquesa transition-colors mb-4">
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Clique ou arraste arquivos aqui</p>
        <p className="text-xs text-gray-400">Máx. 4MB por arquivo</p>
      </div>

      {anexos.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-4">Nenhum arquivo anexado.</p>
      ) : somenteImagens ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {anexos.map(a => (
            <div key={a.id} className="group relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
              {isImagem(a) ? (
                <img src={a.conteudo} alt={a.nome} className="w-full h-32 object-cover cursor-pointer" onClick={() => setPreview(a)} />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-800"><FileText className="w-8 h-8 text-gray-400" /></div>
              )}
              <div className="p-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{a.nome}</p>
                <p className="text-[10px] text-gray-400">{new Date(a.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => remover(a.id)}
                className="absolute top-1 right-1 p-1 rounded bg-white/90 dark:bg-gray-900/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              {isImagem(a)
                ? <img src={a.conteudo} alt={a.nome} className="w-10 h-10 rounded object-cover cursor-pointer" onClick={() => setPreview(a)} />
                : <FileText className="w-8 h-8 text-turquesa shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.nome}</p>
                <p className="text-xs text-gray-400">{new Date(a.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <a href={a.conteudo} download={a.nome} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-turquesa" title="Baixar">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => remover(a.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500" title="Remover">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white p-2"><X className="w-6 h-6" /></button>
          <img src={preview.conteudo} alt={preview.nome} className="max-w-full max-h-[90vh] rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
