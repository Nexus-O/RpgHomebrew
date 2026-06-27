import type { CSSProperties } from "react";

/**
 * Mapa central de ícones do projeto.
 * Troca emojis por ícones de fantasia (RPG-Awesome).
 * Pra adicionar um novo ícone, só incluir a chave aqui e usar <Icon name="chave" />.
 * Lista completa de classes disponíveis: https://nagoshiashumari.github.io/Rpg-Awesome/
 */
export const ICONS = {
  dashboard: "ra-crossed-swords",
  personagens: "ra-hood",
  campanhas: "ra-scroll-unfurled",
  bestiario: "ra-dragon",
  itens: "ra-gem",
  perfil: "ra-player",
  usuario: "ra-hood",
  dados: "ra-perspective-dice-six",
  mapa: "ra-mountains",
  transmitir: "ra-satellite",
  senha: "ra-locked-fortress",
  confirmarSenha: "ra-key",
  selo: "ra-shield",
  fechar: "ra-cancel",
  sair: "ra-x-mark",
  pingente: "ra-gem-pendant",
  // avatares de personagem
  avatarMago: "ra-hood",
  avatarGuerreiro: "ra-crossed-swords",
  avatarArqueiro: "ra-crossbow",
  avatarGuardiao: "ra-shield",
  avatarNecromante: "ra-skull",
  avatarFogo: "ra-fire",
  avatarGelo: "ra-snowflake",
  avatarRaio: "ra-lightning-bolt",
  avatarDruida: "ra-leaf",
  avatarBardo: "ra-dragonfly",
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Renderiza um ícone de fantasia (RPG-Awesome) no lugar de um emoji. */
export default function Icon({ name, className = "", style, title }: IconProps) {
  return (
    <i
      className={`ra ${ICONS[name]} ${className}`.trim()}
      style={style}
      title={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
