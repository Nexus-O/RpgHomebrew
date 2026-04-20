"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400&display=swap');

        body {
          background: #080202;
        }
      `}</style>

      <style>{`
        .dashboard-container {
          min-height: 100vh;
          background: #080202;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
        }

        .bg {
          position: absolute;
          inset: 0;
          background-image: url('/hero-bg.webp');
          background-size: cover;
          background-position: center;
          filter: brightness(0.3);
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 2;
          background: rgba(16, 4, 4, 0.95);
          border: 1px solid rgba(100, 20, 20, 0.5);
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .title {
          font-family: 'Cinzel', serif;
          font-size: 2rem;
          color: white;
          margin-bottom: 1rem;
        }

        .title em {
          color: #cc1a1a;
          font-style: normal;
        }

        .info {
          font-family: 'Crimson Pro', serif;
          color: #ccc;
          margin-bottom: 2rem;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #8b0000, #5a0000);
          border: 1px solid #cc1a1a;
          color: white;
          font-family: 'Cinzel', serif;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: 0.3s;
        }

        .btn:hover {
          background: #cc1a1a;
          box-shadow: 0 0 20px rgba(200,20,20,0.6);
        }

        .logout {
          margin-top: 1rem;
          background: transparent;
          border: 1px solid #444;
        }

        .logout:hover {
          background: #222;
        }
      `}</style>

      <div className="dashboard-container">
        <div className="bg" />

        <div className="card">
          <h1 className="title">
            Bem-vindo ao <em>Nexus</em>
          </h1>

          <div className="info">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>ID:</strong> {user?.uid}</p>
          </div>

          <button className="btn" onClick={() => router.push("/")}>
            Ir para Home
          </button>

          <button className="btn logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </>
  );
}