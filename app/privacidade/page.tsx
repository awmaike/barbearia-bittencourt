import Link from "next/link";

export const metadata = { title: "Privacidade | Barbearia Bittencourt" };
export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <p className="eyebrow">Barbearia Bittencourt</p>
      <h1>Política de privacidade</h1>
      <p>
        Usamos nome, telefone, serviço, profissional, data, horário e
        observações somente para organizar e prestar o atendimento solicitado.
      </p>
      <h2>Como usamos os dados</h2>
      <p>
        As informações permitem confirmar, lembrar, alterar ou cancelar
        agendamentos, controlar pagamentos e manter o histórico necessário ao
        atendimento.
      </p>
      <h2>Armazenamento e acesso</h2>
      <p>
        Os registros ficam protegidos no sistema e são acessados apenas por
        pessoas autorizadas da barbearia. Não vendemos seus dados.
      </p>
      <h2>Base legal e segurança</h2>
      <p>
        O tratamento ocorre para executar o serviço solicitado e atender aos
        interesses legítimos de organização e segurança da agenda. Utilizamos
        controle de acesso, registros de auditoria e cópias de segurança.
      </p>
      <h2>Compartilhamento e retenção</h2>
      <p>
        Os dados podem ser processados pelos provedores de hospedagem e
        autenticação necessários ao funcionamento do sistema, sempre limitados
        à prestação técnica. Mantemos os registros enquanto forem úteis ao
        atendimento, à segurança e às obrigações legais, eliminando-os quando
        não forem mais necessários.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir correção ou exclusão de seus dados entrando em contato
        pelo WhatsApp da barbearia. Alguns registros poderão ser mantidos pelo
        prazo exigido por obrigações legais.
      </p>
      <h2>Contato</h2>
      <p>
        WhatsApp: (54) 99705-5804. Última atualização: 19 de agosto de 2026.
      </p>
      <Link className="button" href="/">
        Voltar ao site
      </Link>
    </main>
  );
}
