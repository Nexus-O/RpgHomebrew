"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";

const VDO = "https://vdo.ninja";
const allow = "camera; microphone; autoplay; fullscreen; display-capture";

export default function CameraPublisher({ sessionId }: { sessionId: string }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("Preparando sua câmera…");

  useEffect(() => {
    const prepare = async () => {
      const streamId = new URLSearchParams(window.location.search).get("stream");
      if (!streamId || !/^[a-z0-9]+$/i.test(streamId)) return setMessage("Identificador de câmera inválido.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setMessage("Entre na sua conta novamente para publicar a câmera.");
      const [{ data: session, error: sessionError }, { data: participant, error: participantError }] = await Promise.all([
        supabase.from("campaign_sessions").select("id").eq("id", sessionId).maybeSingle(),
        supabase.from("campaign_session_participants").select("stream_id").eq("session_id", sessionId).eq("user_id", user.id).maybeSingle(),
      ]);
      if (sessionError || participantError || !session || participant?.stream_id !== streamId) return setMessage("Esta câmera não pertence à sua sessão.");
      setSourceUrl(`${VDO}/?push=${encodeURIComponent(streamId)}&webcam&autostart&cleanoutput&hidemenu&nocontrols&nofileshare&nohangupbutton&autohide&darkmode`);
      setMessage("Câmera conectada. Mantenha esta janela aberta durante a sessão.");
    };
    void prepare();
  }, [sessionId]);

  return <main className="camera-source-page"><header className="camera-source-header"><div><p>Fonte de transmissão</p><h1>Sua câmera</h1></div><span><i /> Ao vivo na mesa</span></header><section className="camera-source-stage">{sourceUrl ? <iframe title="Publicação da sua câmera" src={sourceUrl} allow={allow} allowFullScreen /> : <div className="camera-source-wait"><Icon name="transmitir" /><p>{message}</p></div>}</section><footer className="camera-source-footer"><p>{message}</p><button type="button" onClick={() => window.opener?.focus()}>Voltar para a mesa</button></footer></main>;
}
