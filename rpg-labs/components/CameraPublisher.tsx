"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Icon, { ICONS, type IconName } from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";

const VDO = "https://vdo.ninja";
const allow = "camera; microphone; autoplay; fullscreen; display-capture";

type CameraMember = {
  user_id: string;
  stream_id: string;
  nome: string | null;
  avatar: string | null;
  foto_url: string | null;
  vida: string;
  sanidade: string;
  joined_at: number;
  camera_hidden: boolean;
  microphone_muted: boolean;
};

type CharacterData = {
  nome: string | null;
  avatar: string | null;
  foto_url: string | null;
  atributos: Record<string, unknown> | null;
};

const textValue = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);

function characterStats(atributos: Record<string, unknown> | null | undefined) {
  const deprac = atributos?.deprac && typeof atributos.deprac === "object"
    ? atributos.deprac as Record<string, unknown>
    : null;
  return {
    vida: textValue(deprac?.vitality ?? atributos?.Vitalidade ?? atributos?.Vida),
    sanidade: textValue(deprac?.stress ?? atributos?.Sanidade ?? atributos?.Corrupção),
  };
}

function CharacterPortrait({ member }: { member: CameraMember }) {
  const avatar = member.avatar && member.avatar in ICONS ? member.avatar as IconName : "usuario";
  return <div className="camera-source-portrait"><div className="camera-source-portrait-card"><div className="camera-source-portrait-picture">{member.foto_url ? <Image src={member.foto_url} alt={`Retrato de ${member.nome ?? "personagem"}`} fill sizes="420px" unoptimized /> : <Icon name={avatar} />}</div><div className="camera-source-portrait-data"><strong>{member.nome ?? "Jogador"}</strong><div className="camera-source-stat life"><span>{member.vida}</span></div><div className="camera-source-stat sanity"><span>{member.sanidade}</span></div></div></div></div>;
}

export default function CameraPublisher({ sessionId }: { sessionId: string }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("Preparando sua câmera…");
  const [member, setMember] = useState<CameraMember | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const memberRef = useRef<CameraMember | null>(null);

  useEffect(() => {
    let disposed = false;
    let characterTimer: number | null = null;

    const prepare = async () => {
      const streamId = new URLSearchParams(window.location.search).get("stream");
      if (!streamId || !/^[a-z0-9]+$/i.test(streamId)) return setMessage("Identificador de câmera inválido.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMessage("Entre na sua conta novamente para publicar a câmera.");
      const [{ data: session, error: sessionError }, { data: participant, error: participantError }] = await Promise.all([
        supabase.from("campaign_sessions").select("id").eq("id", sessionId).maybeSingle(),
        supabase.from("campaign_session_participants").select("stream_id, joined_at, character_id").eq("session_id", sessionId).eq("user_id", user.id).maybeSingle(),
      ]);
      if (sessionError || participantError || !session || participant?.stream_id !== streamId) return setMessage("Esta câmera não pertence à sua sessão.");

      const { data: character } = participant.character_id
        ? await supabase.from("characters").select("nome, avatar, foto_url, atributos").eq("id", participant.character_id).maybeSingle<CharacterData>()
        : { data: null };
      if (disposed) return;

      const joinedAt = Date.parse(participant.joined_at);
      const stats = characterStats(character?.atributos);
      const initialMember: CameraMember = {
        user_id: user.id,
        stream_id: streamId,
        nome: character?.nome ?? "Jogador",
        avatar: character?.avatar ?? "usuario",
        foto_url: character?.foto_url ?? null,
        ...stats,
        joined_at: Number.isFinite(joinedAt) ? joinedAt : Date.now(),
        camera_hidden: false,
        microphone_muted: false,
      };
      memberRef.current = initialMember;
      setMember(initialMember);
      setSourceUrl(`${VDO}/?push=${encodeURIComponent(streamId)}&webcam&autostart&cleanoutput&hidemenu&nocontrols&nofileshare&nohangupbutton&autohide&darkmode`);
      setMessage("Câmera conectada. Mantenha esta janela aberta durante a sessão.");

      const channel = supabase.channel(`campaign-stage-${sessionId}`, { config: { presence: { key: user.id } } });
      channelRef.current = channel;
      channel.subscribe(status => {
        if (status === "SUBSCRIBED" && memberRef.current) void channel.track(memberRef.current);
      });

      if (participant.character_id) {
        const refreshCharacter = async () => {
          const { data: latestCharacter } = await supabase
            .from("characters")
            .select("nome, avatar, foto_url, atributos")
            .eq("id", participant.character_id)
            .maybeSingle<CharacterData>();
          if (disposed || !latestCharacter || !memberRef.current) return;
          const latestStats = characterStats(latestCharacter.atributos);
          const current = memberRef.current;
          const nextMember: CameraMember = {
            ...current,
            nome: latestCharacter.nome ?? "Jogador",
            avatar: latestCharacter.avatar ?? "usuario",
            foto_url: latestCharacter.foto_url ?? null,
            ...latestStats,
          };
          if (
            nextMember.nome === current.nome
            && nextMember.avatar === current.avatar
            && nextMember.foto_url === current.foto_url
            && nextMember.vida === current.vida
            && nextMember.sanidade === current.sanidade
          ) return;
          memberRef.current = nextMember;
          setMember(nextMember);
          void channel.track(nextMember);
        };
        characterTimer = window.setInterval(() => void refreshCharacter(), 1500);
      }
    };

    void prepare();
    return () => {
      disposed = true;
      if (characterTimer !== null) window.clearInterval(characterTimer);
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const updateMedia = (changes: Pick<CameraMember, "camera_hidden"> | Pick<CameraMember, "microphone_muted">) => {
    if (!memberRef.current) return;
    const nextMember = { ...memberRef.current, ...changes };
    memberRef.current = nextMember;
    setMember(nextMember);
    if ("camera_hidden" in changes) iframeRef.current?.contentWindow?.postMessage({ camera: !nextMember.camera_hidden }, VDO);
    if ("microphone_muted" in changes) iframeRef.current?.contentWindow?.postMessage({ mic: !nextMember.microphone_muted }, VDO);
    if (channelRef.current) void channelRef.current.track(nextMember);
  };

  return <main className="camera-source-page"><header className="camera-source-header"><div><p>Fonte de transmissão</p><h1>Sua câmera</h1></div><span className={member?.camera_hidden ? "is-hidden" : ""}><i /> {member?.camera_hidden ? "Retrato na mesa" : "Ao vivo na mesa"}</span></header><section className="camera-source-stage">{sourceUrl ? <><iframe ref={iframeRef} title="Publicação da sua câmera" src={sourceUrl} allow={allow} allowFullScreen onLoad={() => setIframeReady(true)} />{member?.camera_hidden && <CharacterPortrait member={member} />}</> : <div className="camera-source-wait"><Icon name="transmitir" /><p>{message}</p></div>}</section><section className="camera-source-controls"><button className={member?.camera_hidden ? "active" : ""} type="button" disabled={!member || !iframeReady} onClick={() => member && updateMedia({ camera_hidden: !member.camera_hidden })}>{member?.camera_hidden ? "Mostrar câmera" : "Ocultar câmera"}</button><button className={member?.microphone_muted ? "active" : ""} type="button" disabled={!member || !iframeReady} onClick={() => member && updateMedia({ microphone_muted: !member.microphone_muted })}>{member?.microphone_muted ? "Ativar microfone" : "Mutar microfone"}</button></section><footer className="camera-source-footer"><p>{message}</p><button type="button" onClick={() => window.opener?.focus()}>Voltar para a mesa</button></footer></main>;
}
