import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

// Essa rota depende de uma requisição real (sessão do usuário) e nunca deve
// ser pré-renderizada/coletada durante o build — isso evitaria inicializar
// o Firebase Admin com credenciais que só existem em runtime.
export const dynamic = "force-dynamic";

/**
 * POST /api/firebase-token
 *
 * Recebe o access_token (JWT) da sessão Supabase do usuário já logado,
 * valida esse token contra o próprio Supabase Auth, e em caso de sucesso
 * devolve um Firebase Custom Token com uid = supabase user.id.
 *
 * O client então usa esse Custom Token com signInWithCustomToken() para que
 * o Firestore continue reconhecendo request.auth.uid nas Security Rules,
 * mesmo o login "de verdade" agora sendo feito pelo Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();

    if (!access_token || typeof access_token !== "string") {
      return NextResponse.json(
        { error: "access_token ausente ou inválido." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variáveis do Supabase não configuradas no servidor.");
    }

    // Client "deslogado" do Supabase, usado só para validar o token recebido.
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabaseServer.auth.getUser(access_token);

    if (error || !data?.user) {
      return NextResponse.json(
        { error: "Sessão Supabase inválida ou expirada." },
        { status: 401 }
      );
    }

    const supabaseUser = data.user;

    // uid do Firebase = uid do Supabase, assim os dois sistemas ficam
    // sempre alinhados (mesmo "dono" nos documentos do Firestore).
    const firebaseCustomToken = await getFirebaseAdminAuth().createCustomToken(
      supabaseUser.id,
      {
        // Claims extras úteis para Security Rules, se precisar no futuro.
        email: supabaseUser.email ?? null,
        provider: supabaseUser.app_metadata?.provider ?? "email",
      }
    );

    return NextResponse.json({ firebaseCustomToken });
  } catch (err) {
    console.error("[/api/firebase-token] erro:", err);
    return NextResponse.json(
      { error: "Erro interno ao gerar o Firebase Custom Token." },
      { status: 500 }
    );
  }
}
