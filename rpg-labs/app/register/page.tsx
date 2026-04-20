"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Providers
  const googleProvider = new GoogleAuthProvider();
  const discordProvider = new OAuthProvider("discord.com");

  // ───────────── EMAIL REGISTER ─────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard"); // muda depois se quiser
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // ───────────── GOOGLE LOGIN ─────────────
  async function handleGoogleLogin() {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ───────────── DISCORD LOGIN ─────────────
  async function handleDiscordLogin() {
    setError("");
    try {
      await signInWithPopup(auth, discordProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl space-y-5 border border-zinc-800">
        
        <h1 className="text-2xl font-bold text-center">
          Criar Conta
        </h1>

        {/* EMAIL FORM */}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 bg-black border border-zinc-700 rounded outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 bg-black border border-zinc-700 rounded outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 p-3 rounded font-bold transition"
          >
            {loading ? "Criando..." : "Registrar"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-sm text-zinc-400">ou</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* GOOGLE */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black p-3 rounded font-bold hover:opacity-90 transition"
        >
          Entrar com Google
        </button>

        {/* DISCORD */}
        <button
          onClick={handleDiscordLogin}
          className="w-full bg-indigo-600 p-3 rounded font-bold hover:bg-indigo-500 transition"
        >
          Entrar com Discord
        </button>
      </div>
    </div>
  );
}