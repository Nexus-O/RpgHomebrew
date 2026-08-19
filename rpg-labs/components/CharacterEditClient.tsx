"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { ICONS, type IconName } from "./Icon";
import { supabase } from "@/lib/supabase/client";
import styles from "./CharacterEditClient.module.css";

type SystemKey = "purgatum" | "ordem" | "dnd" | "deprac" | "outro";
type AttributeEntry = { id: string; name: string; value: number };
type EquipmentItem = { name: string; quantity: string; notes: string; slots: number };
type DepracData = {
  agency: string;
  codename: string;
  agentNumber: string;
  age: string;
  registrationDate: string;
  psychicTalent: string;
  observedTalent: string;
  formation: string;
  dominantTalent: string;
  condition: string;
  psychicExposure: string;
  ghostTouchIncidents: string;
  skills: Record<string, number>;
  equipment: EquipmentItem[];
};
type CharacterForm = {
  name: string;
  className: string;
  race: string;
  level: number;
  description: string;
  avatar: IconName;
  system: SystemKey;
  campaignId: string | null;
  photoUrl: string;
  attributes: AttributeEntry[];
  deprac: DepracData;
  lifeCurrent: number;
  lifeBase: number;
  sanityCurrent: number;
  sanityBase: number;
};

const SYSTEMS: { key: SystemKey; label: string; attributes: string[] }[] = [
  { key: "purgatum", label: "Purgatum", attributes: ["Força", "Agilidade", "Vitalidade", "Corrupção"] },
  { key: "ordem", label: "Ordem Paranormal", attributes: ["Força", "Agilidade", "Intelecto", "Presença"] },
  { key: "dnd", label: "D&D", attributes: ["STR", "DEX", "CON", "INT", "WIS", "CHA"] },
  { key: "deprac", label: "DEPRAC — O Problema", attributes: [] },
  { key: "outro", label: "Outro", attributes: ["Atributo 1", "Atributo 2"] },
];
const AVATARS = ["avatarMago", "avatarGuerreiro", "avatarArqueiro", "avatarGuardiao", "avatarNecromante", "avatarFogo", "avatarGelo", "avatarRaio", "avatarDruida", "avatarBardo"] as const;
const DEPRAC_SKILLS = ["Investigação", "Observação", "Percepção", "Rastreamento", "Arrombamento", "Pesquisa", "Ocultismo", "Visitantes", "Relíquias", "Contenção", "Combate", "Esgrima", "Pontaria", "Furtividade", "Atletismo", "Reflexos", "Resistência", "Primeiros Socorros", "Tecnologia", "Mecânica", "Persuasão", "Enganação", "Intimidação", "Empatia", "Liderança", "História"] as const;
const DICE = [4, 6, 8, 10, 12, 20] as const;
const MAX_PORTRAIT_SIZE = 2 * 1024 * 1024;

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const asString = (value: unknown) => typeof value === "string" ? value : "";
const asNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : Number(value) || fallback;
const resourcePart = (value: unknown, position: number, fallback: number) => {
  const parts = asString(value).split("/");
  return asNumber(parts[position], fallback);
};

function readDeprac(value: unknown): DepracData {
  const source = asRecord(value);
  const skills = asRecord(source.skills);
  const equipment = Array.isArray(source.equipment) ? source.equipment.map((entry) => {
    const item = asRecord(entry);
    return { name: asString(item.name), quantity: asString(item.quantity), notes: asString(item.notes), slots: asNumber(item.slots, 0) };
  }) : [];
  return {
    agency: asString(source.agency), codename: asString(source.codename), agentNumber: asString(source.agentNumber), age: asString(source.age),
    registrationDate: asString(source.registrationDate), psychicTalent: asString(source.psychicTalent), observedTalent: asString(source.observedTalent),
    formation: asString(source.formation) || "formed", dominantTalent: asString(source.dominantTalent), condition: asString(source.condition),
    psychicExposure: asString(source.psychicExposure), ghostTouchIncidents: asString(source.ghostTouchIncidents),
    skills: Object.fromEntries(DEPRAC_SKILLS.map((skill) => [skill, asNumber(skills[skill], 4)])),
    equipment: equipment.length ? equipment : [{ name: "", quantity: "1", notes: "", slots: 0 }],
  };
}

