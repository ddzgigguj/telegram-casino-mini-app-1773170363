/**
 * MinecraftTextures.tsx
 * Pixel-accurate Minecraft-style 16×16 textures for Mine Slot.
 * Every block and pickaxe has its own hand-crafted palette + pixel grid.
 */

import React from "react";

type Pal = Record<string, string>;

/** Core renderer: maps each char in `rows` to a fill color from `pal`. */
const Px = ({
  rows, pal, size = 48, glow, style
}: {
  rows: string[]; pal: Pal; size?: number;
  glow?: string; style?: React.CSSProperties;
}) => (
  <svg
    width={size} height={size}
    viewBox={`0 0 ${rows[0].length} ${rows.length}`}
    style={{
      imageRendering: "pixelated",
      shapeRendering: "crispEdges",
      filter: glow ? `drop-shadow(0 0 ${Math.max(2, size / 8)}px ${glow})` : undefined,
      ...style,
    }}
  >
    {rows.flatMap((row, y) =>
      [...row].map((c, x) =>
        pal[c] ? (
          <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={pal[c]} />
        ) : null
      )
    )}
  </svg>
);

/* ═══════════════════════════════════════════════════
   BLOCK TEXTURES
═══════════════════════════════════════════════════ */

// ── DIRT (grass top + dirt bottom)
export const DirtBlock = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#6B9E3A" pal={{
    A: "#70C040", B: "#5E9E30", C: "#4E8224", D: "#416B1A",
    E: "#619828", F: "#3A620E",
    a: "#9A7050", b: "#866043", c: "#7A5535", d: "#6B4020",
    e: "#5C3415", f: "#8B5E3C", g: "#A68060",
  }} rows={[
    "AABABCBBDABABBAB",
    "BABABFCABABCABAB",
    "CBFABABCDBABABCD",
    "AABABCAABABCAABC",
    "abcabdcabcabdcab",
    "bcdeabcbcdeabcbc",
    "cabcdeabcabcdeab",
    "dcbcabdcabdcbacd",
    "abcfabcabcfabcab",
    "bcdeabcbcdeabcbc",
    "cdeabcfcdeabcfcd",
    "dcabcdeabcdeabcd",
    "abcdeabcabcdeabc",
    "bcabdcbcbcabdcbc",
    "cdeabcfcdeabcfcd",
    "abcdeabcabcdeabc",
  ]} />
);

// ── STONE
export const StoneBlock = ({ size = 44, cracked = 0 }: { size?: number; cracked?: number }) => (
  <Px size={size} glow="#909090" pal={{
    A: "#B0B0B0", B: "#999999", C: "#808080",
    D: "#C4C4C4", E: "#696969", F: "#5A5A5A",
    k: "#3A3A3A", // crack
  }} rows={[
    "AABABCBBDABABBAB",
    "BAAACBABABCABABB",
    "CABABAABCDABABAC",
    "AABCABABDAABCABA",
    "BCAAABABCBCAAABA",
    "AABABDCBBABABDCB",
    "DCABABAABCDABABA",
    "AABABCBBAABABCBA",
    "BABCBAAABABCBAAB",
    "AABDABABCAAABDAB",
    "CBABABAABCBABABA",
    "AABABCBBAABABCBA",
    "BAAABABCBBAABABC",
    "AABCABABDAABCABA",
    "DCABABAABCDABABA",
    "AABABCBBAABABCBA",
  ]} />
);

