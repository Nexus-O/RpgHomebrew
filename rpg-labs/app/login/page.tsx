"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🔥 Firebase
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // 🔥 Providers
  const googleProvider = new GoogleAuthProvider();
  const discordProvider = new OAuthProvider("discord.com");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (resetMessage) setResetMessage("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "O email é obrigatório";
    }

    if (!formData.password) {
      newErrors.password = "A senha é obrigatória";
    }

    return newErrors;
  };

  // 🔥 EMAIL LOGIN (Firebase)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = "Erro ao fazer login";
      
      switch (err.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/wrong-password":
          errorMessage = "Senha incorreta";
          break;
        case "auth/invalid-email":
          errorMessage = "Email inválido";
          break;
        case "auth/too-many-requests":
          errorMessage = "Muitas tentativas. Tente novamente mais tarde";
          break;
        default:
          errorMessage = err.message;
      }
      
      setErrors({ email: errorMessage });
    }

    setIsLoading(false);
  };

  // 🔥 GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ email: err.message });
    }
  };

  // 🔥 DISCORD LOGIN
  const handleDiscordLogin = async () => {
    try {
      await signInWithRedirect(auth, discordProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ email: err.message });
    }
  };

  // 🔥 RESET PASSWORD
  const handleResetPassword = async () => {
    if (!formData.email) {
      setErrors({ email: "Digite seu email para recuperar a senha" });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetMessage("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setErrors({});
    } catch (err: any) {
      let errorMessage = "Erro ao enviar email de recuperação";
      
      switch (err.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/invalid-email":
          errorMessage = "Email inválido";
          break;
        default:
          errorMessage = err.message;
      }
      
      setErrors({ email: errorMessage });
    }
    setIsLoading(false);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          background: #080202;
          overflow-x: hidden;
        }
      `}</style>

      <style>{`
        /* ── Base Container ── */
        .login-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #080202;
          padding: 2rem;
        }

        /* Background layers */
        .login-bg {
          position: absolute;
          inset: 0;
          background-image: url('/hero-bg.jpg');
          background-color: #1a0505;
          background-size: cover;
          background-position: center 30%;
          background-blend-mode: overlay;
          filter: brightness(0.45) saturate(1.3);
          z-index: 0;
        }

        .login-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(5, 0, 0, 0.85) 100%);
          z-index: 1;
        }

        /* Embers (brasas animadas) */
        .embers {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          pointer-events: none;
        }

        .ember {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #cc1a1a;
          box-shadow: 0 0 6px 2px rgba(180, 20, 20, 0.55);
          animation: float-up linear infinite;
          opacity: 0;
        }

        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0) scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-80vh) translateX(30px) scale(0.3); opacity: 0; }
        }

        .ember:nth-child(1)  { left: 15%; animation-duration: 7s;  animation-delay: 0s;    bottom: 10%; }
        .ember:nth-child(2)  { left: 28%; animation-duration: 9s;  animation-delay: 1.5s;  bottom: 5%;  width:3px; height:3px; }
        .ember:nth-child(3)  { left: 42%; animation-duration: 6s;  animation-delay: 0.8s;  bottom: 15%; }
        .ember:nth-child(4)  { left: 55%; animation-duration: 11s; animation-delay: 2s;    bottom: 8%;  width:1px; height:1px; }
        .ember:nth-child(5)  { left: 70%; animation-duration: 8s;  animation-delay: 0.3s;  bottom: 20%; }
        .ember:nth-child(6)  { left: 83%; animation-duration: 10s; animation-delay: 3s;    bottom: 5%;  width:3px; height:3px; }
        .ember:nth-child(7)  { left: 8%;  animation-duration: 7.5s;animation-delay: 1.2s;  bottom: 12%; }
        .ember:nth-child(8)  { left: 35%; animation-duration: 9.5s;animation-delay: 4s;    bottom: 3%;  }
        .ember:nth-child(9)  { left: 62%; animation-duration: 6.5s;animation-delay: 2.5s;  bottom: 18%; width:1px; height:1px; }
        .ember:nth-child(10) { left: 77%; animation-duration: 8.5s;animation-delay: 0.6s;  bottom: 7%;  }
        .ember:nth-child(11) { left: 90%; animation-duration: 7.2s;animation-delay: 3.5s;  bottom: 14%; width:3px; height:3px; }
        .ember:nth-child(12) { left: 50%; animation-duration: 10.5s;animation-delay: 1.8s; bottom: 2%;  }

        @media (prefers-reduced-motion: reduce) {
          .ember {
            animation: none !important;
            display: none;
          }
        }

        /* Content wrapper */
        .login-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 500px;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Back button */
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #8a6060;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-decoration: none;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
          background: none;
          border: none;
          cursor: pointer;
        }

        .back-button:hover {
          color: #cc1a1a;
          transform: translateX(-4px);
        }

        /* Login Card */
        .login-card {
          position: relative;
          background: rgba(16, 4, 4, 0.95);
          border: 1px solid rgba(100, 20, 20, 0.5);
          backdrop-filter: blur(10px);
          padding: 3rem 2.5rem;
          overflow: hidden;
        }

        .card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 30% at 50% 0%, rgba(180, 20, 20, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Card Header */
        .card-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .crimson-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(to right, transparent, #cc1a1a, #cc1a1a, transparent);
          margin: 0 auto 1.5rem;
        }

        .card-eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 0.5em;
          color: #cc1a1a;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .card-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.8rem, 5vw, 2.5rem);
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .card-title em {
          font-style: normal;
          color: #cc1a1a;
        }

        .card-subtitle {
          font-family: 'Crimson Pro', serif;
          font-size: 0.9rem;
          color: #8a6060;
          letter-spacing: 0.06em;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: #d4c4c4;
          text-transform: uppercase;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          font-size: 1rem;
          opacity: 0.6;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          background: rgba(8, 2, 2, 0.8);
          border: 1px solid rgba(100, 20, 20, 0.5);
          padding: 0.875rem 1rem 0.875rem 2.5rem;
          color: #d4c4c4;
          font-family: 'Crimson Pro', serif;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #cc1a1a;
          box-shadow: 0 0 10px rgba(200, 30, 30, 0.3);
        }

        .form-input::placeholder {
          color: #4a3030;
          font-style: italic;
        }

        .input-error {
          border-color: #cc1a1a;
          box-shadow: 0 0 8px rgba(200, 30, 30, 0.4);
        }

        .error-message {
          color: #cc1a1a;
          font-family: 'Crimson Pro', serif;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .success-message {
          color: #4caf50;
          font-family: 'Crimson Pro', serif;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          text-align: center;
        }

        /* Forgot password */
        .forgot-password {
          text-align: right;
          margin-top: -0.5rem;
        }

        .forgot-link {
          font-family: 'Crimson Pro', serif;
          font-size: 0.7rem;
          color: #8a6060;
          text-decoration: none;
          transition: color 0.3s ease;
          cursor: pointer;
          background: none;
          border: none;
        }

        .forgot-link:hover {
          color: #cc1a1a;
        }

        /* Login Button */
        .btn-login {
          position: relative;
          width: 100%;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #fff;
          padding: 16px 32px;
          background: linear-gradient(135deg, #8b0000 0%, #5a0000 100%);
          border: 1px solid #cc1a1a;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .btn-login::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #cc1a1a 0%, #8b0000 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-login::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
          transition: left 0.5s ease;
        }

        .btn-login:hover:not(:disabled)::before {
          opacity: 1;
        }

        .btn-login:hover:not(:disabled)::after {
          left: 150%;
        }

        .btn-login:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(200, 20, 20, 0.7);
          border-color: #ff3333;
          transform: translateY(-2px);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        /* Corners */
        .corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: #c9a84c;
          border-style: solid;
          opacity: 0.6;
          z-index: 1;
        }

        .corner-tl { top: 3px; left: 3px; border-width: 1px 0 0 1px; }
        .corner-tr { top: 3px; right: 3px; border-width: 1px 1px 0 0; }
        .corner-bl { bottom: 3px; left: 3px; border-width: 0 0 1px 1px; }
        .corner-br { bottom: 3px; right: 3px; border-width: 0 1px 1px 0; }

        /* Social Login */
        .social-login {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          gap: 0.75rem;
          padding: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(100, 20, 20, 0.5);
          background: rgba(8, 2, 2, 0.8);
          color: #d4c4c4;
          text-decoration: none;
        }

        .social-btn:hover {
          transform: translateY(-2px);
          border-color: #cc1a1a;
        }

        .social-btn.google:hover {
          background: #4285F4;
          border-color: #4285F4;
          color: #fff;
        }

        .social-btn.discord:hover {
          background: #5865F2;
          border-color: #5865F2;
          color: #fff;
        }

        .social-icon {
          font-size: 1.2rem;
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(100, 20, 20, 0.3);
        }

        .divider span {
          font-family: 'Crimson Pro', serif;
          font-size: 0.7rem;
          color: #8a6060;
          padding: 0 0.75rem;
          letter-spacing: 0.1em;
        }

        /* Loading spinner */
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Register Link */
        .register-link {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(100, 20, 20, 0.3);
        }

        .register-link p {
          font-family: 'Crimson Pro', serif;
          font-size: 0.85rem;
          color: #8a6060;
        }

        .link-highlight {
          color: #cc1a1a;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .link-highlight:hover {
          color: #ff3333;
          text-decoration: underline;
        }

        /* Security Seal */
        .security-seal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
        }

        .seal-icon {
          font-size: 1rem;
          opacity: 0.6;
        }

        .security-seal p {
          font-family: 'Crimson Pro', serif;
          font-size: 0.7rem;
          color: #4a3030;
          letter-spacing: 0.05em;
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .login-container {
            padding: 1rem;
          }
          
          .login-card {
            padding: 2rem 1.5rem;
          }
          
          .card-title {
            font-size: 1.8rem;
          }
          
          .btn-login {
            font-size: 0.7rem;
            padding: 14px 24px;
          }
        }

        /* Animações de entrada */
        .form-group {
          animation: slideIn 0.5s ease backwards;
        }

        .form-group:nth-child(1) { animation-delay: 0.1s; }
        .form-group:nth-child(2) { animation-delay: 0.2s; }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="login-container">
        <div className="login-bg" />
        <div className="login-vignette" />
        
        <div className="embers" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ember" />
          ))}
        </div>

        <div className="login-content">
          <Link href="/" className="back-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Voltar ao Nexus
          </Link>

          <div className="login-card">
            <div className="card-glow" />
            
            <div className="card-header">
              <div className="crimson-line" />
              <p className="card-eyebrow">Bem-vindo de Volta</p>
              <h1 className="card-title">
                Invoque <em>Sua Conta</em>
              </h1>
              <p className="card-subtitle">
                O Nexus Carmesim aguarda seu retorno, guerreiro
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Corvo Mensageiro (Email)
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">📜</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email && !errors.email.includes("recuperação") ? "input-error" : ""}`}
                    placeholder="seu@nexus.com"
                  />
                </div>
                {errors.email && !errors.email.includes("recuperação") && (
                  <p className="error-message">{errors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Palavra Secreta
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? "input-error" : ""}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              <div className="forgot-password">
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="forgot-link"
                  disabled={isLoading}
                >
                  Esqueceu a palavra secreta?
                </button>
              </div>

              {resetMessage && (
                <p className="success-message">{resetMessage}</p>
              )}

              <button 
                type="submit" 
                className="btn-login"
                disabled={isLoading}
              >
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <span className="btn-content">
                  {isLoading ? (
                    <>
                      <span className="loading-spinner" />
                      Conjurando acesso...
                    </>
                  ) : (
                    "Entrar no Nexus"
                  )}
                </span>
              </button>
            </form>

            {/* Social Login */}
            <div className="divider">
              <span>ou conecte-se com</span>
            </div>

            <div className="social-login">
              <button 
                type="button" 
                onClick={handleGoogleLogin} 
                className="social-btn google"
                disabled={isLoading}
              >
                <span className="social-icon">G</span>
                Continuar com Google
              </button>
              
            </div>

            <div className="register-link">
              <p>
                Novo no reino?{" "}
                <Link href="/register" className="link-highlight">
                  Forje seu destino
                </Link>
              </p>
            </div>

            <div className="security-seal">
              <div className="seal-icon">🛡️</div>
              <p>Sua jornada está segura sob o pacto carmesim</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}