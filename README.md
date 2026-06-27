<div align="center">

# ⚜️ Nexus Carmesin

### *Uma plataforma moderna para gerenciamento de campanhas, personagens e sistemas de RPG.*

<img src="public/logo.png" width="180"/>

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-8A2BE2?style=for-the-badge)

---

*"Onde histórias são forjadas, campanhas ganham vida e mundos se conectam."*

</div>

---

# 📖 Sobre o Projeto

**Nexus Carmesin** é uma plataforma web criada para ser o centro de gerenciamento de RPG de mesa.

O projeto nasceu com o objetivo de reunir em um único lugar tudo que jogadores e mestres precisam durante suas campanhas, oferecendo suporte tanto para sistemas oficiais quanto para sistemas autorais.

Mais do que um simples gerenciador de fichas, o Nexus Carmesin pretende se tornar um verdadeiro **Homebrew Hub**, permitindo criar personagens, campanhas, inventários, bestiários e até mesmo sistemas próprios futuramente.

---

# ✨ Principais Funcionalidades

## ⚔️ Dashboard

Um painel totalmente estilizado contendo:

- Visão geral da conta
- Personagens recentes
- Campanhas
- Navegação rápida
- Interface inspirada em RPG

---

## 🧙 Personagens

Criação completa de personagens.

Cada personagem possui:

- Nome
- Classe
- Raça
- Nível
- Retrato personalizado
- Sistema escolhido
- Atributos específicos
- História
- Inventário (planejado)

---

## 📜 Campanhas

Gerenciamento completo de campanhas.

Planejado:

- Mestre
- Jogadores
- Sessões
- Diário
- Personagens participantes
- Notas
- Arquivos

---

## 🐉 Bestiário

Biblioteca de criaturas.

- Monstros
- NPCs
- Criaturas Homebrew

---

## 🎒 Inventário

Cada personagem possuirá seu próprio inventário.

Incluindo:

- Equipamentos
- Armas
- Armaduras
- Consumíveis
- Ouro
- Peso
- Raridade

---

## 👤 Perfil

Cada usuário possui seu próprio perfil contendo:

- Foto
- Nome
- Email
- Estatísticas
- Personagens
- Campanhas

---

# 🎲 Sistemas Suportados

## ⚜️ Purgatum *(Sistema Próprio)*

Sistema desenvolvido exclusivamente para o Nexus Carmesin.

Características:

- Atributos próprios
- Classes exclusivas
- Afinidades (Marcas)
- Progressão personalizada

### As Seis Marcas

| Marca | Significado |
|--------|------------|
| 🔥 Cinis | Cinzas |
| 🩸 Sanguis | Sangue |
| 🌌 Nebula | Vazio |
| 🪨 Rubigo | Ferrugem |
| ☀️ Cinsellus | Luz |
| 🌿 Radix | Natureza |

---

## 👁 Ordem Paranormal

Ficha adaptada ao sistema oficial.

---

## 🐉 Dungeons & Dragons

Ficha baseada no sistema tradicional de D&D.

---

## ⚙️ Outros Sistemas

A plataforma foi projetada para suportar novos sistemas futuramente.

---

# 🛠 Tecnologias

| Tecnologia | Utilização |
|------------|-----------|
| Next.js | Frontend |
| React | Interface |
| TypeScript | Tipagem |
| Firebase Authentication | Login |
| Cloud Firestore | Banco de Dados |
| Firebase Storage | Upload de imagens *(planejado)* |

---

# 📂 Estrutura do Projeto

```text
app/
│
├── dashboard/
├── personagens/
├── campanhas/
├── bestiario/
├── itens/
├── perfil/
├── login/
├── firebase.ts
└── globals.css

public/
├── logo.png
└── avatar.png
```

---

# 🗄 Banco de Dados

Coleções principais:

```text
users
characters
campaigns
items
bestiary
```

Cada documento é vinculado ao usuário autenticado através do Firebase Authentication.

---

# 🔐 Autenticação

O projeto utiliza:

- Firebase Authentication
- Login seguro
- Rotas protegidas
- Redirecionamento automático

Caso o usuário não esteja autenticado, ele é enviado para a tela de login.

---

# 🎨 Design

O Nexus Carmesin possui identidade própria inspirada em:

- Grimórios antigos
- Fantasia medieval
- Dark Fantasy
- Interfaces de RPG AAA

Características:

- Tons escuros
- Destaques em roxo e vermelho
- Tipografia **Cinzel**
- Elementos luminosos discretos
- Interface imersiva

---

# 🚧 Roadmap

## ✅ Concluído

- Sistema de Login
- Dashboard
- Firebase Authentication
- Firestore
- Estrutura inicial de personagens
- Rotas protegidas

---

## 🔄 Em Desenvolvimento

- Ficha completa de personagens
- Inventário
- Campanhas
- Perfil
- Upload de imagens
- Bestiário

---

## 🚀 Futuro

- Sistema de Dados integrado
- Editor visual de fichas
- Compartilhamento de Homebrews
- Criação de sistemas personalizados
- Biblioteca pública
- Diário de campanha
- Mapas interativos
- Rolagem de dados integrada
- IA para criação de campanhas
- IA para NPCs
- IA para criação de itens
- IA para geração de histórias
- Multiplayer em tempo real

---

# 📸 Preview

> Em breve serão adicionadas imagens da interface.

```text
📷 Dashboard
📷 Personagens
📷 Campanhas
📷 Perfil
```

---

# 🚀 Instalação

Clone o projeto:

```bash
git clone https://github.com/SEU_USUARIO/nexus-carmesin.git
```

Entre na pasta:

```bash
cd nexus-carmesin
```

Instale as dependências:

```bash
npm install
```

Configure o Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Execute:

```bash
npm run dev
```

---

# 🤝 Contribuindo

Contribuições são bem-vindas.

Caso queira sugerir melhorias:

1. Faça um Fork
2. Crie uma Branch
3. Faça suas alterações
4. Abra um Pull Request

---

# 📜 Licença

Este projeto está licenciado sob a licença MIT.

---

<div align="center">

# ⚜️ Nexus Carmesin

*"Forje personagens. Construa mundos. Viva histórias."*

Made with ❤️ using Next.js & Firebase

</div>
