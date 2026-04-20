"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Tabletop feature card data
───────────────────────────────────────────── */
const features = [
  {
    icon: "⚔️",
    title: "Fichas Personalizáveis",
    desc: "Crie e edite fichas de personagem completas com atributos, habilidades e histórico — tudo sincronizado em tempo real.",
  },
  {
    icon: "🗺️",
    title: "Mapas & Cenários",
    desc: "Monte batalhas táticas com tiles dinâmicos, névoa de guerra e iluminação dramática diretamente no navegador.",
  },
  {
    icon: "🎲",
    title: "Rolagem de Dados",
    desc: "Sistema de dados integrado com histórico, modificadores e animações físicas — d4 ao d100.",
  },
  {
    icon: "📡",
    title: "Retransmissão ao Vivo",
    desc: "Transmita suas sessões diretamente para o Twitch ou YouTube com overlay automático da mesa e câmeras dos jogadores.",
  },
];

/* ─────────────────────────────────────────────
   Utility: simple intersection observer hook
───────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export default function HeroSection() {
  const tabletopReveal = useReveal();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

        /* ── Base resets ── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ── CSS Variables ── */
        :root {
          --crimson:      #cc1a1a;
          --crimson-dark: #8b0000;
          --crimson-glow: rgba(180, 20, 20, 0.55);
          --gold:         #c9a84c;
          --bg:           #080202;
          --surface:      #100505;
          --text:         #d4c4c4;
          --text-muted:   #8a6060;
        }

        /* ── Hero wrapper ── */
        .hero-section {
          position: relative;
          width: 100%;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--bg);
        }

        /* Background image layer */
        .hero-bg {
          position: absolute;
          inset: 0;
          background-image: url('/hero-bg.webp');
          background-size: cover;
          background-position: center 30%;
          filter: brightness(0.55) saturate(1.2);
          z-index: 0;
        }

        /* Dark vignette overlay */
        .hero-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, rgba(5,0,0,0.7) 100%),
            linear-gradient(to bottom, rgba(5,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(5,0,0,0.95) 100%);
          z-index: 1;
        }

        /* Animated ember particles (CSS only) */
        .embers {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          pointer-events: none;
        }
        .ember {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: var(--crimson);
          box-shadow: 0 0 6px 2px var(--crimson-glow);
          animation: float-up linear infinite;
          opacity: 0;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0) scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-80vh) translateX(30px) scale(0.3); opacity: 0; }
        }
        /* Stagger 12 embers */
        .ember:nth-child(1)  { left: 15%; animation-duration: 7s;  animation-delay: 0s;    bottom: 10%; }
        .ember:nth-child(2)  { left: 28%; animation-duration: 9s;  animation-delay: 1.5s;  bottom: 5%;  width:3px; height:3px; }
        .ember:nth-child(3)  { left: 42%; animation-duration: 6s;  animation-delay: 0.8s;  bottom: 15%; }
        .ember:nth-child(4)  { left: 55%; animation-duration: 11s; animation-delay: 2s;    bottom: 8%;  width:1px; height:1px; }
        .ember:nth-child(5)  { left: 70%; animation-duration: 8s;  animation-delay: 0.3s;  bottom: 20%; }
        .ember:nth-child(6)  { left: 83%; animation-duration: 10s; animation-delay: 3s;    bottom: 5%;  width:3px; height:3px; }
        .ember:nth-child(7)  { left: 8%;  animation-duration: 7.5s;animation-delay: 1.2s;  bottom: 12%; }
        .ember:nth-child(8)  { left: 35%; animation-duration: 9.5s;animation-delay: 4s;    bottom: 3%;  }
        .ember:nth-child(9)  { left: 62%; animation-duration: 6.5s;animation-delay: 2.5s;  bottom: 18%; width:1px; height:1px; }
        .ember:nth-child(10) { left: 77%; animation-duration: 8.5s;animation-delay: 0.6s;  bottom: 7%;  }
        .ember:nth-child(11) { left: 90%; animation-duration: 7.2s;animation-delay: 3.5s;  bottom: 14%; width:3px; height:3px; }
        .ember:nth-child(12) { left: 50%; animation-duration: 10.5s;animation-delay: 1.8s; bottom: 2%;  }

        /* ── Hero content ── */
        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
          padding: 2rem 1.5rem 6rem;
          animation: hero-reveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes hero-reveal {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.4em;
          color: var(--crimson);
          text-transform: uppercase;
          animation: hero-reveal 1s 0.2s both;
        }

        .hero-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(3.5rem, 9vw, 7.5rem);
          font-weight: 900;
          letter-spacing: 0.18em;
          color: #fff;
          line-height: 0.95;
          text-shadow:
            0 0 60px rgba(200, 30, 30, 0.5),
            0 0 120px rgba(200, 30, 30, 0.2);
          animation: hero-reveal 1s 0.35s both;
        }

        .hero-subtitle {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.4rem, 3.5vw, 2.4rem);
          font-weight: 600;
          letter-spacing: 0.45em;
          color: var(--crimson);
          animation: hero-reveal 1s 0.5s both;
        }

        .hero-tagline {
          font-family: 'Crimson Pro', serif;
          font-style: italic;
          font-size: clamp(0.95rem, 1.8vw, 1.15rem);
          letter-spacing: 0.12em;
          color: var(--text);
          max-width: 520px;
          line-height: 1.7;
          animation: hero-reveal 1s 0.65s both;
        }
        .hero-tagline strong {
          font-style: normal;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.15em;
          font-family: 'Cinzel', serif;
          font-size: 0.9em;
        }

        /* ── CTA Button ── */
        .btn-play {
          position: relative;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #fff;
          padding: 16px 52px;
          background: linear-gradient(135deg, #8b0000 0%, #5a0000 100%);
          border: 1px solid var(--crimson);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: hero-reveal 1s 0.85s both;
          text-decoration: none;
          display: inline-block;
        }
        .btn-play::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #cc1a1a 0%, #8b0000 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .btn-play::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .btn-play:hover::before { opacity: 1; }
        .btn-play:hover::after  { left: 150%; }
        .btn-play:hover {
          box-shadow: 0 0 30px rgba(200, 20, 20, 0.7), 0 0 60px rgba(200, 20, 20, 0.3);
          border-color: #ff3333;
          transform: translateY(-2px);
        }
        .btn-play span { position: relative; z-index: 1; }

        /* Corner accents on button */
        .btn-play .corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: var(--gold);
          border-style: solid;
          opacity: 0.6;
          z-index: 1;
        }
        .btn-play .corner-tl { top: 3px; left: 3px;  border-width: 1px 0 0 1px; }
        .btn-play .corner-tr { top: 3px; right: 3px; border-width: 1px 1px 0 0; }
        .btn-play .corner-bl { bottom: 3px; left: 3px;  border-width: 0 0 1px 1px; }
        .btn-play .corner-br { bottom: 3px; right: 3px; border-width: 0 1px 1px 0; }

        
        }

        /* ── Tabletop Section ── */
        .tabletop-section {
          position: relative;
          background: var(--bg);
          padding: 7rem 1.5rem;
          overflow: hidden;
        }
        /* Background texture for tabletop section */
        .tabletop-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 50% 0%, rgba(100, 8, 8, 0.15) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* Top divider */
        .section-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, #6b0000 20%, #cc1a1a 50%, #6b0000 80%, transparent);
          box-shadow: 0 0 12px rgba(200, 20, 20, 0.4);
          margin-bottom: 5rem;
        }

        .tabletop-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.5em;
          color: var(--crimson);
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #fff;
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .section-title em {
          font-style: normal;
          color: var(--crimson);
        }

        .section-sub {
          font-family: 'Crimson Pro', serif;
          font-size: 1.05rem;
          color: var(--text-muted);
          text-align: center;
          letter-spacing: 0.06em;
          max-width: 480px;
          margin: 0 auto 4rem;
          line-height: 1.8;
        }

        /* Feature grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5px; /* gap via border trick */
        }

        .feature-card {
          position: relative;
          background: rgba(16, 4, 4, 0.85);
          border: 1px solid rgba(100, 20, 20, 0.35);
          padding: 2.5rem 2rem;
          transition: all 0.35s ease;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(to right, transparent, var(--crimson), transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(140, 10, 10, 0.12) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .feature-card:hover {
          border-color: rgba(180, 30, 30, 0.6);
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(150, 10, 10, 0.25);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-card:hover::after  { opacity: 1; }

        .feature-icon {
          font-size: 1.8rem;
          margin-bottom: 1.25rem;
          display: block;
          filter: drop-shadow(0 0 8px rgba(200, 30, 30, 0.4));
        }

        .feature-title {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #e0d0d0;
          text-transform: uppercase;
          margin-bottom: 0.85rem;
        }

        .feature-desc {
          font-family: 'Crimson Pro', serif;
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.75;
          letter-spacing: 0.02em;
        }

        /* Live badge */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: var(--crimson);
          border: 1px solid rgba(180, 30, 30, 0.5);
          padding: 3px 10px;
          margin-bottom: 1rem;
        }
        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--crimson);
          animation: blink 1.2s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--crimson); }
          50%       { opacity: 0.3; box-shadow: none; }
        }

        /* Reveal animation for tabletop section */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }

        /* Broadcast strip */
        .broadcast-strip {
          margin-top: 5rem;
          border: 1px solid rgba(100, 20, 20, 0.4);
          background: rgba(8, 2, 2, 0.7);
          padding: 2.5rem 2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          position: relative;
          overflow: hidden;
        }
        .broadcast-strip::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--crimson) 30%, var(--crimson) 70%, transparent);
        }

        .broadcast-text h3 {
          font-family: 'Cinzel', serif;
          font-size: clamp(1rem, 2vw, 1.3rem);
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .broadcast-text p {
          font-family: 'Crimson Pro', serif;
          font-size: 1rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .btn-outline-red {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--crimson);
          border: 1px solid var(--crimson);
          padding: 12px 30px;
          background: transparent;
          transition: all 0.3s ease;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-outline-red:hover {
          background: rgba(180, 20, 20, 0.15);
          box-shadow: 0 0 20px rgba(200, 20, 20, 0.3);
          color: #fff;
        }
      `}</style>

      {/* ══════════ HERO ══════════ */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-vignette" />

        {/* Embers */}
        <div className="embers">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ember" />
          ))}
        </div>

        {/* Content */}
        <div className="hero-content">
          <p className="hero-eyebrow">Bem-vindo ao</p>

          <h1 className="hero-title">NEXUS</h1>
          <h2 className="hero-subtitle">C A R M E S I N</h2>

          <p className="hero-tagline">
            Um ponto central onde forças se conectam…{" "}
            <strong>E SE CORROMPEM</strong>
          </p>

          <Link href="/jogar" className="btn-play">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <span>Jogar Agora</span>
          </Link>
        </div>

      </section>

      {/* ══════════ TABLETOP SECTION ══════════ */}
      <section className="tabletop-section" ref={tabletopReveal.ref}>
        <div className="section-divider" />

        <div className="tabletop-inner">
          {/* Header */}
          <div className={`reveal ${tabletopReveal.visible ? "visible" : ""}`}>
            <p className="section-label">Mesa Virtual</p>
            <h2 className="section-title">
              Tabletop <em>Personalizável</em>
            </h2>
            <p className="section-sub">
              Ferramentas de RPG de mesa construídas para o Nexus — com retransmissão ao vivo integrada para sua audiência.
            </p>
          </div>

          {/* Feature cards */}
          <div className="features-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`feature-card reveal reveal-delay-${i + 1} ${tabletopReveal.visible ? "visible" : ""}`}
              >
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Broadcast strip */}
          <div className={`broadcast-strip reveal reveal-delay-5 ${tabletopReveal.visible ? "visible" : ""}`}>
            <div className="broadcast-text">
              <div className="live-badge">
                <span className="live-dot" />
                Ao Vivo
              </div>
              <h3>Retransmissão Externa Integrada</h3>
              <p>
                Conecte sua mesa ao Twitch, YouTube ou qualquer plataforma RTMP — sem software externo.
              </p>
            </div>
            <a href="/transmitir" className="btn-outline-red">
              Começar a transmitir
            </a>
          </div>
        </div>
      </section>
    </>
  );
}