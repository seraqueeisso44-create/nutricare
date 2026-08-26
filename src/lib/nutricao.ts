export interface DadosAntropometricos {
  peso: number
  altura: number
  idade: number
  sexo: "masculino" | "feminino"
  mlg?: number
  gorduraPercentual?: number
  gestante?: boolean
  semanasGestacao?: number
  fatorInjuria?: number
  metAtividades?: { descricao: string; met: number; minutosSemana: number }[]
}

export interface ResultadoTMB {
  formula: string
  tmb: number
  tmbKg: number
}

export interface ResultadoGET {
  tmb: ResultadoTMB
  fatorAtividade: number
  get: number
  getKg: number
  ajustes: { nome: string; valor: number }[]
}

export interface MacrosPrescritas {
  proteinasG: number
  lipidiosG: number
  carboidratosG: number
  fibrasG?: number
  proteinasKcal: number
  lipidiosKcal: number
  carboidratosKcal: number
  kcalTotal: number
  metodos: string
}

export interface Alimento {
  id: string
  nome: string
  origem: "TBCA" | "TACO" | "WebDiet" | "Fabricante" | "Receita"
  medidaCaseira: string
  gramas: number
  proteinas: number
  lipidios: number
  carboidratos: number
  fibras?: number
  kcal: number
}

export interface Refeicao {
  nome: string
  horario: string
  alimentos: { alimento: Alimento; quantidade: number; medidaCaseira?: string; customNome?: string }[]
  totalProteinas: number
  totalLipidios: number
  totalCarboidratos: number
  totalFibras: number
  totalKcal: number
  densidadeCalorica: number
}

export interface Cardapio {
  refeicoes: Refeicao[]
  totalProteinas: number
  totalLipidios: number
  totalCarboidratos: number
  totalFibras: number
  totalKcal: number
}

// ===== FÓRMULAS TMB =====

export function calcularTMB(
  formula: string,
  peso: number,
  altura: number,
  idade: number,
  sexo: "masculino" | "feminino",
  mlg?: number
): ResultadoTMB {
  let tmb = 0

  switch (formula) {
    case "Mifflin-St Jeor (1990)":
      if (sexo === "masculino")
        tmb = 10 * peso + 6.25 * altura - 5 * idade + 5
      else
        tmb = 10 * peso + 6.25 * altura - 5 * idade - 161
      break

    case "Harris-Benedict (1919)":
      if (sexo === "masculino")
        tmb = 66.473 + 13.7516 * peso + 5.0033 * altura - 6.755 * idade
      else
        tmb = 655.0955 + 9.5634 * peso + 1.8496 * altura - 4.6756 * idade
      break

    case "Harris-Benedict (1984)":
      if (sexo === "masculino")
        tmb = 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade
      else
        tmb = 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * idade
      break

    case "FAO/WHO (2004)":
      if (sexo === "masculino") {
        if (idade <= 3) tmb = 60.9 * peso - 54
        else if (idade <= 10) tmb = 22.7 * peso + 495
        else if (idade <= 18) tmb = 17.5 * peso + 651
        else if (idade <= 30) tmb = 15.3 * peso + 679
        else if (idade <= 60) tmb = 11.6 * peso + 879
        else tmb = 13.5 * peso + 487
      } else {
        if (idade <= 3) tmb = 61 * peso - 51
        else if (idade <= 10) tmb = 22.5 * peso + 499
        else if (idade <= 18) tmb = 12.2 * peso + 746
        else if (idade <= 30) tmb = 14.7 * peso + 496
        else if (idade <= 60) tmb = 8.7 * peso + 829
        else tmb = 10.5 * peso + 596
      }
      break

    case "EER/IOM (2005)":
      if (sexo === "masculino")
        tmb = 662 - 9.53 * idade + 15.91 * peso + 539.6 * (altura / 100)
      else
        tmb = 354 - 6.91 * idade + 9.36 * peso + 726 * (altura / 100)
      break

    case "Cunningham (1980)":
      if (!mlg) throw new Error("MLG é obrigatório para Cunningham")
      tmb = 500 + 22.4 * mlg
      break

    case "Katch-McArdle":
      if (!mlg) throw new Error("MLG é obrigatório para Katch-McArdle")
      tmb = 370 + 21.6 * mlg
      break

    case "Henry & Rees (1991)":
      if (sexo === "masculino") {
        if (idade <= 3) tmb = 0.255 * peso - 0.141
        else if (idade <= 10) tmb = 0.093 * peso + 2.159
        else if (idade <= 18) tmb = 0.074 * peso + 2.754
        else tmb = 0.049 * peso + 2.459
        tmb = tmb * 239 // convert MJ to kcal
      } else {
        if (idade <= 3) tmb = 0.246 * peso - 0.096
        else if (idade <= 10) tmb = 0.084 * peso + 2.122
        else if (idade <= 18) tmb = 0.056 * peso + 2.898
        else tmb = 0.038 * peso + 2.755
        tmb = tmb * 239
      }
      break

    case "Tinsley (2018)":
      if (sexo === "masculino")
        tmb = 24.8 * peso + 10
      else
        tmb = 24.8 * peso - 10
      break

    default:
      // Mifflin-St Jeor como padrão
      if (sexo === "masculino")
        tmb = 10 * peso + 6.25 * altura - 5 * idade + 5
      else
        tmb = 10 * peso + 6.25 * altura - 5 * idade - 161
  }

  return {
    formula,
    tmb: Math.round(tmb),
    tmbKg: Math.round((tmb / peso) * 10) / 10,
  }
}

