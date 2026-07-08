import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell, Apple, Home, TrendingUp, User, Play, Square, Timer, Video, Upload,
  Camera, Plus, X, Check, Footprints, Target, Flame, ChevronRight,
  ChevronDown, Send, Clock, ClipboardList, Trash2, CheckCircle2, LogOut, RotateCcw, Menu,
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
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
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
  { key: "accueil", label: "Accueil", icon: Home, n: 1 },
  { key: "seances", label: "Entraînement", icon: Dumbbell, n: 2 },
  { key: "nutrition", label: "Nutrition", icon: Apple, n: 3 },
  { key: "bilans", label: "Bilans", icon: TrendingUp, n: 4 },
  { key: "profil", label: "Profil", icon: User, n: 5 },
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
function CalendrierSeances({ recentSeances }) {
  const now = new Date();
  const annee = now.getFullYear();
  const mois = now.getMonth();
  const premierJour = new Date(annee, mois, 1);
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const decalage = (premierJour.getDay() + 6) % 7;
  const joursAvecSeance = new Set((recentSeances || []).map((s) => new Date(s.date).getDate()));
  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push(null);
  for (let j = 1; j <= nbJours; j++) cases.push(j);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: C.textMuted, textAlign: "center", fontWeight: 700 }}>{l}</div>
      ))}
      {cases.map((j, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 32 }}>
          {j && (
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontFamily: FONT_MONO,
              background: joursAvecSeance.has(j) ? C.blue : "transparent",
              color: joursAvecSeance.has(j) ? "#06171F" : C.textMuted,
              fontWeight: joursAvecSeance.has(j) ? 700 : 400,
            }}>
              {j}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
function EntrainementHome({ user, stats, onStart, fireToast, customProgrammes, isCoach, profilId, onSeanceCreated, weightHistory, recentSeances, setTab, mode = "accueil", meals, objectifsNutrition }) {
  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const poidsEvol7j = useMemo(() => {
    if (!weightHistory || weightHistory.length < 2) return null;
    const last = weightHistory[weightHistory.length - 1].poids;
    const weekAgo = weightHistory.length >= 2 ? weightHistory[Math.max(0, weightHistory.length - 2)].poids : last;
    return +(last - weekAgo).toFixed(1);
  }, [weightHistory]);

  const poidsTrendColor = useMemo(() => {
    if (poidsEvol7j === null || poidsEvol7j === 0) return C.textMuted;
    let seRapproche;
    if (user.poidsObjectif === user.poidsActuel) {
      seRapproche = false; // objectif de maintien : tout mouvement s'en éloigne
    } else {
      seRapproche = user.poidsObjectif < user.poidsActuel ? poidsEvol7j < 0 : poidsEvol7j > 0;
    }
    return seRapproche ? C.green : C.red;
  }, [poidsEvol7j, user.poidsObjectif, user.poidsActuel]);

  const caloriesConsommees = useMemo(() => {
    if (!meals) return 0;
    return Object.values(meals).flat().reduce((a, i) => a + i.kcal, 0);
  }, [meals]);
  const nutritionTotals = useMemo(() => {
    if (!meals) return { kcal: 0, prot: 0, gluc: 0, lip: 0 };
    return Object.values(meals).flat().reduce(
      (a, i) => ({ kcal: a.kcal + i.kcal, prot: a.prot + i.prot, gluc: a.gluc + i.gluc, lip: a.lip + i.lip }),
      { kcal: 0, prot: 0, gluc: 0, lip: 0 }
    );
  }, [meals]);
  const caloriesObjectif = objectifsNutrition?.kcal || 0;
  const caloriesRestantes = Math.round(caloriesObjectif - caloriesConsommees);
  const pctCalories = caloriesObjectif ? Math.min(100, Math.max(0, (caloriesConsommees / caloriesObjectif) * 100)) : 0;
  const bigRingRadius = 40;
  const bigRingCirc = 2 * Math.PI * bigRingRadius;
  const bigRingOffset = bigRingCirc - (pctCalories / 100) * bigRingCirc;
  const macroStatusColor = (val, obj, baseColor) => {
    if (obj && val > obj) return C.red;
    return baseColor;
  };
  const macroBar = (label, val, obj, dotColor) => {
    const sColor = macroStatusColor(val, obj, dotColor);
    return (
      <div key={label}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
            {label}
          </span>
          <span style={{ fontFamily: FONT_MONO, color: sColor, fontWeight: 700 }}>{Math.round(val)}/{obj}g</span>
        </div>
        <ProgressBar value={val} max={obj} color={sColor} height={6} />
      </div>
    );
  };

  const tempsMoyenSeance = useMemo(() => {
    if (!recentSeances || recentSeances.length === 0) return null;
    const total = recentSeances.reduce((sum, s) => sum + (s.duree_secondes || 0), 0);
    return Math.round(total / recentSeances.length / 60);
  }, [recentSeances]);

  const EMOJIS_PROGRES = ["🎉", "💪", "🔥", "🚀", "👏"];
  const seancesCetteSemaine = useMemo(() => {
    if (!recentSeances) return 0;
    const now = new Date();
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - 7);
    return recentSeances.filter((s) => new Date(s.date) >= debutSemaine).length;
  }, [recentSeances]);

  const objectifSeancesSemaine = customProgrammes.length || 0;
  const tousLesProgres = useMemo(() => {
    if (!recentSeances || recentSeances.length === 0) return [];
    const parExercice = {};
    for (const s of recentSeances) {
      for (const sr of s.series || []) {
        if (!parExercice[sr.exercice_nom]) parExercice[sr.exercice_nom] = [];
        parExercice[sr.exercice_nom].push({ poids: sr.poids, reps: sr.reps, date: s.date });
      }
    }
    const progres = [];
    for (const [nom, perfs] of Object.entries(parExercice)) {
      const sorted = [...perfs].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (sorted.length < 2) continue;
      const dernier = sorted[0];
      const avant = sorted[1];
      const poidsAugmente = dernier.poids > avant.poids;
      const repsAugmente = dernier.reps > avant.reps && dernier.poids >= avant.poids;
      if (poidsAugmente || repsAugmente) {
        progres.push({ nom, dernier, avant, poidsAugmente, repsAugmente });
      }
    }
    return progres;
  }, [recentSeances]);

  const exerciceProgres = useMemo(() => {
    if (tousLesProgres.length === 0) return null;
    const choisi = tousLesProgres[Math.floor(Math.random() * tousLesProgres.length)];
    const emoji = EMOJIS_PROGRES[Math.floor(Math.random() * EMOJIS_PROGRES.length)];
    return { ...choisi, emoji };
  }, [tousLesProgres]);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [showProgresDetail, setShowProgresDetail] = useState(false);
  const [showCalendrier, setShowCalendrier] = useState(false);
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
      {mode === "accueil" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, fontWeight: 600 }}>
              Bienvenue,
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, color: C.blue, lineHeight: 1, letterSpacing: 0.5 }}>
              {user.prenom.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginTop: 4, textAlign: "left" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setShowCalendrier(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Séances</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{stats.seancesRealisees}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>réalisées ce mois</div>
              {objectifSeancesSemaine > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: seancesCetteSemaine >= objectifSeancesSemaine ? C.green : seancesCetteSemaine === 0 ? C.red : C.amber, background: seancesCetteSemaine >= objectifSeancesSemaine ? C.greenSoft : seancesCetteSemaine === 0 ? C.redSoft : C.amberSoft, borderRadius: 8, padding: "4px 8px", display: "inline-block" }}>
                  {seancesCetteSemaine}/{objectifSeancesSemaine} cette semaine
                </div>
              )}
            </Card>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setTab("nutrition")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Calories</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>
                {Math.round(caloriesConsommees)} <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>kcal</span>
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                {caloriesObjectif ? `sur ${Math.round(caloriesObjectif)} kcal` : "objectif non défini"}
              </div>
              {caloriesObjectif > 0 && <ProgressBar value={caloriesConsommees} max={caloriesObjectif} color={C.blue} height={6} />}
            </Card>
          </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Clock size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Temps moyen</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{tempsMoyenSeance !== null ? `${tempsMoyenSeance} min` : "—"}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>par séance</div>
            </Card>
            <Card style={{ padding: 14, cursor: exerciceProgres ? "pointer" : "default" }} onClick={() => exerciceProgres && setShowProgresDetail(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Dumbbell size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Progrès</span>
              </div>
              {exerciceProgres ? (
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.text, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exerciceProgres.emoji} {exerciceProgres.nom}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>nouveau progrès</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.textMuted, fontWeight: 700 }}>—</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>continue comme ça</div>
                </div>
              )}
            </Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setTab("bilans")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <TrendingUp size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Poids</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.text, fontWeight: 700, lineHeight: 1 }}>
                    {user.poidsActuel} <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>kg</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>Il y a 1 sem.</div>
                </div>
                {poidsEvol7j !== null && poidsEvol7j !== 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: poidsTrendColor,
                    background: poidsTrendColor === C.green ? C.greenSoft : C.redSoft,
                    borderRadius: 8, padding: "3px 7px",
                    display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
                  }}>
                    {poidsEvol7j < 0 ? "↓" : "↑"} {Math.abs(poidsEvol7j)} kg
                  </div>
                )}
              </div>
              {weightHistory && weightHistory.length >= 2 ? (
                <div style={{ height: 40 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="homeWgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.blue} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone" dataKey="poids" stroke={C.blue} strokeWidth={2} fill="url(#homeWgrad)"
                        isAnimationActive={false}
                        dot={(props) => {
                          const { cx, cy, index } = props;
                          if (index !== weightHistory.length - 1) return <React.Fragment key={`d-${index}`} />;
                          return <circle key="lastdot" cx={cx} cy={cy} r={3.5} fill={C.blue} stroke={C.card} strokeWidth={2} />;
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 40, display: "flex", alignItems: "center", fontSize: 10, color: C.textDim }}>Pas encore assez de données</div>
              )}
            </Card>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setTab("seances")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Dumbbell size={14} color={C.blue} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Prochaine séance</span>
              </div>
              {customProgrammes && customProgrammes.length > 0 ? (
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.text, letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {customProgrammes[0].nom}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{customProgrammes[0].muscle}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onStart(customProgrammes[0]); }}
                    style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, fontWeight: 800, fontSize: 11.5 }}
                  >
                    <Play size={11} fill="#06171F" /> Démarrer
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.textMuted }}>Aucune séance assignée</div>
              )}
            </Card>
          </div>
          <Card style={{ cursor: "pointer" }} onClick={() => setTab("nutrition")}>
            <SectionLabel icon={Apple}>Nutrition du jour</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke={C.cardBorderLight} strokeWidth="9" />
                  <circle
                    cx="48" cy="48" r="40" fill="none" stroke={C.blue} strokeWidth="9"
                    strokeDasharray={bigRingCirc} strokeDashoffset={bigRingOffset}
                    strokeLinecap="round" transform="rotate(-90 48 48)"
                    style={{ transition: "stroke-dashoffset .4s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: C.text, fontWeight: 700, lineHeight: 1 }}>
                    {caloriesObjectif ? caloriesRestantes : "—"}
                  </div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>restantes</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {macroBar("Protéines", nutritionTotals.prot, objectifsNutrition?.prot || 0, C.blue)}
                {macroBar("Glucides", nutritionTotals.gluc, objectifsNutrition?.gluc || 0, C.green)}
                {macroBar("Lipides", nutritionTotals.lip, objectifsNutrition?.lip || 0, C.amber)}
              </div>
            </div>
          </Card>
        </div>
      )}
      {mode === "seances" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ marginTop: 4 }}>
            <SectionLabel icon={Dumbbell}>Mes séances</SectionLabel>
            {isCoach && (
              <button onClick={() => setShowSeanceForm(true)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                <Plus size={16} /> Créer une séance
              </button>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {customProgrammes.length === 0 ? (
                <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Ton coach ne t'a pas encore assigné de séance</div></Card>
              ) : customProgrammes.map((p) => (
                <Card key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.text, letterSpacing: 0.5 }}>{p.nom}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{p.muscle}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{p.exercices.length} exercices · {p.duree}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => onStart(p)} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13 }}>
                      <Play size={14} fill="#06171F" /> Démarrer
                    </button>
                    {isCoach && (
                      <button onClick={() => { setEditingProgramme(p); setShowSeanceForm(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {showSeanceForm && (
            <SeanceForm
              clientId={profilId}
              coachId={profilId}
              editingProgramme={editingProgramme}
              onClose={() => { setShowSeanceForm(false); setEditingProgramme(null); }}
              onCreated={onSeanceCreated}
              fireToast={fireToast}
            />
          )}
        </div>
      )}
      {showProgresDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowProgresDetail(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={Dumbbell}>Tes progrès récents</SectionLabel>
            {tousLesProgres.length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun progrès détecté récemment</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tousLesProgres.map((p, i) => (
                  <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.text, marginBottom: 4 }}>{p.nom}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                      {p.poidsAugmente && p.repsAugmente ? "Progrès en poids et répétitions" : p.poidsAugmente ? "Progrès en poids" : "Progrès en répétitions"}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1, background: C.card, borderRadius: 8, padding: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>Avant</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.text }}>{p.avant.poids}kg × {p.avant.reps}</div>
                      </div>
                      <div style={{ flex: 1, background: C.blueSoft, border: `1px solid ${C.blue}`, borderRadius: 8, padding: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: C.blue, marginBottom: 2 }}>Maintenant</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.text, fontWeight: 700 }}>{p.dernier.poids}kg × {p.dernier.reps}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowProgresDetail(false)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 16 }}>Fermer</button>
          </Card>
        </div>
      )}
      {showCalendrier && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowCalendrier(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={Flame}>Séances du mois</SectionLabel>
            <CalendrierSeances recentSeances={recentSeances} />
            <button onClick={() => setShowCalendrier(false)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 16 }}>Fermer</button>
          </Card>
        </div>
      )}
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

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error("Erreur son:", err);
  }
}
function SessionView({ programme, history, setHistory, onFinish, onCancel, fireToast, onSessionComplete }) {
  const [seconds, setSeconds] = useState(0);
  const startTimeKey = `session_start_${programme.id || programme.nom}`;
  const [logs, setLogs] = useState(() =>
    Object.fromEntries(programme.exercices.map((e) => [e.id, { sets: [], video: null }]))
  );
  const [rest, setRest] = useState(null); // { total, left }
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let start = localStorage.getItem(startTimeKey);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(startTimeKey, start);
    }
    const startTime = parseInt(start);
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    if (rest.left <= 0) { playBeep(); setRest(null); return; }
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
          border: `1px solid ${C.blueBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Timer size={20} color={C.blue} style={{ animation: "pulseGlow 1.6s infinite" }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 34, color: C.text, fontWeight: 700, letterSpacing: 1 }}>
            {fmtTime(seconds)}
          </div>
        <button onClick={() => { localStorage.removeItem(startTimeKey); onCancel(); }} style={{ background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 999, padding: "8px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <RotateCcw size={13} /> Réinitialiser
        </button>
        </div>
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
          setFinished(true);
          localStorage.removeItem(startTimeKey);
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

function Nutrition({ meals, onAdd, onRemove, objectifs, profilId, fireToast, saveObjectifsNutrition }) {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const totals = useMemo(() => {
    const all = Object.values(meals).flat();
    return all.reduce(
      (a, i) => ({ kcal: a.kcal + i.kcal, prot: a.prot + i.prot, gluc: a.gluc + i.gluc, lip: a.lip + i.lip }),
      { kcal: 0, prot: 0, gluc: 0, lip: 0 }
    );
  }, [meals]);

  const macroStatusColor = (val, obj, baseColor) => {
    if (obj && val > obj) return C.red;
    return baseColor;
  };
  const macro = (label, val, obj, dotColor) => {
    const sColor = macroStatusColor(val, obj, dotColor);
    return (
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
            {label}
          </span>
          <span style={{ fontFamily: FONT_MONO, color: sColor, fontWeight: 700 }}>{Math.round(val)}/{obj}g</span>
        </div>
        <ProgressBar value={val} max={obj} color={sColor} height={6} />
      </div>
    );
  };

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
          <div onClick={() => setShowGoalEditor(true)} style={{ fontSize: 14, color: C.textMuted, paddingBottom: 4, cursor: "pointer", textDecoration: "underline dashed" }}>/ {Math.round(objectifs.kcal)} kcal</div>
        </div>
        <ProgressBar value={totals.kcal} max={objectifs.kcal} color={C.blue} height={9} />
      </Card>

      <Card>
        <SectionLabel icon={ClipboardList}>Macronutriments</SectionLabel>
        <div style={{ display: "flex", gap: 14 }}>
          {macro("Protéines", totals.prot, Math.round((objectifs.kcal * objectifs.pctProt / 100) / 4), C.blue)}
          {macro("Glucides", totals.gluc, Math.round((objectifs.kcal * objectifs.pctGluc / 100) / 4), C.green)}
          {macro("Lipides", totals.lip, Math.round((objectifs.kcal * objectifs.pctLip / 100) / 9), C.amber)}
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
      {showGoalEditor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowGoalEditor(false)}>
          <Card style={{ width: "100%", maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={Flame}>Objectif calorique</SectionLabel>
            <input type="number" defaultValue={objectifs.kcal} id="goalKcalInput" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 16, fontFamily: FONT_MONO, marginBottom: 16 }} />
            <SectionLabel icon={ClipboardList}>Répartition des macros (%)</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Potéines (%)</div>
                <input type="number" defaultValue={objectifs.pctProt} id="goalProtInput" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Glucides (%)</div>
                <input type="number" defaultValue={objectifs.pctGluc} id="goalGlucInput" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Lipides (%)</div>
                <input type="number" defaultValue={objectifs.pctLip} id="goalLipInput" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
            </div>
            <button onClick={() => {
              const kcal = parseInt(document.getElementById("goalKcalInput").value) || objectifs.kcal;
              const pctProt = parseInt(document.getElementById("goalProtInput").value) || objectifs.pctProt;
              const pctGluc = parseInt(document.getElementById("goalGlucInput").value) || objectifs.pctGluc;
              const pctLip = parseInt(document.getElementById("goalLipInput").value) || objectifs.pctLip;
              saveObjectifsNutrition({ kcal, pctProt, pctGluc, pctLip });
              setShowGoalEditor(false);
            }} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>Enregistrer</button>
          </Card>
        </div>
      )}
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

function DailyCheckinModal({ onSubmit }) {
  const [fatigue, setFatigue] = useState(3);
  const [sommeil, setSommeil] = useState(3);
  const [energie, setEnergie] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await onSubmit({ fatigue, sommeil, energie });
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, background: "rgba(5,6,9,0.6)",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <SectionLabel icon={ClipboardList}>Check-in du jour</SectionLabel>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 18 }}>
          Réponds en quelques secondes avant de continuer.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <CheckinSlider label="Fatigue" value={fatigue} onChange={setFatigue} emojis={["😴", "😪", "🙂", "💪", "🔥"]} />
          <CheckinSlider label="Qualité du sommeil" value={sommeil} onChange={setSommeil} emojis={["😵", "😕", "🙂", "😌", "😍"]} />
          <CheckinSlider label="Niveau d'énergie" value={energie} onChange={setEnergie} emojis={["🪫", "😐", "🙂", "⚡", "🚀"]} />
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            width: "100%", marginTop: 22, background: C.blue, border: "none",
            color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800,
            fontSize: 14, opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Enregistrement..." : "Valider"}
        </button>
      </Card>
    </div>
  );
}

function Bilans({ weightHistory, addWeightEntry, photos, setPhotos, checkins, addCheckin }) {
  const [newWeight, setNewWeight] = useState("");
  const emptyForm = {
    sensationForce: 3,
    exerciceProbleme: "",
    ecartsNutrition: 0,
    descriptionEcarts: "",
    heuresSommeil: "",
    satisfaction: 3,
    satisfactionRaison: "",
    centPourcent: null,
    pourquoiPasCent: "",
    estimationPourcentage: "",
    motivation: 3,
    commentaire: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const submitWeight = () => {
    const w = parseFloat(newWeight);
    if (!w) return;
    addWeightEntry(w);
    setNewWeight("");
  };

  const submitCheckin = () => {
    if (form.centPourcent === null) {
      setFormError("Réponds à la question \"As-tu été à 100% cette semaine ?\" avant d'envoyer.");
      return;
    }
    if (!form.pourquoiPasCent.trim()) {
      setFormError("Explique pourquoi avant d'envoyer le bilan.");
      return;
    }
    if (!form.satisfactionRaison.trim()) {
      setFormError("Explique ta satisfaction de la semaine avant d'envoyer le bilan.");
      return;
    }
    setFormError("");
    addCheckin({ ...form, date: new Date().toLocaleDateString("fr-FR") });
    setForm(emptyForm);
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CheckinSlider label="Sensation de force" value={form.sensationForce} onChange={(v) => setForm({ ...form, sensationForce: v })} emojis={["🪫", "😓", "🙂", "💪", "🔥"]} />

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Un exercice t'a posé problème ?</div>
            <input type="text" value={form.exerciceProbleme} onChange={(e) => setForm({ ...form, exerciceProbleme: e.target.value })} placeholder="ex : douleur épaule sur développé couché" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13 }} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Écarts nutritionnels cette semaine</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["0", "1", "2", "3+"].map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setForm({ ...form, ecartsNutrition: idx })}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${form.ecartsNutrition === idx ? C.blue : C.cardBorderLight}`,
                    background: form.ecartsNutrition === idx ? C.blueSoft : C.surface,
                    color: form.ecartsNutrition === idx ? C.blue : C.textMuted,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.ecartsNutrition > 0 && (
            <div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Qu'as-tu mangé en dehors du plan ?</div>
              <textarea rows={2} value={form.descriptionEcarts} onChange={(e) => setForm({ ...form, descriptionEcarts: e.target.value })} placeholder="ex : fast food samedi soir" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none" }} />
            </div>
          )}

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Heures de sommeil moyennes / nuit</div>
            <input type="number" step="0.5" min="0" max="14" value={form.heuresSommeil} onChange={(e) => setForm({ ...form, heuresSommeil: e.target.value })} placeholder="ex : 7.5" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
          </div>

          <CheckinSlider label="Satisfaction de la semaine" value={form.satisfaction} onChange={(v) => setForm({ ...form, satisfaction: v })} emojis={["😞", "😕", "🙂", "😄", "🤩"]} />
          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Pourquoi es-tu (ou pas) satisfait(e) de ta semaine ?</div>
            <textarea rows={2} value={form.satisfactionRaison} onChange={(e) => setForm({ ...form, satisfactionRaison: e.target.value })} placeholder="explique en quelques mots..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none" }} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>As-tu été à 100% cette semaine (entraînement / alimentation / sommeil) ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillButton active={form.centPourcent === true} onClick={() => setForm({ ...form, centPourcent: true })} style={{ flex: 1, textAlign: "center" }}>Oui</PillButton>
              <PillButton active={form.centPourcent === false} onClick={() => setForm({ ...form, centPourcent: false })} style={{ flex: 1, textAlign: "center" }}>Non</PillButton>
            </div>
          </div>

          {form.centPourcent !== null && (
            <div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Pourquoi ?</div>
              <input type="text" value={form.pourquoiPasCent} onChange={(e) => setForm({ ...form, pourquoiPasCent: e.target.value })} placeholder={form.centPourcent ? "ex : tout a été respecté à la lettre" : "ex : voyage professionnel, manque de temps..."} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13 }} />
            </div>
          )}

          {form.centPourcent === false && (
            <div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>À combien tu t'estimes ? (%)</div>
              <input type="number" min="0" max="100" value={form.estimationPourcentage} onChange={(e) => setForm({ ...form, estimationPourcentage: e.target.value })} placeholder="ex : 70" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
            </div>
          )}

          <CheckinSlider label="Motivation" value={form.motivation} onChange={(v) => setForm({ ...form, motivation: v })} emojis={["🥱", "😐", "🙂", "😃", "🚀"]} />

          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Commentaire libre pour ton coach</div>
            <textarea rows={3} value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} placeholder="Comment s'est passée ta semaine ?" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none" }} />
          </div>

          {formError && (
            <div style={{ fontSize: 12.5, color: C.red, background: C.redSoft, borderRadius: 10, padding: "8px 12px" }}>
              {formError}
            </div>
          )}

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
                <span style={{ color: C.text, fontWeight: 700 }}>{c.date}</span> — force {c.sensationForce}/5, satisfaction {c.satisfaction}/5, sommeil {c.heuresSommeil || "—"}h, écarts {c.ecartsNutrition > 0 ? `${c.ecartsNutrition === 3 ? "3+" : c.ecartsNutrition}` : "0"}
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

