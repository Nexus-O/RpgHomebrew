"use client";

import { useEffect, useRef, useState } from "react";

export type SessionMusicState = {
  provider: "youtube" | "audio";
  url: string;
  playing: boolean;
  position: number;
  updated_at: number;
  volume?: number;
};

type Props = {
  music: SessionMusicState | null;
  isMaster: boolean;
  onUpdate: (music: SessionMusicState | null) => Promise<void>;
};

function youtubeId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const [, kind, id] = url.pathname.split("/");
      if (["embed", "shorts", "live"].includes(kind)) return id || null;
    }
  } catch {}
  return null;
}

function syncedPosition(music: SessionMusicState) {
  return Math.max(0, music.position + (music.playing ? (Date.now() - music.updated_at) / 1000 : 0));
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export default function SessionMusicPlayer({ music, isMaster, onUpdate }: Props) {
  const [draftUrl, setDraftUrl] = useState(music?.url ?? "");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [youtubeSrc, setYoutubeSrc] = useState("");
  const [clock, setClock] = useState(0);
  const [volumeDraft, setVolumeDraft] = useState(music?.volume ?? 70);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);
  const volumeTimerRef = useRef<number | null>(null);

  useEffect(() => setDraftUrl(music?.url ?? ""), [music?.url]);
  useEffect(() => setVolumeDraft(music?.volume ?? 70), [music?.volume]);
  useEffect(() => () => {
    if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!music?.playing) return;
    const timer = window.setInterval(() => setClock(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [music?.playing]);

  useEffect(() => {
    if (!music || music.provider !== "audio" || !audioRef.current) return;
    const audio = audioRef.current;
    const target = syncedPosition(music);
    if (Math.abs(audio.currentTime - target) > 1.25) audio.currentTime = target;
    if (enabled && music.playing) void audio.play().catch(() => setMessage("Clique novamente em ativar música para liberar o áudio."));
    else audio.pause();
  }, [enabled, music?.playing, music?.position, music?.provider, music?.updated_at, music?.url]);

  useEffect(() => {
    if (!music || music.provider !== "youtube" || !enabled) return setYoutubeSrc("");
    const id = youtubeId(music.url);
    if (!id) return setYoutubeSrc("");
    const start = Math.floor(syncedPosition(music));
    setYoutubeSrc(`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=${music.playing ? "1" : "0"}&start=${start}&controls=0&disablekb=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`);
  }, [enabled, music?.playing, music?.position, music?.provider, music?.updated_at, music?.url]);

  useEffect(() => {
    const synchronizedVolume = music?.volume ?? 70;
    if (audioRef.current) audioRef.current.volume = synchronizedVolume / 100;
    youtubeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [synchronizedVolume] }), "https://www.youtube.com");
  }, [music?.volume, youtubeSrc]);

  const commit = async (nextMusic: SessionMusicState | null) => {
    setSaving(true);
    setMessage("");
    try {
      await onUpdate(nextMusic);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível sincronizar a música.");
    } finally {
      setSaving(false);
    }
  };

  const configure = () => {
    const value = draftUrl.trim();
    if (!value) return setMessage("Cole um link do YouTube ou um link direto de áudio.");
    if (/open\.spotify\.com/i.test(value)) return setMessage("Spotify ainda não está habilitado. Use YouTube ou um link direto de áudio por enquanto.");
    const provider = youtubeId(value) ? "youtube" : "audio";
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      return setMessage("O link da música não é válido.");
    }
    void commit({ provider, url: value, playing: false, position: 0, updated_at: Date.now(), volume: music?.volume ?? 70 });
  };

  const togglePlayback = () => {
    if (!music) return;
    setEnabled(true);
    void commit({ ...music, playing: !music.playing, position: syncedPosition(music), updated_at: Date.now() });
  };

  const seek = (change: number) => {
    if (!music) return;
    void commit({ ...music, position: Math.max(0, syncedPosition(music) + change), updated_at: Date.now() });
  };

  const changeSharedVolume = (value: number) => {
    if (!music || !isMaster) return;
    setVolumeDraft(value);
    if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = window.setTimeout(() => {
      void commit({ ...music, volume: value, position: syncedPosition(music), updated_at: Date.now() });
    }, 220);
  };

  const currentTime = music ? syncedPosition(music) : 0;
  void clock;

  return <section className="session-music"><div className="session-music-head"><div><p className="live-kicker">Música sincronizada</p><h3>{music ? music.provider === "youtube" ? "Trilha do YouTube" : "Player sem anúncios" : "Nenhuma trilha selecionada"}</h3></div>{music && <span className={music.playing ? "playing" : ""}>{music.playing ? "TOCANDO" : "PAUSADA"} · {formatTime(currentTime)}</span>}</div>{isMaster && <div className="session-music-source"><input value={draftUrl} onChange={event => setDraftUrl(event.target.value)} placeholder="Link do YouTube ou link direto .mp3/.ogg" aria-label="Link da música" /><button type="button" disabled={saving} onClick={configure}>Carregar</button>{music && <button type="button" disabled={saving} onClick={() => void commit(null)}>Limpar</button>}</div>}{music ? <><div className="session-music-console"><div className={`session-music-art ${music.playing ? "spinning" : ""}`}><i /><span /></div><div className="session-music-track"><small>{music.provider === "youtube" ? "YOUTUBE" : "ÁUDIO DIRETO"}</small><strong>Trilha da sessão</strong><div className={`session-music-wave ${music.playing ? "playing" : ""}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div></div>{isMaster ? <label className="session-music-volume"><span>Volume de todos</span><div><b>{volumeDraft}%</b><input type="range" min="0" max="100" value={volumeDraft} onChange={event => changeSharedVolume(Number(event.target.value))} aria-label="Volume da música para todos" /></div></label> : <div className="session-music-volume readonly"><span>Volume do mestre</span><b>{music.volume ?? 70}%</b></div>}</div><div className={`session-music-player ${music.provider}`}>{music.provider === "audio" ? <audio ref={audioRef} src={music.url} preload="auto" /> : youtubeSrc ? <iframe ref={youtubeRef} title="Música do YouTube" src={youtubeSrc} allow="autoplay; encrypted-media" allowFullScreen onLoad={() => { const synchronizedVolume = music.volume ?? 70; youtubeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [synchronizedVolume] }), "https://www.youtube.com"); }} /> : <div className="session-music-cover">YouTube pronto para sincronizar</div>}</div><div className="session-music-actions">{isMaster ? <><button type="button" disabled={saving} onClick={() => seek(-10)}>−10s</button><button className="primary" type="button" disabled={saving} onClick={togglePlayback}>{music.playing ? "Pausar para todos" : "Tocar para todos"}</button><button type="button" disabled={saving} onClick={() => seek(10)}>+10s</button></> : <button className="primary" type="button" onClick={() => setEnabled(value => !value)}>{enabled ? "Desativar música" : "Ativar música"}</button>}</div></> : <p className="live-help">{isMaster ? "Cole uma trilha para sincronizar com todos os jogadores." : "Aguardando o mestre escolher uma trilha."}</p>}{message && <p className="session-music-message">{message}</p>}</section>;
}
