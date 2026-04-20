"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    characters: 0,
    campaigns: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);

  // 🔐 PROTEÇÃO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        await loadData(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 CARREGAR DADOS REAIS
  const loadData = async (uid: string) => {
    try {
      // personagens
      const charQuery = query(
        collection(db, "characters"),
        where("userId", "==", uid)
      );
      const charSnap = await getDocs(charQuery);

      // campanhas
      const campQuery = query(
        collection(db, "campaigns"),
        where("members", "array-contains", uid)
      );
      const campSnap = await getDocs(campQuery);

      // atividades
      const actQuery = query(
        collection(db, "activities"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const actSnap = await getDocs(actQuery);

      setStats({
        characters: charSnap.size,
        campaigns: campSnap.size,
      });

      setActivities(
        actSnap.docs.map((doc) => doc.data())
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) return <p style={{ color: "white" }}>Carregando...</p>;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Pro:wght@300;400&display=swap');

        body {
          background: #050101;
          color: #e6dede;
        }
      `}</style>

      <style>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
        }

        /* SIDEBAR */
        .sidebar {
          width: 260px;
          background: #0a0202;
          border-right: 1px solid rgba(150,30,30,0.3);
          padding: 2rem 1.5rem;
        }

        .logo {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 2rem;
          color: #cc1a1a;
        }

        .menu {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .menu button {
          background: transparent;
          border: none;
          color: #a88;
          text-align: left;
          font-family: 'Cinzel', serif;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: 0.3s;
        }

        .menu button:hover {
          color: #fff;
        }

        /* MAIN */
        .main {
          flex: 1;
          padding: 2rem;
        }

        .title {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          margin-bottom: 2rem;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .card {
          background: rgba(20,5,5,0.9);
          border: 1px solid rgba(150,30,30,0.3);
          padding: 1.5rem;
          transition: 0.3s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(200,20,20,0.3);
        }

        .card h3 {
          font-family: 'Cinzel', serif;
          margin-bottom: 0.5rem;
        }

        .card span {
          font-size: 2rem;
        }

        /* ATIVIDADE */
        .activity {
          margin-top: 2rem;
        }

        .activity h2 {
          font-family: 'Cinzel', serif;
          margin-bottom: 1rem;
        }

        .activity-item {
          padding: 1rem;
          border-bottom: 1px solid rgba(100,20,20,0.3);
          font-family: 'Crimson Pro', serif;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .logout {
          cursor: pointer;
          color: #cc1a1a;
        }
      `}</style>

      <div className="dashboard">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="logo">Purgatum</div>

          <div className="menu">
            <button>Dashboard</button>
            <button>Personagens</button>
            <button>Campanhas</button>
            <button>Inventário</button>
            <button onClick={handleLogout}>Sair</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div className="title">Dashboard</div>
            <div>{user?.email}</div>
          </div>

          {/* CARDS */}
          <div className="cards">
            <div className="card">
              <h3>Personagens</h3>
              <span>{stats.characters}</span>
            </div>

            <div className="card">
              <h3>Campanhas</h3>
              <span>{stats.campaigns}</span>
            </div>
          </div>

          {/* ATIVIDADE REAL */}
          <div className="activity">
            <h2>Atividade Recente</h2>

            {activities.length === 0 && (
              <p>Nenhuma atividade ainda...</p>
            )}

            {activities.map((act, i) => (
              <div key={i} className="activity-item">
                {act.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}