export type PersonalityKey =
  | "grumpy"
  | "cute"
  | "sweet"
  | "chaotic"
  | "sleepy";

export const DEFAULT_PERSONALITY: PersonalityKey = "grumpy";

export interface Personality {
  key: PersonalityKey;
  label: string;
  description: string;
  /** SVG viewBox for the silhouette */
  viewBox: string;
  /** SVG path that defines the cat outline */
  path: string;
  /** Eye elements as raw SVG (rendered inside the clip) */
  eyes: string;
  /** Accent color used in patterns / extra details */
  accent: string;
}

export const PERSONALITIES: Record<PersonalityKey, Personality> = {
  grumpy: {
    key: "grumpy",
    label: "Grumpy",
    description: "The original jagged cat",
    viewBox: "0 0 200 310",
    path: `
      M 100 85
      L 125 22
      L 142 82
      L 172 108
      L 158 135
      L 182 155
      L 162 180
      L 178 215
      L 180 290
      L 20 290
      L 22 215
      L 38 180
      L 18 155
      L 42 135
      L 28 108
      L 58 82
      L 75 22
      Z
    `,
    eyes: `
      <polygon points="68,125 90,136 78,148" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
      <polygon points="132,125 110,136 122,148" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
      <line x1="79" y1="128" x2="79" y2="145" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <line x1="121" y1="128" x2="121" y2="145" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
    `,
    accent: "var(--accent)",
  },
  cute: {
    key: "cute",
    label: "Cute",
    description: "Big eyes, round features",
    viewBox: "0 0 200 310",
    path: `
      M 100 110
      L 120 50
      L 140 85
      L 165 105
      L 160 140
      L 175 165
      L 165 195
      L 172 220
      L 175 290
      L 25 290
      L 28 220
      L 35 195
      L 25 165
      L 40 140
      L 35 105
      L 60 85
      L 80 50
      Z
    `,
    eyes: `
      <ellipse cx="75" cy="145" rx="14" ry="16" fill="white" stroke="var(--ink)" strokeWidth="2.5" />
      <ellipse cx="125" cy="145" rx="14" ry="16" fill="white" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="78" cy="148" r="7" fill="var(--ink)" />
      <circle cx="128" cy="148" r="7" fill="var(--ink)" />
      <circle cx="80" cy="145" r="2.5" fill="white" />
      <circle cx="130" cy="145" r="2.5" fill="white" />
      <circle cx="60" cy="170" r="4" fill="var(--accent)" opacity="0.4" />
      <circle cx="140" cy="170" r="4" fill="var(--accent)" opacity="0.4" />
    `,
    accent: "var(--highlight)",
  },
  sweet: {
    key: "sweet",
    label: "Sweet",
    description: "Soft and happy",
    viewBox: "0 0 200 310",
    path: `
      M 100 100
      L 122 40
      L 145 88
      L 172 105
      L 165 140
      L 178 165
      L 162 195
      L 175 220
      L 178 290
      L 22 290
      L 25 220
      L 38 195
      L 22 165
      L 35 140
      L 28 105
      L 55 88
      L 78 40
      Z
    `,
    eyes: `
      <path d="M 65 145 Q 75 135 85 145" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 115 145 Q 125 135 135 145" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 92 165 Q 100 172 108 165" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="165" r="5" fill="var(--accent)" opacity="0.5" />
      <circle cx="140" cy="165" r="5" fill="var(--accent)" opacity="0.5" />
      <path d="M 95 175 Q 100 178 105 175" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" fill="none" />
    `,
    accent: "var(--accent)",
  },
  chaotic: {
    key: "chaotic",
    label: "Chaotic",
    description: "Wild, spiky, unpredictable",
    viewBox: "0 0 200 310",
    path: `
      M 100 90
      L 115 35
      L 128 70
      L 140 25
      L 148 80
      L 170 100
      L 158 130
      L 180 150
      L 155 175
      L 175 210
      L 178 290
      L 22 290
      L 25 210
      L 45 175
      L 20 150
      L 42 130
      L 30 100
      L 52 80
      L 60 25
      L 72 70
      L 85 35
      Z
    `,
    eyes: `
      <polygon points="55,130 85,145 65,160" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
      <polygon points="145,130 115,145 135,160" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="70" cy="148" r="4" fill="var(--ink)" />
      <circle cx="130" cy="148" r="4" fill="var(--ink)" />
      <path d="M 85 180 Q 100 172 115 180" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <line x1="60" y1="115" x2="72" y2="122" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="140" y1="115" x2="128" y2="122" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
    `,
    accent: "var(--accent)",
  },
  sleepy: {
    key: "sleepy",
    label: "Sleepy",
    description: "Permanently napping",
    viewBox: "0 0 200 310",
    path: `
      M 100 120
      L 122 65
      L 142 100
      L 168 118
      L 160 150
      L 175 175
      L 160 200
      L 172 225
      L 175 290
      L 25 290
      L 28 225
      L 40 200
      L 25 175
      L 40 150
      L 32 118
      L 58 100
      L 78 65
      Z
    `,
    eyes: `
      <path d="M 65 155 Q 75 150 85 155" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 115 155 Q 125 150 135 155" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="78" cy="165" r="3" fill="var(--ink)" />
      <circle cx="122" cy="165" r="3" fill="var(--ink)" />
      <text x="145" y="120" fontSize="24" fontFamily="monospace" fontWeight="900" fill="var(--ink)" opacity="0.4">z</text>
      <text x="160" y="100" fontSize="18" fontFamily="monospace" fontWeight="900" fill="var(--ink)" opacity="0.3">z</text>
    `,
    accent: "var(--highlight)",
  },
};

export const PERSONALITY_LIST = Object.values(PERSONALITIES);

export function getPersonality(key: string | undefined | null): Personality {
  if (key && key in PERSONALITIES) {
    return PERSONALITIES[key as PersonalityKey];
  }
  return PERSONALITIES[DEFAULT_PERSONALITY];
}