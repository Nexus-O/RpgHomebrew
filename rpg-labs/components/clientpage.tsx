"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import Icon, { ICONS, type IconName } from "./Icon";

type SistemaKey = "purgatum" | "ordem" | "dnd" | "deprac" | "outro";
const systems: Record<SistemaKey, { atributos: string[] }> = {
  purgatum: { atributos: ["Força", "Agilidade", "Vitalidade", "Corrupção"] },
  ordem: { atributos: ["Força", "Agilidade", "Intelecto", "Presença"] },
  dnd: { atributos: ["STR", "DEX", "CON", "INT", "WIS", "CHA"] },
  deprac: { atributos: [] },
  outro: { atributos: ["Atributo 1", "Atributo 2"] },
};

const DEPRAC_SKILLS = [
  "Investigação", "Observação", "Percepção", "Rastreamento", "Arrombamento", "Pesquisa",
  "Ocultismo", "Visitantes", "Relíquias", "Contenção", "Combate", "Esgrima", "Pontaria",
  "Furtividade", "Atletismo", "Reflexos", "Resistência", "Primeiros Socorros", "Tecnologia",
  "Mecânica", "Persuasão", "Enganação", "Intimidação", "Empatia", "Liderança", "História",
] as const;
const DEPRAC_DICE = [4, 6, 8, 10] as const;
type DepracSkill = (typeof DEPRAC_SKILLS)[number];
type DepracDie = (typeof DEPRAC_DICE)[number];
type DepracFormation = "formed" | "incomplete";
type DepracSheet = {
  agency: string;
  codename: string;
  agentNumber: string;
  age: string;
  registrationDate: string;
  psychicTalent: "" | "Visão" | "Audição" | "Tato";
  observedTalent: string;
  formation: DepracFormation;
  dominantTalent: "Visão" | "Audição" | "Tato" | "";
  vitality: string;
  condition: string;
  stress: string;
  psychicExposure: string;
  ghostTouchIncidents: string;
  skills: Record<DepracSkill, DepracDie>;
  equipment: { name: string; quantity: string; notes: string; slots: number }[];
};

const createDepracSkills = (): Record<DepracSkill, DepracDie> => Object.fromEntries(
  DEPRAC_SKILLS.map((skill) => [skill, 4])
) as Record<DepracSkill, DepracDie>;

const createDepracSheet = (): DepracSheet => ({
  agency: "", codename: "", agentNumber: "", age: "", registrationDate: "",
  psychicTalent: "", observedTalent: "",
  formation: "formed", dominantTalent: "", vitality: "", condition: "", stress: "",
  psychicExposure: "", ghostTouchIncidents: "", skills: createDepracSkills(),
  equipment: [
    { name: "Rapieira", quantity: "1", notes: "", slots: 2 },
    { name: "Lanterna", quantity: "1", notes: "", slots: 1 },
    { name: "Kit de sal", quantity: "1", notes: "", slots: 1 },
    { name: "", quantity: "", notes: "", slots: 0 },
  ],
});



/* ── Nav (igual ao dashboard) ── */
const NAV: { icon: IconName; label: string; href: string }[] = [
  { icon: "dashboard",   label: "Dashboard",   href: "/dashboard"   },
  { icon: "personagens", label: "Personagens", href: "/personagens" },
  { icon: "campanhas",   label: "Campanhas",   href: "/campanhas"   },
  { icon: "bestiario",   label: "Bestiário",   href: "/bestiario"   },
  { icon: "itens",       label: "Itens",       href: "/itens"       },
  { icon: "perfil",      label: "Perfil",      href: "/perfil"      },
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
  sistema?: SistemaKey;
  atributos: Record<string, number>;
  foto: string;
};

type CharacterForm = {
  nome: string;
  classe: string;
  raca: string;
  nivel: number;
  descricao: string;
  avatar: IconName;
  sistema: SistemaKey;
  atributos: Record<string, number>;
  foto: string;
  deprac: DepracSheet;
  vidaBase: number;
  sanidadeBase: number;
};

const createEmptyForm = (): CharacterForm => ({
  nome: "",
  classe: CLASSES[0],
  raca: RACAS[0],
  nivel: 1,
  descricao: "",
  avatar: AVATARES[0],
  sistema: "purgatum",
  atributos: {},
  foto: "",
  deprac: createDepracSheet(),
  vidaBase: 10,
  sanidadeBase: 10,
});

