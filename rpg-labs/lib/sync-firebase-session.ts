"use client";

import { signInWithCustomToken } from "firebase/auth";
import { auth as firebaseAuth } from "@/app/firebase";
import { supabase } from "@/lib/supabase/client";

/**
 * Troca a sessão Supabase atual por um login no Firebase (via Custom Token),
 * para que o Firestore continue reconhecendo request.auth.uid nas
 * Security Rules, com uid = supabase user.id.
 *
 * Chamar depois de qualquer login/registro com sucesso no Supabase
 * (email+senha, Google ou Discord) e antes de navegar para áreas que
 * leem/escrevem no Firestore (ex: /dashboard, /personagens).
 */
export async function syncFirebaseWithSupabaseSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error("Não há sessão Supabase ativa para sincronizar com o Firebase.");
  }

  const response = await fetch("/api/firebase-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: sessionData.session.access_token }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Falha ao obter o Firebase Custom Token.");
  }

  const { firebaseCustomToken } = await response.json();
  await signInWithCustomToken(firebaseAuth, firebaseCustomToken);
}
