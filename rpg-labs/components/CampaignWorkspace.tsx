"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import CampaignSessionRoom from "@/components/CampaignSessionRoom";
import { supabase } from "@/lib/supabase/client";

type Campaign = { id: string; owner_id: string; name: string; description: string; system: string; logo_url: string | null; invite_code: string | null };
type Member = { user_id: string; role: "master" | "player" };
type Tab = "visao" | "membros" | "sessoes" | "editar";

const systemLabels: Record<string, string> = { purgatum: "Purgatum", deprac: "DEPRAC — O Problema", ordem: "Ordem Paranormal", dnd: "D&D 5e", outro: "Outro sistema" };

export default function CampaignWorkspace({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("visao");
  const [notice, setNotice] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSystem, setEditSystem] = useState("purgatum");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");
      setUserId(user.id);
      const [campaignResult, membersResult] = await Promise.all([
        supabase.from("campaigns").select("id, owner_id, name, description, system, logo_url, invite_code").eq("id", campaignId).maybeSingle(),
        supabase.from("campaign_members").select("user_id, role").eq("campaign_id", campaignId),
      ]);
      if (campaignResult.error || !campaignResult.data) return router.replace("/campanhas");
      const loadedCampaign = campaignResult.data as Campaign;
      setCampaign(loadedCampaign);
      setEditName(loadedCampaign.name);
      setEditDescription(loadedCampaign.description);
      setEditSystem(loadedCampaign.system);
      setMembers((membersResult.data ?? []) as Member[]);
    };
    void load();
  }, [campaignId, router]);

  const copyInvite = async () => {
    if (!campaign?.invite_code) return;
    const url = `${window.location.origin}/campanhas?invite=${campaign.invite_code}`;
    try { await navigator.clipboard.writeText(url); setNotice("Link de convite copiado."); }
    catch { setNotice(`Copie este link: ${url}`); }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setNotice("A logo deve ter no máximo 2 MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const saveCampaign = async () => {
    if (!campaign || !userId || !editName.trim()) return setNotice("Informe o nome da campanha.");
    setSaving(true);
    let logoUrl = campaign.logo_url;
    try {
      if (logoFile) {
        const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${userId}/${campaign.id}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("campaign-logos").upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from("campaign-logos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("campaigns").update({ name: editName.trim(), description: editDescription.trim(), system: editSystem, logo_url: logoUrl }).eq("id", campaign.id);
      if (error) throw error;
      setCampaign({ ...campaign, name: editName.trim(), description: editDescription.trim(), system: editSystem, logo_url: logoUrl });
      setLogoFile(null);
      setLogoPreview("");
      setNotice("Campanha atualizada com sucesso.");
      setTab("visao");
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a campanha.");
    } finally { setSaving(false); }
  };

  if (!campaign) return <div className="workspace-loading">Carregando mesa...</div>;
  const isMaster = campaign.owner_id === userId;
  if (tab === "sessoes" && userId) {
    return <main className="session-page"><div className="session-shell"><button className="session-back" onClick={() => router.push("/campanhas")}>← Todas as campanhas</button><header className="session-hero"><div className="session-logo">{campaign.logo_url ? <img src={campaign.logo_url} alt={`Logo da campanha ${campaign.name}`} /> : <Icon name="campanhas" />}</div><div><p className="session-eyebrow">Sessão da campanha</p><h1 className="session-title">{campaign.name}</h1><p className="session-description">{isMaster ? "Escudo do Mestre e direção da transmissão." : "Acompanhe a transmissão e entre com sua câmera."}</p></div></header><button className="session-back session-return" onClick={() => setTab("visao")}>← Voltar à campanha</button><section className="session-content"><CampaignSessionRoom campaignId={campaign.id} userId={userId} masterUserId={campaign.owner_id} isMaster={isMaster} /></section></div></main>;
  }
  const tabs: { id: Tab; label: string }[] = [{ id: "visao", label: "Visão geral" }, { id: "membros", label: "Jogadores" }, { id: "sessoes", label: "Sessões" }, ...(isMaster ? [{ id: "editar" as Tab, label: "Editar campanha" }] : [])];

  return <main className="workspace-page"><style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
    .workspace-page{min-height:100vh;padding:clamp(1rem,4vw,3rem);background:radial-gradient(circle at 85% 0,#2b0808 0,#0b0202 42%,#030101 100%);color:#eadada;font-family:'Crimson Pro',serif}.workspace-shell{max-width:1100px;margin:auto}.workspace-loading{min-height:100vh;display:grid;place-items:center;background:#050101;color:#bd8a8a;font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}.workspace-back{border:0;background:transparent;color:#c58d8d;padding:0;cursor:pointer;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.11em;text-transform:uppercase}.workspace-back:hover{color:#fff}.workspace-hero{display:grid;grid-template-columns:130px 1fr;gap:1.5rem;align-items:center;margin:1.5rem 0}.workspace-logo{height:130px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(205,45,45,.65);background:linear-gradient(145deg,#5b0a0a,#150303);color:#ed4c4c;font-size:3rem}.workspace-logo img{width:100%;height:100%;object-fit:cover}.workspace-eyebrow{margin:0;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.17em;text-transform:uppercase;color:#d29a61}.workspace-title{margin:.4rem 0;font-family:'Cinzel',serif;font-size:clamp(1.8rem,5vw,3.25rem);letter-spacing:.05em;color:#fff}.workspace-description{max-width:650px;margin:0;color:#c4aeae;font-size:1.08rem;line-height:1.45}.workspace-status{display:inline-flex;align-items:center;gap:.4rem;margin-top:.8rem;color:#b98e8e;font-size:.92rem}.workspace-status i{color:#e34444;font-size:.7rem}.workspace-tabs{display:flex;gap:.4rem;overflow:auto;border-bottom:1px solid rgba(165,35,35,.35);margin-top:2rem}.workspace-tab{border:0;border-bottom:2px solid transparent;background:transparent;padding:.8rem 1rem;color:#a98888;cursor:pointer;font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.09em;white-space:nowrap}.workspace-tab.active{color:#fff;border-color:#df3939}.workspace-panel{padding-top:1.5rem}.workspace-grid{display:grid;grid-template-columns:1.35fr .8fr;gap:1rem}.workspace-card{border:1px solid rgba(160,35,35,.38);background:rgba(28,4,4,.72);padding:1.15rem}.workspace-card-title{margin:0 0 .8rem;font-family:'Cinzel',serif;font-size:.76rem;letter-spacing:.11em;text-transform:uppercase;color:#efdddd}.workspace-copy{margin:0;color:#c0a7a7;line-height:1.5;font-size:1.03rem}.workspace-stat{display:flex;justify-content:space-between;border-bottom:1px solid rgba(150,35,35,.22);padding:.55rem 0;color:#cbb4b4}.workspace-stat strong{color:#fff;font-family:'Cinzel',serif}.workspace-code{display:flex;justify-content:space-between;align-items:center;gap:.5rem;border:1px solid rgba(180,40,40,.35);background:#0d0303;padding:.65rem .7rem;font-family:monospace;letter-spacing:.1em}.workspace-copy-button{border:1px solid rgba(195,45,45,.55);background:rgba(100,10,10,.25);color:#f0d6d6;padding:.48rem .65rem;cursor:pointer;font-family:'Cinzel',serif;font-size:.57rem;letter-spacing:.08em}.workspace-notice{margin-top:.75rem;border-left:2px solid #d53737;padding:.5rem .7rem;background:rgba(120,12,12,.19);color:#f0cece}.workspace-members{display:grid;gap:.65rem}.workspace-member{display:flex;align-items:center;justify-content:space-between;gap:1rem;border:1px solid rgba(150,35,35,.32);padding:.8rem;background:rgba(20,3,3,.54)}.workspace-member-title{display:flex;align-items:center;gap:.6rem;color:#eadada}.workspace-member-title i{color:#db4545}.workspace-badge{padding:.25rem .45rem;border:1px solid rgba(185,50,50,.45);color:#dba8a8;font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.07em;text-transform:uppercase}.workspace-empty{padding:3rem 1rem;text-align:center;border:1px dashed rgba(160,35,35,.38);color:#ad8888}.workspace-empty i{display:block;margin-bottom:.75rem;color:#923030;font-size:2rem}.workspace-edit{max-width:720px;display:grid;gap:1rem}.workspace-label{display:grid;gap:.4rem;color:#d0afaf;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.09em;text-transform:uppercase}.workspace-input,.workspace-select,.workspace-textarea{width:100%;border:1px solid rgba(170,35,35,.45);background:#110404;color:#f0dddd;padding:.7rem .8rem;font:inherit;text-transform:none;letter-spacing:normal}.workspace-textarea{min-height:110px;resize:vertical}.workspace-input:focus,.workspace-select:focus,.workspace-textarea:focus{outline:none;border-color:#e23b3b}.workspace-logo-picker{display:flex;align-items:center;gap:.8rem;padding:.7rem;border:1px dashed rgba(170,35,35,.45);background:#160404}.workspace-logo-preview{width:62px;height:62px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(185,35,35,.5);color:#d83d3d;font-size:1.4rem}.workspace-logo-preview img{width:100%;height:100%;object-fit:cover}.workspace-file{position:absolute;width:1px;height:1px;opacity:0}.workspace-file-button{display:inline-block;margin-top:.35rem;border:1px solid rgba(195,45,45,.55);padding:.42rem .6rem;color:#ecd6d6;cursor:pointer;font-size:.58rem}.workspace-save{justify-self:start;border:1px solid #d43737;background:linear-gradient(135deg,#900b0b,#430202);color:#fff;padding:.72rem .95rem;cursor:pointer;font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.09em;text-transform:uppercase}.workspace-save:disabled{opacity:.55;cursor:wait}@media(max-width:700px){.workspace-hero{grid-template-columns:82px 1fr;gap:1rem}.workspace-logo{height:82px;font-size:2rem}.workspace-grid{grid-template-columns:1fr}.workspace-title{font-size:1.7rem}}
  `}</style><div className="workspace-shell"><button className="workspace-back" onClick={() => router.push("/campanhas")}>← Todas as campanhas</button><header className="workspace-hero"><div className="workspace-logo">{campaign.logo_url ? <img src={campaign.logo_url} alt={`Logo da campanha ${campaign.name}`} /> : <Icon name="campanhas" />}</div><div><p className="workspace-eyebrow">{systemLabels[campaign.system] ?? campaign.system}</p><h1 className="workspace-title">{campaign.name}</h1><p className="workspace-description">{campaign.description || "Sem descrição registrada."}</p><span className="workspace-status"><Icon name="selo" />{isMaster ? "Você é o mestre desta mesa" : "Você participa desta mesa"}</span></div></header><nav className="workspace-tabs">{tabs.map(item => <button className={`workspace-tab ${tab === item.id ? "active" : ""}`} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav><section className="workspace-panel">{tab === "visao" && <div className="workspace-grid"><article className="workspace-card"><h2 className="workspace-card-title">Sobre a campanha</h2><p className="workspace-copy">Este é o centro da mesa. Aqui ficam os convites, participantes, sessões e os registros que serão adicionados a seguir.</p><div style={{ marginTop: "1rem" }}><div className="workspace-stat"><span>Sistema</span><strong>{systemLabels[campaign.system] ?? campaign.system}</strong></div><div className="workspace-stat"><span>Participantes</span><strong>{members.length || 1}</strong></div></div></article><aside className="workspace-card"><h2 className="workspace-card-title">Convite da mesa</h2>{campaign.invite_code ? <><div className="workspace-code"><span>{campaign.invite_code}</span><button className="workspace-copy-button" onClick={() => void copyInvite()}>Copiar link</button></div><p className="workspace-copy" style={{ marginTop: ".75rem" }}>Envie o link ou o código para jogadores entrarem.</p></> : <p className="workspace-copy">O código será disponibilizado após aplicar a migration de convites.</p>}{notice && <p className="workspace-notice">{notice}</p>}</aside></div>}{tab === "membros" && <div className="workspace-members">{members.map((member, index) => <article className="workspace-member" key={member.user_id}><div className="workspace-member-title"><Icon name={member.role === "master" ? "selo" : "usuario"} /><span>{member.role === "master" ? "Mestre da campanha" : `Jogador ${index + 1}`}{member.user_id === userId ? " (você)" : ""}</span></div><span className="workspace-badge">{member.role === "master" ? "Mestre" : "Jogador"}</span></article>)}{!members.length && <div className="workspace-empty"><Icon name="usuario" />A lista de jogadores aparecerá aqui.</div>}</div>}{tab === "editar" && isMaster && <div className="workspace-edit"><label className="workspace-label">Nome da campanha<input className="workspace-input" value={editName} maxLength={120} onChange={event => setEditName(event.target.value)} /></label><label className="workspace-label">Sistema<select className="workspace-select" value={editSystem} onChange={event => setEditSystem(event.target.value)}><option value="purgatum">Purgatum</option><option value="deprac">DEPRAC — O Problema</option><option value="ordem">Ordem Paranormal</option><option value="dnd">D&D 5e</option><option value="outro">Outro sistema</option></select></label><label className="workspace-label">Descrição<textarea className="workspace-textarea" value={editDescription} maxLength={1000} onChange={event => setEditDescription(event.target.value)} /></label><div className="workspace-label">Logo da campanha<div className="workspace-logo-picker"><div className="workspace-logo-preview">{logoPreview || campaign.logo_url ? <img src={logoPreview || campaign.logo_url || ""} alt="Prévia da logo" /> : <Icon name="campanhas" />}</div><div><span>{logoFile ? logoFile.name : "PNG, JPG ou WEBP · até 2 MB"}</span><label className="workspace-file-button" htmlFor="workspace-logo-file">Trocar logo</label></div></div><input id="workspace-logo-file" className="workspace-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} /></div><button className="workspace-save" disabled={saving} onClick={() => void saveCampaign()}>{saving ? "Salvando..." : "Salvar alterações"}</button>{notice && <p className="workspace-notice">{notice}</p>}</div>}{tab === "sessoes" && <div className="workspace-empty"><Icon name="dados" />Nenhuma sessão agendada.<br />O calendário e a chamada da campanha serão adicionados aqui.</div>}</section></div></main>;
}
