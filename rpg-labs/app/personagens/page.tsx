"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const sistemas = [
  "Purgatum",
  "D&D",
  "Ordem Paranormal",
  "Sistema Custom"
];

export default function CriarPersonagem() {
  const router = useRouter();
  const storage = getStorage();

  const [user, setUser] = useState<any>(null);
  const [sistema, setSistema] = useState("Purgatum");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const [form, setForm] = useState<any>({
    nome: "",
    classe: "",
    nivel: 1,
    atributos: {}
  });

  // 🔐 Proteção
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, []);

  // 🎭 Atributos dinâmicos por sistema
  useEffect(() => {
    if (sistema === "Purgatum") {
      setForm((prev: any) => ({
        ...prev,
        atributos: {
          força: 0,
          destreza: 0,
          vigor: 0,
          mente: 0
        }
      }));
    }

    if (sistema === "D&D") {
      setForm((prev: any) => ({
        ...prev,
        atributos: {
          força: 10,
          destreza: 10,
          constituição: 10,
          inteligência: 10,
          sabedoria: 10,
          carisma: 10
        }
      }));
    }

    if (sistema === "Ordem Paranormal") {
      setForm((prev: any) => ({
        ...prev,
        atributos: {
          força: 0,
          agilidade: 0,
          intelecto: 0,
          presença: 0
        }
      }));
    }
  }, [sistema]);

  // 📷 Upload preview
  const handleImagem = (e: any) => {
    const file = e.target.files[0];
    setImagem(file);
    setPreview(URL.createObjectURL(file));
  };

  // 💾 Salvar personagem
  const handleSave = async () => {
    let imageUrl = "";

    if (imagem) {
      const imageRef = ref(storage, `personagens/${Date.now()}`);
      await uploadBytes(imageRef, imagem);
      imageUrl = await getDownloadURL(imageRef);
    }

    await addDoc(collection(db, "personagens"), {
      ...form,
      sistema,
      userId: user.uid,
      imageUrl
    });

    router.push("/dashboard");
  };

  return (
    <div className="container">
      <h1>Criar Personagem</h1>

      {/* SISTEMA */}
      <select
        value={sistema}
        onChange={(e) => setSistema(e.target.value)}
      >
        {sistemas.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      {/* NOME */}
      <input
        placeholder="Nome"
        onChange={(e) =>
          setForm({ ...form, nome: e.target.value })
        }
      />

      {/* CLASSE */}
      <input
        placeholder="Classe"
        onChange={(e) =>
          setForm({ ...form, classe: e.target.value })
        }
      />

      {/* IMAGEM */}
      <input type="file" onChange={handleImagem} />
      {preview && <img src={preview} className="preview" />}

      {/* ATRIBUTOS */}
      <div className="atributos">
        {Object.keys(form.atributos || {}).map((key) => (
          <div key={key}>
            <label>{key}</label>
            <input
              type="number"
              value={form.atributos[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  atributos: {
                    ...form.atributos,
                    [key]: Number(e.target.value)
                  }
                })
              }
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave}>
        Salvar Personagem
      </button>

      <style>{`
        .container {
          min-height: 100vh;
          background: #0b0613;
          color: white;
          padding: 2rem;
          font-family: 'Cinzel', serif;
        }

        h1 {
          color: #a855f7;
        }

        input, select {
          display: block;
          margin: 10px 0;
          padding: 10px;
          background: #1a1127;
          border: 1px solid #6b21a8;
          color: white;
        }

        .atributos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .preview {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border: 2px solid #a855f7;
          margin-top: 10px;
        }

        button {
          margin-top: 20px;
          padding: 12px;
          background: #6b21a8;
          border: none;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}