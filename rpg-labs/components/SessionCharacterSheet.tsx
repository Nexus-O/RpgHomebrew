"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { ICONS, type IconName } from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";
import styles from "./SessionCharacterSheet.module.css";

type Sheet = {
  id: string;
  user_id: string;
  nome: string;
  classe: string;
  raca: string;
  nivel: number;
  descricao: string;
  avatar: string;
  sistema: string;
  atributos: Record<string, unknown> | null;
  foto_url: string | null;
  vida_atual: number;
  vida_base: number;
  sanidade_atual: number;
  sanidade_base: number;
  caller_is_master: boolean;
};

type Vitals = Pick<Sheet, "vida_atual" | "vida_base" | "sanidade_atual" | "sanidade_base">;
type SheetTab = "atributos" | "pericias" | "rolagens" | "inventario" | "descricao";
type RollResult = { id: string; label: string; dice: string; rolls: number[]; modifier: number; total: number };

const DICE = [4, 6, 8, 10, 12, 20] as const;

const numberValue = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
};

function splitStat(value: unknown, fallback = 10) {
  const [current, maximum] = String(value ?? "").split("/");
  const base = numberValue(maximum, fallback);
  return { current: Math.min(base, numberValue(current, base)), base };
}

function fallbackVitals(atributos: Record<string, unknown> | null): Vitals {
  const session = atributos?._session && typeof atributos._session === "object" ? atributos._session as Record<string, unknown> : null;
  const deprac = atributos?.deprac && typeof atributos.deprac === "object" ? atributos.deprac as Record<string, unknown> : null;
  const vidaLegacy = splitStat(deprac?.vitality ?? atributos?.Vitalidade ?? atributos?.Vida);
  const sanidadeLegacy = splitStat(deprac?.stress ?? atributos?.Sanidade ?? atributos?.Corrupção);
  const vidaBase = numberValue(session?.vida_base, vidaLegacy.base);
  const sanidadeBase = numberValue(session?.sanidade_base, sanidadeLegacy.base);
  return {
    vida_atual: Math.min(vidaBase, numberValue(session?.vida_atual, vidaLegacy.current)),
    vida_base: vidaBase,
    sanidade_atual: Math.min(sanidadeBase, numberValue(session?.sanidade_atual, sanidadeLegacy.current)),
    sanidade_base: sanidadeBase,
  };
}

function detailEntries(sheet: Sheet) {
  const atributos = sheet.atributos ?? {};
  const deprac = atributos.deprac && typeof atributos.deprac === "object" ? atributos.deprac as Record<string, unknown> : null;
  if (deprac) {
    return [
      ["Agência", deprac.agency],
      ["Codinome", deprac.codename],
      ["Talento", deprac.psychicTalent],
      ["Condição", deprac.condition],
      ["Exposição psíquica", deprac.psychicExposure],
    ].filter((entry) => entry[1] !== null && entry[1] !== undefined && entry[1] !== "") as [string, unknown][];
  }
  return Object.entries(atributos).filter(([key, value]) => key !== "_session" && typeof value !== "object");
}

function depracData(sheet: Sheet) {
  return sheet.atributos?.deprac && typeof sheet.atributos.deprac === "object"
    ? sheet.atributos.deprac as Record<string, unknown>
    : null;
}