// ── ORE (iron ore style: stone + pinkish-orange chunks)
export const OreBlock = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#D88860" pal={{
    A: "#B0B0B0", B: "#989898", C: "#808080", D: "#C4C4C4",
    R: "#D8A880", r: "#C07850", S: "#E8C8A8", s: "#B06838",
    E: "#686868",
  }} rows={[
    "AABABCBBDABABBAB",
    "BARRRCababcababc",
    "CArSrAabcDababac",
    "AArSrAbcababDaba",
    "BCARRRbbababcbca",
    "AAbBbcRRRRabcbba",
    "DCABABRSSRCDABAB",
    "AABABCrSSrABABCB",
    "BABCBARrrRABCBAA",
    "AABD RRRR BAbdAB",
    "CBABR SSS RBABAB",
    "AABARRrrrRRBCBBA",
    "BAArSSSSSrAabABC",
    "AABrSSSSSrBaabab",
    "DCARRrrrRRCdabab",
    "AABABCBBAababCBA",
  ]} />
);

// ── GOLD BLOCK
export const GoldBlock = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#FFD700" pal={{
    A: "#FACD3E", B: "#F5BE17", C: "#E8A810",
    D: "#FDE564", E: "#C88000", F: "#B87000",
    G: "#FFE880",
  }} rows={[
    "AABABCBBGABABCBB",
    "BAAGCBBBBAAGCBBB",
    "CABCCCBBBCABCCBB",
    "EFAABABCEFAABABC",
    "FEFABABCFEFABABC",
    "AABABCBBGABABCBB",
    "BAAGCBBBBAAGCBBB",
    "CABCCCBBBCABCCBB",
    "EFAABABCEFAABABC",
    "FEFABABCFEFABABC",
    "AABABCBBGABABCBB",
    "BAAGCBBBBAAGCBBB",
    "CABCCCBBBCABCCBB",
    "EFAABABCEFAABABC",
    "FEFABABCFEFABABC",
    "AABABCBBGABABCBB",
  ]} />
);

// ── DIAMOND BLOCK
export const DiamondBlock = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#4DD0E1" pal={{
    A: "#6AECD8", B: "#4CC8B8", C: "#38AFA0",
    D: "#2E9088", E: "#94F4E8", F: "#1E7068",
    G: "#B0F8F0",
  }} rows={[
    "AABABCBBGABABCBB",
    "BAAGCBBBBAAGCBBB",
    "CABCGCBBBCABGCBB",
    "EFAABABCEFAABABC",
    "FEFDABABFEFDABAB",
    "AABABCBBGABABCBB",
    "BAGDCBBBGAGDCBBB",
    "CABCGCBBBCABGCBB",
    "FEFAABABFEFAABAB",
    "EFAABABCEFAABABC",
    "AABABCBBGABABCBB",
    "BAAGCBBBBAAGCBBB",
    "CABCGCBBBCABGCBB",
    "EFAABABCEFAABABC",
    "FEFDABABFEFDABAB",
    "AABABCBBGABABCBB",
  ]} />
);

// ── OBSIDIAN
export const ObsidianBlock = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#9933CC" pal={{
    A: "#1A0A2E", B: "#110620", C: "#0D0418",
    D: "#260E42", E: "#321466", F: "#200A38",
    G: "#440B88", H: "#070310",
  }} rows={[
    "AABABCBBAAABACBB",
    "BAACBBBBAAGCBBBB",
    "CABCCCBBBCABCCBB",
    "FDAABABCEFAABABC",
    "DFGABABCDFGABABC",
    "AABABCBBAAABABCB",
    "BAACBBBBBAACBBBB",
    "CABCGCBBBCABGCBB",
    "EFAABABCEFAABABC",
    "FDFABABCFDFABABC",
    "AABABCBBAAABABCB",
    "BAACBBBBBAACBBBB",
    "CABCCCBBBCABCCBB",
    "EFAABABCEFAABABC",
    "FEFABABCFEFABABC",
    "HABABCBBHABABCBB",
  ]} />
);

/* ═══════════════════════════════════════════════════
   PICKAXE TEXTURES
   16×16 diagonal item sprites, Minecraft inventory style
═══════════════════════════════════════════════════ */

/** Generic pickaxe renderer */
const Pickaxe = ({
  pal, rows, size = 44, glow
}: { pal: Pal; rows: string[]; size?: number; glow?: string }) => (
  <Px size={size} glow={glow} pal={pal} rows={rows} />
);

