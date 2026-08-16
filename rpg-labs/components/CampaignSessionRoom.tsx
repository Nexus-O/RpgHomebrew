"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Icon, { ICONS, type IconName } from "@/components/Icon";
import SessionMusicPlayer, { type SessionMusicState } from "@/components/SessionMusicPlayer";
import { supabase } from "@/lib/supabase/client";

type SessionLayout = { mode?: string; tabletop_stream_id?: string; music?: SessionMusicState };
type Session = { id: string; room_key: string; layout: SessionLayout };
type Character = { id: string; nome: string; avatar: string; foto_url: string | null };
type Member = { user_id: string; stream_id: string; nome: string | null; avatar: string | null; foto_url: string | null; joined_at?: number; camera_hidden?: boolean; microphone_muted?: boolean };
const VDO = "https://vdo.ninja";
const allow = "camera; microphone; autoplay; fullscreen; display-capture";
const makeId = (prefix: string) => `${prefix}${Array.from(crypto.getRandomValues(new Uint8Array(18)), value => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[value % 32]).join("")}`;
const viewUrl = (id: string) => `${VDO}/?view=${id}&cleanviewer&nocontrols&autoplay&transparent`;
const tabletopViewUrl = (id: string) => `${viewUrl(id)}&sharperscreen&screensharebitrate=6000`;

function CharacterPortrait({ member }: { member: Member }) {
  const avatar = member.avatar && member.avatar in ICONS ? member.avatar as IconName : "usuario";
  return <div className="live-character-portrait">{member.foto_url ? <Image src={member.foto_url} alt={`Retrato de ${member.nome ?? "personagem"}`} fill sizes="20vw" unoptimized /> : <Icon name={avatar} />}<strong>{member.nome ?? "Jogador"}</strong></div>;
}

function Stage({ session, members }: { session: Session; members: Member[] }) {
  const slots = Array.from({ length: 7 }, (_, index) => members[index]);
  return <article className="live-stage"><div className="live-stage-bar"><span>Palco da mesa</span><div className="live-stage-actions"><small>Grade</small><button className="live-fullscreen" type="button" onClick={(event) => void event.currentTarget.closest(".live-stage")?.requestFullscreen()} aria-label="Abrir palco em tela cheia">⛶</button></div></div><div className="live-grid-stage"><img className="live-grid-art" src="/grade.png" alt="Moldura da transmissão" /><div className="live-tabletop">{session.layout.tabletop_stream_id ? <iframe title="Tabletop" src={tabletopViewUrl(session.layout.tabletop_stream_id)} allow={allow} /> : <div className="live-tabletop-empty"><Icon name="mapa" /><span>Tabletop aguardando conexão do mestre</span></div>}</div><div className="live-camera-slots">{slots.map((member, index) => <div className="live-camera-slot" key={member?.user_id ?? index}>{member ? <>{member.camera_hidden ? <CharacterPortrait member={member} /> : <iframe title={`Câmera de ${member.nome ?? "participante"}`} src={viewUrl(member.stream_id)} allow={allow} />}{member.microphone_muted && <span className="live-muted-badge">MUDO</span>}</> : <span>Aguardando</span>}</div>)}</div></div></article>;
}

