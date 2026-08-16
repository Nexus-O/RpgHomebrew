"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Icon, { type IconName } from "@/components/Icon";

type Campaign = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  system: string;
  logo_url: string | null;
  invite_code: string | null;
  created_at: string;
};

type SelectableCharacter = { id: string; nome: string; sistema: string; avatar: string; foto_url: string | null };

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const SYSTEMS = [
  { value: "purgatum", label: "Purgatum" },
  { value: "deprac", label: "DEPRAC — O Problema" },
  { value: "ordem", label: "Ordem Paranormal" },
  { value: "dnd", label: "D&D 5e" },
  { value: "outro", label: "Outro sistema" },
];

function newCampaignCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export default function CampaignsClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [characterCampaign, setCharacterCampaign] = useState<Pick<Campaign, "id" | "name" | "system"> | null>(null);
  const [eligibleCharacters, setEligibleCharacters] = useState<SelectableCharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [selectingCharacter, setSelectingCharacter] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [system, setSystem] = useState("purgatum");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const inviteHandled = useRef(false);

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, owner_id, name, description, system, logo_url, invite_code, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setCampaigns((data ?? []) as Campaign[]);
  };

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      try {
        await loadCampaigns();
      } catch (error) {
        console.error(error);
        setMessage("Não foi possível carregar as campanhas.");
      } finally {
        setLoading(false);
      }
    };
    void initialize();
  }, [router]);

  const joinCampaign = async (rawCode: string, fromInvite = false) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setMessage("Informe o código da campanha.");
      return;
    }
    setJoining(true);
    setMessage("");
    const { data: joinedCampaignId, error } = await supabase.rpc("join_campaign_by_code", { code });
    if (error) {
      setMessage(error.message.includes("inválido") ? "Código inválido ou campanha indisponível." : error.message);
    } else {
      const { data: campaign } = await supabase.from("campaigns").select("id, name, system").eq("id", joinedCampaignId).maybeSingle();
      setJoinCode("");
      setMessage(fromInvite ? "Você entrou na campanha pelo convite." : "Você entrou na campanha com sucesso.");
      await loadCampaigns();
      if (campaign) await openCharacterPicker(campaign as Pick<Campaign, "id" | "name" | "system">);
    }
    setJoining(false);
  };

  const openCharacterPicker = async (campaign: Pick<Campaign, "id" | "name" | "system">) => {
    setCharacterCampaign(campaign);
    setLoadingCharacters(true);
    const { data, error } = await supabase
      .from("characters")
      .select("id, nome, sistema, avatar, foto_url")
      .eq("sistema", campaign.system)
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Não foi possível carregar seus personagens.");
      setEligibleCharacters([]);
    } else {
      setEligibleCharacters((data ?? []) as SelectableCharacter[]);
    }
    setLoadingCharacters(false);
  };

  const chooseCharacter = async (characterId: string) => {
    if (!characterCampaign) return;
    setSelectingCharacter(true);
    const { error } = await supabase.from("characters").update({ campaign_id: characterCampaign.id }).eq("id", characterId);
    if (error) {
      setMessage("Não foi possível vincular o personagem à campanha.");
      setSelectingCharacter(false);
      return;
    }
    router.push(`/campanhas/${characterCampaign.id}`);
  };

  useEffect(() => {
    if (!userId || inviteHandled.current) return;
    const code = new URLSearchParams(window.location.search).get("invite");
    if (!code) return;
    inviteHandled.current = true;
    void joinCampaign(code, true);
  }, [userId]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setMessage("A logo deve ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSystem("purgatum");
    setLogoFile(null);
    setLogoPreview("");
  };

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || !name.trim()) {
      setMessage("Dê um nome para a campanha.");
      return;
    }
    setCreating(true);
    setMessage("");
    const campaignId = crypto.randomUUID();
    let logoUrl: string | null = null;

    try {
      if (logoFile) {
        const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${userId}/${campaignId}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("campaign-logos")
          .upload(path, logoFile, { contentType: logoFile.type, upsert: false });
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from("campaign-logos").getPublicUrl(path).data.publicUrl;
      }

      let inserted = false;
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
        const { error } = await supabase.from("campaigns").insert({
          id: campaignId,
          owner_id: userId,
          name: name.trim(),
          description: description.trim(),
          system,
          logo_url: logoUrl,
          invite_code: newCampaignCode(),
        });
        if (!error) {
          inserted = true;
          break;
        }
        lastError = error;
        if (error.code !== "23505") throw error;
      }
      if (!inserted) throw lastError ?? new Error("Não foi possível gerar um código de convite.");

      const { error: memberError } = await supabase.from("campaign_members").insert({
        campaign_id: campaignId,
        user_id: userId,
        role: "master",
      });
      if (memberError) throw memberError;

      await loadCampaigns();
      resetForm();
      setShowCreate(false);
      setMessage("Campanha criada. Compartilhe o código ou o link de convite.");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Não foi possível criar a campanha.");
    } finally {
      setCreating(false);
    }
  };

  const copyInvite = async (campaign: Campaign) => {
    if (!campaign.invite_code) return;
    const url = `${window.location.origin}/campanhas?invite=${campaign.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(`Link de convite de “${campaign.name}” copiado.`);
    } catch {
      setMessage(`Copie este link: ${url}`);
    }
  };

  if (loading) return <div className="campaign-loading">Carregando campanhas...</div>;

  return (
    <main className="campaign-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        .campaign-page{min-height:100vh;padding:clamp(1.25rem,4vw,4rem);background:radial-gradient(circle at 50% 0,#280707 0,#0a0202 45%,#030101 100%);color:#eadada;font-family:'Crimson Pro',serif}
        .campaign-shell{width:min(1120px,100%);margin:auto}.campaign-top{display:flex;justify-content:space-between;gap:1.5rem;align-items:flex-end;margin-bottom:2rem}.campaign-kicker{font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.2em;color:#bd5a5a;text-transform:uppercase}.campaign-title{margin:.45rem 0 0;font-family:'Cinzel',serif;font-size:clamp(1.8rem,5vw,3.1rem);letter-spacing:.06em;color:#fff}.campaign-sub{margin:.6rem 0 0;color:#b89f9f;font-size:1.08rem}.campaign-header-actions{display:flex;align-items:center;gap:.65rem}.campaign-dashboard{border:1px solid rgba(175,40,40,.5);background:transparent;padding:.74rem .9rem;color:#d9bcbc;font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.campaign-dashboard:hover{border-color:#e33b3b;color:#fff}.campaign-primary{border:1px solid #c62b2b;background:linear-gradient(135deg,#970d0d,#4c0303);padding:.78rem 1rem;color:#fff;font-family:'Cinzel',serif;font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.campaign-primary:hover{box-shadow:0 0 20px rgba(205,30,30,.35)}
        .campaign-join{display:grid;grid-template-columns:1fr auto;gap:.75rem;padding:1rem;border:1px solid rgba(170,35,35,.42);background:rgba(34,4,4,.72);margin-bottom:1.5rem}.campaign-join-label{grid-column:1/-1;font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.14em;color:#c7a0a0;text-transform:uppercase}.campaign-input,.campaign-select,.campaign-textarea{width:100%;border:1px solid rgba(160,35,35,.45);background:#100404;color:#f0dddd;padding:.7rem .8rem;font:inherit;font-size:1rem}.campaign-input:focus,.campaign-select:focus,.campaign-textarea:focus{outline:none;border-color:#dd3636;box-shadow:0 0 12px rgba(200,30,30,.2)}.campaign-join-button{border:1px solid rgba(200,45,45,.7);background:transparent;color:#ebdada;padding:.55rem 1rem;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.1em;cursor:pointer}.campaign-join-button:disabled,.campaign-primary:disabled{opacity:.55;cursor:not-allowed}
        .campaign-message{margin:0 0 1.25rem;padding:.75rem 1rem;border-left:2px solid #c72d2d;background:rgba(110,12,12,.2);color:#f0caca}.campaign-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}.campaign-card{overflow:hidden;border:1px solid rgba(160,35,35,.4);background:linear-gradient(145deg,rgba(42,5,5,.82),rgba(9,2,2,.95));min-height:290px}.campaign-logo{height:108px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#4a0808,#130303);color:#d54141;font-size:2.4rem}.campaign-logo img{width:100%;height:100%;object-fit:cover}.campaign-body{padding:1rem}.campaign-system{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.12em;color:#c78a55;text-transform:uppercase}.campaign-name{margin:.5rem 0;color:#fff;font-family:'Cinzel',serif;font-size:1.1rem}.campaign-description{min-height:45px;color:#bda6a6;line-height:1.35}.campaign-code{margin-top:1rem;display:flex;justify-content:space-between;gap:.5rem;align-items:center;padding:.55rem .65rem;border:1px solid rgba(170,35,35,.32);background:#0c0303;color:#ddc2c2;font-family:monospace;font-size:.86rem;letter-spacing:.08em}.campaign-copy{border:0;background:transparent;color:#dc4343;cursor:pointer;font:inherit;font-family:'Cinzel',serif;font-size:.56rem;letter-spacing:.06em}.campaign-role{margin-top:.65rem;color:#a78282;font-size:.84rem;font-style:italic}.campaign-empty{grid-column:1/-1;padding:4rem 1rem;border:1px dashed rgba(150,35,35,.35);text-align:center;color:#a88181}.campaign-empty i{display:block;margin-bottom:1rem;color:#923030;font-size:2.5rem}
        .campaign-overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:1rem;background:rgba(0,0,0,.75)}.campaign-modal{width:min(640px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(190,40,40,.55);background:#0e0303;padding:1.5rem;box-shadow:0 30px 90px rgba(0,0,0,.6)}.campaign-modal-top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.25rem}.campaign-modal-title{margin:.25rem 0 0;font-family:'Cinzel',serif;font-size:1.4rem;color:#fff}.campaign-close{border:0;background:transparent;color:#d2a5a5;cursor:pointer;font-size:1.2rem}.campaign-form{display:grid;gap:1rem}.campaign-label{display:grid;gap:.4rem;color:#c8aaaa;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.1em;text-transform:uppercase}.campaign-textarea{min-height:88px;resize:vertical}.campaign-logo-picker{display:flex;align-items:center;gap:1rem;padding:.75rem;border:1px dashed rgba(170,35,35,.5);background:rgba(50,5,5,.28)}.campaign-logo-preview{width:68px;height:68px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(170,35,35,.5);background:#190505;color:#a53636;font-size:1.7rem;flex-shrink:0}.campaign-logo-preview img{width:100%;height:100%;object-fit:cover}.campaign-file{position:absolute;width:1px;height:1px;opacity:0}.campaign-file-button{display:inline-block;margin-top:.45rem;padding:.45rem .65rem;border:1px solid rgba(190,45,45,.65);color:#ead4d4;cursor:pointer;font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.08em}.campaign-form-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:.25rem}.campaign-cancel{border:1px solid rgba(150,35,35,.4);background:transparent;color:#c6a1a1;padding:.7rem .9rem;cursor:pointer;font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.08em}
        .campaign-character-list{display:grid;gap:.65rem}.campaign-character-choice{display:flex;align-items:center;gap:.8rem;width:100%;border:1px solid rgba(165,35,35,.45);background:#150404;padding:.7rem;text-align:left;color:#ead6d6;cursor:pointer;font:inherit}.campaign-character-choice:hover{border-color:#e23b3b;background:#260707}.campaign-character-choice:disabled{opacity:.6;cursor:wait}.campaign-character-avatar{width:48px;height:48px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(185,35,35,.45);background:#300707;color:#df4444;font-size:1.3rem;flex-shrink:0}.campaign-character-avatar img{width:100%;height:100%;object-fit:cover}.campaign-character-name{font-family:'Cinzel',serif;font-size:.75rem;letter-spacing:.05em}.campaign-character-system{margin-top:.2rem;color:#ad8383;font-size:.88rem}.campaign-picker-empty{padding:1.25rem;border:1px dashed rgba(170,35,35,.35);text-align:center;color:#b58e8e}.campaign-skip{margin-top:.8rem;color:#b68c8c;background:transparent;border:0;cursor:pointer;font:inherit;text-decoration:underline}
        .campaign-loading{min-height:100vh;display:grid;place-items:center;background:#050101;color:#bd8a8a;font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}@media(max-width:650px){.campaign-top{align-items:stretch;flex-direction:column}.campaign-join{grid-template-columns:1fr}.campaign-join-button{min-height:42px}}
      `}</style>
      <div className="campaign-shell">
        <header className="campaign-top">
          <div><p className="campaign-kicker">Central de mesas</p><h1 className="campaign-title">Campanhas</h1><p className="campaign-sub">Crie sua mesa ou entre com um convite.</p></div>
          <div className="campaign-header-actions"><button className="campaign-dashboard" onClick={() => router.push("/dashboard")}>← Dashboard</button><button className="campaign-primary" onClick={() => setShowCreate(true)}>+ Criar campanha</button></div>
        </header>

        <section className="campaign-join"><label className="campaign-join-label" htmlFor="campaign-code">Entrar por código</label><input id="campaign-code" className="campaign-input" value={joinCode} maxLength={8} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Ex.: A7K9M2PQ" /><button className="campaign-join-button" disabled={joining} onClick={() => void joinCampaign(joinCode)}>{joining ? "Entrando..." : "Entrar"}</button></section>
        {message && <p className="campaign-message">{message}</p>}

        <section className="campaign-grid">
          {campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}><div className="campaign-logo">{campaign.logo_url ? <img src={campaign.logo_url} alt={`Logo da campanha ${campaign.name}`} /> : <Icon name="campanhas" />}</div><div className="campaign-body"><p className="campaign-system">{SYSTEMS.find((item) => item.value === campaign.system)?.label ?? campaign.system}</p><h2 className="campaign-name">{campaign.name}</h2><p className="campaign-description">{campaign.description || "Nenhuma descrição registrada."}</p>{campaign.invite_code && <div className="campaign-code"><span>{campaign.invite_code}</span><button className="campaign-copy" onClick={() => void copyInvite(campaign)}>Copiar link</button></div>}<p className="campaign-role">{campaign.owner_id === userId ? "Você é o mestre desta mesa" : "Você participa desta mesa"}</p><button className="campaign-copy" style={{ marginTop: ".8rem" }} onClick={() => router.push(`/campanhas/${campaign.id}`)}>Abrir campanha →</button></div></article>)}
          {!campaigns.length && <div className="campaign-empty"><Icon name="campanhas" />Nenhuma campanha por aqui ainda.<br />Crie uma mesa ou entre usando um código.</div>}
        </section>
      </div>

      {showCreate && <div className="campaign-overlay" onClick={() => setShowCreate(false)}><section className="campaign-modal" onClick={(event) => event.stopPropagation()}><div className="campaign-modal-top"><div><p className="campaign-kicker">Nova mesa</p><h2 className="campaign-modal-title">Criar campanha</h2></div><button className="campaign-close" onClick={() => setShowCreate(false)} aria-label="Fechar">×</button></div><form className="campaign-form" onSubmit={createCampaign}><label className="campaign-label">Nome da campanha<input className="campaign-input" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Ex.: O Problema" required /></label><label className="campaign-label">Sistema<select className="campaign-select" value={system} onChange={(event) => setSystem(event.target.value)}>{SYSTEMS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="campaign-label">Descrição<textarea className="campaign-textarea" value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} placeholder="Sobre o que é essa mesa?" /></label><div className="campaign-label">Logo da campanha<div className="campaign-logo-picker"><div className="campaign-logo-preview">{logoPreview ? <img src={logoPreview} alt="Prévia da logo" /> : <Icon name="campanhas" />}</div><div><span>{logoFile ? logoFile.name : "PNG, JPG ou WEBP · até 2 MB"}</span><label className="campaign-file-button" htmlFor="campaign-logo">Escolher logo</label></div></div><input id="campaign-logo" className="campaign-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} /></div><div className="campaign-form-actions"><button type="button" className="campaign-cancel" onClick={() => { resetForm(); setShowCreate(false); }}>Cancelar</button><button type="submit" className="campaign-primary" disabled={creating}>{creating ? "Criando..." : "Criar e gerar convite"}</button></div></form></section></div>}
      {characterCampaign && <div className="campaign-overlay"><section className="campaign-modal"><div className="campaign-modal-top"><div><p className="campaign-kicker">Personagem da mesa</p><h2 className="campaign-modal-title">Escolha sua ficha</h2></div></div><p className="campaign-sub" style={{ marginBottom: "1rem" }}>Escolha um personagem de <strong>{SYSTEMS.find((item) => item.value === characterCampaign.system)?.label ?? characterCampaign.system}</strong> para entrar em “{characterCampaign.name}”.</p>{loadingCharacters ? <div className="campaign-picker-empty">Carregando seus personagens...</div> : eligibleCharacters.length ? <div className="campaign-character-list">{eligibleCharacters.map((character) => <button className="campaign-character-choice" disabled={selectingCharacter} key={character.id} onClick={() => void chooseCharacter(character.id)}><span className="campaign-character-avatar">{character.foto_url ? <img src={character.foto_url} alt="" /> : <Icon name={character.avatar as IconName} />}</span><span><span className="campaign-character-name">{character.nome}</span><span className="campaign-character-system">{SYSTEMS.find((item) => item.value === character.sistema)?.label ?? character.sistema}</span></span></button>)}</div> : <div className="campaign-picker-empty">Você ainda não possui um personagem compatível com este sistema.</div>}<button className="campaign-skip" onClick={() => router.push(`/campanhas/${characterCampaign.id}`)}>Entrar sem personagem por enquanto</button></section></div>}
    </main>
  );
}
