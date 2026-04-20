"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) return null;

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          background: #0b0202;
          font-family: 'Crimson Pro', serif;
        }
      `}</style>

      <style>{`
        .container {
          display: flex;
          min-height: 100vh;
          color: #d4c4c4;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: #140404;
          border-right: 1px solid rgba(200, 30, 30, 0.3);
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .logo {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          letter-spacing: 0.2em;
          text-align: center;
          margin-bottom: 2rem;
          color: #cc1a1a;
        }

        .menu {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .menu button {
          background: none;
          border: 1px solid transparent;
          color: #d4c4c4;
          padding: 0.7rem;
          text-align: left;
          cursor: pointer;
          transition: 0.3s;
        }

        .menu button:hover {
          border-color: #cc1a1a;
          background: rgba(200, 20, 20, 0.1);
        }

        .logout {
          border: 1px solid #cc1a1a;
          background: none;
          color: #cc1a1a;
          padding: 0.7rem;
          cursor: pointer;
        }

        /* Main */
        .main {
          flex: 1;
          padding: 2rem;
        }

        .title {
          font-family: 'Cinzel', serif;
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .card {
          background: rgba(20, 4, 4, 0.9);
          border: 1px solid rgba(200, 30, 30, 0.4);
          padding: 1.2rem;
          transition: 0.3s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(200, 30, 30, 0.4);
        }

        .card h3 {
          font-family: 'Cinzel', serif;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .inventory-item {
          border-bottom: 1px solid rgba(200, 30, 30, 0.2);
          padding: 0.3rem 0;
        }
      `}</style>

      <div className="container">
        {/* Sidebar */}
        <div className="sidebar">
          <div>
            <div className="logo">NEXUS</div>

            <div className="menu">
              <button>🏰 Dashboard</button>
              <button>🧙 Personagens</button>
              <button>📜 Campanhas</button>
              <button>🎒 Inventário</button>
              <button>⚙️ Configurações</button>
            </div>
          </div>

          <button onClick={handleLogout} className="logout">
            Sair
          </button>
        </div>

        {/* Main */}
        <div className="main">
          <div className="title">
            Bem-vindo, {user?.email}
          </div>

          <div className="grid">
            {/* Personagens */}
            <div className="card">
              <h3>🧙 Seus Personagens</h3>
              <p>Cavaleiro Carmesim</p>
              <p>Mago da Ruína</p>
            </div>

            {/* Campanhas */}
            <div className="card">
              <h3>📜 Campanhas Ativas</h3>
              <p>Queda do Reino</p>
              <p>Praga Negra</p>
            </div>

            {/* Inventário */}
            <div className="card">
              <h3>🎒 Inventário</h3>
              <div className="inventory-item">Espada +3</div>
              <div className="inventory-item">Poção de Vida</div>
              <div className="inventory-item">Armadura Sombria</div>
            </div>

            {/* Status */}
            <div className="card">
              <h3>🔥 Status</h3>
              <p>Nível: 12</p>
              <p>XP: 3400</p>
              <p>Ouro: 120</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}