export const fatoresAtividade = [
  { valor: 1.0, rotulo: "Não utilizar" },
  { valor: 1.2, rotulo: "Sedentário" },
  { valor: 1.375, rotulo: "Leve" },
  { valor: 1.55, rotulo: "Moderada" },
  { valor: 1.725, rotulo: "Intensa" },
  { valor: 1.9, rotulo: "Muito intensa" },
]

export function calcularGET(
  tmb: ResultadoTMB,
  fatorAtividade: number,
  dados: DadosAntropometricos
): ResultadoGET {
  const ajustes: { nome: string; valor: number }[] = []
  let get = tmb.tmb * fatorAtividade

  if (dados.fatorInjuria && dados.fatorInjuria > 0) {
    const adicional = tmb.tmb * (dados.fatorInjuria - 1)
    ajustes.push({ nome: `Fator de injúria (${dados.fatorInjuria}x)`, valor: Math.round(adicional) })
    get = get * dados.fatorInjuria
  }

  if (dados.gestante && dados.semanasGestacao) {
    let adicional = 0
    if (dados.semanasGestacao <= 13) adicional = 0
    else if (dados.semanasGestacao <= 28) adicional = 340
    else adicional = 452
    ajustes.push({ nome: `Adicional gestante (${dados.semanasGestacao}sem)`, valor: adicional })
    get += adicional
  }

  if (dados.metAtividades && dados.metAtividades.length > 0) {
    const totalMET = dados.metAtividades.reduce(
      (sum, a) => sum + (a.met * a.minutosSemana * dados.peso) / 60 / 7,
      0
    )
    if (totalMET > 0) {
      ajustes.push({ nome: `Adicional MET (atividades programadas)`, valor: Math.round(totalMET) })
      get += totalMET
    }
  }

  return {
    tmb,
    fatorAtividade,
    get: Math.round(get),
    getKg: Math.round((get / dados.peso) * 10) / 10,
    ajustes,
  }
}

// ===== MACRONUTRIENTES =====

export function calcularMacrosMetodoA(
  peso: number,
  proteinasKg: number,
  lipidiosKg: number,
  carboidratosKg: number
): MacrosPrescritas {
  const proteinasG = Math.round(proteinasKg * peso)
  const lipidiosG = Math.round(lipidiosKg * peso)
  const carboidratosG = Math.round(carboidratosKg * peso)
  const proteinasKcal = proteinasG * 4
  const lipidiosKcal = lipidiosG * 9
  const carboidratosKcal = carboidratosG * 4
  const kcalTotal = proteinasKcal + lipidiosKcal + carboidratosKcal

  return {
    proteinasG, lipidiosG, carboidratosG,
    proteinasKcal, lipidiosKcal, carboidratosKcal,
    kcalTotal,
    metodos: `Fórmula de bolso (g/kg): PTN ${proteinasKg}g/kg | LIP ${lipidiosKg}g/kg | CHO ${carboidratosKg}g/kg`,
  }
}

