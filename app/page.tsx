import Booking from "./Booking";
import Gallery from "./Gallery";

const whatsapp =
  "https://wa.me/5554997055804?text=Ol%C3%A1%21%20Tenho%20uma%20d%C3%BAvida%20sobre%20meu%20agendamento.";

const services = [
  {
    name: "Corte masculino",
    duration: "25 min · R$ 40",
    note: "Do clássico ao atual, com acabamento preciso",
  },
  {
    name: "Barba",
    duration: "25 min · R$ 30",
    note: "Desenho, alinhamento e finalização",
  },
  {
    name: "Sobrancelha",
    duration: "10 min · R$ 15",
    note: "Acabamento cuidadoso para completar o visual",
  },
  {
    name: "Corte + barba",
    duration: "50 min · R$ 70",
    note: "A experiência completa Bittencourt",
  },
];

const experience = [
  {
    title: "Estilo",
    text: "Cortes que acompanham sua personalidade, do clássico ao moderno.",
  },
  {
    title: "Precisão",
    text: "Atenção aos detalhes para um resultado limpo e bem alinhado.",
  },
  {
    title: "Experiência",
    text: "Um espaço no coração da cidade para cuidar do seu visual.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="Navegação principal">
        <a
          className="brand"
          href="#inicio"
          aria-label="Barbearia Bittencourt — início"
        >
          <img
            className="brand-logo"
            src="/logo-bittencourt.png"
            width="150"
            height="150"
            alt="Barbearia Bittencourt"
          />
        </a>
        <div className="nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#profissionais">Profissionais</a>
          <a href="#sobre">A barbearia</a>
          <a href="#contato">Contato</a>
        </div>
        <a className="button button-small" href="#agendar">
          Agendar horário
        </a>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">Desde 2015 · Serafina Corrêa</p>
          <h1>
            Lugar para
            <br />
            <em>grandes homens.</em>
          </h1>
          <p className="hero-copy">
            Tradição, personalidade e cuidado em cada detalhe do seu visual.
          </p>
          <div className="hero-actions">
            <a className="button" href="#agendar">
              Agendar agora <span>↓</span>
            </a>
            <a className="text-link" href="#servicos">
              Conhecer os serviços ↓
            </a>
          </div>
          <div className="hero-proof">
            <span className="stars">✦</span>
            <span>
              <strong>Estabelecida em 2015</strong> · no centro de Serafina
              Corrêa
            </span>
          </div>
        </div>
        <div className="open-card">
          <span className="status-dot" />
          <div>
            <small>Agenda online</small>
            <strong>Escolha seu horário no site</strong>
          </div>
        </div>
      </section>

      <section className="trust-strip reveal-section" aria-label="Diferenciais">
        <div>
          <span>01</span>
          <p>
            <strong>Desde 2015</strong>
            <br />
            Uma história construída na cidade
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            <strong>Agendamento online</strong>
            <br />
            Escolha profissional, data e horário
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            <strong>No centro</strong>
            <br />
            Junto à Praça Papa Pio
          </p>
        </div>
      </section>

      <section className="section services reveal-section" id="servicos">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Serviços</p>
            <h2>
              Escolha seu <em>ritual.</em>
            </h2>
          </div>
          <p>Qualidade em cada detalhe, do primeiro corte à finalização.</p>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <article className="service" key={service.name}>
              <span className="service-number">0{index + 1}</span>
              <div>
                <h3>{service.name}</h3>
                <p>{service.note}</p>
              </div>
              <strong>{service.duration}</strong>
              <a href="#agendar" aria-label={`Agendar ${service.name}`}>
                ↓
              </a>
            </article>
          ))}
        </div>
      </section>

      <Booking />

      <section
        className="section professionals reveal-section"
        id="profissionais"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quem cuida do seu estilo</p>
            <h2>
              Escolha seu <em>profissional.</em>
            </h2>
          </div>
          <p>
            Os dois profissionais atendem de segunda a sábado, das 8h às 18h.
          </p>
        </div>
        <div className="professional-grid">
          <article>
            <span className="professional-initial">P</span>
            <div>
              <p className="eyebrow">Barbeiro</p>
              <h3>Pedrinho</h3>
              <p>
                Profissional com maior disponibilidade na agenda. Escolha o
                serviço e reserve seu horário diretamente pelo site.
              </p>
              <a href="#agendar">Agendar com Pedrinho →</a>
            </div>
          </article>
          <article>
            <span className="professional-initial">T</span>
            <div>
              <p className="eyebrow">Barbeiro</p>
              <h3>Treco</h3>
              <p>
                Atendimento com o mesmo cuidado e padrão Bittencourt. Confira os
                horários disponíveis na agenda online.
              </p>
              <a href="#agendar">Agendar com Treco →</a>
            </div>
          </article>
        </div>
      </section>

      <section className="about reveal-section" id="sobre">
        <div
          className="about-image"
          role="img"
          aria-label="Ambiente de barbearia"
        />
        <div className="about-content">
          <p className="eyebrow">Nossa essência</p>
          <h2>
            Mais que um corte.
            <br />
            <em>Um momento seu.</em>
          </h2>
          <p>
            Há mais de uma década no centro de Serafina Corrêa, a Barbearia
            Bittencourt é um lugar feito para quem valoriza estilo, cuidado e
            uma boa experiência.
          </p>
          <div className="numbers">
            <div>
              <strong>2015</strong>
              <span>ano de fundação</span>
            </div>
            <div>
              <strong>11</strong>
              <span>anos de história</span>
            </div>
            <div>
              <strong>Centro</strong>
              <span>Serafina Corrêa</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section testimonials reveal-section" id="experiencia">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A experiência Bittencourt</p>
            <h2>
              Seu estilo, do seu <em>jeito.</em>
            </h2>
          </div>
        </div>
        <div className="testimonial-grid">
          {experience.map((item) => (
            <figure key={item.title}>
              <div className="stars">✦</div>
              <blockquote>{item.text}</blockquote>
              <figcaption>
                {item.title}
                <span>Barbearia Bittencourt</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Gallery />
      <section className="contact reveal-section" id="contato">
        <div>
          <p className="eyebrow">Seu horário está esperando</p>
          <h2>
            Pronto para renovar
            <br />o seu <em>visual?</em>
          </h2>
          <a className="button" href="#agendar">
            Ver horários disponíveis <span>↑</span>
          </a>
        </div>
        <div className="contact-details">
          <div>
            <small>Localização</small>
            <strong>
              Praça Central Papa Pio — Centro
              <br />
              Serafina Corrêa — RS
            </strong>
            <a
              className="contact-link"
              href="https://www.google.com/maps/search/?api=1&query=Barbearia+Bittencourt+Serafina+Corr%C3%AAa+RS"
              target="_blank"
              rel="noreferrer"
            >
              Abrir rota no Google Maps →
            </a>
          </div>
          <div>
            <small>Agendamento</small>
            <strong>
              Escolha o serviço, profissional,
              <br />
              data e horário aqui no site
            </strong>
          </div>
          <div>
            <small>Contato</small>
            <strong>
              <a
                href="https://wa.me/5554997055804"
                target="_blank"
                rel="noreferrer"
                aria-label="Falar com a Barbearia Bittencourt pelo WhatsApp"
              >
                (54) 99705-5804
              </a>
              <br />
              <a
                href="https://www.instagram.com/oficialbarbeariabittencourt/"
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir Instagram da Barbearia Bittencourt"
              >
                @oficialbarbeariabittencourt
              </a>
            </strong>
          </div>
        </div>
      </section>

      <footer>
        <a
          className="brand"
          href="#inicio"
          aria-label="Barbearia Bittencourt — voltar ao início"
        >
          <img
            className="brand-logo"
            src="/logo-bittencourt.png"
            width="150"
            height="150"
            alt="Barbearia Bittencourt"
          />
        </a>
        <p>© 2026 Barbearia Bittencourt. Todos os direitos reservados.</p>
        <div className="footer-links">
          <a href="/privacidade">Privacidade</a>
          <a href="/admin">Área administrativa</a>
          <a href="#inicio">Voltar ao topo ↑</a>
        </div>
      </footer>
      <a
        className="floating-whatsapp"
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com a barbearia pelo WhatsApp"
      >
        Falar no WhatsApp
      </a>
      <a className="mobile-booking-bar" href="#agendar">
        Agendar horário
      </a>
    </main>
  );
}