function buildAttributes(system: SystemKey, source: Record<string, unknown>): AttributeEntry[] {
  const preset = SYSTEMS.find((entry) => entry.key === system)?.attributes ?? [];
  const numeric = Object.entries(source).filter(([key, value]) => key !== "_session" && key !== "deprac" && typeof value === "number");
  const names = [...new Set([...preset, ...numeric.map(([name]) => name)])];
  return names.map((name) => ({ id: crypto.randomUUID(), name, value: asNumber(source[name], 0) }));
}

function LoadingState() {
  return <main className={styles.state}><Icon name="pingente" /><p>Carregando ficha...</p></main>;
}

export default function CharacterEditClient({ characterId }: { characterId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CharacterForm | null>(null);
  const [rawAttributes, setRawAttributes] = useState<Record<string, unknown>>({});
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("characters").select("*").eq("id", characterId).eq("user_id", user.id).maybeSingle();
      if (!active) return;
      if (error) { setMessage("Não foi possível carregar este personagem."); return; }
      if (!data) { setNotFound(true); return; }
      const attributes = asRecord(data.atributos);
      const session = asRecord(attributes._session);
      const deprac = readDeprac(attributes.deprac);
      const lifeBase = asNumber(data.vida_base, asNumber(session.vida_base, resourcePart(asRecord(attributes.deprac).vitality, 1, 10)));
      const lifeCurrent = asNumber(data.vida_atual, asNumber(session.vida_atual, resourcePart(asRecord(attributes.deprac).vitality, 0, lifeBase)));
      const sanityBase = asNumber(data.sanidade_base, asNumber(session.sanidade_base, resourcePart(asRecord(attributes.deprac).stress, 1, 10)));
      const sanityCurrent = asNumber(data.sanidade_atual, asNumber(session.sanidade_atual, resourcePart(asRecord(attributes.deprac).stress, 0, sanityBase)));
      const system = (SYSTEMS.some((entry) => entry.key === data.sistema) ? data.sistema : "outro") as SystemKey;
      const avatar = typeof data.avatar === "string" && data.avatar in ICONS ? data.avatar as IconName : "avatarMago";
      setRawAttributes(attributes);
      setPreviewUrl(data.foto_url ?? "");
      setForm({
        name: data.nome ?? "", className: data.classe ?? "", race: data.raca ?? "", level: asNumber(data.nivel, 1),
        description: data.descricao ?? "", avatar, system, campaignId: data.campaign_id ?? null, photoUrl: data.foto_url ?? "",
        attributes: buildAttributes(system, attributes), deprac, lifeCurrent, lifeBase, sanityCurrent, sanityBase,
      });
    };
    void load();
    return () => { active = false; };
  }, [characterId, router]);

  useEffect(() => () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const systemInfo = SYSTEMS.find((entry) => entry.key === form?.system);

  const changeSystem = (system: SystemKey) => setForm((current) => current ? {
    ...current,
    system,
    attributes: buildAttributes(system, {}),
    deprac: system === "deprac" ? readDeprac({}) : current.deprac,
  } : current);

  const save = async () => {
    if (!form || !form.name.trim()) { setMessage("Informe o nome do personagem."); return; }
    setSaving(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      let photoUrl = form.photoUrl || null;
      if (portraitFile) {
        const extension = portraitFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/${characterId}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("character-portraits").upload(path, portraitFile, { contentType: portraitFile.type, upsert: false });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from("character-portraits").getPublicUrl(path).data.publicUrl;
      }
      const sessionVitals = { vida_atual: form.lifeCurrent, vida_base: form.lifeBase, sanidade_atual: form.sanityCurrent, sanidade_base: form.sanityBase };
      const generic = Object.fromEntries(form.attributes.filter((entry) => entry.name.trim()).map((entry) => [entry.name.trim(), entry.value]));
      const retainedAttributes = Object.fromEntries(Object.entries(rawAttributes).filter(([key, value]) => key === "_session" || key === "deprac" || typeof value !== "number"));
      const attributes: Record<string, unknown> = { ...retainedAttributes, ...generic, _session: sessionVitals };
      if (form.system === "deprac") attributes.deprac = { ...asRecord(rawAttributes.deprac), ...form.deprac, vitality: `${form.lifeCurrent}/${form.lifeBase}`, stress: `${form.sanityCurrent}/${form.sanityBase}` };
      else delete attributes.deprac;
      const commonUpdate = {
        nome: form.name.trim(), classe: form.className.trim(), raca: form.race.trim(), nivel: Math.max(1, Math.min(99, form.level)),
        descricao: form.description, avatar: form.avatar, sistema: form.system, atributos: attributes, foto_url: photoUrl,
      };
      let result = await supabase.from("characters").update({ ...commonUpdate, ...sessionVitals }).eq("id", characterId).eq("user_id", user.id).select("id").maybeSingle();
      if (result.error?.code === "42703") result = await supabase.from("characters").update(commonUpdate).eq("id", characterId).eq("user_id", user.id).select("id").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("Você não tem permissão para editar este personagem.");
      router.push("/personagens");
    } catch (error) {
      console.error("[characters:update]", error);
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (notFound) return <main className={styles.state}><Icon name="fechar" /><h1>Personagem não encontrado</h1><p>Esta ficha não existe ou não pertence à sua conta.</p><Link href="/personagens">Voltar aos personagens</Link></main>;
  if (!form) return message ? <main className={styles.state}><Icon name="fechar" /><p>{message}</p><Link href="/personagens">Voltar aos personagens</Link></main> : <LoadingState />;

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/personagens">← Personagens</Link>
      <span>Editor de personagem</span>
      <button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button>
    </header>

    <section className={styles.hero}>
      <div className={styles.portrait}>
        {previewUrl ? <Image src={previewUrl} alt={`Retrato de ${form.name || "personagem"}`} fill sizes="160px" unoptimized /> : <Icon name={form.avatar} />}
      </div>
      <div><p>Ficha vinculada ao Nexus</p><h1>{form.name || "Personagem sem nome"}</h1><span>{systemInfo?.label}{form.campaignId ? " · Em campanha" : " · Sem campanha"}</span></div>
    </section>

    <div className={styles.layout}>
      <section className={styles.panel}>
        <div className={styles.heading}><span>01</span><div><h2>Identidade</h2><p>Dados principais usados nas campanhas e no palco.</p></div></div>
        <div className={styles.grid}>
          <label className={styles.full}>Nome do personagem<input value={form.name} maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Sistema<select value={form.system} disabled={Boolean(form.campaignId)} onChange={(event) => changeSystem(event.target.value as SystemKey)}>{SYSTEMS.map((system) => <option key={system.key} value={system.key}>{system.label}</option>)}</select>{form.campaignId && <small>O sistema fica bloqueado enquanto o personagem estiver em uma campanha.</small>}</label>
          <label>Nível<input type="number" min="1" max="99" value={form.level} onChange={(event) => setForm({ ...form, level: asNumber(event.target.value, 1) })} /></label>
          {form.system === "deprac" ? <>
            <label>Agência / Afiliação<input value={form.deprac.agency} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, agency: event.target.value } })} /></label>
            <label>Codinome<input value={form.deprac.codename} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, codename: event.target.value } })} /></label>
            <label>Número do agente<input value={form.deprac.agentNumber} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, agentNumber: event.target.value } })} /></label>
            <label>Idade<input type="number" min="1" value={form.deprac.age} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, age: event.target.value } })} /></label>
            <label>Data de registro<input type="date" value={form.deprac.registrationDate} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, registrationDate: event.target.value } })} /></label>
            <label>Talento psíquico<select value={form.deprac.psychicTalent} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, psychicTalent: event.target.value } })}><option value="">Nenhum</option><option>Visão</option><option>Audição</option><option>Tato</option></select></label>
            <label>Talento observado<input value={form.deprac.observedTalent} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, observedTalent: event.target.value } })} /></label>
            <label>Formação<select value={form.deprac.formation} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, formation: event.target.value } })}><option value="formed">Agente formado</option><option value="incomplete">Agente incompleto / Prodígio</option></select></label>
            {form.deprac.formation === "incomplete" && <label>Talento dominante<select value={form.deprac.dominantTalent} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, dominantTalent: event.target.value } })}><option value="">Selecione</option><option>Visão</option><option>Audição</option><option>Tato</option></select></label>}
          </> : <>
            <label>Classe<input value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} /></label>
            <label>Raça / Origem<input value={form.race} onChange={(event) => setForm({ ...form, race: event.target.value })} /></label>
          </>}
        </div>
      </section>

      <aside className={styles.panel}>
        <div className={styles.heading}><span>02</span><div><h2>Visual</h2><p>Retrato e símbolo exibidos na mesa.</p></div></div>
        <div className={styles.avatarGrid}>{AVATARS.map((avatar) => <button type="button" aria-label={`Usar avatar ${avatar}`} className={form.avatar === avatar ? styles.selectedAvatar : ""} key={avatar} onClick={() => setForm({ ...form, avatar })}><Icon name={avatar} /></button>)}</div>
        <label className={styles.upload}>Trocar retrato<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > MAX_PORTRAIT_SIZE) { setMessage("O retrato deve ter no máximo 2 MB."); event.target.value = ""; return; }
          setPortraitFile(file); setPreviewUrl(URL.createObjectURL(file)); setMessage("");
        }} /></label>
        <small>PNG, JPG ou WEBP · até 2 MB</small>
      </aside>

      <section className={`${styles.panel} ${styles.wide}`}>
        <div className={styles.heading}><span>03</span><div><h2>Vida e Sanidade</h2><p>Os valores atuais são refletidos nos portraits da sessão.</p></div></div>
        <div className={styles.resources}>
          <label>Vida atual<input type="number" min="0" value={form.lifeCurrent} onChange={(event) => setForm({ ...form, lifeCurrent: Math.max(0, asNumber(event.target.value, 0)) })} /></label>
          <label>Vida base<input type="number" min="0" value={form.lifeBase} onChange={(event) => setForm({ ...form, lifeBase: Math.max(0, asNumber(event.target.value, 0)) })} /></label>
          <label>Sanidade atual<input type="number" min="0" value={form.sanityCurrent} onChange={(event) => setForm({ ...form, sanityCurrent: Math.max(0, asNumber(event.target.value, 0)) })} /></label>
          <label>Sanidade base<input type="number" min="0" value={form.sanityBase} onChange={(event) => setForm({ ...form, sanityBase: Math.max(0, asNumber(event.target.value, 0)) })} /></label>
        </div>
      </section>

      {form.system === "deprac" ? <>
        <section className={`${styles.panel} ${styles.wide}`}>
          <div className={styles.heading}><span>04</span><div><h2>Estado operacional</h2><p>Condição e exposição registradas pelo agente.</p></div></div>
          <div className={styles.grid}>
            <label>Condição atual<input value={form.deprac.condition} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, condition: event.target.value } })} /></label>
            <label>Exposição psíquica<input value={form.deprac.psychicExposure} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, psychicExposure: event.target.value } })} /></label>
            <label className={styles.full}>Incidentes de ghost-touch<input value={form.deprac.ghostTouchIncidents} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, ghostTouchIncidents: event.target.value } })} /></label>
          </div>
        </section>
        <section className={`${styles.panel} ${styles.wide}`}>
          <div className={styles.heading}><span>05</span><div><h2>Competências</h2><p>Edite o dado de cada perícia sem apagar a progressão conquistada.</p></div></div>
          <div className={styles.skills}>{DEPRAC_SKILLS.map((skill) => <label key={skill}><span>{skill}</span><select value={form.deprac.skills[skill] ?? 4} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, skills: { ...form.deprac.skills, [skill]: Number(event.target.value) } } })}>{DICE.map((die) => <option key={die} value={die}>d{die}</option>)}</select></label>)}</div>
        </section>
        <section className={`${styles.panel} ${styles.wide}`}>
          <div className={styles.heading}><span>06</span><div><h2>Equipamento</h2><p>Itens, quantidades, espaços e observações.</p></div></div>
          <div className={styles.equipment}>{form.deprac.equipment.map((item, index) => <div key={index}>
            <input aria-label="Nome do item" placeholder="Item" value={item.name} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, equipment: form.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry) } })} />
            <input aria-label="Quantidade" type="number" min="0" placeholder="Qtd." value={item.quantity} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, equipment: form.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: event.target.value } : entry) } })} />
            <input aria-label="Espaços" type="number" min="0" placeholder="Espaços" value={item.slots} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, equipment: form.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, slots: Math.max(0, Number(event.target.value)) } : entry) } })} />
            <input aria-label="Observações do item" placeholder="Observações" value={item.notes} onChange={(event) => setForm({ ...form, deprac: { ...form.deprac, equipment: form.deprac.equipment.map((entry, itemIndex) => itemIndex === index ? { ...entry, notes: event.target.value } : entry) } })} />
            <button type="button" aria-label="Remover item" onClick={() => setForm({ ...form, deprac: { ...form.deprac, equipment: form.deprac.equipment.filter((_, itemIndex) => itemIndex !== index) } })}>×</button>
          </div>)}</div>
          <button className={styles.addButton} type="button" onClick={() => setForm({ ...form, deprac: { ...form.deprac, equipment: [...form.deprac.equipment, { name: "", quantity: "1", notes: "", slots: 0 }] } })}>+ Adicionar item</button>
        </section>
      </> : <section className={`${styles.panel} ${styles.wide}`}>
        <div className={styles.heading}><span>04</span><div><h2>Atributos</h2><p>Valores próprios do sistema selecionado.</p></div></div>
        <div className={styles.attributeGrid}>{form.attributes.map((attribute, index) => <label key={attribute.id}>{form.system === "outro" ? <input aria-label="Nome do atributo" value={attribute.name} onChange={(event) => setForm({ ...form, attributes: form.attributes.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry) })} /> : <span>{attribute.name}</span>}<input type="number" value={attribute.value} onChange={(event) => setForm({ ...form, attributes: form.attributes.map((entry, entryIndex) => entryIndex === index ? { ...entry, value: asNumber(event.target.value, 0) } : entry) })} /></label>)}</div>
        {form.system === "outro" && <button className={styles.addButton} type="button" onClick={() => setForm({ ...form, attributes: [...form.attributes, { id: crypto.randomUUID(), name: `Atributo ${form.attributes.length + 1}`, value: 0 }] })}>+ Adicionar atributo</button>}
      </section>}

      <section className={`${styles.panel} ${styles.wide}`}>
        <div className={styles.heading}><span>{form.system === "deprac" ? "07" : "05"}</span><div><h2>História e descrição</h2><p>Texto livre sobre o personagem.</p></div></div>
        <textarea className={styles.description} rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Conte a história deste personagem..." />
      </section>
    </div>

    <footer className={styles.footer}>
      <div>{message && <p role="alert">{message}</p>}</div>
      <Link href="/personagens">Cancelar</Link>
      <button type="button" onClick={() => void save()} disabled={saving}>{saving ? "Salvando ficha..." : "Salvar personagem"}</button>
    </footer>
  </main>;
}