export default function SessionCharacterSheet({ sessionId, characterId }: { sessionId: string; characterId: string }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [vitals, setVitals] = useState<Vitals>({ vida_atual: 10, vida_base: 10, sanidade_atual: 10, sanidade_base: 10 });
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<SheetTab>("atributos");
  const [die, setDie] = useState<(typeof DICE)[number]>(20);
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      const [{ data: { user } }, sheetResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("session_character_sheet", {
          target_session_id: sessionId,
          target_character_id: characterId,
        }),
      ]);
      if (!user) return router.replace("/login");
      setCurrentUserId(user.id);
      const { data, error } = sheetResult;
      let loaded = (data as unknown as Sheet[] | null)?.[0] ?? null;

      if (error || !loaded) {
        const { data: ownCharacter } = await supabase
          .from("characters")
          .select("id, user_id, nome, classe, raca, nivel, descricao, avatar, sistema, atributos, foto_url")
          .eq("id", characterId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (ownCharacter) {
          loaded = {
            ...ownCharacter,
            ...fallbackVitals(ownCharacter.atributos as Record<string, unknown> | null),
            caller_is_master: false,
          } as Sheet;
        } else {
          throw error ?? new Error("Esta ficha não está disponível nesta sessão.");
        }
      }
      if (disposed) return;
      setSheet(loaded);
      setVitals({
        vida_atual: loaded.vida_atual,
        vida_base: loaded.vida_base,
        sanidade_atual: loaded.sanidade_atual,
        sanidade_base: loaded.sanidade_base,
      });
      setLoading(false);
    };
    void load().catch((error) => {
      if (!disposed) {
        setMessage(error instanceof Error ? error.message : "Não foi possível abrir a ficha.");
        setLoading(false);
      }
    });
    return () => { disposed = true; };
  }, [characterId, router, sessionId]);

  const changeVital = (field: "vida_atual" | "sanidade_atual", amount: number) => {
    const baseField = field === "vida_atual" ? "vida_base" : "sanidade_base";
    setVitals((previous) => ({ ...previous, [field]: Math.max(0, Math.min(previous[baseField], previous[field] + amount)) }));
  };

  const changeBase = (field: "vida_base" | "sanidade_base", value: number) => {
    const currentField = field === "vida_base" ? "vida_atual" : "sanidade_atual";
    const nextBase = Math.max(0, value);
    setVitals((previous) => ({ ...previous, [field]: nextBase, [currentField]: Math.min(nextBase, previous[currentField]) }));
  };

  const saveVitals = async () => {
    if (!sheet) return;
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.rpc("update_session_character_vitals", {
      target_session_id: sessionId,
      target_character_id: characterId,
      next_vida_atual: vitals.vida_atual,
      next_vida_base: vitals.vida_base,
      next_sanidade_atual: vitals.sanidade_atual,
      next_sanidade_base: vitals.sanidade_base,
    });

    if (error && sheet.user_id === currentUserId) {
      const deprac = sheet.atributos?.deprac && typeof sheet.atributos.deprac === "object"
        ? sheet.atributos.deprac as Record<string, unknown>
        : null;
      const nextAttributes: Record<string, unknown> = {
        ...(sheet.atributos ?? {}),
        _session: vitals,
        ...(deprac ? { deprac: { ...deprac, vitality: `${vitals.vida_atual}/${vitals.vida_base}`, stress: `${vitals.sanidade_atual}/${vitals.sanidade_base}` } } : {}),
      };
      const { error: fallbackError } = await supabase.from("characters").update({ atributos: nextAttributes }).eq("id", sheet.id).eq("user_id", currentUserId);
      if (fallbackError) setMessage(fallbackError.message);
      else {
        setSheet({ ...sheet, atributos: nextAttributes, ...vitals });
        setMessage("Ficha atualizada. A transmissão receberá os novos valores.");
      }
    } else if (error) {
      setMessage(error.message);
    } else {
      const saved = (data as unknown as Vitals[] | null)?.[0] ?? vitals;
      setVitals(saved);
      setSheet({ ...sheet, ...saved });
      setMessage("Ficha atualizada. A transmissão receberá os novos valores.");
    }
    setSaving(false);
  };

  const rollDice = (label: string, sides: number, count = 1, bonus = 0) => {
    const safeCount = Math.max(1, Math.min(10, count));
    const rolls = Array.from({ length: safeCount }, () => Math.floor(Math.random() * sides) + 1);
    const result: RollResult = {
      id: crypto.randomUUID(),
      label,
      dice: `${safeCount}d${sides}`,
      rolls,
      modifier: bonus,
      total: rolls.reduce((total, value) => total + value, 0) + bonus,
    };
    setRollHistory((previous) => [result, ...previous].slice(0, 8));
  };

  if (loading) return <main className={styles.page}><div className={styles.state}><Icon name="dados" /><p>Carregando ficha da sessão…</p></div></main>;
  if (!sheet) return <main className={styles.page}><div className={styles.state}><Icon name="fechar" /><p>{message || "Ficha indisponível."}</p><button onClick={() => router.back()}>Voltar</button></div></main>;

  const avatar = sheet.avatar && sheet.avatar in ICONS ? sheet.avatar as IconName : "usuario";
  const entries = detailEntries(sheet);
  const deprac = depracData(sheet);
  const skills = deprac?.skills && typeof deprac.skills === "object" ? Object.entries(deprac.skills as Record<string, unknown>) : [];
  const inventory = Array.isArray(deprac?.equipment) ? deprac.equipment as { name?: string; quantity?: string; notes?: string; slots?: number }[] : [];
  const tabs: { id: SheetTab; label: string }[] = [
    { id: "atributos", label: "Atributos" },
    { id: "pericias", label: "Perícias" },
    { id: "rolagens", label: "Rolagens" },
    { id: "inventario", label: "Inventário" },
    { id: "descricao", label: "Descrição" },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topbar}>
          <span>{sheet.caller_is_master ? "Escudo do Mestre" : "Ficha do jogador"}</span>
          <button type="button" onClick={() => window.close()}>Fechar ficha</button>
        </div>

        <header className={styles.hero}>
          <div className={styles.portrait}>{sheet.foto_url ? <Image src={sheet.foto_url} alt={`Retrato de ${sheet.nome}`} fill sizes="180px" unoptimized /> : <Icon name={avatar} />}</div>
          <div className={styles.identity}>
            <p className={styles.eyebrow}>{sheet.sistema}</p>
            <h1>{sheet.nome}</h1>
            <div className={styles.identityGrid}>
              <span><small>Classe</small>{sheet.classe || "—"}</span>
              <span><small>Origem / Raça</small>{sheet.raca || "—"}</span>
              <span><small>Nível</small>{sheet.nivel || "—"}</span>
            </div>
          </div>
          {rollHistory[0] && <div className={styles.lastRoll}><small>Última rolagem</small><strong>{rollHistory[0].total}</strong><span>{rollHistory[0].label} · {rollHistory[0].dice}</span></div>}
        </header>

        <section className={styles.vitals}>
          <VitalCard label="Vida" tone="life" current={vitals.vida_atual} base={vitals.vida_base} onCurrent={(amount) => changeVital("vida_atual", amount)} onBase={(value) => changeBase("vida_base", value)} />
          <VitalCard label="Sanidade" tone="sanity" current={vitals.sanidade_atual} base={vitals.sanidade_base} onCurrent={(amount) => changeVital("sanidade_atual", amount)} onBase={(value) => changeBase("sanidade_base", value)} />
        </section>
        <div className={styles.syncRow}>
          <button className={styles.save} disabled={saving} onClick={() => void saveVitals()}>{saving ? "Sincronizando…" : "Salvar recursos no palco"}</button>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        <nav className={styles.tabs} aria-label="Seções da ficha">
          {tabs.map((tab) => <button type="button" className={activeTab === tab.id ? styles.activeTab : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
        </nav>

        <section className={styles.panel}>
          {activeTab === "atributos" && <div className={styles.attributeGrid}>{entries.length ? entries.map(([label, value]) => <button type="button" key={label} onClick={() => typeof value === "number" && rollDice(label, 20, 1, value)}><small>{label}</small><strong>{String(value)}</strong>{typeof value === "number" && <span>Rolar d20 + {value}</span>}</button>) : <EmptySection text="Nenhum atributo compatível registrado nesta ficha." />}</div>}

          {activeTab === "pericias" && (skills.length ? <div className={styles.skillList}>{skills.map(([skill, value]) => { const sides = numberValue(value, 4); return <button type="button" key={skill} onClick={() => rollDice(skill, sides)}><span>{skill}</span><strong>d{sides}</strong></button>; })}</div> : <EmptySection text="Este sistema ainda não possui perícias separadas na ficha." />)}

          {activeTab === "rolagens" && <div className={styles.rollArea}><div className={styles.diceConsole}><label>Quantidade<input type="number" min="1" max="10" value={diceCount} onChange={(event) => setDiceCount(Math.max(1, Math.min(10, Number(event.target.value))))} /></label><label>Dado<select value={die} onChange={(event) => setDie(Number(event.target.value) as (typeof DICE)[number])}>{DICE.map((sides) => <option key={sides} value={sides}>d{sides}</option>)}</select></label><label>Modificador<input type="number" value={modifier} onChange={(event) => setModifier(Number(event.target.value))} /></label><button type="button" onClick={() => rollDice("Rolagem livre", die, diceCount, modifier)}>Rolar dados</button></div>{rollHistory.length ? <div className={styles.rollHistory}>{rollHistory.map((roll) => <article key={roll.id}><div><small>{roll.label}</small><span>{roll.dice}{roll.modifier ? ` ${roll.modifier > 0 ? "+" : ""}${roll.modifier}` : ""} · resultados: {roll.rolls.join(", ")}</span></div><strong>{roll.total}</strong></article>)}</div> : <EmptySection text="As rolagens feitas nesta ficha aparecerão aqui." />}</div>}

          {activeTab === "inventario" && (inventory.some((item) => item.name) ? <div className={styles.inventory}>{inventory.filter((item) => item.name).map((item, index) => <article key={`${item.name}-${index}`}><div><strong>{item.name}</strong><span>{item.notes || "Sem observações"}</span></div><small>{item.quantity || "1"} un. · {item.slots ?? 0} espaços</small></article>)}</div> : <EmptySection text="Este sistema ainda não possui inventário estruturado na ficha." />)}

          {activeTab === "descricao" && <article className={styles.description}><p className={styles.eyebrow}>Histórico e descrição</p><p>{sheet.descricao || "Nenhuma descrição registrada."}</p>{deprac && <dl>{detailEntries(sheet).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>}</article>}
        </section>
      </div>
    </main>
  );
}

function EmptySection({ text }: { text: string }) {
  return <div className={styles.empty}><Icon name="dados" /><p>{text}</p></div>;
}

function VitalCard({ label, tone, current, base, onCurrent, onBase }: { label: string; tone: "life" | "sanity"; current: number; base: number; onCurrent: (amount: number) => void; onBase: (value: number) => void }) {
  const percent = base > 0 ? Math.min(100, current / base * 100) : 0;
  return <article className={`${styles.vital} ${styles[tone]}`}><header><span>{label}</span><strong>{current}/{base}</strong></header><div className={styles.bar}><i style={{ width: `${percent}%` }} /></div><div className={styles.controls}><button type="button" onClick={() => onCurrent(-1)}>−</button><input aria-label={`${label} atual`} type="number" min="0" max={base} value={current} onChange={(event) => onCurrent(Number(event.target.value) - current)} /><button type="button" onClick={() => onCurrent(1)}>+</button><label>Base<input aria-label={`${label} base`} type="number" min="0" value={base} onChange={(event) => onBase(Number(event.target.value))} /></label></div></article>;
}
