import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (e suas dependências transitivas jwks-rsa/jose, que são
  // ESM puro) precisam rodar via require() nativo do Node em vez de serem
  // empacotadas pelo Turbopack — senão o build da Vercel falha em runtime
  // com "ERR_REQUIRE_ESM" dentro da API route que usa o Admin SDK.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;