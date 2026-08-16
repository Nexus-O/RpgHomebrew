"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { supabase } from "@/lib/supabase/client";

type ModulePlaceholderProps = {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
};

export default function ModulePlaceholder({ icon, eyebrow, title, description, nextStep }: ModulePlaceholderProps) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    };
    void checkSession();
  }, [router]);

  if (checkingSession) return <div className="module-loading">Abrindo arquivo...</div>;

  return (
    <main className="module-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        .module-page{min-height:100vh;display:grid;place-items:center;padding:2rem;background:radial-gradient(circle at 50% 15%,#250707 0%,#080202 45%,#030101 100%);color:#eadada;font-family:'Crimson Pro',serif}
        .module-loading{min-height:100vh;display:grid;place-items:center;background:#050101;color:#b68a8a;font-family:'Cinzel',serif;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase}
        .module-card{width:min(680px,100%);position:relative;padding:clamp(2rem,7vw,4.5rem);text-align:center;border:1px solid rgba(170,35,35,.45);background:linear-gradient(140deg,rgba(40,5,5,.78),rgba(8,2,2,.9));box-shadow:0 24px 80px rgba(0,0,0,.45)}
        .module-card::before{content:'';position:absolute;inset:9px;border:1px solid rgba(170,35,35,.16);pointer-events:none}
        .module-icon{display:grid;place-items:center;width:74px;height:74px;margin:0 auto 1.5rem;border:1px solid rgba(205,35,35,.65);border-radius:50%;color:#dc3838;font-size:2rem;background:rgba(120,10,10,.18)}
        .module-eyebrow{font-family:'Cinzel',serif;font-size:.66rem;letter-spacing:.22em;color:#b74b4b;text-transform:uppercase}
        .module-title{margin:.65rem 0 1rem;font-family:'Cinzel',serif;font-size:clamp(1.6rem,5vw,2.6rem);letter-spacing:.07em;color:#fff;text-transform:uppercase}
        .module-description{max-width:470px;margin:0 auto;color:#bea8a8;font-size:1.1rem;line-height:1.55}
        .module-next{margin:1.7rem auto 0;max-width:420px;padding:.75rem 1rem;border-top:1px solid rgba(170,35,35,.32);border-bottom:1px solid rgba(170,35,35,.32);color:#d8baba;font-size:.95rem;font-style:italic}
        .module-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:.75rem;margin-top:2rem}
        .module-actions a{padding:.7rem 1rem;border:1px solid rgba(180,40,40,.55);color:#e9dada;text-decoration:none;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;transition:.2s}
        .module-actions a:hover{border-color:#ed4a4a;background:rgba(120,10,10,.36);transform:translateY(-2px)}
      `}</style>
      <section className="module-card">
        <div className="module-icon"><Icon name={icon} /></div>
        <p className="module-eyebrow">{eyebrow}</p>
        <h1 className="module-title">{title}</h1>
        <p className="module-description">{description}</p>
        <p className="module-next">Próximo passo: {nextStep}</p>
        <div className="module-actions">
          <Link href="/dashboard">Voltar ao painel</Link>
          <Link href="/personagens">Ver personagens</Link>
        </div>
      </section>
    </main>
  );
}
