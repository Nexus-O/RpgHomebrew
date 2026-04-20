"use client";

import { useState } from "react";
import Link from "next/link";
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

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Providers
  const googleProvider = new GoogleAuthProvider();
  const discordProvider = new OAuthProvider("discord.com");

  // ───────── INPUT ─────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // ───────── VALIDAÇÃO ─────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "O nome é obrigatório";
    }

    if (!formData.email.match(/\S+@\S+\.\S+/)) {
      newErrors.email = "Email inválido";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }

    return newErrors;
  };

  // ───────── EMAIL REGISTER ─────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  // ───────── GOOGLE ─────────
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ───────── DISCORD ─────────
  const handleDiscordLogin = async () => {
    try {
      await signInWithPopup(auth, discordProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="registro-container">

        {/* ERRO GLOBAL */}
        {error && (
          <p style={{ color: "red", textAlign: "center" }}>{error}</p>
        )}

        <form onSubmit={handleSubmit} className="registro-form">

          <input
            name="username"
            placeholder="Nome"
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Senha"
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar senha"
            onChange={handleChange}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Carregando..." : "Registrar"}
          </button>
        </form>

        {/* LOGIN SOCIAL */}
        <button onClick={handleGoogleLogin}>
          Entrar com Google
        </button>

        <button onClick={handleDiscordLogin}>
          Entrar com Discord
        </button>

        <Link href="/">Voltar</Link>
      </div>
    </>
  );
}