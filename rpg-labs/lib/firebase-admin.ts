import "server-only";
import jwt from "jsonwebtoken";

/**
 * Geração manual de Firebase Custom Tokens — uso EXCLUSIVO no servidor.
 * NUNCA importar este arquivo em um componente "use client".
 *
 * Por que não usamos o pacote oficial "firebase-admin": ele depende de
 * jwks-rsa → jose (ESM puro), que quebra em runtime na Vercel com Turbopack
 * (ERR_REQUIRE_ESM), mesmo com serverExternalPackages configurado. Como só
 * precisamos de createCustomToken (que apenas assina um JWT com a chave
 * privada da Service Account — não verifica nada externo), implementamos
 * isso manualmente com "jsonwebtoken", uma lib pura e sem esse problema.
 *
 * Spec oficial do formato exigido pelo Firebase:
 * https://firebase.google.com/docs/auth/admin/create-custom-tokens
 */

const FIREBASE_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";

function getServiceAccountCredentials() {
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

  return { projectId, clientEmail, privateKey };
}

/**
 * Gera um Firebase Custom Token para o uid informado, assinado com a chave
 * privada da Service Account (RS256), válido por 1 hora (máximo permitido
 * pelo Firebase).
 */
export function createFirebaseCustomToken(
  uid: string,
  additionalClaims: Record<string, unknown> = {}
): string {
  const { clientEmail, privateKey } = getServiceAccountCredentials();

  const nowSeconds = Math.floor(Date.now() / 1000);

  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: FIREBASE_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 60, // 1 hora — máximo permitido pelo Firebase
    uid,
    claims: additionalClaims,
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}
