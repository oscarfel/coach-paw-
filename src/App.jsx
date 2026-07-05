import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell, Apple, TrendingUp, User, Play, Square, Timer, Video, Upload,
  Camera, Plus, X, Check, Footprints, Target, Flame, ChevronRight,
  ChevronDown, Send, Clock, ClipboardList, Trash2, CheckCircle2, LogOut,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#0A0C11",
  bgGradA: "#10131B",
  bgGradB: "#080A0E",
  surface: "#12151D",
  card: "#171B25",
  cardBorder: "#252B38",
  cardBorderLight: "#2E3544",
  text: "#F3F5F8",
  textMuted: "#8B93A5",
  textDim: "#5C6577",
  blue: "#63CBFF",
  blueSoft: "rgba(99,203,255,0.14)",
  blueBorder: "rgba(99,203,255,0.35)",
  amber: "#FF8F5C",
  amberSoft: "rgba(255,143,92,0.14)",
  green: "#4ADE9B",
  greenSoft: "rgba(74,222,155,0.14)",
  red: "#FF6B6B",
  redSoft: "rgba(255,107,107,0.14)",
};

const FONT_DISPLAY = "'Bebas Neue', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 0px; height: 0px; }
    input, select, textarea { font-family: ${FONT_BODY}; outline: none; }
    input[type=range] { -webkit-appearance: none; background: transparent; }
    input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: ${C.cardBorderLight}; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -6px; width: 16px; height: 16px; border-radius: 50%; background: ${C.blue}; box-shadow: 0 0 0 4px ${C.blueSoft}; }
    button { font-family: ${FONT_BODY}; cursor: pointer; }
    @keyframes pulseGlow { 0%,100% { opacity:.55; } 50% { opacity:1; } }
    @keyframes slideUp { from { transform: translateY(12px); opacity:0; } to { transform: translateY(0); opacity:1; } }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  SMALL UI PRIMITIVES                                                */
/* ------------------------------------------------------------------ */
const Card = ({ children, style, ...rest }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 20,
      padding: 16,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

const SectionLabel = ({ children, icon: Icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
    {Icon && <Icon size={13} color={C.blue} />}
    <span
      style={{
        fontFamily: FONT_BODY,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: C.textMuted,
      }}
    >
      {children}
    </span>
  </div>
);

const ProgressBar = ({ value, max, color = C.blue, height = 8, bg = C.cardBorder }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100 || 0));
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: bg, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: height,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
};