export default function CampaignSessionRoom({ campaignId, userId, isMaster }: { campaignId: string; userId: string; isMaster: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    const [{ data: activeSession, error: sessionError }, { data: ownCharacter, error: characterError }] = await Promise.all([
      supabase.from("campaign_sessions").select("id, room_key, layout").eq("campaign_id", campaignId).in("status", ["lobby", "live"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("characters").select("id, nome, avatar, foto_url").eq("campaign_id", campaignId).eq("user_id", userId).limit(1).maybeSingle(),
    ]);
    if (sessionError || characterError) throw sessionError || characterError;
    setSession(activeSession as Session | null);
    setCharacter(ownCharacter as Character | null);
    if (activeSession) {
      const { data } = await supabase.from("campaign_session_participants").select("stream_id").eq("session_id", activeSession.id).eq("user_id", userId).is("left_at", null).maybeSingle();
      if (data?.stream_id) setStreamId(data.stream_id);
    }
  };

  useEffect(() => {
    void refresh().catch(error => setNotice(error instanceof Error ? error.message : "Não foi possível atualizar a mesa."));
    const timer = window.setInterval(() => void refresh().catch(() => undefined), 2000);
    return () => window.clearInterval(timer);
  }, [campaignId, userId]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`campaign-stage-${session.id}`);
    channel.on("presence", { event: "sync" }, () => {
      const nextMembers = Object.values(channel.presenceState<Member>()).flat().map(({ user_id, stream_id, nome, avatar, foto_url, joined_at, camera_hidden, microphone_muted }) => ({ user_id, stream_id, nome, avatar, foto_url, joined_at, camera_hidden, microphone_muted }));
      const membersByUser = new Map<string, Member>();
      for (const member of nextMembers) {
        if (member.stream_id) membersByUser.set(member.user_id, member);
      }
      setMembers([...membersByUser.values()].sort((a, b) => (a.joined_at ?? Number.MAX_SAFE_INTEGER) - (b.joined_at ?? Number.MAX_SAFE_INTEGER) || a.user_id.localeCompare(b.user_id)));
    });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [session?.id]);

  const createSession = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("campaign_sessions").insert({ campaign_id: campaignId, created_by: userId, room_key: makeId("rpg"), layout: { mode: "grid" } }).select("id, room_key, layout").single();
    setBusy(false);
    if (error) setNotice(error.message); else setSession(data as Session);
  };

  const enter = async () => {
    if (!session) return;
    setBusy(true);
    const nextStreamId = streamId ?? makeId("cam");
    const { error } = await supabase.from("campaign_session_participants").upsert({ session_id: session.id, user_id: userId, character_id: character?.id ?? null, stream_id: nextStreamId, left_at: null });
    setBusy(false);
    if (error) setNotice(error.message); else {
      setStreamId(nextStreamId);
      const cameraWindow = window.open(`/transmissao/${session.id}?stream=${encodeURIComponent(nextStreamId)}`, `nexus-camera-${session.id}`, "popup,width=720,height=620");
      if (!cameraWindow) setNotice("O navegador bloqueou a janela da câmera. Libere pop-ups para este site e tente novamente.");
    }
  };

  const openMasterSource = async (mode: "obs" | "screen") => {
    if (!session || !isMaster) return;
    const sourceWindow = window.open("", `nexus-tabletop-${session.id}`, "popup,width=900,height=720");
    if (!sourceWindow) return setNotice("O navegador bloqueou a janela da transmissão. Libere pop-ups e tente novamente.");
    setSourceBusy(true);
    const streamId = session.layout.tabletop_stream_id ?? makeId("table");
    const nextLayout = { ...session.layout, tabletop_stream_id: streamId };
    const { data, error } = await supabase.from("campaign_sessions").update({ layout: nextLayout }).eq("id", session.id).select("id, room_key, layout").single();
    setSourceBusy(false);
    if (error) {
      sourceWindow.close();
      return setNotice(error.message);
    }
    setSession(data as Session);
    sourceWindow.location.href = `/transmissao/${session.id}/fonte?mode=${mode}`;
  };

  const updateMusic = async (music: SessionMusicState | null) => {
    if (!session || !isMaster) return;
    const nextLayout = { ...session.layout, music: music ?? undefined };
    const { data, error } = await supabase.from("campaign_sessions").update({ layout: nextLayout }).eq("id", session.id).select("id, room_key, layout").single();
    if (error) throw error;
    setSession(data as Session);
  };

  if (!session) return <section className="live-empty"><Icon name="dados" /><h2>Nenhuma sessão aberta</h2>{isMaster ? <button className="live-primary" disabled={busy} onClick={() => void createSession()}>Abrir lobby da sessão</button> : <p>Aguarde o mestre abrir a sessão.</p>}</section>;
  return <section className="live-room"><header className="live-top"><div><p className="live-kicker">Sessão da campanha</p><h2>{isMaster ? "Escudo do Mestre" : "Sala da campanha"}</h2></div></header><div className={`live-layout ${isMaster ? "master" : "player"}`}><Stage session={session} members={members} /><aside className="live-sheet"><p className="live-kicker">{isMaster ? "Direção" : "Sua ficha"}</p><h3>{character?.nome ?? "Sem personagem"}</h3><p className="live-help">A grade é compartilhada: cada jogador recebe o próximo quadro livre.</p>{isMaster && <div className="live-master-sources"><p className="live-kicker">Fontes do tabletop</p><button disabled={sourceBusy} type="button" onClick={() => void openMasterSource("obs")}>Tabletop pelo OBS</button><button disabled={sourceBusy} type="button" onClick={() => void openMasterSource("screen")}>Compartilhar tela</button></div>}</aside></div><section className="live-controls"><div><p className="live-kicker">Sua câmera</p><p className="live-help">Entre para reservar seu quadro na grade.</p></div><button className="live-primary" disabled={busy} onClick={() => void enter()}>{streamId ? "Reconectar câmera" : "Entrar com câmera"}</button></section><SessionMusicPlayer music={session.layout.music ?? null} isMaster={isMaster} onUpdate={updateMusic} />{notice && <p className="live-notice">{notice}</p>}</section>;
}
