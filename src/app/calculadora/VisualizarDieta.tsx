"use client"
import { Button } from "@/components/ui/button"
import type { Cardapio } from "@/lib/nutricao"
import { FileText } from "lucide-react"
import type { AlimentoCompleto } from "@/lib/alimentos"

interface Props {
  cardapio: Cardapio
  substitutosColecao?: Record<string, { alimento: AlimentoCompleto; quantidade: number; medidaCaseira?: string; medidaCaseiraQtd?: number }[]>
}

export function VisualizarDieta({ cardapio, substitutosColecao = {} }: Props) {
  const handleAbrir = () => {
    const janela = window.open("", "_blank")
    if (!janela) return
    const html = gerarHTML(cardapio, substitutosColecao)
    janela.document.write(html)
    janela.document.close()
    janela.focus()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleAbrir}>
      <FileText className="w-4 h-4" /> Ver Prescrição
    </Button>
  )
}

function gerarHTML(cardapio: Cardapio, substitutosColecao: Record<string, { alimento: AlimentoCompleto; quantidade: number; medidaCaseira?: string; medidaCaseiraQtd?: number }[]>): string {
  const now = new Date()
  const dataStr = now.toLocaleDateString("pt-BR")

  const blocosRefeicoes = cardapio.refeicoes.map((ref, refIdx) => {
    const linhasAlimentos = ref.alimentos.map((item, alimIdx) => {
      const nomeItem = (item as any).customNome || item.alimento.nome
      const medida = (item as any).medidaCaseira || item.alimento.medidaCaseira || ""
      const medidaGramas = medida ? `${medida} — ${item.quantidade}g` : `${item.quantidade}g`
      return `<tr>
        <td>${nomeItem}</td>
        <td>${medidaGramas}</td>
      </tr>`
    }).join("")

    const blocosSubstituicoes = ref.alimentos.map((item, alimIdx) => {
      const subsKey = `${refIdx}_${alimIdx}`
      const subs = substitutosColecao[subsKey] || []
      if (subs.length === 0) return ""
      const nomeItem = (item as any).customNome || item.alimento.nome
      const opcoes = subs.map(s => {
        const qtdMedida = s.medidaCaseiraQtd || 1
        const medida = s.medidaCaseira || ""
        const medidaQtd = qtdMedida > 1 ? `${qtdMedida}x ${medida}` : medida
        const medidaGramas = medidaQtd ? `${medidaQtd} ${s.quantidade}g` : `${s.quantidade}g`
        return `${s.alimento.nome} (${medidaGramas})`
      }).join(" <strong>- ou -</strong> ")
      return `<p class="sub-item"><strong>• Opções de substituição para ${nomeItem}:</strong><br>${opcoes}</p>`
    }).join("")

    return `
      <div class="refeicao-bloco">
        <div class="refeicao-titulo">${ref.horario ? `${ref.horario} — ` : ""}${ref.nome}</div>
        <table class="tabela-alimentos">
          <thead>
            <tr>
              <th>Alimento</th>
              <th>Medida caseira / Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${linhasAlimentos}
          </tbody>
        </table>
        ${blocosSubstituicoes ? `<div class="substituicoes">${blocosSubstituicoes}</div>` : ""}
      </div>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prescrição Alimentar</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Georgia, 'Times New Roman', Times, serif;
    padding: 50px 60px;
    color: #000;
    background: #fff;
    line-height: 1.5;
  }

  @media print {
    body { padding: 30px 40px; }
    .no-print { display: none !important; }
    @page { margin: 2cm; }
  }

  .titulo {
    text-align: center;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 26px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 8px;
    color: #000;
  }

  .data {
    text-align: center;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 14px;
    color: #555;
    margin-bottom: 35px;
  }

  .refeicao-bloco {
    margin-bottom: 30px;
    page-break-inside: avoid;
  }

  .refeicao-titulo {
    background: #EDEDED;
    text-align: center;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 20px;
    font-weight: bold;
    padding: 14px 20px;
    border-radius: 6px;
    margin-bottom: 16px;
    color: #000;
  }

  .tabela-alimentos {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }

  .tabela-alimentos th,
  .tabela-alimentos td {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 18px;
    text-align: center;
    padding: 12px 16px;
    border: 1px solid #ddd;
  }

  .tabela-alimentos th {
    font-weight: bold;
    background: #f8f8f8;
    color: #333;
  }

  .tabela-alimentos td {
    color: #000;
  }

  .substituicoes {
    margin-top: 12px;
    padding-left: 4px;
  }

  .sub-item {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 17px;
    line-height: 1.6;
    margin-bottom: 10px;
    color: #000;
  }

  .rodape {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #ccc;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 11px;
    color: #999;
    text-align: center;
  }

  .no-print {
    margin-top: 25px;
    text-align: center;
  }

  .no-print button {
    padding: 10px 30px;
    font-size: 12pt;
    font-family: Georgia, 'Times New Roman', Times, serif;
    background: #333;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .no-print button:hover { background: #555; }
</style>
</head>
<body>

<div class="titulo">Prescrição Alimentar</div>
<div class="data">${dataStr}</div>

${blocosRefeicoes}

<div class="rodape">
  Documento gerado em ${dataStr} pelo NutriCare
</div>

<div class="no-print">
  <button onclick="window.print()">Imprimir / Salvar PDF</button>
</div>

</body>
</html>`
}
