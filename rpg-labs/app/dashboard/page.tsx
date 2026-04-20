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

       .sidebar {
  width: 240px;
  height: 100vh;
  background: #080202;
  border-right: 1px solid #3a0c0c;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 30px;
}

.sidebar nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  color: #c4b5fd;
  text-decoration: none;
  transition: 0.3s;
}

.sidebar nav a:hover {
  background: #2e1065;
}

.sidebar nav a.active {
  background: #5b21b6;
}

.sidebar nav span {
  font-size: 18px;
}

.user-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.user-box img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #7c3aed;
}

.user-box p {
  font-size: 0.8rem;
  color: #ddd;
}

.user-box button {
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  background: #3a0c0c;
  border: none;
  color: white;
  cursor: pointer;
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
        <div className="sidebar">
  <div className="logo">Purgatum</div>

  <nav>
    <a className="active"><span>🏠</span> Dashboard</a>
    <a><span>🧙</span> Personagens</a>
    <a><span>📜</span> Campanhas</a>
    <a><span>🐉</span> Bestiário</a>
    <a><span>💎</span> Itens</a>
    <a><span>👤</span> Perfil</a>
  </nav>

  <div className="user-box">
    <img src={user?.photoURL || "/avatar.png"} />
    <p>{user?.displayName || user?.email}</p>

    <button onClick={() => auth.signOut()}>
      🚪 Sair
    </button>
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
  <h2>📜 Atividade</h2>

  {activities.length === 0 ? (
    <p>Nenhuma atividade ainda...</p>
  ) : (
    activities.map((act, i) => (
      <div key={i} className="activity-item">
        {act.text}
      </div>
    ))
  )}
</div>
        </div>
      </div>
    </>
  );
}