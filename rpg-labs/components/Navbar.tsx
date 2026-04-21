"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Google Fonts - Cinzel para tipografia serifada medieval */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

        .nav-link {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.18em;
          color: #c8b8b8;
          text-transform: uppercase;
          transition: color 0.25s ease;
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0%;
          height: 1px;
          background: #cc1a1a;
          transition: width 0.3s ease;
        }
        .nav-link:hover {
          color: #ffffff;
        }
        .nav-link:hover::after {
          width: 100%;
        }

        .btn-discord {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          color: #999;
          border: 2px solid #7289da;
          padding: 6px 16px;
          text-transform: uppercase;
          background: transparent;
          transition: all 0.25s ease;
        }
        .btn-discord:hover {
          color: #fff;
          border-color: #888;
          background: rgba(255,255,255,0.05);
        }

        .btn-login {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          color: #ccc;
          border: 1px solid #666;
          padding: 6px 18px;
          text-transform: uppercase;
          background: transparent;
          transition: all 0.25s ease;
        }
        .btn-login:hover {
          color: #fff;
          border-color: #aaa;
          background: rgba(255,255,255,0.06);
        }

        .btn-register {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #fff;
          border: 1px solid #aa1111;
          padding: 6px 20px;
          text-transform: uppercase;
          background: #8b0000;
          transition: all 0.25s ease;
        }
        .btn-register:hover {
          background: #a30000;
          border-color: #cc2222;
          box-shadow: 0 0 14px rgba(180, 0, 0, 0.5);
        }

        .brand-text-nexus {
          font-family: 'Cinzel', serif;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.35em;
          color: #ffffff;
          line-height: 1;
        }
        .brand-text-carmesin {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          font-weight: 400;
          letter-spacing: 0.28em;
          color: #a06060;
          line-height: 1;
          margin-top: 3px;
        }

        /* Divisor brilhante vermelho */
        .crimson-divider {
          height: 1px;
          background: linear-gradient(
            to right,
            transparent 0%,
            #6b0000 15%,
            #cc1a1a 40%,
            #ff2222 50%,
            #cc1a1a 60%,
            #6b0000 85%,
            transparent 100%
          );
          box-shadow: 0 0 8px rgba(200, 20, 20, 0.6), 0 0 20px rgba(200, 20, 20, 0.2);
        }

        /* Textura de fundo escura avermelhada */
        .navbar-bg {
          background-color: #0e0505;
          background-image:
            radial-gradient(ellipse 60% 80% at 70% 50%, rgba(100, 8, 8, 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 20% 40%, rgba(80, 5, 5, 0.12) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        /* Mobile menu */
        .mobile-menu-link {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          letter-spacing: 0.2em;
          color: #c8b8b8;
          text-transform: uppercase;
          padding: 12px 0;
          border-bottom: 1px solid rgba(100, 20, 20, 0.2);
          display: block;
          transition: color 0.2s;
        }
        .mobile-menu-link:hover {
          color: #fff;
        }
      `}</style>

      <header className="navbar-bg w-full sticky top-0 z-50">
        {/* Linha superior sutil */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-950 to-transparent opacity-60" />

        <nav className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Nexus Carmesin Logo"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="brand-text-nexus">N E X U S</span>
              <span className="brand-text-carmesin">C A R M E S I N</span>
            </div>
          </Link>

          {/* Links + Botões agrupados à direita */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="nav-link">Início</Link>
            <Link href="/downloads" className="nav-link">Downloads</Link>

            {/* Separador visual sutil */}
            <div className="w-px h-5 bg-red-900/50" />

            <div className="flex items-center gap-3">
            <a
              href="https://discord.gg/v3dtxpynW4"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-discord"
            >
              Discord
            </a>
            <Link href="/login" className="btn-login">
              Login
            </Link>
            <Link href="/register" className="btn-register">
              Registre-se
            </Link>
            </div>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className={`block h-px w-6 bg-red-400 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[6px]" : ""}`}
            />
            <span
              className={`block h-px w-6 bg-red-400 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-6 bg-red-400 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`}
            />
          </button>
        </nav>

        {/* Divisor crimson */}
        <div className="crimson-divider" />

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden navbar-bg px-6 py-4 border-t border-red-950/30">
            <Link href="/" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Início</Link>
            <Link href="/downloads" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Downloads</Link>
            <div className="flex flex-col gap-3 mt-4">
              <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="btn-discord text-center">
                Discord
              </a>
              <Link href="/login" className="btn-login text-center" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link href="/register" className="btn-register text-center" onClick={() => setMenuOpen(false)}>
                Registre-se
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}