/* Avatares disponíveis para seleção — usam ícones de fantasia (RPG-Awesome) */
const AVATARES: IconName[] = [
  "avatarMago", "avatarGuerreiro", "avatarArqueiro", "avatarGuardiao",
  "avatarNecromante", "avatarFogo", "avatarGelo", "avatarRaio",
  "avatarDruida", "avatarBardo",
];
const MAX_PORTRAIT_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Renderiza o avatar de um personagem.
 * Compatível com personagens antigos (avatar salvo como emoji) e novos
 * (avatar salvo como nome de ícone, ex: "avatarMago").
 */
function renderAvatar(avatar: string | undefined, size = "4rem", photoUrl?: string) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt="Retrato do personagem"
        style={{ width: size, height: size, objectFit: "cover", borderRadius: "4px" }}
      />
    );
  }
  if (avatar && avatar in ICONS) {
    return <Icon name={avatar as IconName} style={{ fontSize: size }} />;
  }
  // fallback para dados antigos salvos como emoji, ou personagem sem avatar
  return <span style={{ fontSize: size }}>{avatar || <Icon name="avatarMago" style={{ fontSize: size }} />}</span>;
}

export default function PersonagensPage() {
  const router = useRouter();
  const [user,         setUser]         = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [personagens,  setPersonagens]  = useState<Personagem[]>([]);
  const [sideOpen,     setSideOpen]     = useState(false);
  const [activeNav,    setActiveNav]    = useState("Personagens");
  const [showForm,     setShowForm]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<Personagem | null>(null);
  const [depracRoll, setDepracRoll] = useState<{ skill: string; die: number; value: number } | null>(null);

  const [form, setForm] = useState<CharacterForm>(createEmptyForm);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState("");
  const displayName = user?.user_metadata?.username ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url;
  const depracDiceCounts = DEPRAC_DICE.reduce((counts, die) => {
    counts[die] = Object.values(form.deprac.skills).filter((value) => value === die).length;
    return counts;
  }, {} as Record<DepracDie, number>);
  const depracDistributionValid = form.deprac.formation === "formed"
    ? depracDiceCounts[8] === 2 && depracDiceCounts[6] === 3 && depracDiceCounts[10] === 0
    : depracDiceCounts[10] === 1 && depracDiceCounts[8] === 2 && depracDiceCounts[6] === 0 && Boolean(form.deprac.dominantTalent);
  const depracSlotsUsed = form.deprac.equipment.reduce((total, item) => total + item.slots * (Number(item.quantity) || 0), 0);

  const updateDepracSkill = (skill: DepracSkill, die: DepracDie) => {
    setForm((previous) => ({
      ...previous,
      deprac: { ...previous.deprac, skills: { ...previous.deprac.skills, [skill]: die } },
    }));
  };

  const rollDepracSkill = (skill: DepracSkill, die: DepracDie) => {
    setDepracRoll({ skill, die, value: Math.floor(Math.random() * die) + 1 });
  };

  const fetchPersonagens = async () => {
    const { data, error } = await supabase
      .from("characters")
      .select("id, user_id, nome, classe, raca, nivel, descricao, avatar, sistema, atributos, foto_url")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setPersonagens((data ?? []).map((character) => ({
      id: character.id,
      userId: character.user_id,
      nome: character.nome,
      classe: character.classe,
      raca: character.raca,
      nivel: character.nivel,
      descricao: character.descricao,
      avatar: character.avatar,
      sistema: character.sistema as SistemaKey,
      atributos: character.atributos as Record<string, number>,
      foto: character.foto_url ?? "",
    })));
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.replace("/login"); return; }
      setUser(currentUser);
      try { await fetchPersonagens(); } catch (error) { console.error(error); }
      setLoading(false);
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    if (form.sistema === "deprac" && !depracDistributionValid) {
      setSaveError("Distribua as perícias conforme a formação escolhida antes de salvar.");
      return;
    }
    if (form.sistema === "deprac" && depracSlotsUsed > 8) {
      setSaveError("A mochila DEPRAC suporta no máximo 8 espaços.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (!user) throw new Error("Sua sessão expirou. Entre novamente para salvar o personagem.");
      const characterId = crypto.randomUUID();
      let photoUrl: string | null = null;

      if (portraitFile) {
        const extension = portraitFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/${characterId}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("character-portraits")
          .upload(path, portraitFile, { upsert: false, contentType: portraitFile.type });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from("character-portraits").getPublicUrl(path).data.publicUrl;
      }

      const sessionVitals = {
        vida_atual: form.vidaBase,
        vida_base: form.vidaBase,
        sanidade_atual: form.sanidadeBase,
        sanidade_base: form.sanidadeBase,
      };
      const characterAttributes = form.sistema === "deprac"
        ? { deprac: { ...form.deprac, vitality: `${form.vidaBase}/${form.vidaBase}`, stress: `${form.sanidadeBase}/${form.sanidadeBase}` }, _session: sessionVitals }
        : { ...form.atributos, _session: sessionVitals };
      const { error } = await supabase.from("characters").insert({
        id: characterId,
        user_id: user.id,
        nome: form.nome.trim(),
        classe: form.classe,
        raca: form.raca,
        nivel: form.nivel,
        descricao: form.descricao,
        avatar: form.avatar,
        sistema: form.sistema,
        atributos: characterAttributes,
        foto_url: photoUrl,
        ...sessionVitals,
      });
      if (error) throw error;
      await fetchPersonagens();
      setShowForm(false);
      setForm(createEmptyForm());
      setPortraitFile(null);
    } catch (error) {
      console.error("[characters:create]", error);
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar o personagem.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("characters").delete().eq("id", id);
      if (error) throw error;
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
        .deprac-section{grid-column:1/-1;border-top:1px solid rgba(100,20,20,.4);padding-top:1.25rem;margin-top:.35rem}
        .deprac-title{font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.16em;color:#cc1a1a;margin-bottom:1rem}
        .deprac-help{font-size:.86rem;color:#8a6060;margin:-.55rem 0 1rem;line-height:1.35}
        .deprac-skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.55rem}
        .deprac-skill{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.5rem .65rem;background:rgba(5,1,1,.7);border:1px solid rgba(80,15,15,.35);font-size:.82rem;color:#c8b8b8}
        .deprac-skill select{background:#120505;color:#e0d4d4;border:1px solid rgba(140,30,30,.5);padding:.25rem}
        .deprac-status{grid-column:1/-1;padding:.65rem .8rem;border:1px solid rgba(180,30,30,.35);font-size:.86rem;color:#c8b8b8}
        .deprac-status.invalid{color:#ff8a8a;border-color:rgba(220,60,60,.7)}
        .deprac-overload{color:#ff8a8a}
        .deprac-equipment{display:grid;gap:.5rem}
        .deprac-equipment-row{display:grid;grid-template-columns:1.1fr 72px 88px 1.5fr;gap:.45rem}
        .deprac-qty{text-align:center}
        .deprac-add-item{margin-top:.7rem;background:transparent;border:1px solid rgba(150,30,30,.5);color:#dba0a0;padding:.45rem .75rem;cursor:pointer;font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.08em}
        .deprac-rolls{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.5rem;margin-top:1rem}
        .deprac-roll{display:flex;justify-content:space-between;align-items:center;gap:.5rem;background:#130505;border:1px solid rgba(130,25,25,.45);padding:.5rem .65rem;color:#d8c4c4;font:inherit;cursor:pointer}
        .deprac-roll strong{color:#dc3434}
        .deprac-result{margin-top:1rem;padding:.8rem;border:1px solid rgba(200,35,35,.6);background:rgba(90,10,10,.18);color:#f2dede}
        @media(max-width:620px){.deprac-equipment-row{grid-template-columns:1fr 70px 78px}.deprac-equipment-row input:last-child{grid-column:1/-1}}
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
        .char-edit{
          position:absolute;bottom:10px;left:10px;z-index:2;
          border:1px solid rgba(180,30,30,0.4);background:rgba(22,3,3,.88);
          color:#c79595;padding:5px 10px;text-decoration:none;
          font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;
          transition:all .2s;opacity:0;
        }
        .char-card:hover .char-edit{opacity:1;}
        .char-edit:hover{border-color:#cc1a1a;background:#5f0808;color:#fff;}

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
        .modal-edit{position:absolute;top:12px;left:12px;border:1px solid rgba(150,30,30,.5);color:#c99797;padding:5px 11px;text-decoration:none;font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;transition:all .2s;}
        .modal-edit:hover{border-color:#cc1a1a;background:#5f0808;color:#fff;}
        @media(max-width:768px){.char-edit,.char-delete{opacity:1}}

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

        .portrait-picker{display:flex;align-items:center;gap:1rem;padding:1rem;border:1px dashed rgba(160,35,35,.55);background:rgba(35,5,5,.35)}
        .portrait-preview{width:86px;height:86px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(180,35,35,.55);background:#120505;color:#813030;font-size:2.4rem;flex-shrink:0}
        .portrait-preview img{width:100%;height:100%;object-fit:cover}
        .portrait-copy{display:grid;gap:.35rem;min-width:0}
        .portrait-copy strong{font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.09em;color:#dfcaca}
        .portrait-copy span{font-size:.84rem;color:#8a6060}
        .portrait-upload-btn{width:max-content;margin-top:.3rem;padding:.45rem .7rem;border:1px solid rgba(180,35,35,.65);background:rgba(100,10,10,.4);color:#f0dada;cursor:pointer;font-family:'Cinzel',serif;font-size:.63rem;letter-spacing:.08em}
        .portrait-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
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
                <span className="nav-icon"><Icon name={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-user">
            <img src={avatarUrl || "/avatar.png"} alt="avatar" className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">Aventureiro</span>
            </div>
            <button className="logout-btn" onClick={() => { void supabase.auth.signOut(); router.replace("/login"); }} title="Sair"><Icon name="sair" /></button>
          </div>
        </aside>

        <div className="overlay" onClick={() => setSideOpen(false)} />

        {/* ── Main ── */}
        <div className="main">
          <header className="topbar">
            <span className="topbar-title"><Icon name="pingente" /> Personagens</span>
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
                {showForm ? <><Icon name="fechar" /> Cancelar</> : "+ Novo Personagem"}
              </button>
            </div>

            {/* Formulário de criação */}
            {showForm && (
              <>
                <div className="form-group">
                  <label className="form-label">Sistema</label>
                  <select
                    value={form.sistema}
                    onChange={(e) => setForm((previous) => ({
                      ...previous,
                      sistema: e.target.value as SistemaKey,
                      atributos: {},
                    }))}
                    className="form-input"
                  >
                    <option value="purgatum">Purgatum</option>
                    <option value="ordem">Ordem Paranormal</option>
                    <option value="dnd">D&D</option>
                    <option value="deprac">DEPRAC - O Problema</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="form-panel">
                <div className="form-panel-header">
                  <span className="form-panel-title">Forjar Novo Personagem</span>
                  <button className="form-close" onClick={() => setShowForm(false)}><Icon name="fechar" /></button>
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

                  {form.sistema === "deprac" ? <>
                    <div className="form-group"><label className="form-label">Agência / Afiliação</label><input className="form-input" value={form.deprac.agency} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, agency: e.target.value } }))} /></div>
                    <div className="form-group"><label className="form-label">Codinome</label><input className="form-input" value={form.deprac.codename} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, codename: e.target.value } }))} /></div>
                    <div className="form-group"><label className="form-label">Número do agente</label><input className="form-input" value={form.deprac.agentNumber} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, agentNumber: e.target.value } }))} /></div>
                    <div className="form-group"><label className="form-label">Idade</label><input type="number" min="1" className="form-input" value={form.deprac.age} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, age: e.target.value } }))} /></div>
                    <div className="form-group full"><label className="form-label">Data de registro</label><input type="date" className="form-input" value={form.deprac.registrationDate} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, registrationDate: e.target.value } }))} /></div>
                  </> : <>
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
                  </>}

                  {/* Avatar */}
                  <div className="form-group full">
                    <label className="form-label">Avatar</label>
                    <div className="avatar-picker">
                      {AVATARES.map(a => (
                        <button
                          type="button"
                          key={a}
                          className={`avatar-opt ${form.avatar === a ? "selected" : ""}`}
                          onClick={() => setForm(p => ({ ...p, avatar: a }))}
                          title={a}
                        >
                          <Icon name={a} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nível */}
                  {form.sistema === "deprac" ? (
                    <>
                      <div className="deprac-section"><p className="deprac-title">02 // Talento psíquico</p><div className="form-grid"><div className="form-group"><label className="form-label">Talento</label><select className="form-select" value={form.deprac.psychicTalent} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, psychicTalent: e.target.value as DepracSheet["psychicTalent"] } }))}><option value="">Selecione um talento</option><option value="Visão">Visão</option><option value="Audição">Audição</option><option value="Tato">Tato</option></select></div></div></div>
                      <div className="deprac-section"><p className="deprac-title">03 // Estado operacional</p><div className="form-grid"><div className="form-group"><label className="form-label">Vitalidade</label><input className="form-input" placeholder="Ex.: 8/8" value={form.deprac.vitality} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, vitality: e.target.value } }))} /></div><div className="form-group"><label className="form-label">Condição atual</label><input className="form-input" value={form.deprac.condition} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, condition: e.target.value } }))} /></div><div className="form-group"><label className="form-label">Estresse / Sanidade</label><input className="form-input" placeholder="Ex.: 2/10" value={form.deprac.stress} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, stress: e.target.value } }))} /></div><div className="form-group"><label className="form-label">Exposição psíquica</label><input className="form-input" value={form.deprac.psychicExposure} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, psychicExposure: e.target.value } }))} /></div><div className="form-group full"><label className="form-label">Incidentes de ghost-touch</label><input className="form-input" value={form.deprac.ghostTouchIncidents} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, ghostTouchIncidents: e.target.value } }))} /></div></div></div>
                      <div className="deprac-section"><p className="deprac-title">04 // Competências e treinamento</p><div className="form-group"><label className="form-label">Formação</label><select className="form-select" value={form.deprac.formation} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, formation: e.target.value as DepracFormation, dominantTalent: "", skills: createDepracSkills() } }))}><option value="formed">Agente formado - 2 d8 e 3 d6</option><option value="incomplete">Agente incompleto / Prodígio - 1 d10 e 2 d8</option></select></div>{form.deprac.formation === "incomplete" && <div className="form-group"><label className="form-label">Talento dominante (Prodígio)</label><select className="form-select" value={form.deprac.dominantTalent} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, dominantTalent: e.target.value as DepracSheet["dominantTalent"] } }))}><option value="">Selecione</option><option value="Visão">Visão</option><option value="Audição">Audição</option><option value="Tato">Tato</option></select></div>}<p className="deprac-help">Todas começam em d4. d12 e d20 só podem ser obtidos durante o jogo.</p><div className={`deprac-status ${depracDistributionValid ? "" : "invalid"}`}>Distribuição: d6 {depracDiceCounts[6]} · d8 {depracDiceCounts[8]} · d10 {depracDiceCounts[10]} · {depracDistributionValid ? "pronta" : "incompleta"}</div><div className="deprac-skills">{DEPRAC_SKILLS.map(skill => <label className="deprac-skill" key={skill}><span>{skill}</span><select value={form.deprac.skills[skill]} onChange={e => updateDepracSkill(skill, Number(e.target.value) as DepracDie)}>{DEPRAC_DICE.map(die => <option key={die} value={die}>d{die}</option>)}</select></label>)}</div></div>
                      <div className="deprac-section"><p className="deprac-title">05 // Equipamento autorizado</p><p className={`deprac-help ${depracSlotsUsed > 8 ? "deprac-overload" : ""}`}>Capacidade ocupada: {depracSlotsUsed}/8 espaços</p><div className="deprac-equipment">{form.deprac.equipment.map((item, index) => <div className="deprac-equipment-row" key={index}><input className="form-input" placeholder="Item" value={item.name} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, equipment: p.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: e.target.value } : entry) } }))} /><input className="form-input deprac-qty" type="number" min="0" placeholder="Qtd." value={item.quantity || ""} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, equipment: p.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: e.target.value } : entry) } }))} /><input className="form-input deprac-qty" type="number" min="0" placeholder="Espaços" value={item.slots || ""} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, equipment: p.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, slots: Math.max(0, Number(e.target.value)) } : entry) } }))} /><input className="form-input" placeholder="Condição / observações" value={item.notes} onChange={e => setForm(p => ({ ...p, deprac: { ...p.deprac, equipment: p.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, notes: e.target.value } : entry) } }))} /></div>)}</div><button type="button" className="deprac-add-item" onClick={() => setForm(p => ({ ...p, deprac: { ...p.deprac, equipment: [...p.deprac.equipment, { name: "", quantity: "1", notes: "", slots: 0 }] } }))}>+ Adicionar item</button></div>
                    </>
                  ) : (<div className="atributos-grid">
  {systems[form.sistema].atributos.map((attr) => (
    <div key={attr} className="form-group">
      <label className="form-label">{attr}</label>
      <input
        type="number"
        className="form-input"
        onChange={(e) =>
          setForm((prev) => ({
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
</div>)}

                  <div className="form-group full">
                    <label className="form-label">Retrato do personagem</label>
                    <div className="portrait-picker">
                      <div className="portrait-preview">
                        {form.foto ? <img src={form.foto} alt="Prévia do retrato" /> : <Icon name={form.avatar} />}
                      </div>
                      <div className="portrait-copy">
                        <strong>{form.foto ? "Retrato selecionado" : "Nenhum retrato selecionado"}</strong>
                        <span>{form.foto ? portraitFile?.name : "Use uma imagem para identificar o personagem."}</span>
                        <span>PNG, JPG ou WEBP · até 2 MB</span>
                        <label className="portrait-upload-btn" htmlFor="portrait-upload">{form.foto ? "Trocar imagem" : "Escolher imagem"}</label>
                      </div>
                    </div>
                    <input
                      id="portrait-upload"
                      className="portrait-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > MAX_PORTRAIT_SIZE_BYTES) {
                            setPortraitFile(null);
                            setForm((prev) => ({ ...prev, foto: "" }));
                            setSaveError("O retrato deve ter no máximo 2 MB.");
                            e.target.value = "";
                            return;
                          }
                          setPortraitFile(file);
                          setSaveError("");
                          setForm((prev) => ({ ...prev, foto: URL.createObjectURL(file) }));
                        }
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vida base</label>
                    <input type="number" min="0" className="form-input" value={form.vidaBase} onChange={event => setForm(previous => ({ ...previous, vidaBase: Math.max(0, Number(event.target.value)) }))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sanidade base</label>
                    <input type="number" min="0" className="form-input" value={form.sanidadeBase} onChange={event => setForm(previous => ({ ...previous, sanidadeBase: Math.max(0, Number(event.target.value)) }))} />
                  </div>

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
                  {saveError && <p role="alert" style={{ color: "#ff8a8a", marginRight: "auto" }}>{saveError}</p>}
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
                <div className="empty-icon"><Icon name="avatarMago" /></div>
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
                      {renderAvatar(p.avatar, "4rem", p.foto)}
                      <span className="char-nivel-badge">Nível {p.nivel}</span>
                    </div>
                    <div className="char-body">
                      <div className="char-name">{p.nome}</div>
                      <div className="char-meta">{p.classe} · {p.raca}</div>
                      {p.descricao && <div className="char-desc">{p.descricao}</div>}
                    </div>
                    <Link
                      className="char-edit"
                      href={`/personagens/${p.id}/editar`}
                      onClick={event => event.stopPropagation()}
                    >
                      Editar
                    </Link>
                    <button
                      className="char-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "..." : <Icon name="fechar" />}
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
            <Link className="modal-edit" href={`/personagens/${selectedChar.id}/editar`}>Editar ficha</Link>
            <button className="modal-close" onClick={() => setSelectedChar(null)}><Icon name="fechar" /> Fechar</button>
            <div className="modal-avatar">{renderAvatar(selectedChar.avatar, "7rem", selectedChar.foto)}</div>
            <div className="modal-body">
              <div className="modal-name">{selectedChar.nome}</div>
              <div className="modal-meta">{selectedChar.classe} · {selectedChar.raca} · Nível {selectedChar.nivel}</div>
              {selectedChar.descricao
                ? <div className="modal-desc">"{selectedChar.descricao}"</div>
                : <div className="modal-desc" style={{ color: "#3a2020" }}>Sem história registrada ainda...</div>
              }
              {getDepracSheet(selectedChar) && (() => {
                const sheet = getDepracSheet(selectedChar)!;
                return <div className="deprac-section"><p className="deprac-title">Rolagem de competências</p><p className="deprac-help">Clique em uma competência para rolar o dado registrado na ficha.</p><div className="deprac-rolls">{DEPRAC_SKILLS.map(skill => <button className="deprac-roll" type="button" key={skill} onClick={() => rollDepracSkill(skill, sheet.skills[skill])}><span>{skill}</span><strong>d{sheet.skills[skill]}</strong></button>)}</div>{depracRoll && <div className="deprac-result">{depracRoll.skill}: <strong>{depracRoll.value}</strong> em d{depracRoll.die}{depracRoll.value === depracRoll.die ? " — crítico!" : ""}</div>}</div>;
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getDepracSheet(character: Personagem): DepracSheet | null {
  if (character.sistema !== "deprac") return null;
  return (character.atributos as { deprac?: DepracSheet }).deprac ?? null;
}
