"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";

const VDO = "https://vdo.ninja";
const allow = "camera; microphone; autoplay; fullscreen; display-capture";

export default function TabletopPublisher({ sessionId }: { sessionId: string }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [mode, setMode] = useState<"obs" | "screen">("screen");
  const [message, setMessage] = useState("Preparando o tabletop…");

  useEffect(() => {
    let disposed = false;
    const prepare = async () => {
      const requestedMode = new URLSearchParams(window.location.search).get("mode") === "obs" ? "obs" : "screen";
      setMode(requestedMode);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMessage("Entre novamente na conta do mestre.");
      const { data: session, error } = await supabase.from("campaign_sessions").select("created_by, layout").eq("id", sessionId).maybeSingle();
      if (error || !session || session.created_by !== user.id) return setMessage("Somente o mestre pode publicar o tabletop.");
      const layout = session.layout as { tabletop_stream_id?: string };
      if (!layout.tabletop_stream_id || !/^[a-z0-9]+$/i.test(layout.tabletop_stream_id)) return setMessage("O tabletop ainda não foi configurado na sessão.");
      if (disposed) return;
      const stream = encodeURIComponent(layout.tabletop_stream_id);
      const common = `push=${stream}&autostart&cleanoutput&hidemenu&nocontrols&nofileshare&nohangupbutton&autohide&darkmode`;
      setSourceUrl(requestedMode === "obs"
        ? `${VDO}/?${common}&webcam&videodevice=obs&audiodevice=0&cover&quality=0&framerate=30`
        : `${VDO}/?${common}&screenshare&screensharevideoonly&screensharequality=0&screensharecontenthint=detail`);
      setMessage(requestedMode === "obs" ? "Transmitindo a câmera virtual do OBS sem áudio." : "Compartilhando a tela ou janela selecionada sem áudio.");
    };
    void prepare();
    return () => { disposed = true; };
  }, [sessionId]);

  return <main className="camera-source-page tabletop-source-page"><header className="camera-source-header"><div><p>Fonte do mestre</p><h1>Tabletop</h1></div><span><i /> {mode === "obs" ? "OBS Virtual Camera" : "Compartilhamento de tela"}</span></header><section className="camera-source-stage">{sourceUrl ? <iframe title="Publicação do tabletop" src={sourceUrl} allow={allow} allowFullScreen /> : <div className="camera-source-wait"><Icon name="mapa" /><p>{message}</p></div>}</section><div className="tabletop-source-tip"><strong>{mode === "obs" ? "Antes de conectar" : "Na janela do navegador"}</strong><p>{mode === "obs" ? "Inicie a Câmera Virtual dentro do OBS. A fonte de áudio fica desligada para não duplicar a música ou as vozes." : "Escolha a janela do tabletop ou a tela inteira. O áudio dessa tela não será enviado; a trilha usa o player sincronizado da campanha."}</p></div><footer className="camera-source-footer"><p>{message}</p><button type="button" onClick={() => window.opener?.focus()}>Voltar para a mesa</button></footer></main>;
}