function SideMenu({ viewMode, setViewMode, onLogout, showViewToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: C.surface, border: `1px solid ${C.cardBorderLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Menu size={19} color={C.text} />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex" }}>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(5,6,9,0.55)" }}
          />
          <div
            style={{
              position: "relative", width: 260, maxWidth: "80%", height: "100%",
              background: C.card, borderRight: `1px solid ${C.cardBorderLight}`,
              padding: "24px 18px", display: "flex", flexDirection: "column", gap: 22,
              animation: "slideInLeft .25s ease",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.text, letterSpacing: 0.5 }}>MENU</div>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}>
                <X size={18} />
              </button>
            </div>

            {showViewToggle && (
              <div>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Affichage
                </div>
                <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            )}

            <div style={{ marginTop: "auto" }}>
              <LogoutButton onLogout={onLogout} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ViewModeToggle({ viewMode, setViewMode }) {
  const isClient = viewMode === "client";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={() => setViewMode(isClient ? "coach" : "client")}
        style={{
          position: "relative",
          width: 54, height: 30,
          borderRadius: 999,
          border: `1px solid ${C.cardBorderLight}`,
          background: isClient ? C.blue : C.surface,
          padding: 0,
          transition: "background .25s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: isClient ? 25 : 2,
            width: 24, height: 24,
            borderRadius: "50%",
            background: C.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "left .25s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          }}
        >
          {isClient ? <Dumbbell size={13} color={C.blue} /> : <ClipboardList size={13} color={C.textMuted} />}
        </div>
      </button>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{isClient ? "Vue Client" : "Vue Coach"}</span>
        <span style={{ fontSize: 10, color: C.textDim }}>{isClient ? "Tu vois l'app comme un client" : "Gestion de tes clients"}</span>
      </div>
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

function SeanceForm({ clientId, coachId, editingProgramme, onClose, onCreated, fireToast }) {
  const [selectedForSuperset, setSelectedForSuperset] = useState([]);

  const toggleSelectForSuperset = (idx) => {
    setSelectedForSuperset((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const groupSuperset = () => {
    if (selectedForSuperset.length < 2) {
      fireToast("Sélectionne au moins 2 exercices");
      return;
    }
    const groupNum = Date.now();
    setExercices((prev) =>
      prev.map((ex, i) => (selectedForSuperset.includes(i) ? { ...ex, groupeSuperset: groupNum } : ex))
    );
    setSelectedForSuperset([]);
  };
  const [nom, setNom] = useState(editingProgramme?.nom || "");
  const [muscle, setMuscle] = useState(editingProgramme?.muscle || "");
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDrop = (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    setExercices((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(draggedIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr.map((ex, i) => ({ ...ex, ordre: i }));
    });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };
  const updateExercice = (idx, field, value) => {
    setExercices((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  };
  const [exercices, setExercices] = useState(() => {
    const rawList = editingProgramme?.programme_exercices || editingProgramme?.exercices || [];
    return [...rawList].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((ex) => ({
      id: ex.id,
      nom: ex.nom,
      videoDemoUrl: ex.videoDemoUrl || ex.video_demo_url,
      sets: ex.sets,
      repsParSerie: ex.repsParSerie || (ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : []),
      rest: ex.rest,
      tempo: ex.tempo,
      rpe: ex.rpe,
      note: ex.note,
      groupeSuperset: ex.groupeSuperset || ex.groupe_superset,
      ordre: ex.ordre,
    }));
  });
  const [exNom, setExNom] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exRest, setExRest] = useState(90);
  const [saving, setSaving] = useState(false);
  const [exRepsParSerie, setExRepsParSerie] = useState([10, 10, 10]);

  useEffect(() => {
    setExRepsParSerie((prev) => {
      const arr = [...prev];
      while (arr.length < exSets) arr.push(10);
      while (arr.length > exSets) arr.pop();
      return arr;
    });
  }, [exSets]);
  const [exTempo, setExTempo] = useState("");
  const [exRpe, setExRpe] = useState("");
  const [exNote, setExNote] = useState("");
  const [exVideo, setExVideo] = useState(null);
  const [bibliotheque, setBibliotheque] = useState([]);
  const [showNewExercice, setShowNewExercice] = useState(false);
  const [newExNom, setNewExNom] = useState("");
  const [newExVideoFile, setNewExVideoFile] = useState(null);
  const [selectedExId, setSelectedExId] = useState("");

  useEffect(() => {
    if (!coachId) return;
    supabase.from("exercices_bibliotheque").select("*").eq("coach_id", coachId).order("nom").then(({ data }) => setBibliotheque(data || []));
  }, [coachId]);

  const createExercice = async () => {
    if (!newExNom.trim()) return;
    try {
      let videoUrl = null;
      if (newExVideoFile) {
        const fileName = `${Date.now()}_${newExVideoFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("videos").upload(fileName, newExVideoFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);
        videoUrl = urlData.publicUrl;
      }
      const { data, error } = await supabase
        .from("exercices_bibliotheque")
        .insert({ coach_id: coachId, nom: newExNom, video_demo_url: videoUrl })
        .select()
        .single();
      if (error) throw error;
      setBibliotheque((prev) => [...prev, data]);
      setSelectedExId(data.id);
      setNewExNom("");
      setNewExVideoFile(null);
      setShowNewExercice(false);
      fireToast("Exercice ajouté à la bibliothèque", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur création exercice");
    }
  };

  const addExercice = () => {
    if (!selectedExId) return;
    const ex = bibliotheque.find((b) => b.id === selectedExId);
    if (!ex) return;
    setExercices((prev) => [...prev, { nom: ex.nom, videoDemoUrl: ex.video_demo_url, sets: exSets, repsParSerie: exRepsParSerie, rest: exRest, tempo: exTempo, rpe: exRpe, note: exNote, ordre: prev.length }]);
    setSelectedExId("");
    setExSets(3);
    setExRepsParSerie([10, 10, 10]);
    setExRest(90);
    setExTempo("");
    setExRpe("");
    setExNote("");
  };

  const removeExercice = (idx) => {
    setExercices((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!nom.trim() || exercices.length === 0) {
      fireToast("Ajoute un nom et au moins un exercice");
      return;
    }
    try {
    setSaving(true);
      let progId;
      if (editingProgramme) {
        const { error: updateErr } = await supabase
          .from("programmes")
          .update({ nom, muscle })
          .eq("id", editingProgramme.id);
        if (updateErr) throw updateErr;
        progId = editingProgramme.id;
        await supabase.from("programme_exercices").delete().eq("programme_id", progId);
      } else {
        const { data: prog, error: progErr } = await supabase
          .from("programmes")
          .insert({ profil_id: clientId, nom, muscle })
          .select()
          .single();
        if (progErr) throw progErr;
        progId = prog.id;
      }
      const rows = exercices.map((ex) => ({
        programme_id: progId,
        nom: ex.nom,
        sets: ex.sets,
        reps_par_serie: JSON.stringify(ex.repsParSerie),
        rest: ex.rest,
        tempo: ex.tempo,
        rpe: ex.rpe || null,
        note: ex.note,
        video_demo_url: ex.videoDemoUrl,
        ordre: ex.ordre,
        groupe_superset: ex.groupeSuperset || null,
      }));
      const { error: exErr } = await supabase.from("programme_exercices").insert(rows);
      if (exErr) throw exErr;
      fireToast(editingProgramme ? "Séance modifiée" : "Séance créée", "green");
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      fireToast("Erreur création séance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, overflowY: "auto" }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <SectionLabel icon={Dumbbell}>Nouvelle séance</SectionLabel>
        <input type="text" placeholder="Nom (ex: Push)" value={nom} onChange={(e) => setNom(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 8 }} />
        <input type="text" placeholder="Muscle ciblé (ex: Pecs / Épaules)" value={muscle} onChange={(e) => setMuscle(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 16 }} />
        <SectionLabel icon={Plus}>Exercices</SectionLabel>
        {exercices.map((ex, i) => (
          <div key={i} draggable onDragStart={() => setDraggedIdx(i)} onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }} onDrop={() => handleDrop(i)} onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }} style={{ background: ex.groupeSuperset ? C.blueSoft : C.surface, border: dragOverIdx === i && draggedIdx !== i ? `2px dashed ${C.blue}` : (ex.groupeSuperset ? `1px solid ${C.blue}` : "none"), borderRadius: 10, padding: "8px 10px", marginBottom: 6, opacity: draggedIdx === i ? 0.4 : 1, cursor: "grab" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }} onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
                <input type="checkbox" checked={selectedForSuperset.includes(i)} onChange={(e) => { e.stopPropagation(); toggleSelectForSuperset(i); }} onClick={(e) => e.stopPropagation()} />
                <div style={{ fontSize: 13, color: C.text }}>
                  {ex.groupeSuperset && <span style={{ color: C.blue, fontWeight: 700 }}>[Superset] </span>}
                  {ex.nom} — {ex.sets} séries · {ex.rest}s
                </div>
              </div>            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ChevronDown size={16} color={C.textMuted} style={{ transform: expandedIdx === i ? "rotate(180deg)" : "none" }} />
                <button onClick={() => removeExercice(i)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
              </div>
            </div>
            {expandedIdx === i && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.cardBorderLight}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Séries</div>
                <input type="number" value={ex.sets} onChange={(e) => {
                  const n = parseInt(e.target.value) || 1;
                  const arr = [...(ex.repsParSerie || [])];
                  while (arr.length < n) arr.push(10);
                  while (arr.length > n) arr.pop();
                  updateExercice(i, "sets", n);
                  updateExercice(i, "repsParSerie", arr);
                }} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, marginBottom: 8 }} />
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Répétitions par série</div>
                <div style={{ display: "flex", gap: 6, Wrap: "wrap", marginBottom: 8 }}>
                  {(ex.repsParSerie || []).map((r, si) => (
                    <input key={si} type="number" value={r} onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const arr = [...ex.repsParSerie];
                      arr[si] = val;
                      updateExercice(i, "repsParSerie", arr);
                    }} style={{ width: 44, background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px", color: C.text, fontSize: 12, textAlign: "center" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Repos (s)</div>
                    <input type="number" value={ex.rest} onChange={(e) => updateExercice(i, "rest", parseInt(e.target.value) || 0)} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>RPE</div>
                    <input type="number" value={ex.rpe || ""} onChange={(e) => updateExercice(i, "rpe", e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tempo</div>
                <input type="text" value={ex.tempo || ""} onChange={(e) => updateExercice(i, "tempo", e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, marginBottom: 8 }} />
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Note</div>
                <textarea value={ex.note || ""} onChange={(e) => updateExercice(i, "note", e.target.value)} rows={2} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, resize: "none" }} />
              </div>
            )}
          </div>
        ))}
        {selectedForSuperset.length >= 2 && (       <button onClick={groupSuperset} style={{ width: "100%", background: C.blueSoft, border: `1px solid ${C.blue}`, color: C.blue, borderRadius: 10, padding: "8px", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Grouper en superset ({selectedForSuperset.length} exercices)
          </button>
        )}
        {showNewExercice ? (
          <div style={{ background: C.surface, borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <input type="text" placeholder="Nom du nouvel exercice" value={newExNom} onChange={(e) => setNewExNom(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 6 }} />
            <input type="file" accept="video/*" onChange={(e) => setNewExVideoFile(e.target.files[0])} style={{ width: "100%", marginBottom: 8, fontSize: 12, color: C.textMuted }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowNewExercice(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 8, padding: "8px", fontSize: 12 }}>Annuler</button>
              <button onClick={createExercice} style={{ flex: 1, background: C.blue, border: "none", color: "#06171F", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700 }}>Ajouter</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <select value={selectedExId} onChange={(e) => setSelectedExId(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }}>
              <option value="">Choisir un exercice...</option>
              {bibliotheque.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.nom}</option>
              ))}
            </select>
            <button onClick={() => setShowNewExercice(true)} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 10, padding: "8px 12px", fontSize: 13 }}><Plus size={14} /></button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input type="number" placeholder="Séries" value={exSets} onChange={(e) => setExSets(parseInt(e.target.value) || 3)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
          <input type="number" placeholder="Repos (s)" value={exRest} onChange={(e) => setExRest(parseInt(e.target.value) || 90)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {exRepsParSerie.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>Série {i + 1}</span>
              <input
                type="number"
                value={r}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setExRepsParSerie((prev) => prev.map((x, idx) => (idx === i ? val : x)));
                }}
                style={{ width: 50, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px", color: C.text, fontSize: 13, textAlign: "center" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input type="text" placeholder="Tempo (e: 3-1-1-0)" value={exTempo} onChange={(e) => setExTempo(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
          <input type="number" placeholder="RPE" value={exRpe} onChange={(e) => setExRpe(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
        </div>
        <textarea placeholder="Note spéciale (optionnel)" value={exNote} onChange={(e) => setExNote(e.target.value)} rows={2} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 8, resize: "none" }} />
        <button onClick={addExercice} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 10, padding: "10px", fontSize:13, fontWeight: 700, marginBottom: 16 }}>+ Ajouter exercice</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14 }}>Annuler</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>{saving ? "..." : "Créer"}</button>
        </div>
      </Card>
    </div>
  );
}
function ClientDetailView({ client, onBack, onLogout, fireToast }) {
  const [tab, setTab] = useState("programme");
  const [loading, setLoading] = useState(true);
  const [seances, setSeances] = useState([]);
  const [seriesBySeance, setSeriesBySeance] = useState({});
  const [weightHistory, setWeightHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [repas, setRepas] = useState([]);

  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [customProgrammes, setCustomProgrammes] = useState([]);
  const [checkinsQuotidiens, setCheckinsQuotidiens] = useState([]);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [seancesRes, poidsRes, checkinsRes, repasRes, programmesRes, dailyRes] = await Promise.all([
          supabase.from("seances").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(10),
          supabase.from("poids_historique").select("*").eq("profil_id", client.id).order("date", { ascending: true }),
          supabase.from("bilans_semaine").select("*").eq("profil_id", client.id).order("date", { ascending: false }),
          supabase.from("repas").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(30),
          supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }),
          supabase.from("checkins_quotidiens").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(30),
        ]);
        if (!active) return;

        const seancesData = seancesRes.data || [];
        setSeances(seancesData);
        setWeightHistory((poidsRes.data || []).map((r) => ({ date: formatDateDisplay(r.date), poids: Number(r.poids) })));
        setCheckins(checkinsRes.data || []);
        setRepas(repasRes.data || []);
        setCustomProgrammes(programmesRes.data || []);
        setCheckinsQuotidiens(dailyRes.data || []);

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
    { key: "profil", label: "Profil", icon: User },
  ];

  if (selectedProgramme) {
    const historiqueFiltré = seances.filter((s) => s.programme_id === selectedProgramme.id || s.nom_programme === selectedProgramme.nom);
    return (
      <div style={appShellStyle}>
        <FontImports />
        <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px", position: "relative" }}>
          <button onClick={() => { console.log("CLIC RETOUR DETECTE"); setSelectedProgramme(null); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.text }}>{selectedProgramme.nom}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{selectedProgramme.muscle}</div>
            </div>
            <button onClick={() => { setEditingProgramme(selectedProgramme); setShowSeanceForm(true); }} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>Modifier</button>
          </div>
          <SectionLabel icon={TrendingUp}>Historique des performances</SectionLabel>
          {historiqueFiltré.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Le client n'a pas encore réalisé cette séance</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {historiqueFiltré.map((s) => (
                <Card key={s.id}>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>{formatDateDisplay(s.date)} · {fmtTime(s.duree_secondes || 0)}</div>
                  {(seriesBySeance[s.id] || []).map((sr, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.text, background: C.surface, borderRadius: 8, padding: "6px 10px", marginTop: 4, fontFamily: FONT_MONO }}>
                      {sr.exercice_nom} — {sr.poids}kg × {sr.reps} <span style={{ color: C.amber }}>RPE{sr.rpe}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}
          {showSeanceForm && (
            <SeanceForm
              clientId={client.id}
              coachId={client.coach_id}
              editingProgramme={editingProgramme}
              onClose={() => { setShowSeanceForm(false); setEditingProgramme(null); }}
              onCreated={() => {
                supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }).then(({ data }) => setCustomProgrammes(data || []));
              }}
              fireToast={fireToast}
            />
          )}
        </div>
      </div>
    );
  }
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
            <button onClick={() => { console.log("CLIC DETECTE, showSeanceForm avant:", showSeanceForm); setShowSeanceForm(true); }} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={16} /> Créer une séance
            </button>
            {customProgrammes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SectionLabel icon={Dumbbell}>Séances personnalisées</SectionLabel>
                {customProgrammes.map((p) => (
                  <Card key={p.id} onClick={() => setSelectedProgramme(p)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.text }}>{p.nom}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingProgramme(p); setShowSeanceForm(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                        <button onClick={async (e) => { e.stopPropagation(); if (!confirm("Supprimer cette séance ?")) return; await supabase.from("programmes").delete().eq("id", p.id); setCustomProgrammes((prev) => prev.filter((x) => x.id !== p.id)); }} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{p.muscle}</div>
                  </Card>
                ))}
              </div>
            )}
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
              <SectionLabel icon={Flame}>Fatigue / Sommeil / Énergie</SectionLabel>
              {checkinsQuotidiens.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13 }}>Aucun check-in quotidien pour le moment</div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>
                    Moyenne sur les {checkinsQuotidiens.length} derniers jours renseignés
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Fatigue", key: "fatigue" },
                      { label: "Sommeil", key: "sommeil" },
                      { label: "Énergie", key: "energie" },
                    ].map((m) => {
                      const avg = checkinsQuotidiens.reduce((a, c) => a + (c[m.key] || 0), 0) / checkinsQuotidiens.length;
                      return (
                        <div key={m.key} style={{ background: C.surface, borderRadius: 10, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: C.text, fontWeight: 700 }}>{avg.toFixed(1)}<span style={{ fontSize: 12, color: C.textMuted }}>/5</span></div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
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
                  <span style={{ color: C.text, fontWeight: 700 }}>{c.date}</span> — force {c.sensation_force ?? "—"}/5, satisfaction {c.satisfaction ?? "—"}/5, sommeil {c.heures_sommeil ?? "—"}h, écarts {c.ecarts_nutrition > 0 ? (c.ecarts_nutrition === 3 ? "3+" : c.ecarts_nutrition) : "0"}
                  {c.satisfaction_raison && <div style={{ marginTop: 4, color: C.textDim }}>Satisfaction : {c.satisfaction_raison}</div>}
                  {c.cent_pourcent === false && (
                    <div style={{ marginTop: 4, color: C.amber }}>
                      Pas à 100% ({c.estimation_pourcentage ?? "—"}%){c.pourquoi_pas_cent ? ` — ${c.pourquoi_pas_cent}` : ""}
                    </div>
                  )}
                  {c.douleurs && <div style={{ marginTop: 4, color: C.textDim }}>Exercice à problème : {c.douleurs}</div>}
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
        {tab === "profil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionLabel icon={User}>Informations personnelles</SectionLabel>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Prénom: {client.prenom}</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Nom: {client.nom}</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Âge: {client.age || "-"} ans</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Taille: {client.taille || "-"} cm</div>
              <div style={{ fontSize: 14, color: C.text }}>Poids actuel: {client.poids_actuel || "-"} kg</div>
            </Card>
            <Card>
              <SectionLabel icon={Target}>Objectifs</SectionLabel>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Objectif principal: {client.objectif_principal || "-"}</div>
              <div style={{ fontSize: 14, color: C.text }}>Objectif secondaire: {client.objectif_secondaire || "-"}</div>
            </Card>
          </div>
        )}
      </div>
        {showSeanceForm && (
          <SeanceForm
            clientId={client.id}
            coachId={client.coach_id}
            editingProgramme={editingProgramme}
            onClose={() => { setShowSeanceForm(false); setEditingProgramme(null); }}
            onCreated={() => {
              supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }).then(({ data }) => setCustomProgrammes(data || []));
            }}
            fireToast={fireToast}
          />
        )}
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
        fireToast={fireToast}
      />
    );
  }

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <SideMenu viewMode={viewMode} setViewMode={setViewMode} onLogout={onLogout} showViewToggle={true} />
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Espace coach</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: C.text, letterSpacing: 0.5 }}>MES CLIENTS</div>
          </div>
        </div>

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
  const [tab, setTab] = useState("accueil");
  const [profilId, setProfilId] = useState(profilRow.id);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => profilToUser(profilRow));
  const [stats, setStats] = useState({ seancesRealisees: 0, pasJour: 6420, pasMoyenneSemaine: 8150 });
  const [customProgrammes, setCustomProgrammes] = useState([]);

  useEffect(() => {
    if (!profilId) return;
    supabase
      .from("programmes")
      .select("*, programme_exercices(*)")
      .eq("profil_id", profilId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const formatted = (data || []).map((p) => ({
          id: p.id,
          nom: p.nom,
          muscle: p.muscle,
          duree: "",
          exercices: (p.programme_exercices || [])
            .sort((a, b) => a.ordre - b.ordre)
            .map((ex) => ({
              id: ex.id,
              nom: ex.nom,
              sets: ex.sets,
              rest: ex.rest,
              repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [],
              tempo: ex.tempo,
              rpe: ex.rpe,
              note: ex.note,
              videoDemoUrl: ex.video_demo_url,
            })),
        }));
        setCustomProgrammes(formatted);
      });
  }, [profilId]);
  const [activeProgramme, setActiveProgramme] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [objectifsNutrition, setObjectifsNutrition] = useState(() => ({
    kcal: profilRow.objectif_calories || 2400,
    pctProt: profilRow.pct_prot || 30,
    pctGluc: profilRow.pct_gluc || 45,
    pctLip: profilRow.pct_lip || 25,
    get prot() { return Math.round((this.kcal * this.pctProt / 100) / 4); },
    get gluc() { return Math.round((this.kcal * this.pctGluc / 100) / 4); },
    get lip() { return Math.round((this.kcal * this.pctLip / 100) / 9); },
  }));

  const saveObjectifsNutrition = async (updates) => {
    if (!profilId) return;
    const merged = { ...objectifsNutrition, ...updates };
    setObjectifsNutrition((prev) => ({ ...prev, ...updates }));
    try {
      const { error } = await supabase
        .from("profils")
        .update({
          objectif_calories: merged.kcal,
          pct_prot: merged.pctProt,
          pct_gluc: merged.pctGluc,
          pct_lip: merged.pctLip,
        })
        .eq("id", profilId);
      if (error) throw error;
      fireToast("Objectifs nutritionnels mis à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour objectifs");
    }
  };
  const [weightHistory, setWeightHistory] = useState([]);
  const [recentSeances, setRecentSeances] = useState([]);

  useEffect(() => {
    if (!profilId) return;
    supabase
      .from("seances")
      .select("*, series(*)")
      .eq("profil_id", profilId)
      .order("date", { ascending: false })
      .limit(20)
      .then(({ data }) => setRecentSeances(data || []));
  }, [profilId]);
  const [photos, setPhotos] = useState({ face: null, profil: null, dos: null, bicepsAvant: null, bicepsArriere: null });
  const [checkins, setCheckins] = useState([]);
  const [dailyCheckinDone, setDailyCheckinDone] = useState(null); // null = en cours de vérification
  const profilIdRef = useRef(profilRow.id);

  useEffect(() => {
    if (!profilId) return;
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("checkins_quotidiens")
          .select("id")
          .eq("profil_id", profilId)
          .eq("date", todayIso())
          .maybeSingle();
        if (!active) return;
        if (error) throw error;
        setDailyCheckinDone(!!data);
      } catch (err) {
        console.error("Erreur vérification check-in quotidien:", err);
        if (active) setDailyCheckinDone(true); // en cas d'erreur, on ne bloque pas l'accès à l'app
      }
    })();
    return () => { active = false; };
  }, [profilId]);

  const submitDailyCheckin = async ({ fatigue, sommeil, energie }) => {
    if (!profilId) return;
    try {
      const { error } = await supabase.from("checkins_quotidiens").insert({
        profil_id: profilId,
        date: todayIso(),
        fatigue,
        sommeil,
        energie,
      });
      if (error) throw error;
      setDailyCheckinDone(true);
      fireToast("Merci, bonne séance 💪", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement du check-in");
    }
  };

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
              sensationForce: r.sensation_force,
              exerciceProbleme: r.douleurs || "",
              ecartsNutrition: r.ecarts_nutrition,
              descriptionEcarts: r.description_ecarts || "",
              heuresSommeil: r.heures_sommeil,
              satisfaction: r.satisfaction,
              satisfactionRaison: r.satisfaction_raison || "",
              centPourcent: r.cent_pourcent,
              pourquoiPasCent: r.pourquoi_pas_cent || "",
              estimationPourcentage: r.estimation_pourcentage,
              motivation: r.motivation,
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
        sensation_force: c.sensationForce,
        douleurs: c.exerciceProbleme,
        ecarts_nutrition: c.ecartsNutrition,
        description_ecarts: c.descriptionEcarts,
        heures_sommeil: c.heuresSommeil ? parseFloat(c.heuresSommeil) : null,
        satisfaction: c.satisfaction,
        satisfaction_raison: c.satisfactionRaison,
        cent_pourcent: c.centPourcent,
        pourquoi_pas_cent: c.pourquoiPasCent,
        estimation_pourcentage: c.estimationPourcentage ? parseInt(c.estimationPourcentage) : null,
        motivation: c.motivation,
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
          programme_id: programme.id || null,
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
      <div
        style={{
          width: "100%", maxWidth: 440, display: "flex", flexDirection: "column",
          filter: dailyCheckinDone === false ? "blur(7px)" : "none",
          pointerEvents: dailyCheckinDone === false ? "none" : "auto",
          userSelect: dailyCheckinDone === false ? "none" : "auto",
          transition: "filter .3s ease",
        }}
      >
        <div style={{ width: "100%", padding: "24px 16px 110px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
            <SideMenu viewMode={viewMode} setViewMode={setViewMode} onLogout={onLogout} showViewToggle={!!setViewMode} />
          </div>
          {tab === "accueil" && !activeProgramme && (
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("created_at", { ascending: false }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, videoDemoUrl: ex.video_demo_url })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} meals={meals} objectifsNutrition={objectifsNutrition} />
          )}
          {tab === "seances" && !activeProgramme && (
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("created_at", { ascending: false }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, videoDemoUrl: ex.video_demo_url })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} mode="seances" />
          )}
          {activeProgramme && (
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
          {tab === "nutrition" && <Nutrition meals={meals} onAdd={addFood} onRemove={removeFood} objectifs={objectifsNutrition} profilId={profilId} fireToast={fireToast} saveObjectifsNutrition={saveObjectifsNutrition} />}
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

      {dailyCheckinDone === false && <DailyCheckinModal onSubmit={submitDailyCheckin} />}
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
