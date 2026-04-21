"use client";
export const dynamic = "force-dynamic";
export const ssr = false;
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection, query, where, getDocs,
  addDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
const [selectedSystem, setSelectedSystem] = useState<SistemaKey>("purgatum");
const [sistema, setSistema] = useState("purgatum");
const [personagem, setPersonagem] = useState({
  nome: "",
  foto: "",
  atributos: {},
  inventario: [],
});
type SistemaKey = "purgatum" | "ordem" | "dnd" | "outro";
const systems: Record<SistemaKey, { atributos: string[] }> = {
  purgatum: { atributos: ["Força", "Agilidade", "Vitalidade", "Corrupção"] },
  ordem: { atributos: ["Força", "Agilidade", "Intelecto", "Presença"] },
  dnd: { atributos: ["STR", "DEX", "CON", "INT", "WIS", "CHA"] },
  outro: { atributos: ["Atributo 1", "Atributo 2"] },
};



/* ── Nav (igual ao dashboard) ── */
const NAV = [
  { icon: "⚔️", label: "Dashboard",   href: "/dashboard"   },
  { icon: "🧙", label: "Personagens", href: "/personagens" },
  { icon: "📜", label: "Campanhas",   href: "/campanhas"   },
  { icon: "🐉", label: "Bestiário",   href: "/bestiario"   },
  { icon: "💎", label: "Itens",       href: "/itens"       },
  { icon: "👤", label: "Perfil",      href: "/perfil"      },
];

const CLASSES = ["Guerreiro","Mago","Ladino","Clérigo","Paladino","Bárbaro","Druida","Arqueiro","Necromante","Bardo"];
const RACAS   = ["Humano","Elfo","Anão","Halfling","Meio-Elfo","Tiefling","Draconato","Gnomo","Orc","Aasimar"];

type Personagem = {
  id: string;
  nome: string;
  classe: string;
  raca: string;
  nivel: number;
  descricao: string;
  avatar: string;
  userId: string;
};

const AVATARES = ["🧙","⚔️","🏹","🛡️","💀","🔥","❄️","⚡","🌿","🎭"];

