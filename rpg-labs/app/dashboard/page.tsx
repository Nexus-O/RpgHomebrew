"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import Icon, { type IconName } from "../../components/Icon";
import {
  collection, query, where, getDocs, orderBy, limit,
} from "firebase/firestore";

const NAV: { icon: IconName; label: string; href: string }[] = [
  { icon: "dashboard",    label: "Dashboard",   href: "/dashboard"   },
  { icon: "personagens",  label: "Personagens", href: "/personagens" },
  { icon: "campanhas",    label: "Campanhas",   href: "/campanhas"   },
  { icon: "bestiario",    label: "Bestiário",   href: "/bestiario"   },
  { icon: "itens",        label: "Itens",       href: "/itens"       },
  { icon: "perfil",       label: "Perfil",      href: "/perfil"      },
];

const STAT_DEFS: { key: string; label: string; icon: IconName; color: string }[] = [
  { key: "characters", label: "Personagens", icon: "personagens", color: "#cc1a1a" },
  { key: "campaigns",  label: "Campanhas",   icon: "campanhas",   color: "#c9a84c" },
  { key: "sessions",   label: "Sessões",     icon: "dados",       color: "#4c8bc9" },
  { key: "items",      label: "Itens",       icon: "itens",       color: "#4cc97a" },
];