export function calcularMacrosMetodoB(
  get: number,
  percentProteinas: number,
  percentLipidios: number,
  percentCarboidratos: number
): MacrosPrescritas {
  const proteinasKcal = Math.round(get * (percentProteinas / 100))
  const lipidiosKcal = Math.round(get * (percentLipidios / 100))
  const carboidratosKcal = Math.round(get * (percentCarboidratos / 100))
  const proteinasG = Math.round(proteinasKcal / 4)
  const lipidiosG = Math.round(lipidiosKcal / 9)
  const carboidratosG = Math.round(carboidratosKcal / 4)
  const kcalTotal = proteinasKcal + lipidiosKcal + carboidratosKcal

  return {
    proteinasG, lipidiosG, carboidratosG,
    proteinasKcal, lipidiosKcal, carboidratosKcal,
    kcalTotal,
    metodos: `Percentual do GET: PTN ${percentProteinas}% | LIP ${percentLipidios}% | CHO ${percentCarboidratos}%`,
  }
}

// ===== VALIDAÇÃO =====

export interface TabelaValidacao {
  parametro: string
  prescrito: string
  cardapio: string
  diferenca: string
  alerta?: "ok" | "atencao" | "critico"
}

export function gerarTabelaValidacao(
  prescrito: MacrosPrescritas,
  cardapio: Cardapio
): TabelaValidacao[] {
  const diff = (p: number, c: number) => c - p
  const pct = (p: number, c: number) => p > 0 ? Math.round((diff(p, c) / p) * 100) : 0

  const linhas: TabelaValidacao[] = [
    {
      parametro: "Proteínas totais",
      prescrito: `${prescrito.proteinasG}g (${prescrito.proteinasKcal} kcal)`,
      cardapio: `${cardapio.totalProteinas}g (${Math.round(cardapio.totalProteinas * 4)} kcal)`,
      diferenca: `${diff(prescrito.proteinasG, cardapio.totalProteinas)}g`,
      alerta: Math.abs(pct(prescrito.proteinasG, cardapio.totalProteinas)) > 10 ? "atencao" : "ok",
    },
    {
      parametro: "Lipídios totais",
      prescrito: `${prescrito.lipidiosG}g (${prescrito.lipidiosKcal} kcal)`,
      cardapio: `${cardapio.totalLipidios}g (${Math.round(cardapio.totalLipidios * 9)} kcal)`,
      diferenca: `${diff(prescrito.lipidiosG, cardapio.totalLipidios)}g`,
      alerta: Math.abs(pct(prescrito.lipidiosG, cardapio.totalLipidios)) > 10 ? "atencao" : "ok",
    },
    {
      parametro: "Carboidratos totais",
      prescrito: `${prescrito.carboidratosG}g (${prescrito.carboidratosKcal} kcal)`,
      cardapio: `${cardapio.totalCarboidratos}g (${Math.round(cardapio.totalCarboidratos * 4)} kcal)`,
      diferenca: `${diff(prescrito.carboidratosG, cardapio.totalCarboidratos)}g`,
      alerta: Math.abs(pct(prescrito.carboidratosG, cardapio.totalCarboidratos)) > 10 ? "atencao" : "ok",
    },
    {
      parametro: "Fibras totais",
      prescrito: `${prescrito.fibrasG || 0}g`,
      cardapio: `${cardapio.totalFibras}g`,
      diferenca: `${diff(prescrito.fibrasG || 0, cardapio.totalFibras)}g`,
      alerta: "ok",
    },
    {
      parametro: "Calorias totais",
      prescrito: `${prescrito.kcalTotal} kcal`,
      cardapio: `${cardapio.totalKcal} kcal`,
      diferenca: `${diff(prescrito.kcalTotal, cardapio.totalKcal)} kcal`,
      alerta: Math.abs(pct(prescrito.kcalTotal, cardapio.totalKcal)) > 10 ? "atencao" : "ok",
    },
  ]

  return linhas
}

export function classificarDensidadeCalorica(kcalPorG: number): string {
  if (kcalPorG <= 0.5) return "Muito baixa"
  if (kcalPorG <= 1.5) return "Baixa"
  if (kcalPorG <= 2.0) return "Moderada"
  return "Alta"
}