// ── WOODEN PICKAXE
export const WoodenPickaxe = ({ size = 44 }: { size?: number }) => (
  <Pickaxe size={size} glow="#C8A464" pal={{
    k: "#000000", // outline
    H: "#C8A464", // head light
    h: "#B08040", // head mid
    d: "#8B5E2A", // head dark
    S: "#9A6840", // shaft light
    s: "#7A4E28", // shaft mid
    t: "#5A3418", // shaft dark
  }} rows={[
    "................",
    "..kkkk..........",
    ".kHHhdk.........",
    ".kHddhk.........",
    "kkhhhk..........",
    "..kkSk..........",
    "...kSk..........",
    "...ksk..........",
    "....ksk.........",
    "....ktk.........",
    ".....ksk........",
    ".....ksk........",
    "......ksk.......",
    "......ktk.......",
    ".......kk.......",
    "................",
  ]} />
);

// ── STONE PICKAXE
export const StonePickaxe = ({ size = 44 }: { size?: number }) => (
  <Pickaxe size={size} glow="#A0A0A0" pal={{
    k: "#000000",
    L: "#D0D0D0", // head light
    M: "#A8A8A8", // head mid
    D: "#707070", // head dark
    S: "#9A6840", // shaft light (wood)
    s: "#7A4E28", // shaft mid
    t: "#5A3418", // shaft dark
  }} rows={[
    "................",
    "..kkkk..........",
    ".kLLMDk.........",
    ".kLDDMk.........",
    "kkMMMk..........",
    "..kkSk..........",
    "...kSk..........",
    "...ksk..........",
    "....ksk.........",
    "....ksk.........",
    ".....ksk........",
    ".....ksk........",
    "......ksk.......",
    "......ktk.......",
    ".......kk.......",
    "................",
  ]} />
);

// ── GOLDEN PICKAXE
export const GoldenPickaxe = ({ size = 44 }: { size?: number }) => (
  <Pickaxe size={size} glow="#FFD700" pal={{
    k: "#000000",
    L: "#FFE880", // head highlight
    M: "#FFD700", // head mid
    D: "#C89000", // head dark
    X: "#FFB800", // inner
    S: "#9A6840",
    s: "#7A4E28",
    t: "#5A3418",
  }} rows={[
    "................",
    "..kkkk..........",
    ".kLLMDk.........",
    ".kLXDMk.........",
    "kkMMMk..........",
    "..kkSk..........",
    "...kMk..........",
    "...ksk..........",
    "....ksk.........",
    "....ksk.........",
    ".....ksk........",
    ".....ksk........",
    "......ksk.......",
    "......ktk.......",
    ".......kk.......",
    "................",
  ]} />
);

// ── DIAMOND PICKAXE
export const DiamondPickaxe = ({ size = 44 }: { size?: number }) => (
  <Pickaxe size={size} glow="#00FFFF" pal={{
    k: "#000000",
    L: "#B0F8F0", // head highlight
    M: "#4DD0E1", // head mid
    D: "#1890A0", // head dark
    X: "#2AB0C0", // head inner
    W: "#80EEF8", // extra shine
    S: "#9A6840",
    s: "#7A4E28",
    t: "#5A3418",
  }} rows={[
    "................",
    "..kkkk..........",
    ".kLLMDk.........",
    ".kLWXMk.........",
    "kkMMWk..........",
    "..kkSk..........",
    "...kMk..........",
    "...ksk..........",
    "....kXk.........",
    "....ksk.........",
    ".....ksk........",
    ".....ksk........",
    "......ksk.......",
    "......ktk.......",
    ".......kk.......",
    "................",
  ]} />
);

/* ═══════════════════════════════════════════════════
   SPECIAL SYMBOLS
═══════════════════════════════════════════════════ */

