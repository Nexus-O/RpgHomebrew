"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";

type Session = { id: string; room_key: string; layout: { tabletop_stream_id?: string } };
type Character = { id: string; nome: string; avatar: string; foto_url: string | null };
type Member = { user_id: string; stream_id: string; nome: string | null; avatar: string | null; foto_url: string | null; joined_at?: number };
const VDO = "https://vdo.ninja";
const allow = "camera; microphone; autoplay; fullscreen; display-capture";
const makeId = (prefix: string) => `${prefix}${Array.from(crypto.getRandomValues(new Uint8Array(18)), value => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[value % 32]).join("")}`;
const roomId = (session: Session) => session.room_key.replace(/[^a-z0-9]/gi, "");
const publishUrl = (session: Session, id: string) => `${VDO}/?room=${roomId(session)}&push=${id}&webcam&autostart&cleanoutput`;
const viewUrl = (id: string) => `${VDO}/?view=${id}&cleanviewer&nocontrols&autoplay&transparent`;

function Stage({ session, members, ownStreamId, ownUserId }: { session: Session; members: Member[]; ownStreamId: string | null; ownUserId: string }) {
  const own = ownStreamId ? { user_id: ownUserId, stream_id: ownStreamId, nome: "Você", avatar: "usuario", foto_url: null } : null;
  const participants = own && !members.some(member => member.user_id === ownUserId) ? [own, ...members] : members;
  const slots = Array.from({ length: 7 }, (_, index) => participants[index]);
  return <article className="live-stage"><div className="live-stage-bar"><span>Palco da mesa</span><div className="live-stage-actions"><small>Grade</small><button className="live-fullscreen" type="button" onClick={(event) => void event.currentTarget.closest(".live-stage")?.requestFullscreen()} aria-label="Abrir palco em tela cheia">⛶</button></div></div><div className="live-grid-stage"><img className="live-grid-art" src="/grade.png" alt="Moldura da transmissão" /><div className="live-tabletop">{session.layout.tabletop_stream_id ? <iframe title="Tabletop" src={viewUrl(session.layout.tabletop_stream_id)} allow={allow} /> : <div className="live-tabletop-empty"><Icon name="mapa" /><span>Tabletop aguardando conexão do mestre</span></div>}</div><div className="live-camera-slots">{slots.map((member, index) => <div className="live-camera-slot" key={member?.user_id ?? index}>{member ? <iframe title={`Câmera de ${member.nome ?? "participante"}`} src={member.user_id === ownUserId && ownStreamId ? publishUrl(session, ownStreamId) : viewUrl(member.stream_id)} allow={allow} /> : <span>Aguardando</span>}</div>)}</div></div></article>;
}

export default function CampaignSessionRoom({ campaignId, userId, isMaster }: { campaignId: string; userId: string; isMaster: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
      const { data, error } = await supabase.rpc("session_stage_roster", { target_session_id: activeSession.id });
      if (!error) setMembers((data ?? []) as Member[]);
    }
  };

  useEffect(() => {
    void refresh().catch(error => setNotice(error instanceof Error ? error.message : "Não foi possível atualizar a mesa."));
    const timer = window.setInterval(() => void refresh().catch(() => undefined), 2000);
    return () => window.clearInterval(timer);
  }, [campaignId, userId]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`campaign-stage-${session.id}`, { config: { presence: { key: userId } } });
    channel.on("presence", { event: "sync" }, () => {
      const nextMembers = Object.values(channel.presenceState<Member>()).flat().map(({ user_id, stream_id, nome, avatar, foto_url, joined_at }) => ({ user_id, stream_id, nome, avatar, foto_url, joined_at }));
      setMembers(nextMembers.filter(member => member.stream_id).sort((a, b) => (a.joined_at ?? 0) - (b.joined_at ?? 0)));
    });
    channel.subscribe(status => {
      if (status === "SUBSCRIBED" && streamId) void channel.track({ user_id: userId, stream_id: streamId, nome: character?.nome ?? "Jogador", avatar: character?.avatar ?? "usuario", foto_url: character?.foto_url ?? null, joined_at: Date.now() });
    });
    return () => { void supabase.removeChannel(channel); };
  }, [character, session, streamId, userId]);

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
    if (error) setNotice(error.message); else { setStreamId(nextStreamId); void refresh(); }
  };

  if (!session) return <section className="live-empty"><Icon name="dados" /><h2>Nenhuma sessão aberta</h2>{isMaster ? <button className="live-primary" disabled={busy} onClick={() => void createSession()}>Abrir lobby da sessão</button> : <p>Aguarde o mestre abrir a sessão.</p>}</section>;
  return <section className="live-room"><header className="live-top"><div><p className="live-kicker">Sessão da campanha</p><h2>{isMaster ? "Escudo do Mestre" : "Sala da campanha"}</h2></div></header><div className={`live-layout ${isMaster ? "master" : "player"}`}><Stage session={session} members={members} ownStreamId={streamId} ownUserId={userId} /><aside className="live-sheet"><p className="live-kicker">{isMaster ? "Direção" : "Sua ficha"}</p><h3>{character?.nome ?? "Sem personagem"}</h3><p className="live-help">A grade é compartilhada: cada jogador recebe o próximo quadro livre.</p></aside></div><section className="live-controls"><div><p className="live-kicker">Sua câmera</p><p className="live-help">Entre para reservar seu quadro na grade.</p></div><button className="live-primary" disabled={busy} onClick={() => void enter()}>{streamId ? "Reconectar câmera" : "Entrar com câmera"}</button></section>{notice && <p className="live-notice">{notice}</p>}</section>;
}