export default function Dashboard() {
  const router = useRouter();
  const [user,       setUser]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [sideOpen,   setSideOpen]   = useState(false);
  const [stats,      setStats]      = useState({ characters: 0, campaigns: 0, sessions: 0, items: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [activeNav,  setActiveNav]  = useState("Dashboard");

  // ✅ useEffect corrigido — sem timeout, sem auth.currentUser manual
  // onAuthStateChanged já captura o retorno do signInWithRedirect automaticamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        loadData(firebaseUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const loadData = async (uid: string) => {
    try {
      const [charSnap, campSnap, actSnap] = await Promise.all([
        getDocs(query(collection(db, "characters"), where("userId", "==", uid))),
        getDocs(query(collection(db, "campaigns"),  where("members", "array-contains", uid))),
        getDocs(query(collection(db, "activities"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(6))),
      ]);
      setStats({ characters: charSnap.size, campaigns: campSnap.size, sessions: 0, items: 0 });
      setActivities(actSnap.docs.map((d) => d.data()));
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#050101",
      flexDirection: "column", gap: "16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid #cc1a1a",
          animation: "pulse-ring 1.2s ease-out infinite",
        }} />
        <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: "#cc1a1a", opacity: 0.8 }} />
      </div>
      <p style={{ fontFamily: "'Cinzel', serif", color: "#5a2020", letterSpacing: "0.35em", fontSize: "0.6rem" }}>
        ENTRANDO NO NEXUS
      </p>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #050101; color: #e0d4d4; font-family: 'Crimson Pro', serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0303; }
        ::-webkit-scrollbar-thumb { background: #5a1010; border-radius: 2px; }
      `}</style>

      <style>{`
        .db-root { display: flex; min-height: 100vh; position: relative; }

        .sidebar {
          position: fixed; top: 0; left: 0; width: 220px; height: 100vh;
          background: #080202; border-right: 1px solid rgba(100,15,15,0.5);
          display: flex; flex-direction: column; z-index: 100;
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .sidebar::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, #cc1a1a 40%, #cc1a1a 60%, transparent);
          box-shadow: 0 0 12px rgba(200,20,20,0.6);
        }
        @media (max-width: 768px) {
          .sidebar { transform: ${sideOpen ? "translateX(0)" : "translateX(-100%)"}; }
          .main { margin-left: 0 !important; }
          .overlay { display: ${sideOpen ? "block" : "none"} !important; }
        }

        .sidebar-logo { padding: 28px 20px 20px; border-bottom: 1px solid rgba(100,15,15,0.35); }
        .logo-name { font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 900; letter-spacing: 0.25em; color: #fff; display: block; }
        .logo-sub  { font-family: 'Cinzel', serif; font-size: 0.5rem; letter-spacing: 0.4em; color: #cc1a1a; display: block; margin-top: 3px; }

        .sidebar-nav { flex: 1; padding: 24px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }

        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          border-radius: 2px; border: 1px solid transparent; cursor: pointer;
          transition: all 0.25s ease; background: transparent; width: 100%;
          text-align: left; color: #8a6060; position: relative; overflow: hidden;
        }
        .nav-item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #cc1a1a; transform: scaleY(0); transition: transform 0.25s ease; }
        .nav-item:hover  { background: rgba(120,10,10,0.12); border-color: rgba(100,20,20,0.3); color: #fff; }
        .nav-item:hover::before  { transform: scaleY(1); }
        .nav-item.active { background: rgba(140,10,10,0.2); border-color: rgba(180,30,30,0.35); color: #fff; }
        .nav-item.active::before { transform: scaleY(1); }
        .nav-icon  { font-size: 1rem; flex-shrink: 0; }
        .nav-label { font-family: 'Cinzel', serif; font-size: 0.68rem; letter-spacing: 0.12em; color: inherit; }

        .sidebar-user { padding: 16px; border-top: 1px solid rgba(100,15,15,0.35); display: flex; align-items: center; gap: 10px; }
        .user-avatar  { width: 36px; height: 36px; border-radius: 2px; border: 1px solid #cc1a1a; object-fit: cover; flex-shrink: 0; }
        .user-info    { flex: 1; min-width: 0; }
        .user-name    { font-family: 'Cinzel', serif; font-size: 0.62rem; letter-spacing: 0.1em; color: #c8b8b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .user-role    { font-size: 0.65rem; color: #5a3a3a; letter-spacing: 0.05em; }
        .logout-btn   { background: transparent; border: 1px solid rgba(100,20,20,0.4); color: #8a3030; cursor: pointer; padding: 5px 7px; font-size: 0.75rem; border-radius: 2px; transition: all 0.2s; flex-shrink: 0; }
        .logout-btn:hover { background: rgba(140,10,10,0.2); color: #cc4444; border-color: #cc1a1a; }

        .main { flex: 1; margin-left: 220px; display: flex; flex-direction: column; min-height: 100vh; background: radial-gradient(ellipse 80% 40% at 80% 0%, rgba(80,8,8,0.12) 0%, transparent 60%), #050101; }

        .topbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 60px; background: rgba(5,1,1,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(100,15,15,0.3); }
        .topbar-title { font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.3em; color: #5a3a3a; text-transform: uppercase; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-email { font-family: 'Crimson Pro', serif; font-size: 0.85rem; color: #5a3a3a; letter-spacing: 0.05em; }

        .hamburger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger span { display: block; width: 20px; height: 1px; background: #8a5050; }
        @media (max-width: 768px) { .hamburger { display: flex; } }

        .content { padding: 2rem; flex: 1; }

        .page-header { margin-bottom: 2.5rem; }
        .page-title { font-family: 'Cinzel', serif; font-size: clamp(1.6rem,3vw,2.2rem); font-weight: 700; letter-spacing: 0.15em; color: #fff; line-height: 1; }
        .page-greeting { font-family: 'Crimson Pro', serif; font-size: 1rem; color: #6a4a4a; letter-spacing: 0.08em; margin-top: 6px; font-style: italic; }
        .page-greeting strong { color: #cc1a1a; font-style: normal; font-family: 'Cinzel', serif; font-size: 0.8em; }
        .section-divider { height: 1px; background: linear-gradient(to right, #cc1a1a 0%, rgba(100,15,15,0.2) 60%, transparent 100%); margin-bottom: 2rem; margin-top: 0.5rem; width: 160px; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1px; margin-bottom: 2.5rem; border: 1px solid rgba(100,15,15,0.2); }
        .stat-card { position: relative; background: rgba(12,3,3,0.9); padding: 1.75rem 1.5rem; overflow: hidden; transition: all 0.3s ease; cursor: default; animation: fade-in 0.6s ease both; }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.12s; }
        .stat-card:nth-child(3) { animation-delay: 0.19s; }
        .stat-card:nth-child(4) { animation-delay: 0.26s; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: var(--accent); opacity: 0.6; transition: opacity 0.3s; }
        .stat-card:hover { background: rgba(18,4,4,0.95); }
        .stat-card:hover::before { opacity: 1; box-shadow: 0 0 10px var(--accent); }
        .stat-icon  { font-size: 1.4rem; margin-bottom: 1rem; display: block; filter: drop-shadow(0 0 6px var(--accent)); }
        .stat-value { font-family: 'Cinzel', serif; font-size: 2.5rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 4px; }
        .stat-label { font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.25em; color: #5a3a3a; text-transform: uppercase; }
        .stat-bar   { position: absolute; bottom: 0; left: 0; height: 2px; width: 40%; background: var(--accent); opacity: 0.3; transition: width 0.6s ease, opacity 0.3s; }
        .stat-card:hover .stat-bar { width: 100%; opacity: 0.5; }

        .bottom-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
        @media (max-width: 960px) { .bottom-grid { grid-template-columns: 1fr; } }

        .panel { background: rgba(10,2,2,0.85); border: 1px solid rgba(100,15,15,0.3); overflow: hidden; animation: fade-in 0.7s 0.3s ease both; }
        .panel-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(100,15,15,0.25); display: flex; align-items: center; justify-content: space-between; }
        .panel-title { font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.22em; color: #b09090; text-transform: uppercase; }
        .panel-badge { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.15em; color: #cc1a1a; border: 1px solid rgba(180,30,30,0.4); padding: 2px 8px; }

        .activity-list { padding: 0.5rem 0; }
        .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(60,10,10,0.2); transition: background 0.2s; animation: fade-in 0.5s ease both; }
        .activity-item:last-child { border-bottom: none; }
        .activity-item:hover { background: rgba(30,5,5,0.5); }
        .activity-dot  { width: 6px; height: 6px; border-radius: 50%; background: #cc1a1a; flex-shrink: 0; margin-top: 6px; box-shadow: 0 0 6px rgba(200,20,20,0.5); }
        .activity-text { font-family: 'Crimson Pro', serif; font-size: 0.95rem; color: #9a7a7a; line-height: 1.5; flex: 1; }
        .activity-empty { padding: 3rem 1.5rem; text-align: center; font-family: 'Crimson Pro', serif; font-style: italic; color: #4a2a2a; font-size: 0.95rem; letter-spacing: 0.06em; }

        .quick-list { padding: 1rem; display: flex; flex-direction: column; gap: 8px; }
        .quick-btn { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: transparent; border: 1px solid rgba(80,12,12,0.35); color: #8a6060; cursor: pointer; font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; transition: all 0.25s ease; position: relative; overflow: hidden; }
        .quick-btn::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #cc1a1a; transform: scaleY(0); transition: transform 0.2s; }
        .quick-btn:hover { background: rgba(120,10,10,0.12); border-color: rgba(180,30,30,0.4); color: #e0d4d4; }
        .quick-btn:hover::before { transform: scaleY(1); }
        .quick-btn-icon { font-size: 1rem; }

        .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 90; }
      `}</style>

      <div className="db-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-name">CONVERGENCIA</span>
            <span className="logo-sub">NEXUS CARMESIN</span>
          </div>
          <nav className="sidebar-nav">
           {NAV.map((item) => (
  <button
    key={item.label}
    className={`nav-item ${activeNav === item.label ? "active" : ""}`}
    onClick={() => {
      setActiveNav(item.label);
      router.push(item.href);
    }}
  >
    <span className="nav-icon"><Icon name={item.icon} /></span>
    <span className="nav-label">{item.label}</span>
  </button>
))}
          </nav>
          <div className="sidebar-user">
            <img src={user?.photoURL || "/avatar.png"} alt="avatar" className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{user?.displayName || user?.email?.split("@")[0]}</span>
              <span className="user-role">Aventureiro</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sair"><Icon name="sair" /></button>
          </div>
        </aside>

        <div className="overlay" onClick={() => setSideOpen(false)} />

        <div className="main">
          <header className="topbar">
            <span className="topbar-title"><Icon name="pingente" /> Painel de Controle</span>
            <div className="topbar-right">
              <span className="topbar-email">{user?.email}</span>
              <button className="hamburger" onClick={() => setSideOpen(v => !v)} aria-label="Menu">
                <span /><span /><span />
              </button>
            </div>
          </header>

          <div className="content">
            <div className="page-header">
              <h1 className="page-title">DASHBOARD</h1>
              <p className="page-greeting">
                Bem-vindo de volta,{" "}
                <strong>{user?.displayName || user?.email?.split("@")[0]}</strong>
                {" "}— que sua sessão seja épica.
              </p>
              <div className="section-divider" />
            </div>

            <div className="stats-grid">
              {STAT_DEFS.map((s) => (
                <div key={s.key} className="stat-card" style={{ "--accent": s.color } as React.CSSProperties}>
                  <span className="stat-icon"><Icon name={s.icon} /></span>
                  <div className="stat-value">{(stats as any)[s.key] ?? 0}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-bar" />
                </div>
              ))}
            </div>

            <div className="bottom-grid">
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Atividade Recente</span>
                  <span className="panel-badge">{activities.length} eventos</span>
                </div>
                <div className="activity-list">
                  {activities.length === 0 ? (
                    <p className="activity-empty">Nenhuma atividade registrada ainda…</p>
                  ) : (
                    activities.map((act, i) => (
                      <div key={i} className="activity-item" style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
                        <span className="activity-dot" />
                        <span className="activity-text">{act.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Ações Rápidas</span>
                </div>
                <div className="quick-list">
                  {[
                    { icon: "dashboard" as IconName,   label: "Novo Personagem" },
                    { icon: "campanhas" as IconName,   label: "Criar Campanha"  },
                    { icon: "dados" as IconName,       label: "Rolar Dados"     },
                    { icon: "mapa" as IconName,        label: "Abrir Mapa"      },
                    { icon: "transmitir" as IconName,  label: "Transmitir Mesa" },
                  ].map((a) => (
                    <button key={a.label} className="quick-btn">
                      <span className="quick-btn-icon"><Icon name={a.icon} /></span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}