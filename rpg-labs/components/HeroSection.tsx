"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./HeroSection.module.css";

/* ─────────────────────────────────────────────
   Tabletop feature card data
───────────────────────────────────────────── */
const features = [
  {
    id: "fichas",
    icon: "⚔️",
    title: "Fichas Personalizáveis",
    desc: "Crie e edite fichas de personagem completas com atributos, habilidades e histórico — tudo sincronizado em tempo real.",
  },
  {
    id: "mapas",
    icon: "🗺️",
    title: "Mapas & Cenários",
    desc: "Monte batalhas táticas com tiles dinâmicos, névoa de guerra e iluminação dramática diretamente no navegador.",
  },
  {
    id: "dados",
    icon: "🎲",
    title: "Rolagem de Dados",
    desc: "Sistema de dados integrado com histórico, modificadores e animações físicas — d4 ao d100.",
  },
  {
    id: "transmissao",
    icon: "📡",
    title: "Retransmissão ao Vivo",
    desc: "Transmita suas sessões diretamente para o Twitch ou YouTube com overlay automático da mesa e câmeras dos jogadores.",
  },
];

/* ─────────────────────────────────────────────
   Utility: improved intersection observer hook
───────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Fallback: se o Observer falhar, mostra após 2 segundos
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 2000);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
          clearTimeout(timeout);
        }
      },
      { 
        threshold: 0.15,
        rootMargin: "0px 0px -100px 0px" // melhor detecção
      }
    );
    
    observer.observe(el);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);
  
  return { ref, visible };
}

export default function HeroSection() {
  const tabletopReveal = useReveal();

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className={styles.heroSection}>
        <div className={styles.heroBg} />
        <div className={styles.heroVignette} />

        {/* Embers - com aria-hidden para acessibilidade */}
        <div className={styles.embers} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.ember} />
          ))}
        </div>

        {/* Content */}
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Bem-vindo ao</p>

          <h1 className={styles.heroTitle}>NEXUS</h1>
          <h2 className={styles.heroSubtitle}>C A R M E S I N</h2>

          <p className={styles.heroTagline}>
            Um ponto central onde forças se conectam…{" "}
            <strong>E SE CORROMPEM</strong>
          </p>

          <Link 
            href="/jogar" 
            className={styles.btnPlay}
            aria-label="Iniciar jogo agora"
          >
            <span className={`${styles.corner} ${styles.cornerTl}`} />
            <span className={`${styles.corner} ${styles.cornerTr}`} />
            <span className={`${styles.corner} ${styles.cornerBl}`} />
            <span className={`${styles.corner} ${styles.cornerBr}`} />
            <span>Jogar Agora</span>
          </Link>
        </div>
      </section>

      {/* ══════════ TABLETOP SECTION ══════════ */}
      <section className={styles.tabletopSection} ref={tabletopReveal.ref}>
        <div className={styles.sectionDivider} />

        <div className={styles.tabletopInner}>
          {/* Header */}
          <div className={`${styles.reveal} ${tabletopReveal.visible ? styles.visible : ""}`}>
            <p className={styles.sectionLabel}>Mesa Virtual</p>
            <h2 className={styles.sectionTitle}>
              Tabletop <em>Personalizável</em>
            </h2>
            <p className={styles.sectionSub}>
              Ferramentas de RPG de mesa construídas para o Nexus — com retransmissão ao vivo integrada para sua audiência.
            </p>
          </div>

          {/* Feature cards */}
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`
                  ${styles.featureCard} 
                  ${styles.reveal} 
                  ${index === 0 ? styles.revealDelay1 : 
                    index === 1 ? styles.revealDelay2 :
                    index === 2 ? styles.revealDelay3 :
                    styles.revealDelay4}
                  ${tabletopReveal.visible ? styles.visible : ""}
                `}
              >
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Broadcast strip */}
          <div className={`${styles.broadcastStrip} ${styles.reveal} ${styles.revealDelay5} ${tabletopReveal.visible ? styles.visible : ""}`}>
            <div className={styles.broadcastText}>
              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                Ao Vivo
              </div>
              <h3>Retransmissão Externa Integrada</h3>
              <p>
                Conecte sua mesa ao Twitch, YouTube ou qualquer plataforma RTMP — sem software externo.
              </p>
            </div>
            <Link 
              href="/transmitir" 
              className={styles.btnOutlineRed}
              aria-label="Começar a transmitir agora"
            >
              Começar a transmitir
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}