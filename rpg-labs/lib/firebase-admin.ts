import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK — uso EXCLUSIVO no servidor (API Routes / Server Actions).
 * NUNCA importar este arquivo em um componente "use client".
 *
 * Usado apenas para gerar Custom Tokens a partir de uma sessão Supabase já
 * validada, permitindo que o Firestore continue reconhecendo
 * `request.auth.uid` nas Security Rules.
 */

function getFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Variáveis de ambiente guardam quebras de linha como "\n" literal —
  // é necessário converter de volta para quebras de linha reais.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltam variáveis do Firebase Admin (FIREBASE_ADMIN_PROJECT_ID, " +
      "FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY). " +
      "Confira o .env.local (dev) ou as Environment Variables da Vercel (produção)."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
