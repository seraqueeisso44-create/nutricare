import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade — NutriCare",
  description: "Política de privacidade e proteção de dados pessoais do NutriCare. Conheça como seus dados são coletados, armazenados e protegidos conforme a LGPD.",
  robots: { index: true, follow: true },
}

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-[#F4F1EA] dark:bg-[#0B1F17] text-gray-800 dark:text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-[#C9975A] hover:underline">← Voltar ao início</Link>
          <h1 className="text-3xl font-bold text-[#0F3D2E] dark:text-[#C9975A]">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Última atualização: 26 de agosto de 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">1. Introdução</h2>
            <p>
              A presente Política de Privacidade descreve como o NutriCare (&quot;nós&quot;, &quot;nosso&quot;) coleta, utiliza, armazena e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.
            </p>
            <p>
              Ao utilizar o NutriCare, você concorda com as práticas descritas nesta política.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">2. Dados Coletados</h2>
            <p>Podemos coletar os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CPF, data de nascimento, sexo, profissão</li>
              <li><strong>Dados de saúde:</strong> peso, altura, medidas antropométricas, dados de exames, diagnósticos nutricionais, anamnese, prescrições dietéticas</li>
              <li><strong>Dados de uso:</strong> informações sobre como você interage com o aplicativo (páginas visitadas, funcionalidades utilizadas)</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, dispositivo</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">3. Finalidade do Tratamento</h2>
            <p>Os dados pessoais são tratados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Providenciar e melhorar os serviços nutricionais oferecidos pelo aplicativo</li>
              <li>Gerenciar prontuários e histórico de pacientes</li>
              <li>Realizar cálculos nutricionais (TMB, GET, prescrição dietética)</li>
              <li>Sincronizar dados entre dispositivos via nuvem</li>
              <li>Garantir a segurança e integridade da plataforma</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">4. Base Legal</h2>
            <p>O tratamento de dados é realizado com base em:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consentimento:</strong> autorização explícita do titular dos dados (art. 7º, I da LGPD)</li>
              <li><strong>Execução de contrato:</strong> prestação de serviços solicitados pelo usuário (art. 7º, V da LGPD)</li>
              <li><strong>Legítimo interesse:</strong> melhoria dos serviços e segurança da plataforma (art. 7º, IX da LGPD)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">5. Compartilhamento de Dados</h2>
            <p>
              Não compartilhamos seus dados pessoais com terceiros, exceto quando:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Necessário para cumprir obrigação legal ou regulatória</li>
              <li>AutORIZADO pelo titular dos dados</li>
              <li>Necessário para a execução de serviços essenciais (ex.: hospedagem em nuvem com criptografia)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">6. Armazenamento e Segurança</h2>
            <p>
              Os dados são armazenados em servidores com criptografia em trânsito (TLS/SSL) e em repouso. Utilizamos proveedores de nuvem que atendem aos padrões internacionais de segurança da informação (SOC 2, ISO 27001).
            </p>
            <p>
              Dados sensíveis de saúde são classificados como dados pessoais sob LGPD e recebem tratamento especial com acesso restrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">7. Retenção de Dados</h2>
            <p>
              Os dados pessoais são mantidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, ou até que o titular solicite sua exclusão. Dados de saúde podem ser retidos por período maior quando exigido por legislação sanitária aplicável.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">8. Direitos do Titular</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Informação sobre compartilhamento de dados</li>
              <li>Revogação do consentimento</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">9. Cookies e Tecnologias Similares</h2>
            <p>
              O NutriCare utiliza apenas cookies essenciais para o funcionamento do aplicativo (autenticação, preferências de tema, dados de sessão). Não utilizamos cookies de rastreamento ou analytics de terceiros.
            </p>
            <p>
              Os dados são armazenados localmente no dispositivo do usuário (localStorage) e sincronizados com a nuvem quando o usuário opta por essa funcionalidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">10. Transferência Internacional</h2>
            <p>
              Caso os dados sejam transferidos para servidores fora do Brasil, garantimos que tal transferência ocorrerá em conformidade com o art. 33 da LGPD, com as devidas salvaguardas de proteção.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">11. Menores de Idade</h2>
            <p>
              O NutriCare não é direcionado a menores de 16 anos. Não coletamos intencionalmente dados de menores sem a devida autorização dos responsáveis legais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">12. Alterações nesta Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações significativas por meio do aplicativo ou por e-mail.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#0F3D2E] dark:text-white">13. Contato</h2>
            <p>
              Em caso de dúvidas ou solicitações relacionadas aos seus dados pessoais, entre em contato pelo e-mail ou telefone cadastrado no aplicativo.
            </p>
            <p>
              Para exercício dos direitos previstos na LGPD, você pode contatar o nosso Encarregado de Proteção de Dados (DPO).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