// ── TNT
export const TNTItem = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#FF4400" pal={{
    R: "#CC1111", r: "#FF3333", D: "#AA0000",
    W: "#F5F5F5", w: "#DEDEDE", k: "#222222",
    G: "#888888", F: "#555555",
  }} rows={[
    "kkkkkkkkkkkkkkkk",
    "krrrrrrrrrrrrrrk",
    "krRRRRRRRRRRRRrk",
    "krRRRRRRRRRRRRrk",
    "krDDDDDDDDDDDDDk",
    "kwwwwwwwwwwwwwwk",
    "kwWWWWWWWWWWWWwk",
    "kwW kTNTk WWWwk",
    "kwW kkkk  WWWwk",
    "kwWWWWWWWWWWWWwk",
    "kwwwwwwwwwwwwwwk",
    "krDDDDDDDDDDDDDk",
    "krRRRRRRRRRRRRrk",
    "krRRRRRRRRRRRRrk",
    "krrrrrrrrrrrrrrk",
    "kkkkkkkkkkkkkkkk",
  ]} />
);

// ── SPELLBOOK
export const SpellbookItem = ({ size = 44 }: { size?: number }) => (
  <Px size={size} glow="#CC44FF" pal={{
    P: "#5B1A8C", p: "#7B2AAC", Q: "#3D0066",
    G: "#FFD700", g: "#FFA000",
    M: "#FF88FF", m: "#DD44CC",
    S: "#9B3ABC",
  }} rows={[
    "kSSSSSSSSSSSSSSk",
    "kSpppppppppppSk.",
    "kSpQQQQQQQQQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQMMMMMMMQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQMMMMMMMQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQGGGGGGGQpSk.",
    "kSpQMMMMMMMQpSk.",
    "kSpppppppppppSk.",
    "kSSSSSSSSSSSSSSk",
  ]} />
);

/* ═══════════════════════════════════════════════════
   CRACK OVERLAY (pure SVG, drawn on top of blocks)
═══════════════════════════════════════════════════ */
export const CrackOverlay = ({ stage, size = 44 }: { stage: 0|1|2|3; size: number }) => {
  if (stage === 0) return null;
  // 4 progressive crack stages
  const cracks: Record<number, string> = {
    1: "M4,4 L8,12 M8,12 L5,20",
    2: "M4,4 L8,12 L5,20 M14,2 L10,10 M10,10 L15,22",
    3: "M4,4 L8,12 L5,20 M14,2 L10,10 L15,22 M2,18 L10,22 L8,30 M20,6 L24,18",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 32 32"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      <g stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d={cracks[stage]}/>
      </g>
      <g stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" fill="none" strokeLinecap="round">
        {stage >= 2 && <path d="M18,8 L14,16 M6,22 L12,28"/>}
        {stage >= 3 && <path d="M22,14 L28,24 M3,10 L7,18"/>}
      </g>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════
   CONVENIENCE: Block by type index
═══════════════════════════════════════════════════ */
export const BlockByType = ({
  type, size = 44, crackStage = 0, style
}: {
  type: number; size?: number; crackStage?: 0|1|2|3; style?: React.CSSProperties;
}) => {
  const blocks = [DirtBlock, StoneBlock, OreBlock, GoldBlock, DiamondBlock, ObsidianBlock];
  const B = blocks[type] ?? DirtBlock;
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <B size={size} />
      {crackStage > 0 && <CrackOverlay stage={crackStage} size={size} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   CONVENIENCE: Pickaxe by type index
   0=Wooden 1=Stone 2=Golden 3=Diamond
═══════════════════════════════════════════════════ */
export const PickaxeByType = ({ type, size = 44 }: { type: number; size?: number }) => {
  const picks = [WoodenPickaxe, StonePickaxe, GoldenPickaxe, DiamondPickaxe];
  const P = picks[type] ?? WoodenPickaxe;
  return <P size={size} />;
};