const PillButton = ({ children, onClick, active, color = C.blue, style, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 14px",
      borderRadius: 999,
      border: `1px solid ${active ? color : C.cardBorderLight}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : C.textMuted,
      fontSize: 13,
      fontWeight: 600,
      opacity: disabled ? 0.4 : 1,
      transition: "all .15s ease",
      ...style,
    }}
  >
    {children}
  </button>
);

function useToast() {
  const [toast, setToast] = useState(null);
  const fire = (msg, tone = "blue") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  };
  const node = toast ? (
    <div
      style={{
        position: "fixed",
        bottom: 96,
        left: "50%",
        transform: "translateX(-50%)",
        background: C.card,
        border: `1px solid ${toast.tone === "green" ? C.green : C.blue}`,
        color: C.text,
        padding: "10px 18px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 60,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        animation: "slideUp .25s ease",
        whiteSpace: "nowrap",
      }}
    >
      <CheckCircle2 size={15} color={toast.tone === "green" ? C.green : C.blue} />
      {toast.msg}
    </div>
  ) : null;
  return [node, fire];
}

const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const DEFAULT_USER = {
  prenom: "Alex", nom: "Martin", age: 29, taille: 178,
  poidsDepart: 84, poidsActuel: 78.4, poidsObjectif: 74,
  objectifPrincipal: "Perte de graisse", objectifSecondaire: "Gain de force",
};

const EMPTY_MEALS = { petitDej: [], dejeuner: [], collation: [], diner: [] };

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDateDisplay = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};

const profilToUser = (p) => ({
  prenom: p.prenom,
  nom: p.nom,
  age: p.age,
  taille: p.taille,
  poidsDepart: p.poids_depart,
  poidsActuel: p.poids_actuel,
  poidsObjectif: p.poids_objectif,
  objectifPrincipal: p.objectif_principal,
  objectifSecondaire: p.objectif_secondaire,
});

const userToProfilUpdate = (user) => ({
  prenom: user.prenom,
  nom: user.nom,
  age: Number(user.age),
  taille: Number(user.taille),
  poids_actuel: Number(user.poidsActuel),
  poids_objectif: Number(user.poidsObjectif),
  objectif_principal: user.objectifPrincipal,
  objectif_secondaire: user.objectifSecondaire,
});

async function fetchProfilByAuthUserId(authUserId) {
  const { data, error } = await supabase
    .from("profils")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadProfilData(pid) {
  const today = todayIso();
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [poidsRes, seancesRes, repasRes, checkinsRes] = await Promise.all([
    supabase.from("poids_historique").select("*").eq("profil_id", pid).order("date", { ascending: true }),
    supabase.from("seances").select("*").eq("profil_id", pid).order("date", { ascending: false }),
    supabase.from("repas").select("*").eq("profil_id", pid).eq("date", today),
    supabase.from("bilans_semaine").select("*").eq("profil_id", pid).order("date", { ascending: true }),
  ]);

  return { poidsRes, seancesRes, repasRes, checkinsRes, monthStartIso };
}

/* ------------------------------------------------------------------ */
/*  DATA (démo)                                                        */
/* ------------------------------------------------------------------ */
const PROGRAMMES = [
  {
    id: "push",
    nom: "Push",
    muscle: "Pecs / Épaules / Triceps",
    duree: "≈ 55 min",
    exercices: [
      { id: "dc", nom: "Développé couché barre", sets: 4, rest: 120 },
      { id: "dm", nom: "Développé militaire haltères", sets: 3, rest: 90 },
      { id: "dips", nom: "Dips lestés", sets: 3, rest: 90 },
      { id: "elat", nom: "Élévations latérales", sets: 3, rest: 60 },
    ],
  },
  {
    id: "pull",
    nom: "Pull",
    muscle: "Dos / Biceps",
    duree: "≈ 50 min",
    exercices: [
      { id: "tract", nom: "Tractions lestées", sets: 4, rest: 120 },
      { id: "rowb", nom: "Rowing barre", sets: 4, rest: 90 },
      { id: "tirv", nom: "Tirage vertical", sets: 3, rest: 75 },
      { id: "curl", nom: "Curl barre EZ", sets: 3, rest: 60 },
    ],
  },
  {
    id: "legs",
    nom: "Legs",
    muscle: "Jambes / Fessiers",
    duree: "≈ 60 min",
    exercices: [
      { id: "squat", nom: "Squat barre basse", sets: 4, rest: 150 },
      { id: "sdt", nom: "Soulevé de terre roumain", sets: 3, rest: 120 },
      { id: "legpress", nom: "Presse à cuisses", sets: 3, rest: 90 },
      { id: "mollet", nom: "Mollets debout", sets: 4, rest: 60 },
    ],
  },
];

const FOOD_DB = [
  { nom: "Blanc de poulet", kcal: 165, prot: 31, gluc: 0, lip: 3.6 },
  { nom: "Riz blanc cuit", kcal: 130, prot: 2.7, gluc: 28, lip: 0.3 },
  { nom: "Flocons d'avoine", kcal: 389, prot: 16.9, gluc: 66, lip: 6.9 },
  { nom: "Œufs entiers", kcal: 155, prot: 13, gluc: 1.1, lip: 11 },
  { nom: "Banane", kcal: 89, prot: 1.1, gluc: 23, lip: 0.3 },
  { nom: "Yaourt grec nature", kcal: 97, prot: 9, gluc: 3.9, lip: 5 },
  { nom: "Amandes", kcal: 579, prot: 21, gluc: 22, lip: 50 },
  { nom: "Pain complet", kcal: 247, prot: 13, gluc: 41, lip: 3.4 },
  { nom: "Huile d'olive", kcal: 884, prot: 0, gluc: 0, lip: 100 },
  { nom: "Saumon", kcal: 208, prot: 20, gluc: 0, lip: 13 },
  { nom: "Pâtes cuites", kcal: 158, prot: 5.8, gluc: 31, lip: 0.9 },
  { nom: "Fromage blanc 0%", kcal: 47, prot: 8, gluc: 4, lip: 0.2 },
];

const MEAL_DEFS = [
  { key: "petitDej", nom: "Petit-déjeuner" },
  { key: "dejeuner", nom: "Déjeuner" },
  { key: "collation", nom: "Collation" },
  { key: "diner", nom: "Dîner" },
];

const PHOTO_CATS = [
  { key: "face", nom: "Face" },
  { key: "profil", nom: "Profil" },
  { key: "dos", nom: "Dos" },
  { key: "bicepsAvant", nom: "Double biceps — avant" },
  { key: "bicepsArriere", nom: "Double biceps — arrière" },
];

/* ------------------------------------------------------------------ */
/*  BOTTOM NAV (transparente, icônes bleu clair)                       */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = [
  { key: "entrainement", label: "Entraînement", icon: Dumbbell, n: 1 },
  { key: "nutrition", label: "Nutrition", icon: Apple, n: 2 },
  { key: "bilans", label: "Bilans", icon: TrendingUp, n: 3 },
  { key: "profil", label: "Profil", icon: User, n: 4 },
];

const BottomNav = ({ active, setActive }) => (
  <div
    style={{
      position: "fixed",
      bottom: 14,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 28px)",
      maxWidth: 440,
      background: "rgba(18,21,29,0.55)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: `1px solid rgba(99,203,255,0.18)`,
      borderRadius: 24,
      padding: "10px 8px",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 50,
      boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
    }}
  >
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = active === item.key;
      return (
        <button
          key={item.key}
          onClick={() => setActive(item.key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            background: isActive ? C.blueSoft : "transparent",
            border: "none",
            borderRadius: 16,
            padding: "7px 14px",
            transition: "all .2s ease",
            position: "relative",
          }}
        >
          <Icon size={20} color={isActive ? C.blue : "rgba(99,203,255,0.55)"} strokeWidth={isActive ? 2.4 : 2} />
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: isActive ? C.blue : "rgba(139,147,165,0.8)",
              letterSpacing: 0.3,
            }}
          >
            {item.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/*  ENTRAINEMENT — LISTE                                               */
/* ------------------------------------------------------------------ */
function EntrainementHome({ user, stats, onStart, fireToast }) {
  const poidsRestant = (user.poidsActuel - user.poidsObjectif).toFixed(1);
  const progressPoids = Math.min(
    100,
    Math.max(
      0,
      ((user.poidsDepart - user.poidsActuel) / (user.poidsDepart - user.poidsObjectif)) * 100
    )
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Bienvenue */}
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
          Bienvenue,
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, color: C.text, lineHeight: 1, letterSpacing: 0.5 }}>
          {user.prenom.toUpperCase()}
        </div>
      </div>

      {/* Objectif de poids */}
      <Card>
        <SectionLabel icon={Target}>Objectif de poids</SectionLabel>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 30, color: C.text, fontWeight: 700 }}>
              {user.poidsActuel} <span style={{ fontSize: 15, color: C.textMuted }}>kg</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Poids actuel</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.amber, fontWeight: 700 }}>
              {user.poidsObjectif} kg
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {poidsRestant > 0 ? `${poidsRestant} kg restants` : "Objectif atteint 🎉"}
            </div>
          </div>
        </div>
        <ProgressBar value={progressPoids} max={100} color={C.amber} />
      </Card>

      {/* Stats rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Flame size={14} color={C.blue} />
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Séances
            </span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>
            {stats.seancesRealisees}
          </div>
          <div style={{ fontSize: 11, color: C.textDim }}>réalisées ce mois</div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Footprints size={14} color={C.blue} />
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Pas du jour
            </span>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>
            {stats.pasJour.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 11, color: C.textDim }}>moy. semaine {stats.pasMoyenneSemaine.toLocaleString("fr-FR")}</div>
        </Card>
      </div>

      {/* Programmes */}
      <div style={{ marginTop: 4 }}>
        <SectionLabel icon={Dumbbell}>Mes séances</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PROGRAMMES.map((p) => (
            <Card key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.text, letterSpacing: 0.5 }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{p.muscle}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                  {p.exercices.length} exercices · {p.duree}
                </div>
              </div>
              <button
                onClick={() => onStart(p)}
                style={{
                  background: C.blue,
                  border: "none",
                  color: "#06171F",
                  borderRadius: 999,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Play size={14} fill="#06171F" /> Démarrer
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ENTRAINEMENT — SESSION EN COURS                                    */
/* ------------------------------------------------------------------ */
function ExerciceCard({ ex, history, log, onValidate, onVideo }) {
  const [open, setOpen] = useState(false);
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("");
  const [tempo, setTempo] = useState("");
  const [rpe, setRpe] = useState("8");
  const fileRef = useRef(null);
  const hasVideo = !!log.video;
  const last = history[ex.nom];

  const submit = () => {
    if (!poids || !reps) return;
    onValidate(ex, { poids: parseFloat(poids), reps: parseInt(reps), tempo, rpe });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ex.nom}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {log.sets.length}/{ex.sets} séries
            {last && (
              <span style={{ color: C.blue }}> · dernière fois {last.poids}kg × {last.reps}</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          color={C.textMuted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {last && (
            <div
              style={{
                background: C.blueSoft,
                border: `1px solid ${C.blueBorder}`,
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 12,
                color: C.blue,
              }}
            >
              📌 Rappel : {last.poids} kg × {last.reps} reps le {last.date}
            </div>
          )}

          {log.sets.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {log.sets.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11.5,
                    color: C.text,
                    background: C.surface,
                    border: `1px solid ${C.cardBorderLight}`,
                    borderRadius: 8,
                    padding: "5px 9px",
                    fontFamily: FONT_MONO,
                  }}
                >
                  {s.poids}kg×{s.reps} <span style={{ color: C.amber }}>RPE{s.rpe}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>CHARGE (KG)</div>
              <input
                type="number"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder={last ? String(last.poids) : "0"}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 10,
                  padding: "9px 10px",
                  color: C.text,
                  fontSize: 15,
                  fontFamily: FONT_MONO,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>RÉPÉTITIONS</div>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={last ? String(last.reps) : "0"}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 10,
                  padding: "9px 10px",
                  color: C.text,
                  fontSize: 15,
                  fontFamily: FONT_MONO,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>TEMPO</div>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="ex : 3-1-1-0"
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 10,
                  padding: "9px 10px",
                  color: C.text,
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>RPE</div>
              <select
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 10,
                  padding: "9px 10px",
                  color: C.text,
                  fontSize: 13,
                }}
              >
                {["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: hasVideo ? C.greenSoft : C.surface,
                border: `1px solid ${hasVideo ? C.green : C.cardBorderLight}`,
                color: hasVideo ? C.green : C.textMuted,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Video size={14} /> {hasVideo ? "Vidéo ajoutée" : "Vidéo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) onVideo(ex, URL.createObjectURL(f));
              }}
            />
            <button
              onClick={submit}
              style={{
                flex: 1,
                background: C.blue,
                border: "none",
                color: "#06171F",
                borderRadius: 10,
                padding: "10px 12px",
                fontWeight: 800,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Check size={15} /> Valider la série
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SessionView({ programme, history, setHistory, onFinish, onCancel, fireToast, onSessionComplete }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [logs, setLogs] = useState(() =>
    Object.fromEntries(programme.exercices.map((e) => [e.id, { sets: [], video: null }]))
  );
  const [rest, setRest] = useState(null); // { total, left }
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!rest) return;
    if (rest.left <= 0) { setRest(null); return; }
    const id = setInterval(() => setRest((r) => (r ? { ...r, left: r.left - 1 } : r)), 1000);
    return () => clearInterval(id);
  }, [rest]);

  const totalSets = Object.values(logs).reduce((a, l) => a + l.sets.length, 0);

  const validateSet = (ex, set) => {
    setLogs((prev) => ({
      ...prev,
      [ex.id]: { ...prev[ex.id], sets: [...prev[ex.id].sets, set] },
    }));
    setHistory((prev) => ({
      ...prev,
      [ex.nom]: { poids: set.poids, reps: set.reps, date: "aujourd'hui" },
    }));
    setRest({ total: ex.rest, left: ex.rest });
  };

  const attachVideo = (ex, url) => {
    setLogs((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], video: url } }));
    fireToast("Vidéo attachée à " + ex.nom);
  };

  if (finished) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={30} color={C.green} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: C.text }}>SÉANCE ENVOYÉE À TON COACH</div>
        <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 260 }}>
          {totalSets} séries loggées en {fmtTime(seconds)}. Ton coach va pouvoir analyser tes vidéos et ajuster ton programme.
        </div>
        <button
          onClick={onFinish}
          style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "12px 24px", fontWeight: 800 }}
        >
          Retour à mes séances
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: rest ? 70 : 0 }}>
      <button onClick={onCancel} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
      </button>

      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: C.text, letterSpacing: 0.5 }}>{programme.nom}</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{programme.muscle} · {totalSets} séries validées</div>
      </div>

      {/* Chrono */}
      <Card
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `radial-gradient(circle at 30% 20%, ${C.blueSoft}, ${C.card} 70%)`,
          border: `1px solid ${running ? C.blueBorder : C.cardBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Timer size={20} color={C.blue} style={running ? { animation: "pulseGlow 1.6s infinite" } : {}} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 34, color: C.text, fontWeight: 700, letterSpacing: 1 }}>
            {fmtTime(seconds)}
          </div>
        </div>
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "10px 18px", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Play size={15} fill="#06171F" /> {seconds === 0 ? "Démarrer" : "Reprendre"}
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 999, padding: "10px 18px", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Square size={14} fill={C.text} /> Pause
          </button>
        )}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {programme.exercices.map((ex) => (
          <ExerciceCard
            key={ex.id}
            ex={ex}
            history={history}
            log={logs[ex.id]}
            onValidate={validateSet}
            onVideo={attachVideo}
          />
        ))}
      </div>

      <button
        onClick={() => {
          setRunning(false);
          setFinished(true);
          onSessionComplete?.({ programme, logs, seconds });
        }}
        disabled={totalSets === 0}
        style={{
          background: totalSets === 0 ? C.surface : C.text,
          color: totalSets === 0 ? C.textDim : "#0A0C11",
          border: `1px solid ${C.cardBorderLight}`,
          borderRadius: 16,
          padding: "14px",
          fontWeight: 800,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Send size={16} /> Terminer et envoyer au coach
      </button>

      {rest && (
        <div
          style={{
            position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
            width: "calc(100% - 28px)", maxWidth: 440,
            background: C.card, border: `1px solid ${C.amber}`, borderRadius: 16,
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, zIndex: 55,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <Clock size={18} color={C.amber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Repos</div>
            <ProgressBar value={rest.total - rest.left} max={rest.total} color={C.amber} height={5} />
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.amber, fontWeight: 700, minWidth: 42, textAlign: "right" }}>
            {rest.left}s
          </div>
          <button onClick={() => setRest(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NUTRITION                                                          */
/* ------------------------------------------------------------------ */
function MealCard({ meal, items, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [food, setFood] = useState(FOOD_DB[0].nom);
  const [grams, setGrams] = useState("");

  const totalKcal = items.reduce((a, i) => a + i.kcal, 0);

  const add = () => {
    const f = FOOD_DB.find((x) => x.nom === food);
    const g = parseFloat(grams);
    if (!f || !g) return;
    const ratio = g / 100;
    onAdd(meal.key, {
      id: Date.now(),
      nom: f.nom,
      grams: g,
      kcal: Math.round(f.kcal * ratio),
      prot: +(f.prot * ratio).toFixed(1),
      gluc: +(f.gluc * ratio).toFixed(1),
      lip: +(f.lip * ratio).toFixed(1),
    });
    setGrams("");
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "transparent", border: "none", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{meal.nom}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{items.length} aliment(s) · {totalKcal} kcal</div>
        </div>
        <ChevronDown size={18} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px" }}>
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{it.nom} <span style={{ color: C.textMuted, fontWeight: 400 }}>· {it.grams}g</span></div>
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_MONO }}>{it.kcal} kcal · P{it.prot} G{it.gluc} L{it.lip}</div>
              </div>
              <button onClick={() => onRemove(meal.key, it.id)} style={{ background: "transparent", border: "none", color: C.red }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <select value={food} onChange={(e) => setFood(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 12.5 }}>
              {FOOD_DB.map((f) => <option key={f.nom} value={f.nom}>{f.nom}</option>)}
            </select>
            <input type="number" placeholder="g" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ width: 64, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
            <button onClick={add} style={{ background: C.blue, border: "none", borderRadius: 10, padding: "0 12px", color: "#06171F" }}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Nutrition({ meals, onAdd, onRemove, objectifs }) {
  const totals = useMemo(() => {
    const all = Object.values(meals).flat();
    return all.reduce(
      (a, i) => ({ kcal: a.kcal + i.kcal, prot: a.prot + i.prot, gluc: a.gluc + i.gluc, lip: a.lip + i.lip }),
      { kcal: 0, prot: 0, gluc: 0, lip: 0 }
    );
  }, [meals]);

  const macro = (label, val, obj, color) => (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: C.textMuted, fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, color: C.text }}>{Math.round(val)}/{obj}g</span>
      </div>
      <ProgressBar value={val} max={obj} color={color} height={6} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Aujourd'hui</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: C.text, letterSpacing: 0.5 }}>NUTRITION</div>
      </div>

      <Card style={{ background: `radial-gradient(circle at 80% 0%, ${C.blueSoft}, ${C.card} 60%)` }}>
        <SectionLabel icon={Flame}>Calories</SectionLabel>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 32, color: C.text, fontWeight: 700 }}>{Math.round(totals.kcal)}</div>
          <div style={{ fontSize: 14, color: C.textMuted, paddingBottom: 4 }}>/ {objectifs.kcal} kcal</div>
        </div>
        <ProgressBar value={totals.kcal} max={objectifs.kcal} color={C.blue} height={9} />
      </Card>

      <Card>
        <SectionLabel icon={ClipboardList}>Macronutriments</SectionLabel>
        <div style={{ display: "flex", gap: 14 }}>
          {macro("Protéines", totals.prot, objectifs.prot, C.blue)}
          {macro("Glucides", totals.gluc, objectifs.gluc, C.amber)}
          {macro("Lipides", totals.lip, objectifs.lip, C.green)}
        </div>
      </Card>

      <div>
        <SectionLabel icon={Apple}>Repas</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MEAL_DEFS.map((m) => (
            <MealCard key={m.key} meal={m} items={meals[m.key]} onAdd={onAdd} onRemove={onRemove} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BILANS                                                             */
/* ------------------------------------------------------------------ */
function PhotoTile({ cat, url, onChange }) {
  const ref = useRef(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={() => ref.current && ref.current.click()}
        style={{
          width: "100%", aspectRatio: "3/4", borderRadius: 14,
          border: `1.5px dashed ${url ? C.blue : C.cardBorderLight}`,
          background: url ? `url(${url}) center/cover` : C.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        {!url && <Camera size={22} color={C.textDim} />}
        {url && (
          <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(10,12,17,0.7)", borderRadius: "50%", padding: 5 }}>
            <Check size={12} color={C.green} />
          </div>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) onChange(cat.key, URL.createObjectURL(f)); }} />
      <div style={{ fontSize: 10.5, color: C.textMuted, textAlign: "center", fontWeight: 600 }}>{cat.nom}</div>
    </div>
  );
}

function CheckinSlider({ label, value, onChange, emojis }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 16 }}>{emojis[value - 1]}</span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

function Bilans({ weightHistory, addWeightEntry, photos, setPhotos, checkins, addCheckin }) {
  const [newWeight, setNewWeight] = useState("");
  const [form, setForm] = useState({ fatigue: 3, sommeil: 3, nutrition: 3, motivation: 3, douleurs: "", commentaire: "" });

  const submitWeight = () => {
    const w = parseFloat(newWeight);
    if (!w) return;
    addWeightEntry(w);
    setNewWeight("");
  };

  const submitCheckin = () => {
    addCheckin({ ...form, date: new Date().toLocaleDateString("fr-FR") });
    setForm({ fatigue: 3, sommeil: 3, nutrition: 3, motivation: 3, douleurs: "", commentaire: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Suivi</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: C.text, letterSpacing: 0.5 }}>BILANS</div>
      </div>

      {/* Courbe de poids */}
      <Card>
        <SectionLabel icon={TrendingUp}>Évolution du poids</SectionLabel>
        <div style={{ height: 140, marginBottom: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightHistory} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.cardBorder} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5C6577" }} axisLine={false} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#5C6577" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.textMuted }} />
              <Area type="monotone" dataKey="poids" stroke={C.blue} strokeWidth={2.5} fill="url(#wgrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" step="0.1" placeholder="Poids de la semaine (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
          <button onClick={submitWeight} style={{ background: C.blue, border: "none", borderRadius: 10, padding: "0 16px", color: "#06171F", fontWeight: 800 }}>
            Ajouter
          </button>
        </div>
      </Card>

      {/* Photos */}
      <Card>
        <SectionLabel icon={Camera}>Bilan photo</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {PHOTO_CATS.map((c) => (
            <PhotoTile key={c.key} cat={c} url={photos[c.key]} onChange={(k, u) => setPhotos((p) => ({ ...p, [k]: u }))} />
          ))}
        </div>
      </Card>

      {/* Check-in hebdo */}
      <Card>
        <SectionLabel icon={ClipboardList}>Bilan de semaine</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CheckinSlider label="Niveau de fatigue" value={form.fatigue} onChange={(v) => setForm({ ...form, fatigue: v })} emojis={["😴", "😪", "🙂", "💪", "🔥"]} />
          <CheckinSlider label="Qualité du sommeil" value={form.sommeil} onChange={(v) => setForm({ ...form, sommeil: v })} emojis={["😵", "😕", "🙂", "😌", "😍"]} />
          <CheckinSlider label="Respect de la nutrition" value={form.nutrition} onChange={(v) => setForm({ ...form, nutrition: v })} emojis={["❌", "😬", "🙂", "✅", "💯"]} />
          <CheckinSlider label="Motivation" value={form.motivation} onChange={(v) => setForm({ ...form, motivation: v })} emojis={["🥱", "😐", "🙂", "😃", "🚀"]} />

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Douleurs / gênes musculaires</div>
            <input type="text" value={form.douleurs} onChange={(e) => setForm({ ...form, douleurs: e.target.value })} placeholder="ex : légère gêne épaule droite" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13 }} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Commentaire libre pour ton coach</div>
            <textarea rows={3} value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} placeholder="Comment s'est passée ta semaine ?" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none" }} />
          </div>

          <button onClick={submitCheckin} style={{ background: C.text, border: "none", color: "#0A0C11", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Send size={15} /> Envoyer le bilan de semaine
          </button>
        </div>
      </Card>

      {checkins.length > 0 && (
        <Card>
          <SectionLabel icon={ClipboardList}>Historique des bilans</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {checkins.slice().reverse().map((c, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, fontSize: 12, color: C.textMuted }}>
                <span style={{ color: C.text, fontWeight: 700 }}>{c.date}</span> — fatigue {c.fatigue}/5, sommeil {c.sommeil}/5, nutrition {c.nutrition}/5
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PROFIL                                                             */
/* ------------------------------------------------------------------ */
const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`,
  borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14,
};

function Profil({ user, setUser, fireToast, onSave }) {
  const set = (k) => (e) => setUser({ ...user, [k]: e.target.value });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={26} color={C.blue} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.text, letterSpacing: 0.5 }}>{user.prenom} {user.nom}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{user.age} ans · {user.taille} cm</div>
        </div>
      </div>

      <Card>
        <SectionLabel icon={User}>Informations personnelles</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Prénom"><input style={inputStyle} value={user.prenom} onChange={set("prenom")} /></Field>
            <Field label="Nom"><input style={inputStyle} value={user.nom} onChange={set("nom")} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Âge"><input type="number" style={inputStyle} value={user.age} onChange={set("age")} /></Field>
            <Field label="Poids (kg)"><input type="number" style={inputStyle} value={user.poidsActuel} onChange={set("poidsActuel")} /></Field>
            <Field label="Taille (cm)"><input type="number" style={inputStyle} value={user.taille} onChange={set("taille")} /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel icon={Target}>Objectifs</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Objectif principal">
            <select style={inputStyle} value={user.objectifPrincipal} onChange={set("objectifPrincipal")}>
              {["Perte de graisse", "Prise de masse", "Recomposition corporelle", "Performance / force", "Remise en forme"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Objectif secondaire">
            <select style={inputStyle} value={user.objectifSecondaire} onChange={set("objectifSecondaire")}>
              {["Gain de force", "Amélioration cardio", "Souplesse / mobilité", "Santé générale", "Préparation compétition"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Poids objectif (kg)">
            <input type="number" style={inputStyle} value={user.poidsObjectif} onChange={set("poidsObjectif")} />
          </Field>
        </div>
      </Card>

      <button onClick={onSave} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14 }}>
        Enregistrer les modifications
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AUTH & COACH                                                       */
/* ------------------------------------------------------------------ */
const appShellStyle = {
  minHeight: "100vh",
  width: "100%",
  background: `radial-gradient(circle at 15% 0%, ${C.bgGradA}, ${C.bg} 55%), ${C.bg}`,
  fontFamily: FONT_BODY,
  color: C.text,
  display: "flex",
  justifyContent: "center",
};

const loadingScreenStyle = {
  minHeight: "100vh",
  background: C.bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: C.textMuted,
  fontFamily: FONT_BODY,
};

function LogoutButton({ onLogout }) {
  return (
    <button
      onClick={onLogout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: C.surface,
        border: `1px solid ${C.cardBorderLight}`,
        color: C.textMuted,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <LogOut size={15} /> Déconnexion
    </button>
  );
}

function ViewModeToggle({ viewMode, setViewMode }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <PillButton active={viewMode === "coach"} onClick={() => setViewMode("coach")} style={{ flex: 1, textAlign: "center" }}>
        Vue Coach
      </PillButton>
      <PillButton active={viewMode === "client"} onClick={() => setViewMode("client")} style={{ flex: 1, textAlign: "center" }}>
        Vue Client
      </PillButton>
    </div>
  );
}

function LoginScreen({ fireToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) fireToast(error.message);
  };

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "48px 16px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 42, color: C.text, letterSpacing: 0.5, marginBottom: 8 }}>
          COACH APP
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 28 }}>Connecte-toi pour continuer</div>
        <Card>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Email</div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Mot de passe</div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function AddClientForm({ coachProfilId, onClose, onCreated, fireToast }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (signUpErr) throw signUpErr;
      const authUserId = signUpData.user?.id;
      if (!authUserId) throw new Error("Compte non créé");

      const { error: profilErr } = await supabase.from("profils").insert({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        auth_user_id: authUserId,
        role: "client",
        coach_id: coachProfilId,
        age: 25,
        taille: 170,
        poids_depart: 80,
        poids_actuel: 80,
        poids_objectif: 75,
        objectif_principal: "Remise en forme",
        objectif_secondaire: "Santé générale",
      });
      if (profilErr) throw profilErr;

      fireToast("Client ajouté avec succès", "green");
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      fireToast(err.message || "Erreur création client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionLabel icon={Plus}>Nouveau client</SectionLabel>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Prénom"><input style={inputStyle} required value={form.prenom} onChange={set("prenom")} /></Field>
          <Field label="Nom"><input style={inputStyle} required value={form.nom} onChange={set("nom")} /></Field>
        </div>
        <Field label="Email"><input type="email" style={inputStyle} required value={form.email} onChange={set("email")} /></Field>
        <Field label="Mot de passe"><input type="password" style={inputStyle} required minLength={6} value={form.password} onChange={set("password")} /></Field>
        <button type="submit" disabled={submitting} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Création..." : "Créer le client"}
        </button>
      </form>
    </Card>
  );
}

function ClientDetailView({ client, onBack, onLogout }) {
  const [tab, setTab] = useState("programme");
  const [loading, setLoading] = useState(true);
  const [seances, setSeances] = useState([]);
  const [seriesBySeance, setSeriesBySeance] = useState({});
  const [weightHistory, setWeightHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [repas, setRepas] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [seancesRes, poidsRes, checkinsRes, repasRes] = await Promise.all([
          supabase.from("seances").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(10),
          supabase.from("poids_historique").select("*").eq("profil_id", client.id).order("date", { ascending: true }),
          supabase.from("bilans_semaine").select("*").eq("profil_id", client.id).order("date", { ascending: false }),
          supabase.from("repas").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(30),
        ]);
        if (!active) return;

        const seancesData = seancesRes.data || [];
        setSeances(seancesData);
        setWeightHistory((poidsRes.data || []).map((r) => ({ date: formatDateDisplay(r.date), poids: Number(r.poids) })));
        setCheckins(checkinsRes.data || []);
        setRepas(repasRes.data || []);

        if (seancesData.length > 0) {
          const ids = seancesData.map((s) => s.id);
          const { data: seriesData } = await supabase.from("series").select("*").in("seance_id", ids);
          if (!active) return;
          const grouped = {};
          for (const row of seriesData || []) {
            if (!grouped[row.seance_id]) grouped[row.seance_id] = [];
            grouped[row.seance_id].push(row);
          }
          setSeriesBySeance(grouped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [client.id]);

  const detailTabs = [
    { key: "programme", label: "Programme", icon: Dumbbell },
    { key: "bilans", label: "Bilans", icon: TrendingUp },
    { key: "nutrition", label: "Nutrition", icon: Apple },
  ];

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
          </button>
          <LogoutButton onLogout={onLogout} />
        </div>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: C.text, letterSpacing: 0.5, marginBottom: 4 }}>
          {client.prenom} {client.nom}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{client.objectif_principal}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {detailTabs.map((t) => {
            const Icon = t.icon;
            return (
              <PillButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Icon size={14} /> {t.label}
              </PillButton>
            );
          })}
        </div>

        {loading ? (
          <div style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : tab === "programme" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {seances.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucune séance enregistrée</div></Card>
            ) : seances.map((s) => (
              <Card key={s.id}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.text }}>{s.nom_programme}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                  {formatDateDisplay(s.date)} · {fmtTime(s.duree_secondes || 0)}
                </div>
                {(seriesBySeance[s.id] || []).map((sr, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.text, background: C.surface, borderRadius: 8, padding: "6px 10px", marginTop: 4, fontFamily: FONT_MONO }}>
                    {sr.exercice_nom} — {sr.poids}kg × {sr.reps} <span style={{ color: C.amber }}>RPE{sr.rpe}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        ) : tab === "bilans" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionLabel icon={TrendingUp}>Évolution du poids</SectionLabel>
              {weightHistory.length > 0 ? (
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistory} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="coachWgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.blue} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.cardBorder} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5C6577" }} axisLine={false} tickLine={false} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#5C6577" }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, fontSize: 12 }} />
                      <Area type="monotone" dataKey="poids" stroke={C.blue} strokeWidth={2.5} fill="url(#coachWgrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ color: C.textMuted, fontSize: 13 }}>Aucune donnée de poids</div>
              )}
            </Card>
            <Card>
              <SectionLabel icon={ClipboardList}>Bilans de semaine</SectionLabel>
              {checkins.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13 }}>Aucun bilan envoyé</div>
              ) : checkins.map((c, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>{c.date}</span> — fatigue {c.fatigue}/5, sommeil {c.sommeil}/5, nutrition {c.nutrition}/5
                  {c.commentaire && <div style={{ marginTop: 4, color: C.textDim }}>{c.commentaire}</div>}
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {repas.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucun repas enregistré</div></Card>
            ) : repas.map((r) => (
              <Card key={r.id} style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.aliment}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {r.type_repas} · {formatDateDisplay(r.date)} · {r.grammes}g · {r.kcal} kcal
                </div>
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_MONO, marginTop: 4 }}>
                  P{r.prot} G{r.gluc} L{r.lip}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachDashboard({ coachProfil, onLogout, fireToast, viewMode, setViewMode }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profils")
        .select("*")
        .eq("coach_id", coachProfil.id)
        .eq("role", "client")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [coachProfil.id]);

  if (selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Espace coach</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: C.text, letterSpacing: 0.5 }}>MES CLIENTS</div>
          </div>
          <LogoutButton onLogout={onLogout} />
        </div>

        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

        <button
          onClick={() => setShowAddForm(true)}
          style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, marginTop: 16 }}
        >
          <Plus size={18} /> Ajouter un client
        </button>

        {showAddForm && (
          <AddClientForm
            coachProfilId={coachProfil.id}
            onClose={() => setShowAddForm(false)}
            onCreated={loadClients}
            fireToast={fireToast}
          />
        )}

        {loading ? (
          <div style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : clients.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun client pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clients.map((c) => (
              <Card
                key={c.id}
                onClick={() => setSelectedClient(c)}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.text, letterSpacing: 0.5 }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.objectif_principal}</div>
                </div>
                <ChevronRight size={18} color={C.textMuted} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CLIENT APP                                                         */
/* ------------------------------------------------------------------ */
function ClientApp({ profilRow, onLogout, fireToast, viewMode, setViewMode }) {
  const [tab, setTab] = useState("entrainement");
  const [profilId, setProfilId] = useState(profilRow.id);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => profilToUser(profilRow));
  const [stats, setStats] = useState({ seancesRealisees: 0, pasJour: 6420, pasMoyenneSemaine: 8150 });
  const [activeProgramme, setActiveProgramme] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const objectifsNutrition = { kcal: 2400, prot: 180, gluc: 250, lip: 70 };
  const [weightHistory, setWeightHistory] = useState([]);
  const [photos, setPhotos] = useState({ face: null, profil: null, dos: null, bicepsAvant: null, bicepsArriere: null });
  const [checkins, setCheckins] = useState([]);
  const profilIdRef = useRef(profilRow.id);

  useEffect(() => {
    profilIdRef.current = profilId;
  }, [profilId]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const pid = profilRow.id;
        setProfilId(pid);
        setUser(profilToUser(profilRow));

        const { poidsRes, seancesRes, repasRes, checkinsRes, monthStartIso } = await loadProfilData(pid);
        if (!active) return;

        if (poidsRes.data) {
          setWeightHistory(
            poidsRes.data.map((r) => ({ date: formatDateDisplay(r.date), poids: Number(r.poids) }))
          );
        }

        if (checkinsRes.data) {
          setCheckins(
            checkinsRes.data.map((r) => ({
              date: r.date,
              fatigue: r.fatigue,
              sommeil: r.sommeil,
              nutrition: r.nutrition,
              motivation: r.motivation,
              douleurs: r.douleurs || "",
              commentaire: r.commentaire || "",
            }))
          );
        }

        if (repasRes.data) {
          const grouped = { petitDej: [], dejeuner: [], collation: [], diner: [] };
          for (const r of repasRes.data) {
            if (grouped[r.type_repas]) {
              grouped[r.type_repas].push({
                id: r.id,
                nom: r.aliment,
                grams: Number(r.grammes),
                kcal: Number(r.kcal),
                prot: Number(r.prot),
                gluc: Number(r.gluc),
                lip: Number(r.lip),
              });
            }
          }
          setMeals(grouped);
        }

        const seances = seancesRes.data || [];
        setStats((s) => ({
          ...s,
          seancesRealisees: seances.filter((sc) => sc.date >= monthStartIso).length,
        }));

        if (seances.length > 0) {
          const seanceIds = seances.map((s) => s.id);
          const dateBySeance = Object.fromEntries(seances.map((s) => [s.id, s.date]));
          const { data: seriesData } = await supabase.from("series").select("*").in("seance_id", seanceIds);

          if (!active) return;

          if (seriesData) {
            const history = {};
            for (const row of seriesData) {
              const exNom = row.exercice_nom;
              const seanceDate = dateBySeance[row.seance_id];
              const existing = history[exNom];
              if (!existing || seanceDate > existing._seanceDate) {
                history[exNom] = {
                  poids: Number(row.poids),
                  reps: Number(row.reps),
                  date: formatDateDisplay(seanceDate),
                  _seanceDate: seanceDate,
                };
              }
            }
            const clean = {};
            for (const [k, v] of Object.entries(history)) {
              clean[k] = { poids: v.poids, reps: v.reps, date: v.date };
            }
            setExerciseHistory(clean);
          }
        }
      } catch (err) {
        console.error("Erreur chargement Supabase:", err);
        fireToast("Erreur de chargement des données");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [profilRow.id]);

  const addWeightEntry = async (w) => {
    const id = profilId ?? profilIdRef.current;
    if (!id) {
      console.warn("addWeightEntry bloqué : profilId non défini");
      fireToast("Profil non chargé, réessayez");
      return;
    }
    const today = todayIso();
    const displayDate = formatDateDisplay(today);
    try {
      const { error: weightErr } = await supabase.from("poids_historique").insert({
        profil_id: id,
        poids: w,
        date: today,
      });
      if (weightErr) throw weightErr;

      const { error: profilErr } = await supabase
        .from("profils")
        .update({ poids_actuel: w })
        .eq("id", id);
      if (profilErr) throw profilErr;

      setWeightHistory((h) => [...h, { date: displayDate, poids: w }]);
      setUser((u) => ({ ...u, poidsActuel: w }));
      fireToast("Poids enregistré", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement poids");
    }
  };

  const addCheckin = async (c) => {
    if (!profilId) return;
    try {
      const { error } = await supabase.from("bilans_semaine").insert({
        profil_id: profilId,
        fatigue: c.fatigue,
        sommeil: c.sommeil,
        nutrition: c.nutrition,
        motivation: c.motivation,
        douleurs: c.douleurs,
        commentaire: c.commentaire,
        date: c.date,
      });
      if (error) throw error;
      setCheckins((prev) => [...prev, c]);
      fireToast("Bilan de semaine envoyé", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi bilan");
    }
  };

  const addFood = async (mealKey, item) => {
    if (!profilId) return;
    try {
      const { data, error } = await supabase
        .from("repas")
        .insert({
          profil_id: profilId,
          type_repas: mealKey,
          aliment: item.nom,
          grammes: item.grams,
          kcal: item.kcal,
          prot: item.prot,
          gluc: item.gluc,
          lip: item.lip,
          date: todayIso(),
        })
        .select("*")
        .single();
      if (error) throw error;
      setMeals((prev) => ({
        ...prev,
        [mealKey]: [...prev[mealKey], { ...item, id: data.id }],
      }));
    } catch (err) {
      console.error(err);
      fireToast("Erreur ajout aliment");
    }
  };

  const removeFood = async (mealKey, id) => {
    try {
      const { error } = await supabase.from("repas").delete().eq("id", id);
      if (error) throw error;
      setMeals((prev) => ({
        ...prev,
        [mealKey]: prev[mealKey].filter((i) => i.id !== id),
      }));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression aliment");
    }
  };

  const saveProfile = async () => {
    if (!profilId) return;
    try {
      const { error } = await supabase
        .from("profils")
        .update(userToProfilUpdate(user))
        .eq("id", profilId);
      if (error) throw error;
      fireToast("Profil mis à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement profil");
    }
  };

  const saveSession = async ({ programme, logs, seconds }) => {
    if (!profilId) return;
    try {
      const { data: seance, error: seanceErr } = await supabase
        .from("seances")
        .insert({
          profil_id: profilId,
          nom_programme: programme.nom,
          duree_secondes: seconds,
          date: todayIso(),
        })
        .select("*")
        .single();
      if (seanceErr) throw seanceErr;

      const rows = [];
      for (const ex of programme.exercices) {
        const log = logs[ex.id];
        if (!log) continue;
        for (const set of log.sets) {
          rows.push({
            seance_id: seance.id,
            exercice_nom: ex.nom,
            poids: set.poids,
            reps: set.reps,
            rpe: String(set.rpe),
            tempo: set.tempo || "",
            video_url: log.video || null,
          });
        }
      }
      if (rows.length) {
        const { error: seriesErr } = await supabase.from("series").insert(rows);
        if (seriesErr) throw seriesErr;
      }

      setStats((s) => ({ ...s, seancesRealisees: s.seancesRealisees + 1 }));
      const displayDate = formatDateDisplay(todayIso());
      setExerciseHistory((prev) => {
        const next = { ...prev };
        for (const ex of programme.exercices) {
          const log = logs[ex.id];
          if (log?.sets.length) {
            const last = log.sets[log.sets.length - 1];
            next[ex.nom] = { poids: last.poids, reps: last.reps, date: displayDate };
          }
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi séance");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.textMuted,
          fontFamily: FONT_BODY,
        }}
      >
        Chargement...
      </div>
    );
  }

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 110px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          {setViewMode && <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <LogoutButton onLogout={onLogout} />
          </div>
        </div>
        {tab === "entrainement" && !activeProgramme && (
          <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} />
        )}
        {tab === "entrainement" && activeProgramme && (
          <SessionView
            programme={activeProgramme}
            history={exerciseHistory}
            setHistory={setExerciseHistory}
            onFinish={() => { setActiveProgramme(null); fireToast("Séance envoyée au coach ✅", "green"); }}
            onCancel={() => setActiveProgramme(null)}
            fireToast={fireToast}
            onSessionComplete={saveSession}
          />
        )}
        {tab === "nutrition" && <Nutrition meals={meals} onAdd={addFood} onRemove={removeFood} objectifs={objectifsNutrition} />}
        {tab === "bilans" && (
          <Bilans
            weightHistory={weightHistory}
            addWeightEntry={addWeightEntry}
            photos={photos}
            setPhotos={setPhotos}
            checkins={checkins}
            addCheckin={addCheckin}
          />
        )}
        {tab === "profil" && <Profil user={user} setUser={setUser} fireToast={fireToast} onSave={saveProfile} />}
      </div>

      {!activeProgramme && <BottomNav active={tab} setActive={setTab} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP ROOT                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [myProfil, setMyProfil] = useState(null);
  const [profilLoading, setProfilLoading] = useState(false);
  const [viewMode, setViewMode] = useState("coach");
  const [toastNode, fireToast] = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!session?.user?.id) {
      setMyProfil(null);
      setProfilLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setProfilLoading(true);
      try {
        const profil = await fetchProfilByAuthUserId(session.user.id);
        if (active) setMyProfil(profil);
      } catch (err) {
        console.error(err);
        fireToast("Erreur chargement profil");
      } finally {
        if (active) setProfilLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authChecked, session?.user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMyProfil(null);
    setSession(null);
  };

  if (!authChecked) {
    return (
      <div style={loadingScreenStyle}>
        <FontImports />
        Chargement...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginScreen fireToast={fireToast} />
        {toastNode}
      </>
    );
  }

  if (profilLoading) {
    return (
      <div style={loadingScreenStyle}>
        <FontImports />
        Chargement...
      </div>
    );
  }

  if (!myProfil) {
    return (
      <div style={appShellStyle}>
        <FontImports />
        <div style={{ width: "100%", maxWidth: 440, padding: "48px 16px", textAlign: "center" }}>
          <Card>
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 8 }}>Profil introuvable</div>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
              Aucun profil lié à ce compte. Contacte ton coach ou l'administrateur.
            </div>
            <LogoutButton onLogout={handleLogout} />
          </Card>
        </div>
        {toastNode}
      </div>
    );
  }

  if (myProfil.role === "coach") {
    return (
      <>
        {viewMode === "coach" ? (
          <CoachDashboard
            coachProfil={myProfil}
            onLogout={handleLogout}
            fireToast={fireToast}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        ) : (
          <ClientApp
            profilRow={myProfil}
            onLogout={handleLogout}
            fireToast={fireToast}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
        {toastNode}
      </>
    );
  }

  return (
    <>
      <ClientApp profilRow={myProfil} onLogout={handleLogout} fireToast={fireToast} />
      {toastNode}
    </>
  );
}