export default function PersonagensPage() {
  const router = useRouter();
  const [user,         setUser]         = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [personagens,  setPersonagens]  = useState<Personagem[]>([]);
  const [sideOpen,     setSideOpen]     = useState(false);
  const [activeNav,    setActiveNav]    = useState("Personagens");
  const [showForm,     setShowForm]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<Personagem | null>(null);

  const [form, setForm] = useState({
    nome: "", classe: CLASSES[0], raca: RACAS[0],
    nivel: 1, descricao: "", avatar: AVATARES[0],
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); fetchPersonagens(u.uid); }
      else router.push("/login");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchPersonagens = async (uid: string) => {
    const q = query(collection(db, "characters"), where("userId", "==", uid));
    const snap = await getDocs(q);
    setPersonagens(snap.docs.map(d => ({ id: d.id, ...d.data() } as Personagem)));
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "characters"), {
        ...form, userId: user.uid, createdAt: serverTimestamp(),
      });
      await fetchPersonagens(user.uid);
      setShowForm(false);
      setForm({ nome: "", classe: CLASSES[0], raca: RACAS[0], nivel: 1, descricao: "", avatar: AVATARES[0] });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "characters", id));
      setPersonagens(prev => prev.filter(p => p.id !== id));
      if (selectedChar?.id === id) setSelectedChar(null);
    } catch (e) { console.error(e); }
    setDeletingId(null);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#050101", flexDirection:"column", gap:"16px" }}>
      <style>{`@keyframes pulse-ring { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(1.8);opacity:0} }`}</style>
      <div style={{ position:"relative", width:48, height:48 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid #cc1a1a", animation:"pulse-ring 1.2s ease-out infinite" }} />
        <div style={{ position:"absolute", inset:6, borderRadius:"50%", background:"#cc1a1a", opacity:0.8 }} />
      </div>
      <p style={{ fontFamily:"'Cinzel',serif", color:"#5a2020", letterSpacing:"0.35em", fontSize:"0.6rem" }}>CARREGANDO NEXUS</p>
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
        .root { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          position: fixed; top:0; left:0; width:220px; height:100vh;
          background:#080202; border-right:1px solid rgba(100,15,15,0.5);
          display:flex; flex-direction:column; z-index:100;
          transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .sidebar::after {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(to right,transparent,#cc1a1a 40%,#cc1a1a 60%,transparent);
          box-shadow:0 0 12px rgba(200,20,20,0.6);
        }
        @media(max-width:768px){
          .sidebar{transform:${sideOpen?"translateX(0)":"translateX(-100%)"}}
          .main{margin-left:0!important}
          .overlay{display:${sideOpen?"block":"none"}!important}
        }
        .sidebar-logo{padding:28px 20px 20px;border-bottom:1px solid rgba(100,15,15,0.35);}
        .logo-name{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;letter-spacing:0.25em;color:#fff;display:block;}
        .logo-sub{font-family:'Cinzel',serif;font-size:0.5rem;letter-spacing:0.4em;color:#cc1a1a;display:block;margin-top:3px;}
        .sidebar-nav{flex:1;padding:24px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;}
        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:2px;border:1px solid transparent;cursor:pointer;transition:all 0.25s;background:transparent;width:100%;text-align:left;color:#8a6060;position:relative;overflow:hidden;}
        .nav-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#cc1a1a;transform:scaleY(0);transition:transform 0.25s;}
        .nav-item:hover{background:rgba(120,10,10,0.12);border-color:rgba(100,20,20,0.3);color:#fff;}
        .nav-item:hover::before,.nav-item.active::before{transform:scaleY(1);}
        .nav-item.active{background:rgba(140,10,10,0.2);border-color:rgba(180,30,30,0.35);color:#fff;}
        .nav-icon{font-size:1rem;flex-shrink:0;}
        .nav-label{font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:0.12em;color:inherit;}
        .sidebar-user{padding:16px;border-top:1px solid rgba(100,15,15,0.35);display:flex;align-items:center;gap:10px;}
        .user-avatar{width:36px;height:36px;border-radius:2px;border:1px solid #cc1a1a;object-fit:cover;flex-shrink:0;}
        .user-info{flex:1;min-width:0;}
        .user-name{font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:0.1em;color:#c8b8b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;}
        .user-role{font-size:0.65rem;color:#5a3a3a;}
        .logout-btn{background:transparent;border:1px solid rgba(100,20,20,0.4);color:#8a3030;cursor:pointer;padding:5px 7px;font-size:0.75rem;border-radius:2px;transition:all 0.2s;flex-shrink:0;}
        .logout-btn:hover{background:rgba(140,10,10,0.2);color:#cc4444;border-color:#cc1a1a;}

        /* ── Main ── */
        .main{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;background:radial-gradient(ellipse 80% 40% at 80% 0%,rgba(80,8,8,0.12) 0%,transparent 60%),#050101;}
        .topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;height:60px;background:rgba(5,1,1,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(100,15,15,0.3);}
        .topbar-title{font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:0.3em;color:#5a3a3a;text-transform:uppercase;}
        .topbar-right{display:flex;align-items:center;gap:12px;}
        .hamburger{display:none;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:4px;}
        .hamburger span{display:block;width:20px;height:1px;background:#8a5050;}
        @media(max-width:768px){.hamburger{display:flex;}}
        .content{padding:2rem;flex:1;}
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:90;}

        /* ── Page header ── */
        .page-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:2.5rem;flex-wrap:wrap;gap:1rem;}
        .page-title{font-family:'Cinzel',serif;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;letter-spacing:0.15em;color:#fff;line-height:1;}
        .page-sub{font-family:'Crimson Pro',serif;font-size:0.95rem;color:#6a4a4a;font-style:italic;margin-top:4px;}
        .section-divider{height:1px;background:linear-gradient(to right,#cc1a1a 0%,rgba(100,15,15,0.2) 60%,transparent 100%);margin-top:0.4rem;width:120px;}

        /* ── Botão novo personagem ── */
        .btn-new{
          font-family:'Cinzel',serif;font-size:0.72rem;font-weight:700;
          letter-spacing:0.2em;text-transform:uppercase;
          color:#fff;padding:10px 24px;
          background:linear-gradient(135deg,#8b0000,#5a0000);
          border:1px solid #cc1a1a;cursor:pointer;
          position:relative;overflow:hidden;transition:all 0.3s;
        }
        .btn-new:hover{box-shadow:0 0 24px rgba(200,20,20,0.6);transform:translateY(-2px);}

        /* ── Grid de personagens ── */
        .chars-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
          gap:1.5rem;
          margin-bottom:3rem;
        }

        /* Card vazio (+ criar) */
        .card-empty{
          border:1px dashed rgba(100,20,20,0.35);
          background:rgba(10,2,2,0.4);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:0.75rem;padding:2.5rem 1rem;cursor:pointer;
          transition:all 0.3s;min-height:280px;
        }
        .card-empty:hover{border-color:#cc1a1a;background:rgba(30,5,5,0.5);box-shadow:0 0 20px rgba(180,10,10,0.15);}
        .card-empty-icon{font-size:2rem;opacity:0.4;}
        .card-empty-text{font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:0.25em;color:#5a3a3a;text-transform:uppercase;}

        /* Card personagem */
        .char-card{
          position:relative;
          background:rgba(12,3,3,0.92);
          border:1px solid rgba(100,20,20,0.3);
          overflow:hidden;cursor:pointer;
          transition:all 0.3s ease;
          animation:fade-in 0.5s ease both;
          min-height:280px;display:flex;flex-direction:column;
        }
        .char-card:hover{border-color:rgba(200,40,40,0.55);transform:translateY(-5px);box-shadow:0 12px 40px rgba(140,10,10,0.3);}
        .char-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,#cc1a1a,transparent);opacity:0;transition:opacity 0.3s;}
        .char-card:hover::before{opacity:1;}

        @keyframes fade-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        /* Avatar area */
        .char-avatar-area{
          height:140px;
          display:flex;align-items:center;justify-content:center;
          background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(100,10,10,0.25),transparent);
          font-size:4rem;
          position:relative;
          border-bottom:1px solid rgba(100,20,20,0.2);
        }
        .char-nivel-badge{
          position:absolute;top:10px;right:10px;
          font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:0.15em;
          color:#c9a84c;border:1px solid rgba(200,168,76,0.4);
          padding:2px 8px;background:rgba(5,2,0,0.8);
        }

        /* Card body */
        .char-body{padding:1.25rem;flex:1;display:flex;flex-direction:column;gap:0.5rem;}
        .char-name{font-family:'Cinzel',serif;font-size:0.95rem;font-weight:700;letter-spacing:0.1em;color:#fff;}
        .char-meta{font-family:'Crimson Pro',serif;font-size:0.82rem;color:#7a5a5a;letter-spacing:0.04em;}
        .char-desc{font-family:'Crimson Pro',serif;font-size:0.82rem;color:#5a4040;font-style:italic;margin-top:auto;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

        /* Delete btn */
        .char-delete{
          position:absolute;bottom:10px;right:10px;
          background:rgba(100,10,10,0.5);border:1px solid rgba(180,30,30,0.3);
          color:#8a3030;font-size:0.7rem;padding:4px 8px;cursor:pointer;
          border-radius:2px;transition:all 0.2s;opacity:0;
        }
        .char-card:hover .char-delete{opacity:1;}
        .char-delete:hover{background:#8b0000;color:#fff;border-color:#cc1a1a;}

        /* ── Modal de detalhes ── */
        .modal-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.85);
          z-index:200;display:flex;align-items:center;justify-content:center;
          padding:1.5rem;backdrop-filter:blur(4px);
          animation:fade-bg 0.2s ease;
        }
        @keyframes fade-bg{from{opacity:0}to{opacity:1}}
        .modal{
          background:#0c0303;border:1px solid rgba(180,30,30,0.45);
          width:100%;max-width:480px;position:relative;
          animation:slide-up 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow:hidden;
        }
        @keyframes slide-up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .modal-top-line{height:1px;background:linear-gradient(to right,transparent,#cc1a1a 30%,#cc1a1a 70%,transparent);box-shadow:0 0 10px rgba(200,20,20,0.5);}
        .modal-avatar{height:180px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(100,10,10,0.3),transparent);}
        .modal-body{padding:1.75rem 2rem 2rem;}
        .modal-name{font-family:'Cinzel',serif;font-size:1.5rem;font-weight:900;letter-spacing:0.1em;color:#fff;margin-bottom:0.25rem;}
        .modal-meta{font-family:'Cinzel',serif;font-size:0.62rem;letter-spacing:0.2em;color:#cc1a1a;text-transform:uppercase;margin-bottom:1rem;}
        .modal-desc{font-family:'Crimson Pro',serif;font-size:1rem;color:#9a7a7a;line-height:1.7;font-style:italic;}
        .modal-close{position:absolute;top:12px;right:12px;background:transparent;border:1px solid rgba(100,20,20,0.4);color:#8a3030;cursor:pointer;padding:4px 10px;font-size:0.7rem;font-family:'Cinzel',serif;letter-spacing:0.1em;transition:all 0.2s;}
        .modal-close:hover{background:rgba(140,10,10,0.2);color:#fff;border-color:#cc1a1a;}

        /* ── Formulário de criação ── */
        .form-panel{
          background:rgba(10,2,2,0.92);border:1px solid rgba(100,20,20,0.4);
          padding:2rem;margin-bottom:3rem;
          animation:fade-in 0.4s ease;
        }
        .form-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem;}
        .form-panel-title{font-family:'Cinzel',serif;font-size:0.8rem;letter-spacing:0.25em;color:#c8b8b8;text-transform:uppercase;}
        .form-close{background:transparent;border:none;color:#5a3a3a;cursor:pointer;font-size:1.2rem;transition:color 0.2s;}
        .form-close:hover{color:#cc1a1a;}

        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;}
        @media(max-width:600px){.form-grid{grid-template-columns:1fr;}}

        .form-group{display:flex;flex-direction:column;gap:0.4rem;}
        .form-group.full{grid-column:1/-1;}
        .form-label{font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.2em;color:#8a6060;text-transform:uppercase;}
        .form-input,.form-select,.form-textarea{
          background:rgba(5,1,1,0.8);border:1px solid rgba(80,15,15,0.5);
          color:#d4c4c4;font-family:'Crimson Pro',serif;font-size:0.95rem;
          padding:0.7rem 0.875rem;transition:all 0.25s;width:100%;
        }
        .form-input:focus,.form-select:focus,.form-textarea:focus{outline:none;border-color:#cc1a1a;box-shadow:0 0 10px rgba(200,30,30,0.2);}
        .form-input::placeholder,.form-textarea::placeholder{color:#3a2020;font-style:italic;}
        .form-select{appearance:none;cursor:pointer;}
        .form-textarea{resize:vertical;min-height:80px;line-height:1.6;}

        /* Avatar picker */
        .avatar-picker{display:flex;gap:8px;flex-wrap:wrap;}
        .avatar-opt{
          width:40px;height:40px;border:1px solid rgba(80,15,15,0.4);
          background:rgba(5,1,1,0.8);cursor:pointer;font-size:1.3rem;
          display:flex;align-items:center;justify-content:center;
          transition:all 0.2s;border-radius:2px;
        }
        .avatar-opt:hover{border-color:#cc1a1a;}
        .avatar-opt.selected{border-color:#cc1a1a;background:rgba(100,10,10,0.3);box-shadow:0 0 8px rgba(200,20,20,0.4);}

        /* Nivel input */
        .nivel-input{display:flex;align-items:center;gap:8px;}
        .nivel-btn{background:rgba(80,10,10,0.4);border:1px solid rgba(100,20,20,0.4);color:#c8b8b8;width:28px;height:28px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;}
        .nivel-btn:hover{background:#8b0000;border-color:#cc1a1a;}
        .nivel-val{font-family:'Cinzel',serif;font-size:1.1rem;color:#fff;min-width:24px;text-align:center;}

        .form-actions{display:flex;gap:1rem;margin-top:1.75rem;justify-content:flex-end;}
        .btn-cancel{font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#8a6060;background:transparent;border:1px solid rgba(80,20,20,0.35);padding:10px 20px;cursor:pointer;transition:all 0.2s;}
        .btn-cancel:hover{color:#e0d4d4;border-color:#8a5050;}
        .btn-save{font-family:'Cinzel',serif;font-size:0.7rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#8b0000,#5a0000);border:1px solid #cc1a1a;padding:10px 28px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;}
        .btn-save:hover:not(:disabled){box-shadow:0 0 20px rgba(200,20,20,0.5);transform:translateY(-1px);}
        .btn-save:disabled{opacity:0.6;cursor:not-allowed;}

        /* Empty state */
        .empty-state{text-align:center;padding:5rem 2rem;}
        .empty-icon{font-size:3.5rem;margin-bottom:1.5rem;opacity:0.3;}
        .empty-title{font-family:'Cinzel',serif;font-size:1rem;letter-spacing:0.2em;color:#5a3a3a;margin-bottom:0.5rem;}
        .empty-sub{font-family:'Crimson Pro',serif;font-size:0.9rem;color:#3a2020;font-style:italic;}
      
      .atributos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.preview-image {
  width: 100%;
  max-width: 200px;
  border: 2px solid #6a0dad;
  margin-top: 10px;
}
      `}</style>

      <div className="root">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-name">PURGATUM</span>
            <span className="logo-sub">NEXUS CARMESIN</span>
          </div>
          <nav className="sidebar-nav">
            {NAV.map((item) => (
              <button
                key={item.label}
                className={`nav-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => { setActiveNav(item.label); router.push(item.href); }}
              >
                <span className="nav-icon">{item.icon}</span>
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
            <button className="logout-btn" onClick={() => { auth.signOut(); router.push("/login"); }} title="Sair">⬡</button>
          </div>
        </aside>

        <div className="overlay" onClick={() => setSideOpen(false)} />

        {/* ── Main ── */}
        <div className="main">
          <header className="topbar">
            <span className="topbar-title">◈ Personagens</span>
            <div className="topbar-right">
              <button className="hamburger" onClick={() => setSideOpen(v => !v)} aria-label="Menu">
                <span /><span /><span />
              </button>
            </div>
          </header>

          <div className="content">
            {/* Header */}
            <div className="page-header">
              <div>
                <h1 className="page-title">PERSONAGENS</h1>
                <p className="page-sub">Seus heróis e vilões aguardam</p>
                <div className="section-divider" />
              </div>
              <button className="btn-new" onClick={() => setShowForm(v => !v)}>
                {showForm ? "✕ Cancelar" : "+ Novo Personagem"}
              </button>
            </div>

            {/* Formulário de criação */}
            {showForm && (
              <>
                <div className="form-group">
                  <label className="form-label">Sistema</label>
                  <select
                    value={sistema}
                    onChange={(e) => setSistema(e.target.value)}
                    className="form-input"
                  >
                    <option value="purgatum">Purgatum</option>
                    <option value="ordem">Ordem Paranormal</option>
                    <option value="dnd">D&D</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="form-panel">
                <div className="form-panel-header">
                  <span className="form-panel-title">Forjar Novo Personagem</span>
                  <button className="form-close" onClick={() => setShowForm(false)}>✕</button>
                </div>

                <div className="form-grid">
                  {/* Nome */}
                  <div className="form-group full">
                    <label className="form-label">Nome do Personagem</label>
                    <input
                      className="form-input"
                      placeholder="Ex: Kael, o Sombrio..."
                      value={form.nome}
                      onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                    />
                  </div>

                  {/* Classe */}
                  <div className="form-group">
                    <label className="form-label">Classe</label>
                    <select className="form-select" value={form.classe} onChange={e => setForm(p => ({ ...p, classe: e.target.value }))}>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Raça */}
                  <div className="form-group">
                    <label className="form-label">Raça</label>
                    <select className="form-select" value={form.raca} onChange={e => setForm(p => ({ ...p, raca: e.target.value }))}>
                      {RACAS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Nível */}
                  <div className="atributos-grid">
  {systems[selectedSystem].atributos.map((attr) => (
    <div key={attr} className="form-group">
      <label className="form-label">{attr}</label>
      <input
        type="number"
        className="form-input"
        onChange={(e) =>
          setPersonagem((prev) => ({
            ...prev,
            atributos: {
              ...prev.atributos,
              [attr]: Number(e.target.value),
            },
          }))
        }
      />
    </div>
  ))}
</div>

                  <div className="form-group">
  <label className="form-label">Retrato do Personagem</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPersonagem((prev) => ({
            ...prev,
            foto: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    }}
  />
</div>

{personagem.foto && (
  <img
    src={personagem.foto}
    className="preview-image"
    alt="preview"
  />
)}

                  {/* Descrição */}
                  <div className="form-group full">
                    <label className="form-label">História / Descrição</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Conte a história deste personagem..."
                      value={form.descricao}
                      onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button className="btn-save" onClick={handleSave} disabled={saving || !form.nome.trim()}>
                    {saving ? "Forjando..." : "Forjar Personagem"}
                  </button>
                </div>
              </div>
              </>
            )}

            {/* Grid */}
            {personagens.length === 0 && !showForm ? (
              <div className="empty-state">
                <div className="empty-icon">🧙</div>
                <p className="empty-title">Nenhum personagem ainda</p>
                <p className="empty-sub">Clique em "Novo Personagem" para forjar seu primeiro herói</p>
              </div>
            ) : (
              <div className="chars-grid">
                {personagens.map((p, i) => (
                  <div
                    key={p.id}
                    className="char-card"
                    style={{ animationDelay: `${i * 0.07}s` }}
                    onClick={() => setSelectedChar(p)}
                  >
                    <div className="char-avatar-area">
                      <span style={{ fontSize: "4rem" }}>{p.avatar || "🧙"}</span>
                      <span className="char-nivel-badge">Nível {p.nivel}</span>
                    </div>
                    <div className="char-body">
                      <div className="char-name">{p.nome}</div>
                      <div className="char-meta">{p.classe} · {p.raca}</div>
                      {p.descricao && <div className="char-desc">{p.descricao}</div>}
                    </div>
                    <button
                      className="char-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "..." : "✕"}
                    </button>
                  </div>
                ))}

                {/* Card vazio para criar */}
                <div className="card-empty" onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <span className="card-empty-icon">＋</span>
                  <span className="card-empty-text">Novo Personagem</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de detalhes ── */}
      {selectedChar && (
        <div className="modal-overlay" onClick={() => setSelectedChar(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top-line" />
            <button className="modal-close" onClick={() => setSelectedChar(null)}>✕ Fechar</button>
            <div className="modal-avatar">{selectedChar.avatar || "🧙"}</div>
            <div className="modal-body">
              <div className="modal-name">{selectedChar.nome}</div>
              <div className="modal-meta">{selectedChar.classe} · {selectedChar.raca} · Nível {selectedChar.nivel}</div>
              {selectedChar.descricao
                ? <div className="modal-desc">"{selectedChar.descricao}"</div>
                : <div className="modal-desc" style={{ color: "#3a2020" }}>Sem história registrada ainda...</div>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}