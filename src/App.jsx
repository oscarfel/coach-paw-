import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell, Apple, Home, TrendingUp, TrendingDown, User, Play, Square, Timer, Video, Upload,
  Camera, Plus, X, Check, Footprints, Target, Flame, ChevronRight,
  ChevronDown, Send, Clock, ClipboardList, Trash2, CheckCircle2, LogOut, RotateCcw, Menu, Droplet, Award,
  Search, LayoutDashboard, Folder, AlertCircle, Calendar, Wrench, Video as VideoIcon, Bell, Zap, FileText, Download,
  ShoppingCart, Pill, ScanLine, MoreVertical,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#EAF2FE",
  bgGradA: "#EAF2FE",
  bgGradB: "#EAF2FE",
  surface: "#3E7DEB",
  card: "#3E7DEB",
  cardBorder: "rgba(0,178,255,0.6)",
  cardBorderLight: "rgba(0,200,255,0.85)",
  text: "#FFFFFF",
  textOnBg: "#132345",
  textOnBgMuted: "#5F7391",
  textMuted: "#DCE9FA",
  textDim: "#E4ECFB",
  blue: "#1E56C9",
  blueSoft: "rgba(30,86,201,0.18)",
  blueBorder: "rgba(30,86,201,0.5)",
  amber: "#F0AE4D",
  amberSoft: "rgba(240,174,77,0.18)",
  green: "#3AD6A0",
  greenSoft: "rgba(58,214,160,0.16)",
  red: "#FF5D6C",
  redSoft: "rgba(255,93,108,0.16)",
};

const FONT_DISPLAY = "'Inter', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
    html, body {
      touch-action: pan-x pan-y;
      overscroll-behavior: none;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      height: 100%;
      overflow-x: hidden;
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      min-width: 0;
      touch-action: manipulation;
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      user-select: none !important;
    }
    input, textarea {
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }
    ::-webkit-scrollbar { width: 0px; height: 0px; }
    input, select, textarea { font-family: ${FONT_BODY}; outline: none; }
    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-color: ${C.surface};
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235E7A85'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 30px !important;
    }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] { -moz-appearance: textfield; }
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
const Card = React.forwardRef(({ children, style, ...rest }, ref) => (
  <div
    ref={ref}
    style={{
      background: C.card,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 20,
      padding: 16,
      boxShadow: "0 0 0 1.5px rgba(0,178,255,0.4), 0 0 26px rgba(0,178,255,0.5), 0 0 10px rgba(0,200,255,0.6), 0 4px 24px rgba(30,86,201,0.2)",
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
));

const SectionLabel = ({ children, icon: Icon, onBg }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
    {Icon && <Icon size={13} color={C.blue} />}
    <span
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: onBg ? C.textOnBgMuted : C.textMuted,
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

const PillButton = ({ children, onClick, active, color = C.blue, style, disabled, onBg }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "8px 14px",
      borderRadius: 999,
      border: `2px solid ${active ? "#00B2FF" : C.cardBorderLight}`,
      background: active ? "#1E56C9" : "transparent",
      color: active ? "#FFFFFF" : (onBg ? C.textOnBgMuted : C.textMuted),
      fontSize: 13,
      fontWeight: 700,
      opacity: disabled ? 0.4 : 1,
      transition: "all .15s ease",
      boxShadow: active ? "0 0 12px rgba(0,178,255,0.7)" : "none",
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

// Formate le temps écoulé depuis la première séance d'un client, pour son badge de suivi
// Formate une date de connexion en temps relatif ("à l'instant", "il y a 2h", "il y a 3 j")
function formatDerniereConnexion(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures}h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} j`;
  const semaines = Math.floor(jours / 7);
  if (semaines < 5) return `il y a ${semaines} sem.`;
  return `il y a ${Math.floor(jours / 30)} mois`;
}

function formatDureeSuivi(dateDebutIso) {
  const jours = Math.floor((new Date(todayIso()) - new Date(dateDebutIso)) / 86400000);
  if (jours < 1) return "Jour 1";
  if (jours < 14) return `${jours} j`;
  if (jours < 60) return `${Math.floor(jours / 7)} sem.`;
  if (jours < 365) return `${Math.floor(jours / 30)} mois`;
  return `${Math.floor(jours / 365)} an${jours >= 730 ? "s" : ""}`;
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
  photoUrl: p.photo_url || null,
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

const VAPID_PUBLIC_KEY = "BDi0UWSmYcnYCJOGerkBTVhTIi7SKCtlwVtrvUNK1dJ0tdntd7aeer_d5FjkDmmwrrRJ8pXxMWeLkZuRT_8GBAE";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush(profilId, fireToast) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      fireToast("Les notifications push ne sont pas supportées sur cet appareil/navigateur");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      fireToast("Notifications refusées");
      return false;
    }
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const subJson = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      { profil_id: profilId, endpoint: subJson.endpoint, keys_p256dh: subJson.keys.p256dh, keys_auth: subJson.keys.auth },
      { onConflict: "profil_id,endpoint" }
    );
    if (error) throw error;
    fireToast("Notifications activées", "green");
    return true;
  } catch (err) {
    console.error(err);
    fireToast("Erreur activation des notifications");
    return false;
  }
}

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


const MEAL_DEFS = [
  { key: "petitDej", nom: "Petit-déjeuner", emoji: "🌅" },
  { key: "dejeuner", nom: "Déjeuner", emoji: "🍽️" },
  { key: "collation", nom: "Collation", emoji: "🍎" },
  { key: "diner", nom: "Dîner", emoji: "🌙" },
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

const BottomNav = ({ active, setActive }) => {
  const activeIndex = NAV_ITEMS.findIndex((item) => item.key === active);
  const itemWidth = 100 / NAV_ITEMS.length;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 28px)",
        maxWidth: 440,
        background: "rgba(30,86,201,0.5)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 24,
        padding: "10px 8px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 50,
        boxShadow: "0 0 22px rgba(0,178,255,0.6), 0 0 8px rgba(0,200,255,0.8), 0 8px 28px rgba(10,30,70,0.3)",
      }}
    >
      {/* Bulle qui glisse d'un onglet à l'autre */}
      <div
        style={{
          position: "absolute",
          top: 8,
          bottom: 8,
          left: `calc(${itemWidth * activeIndex}% + 6px)`,
          width: `calc(${itemWidth}% - 12px)`,
          background: "rgba(255,255,255,0.2)",
          borderRadius: 16,
          transition: "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "transparent",
              border: "none",
              borderRadius: 16,
              padding: "7px 4px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ transform: isActive ? "scale(1.18)" : "scale(1)", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              <Icon size={20} color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)"} strokeWidth={isActive ? 2.4 : 2} fill={isActive ? "#FFFFFF" : "none"} fillOpacity={isActive ? 0.25 : 0} />
            </div>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ENTRAINEMENT — LISTE                                               */
/* ------------------------------------------------------------------ */
function CalendrierSeances({ recentSeances }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const annee = viewDate.getFullYear();
  const mois = viewDate.getMonth();
  const premierJour = new Date(annee, mois, 1);
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const decalage = (premierJour.getDay() + 6) % 7;

  const seancesParJour = useMemo(() => {
    const map = {};
    for (const s of (recentSeances || [])) {
      const d = new Date(s.date);
      if (d.getFullYear() !== annee || d.getMonth() !== mois) continue;
      const jour = d.getDate();
      if (!map[jour]) map[jour] = [];
      map[jour].push(s);
    }
    return map;
  }, [recentSeances, annee, mois]);

  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push(null);
  for (let j = 1; j <= nbJours; j++) cases.push(j);

  if (selectedDay && seancesParJour[selectedDay]) {
    const seriesBySeanceMap = Object.fromEntries((recentSeances || []).map((s) => [s.id, s.series || []]));
    return (
      <div>
        <button onClick={() => setSelectedDay(null)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour au calendrier
        </button>
        <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
          <LegendDot color={C.green} label="Progrès" />
          <LegendDot color={C.amber} label="Stagnation" />
          <LegendDot color={C.red} label="Régression" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {seancesParJour[selectedDay].map((s) => {
            const sIdx = (recentSeances || []).findIndex((rs) => rs.id === s.id);
            return (
              <Card key={s.id} style={{ padding: 14 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: C.text }}>{s.nom_programme}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>{formatDateDisplay(s.date)} · {fmtTime(s.duree_secondes || 0)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(s.series || []).map((sr, i) => {
                    const couleur = sIdx >= 0 ? getProgressionColor(recentSeances, seriesBySeanceMap, sIdx, sr.exercice_nom, sr.poids, sr.reps) : C.text;
                    return (
                      <div key={i} style={{ fontSize: 12, color: couleur, background: C.surface, borderRadius: 8, padding: "6px 10px", fontFamily: FONT_MONO, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                        <span>{sr.exercice_nom}</span>
                        <span>{sr.poids}kg × {sr.reps} <span style={{ color: C.amber, fontWeight: 400 }}>RPE{sr.rpe}</span></span>
                      </div>
                    );
                  })}
                  {(!s.series || s.series.length === 0) && (
                    <div style={{ fontSize: 12, color: C.textDim }}>Aucune série enregistrée</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(annee, mois - 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
          <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
          {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </div>
        <button onClick={() => setViewDate(new Date(annee, mois + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
          <div key={i} style={{ fontSize: 10, color: C.textMuted, textAlign: "center", fontWeight: 700 }}>{l}</div>
        ))}
        {cases.map((j, i) => {
          const aUneSeance = j && seancesParJour[j];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 32 }}>
              {j && (
                <button
                  onClick={() => aUneSeance && setSelectedDay(j)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontFamily: FONT_MONO,
                    background: aUneSeance ? C.blue : "transparent",
                    color: aUneSeance ? "#FFFFFF" : C.textMuted,
                    fontWeight: aUneSeance ? 700 : 400,
                    cursor: aUneSeance ? "pointer" : "default",
                  }}
                >
                  {j}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 10, textAlign: "center" }}>Touche un jour en bleu pour voir le détail de la séance</div>
    </div>
  );
}
function EntrainementHome({ user, stats, onStart, fireToast, customProgrammes, isCoach, profilId, onSeanceCreated, weightHistory, recentSeances, setTab, mode = "accueil", meals, objectifsNutrition, streak = 0 }) {
  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const [draggedProgIdx, setDraggedProgIdx] = useState(null);
  const [dragOverProgIdx, setDragOverProgIdx] = useState(null);
  const progCardRefs = useRef([]);

  const handleReorderDrop = async (dropIdx, explicitFromIdx = null) => {
    const fromIdx = explicitFromIdx !== null ? explicitFromIdx : draggedProgIdx;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDraggedProgIdx(null);
      setDragOverProgIdx(null);
      return;
    }
    const reordered = [...programmesCycle];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setDraggedProgIdx(null);
    setDragOverProgIdx(null);
    try {
      await Promise.all(reordered.map((p, i) => supabase.from("programmes").update({ ordre: i }).eq("id", p.id)));
      onSeanceCreated?.();
    } catch (err) {
      console.error(err);
      fireToast("Erreur réorganisation des séances");
    }
  };

  const dragOverProgIdxRef = useRef(null);

  // Glisser tactile (fonctionne à la souris ET au doigt, contrairement au glisser HTML natif)
  useEffect(() => {
    if (draggedProgIdx === null) return;
    const handleMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      let overIdx = null;
      for (let i = 0; i < progCardRefs.current.length; i++) {
        const el = progCardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) { overIdx = i; break; }
      }
      if (overIdx !== null) {
        dragOverProgIdxRef.current = overIdx;
        setDragOverProgIdx(overIdx);
      }
    };
    const handleUp = () => {
      const finalOver = dragOverProgIdxRef.current;
      const finalFrom = draggedProgIdx;
      dragOverProgIdxRef.current = null;
      if (finalOver !== null) handleReorderDrop(finalOver, finalFrom);
      else { setDraggedProgIdx(null); setDragOverProgIdx(null); }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggedProgIdx]);
  const JOURS_ORDRE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const programmesJourFixe = useMemo(() => customProgrammes.filter((p) => p.jourFixe), [customProgrammes]);
  const programmesCycle = useMemo(() => customProgrammes.filter((p) => !p.jourFixe), [customProgrammes]);
  const jourAujourdhui = JOURS_ORDRE[(new Date().getDay() + 6) % 7];

  // Jours de la semaine en cours (lundi -> dimanche) déjà validés, pour le suivi vert hebdomadaire.
  // Se réinitialise naturellement chaque semaine puisqu'on ne regarde que les dates de CETTE semaine.
  const joursValidesCetteSemaine = useMemo(() => {
    if (!recentSeances || recentSeances.length === 0) return new Set();
    const now = new Date();
    const decalage = (now.getDay() + 6) % 7;
    const lundi = new Date(now);
    lundi.setDate(now.getDate() - decalage);
    const lundiIso = `${lundi.getFullYear()}-${String(lundi.getMonth() + 1).padStart(2, "0")}-${String(lundi.getDate()).padStart(2, "0")}`;
    const valides = new Set();
    for (const s of recentSeances) {
      const dateSeanceIso = String(s.date).slice(0, 10); // compare des chaînes "AAAA-MM-JJ", évite tout souci de fuseau horaire
      if (dateSeanceIso < lundiIso) continue;
      const p = programmesJourFixe.find((prog) => prog.id === s.programme_id) || programmesJourFixe.find((prog) => prog.nom === s.nom_programme);
      if (p) valides.add(p.jourFixe);
    }
    return valides;
  }, [recentSeances, programmesJourFixe]);

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
    const jourSemaine = now.getDay(); // 0 = dimanche, 1 = lundi, ...
    const decalageDepuisLundi = jourSemaine === 0 ? 6 : jourSemaine - 1;
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - decalageDepuisLundi);
    debutSemaine.setHours(0, 0, 0, 0);
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

  const poidsRestant = (user.poidsActuel - user.poidsObjectif).toFixed(1);
  const progressPoids = Math.min(
    100,
    Math.max(
      0,
      ((user.poidsDepart - user.poidsActuel) / (user.poidsDepart - user.poidsObjectif)) * 100
    )
  );

  // Score du palier mensuel (0-100), réparti en 4 blocs de 25 points
  const scorePoids = Math.round(Math.pow(Math.min(1, Math.max(0, progressPoids / 100)), 2) * 25);
  const semainesEcoulees = Math.max(1, Math.ceil(new Date().getDate() / 7));
  const objectifSeancesMois = objectifSeancesSemaine * semainesEcoulees;
  const scoreSeances = objectifSeancesMois > 0 ? Math.round(Math.min(1, stats.seancesRealisees / objectifSeancesMois) * 25) : 0;
  const scoreNutrition = Math.round(Math.min(1, streak / 10) * 25);
  const scoreCharge = Math.min(25, tousLesProgres.length * 0.5);
  const badgeScore = scorePoids + scoreSeances + scoreNutrition + scoreCharge;
  const TIER_INFO = {
    bronze: { label: "Bronze", emoji: "🥉", color: "#CD7F5A" },
    argent: { label: "Argent", emoji: "🥈", color: "#B8C0CC" },
    or: { label: "Or", emoji: "🥇", color: "#F5C451" },
  };
  const badgeTierKey = badgeScore >= 75 ? "or" : badgeScore >= 40 ? "argent" : "bronze";
  const tierInfo = TIER_INFO[badgeTierKey];
  const badgeRingRadius = 36;
  const badgeRingCirc = 2 * Math.PI * badgeRingRadius;
  const badgeRingOffset = badgeRingCirc - (badgeScore / 100) * badgeRingCirc;
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);

  const [editingProgramme, setEditingProgramme] = useState(null);
  const [showProgresDetail, setShowProgresDetail] = useState(false);
  const [showCalendrier, setShowCalendrier] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {mode === "accueil" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textOnBg, fontWeight: 600 }}>
              Bienvenue,
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: C.blue, lineHeight: 1 }}>
              {user.prenom}
            </div>
            <div style={{ fontSize: 12, color: C.textOnBgMuted, fontWeight: 600, marginTop: 4, textAlign: "left" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setShowBadgeDetail(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Award size={14} color={tierInfo.color} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Palier du mois</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
                <div style={{ position: "relative", width: 84, height: 84 }}>
                  <svg width="84" height="84" viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r={badgeRingRadius} fill="none" stroke={C.cardBorderLight} strokeWidth="7" />
                    <circle
                      cx="42" cy="42" r={badgeRingRadius} fill="none" stroke={tierInfo.color} strokeWidth="7"
                      strokeDasharray={badgeRingCirc} strokeDashoffset={badgeRingOffset}
                      strokeLinecap="round" transform="rotate(-90 42 42)"
                      style={{ transition: "stroke-dashoffset .4s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MedalBadge color={tierInfo.color} size={40} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: tierInfo.color, fontWeight: 700, marginTop: 2 }}>
                {tierInfo.label} · {Math.round(badgeScore)}%
              </div>
            </Card>
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setTab("nutrition")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Calories</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>
                {Math.round(caloriesConsommees)} <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>kcal</span>
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                {caloriesObjectif ? `sur ${Math.round(caloriesObjectif)} kcal` : "objectif non défini"}
              </div>
              {caloriesObjectif > 0 && <ProgressBar value={caloriesConsommees} max={caloriesObjectif} color={C.blue} height={6} />}
              {streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <Flame size={13} color={C.amber} fill={C.amber} />
                  <span style={{ fontSize: 11.5, color: C.amber, fontWeight: 700 }}>
                    {streak} jour{streak > 1 ? "s" : ""} de suite
                  </span>
                </div>
              )}
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
            <Card style={{ padding: 14, cursor: "pointer" }} onClick={() => setShowCalendrier(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Séances</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{stats.seancesRealisees}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>réalisées ce mois</div>
              {objectifSeancesSemaine > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: seancesCetteSemaine >= objectifSeancesSemaine ? C.green : seancesCetteSemaine === 0 ? C.red : C.amber, background: seancesCetteSemaine >= objectifSeancesSemaine ? C.greenSoft : seancesCetteSemaine === 0 ? C.redSoft : C.amberSoft, borderRadius: 8, padding: "4px 8px", display: "inline-block" }}>
                  {seancesCetteSemaine}/{objectifSeancesSemaine} cette semaine
                </div>
              )}
            </Card>
            <Card style={{ padding: 14, cursor: exerciceProgres ? "pointer" : "default" }} onClick={() => exerciceProgres && setShowProgresDetail(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Dumbbell size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Progrès</span>
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
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Poids</span>
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
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Prochaine séance</span>
              </div>
              {customProgrammes && customProgrammes.length > 0 ? (
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
          <button
            onClick={() => setShowCalendrier(true)}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Flame size={15} color={C.blue} /> Voir mon calendrier de séances
          </button>
          <div style={{ marginTop: 4 }}>
            {programmesJourFixe.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <SectionLabel icon={Calendar} onBg>Semaine type</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {JOURS_ORDRE.map((jour) => {
                    const p = programmesJourFixe.find((prog) => prog.jourFixe === jour);
                    const estAujourdhui = jour === jourAujourdhui;
                    const estValide = joursValidesCetteSemaine.has(jour);
                    return (
                      <Card
                        key={jour}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          border: estValide ? `2px solid ${C.green}` : (estAujourdhui ? `2px solid ${C.amber}` : `1px solid ${C.cardBorder}`),
                          boxShadow: estValide ? "0 0 14px rgba(34,168,118,0.5)" : (estAujourdhui ? "0 0 14px rgba(240,178,92,0.5)" : undefined),
                          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: estValide ? C.green : (estAujourdhui ? C.amber : C.textMuted), textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {jour}{estAujourdhui && " · Aujourd'hui"}{estValide && " · Validé ✓"}
                            </span>
                          </div>
                          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: p ? C.text : C.textDim }}>
                            {p ? p.nom : "Repos"}
                          </div>
                          {p && (
                            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                              {p.exercices.length} exercices · {p.exercices.reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries
                            </div>
                          )}
                        </div>
                        {p && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => onStart(p)} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13 }}>
                              <Play size={14} fill="#06171F" /> Démarrer
                            </button>
                            {isCoach && (
                              <button onClick={(e) => { e.stopPropagation(); setEditingProgramme(p); setShowSeanceForm(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            <SectionLabel icon={Dumbbell} onBg>{programmesJourFixe.length > 0 ? "Autres séances (cycle)" : "Mes séances"}</SectionLabel>
            {isCoach && (
              <button onClick={() => setShowSeanceForm(true)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                <Plus size={16} /> Créer une séance
              </button>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {programmesCycle.length === 0 ? (
                <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>{programmesJourFixe.length > 0 ? "Aucune autre séance" : "Ton coach ne t'a pas encore assigné de séance"}</div></Card>
              ) : programmesCycle.map((p, pIdx) => (
                <Card
                  key={p.id}
                  ref={(el) => { progCardRefs.current[pIdx] = el; }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    opacity: draggedProgIdx === pIdx ? 0.4 : 1,
                    border: dragOverProgIdx === pIdx && draggedProgIdx !== pIdx ? `2px dashed ${C.blue}` : `1px solid ${C.cardBorder}`,
                    userSelect: isCoach ? "none" : "auto",
                    WebkitUserSelect: isCoach ? "none" : "auto",
                    WebkitTouchCallout: isCoach ? "none" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isCoach && (
                      <div
                        onMouseDown={() => setDraggedProgIdx(pIdx)}
                        onTouchStart={() => setDraggedProgIdx(pIdx)}
                        style={{
                          color: C.textDim, fontSize: 20, lineHeight: 1, padding: 6, cursor: "grab", touchAction: "none",
                          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
                        }}
                      >
                        ⠿
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: C.text }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{p.muscle}</div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                        {p.exercices.length} exercices · {p.exercices.reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries · {p.duree}
                      </div>
                    </div>
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
      {showBadgeDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowBadgeDetail(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={Award}>Ton palier du mois</SectionLabel>
            <div style={{ textAlign: "center", margin: "8px 0 20px" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><MedalBadge color={tierInfo.color} size={64} /></div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 30, color: tierInfo.color, fontWeight: 700 }}>{Math.round(badgeScore)}%</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Palier {tierInfo.label}
                {badgeTierKey !== "or" && ` · ${Math.round(badgeTierKey === "bronze" ? 40 - badgeScore : 75 - badgeScore)}% pour passer ${badgeTierKey === "bronze" ? "Argent" : "Or"}`}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>🎯 Objectif de poids</span>
                  <span style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{scorePoids}/25</span>
                </div>
                <ProgressBar value={scorePoids} max={25} color={C.amber} height={6} />
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Rapproche-toi vraiment de ton objectif de poids — les derniers pourcents comptent le plus.</div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>🔥 Séances du mois</span>
                  <span style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{scoreSeances}/25</span>
                </div>
                <ProgressBar value={scoreSeances} max={25} color={C.blue} height={6} />
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Termine toutes tes séances prévues ce mois-ci.</div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>🍎 Régularité nutrition</span>
                  <span style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{scoreNutrition}/25</span>
                </div>
                <ProgressBar value={scoreNutrition} max={25} color={C.green} height={6} />
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Renseigne tes repas plusieurs jours de suite (jusqu'à 10 jours pour le max).</div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>💪 Progression en charge</span>
                  <span style={{ fontFamily: FONT_MONO, color: C.textMuted }}>{scoreCharge}/25</span>
                </div>
                <ProgressBar value={scoreCharge} max={25} color={C.red} height={6} />
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>+0,5 point à chaque exercice où tu progresses (poids ou répétitions).</div>
              </div>
            </div>
            <button onClick={() => setShowBadgeDetail(false)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>Fermer</button>
          </Card>
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
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 12, color: C.text, marginBottom: 4 }}>{p.nom}</div>
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
function ExerciceCard({ ex, history, log, onValidate, onVideo, programmeNom }) {
  const [open, setOpen] = useState(false);
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("");
  const [tempo, setTempo] = useState("");
  const [rpe, setRpe] = useState("8");
  const [showTempoExplication, setShowTempoExplication] = useState(false);
  const [showVideoExecution, setShowVideoExecution] = useState(false);
  const fileRef = useRef(null);
  const hasVideo = !!log.video;
  const historique = history[`${programmeNom}::${ex.nom}`]; // { date, sets: [{poids, reps, numeroSerie}, ...] }
  const nbEchauffement = ex.echauffement || 0;
  const currentSetIndex = Math.max(0, log.sets.length - nbEchauffement); // 0-indexée, hors séries d'échauffement
  const rappelSerieActuelle = historique?.sets?.[currentSetIndex];
  const derniereSerieGlobale = historique?.sets?.[historique.sets.length - 1];
  const seriesEffectivesValidees = Math.max(0, log.sets.length - nbEchauffement);
  const progressionPct = ex.type === "cardio"
    ? (log.sets.length > 0 ? 100 : 0)
    : Math.min(100, Math.round((seriesEffectivesValidees / ex.sets) * 100));

  // Compare une série validée à la même série (même position) de la dernière séance
  const compareSetColor = (setIdx, setPoids, setReps) => {
    const histoSet = historique?.sets?.[setIdx];
    if (!histoSet) return C.blue; // pas d'historique pour cette série -> couleur neutre
    const p = Number(setPoids), hp = Number(histoSet.poids);
    const r = Number(setReps), hr = Number(histoSet.reps);
    if (p > hp || (p === hp && r > hr)) return C.green;
    if (p === hp && r === hr) return C.amber;
    return C.red;
  };

  // Remplissage segmenté : chaque série effective (hors échauffement) colore sa portion de la carte
  const cardFillGradient = () => {
    if (seriesEffectivesValidees === 0 || ex.type === "cardio") {
      return progressionPct > 0
        ? `linear-gradient(to right, ${C.green} 0%, ${C.green} ${progressionPct}%, ${C.card} ${progressionPct}%, ${C.card} 100%)`
        : C.card;
    }
    const segWidth = 100 / ex.sets;
    const stops = [];
    let cursor = 0;
    log.sets.slice(nbEchauffement).forEach((s, i) => {
      const color = compareSetColor(i, s.poids, s.reps);
      stops.push(`${color} ${cursor}%`, `${color} ${cursor + segWidth}%`);
      cursor += segWidth;
    });
    stops.push(`${C.card} ${cursor}%`, `${C.card} 100%`);
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const submit = () => {
    if (ex.type === "cardio") {
      onValidate(ex, { poids: 0, reps: ex.dureeMinutes || 0, tempo: "", rpe: rpe || "8" }, false);
      setOpen(false);
      return;
    }
    if (!poids || !reps) return;
    onValidate(ex, { poids: parseFloat(poids), reps: parseInt(reps), tempo, rpe }, false);
    setPoids("");
    setReps("");
    setOpen(false);
  };

  const validerEchauffement = () => {
    onValidate(ex, { poids: 0, reps: 0, tempo: "", rpe: "" }, true);
    setOpen(false);
  };

  return (
    <Card
      style={{
        padding: 0,
        overflow: "hidden",
        background: cardFillGradient(),
        transition: "background 0.4s ease",
      }}
    >
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
              <circle cx="28" cy="28" r="26" fill="none" stroke={C.cardBorderLight} strokeWidth="3" />
              <circle
                cx="28" cy="28" r="26" fill="none"
                stroke={progressionPct >= 100 ? C.green : C.blue}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - progressionPct / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: 2, left: 2, width: 52, height: 52, borderRadius: 12, background: C.surface, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {ex.videoDemoUrl ? (
                <video src={`${ex.videoDemoUrl}#t=0.1`} muted playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Dumbbell size={22} color={C.textDim} />
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ex.nom}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {ex.type === "cardio" ? (
                <>🏃 {ex.dureeMinutes} min {log.sets.length > 0 && "· Fait ✓"}</>
              ) : (
                <>
                  {seriesEffectivesValidees}/{ex.sets} séries
                  {nbEchauffement > 0 && <span style={{ color: C.amber }}> · {Math.min(log.sets.length, nbEchauffement)}/{nbEchauffement} échauffement</span>}
                  {derniereSerieGlobale && (
                    <span style={{ color: C.blue }}> · dernière fois {derniereSerieGlobale.poids}kg × {derniereSerieGlobale.reps}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          color={C.textMuted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setOpen(false)}>
        <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto", padding: "16px 14px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: C.surface, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {ex.videoDemoUrl ? (
                <video src={`${ex.videoDemoUrl}#t=0.1`} muted playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Dumbbell size={18} color={C.textDim} />
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{ex.nom}</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ex.videoDemoUrl && (
            <div>
              <button
                onClick={() => setShowVideoExecution(!showVideoExecution)}
                style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, padding: 0 }}
              >
                <ChevronRight size={12} style={{ transform: showVideoExecution ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                Voir l'exo + vidéo d'exécution
              </button>
              {showVideoExecution && (
                <video
                  src={ex.videoDemoUrl}
                  controls
                  playsInline
                  style={{ width: "100%", borderRadius: 12, background: "#000", maxHeight: 240, marginTop: 6 }}
                />
              )}
            </div>
          )}
          {ex.note && (
            <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: C.textOnBg }}>
              💬 <strong>Note de ton coach :</strong> {ex.note}
            </div>
          )}
          {ex.tempo && (
            <button
              onClick={() => setShowTempoExplication(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 12px", alignSelf: "flex-start" }}
            >
              <Clock size={13} color={C.blue} />
              <span style={{ fontSize: 12, color: C.text, fontWeight: 700, fontFamily: FONT_MONO }}>Tempo {ex.tempo}</span>
              <span style={{ fontSize: 10, color: C.textMuted }}>(?)</span>
            </button>
          )}
          {showTempoExplication && <TempoExplanationModal tempo={ex.tempo} onClose={() => setShowTempoExplication(false)} />}
          {historique && historique.sets.length > 0 && (() => {
            const enEchauffement = log.sets.length < nbEchauffement;
            return (
            <div
              style={{
                background: "#FFFFFF",
                border: `2px solid ${C.amber}`,
                borderRadius: 14,
                padding: enEchauffement ? "9px 11px" : "12px 14px",
                fontSize: enEchauffement ? 11 : 13,
                color: C.textOnBg,
                boxShadow: "0 0 16px rgba(240,178,92,0.5), 0 4px 12px rgba(10,30,70,0.2)",
                opacity: enEchauffement ? 0.75 : 1,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: rappelSerieActuelle ? 6 : 0, fontSize: enEchauffement ? 11.5 : 14 }}>
                {rappelSerieActuelle
                  ? `📌 Série ${currentSetIndex + 1} — la dernière fois : ${rappelSerieActuelle.poids} kg × ${rappelSerieActuelle.reps}`
                  : `📌 Toutes les séries prévues ont un historique (le ${historique.date})`}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                {historique.sets.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: enEchauffement ? 9 : 10.5, fontFamily: FONT_MONO, fontWeight: 700,
                      color: i === currentSetIndex ? "#FFFFFF" : C.textOnBgMuted,
                      background: i === currentSetIndex ? C.amber : "#F1F3EA",
                      border: `1px solid ${i === currentSetIndex ? C.amber : C.cardBorder}`,
                      borderRadius: 6, padding: enEchauffement ? "2px 5px" : "3px 7px",
                    }}
                  >
                    S{i + 1}: {s.poids}kg×{s.reps}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: enEchauffement ? 9 : 10, color: C.textOnBgMuted, marginTop: 6, fontWeight: 600 }}>Séance du {historique.date}</div>
            </div>
            );
          })()}

          {seriesEffectivesValidees > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[[C.green, "Progrès"], [C.amber, "Pareil qu'avant"], [C.red, "Moins bien"]].map(([color, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {seriesEffectivesValidees > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {log.sets.map((s, i) => {
                const estEchauffement = i < nbEchauffement;
                if (estEchauffement) return null;
                const couleur = compareSetColor(i - nbEchauffement, s.poids, s.reps);
                return (
                  <div
                    key={i}
                    style={{
                      fontSize: 11.5,
                      color: "#FFFFFF",
                      background: couleur,
                      border: `1px solid ${couleur}`,
                      borderRadius: 8,
                      padding: "5px 9px",
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                    }}
                  >
                    {s.poids}kg×{s.reps} <span style={{ opacity: 0.85 }}>RPE{s.rpe}</span>
                  </div>
                );
              })}
            </div>
          )}

          {ex.type !== "cardio" && log.sets.length < nbEchauffement && (
            <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 10, padding: "10px 12px", marginBottom: 4 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: C.amber, marginBottom: 2 }}>
                🔥 Série d'échauffement {log.sets.length + 1}/{nbEchauffement}
              </div>
              <div style={{ fontSize: 11.5, color: C.textOnBg }}>
                Charge légère, environ 5 répétitions — augmente progressivement le poids à chaque série d'échauffement. Ne compte pas dans tes séries effectives.
              </div>
            </div>
          )}

          {ex.type !== "cardio" && log.sets.length < nbEchauffement ? (
            <button
              onClick={validerEchauffement}
              style={{
                width: "100%", background: C.amber, border: "none", color: "#3D2600",
                borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 14.5,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Check size={16} /> Valider la série d'échauffement
            </button>
          ) : ex.type === "cardio" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "14px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: C.text, fontWeight: 700 }}>{ex.dureeMinutes} min</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Valide une fois terminé</div>
              </div>
              <button
                onClick={submit}
                style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Check size={15} /> Terminé
              </button>
            </div>
          ) : (
            <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>CHARGE (KG)</div>
              <input
                type="number"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder={rappelSerieActuelle ? String(rappelSerieActuelle.poids) : "0"}
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
                placeholder={rappelSerieActuelle ? String(rappelSerieActuelle.reps) : "0"}
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

          {ex.objectifRepsMax && parseInt(reps) >= ex.objectifRepsMax && (
            <div style={{ background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: C.green, fontWeight: 700 }}>
              🎯 Objectif de {ex.objectifRepsMax} reps atteint ! Augmente la charge la prochaine fois.
            </div>
          )}

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
            </>
          )}
        </div>
        </Card>
        </div>
      )}
    </Card>
  );
}

let sharedAudioCtx = null;

// À appeler depuis un vrai clic utilisateur (ex: valider une série) pour "débloquer" le son :
// beaucoup de navigateurs empêchent de créer/jouer du son depuis un minuteur si aucune
// interaction directe n'a eu lieu avant.
function unlockAudio() {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
  } catch (err) {
    console.error("Erreur déverrouillage audio:", err);
  }
}

function playBeep() {
  try {
    const ctx = sharedAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    sharedAudioCtx = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const playTone = (freq, startTime, duration) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "triangle";
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.9, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.02);
    };

    const now = ctx.currentTime;
    // Sonnerie forte à 3 notes montantes, répétée deux fois pour bien se faire remarquer
    playTone(784, now, 0.16);
    playTone(988, now + 0.18, 0.16);
    playTone(1318, now + 0.36, 0.4);
    playTone(784, now + 1.0, 0.16);
    playTone(988, now + 1.18, 0.16);
    playTone(1318, now + 1.36, 0.4);
  } catch (err) {
    console.error("Erreur son:", err);
  }
}
function RestScreen({ rest, programme, history, onSkip, onUpdateSet }) {
  const exIndex = programme.exercices.findIndex((e) => e.id === rest.exId);
  const ex = programme.exercices[exIndex];

  // Sécurité : si l'exercice n'est pas retrouvé (identifiant introuvable), on ne plante pas —
  // on affiche un écran de repos minimal avec juste un bouton pour continuer.
  useEffect(() => {
    if (!ex) console.error("RestScreen: exercice introuvable pour exId =", rest.exId);
  }, [ex]);

  if (!ex) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#CFE4FC", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.textOnBg }}>Repos</span>
        <button onClick={onSkip} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "14px 28px", fontWeight: 800, fontSize: 15 }}>
          Continuer
        </button>
      </div>
    );
  }

  const estDerniereSerieDeLExercice = rest.setNumber >= ex.sets;
  const prochainExercice = estDerniereSerieDeLExercice ? programme.exercices[exIndex + 1] : null;

  const nextInfo = estDerniereSerieDeLExercice
    ? (prochainExercice
        ? { label: "Prochain exercice", nom: prochainExercice.nom, last: history[`${programme.nom}::${prochainExercice.nom}`]?.sets?.[0] }
        : null)
    : { label: `Prochaine série · ${rest.setNumber + 1}/${ex.sets}`, nom: ex.nom, last: history[`${programme.nom}::${ex.nom}`]?.sets?.[rest.setNumber] };

  const [poids, setPoids] = useState(rest.poids != null ? String(rest.poids) : "");
  const [reps, setReps] = useState(rest.reps != null ? String(rest.reps) : "");

  const pct = rest.total > 0 ? Math.min(100, ((rest.total - rest.left) / rest.total) * 100) : 100;
  const ringRadius = 92;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (pct / 100) * ringCirc;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#CFE4FC", zIndex: 200, display: "flex", flexDirection: "column", padding: "24px 20px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textOnBgMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Repos</span>
        <button onClick={onSkip} style={{ background: "transparent", border: "none", color: C.textOnBg }}><X size={22} /></button>
      </div>

      {nextInfo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: C.surface, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {nextInfo.image ? (
              <img src={nextInfo.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Dumbbell size={26} color={C.text} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textOnBgMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{nextInfo.label}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: C.textOnBg }}>{nextInfo.nom}</div>
            {nextInfo.last && (
              <div style={{ fontSize: 12, color: C.blue, marginTop: 2, fontWeight: 700 }}>Dernière fois : {nextInfo.last.poids}kg × {nextInfo.last.reps}</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: C.textOnBg }}>Dernière série de la séance 💪</div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
        {rest.termine ? (
          <div style={{ textAlign: "center", animation: "pulseGlow 1s infinite" }}>
            <div style={{ width: 140, height: 140, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 40px rgba(240,178,92,0.8)" }}>
              <Clock size={56} color="#3D2600" />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.textOnBg }}>Temps écoulé !</div>
            <div style={{ fontSize: 13, color: C.textOnBgMuted, marginTop: 4 }}>C'est reparti 💪</div>
          </div>
        ) : (
          <div style={{ position: "relative", width: 220, height: 220 }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={ringRadius} fill="none" stroke={C.cardBorderLight} strokeWidth="14" />
              <circle
                cx="110" cy="110" r={ringRadius} fill="none" stroke={C.amber} strokeWidth="14"
                strokeDasharray={ringCirc} strokeDashoffset={ringOffset}
                strokeLinecap="round" transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 48, color: C.textOnBg, fontWeight: 700 }}>{rest.left}</div>
              <div style={{ fontSize: 12, color: C.textOnBgMuted, fontWeight: 600 }}>secondes</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textOnBgMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Ta série qui vient d'être validée
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.textOnBgMuted, marginBottom: 4, fontWeight: 700 }}>CHARGE (KG)</div>
          <input
            type="number" value={poids} onChange={(e) => setPoids(e.target.value)}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: "14px", color: C.text, fontSize: 20, fontFamily: FONT_MONO, textAlign: "center" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: C.textOnBgMuted, marginBottom: 4, fontWeight: 700 }}>RÉPÉTITIONS</div>
          <input
            type="number" value={reps} onChange={(e) => setReps(e.target.value)}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: "14px", color: C.text, fontSize: 20, fontFamily: FONT_MONO, textAlign: "center" }}
          />
        </div>
      </div>

      <button
        onClick={() => { onUpdateSet(poids, reps); onSkip(); }}
        style={{
          width: "100%", border: "none", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 15,
          background: rest.termine ? C.amber : C.blue,
          color: rest.termine ? "#3D2600" : "#06171F",
        }}
      >
        {rest.termine ? "Continuer la séance" : "Terminer le repos"}
      </button>
    </div>
  );
}

function SessionView({ programme, history, setHistory, onFinish, onCancel, fireToast, onSessionComplete }) {
  const [seconds, setSeconds] = useState(0);
  const sessionKey = programme.id || programme.nom;
  const startTimeKey = `session_start_${sessionKey}`;
  const logsKey = `session_logs_${sessionKey}`;
  const restKey = `session_rest_${sessionKey}`;

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(logsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // s'assure que tous les exercices du programme ont bien une entrée (au cas où le programme a changé)
        const base = Object.fromEntries(programme.exercices.map((e) => [e.id, { sets: [], video: null }]));
        return { ...base, ...parsed };
      } catch { /* ignore */ }
    }
    return Object.fromEntries(programme.exercices.map((e) => [e.id, { sets: [], video: null }]));
  });

  const [rest, setRest] = useState(() => {
    const saved = localStorage.getItem(restKey);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.termine) return { ...parsed, left: 0 };
      const left = parsed.total - Math.floor((Date.now() - parsed.startedAt) / 1000);
      if (left <= 0) return { ...parsed, left: 0, termine: true };
      return { ...parsed, left };
    } catch {
      return null;
    }
  });
  const [finished, setFinished] = useState(false);

  // Persiste la progression à chaque changement : permet de quitter puis revenir sans rien perdre
  useEffect(() => {
    localStorage.setItem(logsKey, JSON.stringify(logs));
  }, [logs, logsKey]);

  useEffect(() => {
    let start = localStorage.getItem(startTimeKey);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(startTimeKey, start);
    }
    const startTime = parseInt(start);
    const tick = () => setSeconds(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Chrono de repos basé sur une horloge réelle (timestamp) : reste juste même si l'écran
  // s'éteint ou que l'app passe en arrière-plan, contrairement à un simple compteur.
  const declencherAlerteFinRepos = () => {
    playBeep();
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400, 150, 400]);
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
      try {
        new Notification("Temps de repos terminé ⏱️", { body: "Reviens sur l'app pour continuer ta séance !", icon: "/pwa-192x192.png", requireInteraction: true });
      } catch (err) {
        console.error("Erreur notification locale:", err);
      }
    }
  };

  useEffect(() => {
    if (!rest || rest.termine) return;
    const tick = () => {
      const left = rest.total - Math.floor((Date.now() - rest.startedAt) / 1000);
      if (left <= 0) {
        declencherAlerteFinRepos();
        const termine = { ...rest, left: 0, termine: true };
        localStorage.setItem(restKey, JSON.stringify(termine));
        setRest(termine);
        return;
      }
      setRest((r) => (r ? { ...r, left } : r));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rest?.startedAt, rest?.termine]);

  // Si l'utilisateur revient sur l'app alors que le repos est déjà fini (il était ailleurs),
  // on relance l'alerte pour être sûr qu'il ne la manque pas.
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && rest?.termine) {
        declencherAlerteFinRepos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [rest?.termine]);

  const arreterAlerteRepos = () => {
    localStorage.removeItem(restKey);
    setRest(null);
  };

  useEffect(() => {
    if (rest?.termine) declencherAlerteFinRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSets = Object.values(logs).reduce((a, l) => a + l.sets.length, 0);

  const validateSet = (ex, set, estEchauffement) => {
    unlockAudio();
    let setNumber = 1;
    setLogs((prev) => {
      setNumber = (prev[ex.id]?.sets?.length || 0) + 1;
      return {
        ...prev,
        [ex.id]: { ...prev[ex.id], sets: [...(prev[ex.id]?.sets || []), set] },
      };
    });

    // Une série d'échauffement ne déclenche jamais le temps de repos — signalé
    // explicitement par le bouton utilisé (fiable, ne dépend pas d'un comptage).
    if (estEchauffement) return;

    // Dans un superset, on n'active le repos que quand TOUS les exercices du groupe VISIBLEMENT
    // regroupés (adjacents dans la liste) ont fait cette même série — jamais un exercice
    // "orphelin" ailleurs dans la séance qui partagerait la même valeur par erreur.
    try {
      if (ex.groupeSuperset && programme?.exercices) {
        const idx = programme.exercices.findIndex((e) => e.id === ex.id);
        const partenaires = [];
        for (let j = idx - 1; j >= 0 && programme.exercices[j]?.groupeSuperset === ex.groupeSuperset; j--) partenaires.push(programme.exercices[j]);
        for (let j = idx + 1; j < programme.exercices.length && programme.exercices[j]?.groupeSuperset === ex.groupeSuperset; j++) partenaires.push(programme.exercices[j]);
        const unPartenaireEnRetard = partenaires.some((p) => (logs[p.id]?.sets.length || 0) < setNumber);
        if (unPartenaireEnRetard) return;
      }
    } catch (err) {
      console.error("Erreur vérification superset (repos activé quand même):", err);
    }

    const nouveauRest = { total: ex.rest, startedAt: Date.now(), left: ex.rest, exId: ex.id, setNumber, poids: set.poids, reps: set.reps };
    localStorage.setItem(restKey, JSON.stringify(nouveauRest));
    setRest(nouveauRest);
  };

  const updateLastSet = (exId, poids, reps) => {
    setLogs((prev) => {
      const sets = [...prev[exId].sets];
      if (sets.length === 0) return prev;
      sets[sets.length - 1] = { ...sets[sets.length - 1], poids: parseFloat(poids) || sets[sets.length - 1].poids, reps: parseInt(reps) || sets[sets.length - 1].reps };
      return { ...prev, [exId]: { ...prev[exId], sets } };
    });
  };

  const nettoyerStockageSession = () => {
    localStorage.removeItem(startTimeKey);
    localStorage.removeItem(logsKey);
    localStorage.removeItem(restKey);
  };

  const attachVideo = (ex, url) => {
    setLogs((prev) => ({ ...prev, [ex.id]: { ...prev[ex.id], video: url } }));
    fireToast("Vidéo attachée à " + ex.nom);
  };

  const recapStats = useMemo(() => {
    const nbExercices = Object.values(logs).filter((l) => l.sets.length > 0).length;
    let recordsBattus = 0;
    for (const ex of programme.exercices) {
      const log = logs[ex.id];
      if (!log || log.sets.length === 0) continue;
      const maxAujourdhui = Math.max(...log.sets.map((s) => Number(s.poids) || 0));
      const histo = history[`${programme.nom}::${ex.nom}`];
      if (histo && histo.sets && histo.sets.length > 0) {
        const maxHistorique = Math.max(...histo.sets.map((s) => Number(s.poids) || 0));
        if (maxAujourdhui > maxHistorique) recordsBattus++;
      }
    }
    return { nbExercices, recordsBattus };
  }, [logs, programme, history]);

  if (finished) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={30} color={C.green} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.textOnBg }}>Séance envoyée à ton coach</div>
        <div style={{ fontSize: 13, color: C.textOnBgMuted, maxWidth: 280 }}>{programme.nom}</div>

        <Card style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{fmtTime(seconds)}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Durée</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{recapStats.nbExercices}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Exercices</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>{totalSets}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Séries</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: recapStats.recordsBattus > 0 ? C.amber : C.text, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                {recapStats.recordsBattus > 0 && "🏆"} {recapStats.recordsBattus}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Records battus</div>
            </div>
          </div>
        </Card>

        {recapStats.recordsBattus > 0 && (
          <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 700, maxWidth: 280 }}>
            🎉 Bravo, tu as progressé sur {recapStats.recordsBattus} exercice{recapStats.recordsBattus > 1 ? "s" : ""} par rapport à la dernière fois !
          </div>
        )}

        <button
          onClick={onFinish}
          style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 999, padding: "12px 24px", fontWeight: 800 }}
        >
          Retour à mes séances
        </button>
      </div>
    );
  }

  if (rest) {
    return (
      <RestScreen
        rest={rest}
        programme={programme}
        history={history}
        onSkip={arreterAlerteRepos}
        onUpdateSet={(poids, reps) => updateLastSet(rest.exId, poids, reps)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.textOnBg }}>{programme.nom}</div>
        <div style={{ fontSize: 12, color: C.textOnBgMuted }}>{programme.muscle} · {totalSets} séries validées</div>
      </div>

      {programme.echauffementGeneral && (
        <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Flame size={15} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.amber, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Échauffement</div>
            <div style={{ fontSize: 12.5, color: C.textOnBg }}>{programme.echauffementGeneral}</div>
          </div>
        </div>
      )}

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
        <button
          onClick={() => {
            if (totalSets > 0 && !confirm("Réinitialiser va effacer toutes les séries déjà validées dans cette séance. Continuer ?")) return;
            nettoyerStockageSession();
            onCancel();
          }}
          style={{ background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 999, padding: "8px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
        >
          <RotateCcw size={13} /> Réinitialiser
        </button>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(() => {
          const exs = programme.exercices;
          const blocks = [];
          let i = 0;
          while (i < exs.length) {
            const ex = exs[i];
            if (ex.groupeSuperset) {
              const groupe = [ex];
              let j = i + 1;
              while (j < exs.length && exs[j].groupeSuperset === ex.groupeSuperset) {
                groupe.push(exs[j]);
                j++;
              }
              blocks.push({ type: "superset", exs: groupe });
              i = j;
            } else {
              blocks.push({ type: "single", exs: [ex] });
              i++;
            }
          }
          return blocks.map((block, bi) =>
            block.type === "superset" ? (
              <div key={bi} style={{ border: `3px solid ${C.blue}`, borderRadius: 16, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={13} color={C.blue} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Superset · {block.exs.length} exercices</span>
                </div>
                {block.exs.map((ex) => (
                  <ExerciceCard
                    key={ex.id}
                    ex={ex}
                    history={history}
                    log={logs[ex.id]}
                    onValidate={validateSet}
                    onVideo={attachVideo}
                    programmeNom={programme.nom}
                  />
                ))}
              </div>
            ) : (
              <ExerciceCard
                key={block.exs[0].id}
                ex={block.exs[0]}
                history={history}
                log={logs[block.exs[0].id]}
                onValidate={validateSet}
                onVideo={attachVideo}
                programmeNom={programme.nom}
              />
            )
          );
        })()}
      </div>
      <button
        onClick={() => {
          setFinished(true);
          nettoyerStockageSession();
          onSessionComplete?.({ programme, logs, seconds });
        }}
        disabled={totalSets === 0}
        style={{
          background: totalSets === 0 ? C.surface : C.blue,
          color: totalSets === 0 ? C.textDim : "#02071A",
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NUTRITION                                                          */
/* ------------------------------------------------------------------ */
const RPE_VALEURS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
function RPEPickerModal({ value, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel icon={Flame}>Choisir le RPE</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {RPE_VALEURS.map((v) => (
            <button
              key={v}
              onClick={() => { onSelect(v); onClose(); }}
              style={{
                padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: FONT_MONO,
                background: String(value) === String(v) ? C.blue : C.surface,
                color: String(value) === String(v) ? "#06171F" : C.text,
                border: `1px solid ${String(value) === String(v) ? C.blue : C.cardBorderLight}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

const TEMPO_VALEURS = ["10X0", "11X0", "1010", "20X0", "21X0", "2020", "30X0", "31X0"];
function TempoPickerModal({ value, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel icon={Clock}>Choisir le tempo</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {TEMPO_VALEURS.map((v) => (
            <button
              key={v}
              onClick={() => { onSelect(v); onClose(); }}
              style={{
                padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: FONT_MONO,
                background: value === v ? C.blue : C.surface,
                color: value === v ? "#06171F" : C.text,
                border: `1px solid ${value === v ? C.blue : C.cardBorderLight}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TempoExplanationModal({ tempo, onClose }) {
  const chiffres = (tempo || "").split("");
  const labels = ["Descente (excentrique)", "Pause en bas", "Montée (concentrique)", "Pause en haut"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel icon={Clock}>Tempo {tempo}</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chiffres.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blue, color: "#06171F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: FONT_MONO, flexShrink: 0 }}>
                {c}
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: C.text, fontWeight: 700 }}>{labels[i]}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {c.toUpperCase() === "X" ? "Le plus vite possible, de façon explosive" : `${c} seconde${c !== "1" ? "s" : ""}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const REPOS_VALEURS = [
  { label: "30s", val: 30 }, { label: "1m", val: 60 }, { label: "1m30", val: 90 },
  { label: "2m", val: 120 }, { label: "2m30", val: 150 }, { label: "3m", val: 180 },
  { label: "3m30", val: 210 }, { label: "4m", val: 240 }, { label: "5m", val: 300 },
];
function RepoPickerModal({ value, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel icon={Clock}>Choisir le temps de repos</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {REPOS_VALEURS.map((r) => (
            <button
              key={r.val}
              onClick={() => { onSelect(r.val); onClose(); }}
              style={{
                padding: "12px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: value === r.val ? C.blue : C.surface,
                color: value === r.val ? "#06171F" : C.text,
                border: `1px solid ${value === r.val ? C.blue : C.cardBorderLight}`,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function formatRepos(sec) {
  const trouve = REPOS_VALEURS.find((r) => r.val === sec);
  if (trouve) return trouve.label;
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste === 0 ? `${min}m` : `${min}m${reste}`;
}

function ExercicePickerInline({ bibliotheque, onSelect }) {
  const [groupeSelectionne, setGroupeSelectionne] = useState(null);
  const [recherche, setRecherche] = useState("");

  const groupesDisponibles = GROUPES_MUSCULAIRES.filter((g) => bibliotheque.some((ex) => (ex.groupe_musculaire || "Autre") === g));

  const exercicesAffiches = recherche.trim()
    ? bibliotheque.filter((ex) => ex.nom.toLowerCase().includes(recherche.toLowerCase()))
    : groupeSelectionne
      ? bibliotheque.filter((ex) => (ex.groupe_musculaire || "Autre") === groupeSelectionne)
      : [];

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, marginTop: 6, maxHeight: 320, overflowY: "auto" }}>
      <input
        type="text"
        value={recherche}
        onChange={(e) => { setRecherche(e.target.value); setGroupeSelectionne(null); }}
        placeholder="🔍 Rechercher un exercice..."
        style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10 }}
      />
      <div>
        {recherche.trim() ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {exercicesAffiches.length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 12.5, textAlign: "center", padding: 12 }}>Aucun exercice trouvé</div>
            ) : exercicesAffiches.map((ex) => (
              <button key={ex.id} onClick={() => onSelect(ex.id)} style={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 10px", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                <Dumbbell size={14} color={C.blue} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{ex.nom}</span>
              </button>
            ))}
          </div>
        ) : groupeSelectionne ? (
          <>
            <button
              onClick={() => setGroupeSelectionne(null)}
              style={{ background: "transparent", border: "none", color: C.text, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}
            >
              <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour aux groupes
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {exercicesAffiches.map((ex) => (
                <button key={ex.id} onClick={() => onSelect(ex.id)} style={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 10px", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                  <Dumbbell size={14} color={C.blue} />
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{ex.nom}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {groupesDisponibles.length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 12.5, textAlign: "center", padding: 12 }}>Ta bibliothèque d'exercices est vide</div>
            ) : groupesDisponibles.map((g) => {
              const count = bibliotheque.filter((ex) => (ex.groupe_musculaire || "Autre") === g).length;
              return (
                <button key={g} onClick={() => setGroupeSelectionne(g)} style={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dumbbell size={15} color={C.blue} />
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13.5, color: C.text }}>{g}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.textDim }}>{count}</span>
                    <ChevronRight size={14} color={C.textMuted} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ScannerCodeBarres({ onClose, onScan }) {
  const scannerRef = useRef(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode("scanner-zone-cowave");
    scannerRef.current = html5Qrcode;
    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
          }
        },
        () => {} // erreur de lecture image par image, ignorée : le scan continue
      )
      .catch((err) => {
        console.error("Erreur démarrage caméra:", err);
        setErreur("Impossible d'accéder à la caméra. Vérifie que tu as autorisé l'accès dans les réglages.");
      });
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#FFFFFF" }}><X size={26} /></button>
      <div style={{ fontSize: 14, color: "#FFFFFF", marginBottom: 16, fontWeight: 700, textAlign: "center" }}>
        Scanne le code-barres de l'emballage
      </div>
      {erreur ? (
        <div style={{ color: "#FF5D6C", fontSize: 13, textAlign: "center", maxWidth: 280 }}>{erreur}</div>
      ) : (
        <div id="scanner-zone-cowave" style={{ width: "100%", maxWidth: 340, borderRadius: 16, overflow: "hidden" }} />
      )}
    </div>
  );
}

function MealCard({ meal, items, onAdd, onRemove, onUpdate, fireToast, profilId }) {
  const [showScanner, setShowScanner] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editGrams, setEditGrams] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSaveRecette, setShowSaveRecette] = useState(false);
  const [nomRecette, setNomRecette] = useState("");
  const [savingRecette, setSavingRecette] = useState(false);
  const [showUseRecette, setShowUseRecette] = useState(false);
  const [mesRecettes, setMesRecettes] = useState([]);
  const [loadingRecettes, setLoadingRecettes] = useState(false);

  const enregistrerCommeRecette = async () => {
    if (!nomRecette.trim() || !profilId) return;
    setSavingRecette(true);
    try {
      const { error } = await supabase.from("recettes_personnelles").insert({
        profil_id: profilId,
        nom: nomRecette,
        type_repas: meal.key,
        items: items.map((it) => ({
          nom: it.nom, grams: it.grams, kcal: it.kcal, prot: it.prot, gluc: it.gluc, lip: it.lip,
          fibres: it.fibres || 0, sucres: it.sucres || 0, sodium: it.sodium || 0,
          potassium: it.potassium || 0, calcium: it.calcium || 0, fer: it.fer || 0,
          magnesium: it.magnesium || 0, vitamineD: it.vitamineD || 0,
        })),
      });
      if (error) throw error;
      fireToast("Recette enregistrée", "green");
      setShowSaveRecette(false);
      setNomRecette("");
    } catch (err) {
      console.error("Erreur enregistrement recette:", err);
      fireToast("Erreur lors de l'enregistrement");
    } finally {
      setSavingRecette(false);
    }
  };

  const ouvrirMesRecettes = async () => {
    setShowUseRecette(true);
    setLoadingRecettes(true);
    try {
      const { data, error } = await supabase
        .from("recettes_personnelles")
        .select("*")
        .eq("profil_id", profilId)
        .eq("type_repas", meal.key)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMesRecettes(data || []);
    } catch (err) {
      console.error("Erreur chargement recettes:", err);
    } finally {
      setLoadingRecettes(false);
    }
  };

  const utiliserRecette = (recette) => {
    for (const it of recette.items) onAdd(meal.key, it);
    fireToast(`"${recette.nom}" ajoutée`, "green");
    setShowUseRecette(false);
  };

  const supprimerRecette = async (id) => {
    if (!confirm("Supprimer cette recette ?")) return;
    await supabase.from("recettes_personnelles").delete().eq("id", id);
    setMesRecettes((prev) => prev.filter((r) => r.id !== id));
  };
  const [copiantHier, setCopiantHier] = useState(false);
  const [showCopieModal, setShowCopieModal] = useState(false);
  const [dateACopier, setDateACopier] = useState(() => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    return hier.toISOString().slice(0, 10);
  });

  const copierDepuisDate = async () => {
    if (!profilId) return;
    setCopiantHier(true);
    try {
      const { data, error } = await supabase
        .from("repas")
        .select("*")
        .eq("profil_id", profilId)
        .eq("type_repas", meal.key)
        .eq("date", dateACopier);
      if (error) throw error;
      if (!data || data.length === 0) {
        fireToast("Aucun repas trouvé à cette date pour ce moment de la journée");
        return;
      }
      for (const row of data) {
        onAdd(meal.key, {
          nom: row.aliment,
          grams: row.grammes,
          kcal: row.kcal,
          prot: row.prot,
          gluc: row.gluc,
          lip: row.lip,
          fibres: row.fibres || 0,
          sucres: row.sucres || 0,
          sodium: row.sodium || 0,
          potassium: row.potassium || 0,
          calcium: row.calcium || 0,
          fer: row.fer || 0,
          magnesium: row.magnesium || 0,
          vitamineD: row.vitamine_d || 0,
        });
      }
      fireToast(`${data.length} aliment(s) copié(s)`, "green");
      setShowCopieModal(false);
    } catch (err) {
      console.error("Erreur copie repas:", err);
      fireToast("Erreur lors de la copie");
    } finally {
      setCopiantHier(false);
    }
  };

  const handleScan = async (barcode) => {
    setShowScanner(false);
    setSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        fireToast("Produit non reconnu — essaie la recherche manuelle");
        return;
      }
      const p = data.product;
      const n = p.nutriments || {};
      const found = {
        nom: p.product_name || "Produit scanné",
        source: p.brands || "Open Food Facts",
        kcal: n["energy-kcal_100g"] || 0,
        prot: n["proteins_100g"] || 0,
        gluc: n["carbohydrates_100g"] || 0,
        lip: n["fat_100g"] || 0,
        fibres: n["fiber_100g"] || 0,
        sucres: n["sugars_100g"] || 0,
        sodium: n["sodium_100g"] || 0,
        potassium: n["potassium_100g"] || 0,
        calcium: n["calcium_100g"] || 0,
        fer: n["iron_100g"] || 0,
        magnesium: n["magnesium_100g"] || 0,
        vitamineD: n["vitamin-d_100g"] || 0,
        poidsPortionSuggere: p.serving_quantity ? Math.round(p.serving_quantity) : null,
      };
      setSelectedFood(found);
      setSearchQuery(found.nom);
      if (found.poidsPortionSuggere) setPoidsPortion(String(found.poidsPortionSuggere));
      fireToast("Produit trouvé", "green");

      // Sauvegarde ce produit dans ta base personnelle pour le retrouver facilement au clavier la prochaine fois
      if (profilId) {
        supabase.from("aliments_scannes").upsert({
          profil_id: profilId,
          code_barre: barcode,
          nom: found.nom,
          kcal: found.kcal, prot: found.prot, gluc: found.gluc, lip: found.lip,
          fibres: found.fibres, sucres: found.sucres, sodium: found.sodium,
          potassium: found.potassium, calcium: found.calcium, fer: found.fer,
          magnesium: found.magnesium, vitamine_d: found.vitamineD,
        }, { onConflict: "profil_id,code_barre" }).then(({ error }) => {
          if (error) console.error("Erreur sauvegarde aliment scanné:", error);
        });
      }
    } catch (err) {
      console.error("Erreur scan code-barres:", err);
      fireToast("Erreur lors de la recherche du produit");
    } finally {
      setSearching(false);
    }
  };
  const [open, setOpen] = useState(false);
  const [grams, setGrams] = useState("");
  const [modeQuantite, setModeQuantite] = useState("grammes");
  const [nbPortions, setNbPortions] = useState("");
  const [poidsPortion, setPoidsPortion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualNom, setManualNom] = useState("");
  const [manualGrams, setManualGrams] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualProt, setManualProt] = useState("");
  const [manualGluc, setManualGluc] = useState("");
  const [manualLip, setManualLip] = useState("");
  const searchTimeoutRef = useRef(null);

  const totalKcal = items.reduce((a, i) => a + i.kcal, 0);

  useEffect(() => {
    if (searchQuery.trim().length < 2 || selectedFood) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [mesAlimentsRes, ciqualRes, offRes] = await Promise.all([
          profilId ? supabase.from("aliments_scannes").select("*").eq("profil_id", profilId).ilike("nom", `%${searchQuery}%`).limit(6) : Promise.resolve({ data: [] }),
          supabase.from("aliments_ciqual").select("*").ilike("nom", `%${searchQuery}%`).limit(8),
          fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=12&lc=fr`).then((r) => r.json()).catch(() => ({ products: [] })),
        ]);

        const mesAlimentsParsed = (mesAlimentsRes.data || []).map((a) => ({
          nom: a.nom,
          source: "Mes aliments",
          kcal: a.kcal || 0,
          prot: a.prot || 0,
          gluc: a.gluc || 0,
          lip: a.lip || 0,
          fibres: a.fibres || 0,
          sucres: a.sucres || 0,
          sodium: a.sodium || 0,
          potassium: a.potassium || 0,
          calcium: a.calcium || 0,
          fer: a.fer || 0,
          magnesium: a.magnesium || 0,
          vitamineD: a.vitamine_d || 0,
        }));

        const ciqualParsed = (ciqualRes.data || []).map((a) => ({
          nom: a.nom,
          source: "CIQUAL",
          kcal: a.kcal || 0,
          prot: a.prot || 0,
          gluc: a.gluc || 0,
          lip: a.lip || 0,
          fibres: a.fibres || 0,
          sucres: a.sucres || 0,
          sodium: a.sodium || 0,
          potassium: a.potassium || 0,
          calcium: a.calcium || 0,
          fer: a.fer || 0,
          magnesium: a.magnesium || 0,
          vitamineD: a.vitamine_d || 0,
        }));

        const offParsed = (offRes.products || [])
          .filter((p) => p.product_name && p.nutriments && p.nutriments["energy-kcal_100g"] != null)
          .map((p) => ({
            nom: p.product_name,
            source: p.brands || "Open Food Facts",
            kcal: p.nutriments["energy-kcal_100g"] || 0,
            prot: p.nutriments["proteins_100g"] || 0,
            gluc: p.nutriments["carbohydrates_100g"] || 0,
            lip: p.nutriments["fat_100g"] || 0,
            fibres: p.nutriments["fiber_100g"] || 0,
            sucres: p.nutriments["sugars_100g"] || 0,
            sodium: p.nutriments["sodium_100g"] || 0,
            potassium: p.nutriments["potassium_100g"] || 0,
            calcium: p.nutriments["calcium_100g"] || 0,
            fer: p.nutriments["iron_100g"] || 0,
            magnesium: p.nutriments["magnesium_100g"] || 0,
            vitamineD: p.nutriments["vitamin-d_100g"] || 0,
            poidsPortionSuggere: p.serving_quantity ? Math.round(p.serving_quantity) : null,
          }));

        // Mes aliments (déjà scannés) en premier, puis CIQUAL (référence officielle), puis Open Food Facts
        setSearchResults([...mesAlimentsParsed, ...ciqualParsed, ...offParsed]);
      } catch (err) {
        console.error("Erreur recherche aliment:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, selectedFood]);

  const add = () => {
    const f = selectedFood;
    const g = modeQuantite === "portion" ? parseFloat(nbPortions) * parseFloat(poidsPortion) : parseFloat(grams);
    if (!f || !g) return;
    const ratio = g / 100;
    onAdd(meal.key, {
      id: Date.now(),
      nom: modeQuantite === "portion" ? `${f.nom} (${nbPortions} portion${parseFloat(nbPortions) > 1 ? "s" : ""})` : f.nom,
      grams: g,
      kcal: Math.round(f.kcal * ratio),
      prot: +(f.prot * ratio).toFixed(1),
      gluc: +(f.gluc * ratio).toFixed(1),
      lip: +(f.lip * ratio).toFixed(1),
      fibres: +((f.fibres || 0) * ratio).toFixed(2),
      sucres: +((f.sucres || 0) * ratio).toFixed(2),
      sodium: +((f.sodium || 0) * ratio).toFixed(4),
      potassium: +((f.potassium || 0) * ratio).toFixed(4),
      calcium: +((f.calcium || 0) * ratio).toFixed(4),
      fer: +((f.fer || 0) * ratio).toFixed(4),
      magnesium: +((f.magnesium || 0) * ratio).toFixed(4),
      vitamineD: +((f.vitamineD || 0) * ratio).toFixed(6),
    });
    setGrams("");
    setNbPortions("");
    setPoidsPortion("");
    setSelectedFood(null);
    setSearchQuery("");
    setShowAddForm(false);
  };

  const addManual = () => {
    const nom = manualNom.trim();
    const prot = parseFloat(manualProt) || 0;
    const gluc = parseFloat(manualGluc) || 0;
    const lip = parseFloat(manualLip) || 0;
    let kcal = parseFloat(manualKcal) || 0;
    if (!kcal && (prot || gluc || lip)) {
      kcal = prot * 4 + gluc * 4 + lip * 9;
    }
    if (!nom || (!kcal && !prot && !gluc && !lip)) return;
    onAdd(meal.key, {
      id: Date.now(),
      nom,
      grams: parseFloat(manualGrams) || 0,
      kcal: Math.round(kcal),
      prot: +prot.toFixed(1),
      gluc: +gluc.toFixed(1),
      lip: +lip.toFixed(1),
      fibres: 0, sucres: 0, sodium: 0, potassium: 0, calcium: 0, fer: 0, magnesium: 0, vitamineD: 0,
    });
    setManualNom(""); setManualGrams(""); setManualKcal(""); setManualProt(""); setManualGluc(""); setManualLip("");
    setManualMode(false);
    setShowAddForm(false);
  };

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
        <button onClick={() => setOpen(!open)} style={{ flex: 1, background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{meal.emoji} {meal.nom}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{items.length} aliment(s) · {totalKcal} kcal</div>
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: "transparent", border: "none", color: C.textMuted, padding: 6 }}>
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
                <div style={{ position: "absolute", top: 32, right: 0, background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: 6, minWidth: 240, zIndex: 50, boxShadow: "0 8px 24px rgba(10,30,70,0.35)" }}>
                  <button
                    onClick={() => { setShowMenu(false); setShowCopieModal(true); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "left" }}
                  >
                    <Download size={15} color={C.blue} /> Copier un repas d'un autre jour
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowSaveRecette(true); }}
                    disabled={items.length === 0}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: items.length === 0 ? C.textDim : C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "left" }}
                  >
                    <ClipboardList size={15} color={C.blue} /> Enregistrer comme recette
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); ouvrirMesRecettes(); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "left" }}
                  >
                    <Plus size={15} color={C.blue} /> Ajouter une recette
                  </button>
                </div>
              </>
            )}
          </div>
          <ChevronDown size={18} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} onClick={() => setOpen(!open)} />
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <div
              key={it.id}
              onClick={() => { setEditingItem(it); setEditGrams(String(it.grams)); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0F1A38", border: `1.5px solid ${C.amber}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 700, lineHeight: 1.3 }}>{it.nom} <span style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 400 }}>· {it.grams}g</span></div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: FONT_MONO, marginTop: 1 }}>
                  P{it.prot}g · G{it.gluc}g · L{it.lip}g
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: C.text, fontFamily: FONT_MONO, fontWeight: 700 }}>{it.kcal}</span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(meal.key, it.id); }} style={{ background: "transparent", border: "none", color: C.red }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {editingItem && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditingItem(null)}>
              <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <SectionLabel icon={ClipboardList}>{editingItem.nom}</SectionLabel>
                  <button onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>QUANTITÉ (GRAMMES)</div>
                <input
                  type="number"
                  value={editGrams}
                  onChange={(e) => setEditGrams(e.target.value)}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO, marginBottom: 14 }}
                />
                <button
                  onClick={() => { onUpdate(meal.key, editingItem.id, parseFloat(editGrams) || editingItem.grams); setEditingItem(null); }}
                  style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}
                >
                  Enregistrer
                </button>
              </Card>
            </div>
          )}

          <button
            onClick={() => setShowAddForm(true)}
            style={{ background: "transparent", border: "none", color: C.blue, fontSize: 13.5, fontWeight: 700, textAlign: "left", padding: "4px 0" }}
          >
            + Ajouter un aliment
          </button>
        </div>
      )}
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setShowAddForm(false); setManualMode(false); setSelectedFood(null); setSearchQuery(""); }}>
          <Card style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionLabel icon={Plus}>Ajouter à {meal.nom}</SectionLabel>
              <button onClick={() => { setShowAddForm(false); setManualMode(false); setSelectedFood(null); setSearchQuery(""); }} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!manualMode ? (
            <>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedFood(null); }}
                    placeholder="🔍 Rechercher un aliment (ex : yaourt nature, whey...)"
                    style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 12.5 }}
                  />
                  <button
                    onClick={() => setShowScanner(true)}
                    style={{ background: C.blue, border: "none", borderRadius: 10, padding: "0 12px", color: "#06171F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <ScanLine size={18} />
                  </button>
                </div>
                {searching && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Recherche...</div>}
                {searchResults.length > 0 && !selectedFood && (
                  <div style={{ marginTop: 4, maxHeight: 170, overflowY: "auto", border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, background: C.surface }}>
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedFood(r); setSearchResults([]); setSearchQuery(r.nom); if (r.poidsPortionSuggere) setPoidsPortion(String(r.poidsPortionSuggere)); }}
                        style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? `1px solid ${C.cardBorderLight}` : "none", padding: "8px 10px" }}
                      >
                        <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{r.nom}</div>
                        <div style={{ fontSize: 10.5, color: C.textDim }}>
                          {Math.round(r.kcal)} kcal / 100g · <span style={{ color: r.source === "Mes aliments" ? C.amber : (r.source === "CIQUAL" ? C.green : C.blue) }}>{r.source}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedFood && (
                <div style={{ fontSize: 11.5, color: C.blue, display: "flex", alignItems: "center", gap: 6 }}>
                  <Check size={12} /> {selectedFood.nom}
                  <button onClick={() => { setSelectedFood(null); setSearchQuery(""); }} style={{ background: "transparent", border: "none", color: C.textDim, display: "flex" }}><X size={12} /></button>
                </div>
              )}

              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button onClick={() => setModeQuantite("grammes")} style={{ flex: 1, background: modeQuantite === "grammes" ? "#1E56C9" : "transparent", border: `2px solid ${modeQuantite === "grammes" ? "#00B2FF" : C.cardBorderLight}`, color: modeQuantite === "grammes" ? "#FFFFFF" : C.textMuted, borderRadius: 8, padding: "6px", fontSize: 11.5, fontWeight: 700, boxShadow: modeQuantite === "grammes" ? "0 0 12px rgba(0,178,255,0.7)" : "none" }}>
                  Grammes
                </button>
                <button onClick={() => setModeQuantite("portion")} style={{ flex: 1, background: modeQuantite === "portion" ? "#1E56C9" : "transparent", border: `2px solid ${modeQuantite === "portion" ? "#00B2FF" : C.cardBorderLight}`, color: modeQuantite === "portion" ? "#FFFFFF" : C.textMuted, borderRadius: 8, padding: "6px", fontSize: 11.5, fontWeight: 700, boxShadow: modeQuantite === "portion" ? "0 0 12px rgba(0,178,255,0.7)" : "none" }}>
                  Par portion (tranche, unité...)
                </button>
              </div>

              {modeQuantite === "grammes" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" placeholder="Quantité en grammes" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                  <button onClick={add} disabled={!selectedFood} style={{ background: selectedFood ? C.blue : C.surface, border: "none", borderRadius: 10, padding: "0 12px", color: selectedFood ? "#06171F" : C.textDim }}>
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 3 }}>NOMBRE DE PORTIONS</div>
                      <input type="number" placeholder="ex : 2" value={nbPortions} onChange={(e) => setNbPortions(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 3 }}>POIDS D'UNE PORTION (G)</div>
                      <input type="number" placeholder="ex : 25" value={poidsPortion} onChange={(e) => setPoidsPortion(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                    </div>
                  </div>
                  {nbPortions && poidsPortion && (
                    <div style={{ fontSize: 11, color: C.textDim }}>= {(parseFloat(nbPortions) * parseFloat(poidsPortion)).toFixed(0)}g au total</div>
                  )}
                  <button onClick={add} disabled={!selectedFood} style={{ background: selectedFood ? C.blue : C.surface, border: "none", borderRadius: 10, padding: "9px", color: selectedFood ? "#06171F" : C.textDim, fontWeight: 700, fontSize: 13 }}>
                    Ajouter
                  </button>
                </div>
              )}

              <button onClick={() => setManualMode(true)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 11.5, textDecoration: "underline", textAlign: "left", padding: 0 }}>
                Aliment non trouvé ? Ajouter manuellement
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="text" placeholder="Nom de l'aliment" value={manualNom} onChange={(e) => setManualNom(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }} />
              <input type="number" placeholder="Quantité en grammes (optionnel)" value={manualGrams} onChange={(e) => setManualGrams(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
              <input type="number" placeholder="Calories (kcal) — ou laisse vide" value={manualKcal} onChange={(e) => setManualKcal(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
              <div style={{ fontSize: 10.5, color: C.textDim }}>Ou renseigne les macros, les calories seront calculées automatiquement :</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder="Protéines (g)" value={manualProt} onChange={(e) => setManualProt(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 12.5, fontFamily: FONT_MONO }} />
                <input type="number" placeholder="Glucides (g)" value={manualGluc} onChange={(e) => setManualGluc(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 12.5, fontFamily: FONT_MONO }} />
                <input type="number" placeholder="Lipides (g)" value={manualLip} onChange={(e) => setManualLip(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 12.5, fontFamily: FONT_MONO }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setManualMode(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 0", color: C.textMuted, fontSize: 13, fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={addManual} style={{ flex: 1, background: C.blue, border: "none", borderRadius: 10, padding: "9px 0", color: "#06171F", fontSize: 13, fontWeight: 700 }}>
                  Ajouter
                </button>
              </div>
            </div>
          )}
            </div>
          </Card>
        </div>
      )}
      {showCopieModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCopieModal(false)}>
          <Card style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionLabel icon={Download}>Copier {meal.emoji} {meal.nom}</SectionLabel>
              <button onClick={() => setShowCopieModal(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>
              Choisis le jour à copier — tout ce qui a été mangé à ce repas ce jour-là sera ajouté à aujourd'hui.
            </div>
            <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>DATE À COPIER</div>
            <input
              type="date"
              value={dateACopier}
              max={todayIso()}
              onChange={(e) => setDateACopier(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 14 }}
            />
            <button
              onClick={copierDepuisDate}
              disabled={copiantHier}
              style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: copiantHier ? 0.6 : 1 }}
            >
              {copiantHier ? "Copie en cours..." : `Copier ${meal.nom} du ${new Date(dateACopier).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
            </button>
          </Card>
        </div>
      )}
      {showSaveRecette && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowSaveRecette(false)}>
          <Card style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionLabel icon={ClipboardList}>Enregistrer comme recette</SectionLabel>
              <button onClick={() => setShowSaveRecette(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>
              Les {items.length} aliment(s) de ce repas seront enregistrés sous ce nom, pour les réutiliser en un clic plus tard.
            </div>
            <input
              type="text"
              value={nomRecette}
              onChange={(e) => setNomRecette(e.target.value)}
              placeholder="ex : Mon petit-déj protéiné"
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 14 }}
            />
            <button
              onClick={enregistrerCommeRecette}
              disabled={savingRecette || !nomRecette.trim()}
              style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: savingRecette || !nomRecette.trim() ? 0.6 : 1 }}
            >
              {savingRecette ? "Enregistrement..." : "Enregistrer"}
            </button>
          </Card>
        </div>
      )}
      {showUseRecette && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowUseRecette(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "75vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionLabel icon={ClipboardList}>Mes recettes · {meal.nom}</SectionLabel>
              <button onClick={() => setShowUseRecette(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            {loadingRecettes ? (
              <div style={{ color: C.textMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
            ) : mesRecettes.length === 0 ? (
              <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 10 }}>
                Aucune recette enregistrée pour ce repas. Utilise "Enregistrer comme recette" une fois que tu as ajouté des aliments.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mesRecettes.map((r) => (
                  <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => utiliserRecette(r)} style={{ flex: 1, background: "transparent", border: "none", textAlign: "left" }}>
                      <div style={{ fontSize: 13.5, color: C.text, fontWeight: 700 }}>{r.nom}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{r.items.length} aliment(s) · {r.items.reduce((s, it) => s + it.kcal, 0)} kcal</div>
                    </button>
                    <button onClick={() => supprimerRecette(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
      {showScanner && <ScannerCodeBarres onClose={() => setShowScanner(false)} onScan={handleScan} />}
    </Card>
  );
}

function CoursesEtSupplements({ profilId, fireToast }) {
  const [listeCourse, setListeCourse] = useState(null);
  const [supplements, setSupplements] = useState([]);
  const [showChoix, setShowChoix] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [showSupplements, setShowSupplements] = useState(false);
  const [cochees, setCochees] = useState({});

  useEffect(() => {
    if (!profilId) return;
    supabase.from("listes_courses").select("*").order("updated_at", { ascending: false }).limit(1)
      .then(({ data }) => setListeCourse(data && data[0] ? data[0] : null));
    supabase.from("listes_supplements").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setSupplements(data || []));
  }, [profilId]);

  const toggleCoche = (item) => {
    setCochees((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowChoix(!showChoix)}
        style={{
          width: 38, height: 38, borderRadius: "50%",
          background: C.blue, border: `2px solid ${C.cardBorderLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 10px rgba(0,178,255,0.5), 0 4px 12px rgba(10,30,70,0.35)",
        }}
      >
        <ShoppingCart size={17} color="#06171F" />
      </button>

      {showChoix && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={() => setShowChoix(false)} />
          <div style={{ position: "absolute", top: 46, right: 0, background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: 6, minWidth: 160, boxShadow: "0 8px 24px rgba(10,30,70,0.35)" }}>
            <button
              onClick={() => { setShowCourses(true); setShowChoix(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "left" }}
            >
              <ShoppingCart size={15} color={C.blue} /> Courses
              {listeCourse && <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 11 }}>{(listeCourse.items || []).length}</span>}
            </button>
            <button
              onClick={() => { setShowSupplements(true); setShowChoix(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "left" }}
            >
              <Pill size={15} color={C.blue} /> Suppléments
              {supplements.length > 0 && <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 11 }}>{supplements.length}</span>}
            </button>
          </div>
        </>
      )}

      {showCourses && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCourses(false)}>
          <Card style={{ width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionLabel icon={ShoppingCart}>Liste de courses</SectionLabel>
              <button onClick={() => setShowCourses(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            {!listeCourse || (listeCourse.items || []).length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Ton coach ne t'a pas encore envoyé de liste de courses</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {listeCourse.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => toggleCoche(item)}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${C.blue}`, background: cochees[item] ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {cochees[item] && <Check size={12} color="#FFFFFF" />}
                    </div>
                    <span style={{ fontSize: 13, color: C.text, textDecoration: cochees[item] ? "line-through" : "none", opacity: cochees[item] ? 0.5 : 1 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {showSupplements && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowSupplements(false)}>
          <Card style={{ width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionLabel icon={Pill}>Suppléments recommandés</SectionLabel>
              <button onClick={() => setShowSupplements(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            {supplements.length === 0 ? (
              <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Ton coach n'a pas encore recommandé de supplément</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {supplements.map((s) => (
                  <a
                    key={s.id}
                    href={s.lien || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, borderRadius: 10, padding: "10px 12px", textDecoration: "none", cursor: s.lien ? "pointer" : "default" }}
                  >
                    <Pill size={16} color={C.blue} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{s.nom}</div>
                      {s.note && <div style={{ fontSize: 11, color: C.textDim }}>{s.note}</div>}
                    </div>
                    {s.lien && <ChevronRight size={16} color={C.textMuted} />}
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Nutrition({ meals, onAdd, onRemove, onUpdate, objectifs, profilId, fireToast, saveObjectifsNutrition, eauVerres, onChangeWater }) {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showNutriDetail, setShowNutriDetail] = useState(false);
  const totals = useMemo(() => {
    const all = Object.values(meals).flat();
    return all.reduce(
      (a, i) => ({
        kcal: a.kcal + i.kcal,
        prot: a.prot + i.prot,
        gluc: a.gluc + i.gluc,
        lip: a.lip + i.lip,
        fibres: a.fibres + (i.fibres || 0),
        sucres: a.sucres + (i.sucres || 0),
        sodium: a.sodium + (i.sodium || 0),
        potassium: a.potassium + (i.potassium || 0),
        calcium: a.calcium + (i.calcium || 0),
        fer: a.fer + (i.fer || 0),
        magnesium: a.magnesium + (i.magnesium || 0),
        vitamineD: a.vitamineD + (i.vitamineD || 0),
      }),
      { kcal: 0, prot: 0, gluc: 0, lip: 0, fibres: 0, sucres: 0, sodium: 0, potassium: 0, calcium: 0, fer: 0, magnesium: 0, vitamineD: 0 }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 38, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textOnBgMuted, fontWeight: 700 }}>Aujourd'hui</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.textOnBg }}>Nutrition</div>
        </div>
        <CoursesEtSupplements profilId={profilId} fireToast={fireToast} />
      </div>

      <Card style={{ background: `radial-gradient(circle at 80% 0%, ${C.blueSoft}, ${C.card} 60%)`, cursor: "pointer" }} onClick={() => setShowNutriDetail(true)}>
        <SectionLabel icon={Flame}>Calories</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
          <div style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r="44" fill="none" stroke={C.cardBorderLight} strokeWidth="10" />
              <circle
                cx="52" cy="52" r="44" fill="none" stroke={C.blue} strokeWidth="10"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 - Math.min(1, totals.kcal / (objectifs.kcal || 1)) * 2 * Math.PI * 44}
                strokeLinecap="round" transform="rotate(-90 52 52)"
                style={{ transition: "stroke-dashoffset .4s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.text, fontWeight: 700, lineHeight: 1 }}>{Math.round(totals.kcal)}</div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>kcal</div>
            </div>
          </div>
          <div>
            <div onClick={(e) => { e.stopPropagation(); setShowGoalEditor(true); }} style={{ fontSize: 14, color: C.textMuted, cursor: "pointer", textDecoration: "underline dashed" }}>
              Objectif : {Math.round(objectifs.kcal)} kcal
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
              {totals.kcal <= objectifs.kcal
                ? `${Math.round(objectifs.kcal - totals.kcal)} kcal restantes`
                : `${Math.round(totals.kcal - objectifs.kcal)} kcal dépassées`}
            </div>
            <div style={{ fontSize: 11, color: C.blue, marginTop: 6 }}>Voir détails →</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {macro("Protéines", totals.prot, Math.round((objectifs.kcal * objectifs.pctProt / 100) / 4), C.blue)}
          {macro("Glucides", totals.gluc, Math.round((objectifs.kcal * objectifs.pctGluc / 100) / 4), C.green)}
          {macro("Lipides", totals.lip, Math.round((objectifs.kcal * objectifs.pctLip / 100) / 9), C.amber)}
        </div>
      </Card>

      <div>
        <SectionLabel icon={Apple} onBg>Repas</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MEAL_DEFS.map((m) => (
            <MealCard key={m.key} meal={m} items={meals[m.key]} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} fireToast={fireToast} profilId={profilId} />
          ))}
        </div>
      </div>

      <Card>
        <SectionLabel icon={Droplet}>Eau</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700 }}>
              {eauVerres * 50} <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400 }}>cl</span>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
              {eauVerres} verre{eauVerres > 1 ? "s" : ""} · 50 cl / verre
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {eauVerres > 0 && (
              <button
                onClick={() => onChangeWater(-1)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted }}
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => onChangeWater(1)}
              style={{ width: 38, height: 38, borderRadius: "50%", background: C.blue, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={18} color="#06171F" />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {Array.from({ length: Math.max(eauVerres, 6) }).map((_, i) => (
            <svg key={i} width="18" height="26" viewBox="0 0 18 26">
              <path
                d="M2 2 H16 L13.5 24 H4.5 Z"
                fill={i < eauVerres ? C.blue : "none"}
                stroke={i < eauVerres ? C.blue : C.cardBorderLight}
                strokeWidth="1.5"
              />
            </svg>
          ))}
        </div>
      </Card>

      {showNutriDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowNutriDetail(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionLabel icon={Flame}>Détail nutritionnel du jour</SectionLabel>
              <button onClick={() => setShowNutriDetail(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Macronutriments</div>
              {[
                ["Calories", Math.round(totals.kcal), "kcal"],
                ["Protéines", totals.prot.toFixed(1), "g"],
                ["Glucides", totals.gluc.toFixed(1), "g"],
                ["Lipides", totals.lip.toFixed(1), "g"],
              ].map(([label, val, unit]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", background: C.surface, borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textMuted }}>{val} {unit}</span>
                </div>
              ))}
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 }}>Autres nutriments</div>
              {[
                ["Fibres", totals.fibres.toFixed(1), "g"],
                ["Sucres", totals.sucres.toFixed(1), "g"],
                ["Sodium", (totals.sodium * 1000).toFixed(0), "mg"],
                ["Potassium", (totals.potassium * 1000).toFixed(0), "mg"],
              ].map(([label, val, unit]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", background: C.surface, borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textMuted }}>{val} {unit}</span>
                </div>
              ))}
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 }}>Minéraux & vitamines</div>
              {[
                ["Calcium", (totals.calcium * 1000).toFixed(0), "mg"],
                ["Fer", (totals.fer * 1000).toFixed(1), "mg"],
                ["Magnésium", (totals.magnesium * 1000).toFixed(0), "mg"],
                ["Vitamine D", (totals.vitamineD * 1000000).toFixed(1), "µg"],
              ].map(([label, val, unit]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", background: C.surface, borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.textMuted }}>{val} {unit}</span>
                </div>
              ))}
              <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 4 }}>
                Ces valeurs dépendent des données disponibles pour chaque aliment renseigné (base Open Food Facts) — certains produits peuvent avoir des informations incomplètes, et les aliments ajoutés manuellement n'incluent pas ces détails.
              </div>
            </div>
          </Card>
        </div>
      )}
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
function PhotoTile({ cat, url, onChange, uploading }) {
  const ref = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);
  const displayUrl = localPreview || url;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={() => ref.current && ref.current.click()}
        style={{
          width: "100%", aspectRatio: "3/4", borderRadius: 14,
          border: `1.5px dashed ${displayUrl ? C.blue : C.cardBorderLight}`,
          background: displayUrl ? `url(${displayUrl}) center/cover` : C.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        {!displayUrl && <Camera size={22} color={C.textDim} />}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,12,17,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 10, color: C.text, fontWeight: 700 }}>Envoi...</div>
          </div>
        )}
        {displayUrl && !uploading && (
          <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(10,12,17,0.7)", borderRadius: "50%", padding: 5 }}>
            <Check size={12} color={C.green} />
          </div>
        )}
      </button>
      <input
        ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) {
            setLocalPreview(URL.createObjectURL(f));
            onChange(cat.key, f);
          }
        }}
      />
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

function PhotoProfilObligatoireModal({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    await onUpload(file);
    setUploading(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, background: "rgba(5,6,9,0.6)",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <SectionLabel icon={Camera}>Ta photo de profil</SectionLabel>
        <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 20 }}>
          Ajoute une photo de ton visage pour que ton coach puisse te reconnaître facilement.
        </div>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          disabled={uploading}
          style={{
            width: 140, height: 140, borderRadius: "50%", margin: "0 auto 20px",
            background: preview ? `url(${preview}) center/cover` : C.surface,
            border: `2px dashed ${preview ? C.blue : C.cardBorderLight}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!preview && <Camera size={30} color={C.textDim} />}
        </button>
        <input
          ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          disabled={uploading}
          style={{
            width: "100%", background: C.blue, border: "none",
            color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800,
            fontSize: 14, opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "Envoi..." : preview ? "Changer la photo" : "Choisir une photo"}
        </button>
      </Card>
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

function Bilans({ weightHistory, addWeightEntry, photosHistory, uploadPhotoBilan, uploadingPhotoKey, checkins, addCheckin, mensurationsHistory, addMensuration }) {
  const [newWeight, setNewWeight] = useState("");
  const [showPhotoHistory, setShowPhotoHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const photosActuelles = useMemo(() => {
    const moisEnCours = todayIso().slice(0, 7);
    const latest = {};
    for (const p of photosHistory) {
      if (p.mois !== moisEnCours) continue;
      if (!latest[p.categorie]) latest[p.categorie] = p.url;
    }
    return latest;
  }, [photosHistory]);

  const photosParMois = useMemo(() => {
    const groups = {};
    for (const p of photosHistory) {
      const monthKey = p.date.slice(0, 7); // YYYY-MM
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(p);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [photosHistory]);

  const formatMonthLabel = (monthKey) => {
    const [y, m] = monthKey.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
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
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textOnBgMuted, fontWeight: 600 }}>Suivi</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.textOnBg }}>Bilans</div>
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
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textDim }} axisLine={false} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: C.textDim }} axisLine={false} tickLine={false} width={30} />
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

          <button onClick={submitCheckin} style={{ background: C.blue, border: "none", color: "#02071A", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Send size={15} /> Envoyer le bilan de semaine
          </button>
        </div>
      </Card>

      {/* Photos */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel icon={Camera}>Bilan photo</SectionLabel>
          {photosHistory.length > 0 && (
            <button onClick={() => setShowPhotoHistory(true)} style={{ background: "transparent", border: "none", color: C.blue, fontSize: 12, fontWeight: 700 }}>
              Historique
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {PHOTO_CATS.map((c) => (
            <PhotoTile
              key={c.key}
              cat={c}
              url={photosActuelles[c.key]}
              uploading={uploadingPhotoKey === c.key}
              onChange={(k, file) => uploadPhotoBilan(k, file)}
            />
          ))}
        </div>
      </Card>

      {showPhotoHistory && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 130, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setShowPhotoHistory(false); setSelectedMonth(null); }}
        >
          <Card style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            {!selectedMonth ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionLabel icon={Camera}>Historique par mois</SectionLabel>
                  <button onClick={() => setShowPhotoHistory(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {photosParMois.map(([monthKey, photosOfMonth]) => (
                    <button
                      key={monthKey}
                      onClick={() => setSelectedMonth(monthKey)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: "12px 14px" }}
                    >
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{formatMonthLabel(monthKey)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 12 }}>
                        {photosOfMonth.length} photo{photosOfMonth.length > 1 ? "s" : ""} <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <button onClick={() => setSelectedMonth(null)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> {formatMonthLabel(selectedMonth)}
                  </button>
                  <button onClick={() => { setShowPhotoHistory(false); setSelectedMonth(null); }} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {photosParMois.find(([k]) => k === selectedMonth)[1].map((p) => (
                    <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 10, background: `url(${p.url}) center/cover`, border: `1px solid ${C.cardBorderLight}` }} />
                      <div style={{ fontSize: 9.5, color: C.textDim, textAlign: "center" }}>
                        {PHOTO_CATS.find((c) => c.key === p.categorie)?.nom || p.categorie} · {formatDateDisplay(p.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <MensurationsCard mensurationsHistory={mensurationsHistory} addMensuration={addMensuration} />

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

function MensurationsCard({ mensurationsHistory, addMensuration }) {
  const emptyForm = {
    tourTaille: "", tourPoitrine: "", tourEpaule: "",
    tourBrasDroit: "", tourBrasGauche: "",
    tourAvantBrasDroit: "", tourAvantBrasGauche: "",
    tourCuisseDroite: "", tourCuisseGauche: "",
    tourMolletDroit: "", tourMolletGauche: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const champs = [
    { key: "tourTaille", label: "Tour de taille" },
    { key: "tourPoitrine", label: "Tour de poitrine" },
    { key: "tourEpaule", label: "Tour d'épaule" },
    { key: "tourBrasDroit", label: "Tour de bras droit" },
    { key: "tourBrasGauche", label: "Tour de bras gauche" },
    { key: "tourAvantBrasDroit", label: "Tour d'avant-bras droit" },
    { key: "tourAvantBrasGauche", label: "Tour d'avant-bras gauche" },
    { key: "tourCuisseDroite", label: "Tour de cuisse droite" },
    { key: "tourCuisseGauche", label: "Tour de cuisse gauche" },
    { key: "tourMolletDroit", label: "Tour de mollet droit" },
    { key: "tourMolletGauche", label: "Tour de mollet gauche" },
  ];

  const submit = () => {
    if (!champs.some((c) => form[c.key])) return;
    addMensuration(form);
    setForm(emptyForm);
  };

  const derniere = mensurationsHistory && mensurationsHistory.length > 0 ? mensurationsHistory[mensurationsHistory.length - 1] : null;

  const parMois = useMemo(() => {
    const groups = {};
    for (const m of (mensurationsHistory || [])) {
      if (!m.dateRaw) continue;
      const monthKey = m.dateRaw.slice(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(m);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [mensurationsHistory]);

  const formatMonthLabelLocal = (monthKey) => {
    const [y, mo] = monthKey.split("-");
    const d = new Date(Number(y), Number(mo) - 1, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel icon={Target}>Mensurations</SectionLabel>
        {mensurationsHistory && mensurationsHistory.length > 0 && (
          <button onClick={() => setShowHistory(true)} style={{ background: "transparent", border: "none", color: C.blue, fontSize: 12, fontWeight: 700 }}>
            Historique
          </button>
        )}
      </div>
      {derniere && (
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12 }}>Dernière saisie : {derniere.date}</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {champs.map((c) => (
          <div key={c.key}>
            <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>{c.label} (cm)</div>
            <input
              type="number"
              value={form[c.key]}
              onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
              placeholder={derniere ? String(derniere[c.key] ?? "") : "—"}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }}
            />
          </div>
        ))}
      </div>
      <button onClick={submit} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}>
        Enregistrer mes mensurations
      </button>

      {mensurationsHistory && mensurationsHistory.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {mensurationsHistory.slice().reverse().slice(0, 5).map((m, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, fontSize: 11.5, color: C.textMuted }}>
              <span style={{ color: C.text, fontWeight: 700 }}>{m.date}</span> — taille {m.tourTaille ?? "—"}cm, poitrine {m.tourPoitrine ?? "—"}cm, bras D/G {m.tourBrasDroit ?? "—"}/{m.tourBrasGauche ?? "—"}cm, cuisse D/G {m.tourCuisseDroite ?? "—"}/{m.tourCuisseGauche ?? "—"}cm
            </div>
          ))}
        </div>
      )}

      {showHistory && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 130, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setShowHistory(false); setSelectedMonth(null); }}
        >
          <Card style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            {!selectedMonth ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionLabel icon={Target}>Historique par mois</SectionLabel>
                  <button onClick={() => setShowHistory(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {parMois.map(([monthKey, entries]) => (
                    <button
                      key={monthKey}
                      onClick={() => setSelectedMonth(monthKey)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: "12px 14px" }}
                    >
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{formatMonthLabelLocal(monthKey)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 12 }}>
                        {entries.length} saisie{entries.length > 1 ? "s" : ""} <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <button onClick={() => setSelectedMonth(null)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> {formatMonthLabelLocal(selectedMonth)}
                  </button>
                  <button onClick={() => { setShowHistory(false); setSelectedMonth(null); }} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {parMois.find(([k]) => k === selectedMonth)[1].map((m, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, fontSize: 12, color: C.textMuted }}>
                      <div style={{ color: C.text, fontWeight: 700, marginBottom: 4 }}>{m.date}</div>
                      <div>Taille {m.tourTaille ?? "—"}cm · Poitrine {m.tourPoitrine ?? "—"}cm · Épaule {m.tourEpaule ?? "—"}cm</div>
                      <div>Bras D/G {m.tourBrasDroit ?? "—"}/{m.tourBrasGauche ?? "—"}cm · Avant-bras D/G {m.tourAvantBrasDroit ?? "—"}/{m.tourAvantBrasGauche ?? "—"}cm</div>
                      <div>Cuisse D/G {m.tourCuisseDroite ?? "—"}/{m.tourCuisseGauche ?? "—"}cm · Mollet D/G {m.tourMolletDroit ?? "—"}/{m.tourMolletGauche ?? "—"}cm</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  PROFIL                                                             */
/* ------------------------------------------------------------------ */
const Field = ({ label, children }) => (
  <div>
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`,
  borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14,
};

function Profil({ user, setUser, fireToast, onSave, documentsRecus, notificationsRecues, onMarquerNotifLue, onChangePhoto, onEnableNotifs }) {
  const set = (k) => (e) => setUser({ ...user, [k]: e.target.value });
  const photoFileRef = useRef(null);
  const [showPolitique, setShowPolitique] = useState(false);
  const [showCGU, setShowCGU] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() =>
    (typeof window !== "undefined" && "Notification" in window) ? Notification.permission : "unsupported"
  );

  const handleEnableNotifs = async () => {
    await onEnableNotifs();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => photoFileRef.current && photoFileRef.current.click()}
          style={{
            width: 62, height: 62, borderRadius: "50%",
            background: user.photoUrl ? `url(${user.photoUrl}) center/cover` : C.blueSoft,
            border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, position: "relative", overflow: "hidden",
          }}
        >
          {!user.photoUrl && <User size={26} color={C.blue} />}
        </button>
        <input ref={photoFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f && onChangePhoto) onChangePhoto(f); }} />
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.textOnBg }}>{user.prenom} {user.nom}</div>
          <div style={{ fontSize: 12, color: C.textOnBgMuted }}>{user.age} ans · {user.taille} cm</div>
        </div>
      </div>

      {notificationsRecues && notificationsRecues.length > 0 && (
        <Card>
          <SectionLabel icon={Bell}>Notifications</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notificationsRecues.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.lu && onMarquerNotifLue(n.id)}
                style={{ background: n.lu ? C.surface : C.blueSoft, border: `1px solid ${n.lu ? C.cardBorderLight : C.blueBorder}`, borderRadius: 10, padding: 10, cursor: n.lu ? "default" : "pointer" }}
              >
                <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{n.titre}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{n.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {documentsRecus && documentsRecus.length > 0 && (
        <Card>
          <SectionLabel icon={FileText}>Documents de ton coach</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {documentsRecus.map((d) => (
              <a key={d.id} href={d.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, textDecoration: "none" }}>
                <FileText size={16} color={C.blue} />
                <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600 }}>{d.nom}</span>
                <Download size={15} color={C.textMuted} />
              </a>
            ))}
          </div>
        </Card>
      )}

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

      {onEnableNotifs && (
        <Card>
          <SectionLabel icon={Bell}>Notifications push</SectionLabel>
          {notifPermission === "granted" ? (
            <div style={{ fontSize: 13, color: C.green, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <CheckCircle2 size={15} /> Notifications activées
            </div>
          ) : notifPermission === "denied" ? (
            <>
              <div style={{ fontSize: 12.5, color: C.red, marginBottom: 10, fontWeight: 600 }}>
                Tu as refusé les notifications. Pour les réactiver, c'est à faire manuellement dans les réglages :
              </div>
              <div style={{ fontSize: 11.5, color: C.textMuted, background: C.surface, borderRadius: 10, padding: 12, lineHeight: 1.6 }}>
                <strong style={{ color: C.text }}>Sur iPhone :</strong> Réglages → Safari (ou l'app installée) → Notifications<br />
                <strong style={{ color: C.text }}>Sur Android/Chrome :</strong> appuie sur le 🔒 à côté de l'adresse → Autorisations → Notifications<br />
                <strong style={{ color: C.text }}>Sur ordinateur :</strong> clique l'icône à gauche de l'adresse du site → Notifications → Autoriser
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                Reçois une alerte sur ton téléphone quand ton coach t'envoie un message, même app fermée.
              </div>
              <button
                onClick={handleEnableNotifs}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13.5 }}
              >
                Activer les notifications
              </button>
            </>
          )}
        </Card>
      )}

      <button onClick={onSave} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14 }}>
        Enregistrer les modifications
      </button>

      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={() => setShowPolitique(true)}
          style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12.5, textDecoration: "underline", padding: "6px 0" }}
        >
          Politique de confidentialité
        </button>
        <button
          onClick={() => setShowCGU(true)}
          style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12.5, textDecoration: "underline", padding: "6px 0" }}
        >
          CGU
        </button>
      </div>

      {showPolitique && <PolitiqueConfidentialiteModal onClose={() => setShowPolitique(false)} />}
      {showCGU && <CGUModal onClose={() => setShowCGU(false)} />}
    </div>
  );
}

const POLITIQUE_SECTIONS = [
  {
    titre: "1. Qui sommes-nous ?",
    corps: `CoWave est une application de coaching sportif et nutritionnel.

Éditeur : CoWave
Contact : cowave.contact@gmail.com

CoWave est actuellement édité à titre individuel, en cours de constitution en micro-entreprise (les informations légales complètes — SIRET, adresse du siège — seront ajoutées ici dès leur obtention).

Dans ce document, "nous" désigne l'éditeur de l'application, "vous" désigne toute personne utilisant l'application (coach ou client).`,
  },
  {
    titre: "2. Quelles données collectons-nous ?",
    corps: `Données de compte : prénom, nom, email, mot de passe (chiffré), âge, taille, rôle (coach ou client).

Données de santé et de suivi : poids et historique, mensurations corporelles, photos corporelles envoyées pour le suivi visuel, données nutritionnelles, bilans hebdomadaires (force, satisfaction, sommeil, motivation, douleurs), check-in quotidien (fatigue, sommeil, énergie).

Données d'activité : séances réalisées, charges et répétitions, objectifs sportifs et nutritionnels, documents partagés par le coach, messages et notifications.

Données techniques : informations de connexion à des fins de sécurité, abonnement aux notifications push si activées.`,
  },
  {
    titre: "3. Pourquoi collectons-nous ces données ?",
    corps: `Ces données sont utilisées exclusivement pour vous fournir le service de coaching, permettre à votre coach de suivre votre progression, assurer le fonctionnement technique de l'application, et l'améliorer.

Nous ne vendons jamais vos données à des tiers, et ne les utilisons jamais à des fins publicitaires.`,
  },
  {
    titre: "4. Base légale du traitement",
    corps: `Le traitement de vos données repose sur l'exécution du contrat qui vous lie à votre coach, votre consentement explicite pour les données de santé (que vous pouvez retirer à tout moment), et notre intérêt légitime pour les aspects techniques (sécurité, prévention de la fraude).`,
  },
  {
    titre: "5. Qui a accès à vos données ?",
    corps: `Vous-même, pour vos propres données. Votre coach, pour les données des clients qu'il suit.

Nos sous-traitants techniques : Supabase (base de données, authentification, fichiers), Vercel (hébergement), Open Food Facts (base publique d'aliments, aucune donnée personnelle ne lui est transmise), les fournisseurs de notifications push de votre navigateur.

Nous ne partageons vos données avec aucun autre tiers, jamais à des fins commerciales ou publicitaires.`,
  },
  {
    titre: "6. Combien de temps conservons-nous vos données ?",
    corps: `Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont supprimées dans un délai raisonnable, sauf obligation légale de conservation plus longue.`,
  },
  {
    titre: "7. Vos droits",
    corps: `Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité et d'opposition sur vos données, notamment vos données de santé.

Pour exercer l'un de ces droits, contactez-nous à : cowave.contact@gmail.com

Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.`,
  },
  {
    titre: "8. Sécurité de vos données",
    corps: `Chaque utilisateur ne peut accéder qu'à ses propres données, et chaque coach uniquement aux données de ses propres clients. Les mots de passe sont chiffrés, jamais stockés en clair. Les connexions sont sécurisées (HTTPS).`,
  },
  {
    titre: "9. Utilisateurs mineurs",
    corps: `L'application n'est pas destinée aux personnes de moins de 15 ans. Entre 15 et 18 ans, l'utilisation nécessite l'accord du coach et, le cas échéant, du représentant légal.`,
  },
  {
    titre: "10. Cookies et stockage local",
    corps: `L'application utilise le stockage local de votre navigateur à des fins strictement techniques : conserver la progression d'une séance en cours (chrono, séries validées). Ces données restent sur votre appareil et ne sont pas transmises à des tiers.`,
  },
  {
    titre: "11. Modification de cette politique",
    corps: `Cette politique peut être mise à jour. En cas de modification substantielle, vous en serez informé via l'application.`,
  },
];

function PolitiqueConfidentialiteModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>Politique de confidentialité</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {POLITIQUE_SECTIONS.map((s) => (
            <div key={s.titre}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.titre}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted, whiteSpace: "pre-line", lineHeight: 1.6 }}>{s.corps}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>
          Fermer
        </button>
      </Card>
    </div>
  );
}

const CGU_SECTIONS = [
  {
    titre: "Article 1 — Objet",
    corps: `Les présentes Conditions Générales d'Utilisation (les « CGU ») définissent les modalités et conditions d'utilisation de l'application CoWave, ainsi que les droits et obligations des utilisateurs.

CoWave permet à un coach sportif de suivre ses clients : programmes d'entraînement personnalisés, suivi nutritionnel, bilans réguliers, suivi de poids et de mensurations, échange de documents et de notifications.

Toute utilisation de l'application implique l'acceptation pleine et entière des présentes CGU.`,
  },
  {
    titre: "Article 2 — Accès à l'application",
    corps: `L'accès se fait exclusivement par la création d'un compte, à l'initiative du coach (pour lui-même ou pour ses clients). Il n'existe pas d'inscription libre : chaque client reçoit ses identifiants directement de son coach, qui reste responsable de leur bonne transmission.

Chaque utilisateur est responsable de la confidentialité de ses identifiants.`,
  },
  {
    titre: "Article 3 — Rôles et responsabilités",
    corps: `Le coach est responsable de l'exactitude des informations qu'il renseigne, de la pertinence des programmes et conseils qu'il transmet, de la confidentialité des données de ses clients, et du respect du secret professionnel applicable à son activité.

Le client s'engage à fournir des informations exactes, à utiliser l'application à des fins personnelles, et à informer son coach de toute évolution de son état de santé pouvant affecter la pertinence des recommandations reçues.`,
  },
  {
    titre: "Article 4 — Avertissement santé",
    corps: `CoWave n'est pas un dispositif médical et ne délivre aucun avis, diagnostic ou traitement médical.

Les programmes et recommandations proposés relèvent de la seule responsabilité du coach, dans le cadre de son activité professionnelle. Il est recommandé à tout utilisateur présentant des antécédents médicaux ou troubles particuliers de consulter un professionnel de santé avant de suivre un programme.

L'éditeur décline toute responsabilité quant aux conséquences résultant du suivi des recommandations formulées par un coach via l'application.`,
  },
  {
    titre: "Article 5 — Disponibilité de l'application",
    corps: `L'éditeur s'efforce d'assurer une disponibilité continue, sans garantie de fonctionnement ininterrompu. Des interruptions peuvent survenir pour maintenance ou pour des raisons indépendantes de sa volonté.`,
  },
  {
    titre: "Article 6 — Propriété intellectuelle",
    corps: `L'application, son contenu et son design sont protégés par le droit de la propriété intellectuelle. Les programmes et contenus créés par un coach pour ses clients restent la propriété du coach qui les a créés.`,
  },
  {
    titre: "Article 7 — Suppression de compte",
    corps: `Un compte peut être supprimé à la demande du client, du coach, ou par l'éditeur en cas de non-respect des présentes CGU. La suppression entraîne l'effacement des données associées, dans les conditions décrites dans la politique de confidentialité.`,
  },
  {
    titre: "Article 8 — Responsabilité de l'éditeur",
    corps: `L'éditeur met tout en œuvre pour assurer la sécurité et le bon fonctionnement de l'application, sans pouvoir garantir l'absence totale d'erreurs ou d'interruptions.

L'éditeur ne saurait être tenu responsable des contenus ou recommandations transmis par un coach à ses clients, d'une mauvaise utilisation de l'application, ou de dommages indirects résultant de son utilisation.`,
  },
  {
    titre: "Article 9 — Droit applicable",
    corps: `Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français compétents seront seuls saisis.

Pour toute question : cowave.contact@gmail.com`,
  },
];

function CGUModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>Conditions Générales d'Utilisation</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CGU_SECTIONS.map((s) => (
            <div key={s.titre}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.titre}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted, whiteSpace: "pre-line", lineHeight: 1.6 }}>{s.corps}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>
          Fermer
        </button>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AUTH & COACH                                                       */
/* ------------------------------------------------------------------ */
const appShellStyle = {
  minHeight: "100vh",
  width: "100%",
  background: C.bg,
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

function SideMenu({ viewMode, setViewMode, onLogout, showViewToggle, coachTab, setCoachTab, tachesEnAttenteCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [outilsOuvert, setOutilsOuvert] = useState(false);
  const [alimentationOuvert, setAlimentationOuvert] = useState(false);
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
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>Menu</div>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}>
                <X size={18} />
              </button>
            </div>

            {showViewToggle && (
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Affichage
                </div>
                <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            )}

            {viewMode === "coach" && coachTab && setCoachTab && (
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Navigation
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    onClick={() => { setCoachTab("dashboard"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "dashboard" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "dashboard" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <LayoutDashboard size={16} /> Tableau de bord
                  </button>
                  <button
                    onClick={() => { setCoachTab("clients"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "clients" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "clients" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <User size={16} /> Client
                  </button>
                  <button
                    onClick={() => { setCoachTab("taches"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "taches" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "taches" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <ClipboardList size={16} /> Tâches
                    {tachesEnAttenteCount > 0 && (
                      <span style={{ marginLeft: "auto", background: C.red, color: "#FFFFFF", fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "2px 7px" }}>
                        {tachesEnAttenteCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setCoachTab("programmes"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "programmes" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "programmes" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <Dumbbell size={16} /> Programmes
                  </button>
                  <button
                    onClick={() => setAlimentationOuvert(!alimentationOuvert)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: (coachTab === "alimentation-recettes" || coachTab === "alimentation-courses" || coachTab === "alimentation-supplements") ? C.blueSoft : "transparent", border: "none",
                      color: (coachTab === "alimentation-recettes" || coachTab === "alimentation-courses" || coachTab === "alimentation-supplements") ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <Apple size={16} /> Alimentation
                    <ChevronDown size={14} style={{ marginLeft: "auto", transform: alimentationOuvert ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </button>
                  {alimentationOuvert && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 14, borderLeft: `1px solid ${C.cardBorderLight}`, marginLeft: 12 }}>
                      <button
                        onClick={() => { setCoachTab("alimentation-recettes"); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                          background: coachTab === "alimentation-recettes" ? C.blueSoft : "transparent", border: "none",
                          color: coachTab === "alimentation-recettes" ? C.blue : C.textMuted, fontWeight: 600, fontSize: 12.5,
                        }}
                      >
                        <ClipboardList size={14} /> Recettes
                      </button>
                      <button
                        onClick={() => { setCoachTab("alimentation-courses"); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                          background: coachTab === "alimentation-courses" ? C.blueSoft : "transparent", border: "none",
                          color: coachTab === "alimentation-courses" ? C.blue : C.textMuted, fontWeight: 600, fontSize: 12.5,
                        }}
                      >
                        <ShoppingCart size={14} /> Liste de courses
                      </button>
                      <button
                        onClick={() => { setCoachTab("alimentation-supplements"); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                          background: coachTab === "alimentation-supplements" ? C.blueSoft : "transparent", border: "none",
                          color: coachTab === "alimentation-supplements" ? C.blue : C.textMuted, fontWeight: 600, fontSize: 12.5,
                        }}
                      >
                        <Pill size={14} /> Suppléments
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setOutilsOuvert(!outilsOuvert)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: (coachTab === "outils-drive" || coachTab === "outils-automatisation") ? C.blueSoft : "transparent", border: "none",
                      color: (coachTab === "outils-drive" || coachTab === "outils-automatisation") ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <Wrench size={16} /> Outils
                    <ChevronDown size={14} style={{ marginLeft: "auto", transform: outilsOuvert ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </button>
                  {outilsOuvert && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 14, borderLeft: `1px solid ${C.cardBorderLight}`, marginLeft: 12 }}>
                      <button
                        onClick={() => { setCoachTab("outils-drive"); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                          background: coachTab === "outils-drive" ? C.blueSoft : "transparent", border: "none",
                          color: coachTab === "outils-drive" ? C.blue : C.textMuted, fontWeight: 600, fontSize: 12.5,
                        }}
                      >
                        <FileText size={14} /> Drive
                      </button>
                      <button
                        onClick={() => { setCoachTab("outils-automatisation"); setOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                          background: coachTab === "outils-automatisation" ? C.blueSoft : "transparent", border: "none",
                          color: coachTab === "outils-automatisation" ? C.blue : C.textMuted, fontWeight: 600, fontSize: 12.5,
                        }}
                      >
                        <Zap size={14} /> Automatisation
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => { setCoachTab("vod"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "vod" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "vod" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <VideoIcon size={16} /> VOD
                  </button>
                  <button
                    onClick={() => { setCoachTab("notifications"); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
                      background: coachTab === "notifications" ? C.blueSoft : "transparent", border: "none",
                      color: coachTab === "notifications" ? C.blue : C.textMuted, fontWeight: 700, fontSize: 13.5,
                    }}
                  >
                    <Bell size={16} /> Notifications
                  </button>
                </div>
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
    <div style={{ ...appShellStyle, background: "#0B1A3D" }}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "48px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <img src="/cowave-icon-transparent.png" alt="CoWave" style={{ width: 220, height: "auto" }} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#FFFFFF", marginBottom: 8, textAlign: "center" }}>
          CoWave
        </div>
        <div style={{ fontSize: 14, color: "#8FC4FF", marginBottom: 20, textAlign: "center" }}>Connecte-toi pour continuer</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontStyle: "italic", textAlign: "center", marginBottom: 20, padding: "0 20px" }}>
          « Chaque séance te rapproche de la meilleure version de toi-même. »
        </div>
        <Card style={{ border: "2px solid rgba(255,180,60,0.85)", boxShadow: "0 0 30px rgba(255,180,60,0.6), 0 0 12px rgba(255,210,80,0.75), 0 0 4px rgba(255,230,120,0.9), 0 8px 28px rgba(10,30,70,0.3)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Email</div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14 }}
              />
            </div>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10.5, color: C.textDim, marginBottom: 5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Mot de passe</div>
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
              style={{ background: "#FFFFFF", border: "none", color: C.blue, borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function AddClientForm({ coachProfilId, onClose, onCreated, fireToast, groupesDisponibles }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", password: "", groupe: "" });
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          password: form.password,
          coachId: coachProfilId,
          groupe: form.groupe || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur création client");

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
        <Field label="Dossier (optionnel)">
          <input style={inputStyle} list="dossiers-existants" placeholder="ex : Perte de poids" value={form.groupe} onChange={set("groupe")} />
          <datalist id="dossiers-existants">
            {(groupesDisponibles || []).map((g) => <option key={g} value={g} />)}
          </datalist>
        </Field>
        <button type="submit" disabled={submitting} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Création..." : "Créer le client"}
        </button>
      </form>
    </Card>
  );
}

function SeanceForm({ clientId, coachId, editingProgramme, estModele, modeleSemaineId, modeleJourFixe, onClose, onCreated, fireToast }) {
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
  const [jourFixe, setJourFixe] = useState(editingProgramme?.jourFixe || editingProgramme?.jour_fixe || "");
  const [echauffementGeneral, setEchauffementGeneral] = useState(editingProgramme?.echauffement_general || "");
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const exCardRefs = useRef([]);
  const dragOverIdxRef = useRef(null);

  const handleDrop = (targetIdx, explicitFromIdx = null) => {
    const fromIdx = explicitFromIdx !== null ? explicitFromIdx : draggedIdx;
    if (fromIdx === null || fromIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    setExercices((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr.map((ex, i) => ({ ...ex, ordre: i }));
    });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };
  const updateExercice = (idx, field, value) => {
    setExercices((prev) => prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)));
  };

  // Glisser tactile (fonctionne au doigt ET à la souris) pour réordonner les exercices
  useEffect(() => {
    if (draggedIdx === null) return;
    const handleMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      let overIdx = null;
      for (let i = 0; i < exCardRefs.current.length; i++) {
        const el = exCardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) { overIdx = i; break; }
      }
      if (overIdx !== null) {
        dragOverIdxRef.current = overIdx;
        setDragOverIdx(overIdx);
      }
    };
    const handleUp = () => {
      const finalOver = dragOverIdxRef.current;
      const finalFrom = draggedIdx;
      dragOverIdxRef.current = null;
      if (finalOver !== null) handleDrop(finalOver, finalFrom);
      else { setDraggedIdx(null); setDragOverIdx(null); }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggedIdx]);
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
      type: ex.type || ex.type_exercice || "muscu",
      dureeMinutes: ex.dureeMinutes ?? ex.duree_minutes ?? null,
      echauffement: ex.echauffement ?? ex.series_echauffement ?? 0,
      objectifRepsMax: ex.objectifRepsMax ?? ex.objectif_reps_max ?? null,
    }));
  });
  const [exNom, setExNom] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exRest, setExRest] = useState(90);
  const [saving, setSaving] = useState(false);
  const [exRepsParSerie, setExRepsParSerie] = useState([10, 10, 10]);
  const [exType, setExType] = useState("muscu");
  const [exEchauffement, setExEchauffement] = useState(0);
  const [exObjectifActif, setExObjectifActif] = useState(false);
  const [exObjectifReps, setExObjectifReps] = useState(12);
  const [showRpePickerNew, setShowRpePickerNew] = useState(false);
  const [showTempoPickerNew, setShowTempoPickerNew] = useState(false);
  const [showRepoPickerNew, setShowRepoPickerNew] = useState(false);
  const [showRepoPickerIdx, setShowRepoPickerIdx] = useState(null);
  const [showRpePickerIdx, setShowRpePickerIdx] = useState(null);
  const [showTempoPickerIdx, setShowTempoPickerIdx] = useState(null);
  const [showExercicePickerPage, setShowExercicePickerPage] = useState(false);
  const [exDureeMinutes, setExDureeMinutes] = useState(15);

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
  const [showAjoutExercice, setShowAjoutExercice] = useState(false);

  useEffect(() => {
    if (!coachId) return;
    supabase.from("exercices_bibliotheque").select("*").eq("coach_id", coachId).order("nom").then(({ data }) => setBibliotheque(data || []));
  }, [coachId]);

  const createExercice = async () => {
    if (!newExNom.trim()) return;
    try {
      let videoUrl = null;
      if (newExVideoFile) {
        if (newExVideoFile.size > 150 * 1024 * 1024) {
          fireToast("Vidéo trop lourde (max 150 Mo) — essaie une vidéo plus courte ou compressée");
          return;
        }
        const nomPropre = newExVideoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}_${nomPropre}`;
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
      fireToast("Erreur : " + (err.message || "création exercice"));
    }
  };

  const addExercice = () => {
    if (!selectedExId) return;
    const ex = bibliotheque.find((b) => b.id === selectedExId);
    if (!ex) return;
    setExercices((prev) => [...prev, {
      nom: ex.nom, videoDemoUrl: ex.video_demo_url,
      sets: exType === "cardio" ? 1 : exSets,
      repsParSerie: exType === "cardio" ? [0] : exRepsParSerie,
      rest: exRest, tempo: exTempo, rpe: exRpe, note: exNote, ordre: prev.length,
      type: exType, dureeMinutes: exType === "cardio" ? exDureeMinutes : null,
      echauffement: exType === "cardio" ? 0 : (parseInt(exEchauffement) || 0),
      objectifRepsMax: exObjectifActif ? (parseInt(exObjectifReps) || null) : null,
    }]);
    setSelectedExId("");
    setExSets(3);
    setExRepsParSerie([10, 10, 10]);
    setExRest(90);
    setExTempo("");
    setExRpe("");
    setExNote("");
    setExType("muscu");
    setExDureeMinutes(15);
    setExEchauffement(0);
    setExObjectifActif(false);
    setExObjectifReps(12);
  };

  const removeExercice = (idx) => {
    const nomEx = exercices[idx]?.nom || "cet exercice";
    if (!confirm(`Supprimer "${nomEx}" de la séance ?`)) return;
    setExercices((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!nom.trim() || exercices.length === 0) {
      fireToast("Ajoute un nom et au moins un exercice");
      return;
    }
    try {
      setSaving(true);

      if (estModele) {
        const exercicesJson = exercices.map((ex) => ({
          nom: ex.nom, sets: ex.sets, repsParSerie: ex.repsParSerie, rest: ex.rest,
          tempo: ex.tempo, rpe: ex.rpe, note: ex.note, videoDemoUrl: ex.videoDemoUrl,
          ordre: ex.ordre, groupeSuperset: ex.groupeSuperset || null,
          type: ex.type || "muscu", dureeMinutes: ex.dureeMinutes || null,
          echauffement: ex.echauffement || 0, objectifRepsMax: ex.objectifRepsMax || null,
        }));
        if (editingProgramme?.id) {
          const { error } = await supabase.from("programmes_modeles").update({ nom, muscle, exercices: exercicesJson, jour_fixe: modeleJourFixe || null }).eq("id", editingProgramme.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("programmes_modeles").insert({ coach_id: coachId, nom, muscle, exercices: exercicesJson, modele_semaine_id: modeleSemaineId || null, jour_fixe: modeleJourFixe || null });
          if (error) throw error;
        }
        fireToast(editingProgramme?.id ? "Modèle modifié" : "Modèle créé", "green");
        onCreated();
        onClose();
        return;
      }

      let progId;
      if (editingProgramme?.id) {
        const { error: updateErr } = await supabase
          .from("programmes")
          .update({ nom, muscle, jour_fixe: jourFixe || null, echauffement_general: echauffementGeneral || null })
          .eq("id", editingProgramme.id);
        if (updateErr) throw updateErr;
        progId = editingProgramme.id;
        await supabase.from("programme_exercices").delete().eq("programme_id", progId);
      } else {
        const { data: prog, error: progErr } = await supabase
          .from("programmes")
          .insert({ profil_id: clientId, nom, muscle, jour_fixe: jourFixe || null, echauffement_general: echauffementGeneral || null })
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
        type_exercice: ex.type || "muscu",
        duree_minutes: ex.dureeMinutes || null,
        series_echauffement: ex.echauffement || 0,
        objectif_reps_max: ex.objectifRepsMax || null,
      }));
      const { error: exErr } = await supabase.from("programme_exercices").insert(rows);
      if (exErr) throw exErr;
      fireToast(editingProgramme?.id ? "Séance modifiée" : "Séance créée", "green");
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      fireToast("Erreur : " + (err.message || "création séance"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, overflowY: "auto" }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto", overflowX: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <SectionLabel icon={Dumbbell}>{estModele ? (editingProgramme?.id ? "Modifier le modèle" : "Nouveau modèle") : (editingProgramme?.id ? "Modifier la séance" : "Nouvelle séance")}</SectionLabel>
        <input type="text" placeholder="Nom (ex: Push)" value={nom} onChange={(e) => setNom(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 8 }} />
        <input type="text" placeholder="Muscle ciblé (ex: Pecs / Épaules)" value={muscle} onChange={(e) => setMuscle(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 16 }} />
        {!estModele && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Type de programme</div>
            <select
              value={jourFixe}
              onChange={(e) => setJourFixe(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14 }}
            >
              <option value="">Cycle (le client fait les séances dans l'ordre, sans jour fixe)</option>
              <option value="lundi">Jour fixe — Lundi</option>
              <option value="mardi">Jour fixe — Mardi</option>
              <option value="mercredi">Jour fixe — Mercredi</option>
              <option value="jeudi">Jour fixe — Jeudi</option>
              <option value="vendredi">Jour fixe — Vendredi</option>
              <option value="samedi">Jour fixe — Samedi</option>
              <option value="dimanche">Jour fixe — Dimanche</option>
            </select>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Échauffement général (optionnel)</div>
          <textarea
            value={echauffementGeneral}
            onChange={(e) => setEchauffementGeneral(e.target.value)}
            placeholder="ex : 5 min de vélo + rotations articulaires (épaules, hanches, chevilles)"
            rows={2}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, resize: "none" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionLabel icon={Plus}>Exercices</SectionLabel>
          {exercices.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <button
                onClick={() => { if (confirm("Retirer l'échauffement de tous les exercices de cette séance ?")) setExercices((prev) => prev.map((ex) => ({ ...ex, echauffement: 0 }))); }}
                style={{ background: "transparent", border: "none", color: C.amber, fontSize: 11.5, fontWeight: 700 }}
              >
                Retirer tout l'échauffement
              </button>
              <button
                onClick={() => { if (confirm("Vider tous les exercices de cette séance ?")) setExercices([]); }}
                style={{ background: "transparent", border: "none", color: C.red, fontSize: 11.5, fontWeight: 700 }}
              >
                Tout vider
              </button>
            </div>
          )}
        </div>
        {exercices.map((ex, i) => {
          const estDebutSuperset = ex.groupeSuperset && exercices[i - 1]?.groupeSuperset !== ex.groupeSuperset;
          const estFinSuperset = ex.groupeSuperset && exercices[i + 1]?.groupeSuperset !== ex.groupeSuperset;
          return (
          <div
            key={i}
            ref={(el) => { exCardRefs.current[i] = el; }}
            style={{
              background: ex.groupeSuperset ? C.blueSoft : C.surface,
              border: dragOverIdx === i && draggedIdx !== i
                ? `2px dashed ${C.blue}`
                : ex.groupeSuperset
                  ? `3px solid ${C.blue}`
                  : `1.5px solid ${C.blueBorder}`,
              borderTopLeftRadius: !ex.groupeSuperset || estDebutSuperset ? 14 : 0,
              borderTopRightRadius: !ex.groupeSuperset || estDebutSuperset ? 14 : 0,
              borderBottomLeftRadius: !ex.groupeSuperset || estFinSuperset ? 14 : 0,
              borderBottomRightRadius: !ex.groupeSuperset || estFinSuperset ? 14 : 0,
              borderTop: ex.groupeSuperset && !estDebutSuperset ? "none" : undefined,
              padding: "16px 16px",
              marginBottom: estFinSuperset || !ex.groupeSuperset ? 10 : 0,
              opacity: draggedIdx === i ? 0.4 : 1,
            }}
          >
            {estDebutSuperset && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <Zap size={13} color={C.blue} />
                <span style={{ fontSize: 10.5, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Superset</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div
                  onMouseDown={() => setDraggedIdx(i)}
                  onTouchStart={() => setDraggedIdx(i)}
                  style={{ color: C.textMuted, fontSize: 20, lineHeight: 1, padding: "4px 2px", cursor: "grab", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                >
                  ⠿
                </div>
                <input type="checkbox" checked={selectedForSuperset.includes(i)} onChange={(e) => { e.stopPropagation(); toggleSelectForSuperset(i); }} onClick={(e) => e.stopPropagation()} />
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedIdx(i)}>
                  {ex.groupeSuperset && <span style={{ color: C.blue, fontWeight: 700, fontSize: 11 }}>[Superset] </span>}
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{ex.nom}</div>
                  <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>
                    {ex.sets} séries · {ex.rest}s
                    {(ex.echauffement || 0) > 0 && <span style={{ color: C.amber }}> · 🔥 {ex.echauffement} éch.</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setExpandedIdx(i)} style={{ background: "transparent", border: "none", color: C.textMuted, padding: 6 }}><ChevronRight size={18} /></button>
                <button onClick={() => removeExercice(i)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
          );
        })}
        {showRpePickerIdx !== null && (
          <RPEPickerModal value={exercices[showRpePickerIdx]?.rpe} onSelect={(v) => updateExercice(showRpePickerIdx, "rpe", v)} onClose={() => setShowRpePickerIdx(null)} />
        )}
        {showTempoPickerIdx !== null && (
          <TempoPickerModal value={exercices[showTempoPickerIdx]?.tempo} onSelect={(v) => updateExercice(showTempoPickerIdx, "tempo", v)} onClose={() => setShowTempoPickerIdx(null)} />
        )}
        {showRepoPickerIdx !== null && (
          <RepoPickerModal value={exercices[showRepoPickerIdx]?.rest} onSelect={(v) => updateExercice(showRepoPickerIdx, "rest", v)} onClose={() => setShowRepoPickerIdx(null)} />
        )}
        {expandedIdx !== null && exercices[expandedIdx] && (() => {
          const ex = exercices[expandedIdx];
          const i = expandedIdx;
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setExpandedIdx(null)}>
              <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionLabel icon={Dumbbell}>{ex.nom}</SectionLabel>
                  <button onClick={() => setExpandedIdx(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={20} /></button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Séries</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <button onClick={() => {
                    const n = Math.max(1, ex.sets - 1);
                    const arr = [...(ex.repsParSerie || [])];
                    while (arr.length > n) arr.pop();
                    updateExercice(i, "sets", n);
                    updateExercice(i, "repsParSerie", arr);
                  }} style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, color: C.text, fontSize: 18, fontWeight: 700 }}>−</button>
                  <div style={{ flex: 1, textAlign: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 0", color: C.text, fontSize: 15, fontWeight: 700 }}>{ex.sets}</div>
                  <button onClick={() => {
                    const n = ex.sets + 1;
                    const arr = [...(ex.repsParSerie || [])];
                    while (arr.length < n) arr.push(10);
                    updateExercice(i, "sets", n);
                    updateExercice(i, "repsParSerie", arr);
                  }} style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, color: C.text, fontSize: 18, fontWeight: 700 }}>+</button>
                </div>
                <div style={{ fontSize: 11, color: C.amber, marginBottom: 4, fontWeight: 700 }}>🔥 Séries d'échauffement (0 si aucune)</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateExercice(i, "echauffement", n)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                        background: (ex.echauffement || 0) === n ? C.amber : C.surface,
                        color: (ex.echauffement || 0) === n ? "#3D2600" : C.textMuted,
                        border: `1px solid ${(ex.echauffement || 0) === n ? C.amber : C.cardBorderLight}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!ex.objectifRepsMax}
                      onChange={(e) => updateExercice(i, "objectifRepsMax", e.target.checked ? 12 : null)}
                    />
                    <span style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>🎯 Objectif de progression (augmenter la charge à un nombre de reps)</span>
                  </label>
                  {ex.objectifRepsMax > 0 && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>À partir de</span>
                      <input
                        type="number"
                        value={ex.objectifRepsMax}
                        onChange={(e) => updateExercice(i, "objectifRepsMax", parseInt(e.target.value) || 12)}
                        style={{ width: 60, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px", color: C.text, fontSize: 13, textAlign: "center" }}
                      />
                      <span style={{ fontSize: 12, color: C.textMuted }}>répétitions, augmenter la charge</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Répétitions par série</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {(ex.repsParSerie || []).map((r, si) => (
                    <input key={si} type="number" value={r} onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const arr = [...ex.repsParSerie];
                      arr[si] = val;
                      updateExercice(i, "repsParSerie", arr);
                    }} style={{ width: 48, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px", color: C.text, fontSize: 13, textAlign: "center" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Repos</div>
                    <button onClick={() => setShowRepoPickerIdx(i)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 8px", color: C.text, fontSize: 13, textAlign: "left" }}>
                      {formatRepos(ex.rest)}
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>RPE</div>
                    <button onClick={() => setShowRpePickerIdx(i)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 8px", color: ex.rpe ? C.text : C.textDim, fontSize: 13, textAlign: "left" }}>
                      {ex.rpe || "RPE"}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tempo</div>
                <button onClick={() => setShowTempoPickerIdx(i)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 8px", color: ex.tempo ? C.text : C.textDim, fontSize: 13, textAlign: "left", marginBottom: 12 }}>
                  {ex.tempo || "Tempo"}
                </button>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Note</div>
                <textarea value={ex.note || ""} onChange={(e) => updateExercice(i, "note", e.target.value)} rows={2} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "9px 8px", color: C.text, fontSize: 13, resize: "none", marginBottom: 14 }} />
                <button onClick={() => setExpandedIdx(null)} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14 }}>
                  Terminé
                </button>
              </Card>
            </div>
          );
        })()}
        {selectedForSuperset.length >= 2 && (       <button onClick={groupSuperset} style={{ width: "100%", background: C.blueSoft, border: `1px solid ${C.blue}`, color: C.blue, borderRadius: 10, padding: "8px", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Grouper en superset ({selectedForSuperset.length} exercices)
          </button>
        )}
        <button
          onClick={() => setShowAjoutExercice(true)}
          style={{ width: "100%", background: C.amber, border: "none", color: "#3D2600", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <Plus size={16} /> Ajouter un exercice
        </button>

        {showAjoutExercice && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowAjoutExercice(false)}>
            <Card style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto", border: `2px solid ${C.amber}` }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <SectionLabel icon={Plus}>Nouvel exercice</SectionLabel>
                <button onClick={() => setShowAjoutExercice(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
              </div>

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
                  <button onClick={() => setShowExercicePickerPage(!showExercicePickerPage)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: selectedExId ? C.text : C.textDim, fontSize: 13, textAlign: "left" }}>
                    {selectedExId ? bibliotheque.find((b) => b.id === selectedExId)?.nom : "Choisir un exercice..."}
                  </button>
                  <button onClick={() => setShowNewExercice(true)} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 10, padding: "8px 12px", fontSize: 13 }}><Plus size={14} /></button>
                </div>
              )}
              {showExercicePickerPage && (
                <ExercicePickerInline
                  bibliotheque={bibliotheque}
                  onSelect={(id) => { setSelectedExId(id); setShowExercicePickerPage(false); }}
                />
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <PillButton active={exType === "muscu"} onClick={() => setExType("muscu")} style={{ flex: 1, textAlign: "center" }}>🏋️ Musculation</PillButton>
                <PillButton active={exType === "cardio"} onClick={() => setExType("cardio")} style={{ flex: 1, textAlign: "center" }}>🏃 Cardio</PillButton>
              </div>
              {exType === "cardio" ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>DURÉE (MINUTES)</div>
                    <input type="number" value={exDureeMinutes} onChange={(e) => setExDureeMinutes(parseInt(e.target.value) || 15)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>REPOS APRÈS</div>
                    <button onClick={() => setShowRepoPickerNew(true)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13, textAlign: "left" }}>
                      {formatRepos(exRest)}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>SÉRIES</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => setExSets(Math.max(1, exSets - 1))} style={{ width: 32, height: 36, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, color: C.text, fontSize: 16, fontWeight: 700 }}>−</button>
                        <div style={{ flex: 1, textAlign: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 0", color: C.text, fontSize: 14, fontWeight: 700 }}>{exSets}</div>
                        <button onClick={() => setExSets(exSets + 1)} style={{ width: 32, height: 36, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, color: C.text, fontSize: 16, fontWeight: 700 }}>+</button>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>REPOS</div>
                      <button onClick={() => setShowRepoPickerNew(true)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13, textAlign: "left", height: 36 }}>
                        {formatRepos(exRest)}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10.5, color: C.amber, marginBottom: 4, fontWeight: 700 }}>🔥 SÉRIES D'ÉCHAUFFEMENT (0 SI AUCUNE)</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0, 1, 2, 3].map((n) => (
                        <button
                          key={n}
                          onClick={() => setExEchauffement(n)}
                          style={{
                            flex: 1, padding: "8px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: exEchauffement === n ? C.amber : C.surface,
                            color: exEchauffement === n ? "#3D2600" : C.textMuted,
                            border: `1px solid ${exEchauffement === n ? C.amber : C.cardBorderLight}`,
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={exObjectifActif} onChange={(e) => setExObjectifActif(e.target.checked)} />
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>🎯 Objectif de progression (augmenter la charge à un nombre de reps)</span>
                    </label>
                    {exObjectifActif && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: C.textMuted }}>À partir de</span>
                        <input type="number" value={exObjectifReps} onChange={(e) => setExObjectifReps(parseInt(e.target.value) || 12)} style={{ width: 60, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px", color: C.text, fontSize: 13, textAlign: "center" }} />
                        <span style={{ fontSize: 12, color: C.textMuted }}>répétitions, augmenter la charge</span>
                      </div>
                    )}
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
                </>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setShowTempoPickerNew(true)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: exTempo ? C.text : C.textDim, fontSize: 13, textAlign: "left" }}>
                  {exTempo || "Tempo"}
                </button>
                <button onClick={() => setShowRpePickerNew(true)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: exRpe ? C.text : C.textDim, fontSize: 13, textAlign: "left" }}>
                  {exRpe || "RPE"}
                </button>
              </div>
              <textarea placeholder="Note spéciale (optionnel)" value={exNote} onChange={(e) => setExNote(e.target.value)} rows={2} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 12, resize: "none" }} />
              <button
                onClick={() => { addExercice(); setShowAjoutExercice(false); }}
                style={{ width: "100%", background: C.amber, border: "none", color: "#3D2600", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 800 }}
              >
                + Ajouter cet exercice à la séance
              </button>
            </Card>
          </div>
        )}
        {showRpePickerNew && <RPEPickerModal value={exRpe} onSelect={setExRpe} onClose={() => setShowRpePickerNew(false)} />}
        {showTempoPickerNew && <TempoPickerModal value={exTempo} onSelect={setExTempo} onClose={() => setShowTempoPickerNew(false)} />}
        {showRepoPickerNew && <RepoPickerModal value={exRest} onSelect={setExRest} onClose={() => setShowRepoPickerNew(false)} />}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14 }}>Annuler</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>{saving ? "..." : "Créer"}</button>
        </div>
      </Card>
    </div>
  );
}

const MedalBadge = ({ color, size = 36 }) => {
  const gradId = `trophyGrad-${color.replace("#", "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Anses */}
      <path d="M14 9 C7 9 6 18 11.5 21 C13 21.9 15 21.9 16.5 20.8" stroke={color} strokeWidth="2.3" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M34 9 C41 9 42 18 36.5 21 C35 21.9 33 21.9 31.5 20.8" stroke={color} strokeWidth="2.3" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Coupe */}
      <path d="M14.5 8 H33.5 V15.5 C33.5 23.5 27.8 27.5 24 27.5 C20.2 27.5 14.5 23.5 14.5 15.5 Z" fill={`url(#${gradId})`} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Reflet */}
      <path d="M18.5 11 C17.5 15 18.3 18.5 21 21" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
      {/* Pied */}
      <rect x="21.3" y="27.5" width="5.4" height="7" fill={color} opacity="0.85" />
      {/* Socle */}
      <rect x="15" y="34.5" width="18" height="4" rx="1.5" fill={color} />
      <rect x="17.5" y="38.7" width="13" height="3" rx="1.3" fill={color} opacity="0.65" />
    </svg>
  );
};

const LegendDot = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, color: C.textOnBgMuted, fontWeight: 600 }}>{label}</span>
  </div>
);

function MiniCalendarClient({ seancesDates, poidsDates, bilansDates, nutritionDates, onSelectDay }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
          <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
          {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </div>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <LegendDot color={C.blue} label="Séances" />
        <LegendDot color={C.red} label="Poids" />
        <LegendDot color={C.green} label="Bilan" />
        <LegendDot color={C.amber} label="Nutrition" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: C.textDim, fontWeight: 700 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = isoFor(d);
          const hasS = seancesDates.has(iso);
          const hasP = poidsDates.has(iso);
          const hasB = bilansDates.has(iso);
          const hasN = nutritionDates && nutritionDates.has(iso);
          return (
            <button
              key={i}
              onClick={() => onSelectDay && onSelectDay(iso)}
              style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, background: (hasS || hasP || hasB || hasN) ? C.surface : "transparent", border: "none" }}
            >
              <div style={{ fontSize: 10.5, color: C.text }}>{d}</div>
              <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                {hasS && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.blue }} />}
                {hasP && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.red }} />}
                {hasB && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.green }} />}
                {hasN && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.amber }} />}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function MiniDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: value ? C.text : C.textDim, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
      >
        <Calendar size={14} color={C.textDim} /> {value ? formatDateDisplay(value) : "Choisir une date d'échéance"}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "105%", left: 0, zIndex: 20, background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: 12, width: 260, boxShadow: "0 10px 30px rgba(22,52,69,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
              <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
            </button>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>
              {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, color: C.textDim, fontWeight: 700 }}>{d}</div>
            ))}
            {cells.map((d, i) => d === null ? <div key={i} /> : (
              <button
                key={i}
                onClick={() => { onChange(isoFor(d)); setOpen(false); }}
                style={{ aspectRatio: "1", borderRadius: 6, border: "none", background: value === isoFor(d) ? C.blue : "transparent", color: value === isoFor(d) ? "#FFFFFF" : C.text, fontSize: 11 }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TachesView({ coachId, fireToast }) {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("a_faire");
  const [showForm, setShowForm] = useState(false);
  const [editingTache, setEditingTache] = useState(null);
  const [titre, setTitre] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("taches").select("*").eq("coach_id", coachId).order("date_echeance", { ascending: true });
      if (error) throw error;
      setTaches(data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement tâches");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId]);

  const openNew = () => { setEditingTache(null); setTitre(""); setDateEcheance(""); setShowForm(true); };
  const openEdit = (t) => { setEditingTache(t); setTitre(t.titre); setDateEcheance(t.date_echeance || ""); setShowForm(true); };

  const save = async () => {
    if (!titre.trim()) { fireToast("Ajoute un titre"); return; }
    try {
      if (editingTache) {
        const { error } = await supabase.from("taches").update({ titre, date_echeance: dateEcheance || null }).eq("id", editingTache.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("taches").insert({ coach_id: coachId, titre, date_echeance: dateEcheance || null, statut: "a_faire" });
        if (error) throw error;
      }
      fireToast(editingTache ? "Tâche modifiée" : "Tâche créée", "green");
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement tâche");
    }
  };

  const toggleStatut = async (t) => {
    const nouveauStatut = t.statut === "a_faire" ? "termine" : "a_faire";
    try {
      const { error } = await supabase.from("taches").update({ statut: nouveauStatut }).eq("id", t.id);
      if (error) throw error;
      setTaches((prev) => prev.map((x) => (x.id === t.id ? { ...x, statut: nouveauStatut } : x)));
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour");
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      const { error } = await supabase.from("taches").delete().eq("id", id);
      if (error) throw error;
      setTaches((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression");
    }
  };

  const filtered = taches.filter((t) => t.statut === filter);

  return (
    <>
      <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
        Gérez vos tâches quotidiennes et suivez leur avancement.
      </div>
      <button
        onClick={openNew}
        style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
      >
        <Plus size={18} /> Créer une tâche
      </button>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <PillButton active={filter === "a_faire"} onClick={() => setFilter("a_faire")} style={{ flex: 1, textAlign: "center" }}>
          À faire ({taches.filter((t) => t.statut === "a_faire").length})
        </PillButton>
        <PillButton active={filter === "termine"} onClick={() => setFilter("termine")} style={{ flex: 1, textAlign: "center" }}>
          Terminées
        </PillButton>
      </div>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 30 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucune tâche ici</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((t) => (
            <Card key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => toggleStatut(t)}
                style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${t.statut === "termine" ? C.green : C.cardBorderLight}`, background: t.statut === "termine" ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {t.statut === "termine" && <Check size={13} color="#FFFFFF" />}
              </button>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openEdit(t)}>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600, textDecoration: t.statut === "termine" ? "line-through" : "none" }}>{t.titre}</div>
                {t.date_echeance && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>📅 {formatDateDisplay(t.date_echeance)}</div>}
              </div>
              <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: C.red }}>
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowForm(false)}>
          <Card style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={ClipboardList}>{editingTache ? "Modifier la tâche" : "Nouvelle tâche"}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textDim, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Titre</div>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex : Préparer le programme d'Oscar" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textDim, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" }}>Date d'échéance</div>
                <MiniDatePicker value={dateEcheance} onChange={setDateEcheance} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 0", color: C.textMuted, fontWeight: 600, fontSize: 13 }}>Annuler</button>
                <button onClick={save} style={{ flex: 1, background: C.blue, border: "none", borderRadius: 10, padding: "10px 0", color: "#06171F", fontWeight: 700, fontSize: 13 }}>{editingTache ? "Enregistrer" : "Créer"}</button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function ProgrammesModelesView({ coachId, clients, fireToast }) {
  const [modeles, setModeles] = useState([]);
  const [semaines, setSemaines] = useState([]);
  const [ongletActif, setOngletActif] = useState("seances"); // "seances" | "semaines"
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState(null); // null | "modele" | "pickClient" | "assign" | "nouvelleSemaine" | "detailSemaine" | "pickClientSemaine"
  const [editingModele, setEditingModele] = useState(null);
  const [assignClientId, setAssignClientId] = useState(null);
  const [selectedSemaine, setSelectedSemaine] = useState(null);
  const [nomSemaine, setNomSemaine] = useState("");
  const [descSemaine, setDescSemaine] = useState("");
  const [savingSemaine, setSavingSemaine] = useState(false);
  const [assigningSemaine, setAssigningSemaine] = useState(false);
  const JOURS_ORDRE_MODELE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  const load = async () => {
    setLoading(true);
    try {
      const [modelesRes, semainesRes] = await Promise.all([
        supabase.from("programmes_modeles").select("*").eq("coach_id", coachId).order("created_at", { ascending: false }),
        supabase.from("modeles_semaine").select("*").eq("coach_id", coachId).order("created_at", { ascending: false }),
      ]);
      if (modelesRes.error) throw modelesRes.error;
      if (semainesRes.error) throw semainesRes.error;
      setModeles(modelesRes.data || []);
      setSemaines(semainesRes.data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement modèles");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId]);

  const modelesSansSemaine = modeles.filter((m) => !m.modele_semaine_id);
  const modelesDeSemaine = (semaineId) => modeles.filter((m) => m.modele_semaine_id === semaineId);

  const creerSemaine = async () => {
    if (!nomSemaine.trim()) return;
    setSavingSemaine(true);
    try {
      const { data, error } = await supabase.from("modeles_semaine").insert({ coach_id: coachId, nom: nomSemaine, description: descSemaine || null }).select().single();
      if (error) throw error;
      setSemaines((prev) => [data, ...prev]);
      setNomSemaine("");
      setDescSemaine("");
      setFormMode("detailSemaine");
      setSelectedSemaine(data);
      fireToast("Semaine type créée", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur création semaine type");
    } finally {
      setSavingSemaine(false);
    }
  };

  const supprimerSemaine = async (id) => {
    if (!confirm("Supprimer cette semaine type et toutes ses séances ?")) return;
    try {
      const { error } = await supabase.from("modeles_semaine").delete().eq("id", id);
      if (error) throw error;
      setSemaines((prev) => prev.filter((s) => s.id !== id));
      setModeles((prev) => prev.filter((m) => m.modele_semaine_id !== id));
      if (formMode === "detailSemaine") { setFormMode(null); setSelectedSemaine(null); }
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression");
    }
  };

  const assignerSemaineAuClient = async (clientId) => {
    setAssigningSemaine(true);
    try {
      const seancesDeSemaine = modelesDeSemaine(selectedSemaine.id);
      for (const s of seancesDeSemaine) {
        const { data: prog, error: progErr } = await supabase
          .from("programmes")
          .insert({ profil_id: clientId, nom: s.nom, muscle: s.muscle, jour_fixe: s.jour_fixe || null })
          .select()
          .single();
        if (progErr) throw progErr;
        const exercicesRows = (s.exercices || []).map((ex, i) => ({
          programme_id: prog.id, nom: ex.nom, sets: ex.sets, reps_par_serie: JSON.stringify(ex.repsParSerie || []),
          rest: ex.rest, tempo: ex.tempo, rpe: ex.rpe, note: ex.note, video_demo_url: ex.videoDemoUrl,
          ordre: ex.ordre ?? i, groupe_superset: ex.groupeSuperset || null,
          type_exercice: ex.type || "muscu", duree_minutes: ex.dureeMinutes || null,
          series_echauffement: ex.echauffement || 0, objectif_reps_max: ex.objectifRepsMax || null,
        }));
        if (exercicesRows.length > 0) {
          const { error: exErr } = await supabase.from("programme_exercices").insert(exercicesRows);
          if (exErr) throw exErr;
        }
      }
      fireToast(`Semaine type assignée (${seancesDeSemaine.length} séance(s))`, "green");
      setFormMode(null);
      setSelectedSemaine(null);
    } catch (err) {
      console.error(err);
      fireToast("Erreur assignation semaine type");
    } finally {
      setAssigningSemaine(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    try {
      const { error } = await supabase.from("programmes_modeles").delete().eq("id", id);
      if (error) throw error;
      setModeles((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression");
    }
  };

  if (formMode === "modele") {
    return (
      <SeanceForm
        estModele
        coachId={coachId}
        editingProgramme={editingModele}
        modeleSemaineId={selectedSemaine?.id}
        modeleJourFixe={editingModele?.jour_fixe}
        onClose={() => { setFormMode(selectedSemaine ? "detailSemaine" : null); setEditingModele(null); }}
        onCreated={load}
        fireToast={fireToast}
      />
    );
  }

  if (formMode === "assign" && assignClientId) {
    return (
      <SeanceForm
        clientId={assignClientId}
        editingProgramme={{ nom: editingModele.nom, muscle: editingModele.muscle, exercices: editingModele.exercices }}
        onClose={() => { setFormMode(null); setEditingModele(null); setAssignClientId(null); }}
        onCreated={() => fireToast("Programme envoyé au client", "green")}
        fireToast={fireToast}
      />
    );
  }

  if (formMode === "pickClient") {
    return (
      <div>
        <button onClick={() => { setFormMode(null); setEditingModele(null); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionLabel icon={User}>Assigner « {editingModele.nom} » à...</SectionLabel>
        {clients.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun client pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {clients.map((c) => (
              <Card
                key={c.id}
                onClick={() => { setAssignClientId(c.id); setFormMode("assign"); }}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{c.prenom} {c.nom}</span>
                <ChevronRight size={16} color={C.textDim} />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (formMode === "nouvelleSemaine") {
    return (
      <div>
        <button onClick={() => setFormMode(null)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionLabel icon={Calendar}>Nouvelle semaine type</SectionLabel>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
          ex : "Programme épaule faible", "Prise de masse débutant"...
        </div>
        <input
          type="text"
          value={nomSemaine}
          onChange={(e) => setNomSemaine(e.target.value)}
          placeholder="Nom de la semaine type"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 10 }}
        />
        <textarea
          value={descSemaine}
          onChange={(e) => setDescSemaine(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none", marginBottom: 14 }}
        />
        <button onClick={creerSemaine} disabled={savingSemaine || !nomSemaine.trim()} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, opacity: savingSemaine || !nomSemaine.trim() ? 0.6 : 1 }}>
          {savingSemaine ? "Création..." : "Créer et ajouter les séances"}
        </button>
      </div>
    );
  }

  if (formMode === "detailSemaine" && selectedSemaine) {
    const seances7 = modelesDeSemaine(selectedSemaine.id);
    return (
      <div>
        <button onClick={() => { setFormMode(null); setSelectedSemaine(null); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <SectionLabel icon={Calendar}>{selectedSemaine.nom}</SectionLabel>
          <button onClick={() => supprimerSemaine(selectedSemaine.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={16} /></button>
        </div>
        {selectedSemaine.description && <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 14 }}>{selectedSemaine.description}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {JOURS_ORDRE_MODELE.map((jour) => {
            const seance = seances7.find((s) => s.jour_fixe === jour);
            return (
              <Card
                key={jour}
                onClick={() => { setEditingModele(seance || { jour_fixe: jour }); setFormMode("modele"); }}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{jour}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: seance ? C.text : C.textDim }}>{seance ? seance.nom : "Repos — appuyer pour créer"}</div>
                  {seance && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{(seance.exercices || []).length} exercices</div>}
                </div>
                <ChevronRight size={16} color={C.textMuted} />
              </Card>
            );
          })}
        </div>
        <button
          onClick={() => setFormMode("pickClientSemaine")}
          disabled={seances7.length === 0}
          style={{ width: "100%", background: seances7.length === 0 ? C.surface : C.blue, border: "none", color: seances7.length === 0 ? C.textDim : "#06171F", borderRadius: 12, padding: "13px", fontWeight: 800, fontSize: 14 }}
        >
          Assigner cette semaine type à un client
        </button>
      </div>
    );
  }

  if (formMode === "pickClientSemaine" && selectedSemaine) {
    return (
      <div>
        <button onClick={() => setFormMode("detailSemaine")} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionLabel icon={User}>Assigner « {selectedSemaine.nom} » à...</SectionLabel>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 12 }}>
          Toutes les séances de cette semaine type seront ajoutées au programme du client, avec leurs jours fixes.
        </div>
        {clients.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun client pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clients.map((c) => (
              <Card
                key={c.id}
                onClick={() => !assigningSemaine && assignerSemaineAuClient(c.id)}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: assigningSemaine ? 0.6 : 1 }}
              >
                <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{c.prenom} {c.nom}</span>
                <ChevronRight size={16} color={C.textDim} />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <PillButton active={ongletActif === "seances"} onClick={() => setOngletActif("seances")} onBg style={{ flex: 1, justifyContent: "center" }}>Séances individuelles</PillButton>
        <PillButton active={ongletActif === "semaines"} onClick={() => setOngletActif("semaines")} onBg style={{ flex: 1, justifyContent: "center" }}>Semaines types</PillButton>
      </div>

      {ongletActif === "seances" ? (
        <>
          <button
            onClick={() => { setEditingModele(null); setSelectedSemaine(null); setFormMode("modele"); }}
            style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
          >
            <Plus size={18} /> Créer un modèle
          </button>
          {loading ? (
            <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 30 }}>Chargement...</div>
          ) : modelesSansSemaine.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun modèle individuel pour le moment</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modelesSansSemaine.map((m) => (
                <Card key={m.id}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text }}>{m.nom}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>{m.muscle} · {(m.exercices || []).length} exercices</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingModele(m); setFormMode("modele"); }} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 0", color: C.text, fontSize: 12.5, fontWeight: 600 }}>Modifier</button>
                    <button onClick={() => { setEditingModele(m); setFormMode("pickClient"); }} style={{ flex: 1, background: C.blueSoft, border: "none", borderRadius: 10, padding: "8px 0", color: C.blue, fontSize: 12.5, fontWeight: 700 }}>Assigner</button>
                    <button onClick={() => remove(m.id)} style={{ background: "transparent", border: "none", color: C.red, padding: "0 8px" }}><Trash2 size={16} /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: C.textOnBgMuted, marginBottom: 12 }}>
            Regroupe plusieurs séances sur 7 jours (ex: "Programme épaule faible") pour les assigner d'un coup à un client.
          </div>
          <button
            onClick={() => setFormMode("nouvelleSemaine")}
            style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
          >
            <Plus size={18} /> Créer une semaine type
          </button>
          {loading ? (
            <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 30 }}>Chargement...</div>
          ) : semaines.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucune semaine type pour le moment</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {semaines.map((s) => {
                const nbSeances = modelesDeSemaine(s.id).length;
                return (
                  <Card key={s.id} onClick={() => { setSelectedSemaine(s); setFormMode("detailSemaine"); }} style={{ cursor: "pointer" }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text }}>{s.nom}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{nbSeances}/7 jour(s) programmé(s)</div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function AlimentationView({ coachId, clients, fireToast, section }) {
  const [targetClientId, setTargetClientId] = useState("tous");
  const [loading, setLoading] = useState(true);

  // --- Recettes ---
  const [recettes, setRecettes] = useState([]);
  const [nomRecette, setNomRecette] = useState("");
  const [descRecette, setDescRecette] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // --- Liste de courses ---
  const [listesCourses, setListesCourses] = useState([]);
  const [nouvelItem, setNouvelItem] = useState("");
  const [itemsCourse, setItemsCourse] = useState([]);

  // --- Suppléments ---
  const [supplements, setSupplements] = useState([]);
  const [nomSupplement, setNomSupplement] = useState("");
  const [lienSupplement, setLienSupplement] = useState("");
  const [noteSupplement, setNoteSupplement] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      if (section === "recettes") {
        const { data } = await supabase.from("recettes").select("*").eq("coach_id", coachId).order("created_at", { ascending: false });
        setRecettes(data || []);
      } else if (section === "courses") {
        const { data } = await supabase.from("listes_courses").select("*").eq("coach_id", coachId).order("updated_at", { ascending: false });
        setListesCourses(data || []);
      } else if (section === "supplements") {
        const { data } = await supabase.from("listes_supplements").select("*").eq("coach_id", coachId).order("created_at", { ascending: false });
        setSupplements(data || []);
      }
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId, section]);

  const cibleActuelle = targetClientId === "tous" ? null : targetClientId;

  const creerRecette = async () => {
    if (!nomRecette.trim()) { fireToast("Donne un nom à la recette"); return; }
    try {
      const { error } = await supabase.from("recettes").insert({
        coach_id: coachId, client_id: cibleActuelle, nom: nomRecette,
        description: descRecette, ingredients, instructions,
      });
      if (error) throw error;
      fireToast("Recette créée", "green");
      setNomRecette(""); setDescRecette(""); setIngredients(""); setInstructions("");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur création recette");
    }
  };

  const supprimerRecette = async (id) => {
    if (!confirm("Supprimer cette recette ?")) return;
    await supabase.from("recettes").delete().eq("id", id);
    setRecettes((prev) => prev.filter((r) => r.id !== id));
  };

  const ajouterItemCourse = () => {
    if (!nouvelItem.trim()) return;
    setItemsCourse((prev) => [...prev, nouvelItem.trim()]);
    setNouvelItem("");
  };

  const retirerItemCourse = (idx) => {
    setItemsCourse((prev) => prev.filter((_, i) => i !== idx));
  };

  const enregistrerListeCourses = async () => {
    if (itemsCourse.length === 0) { fireToast("Ajoute au moins un article"); return; }
    try {
      const { error } = await supabase.from("listes_courses").insert({
        coach_id: coachId, client_id: cibleActuelle, items: itemsCourse,
      });
      if (error) throw error;
      fireToast("Liste de courses envoyée", "green");
      setItemsCourse([]);
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi liste");
    }
  };

  const supprimerListeCourses = async (id) => {
    if (!confirm("Supprimer cette liste ?")) return;
    await supabase.from("listes_courses").delete().eq("id", id);
    setListesCourses((prev) => prev.filter((l) => l.id !== id));
  };

  const ajouterSupplement = async () => {
    if (!nomSupplement.trim()) { fireToast("Donne un nom au supplément"); return; }
    try {
      const { error } = await supabase.from("listes_supplements").insert({
        coach_id: coachId, client_id: cibleActuelle, nom: nomSupplement, lien: lienSupplement, note: noteSupplement,
      });
      if (error) throw error;
      fireToast("Supplément ajouté", "green");
      setNomSupplement(""); setLienSupplement(""); setNoteSupplement("");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur ajout supplément");
    }
  };

  const supprimerSupplement = async (id) => {
    if (!confirm("Supprimer ce supplément ?")) return;
    await supabase.from("listes_supplements").delete().eq("id", id);
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  };

  const nomClient = (clientId) => {
    if (!clientId) return "Tous les clients";
    const c = clients.find((cl) => cl.id === clientId);
    return c ? `${c.prenom} ${c.nom}` : "Client";
  };

  const selecteurClient = (
    <select
      value={targetClientId}
      onChange={(e) => setTargetClientId(e.target.value)}
      style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10 }}
    >
      <option value="tous">Tous mes clients</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
      ))}
    </select>
  );

  if (section === "recettes") {
    return (
      <>
        <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
          Crée des recettes à envoyer à un client précis ou à tous.
        </div>
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel icon={ClipboardList}>Nouvelle recette</SectionLabel>
          {selecteurClient}
          <input type="text" value={nomRecette} onChange={(e) => setNomRecette(e.target.value)} placeholder="Nom de la recette" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 8 }} />
          <textarea value={descRecette} onChange={(e) => setDescRecette(e.target.value)} placeholder="Description (optionnel)" rows={2} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 8, resize: "none" }} />
          <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingrédients (un par ligne)" rows={3} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 8, resize: "none" }} />
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions de préparation" rows={3} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10, resize: "none" }} />
          <button onClick={creerRecette} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}>Créer la recette</button>
        </Card>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
        ) : recettes.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucune recette pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recettes.map((r) => (
              <Card key={r.id} style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.nom}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{nomClient(r.client_id)}</div>
                  </div>
                  <button onClick={() => supprimerRecette(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                </div>
                {r.description && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{r.description}</div>}
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  if (section === "courses") {
    return (
      <>
        <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
          Envoie une liste de courses à un client précis ou à tous. Il la retrouve dans son onglet Nutrition.
        </div>
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel icon={ShoppingCart}>Nouvelle liste de courses</SectionLabel>
          {selecteurClient}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="text" value={nouvelItem} onChange={(e) => setNouvelItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ajouterItemCourse(); }}
              placeholder="Ajouter un article (ex : yaourts nature)"
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }}
            />
            <button onClick={ajouterItemCourse} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 10, padding: "8px 12px" }}><Plus size={14} /></button>
          </div>
          {itemsCourse.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {itemsCourse.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 8, padding: "7px 10px" }}>
                  <span style={{ fontSize: 13, color: C.text }}>{item}</span>
                  <button onClick={() => retirerItemCourse(i)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={enregistrerListeCourses} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}>Envoyer la liste</button>
        </Card>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
        ) : listesCourses.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucune liste envoyée pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {listesCourses.map((l) => (
              <Card key={l.id} style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{nomClient(l.client_id)}</div>
                  <button onClick={() => supprimerListeCourses(l.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{(l.items || []).join(" · ")}</div>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  // section === "supplements"
  return (
    <>
      <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
        Ajoute des suppléments recommandés avec un lien direct (ex : lien Amazon), visibles par le client dans son onglet Nutrition.
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel icon={Pill}>Nouveau supplément</SectionLabel>
        {selecteurClient}
        <input type="text" value={nomSupplement} onChange={(e) => setNomSupplement(e.target.value)} placeholder="Nom du supplément (ex : Whey protéine)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 8 }} />
        <input type="text" value={lienSupplement} onChange={(e) => setLienSupplement(e.target.value)} placeholder="Lien (ex : https://amazon.fr/...)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 8 }} />
        <input type="text" value={noteSupplement} onChange={(e) => setNoteSupplement(e.target.value)} placeholder="Note (ex : 1 dose après l'entraînement)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10 }} />
        <button onClick={ajouterSupplement} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}>Ajouter le supplément</button>
      </Card>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
      ) : supplements.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun supplément pour le moment</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supplements.map((s) => (
            <Card key={s.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <Pill size={18} color={C.blue} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.nom}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{nomClient(s.client_id)}{s.note ? ` · ${s.note}` : ""}</div>
              </div>
              <button onClick={() => supprimerSupplement(s.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function OutilsView({ coachId, clients, fireToast, section }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [targetClientId, setTargetClientId] = useState("tous");
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("documents_coach").select("*").eq("coach_id", coachId).order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement documents");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId]);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${coachId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("documents-coach").upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("documents-coach").getPublicUrl(fileName);
      const { error } = await supabase.from("documents_coach").insert({
        coach_id: coachId,
        client_id: targetClientId === "tous" ? null : targetClientId,
        nom: file.name,
        url: urlData.publicUrl,
      });
      if (error) throw error;
      fireToast("Document envoyé", "green");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi document");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      const { error } = await supabase.from("documents_coach").delete().eq("id", id);
      if (error) throw error;
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression");
    }
  };

  return (
    <>
      {section === "drive" && (
        <>
          <SectionLabel icon={FileText} onBg>Drive</SectionLabel>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
              Envoie des PDF (programmes, guides, factures...) à un client précis ou à tous tes clients d'un coup.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select
                value={targetClientId}
                onChange={(e) => setTargetClientId(e.target.value)}
                style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }}
              >
                <option value="tous">Tous mes clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              disabled={uploading}
              style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: uploading ? 0.6 : 1 }}
            >
              <Upload size={16} /> {uploading ? "Envoi..." : "Envoyer un PDF"}
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => upload(e.target.files[0])} />
          </Card>

          {loading ? (
            <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
          ) : documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {documents.map((d) => {
                const c = clients.find((cl) => cl.id === d.client_id);
                return (
                  <Card key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                    <FileText size={18} color={C.blue} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{d.nom}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{c ? `${c.prenom} ${c.nom}` : "Tous les clients"}</div>
                    </div>
                    <button onClick={() => remove(d.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {section === "automatisation" && (
        <>
          <SectionLabel icon={Zap} onBg>Automatisation</SectionLabel>
          <Card>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 6 }}>Bientôt disponible</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              On définira ensemble ce qu'il serait utile d'automatiser (rappels, relances, messages de bienvenue...) une fois que tu auras une idée plus précise de ce qui te ferait gagner du temps au quotidien.
            </div>
          </Card>
        </>
      )}
    </>
  );
}

const GROUPES_MUSCULAIRES = ["Pectoraux", "Dos", "Épaules", "Bras", "Jambes", "Abdominaux", "Cardio", "Autre"];

function VODView({ coachId, fireToast }) {
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [nomExercice, setNomExercice] = useState("");
  const [groupeExercice, setGroupeExercice] = useState(GROUPES_MUSCULAIRES[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingGroupe, setEditingGroupe] = useState(GROUPES_MUSCULAIRES[0]);
  const [selectedGroupeVOD, setSelectedGroupeVOD] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const fileRef = useRef(null);
  const editFileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("exercices_bibliotheque").select("*").eq("coach_id", coachId).order("nom", { ascending: true });
      if (error) throw error;
      setExercices(data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement exercices");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId]);

  const upload = async (file) => {
    if (!nomExercice.trim()) { fireToast("Donne un nom à l'exercice avant de l'envoyer"); return; }
    if (file && file.size > 150 * 1024 * 1024) {
      fireToast("Vidéo trop lourde (max 150 Mo) — essaie une vidéo plus courte ou compressée");
      return;
    }
    setUploading(true);
    try {
      let videoUrl = null;
      if (file) {
        const nomPropre = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `bibliotheque/${coachId}/${Date.now()}_${nomPropre}`;
        const { error: uploadErr } = await supabase.storage.from("videos").upload(fileName, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);
        videoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("exercices_bibliotheque").insert({ coach_id: coachId, nom: nomExercice, video_demo_url: videoUrl, groupe_musculaire: groupeExercice });
      if (error) throw error;
      fireToast("Exercice ajouté", "green");
      setNomExercice("");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur : " + (err.message || "création exercice"));
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (ex) => { setEditingId(ex.id); setEditingNom(ex.nom); setEditingGroupe(ex.groupe_musculaire || GROUPES_MUSCULAIRES[0]); };

  const saveEdit = async () => {
    if (!editingNom.trim()) return;
    try {
      const { error } = await supabase.from("exercices_bibliotheque").update({ nom: editingNom, groupe_musculaire: editingGroupe }).eq("id", editingId);
      if (error) throw error;
      setExercices((prev) => prev.map((ex) => (ex.id === editingId ? { ...ex, nom: editingNom, groupe_musculaire: editingGroupe } : ex)));
      fireToast("Exercice modifié", "green");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      fireToast("Erreur modification");
    }
  };

  const replaceVideo = async (id, file) => {
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      fireToast("Vidéo trop lourde (max 150 Mo) — essaie une vidéo plus courte ou compressée");
      return;
    }
    try {
      const exerciceConcerne = exercices.find((ex) => ex.id === id);
      const nomPropre = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `bibliotheque/${coachId}/${Date.now()}_${nomPropre}`;
      const { error: uploadErr } = await supabase.storage.from("videos").upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);
      const { error } = await supabase.from("exercices_bibliotheque").update({ video_demo_url: urlData.publicUrl }).eq("id", id);
      if (error) throw error;
      setExercices((prev) => prev.map((ex) => (ex.id === id ? { ...ex, video_demo_url: urlData.publicUrl } : ex)));

      // Propage aussi vers toutes les séances déjà créées avec cet exercice (sinon les clients
      // qui l'avaient déjà dans leur programme gardent l'ancienne version, sans vidéo)
      if (exerciceConcerne) {
        const { error: propagErr } = await supabase
          .from("programme_exercices")
          .update({ video_demo_url: urlData.publicUrl })
          .eq("nom", exerciceConcerne.nom);
        if (propagErr) console.error("Erreur propagation vidéo:", propagErr);
      }

      fireToast("Vidéo mise à jour partout où l'exercice est utilisé", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur : " + (err.message || "envoi vidéo"));
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cet exercice de la bibliothèque ?")) return;
    try {
      const { error } = await supabase.from("exercices_bibliotheque").delete().eq("id", id);
      if (error) throw error;
      setExercices((prev) => prev.filter((ex) => ex.id !== id));
      fireToast("Exercice supprimé", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression");
    }
  };

  const groupes = useMemo(() => {
    const map = {};
    for (const ex of exercices) {
      const g = ex.groupe_musculaire || "Autre";
      if (!map[g]) map[g] = [];
      map[g].push(ex);
    }
    return GROUPES_MUSCULAIRES.filter((g) => map[g]).map((g) => [g, map[g]]);
  }, [exercices]);

  const renderExerciceRow = (ex) => (
    <Card key={ex.id} style={{ padding: 12 }}>
      {editingId === ex.id ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text" autoFocus value={editingNom} onChange={(e) => setEditingNom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13 }}
            />
            <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={16} /></button>
          </div>
          <select value={editingGroupe} onChange={(e) => setEditingGroupe(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13 }}>
            {GROUPES_MUSCULAIRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={saveEdit} style={{ background: C.blue, border: "none", borderRadius: 8, padding: "8px", color: "#06171F", fontSize: 12, fontWeight: 700 }}>Enregistrer</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => ex.video_demo_url && setPreviewVideoUrl(ex.video_demo_url)}
            style={{ width: 36, height: 36, borderRadius: 8, background: C.card, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: ex.video_demo_url ? "pointer" : "default" }}
          >
            {ex.video_demo_url ? (
              <video src={`${ex.video_demo_url}#t=0.1`} muted playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Dumbbell size={16} color={C.textDim} />
            )}
          </div>
          <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600 }}>{ex.nom}</div>
          <button onClick={() => editFileRef.current && (editFileRef.current.dataset.exId = ex.id, editFileRef.current.click())} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 11 }}>
            {ex.video_demo_url ? "Changer vidéo" : "+ Vidéo"}
          </button>
          <button onClick={() => startEdit(ex)} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 15 }}>✎</button>
          <button onClick={() => remove(ex.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
        Ta bibliothèque d'exercices avec vidéos de démo. Elle est directement utilisée quand tu crées une séance — les exercices que tu ajoutes ici apparaissent dans "Choisir un exercice".
      </div>
      <Card style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={nomExercice}
          onChange={(e) => setNomExercice(e.target.value)}
          placeholder="Nom de l'exercice (ex : Squat barre)"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10 }}
        />
        <select value={groupeExercice} onChange={(e) => setGroupeExercice(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, marginBottom: 10 }}>
          {GROUPES_MUSCULAIRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          disabled={uploading}
          style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: uploading ? 0.6 : 1, marginBottom: 8 }}
        >
          <Upload size={16} /> {uploading ? "Envoi..." : "Ajouter avec une vidéo"}
        </button>
        <button
          onClick={() => upload(null)}
          disabled={uploading}
          style={{ width: "100%", background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 12.5 }}
        >
          Ajouter sans vidéo pour l'instant
        </button>
        <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => upload(e.target.files[0])} />
      </Card>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
      ) : exercices.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun exercice pour le moment</div></Card>
      ) : selectedGroupeVOD ? (
        <div>
          <button
            onClick={() => setSelectedGroupeVOD(null)}
            style={{ background: "transparent", border: "none", color: C.textOnBg, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}
          >
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour aux groupes
          </button>
          <SectionLabel icon={Dumbbell} onBg>{selectedGroupeVOD}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(groupes.find(([g]) => g === selectedGroupeVOD)?.[1] || []).map(renderExerciceRow)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groupes.map(([groupe, exs]) => (
            <Card key={groupe} onClick={() => setSelectedGroupeVOD(groupe)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Dumbbell size={18} color={C.blue} />
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: C.text }}>{groupe}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.textDim }}>{exs.length} exercice{exs.length > 1 ? "s" : ""}</span>
                <ChevronRight size={16} color={C.textMuted} />
              </div>
            </Card>
          ))}
        </div>
      )}
      <input
        ref={editFileRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const id = editFileRef.current.dataset.exId;
          const file = e.target.files[0];
          if (id && file) replaceVideo(id, file);
        }}
      />
      {previewVideoUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewVideoUrl(null)}>
          <div style={{ width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => setPreviewVideoUrl(null)} style={{ background: "transparent", border: "none", color: "#FFFFFF" }}><X size={22} /></button>
            </div>
            <video src={previewVideoUrl} controls autoPlay playsInline style={{ width: "100%", borderRadius: 12, background: "#000" }} />
          </div>
        </div>
      )}
    </>
  );
}

function NotificationsView({ coachId, clients, fireToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetClientId, setTargetClientId] = useState("tous");
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("maintenant"); // "maintenant" | "programmer"
  const [dateProgrammee, setDateProgrammee] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("notifications").select("*").eq("coach_id", coachId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
      fireToast("Erreur chargement notifications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [coachId]);

  const send = async () => {
    if (!titre.trim() || !message.trim()) { fireToast("Ajoute un titre et un message"); return; }
    if (mode === "programmer" && !dateProgrammee) { fireToast("Choisis une date et une heure"); return; }
    setSending(true);
    try {
      const targetIds = targetClientId === "tous" ? clients.map((c) => c.id) : [targetClientId];
      const programmee = mode === "programmer";
      const dateISO = programmee ? new Date(dateProgrammee).toISOString() : null;

      const rows = targetIds.map((clientId) => ({
        coach_id: coachId, client_id: clientId, titre, message, lu: false,
        date_prevue: dateISO, envoyee: !programmee,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from("notifications").insert(rows);
        if (error) throw error;
      }

      if (!programmee) {
        // Envoi immédiat : déclenche le push tout de suite
        Promise.allSettled(
          targetIds.map((clientId) =>
            fetch("/api/send-push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId, titre, message }),
            })
          )
        ).catch(() => {});
        fireToast("Notification envoyée", "green");
      } else {
        fireToast("Notification programmée pour le " + new Date(dateProgrammee).toLocaleString("fr-FR"), "green");
      }
      setTitre("");
      setMessage("");
      setDateProgrammee("");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div style={{ fontSize: 12.5, color: C.textOnBgMuted, marginBottom: 14 }}>
        Envoie une notification tout de suite, ou programme-la pour qu'elle parte automatiquement à une date et une heure précises (ex : rappel du bilan chaque dimanche soir).
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel icon={Bell}>Nouvelle notification</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            value={targetClientId}
            onChange={(e) => setTargetClientId(e.target.value)}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }}
          >
            <option value="tous">Tous mes clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
          <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }} />
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, resize: "none" }} />

          <div style={{ display: "flex", gap: 8 }}>
            <PillButton active={mode === "maintenant"} onClick={() => setMode("maintenant")} style={{ flex: 1, textAlign: "center" }}>Envoyer maintenant</PillButton>
            <PillButton active={mode === "programmer"} onClick={() => setMode("programmer")} style={{ flex: 1, textAlign: "center" }}>Programmer</PillButton>
          </div>

          {mode === "programmer" && (
            <input
              type="datetime-local"
              value={dateProgrammee}
              onChange={(e) => setDateProgrammee(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }}
            />
          )}

          <button onClick={send} disabled={sending} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: sending ? 0.6 : 1 }}>
            {sending ? "Envoi..." : mode === "programmer" ? "Programmer l'envoi" : "Envoyer"}
          </button>
        </div>
      </Card>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
      ) : notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n) => {
            const c = clients.find((cl) => cl.id === n.client_id);
            return (
              <Card key={n.id} style={{ padding: 12 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{n.titre}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 4 }}>
                  {c ? `${c.prenom} ${c.nom}` : "Client"} · {n.lu ? "Lu" : "Non lu"}
                  {n.type === "relance_inactif" && <span style={{ color: C.amber }}> · Relance auto</span>}
                  {n.type === "rapport_hebdo" && <span style={{ color: C.green }}> · Rapport hebdo</span>}
                  {n.type === "rappel_bilan" && <span style={{ color: C.blue }}> · Rappel bilan</span>}
                  {n.type?.startsWith("stagnation_") && <span style={{ color: C.red }}> · Stagnation</span>}
                  {n.type === "resume_quotidien" && <span style={{ color: C.blue }}> · Résumé du jour</span>}
                  {n.type?.startsWith("objectif_poids_") && <span style={{ color: C.green }}> · Objectif atteint</span>}
                  {!n.envoyee && n.date_prevue && (
                    <span style={{ color: C.amber }}> · Programmée pour le {new Date(n.date_prevue).toLocaleString("fr-FR")}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function PlanAlimentaireModal({ planActuel, onSave, onClose }) {
  const [mode, setMode] = useState("pourcentage"); // "pourcentage" | "grammes"
  const [kcal, setKcal] = useState(planActuel.kcal);
  const [pctProt, setPctProt] = useState(planActuel.pctProt);
  const [pctGluc, setPctGluc] = useState(planActuel.pctGluc);
  const [pctLip, setPctLip] = useState(planActuel.pctLip);
  const [gProt, setGProt] = useState(planActuel.prot);
  const [gGluc, setGGluc] = useState(planActuel.gluc);
  const [gLip, setGLip] = useState(planActuel.lip);

  const kcalDepuisGrammes = (parseFloat(gProt) || 0) * 4 + (parseFloat(gGluc) || 0) * 4 + (parseFloat(gLip) || 0) * 9;
  const pctTotal = (parseFloat(pctProt) || 0) + (parseFloat(pctGluc) || 0) + (parseFloat(pctLip) || 0);

  const save = () => {
    if (mode === "pourcentage") {
      onSave({
        kcal: parseInt(kcal) || planActuel.kcal,
        pctProt: parseInt(pctProt) || 0,
        pctGluc: parseInt(pctGluc) || 0,
        pctLip: parseInt(pctLip) || 0,
      });
    } else {
      const total = kcalDepuisGrammes || 1;
      onSave({
        kcal: Math.round(total),
        pctProt: Math.round(((parseFloat(gProt) || 0) * 4 / total) * 100),
        pctGluc: Math.round(((parseFloat(gGluc) || 0) * 4 / total) * 100),
        pctLip: Math.round(((parseFloat(gLip) || 0) * 9 / total) * 100),
      });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 380, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <SectionLabel icon={Flame}>Plan alimentaire</SectionLabel>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <PillButton active={mode === "pourcentage"} onClick={() => setMode("pourcentage")} style={{ flex: 1, textAlign: "center" }}>En %</PillButton>
          <PillButton active={mode === "grammes"} onClick={() => setMode("grammes")} style={{ flex: 1, textAlign: "center" }}>En grammes</PillButton>
        </div>

        {mode === "pourcentage" ? (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textDim, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Objectif calorique</div>
            <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 16, fontFamily: FONT_MONO, marginBottom: 16 }} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textDim, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
              Répartition des macros — total {pctTotal}% {pctTotal !== 100 && <span style={{ color: C.red }}>(devrait faire 100%)</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Protéines (%)</div>
                <input type="number" value={pctProt} onChange={(e) => setPctProt(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Glucides (%)</div>
                <input type="number" value={pctGluc} onChange={(e) => setPctGluc(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Lipides (%)</div>
                <input type="number" value={pctLip} onChange={(e) => setPctLip(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textDim, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
              Macros en grammes — {Math.round(kcalDepuisGrammes)} kcal calculées
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Protéines (g)</div>
                <input type="number" value={gProt} onChange={(e) => setGProt(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Glucides (g)</div>
                <input type="number" value={gGluc} onChange={(e) => setGGluc(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Lipides (g)</div>
                <input type="number" value={gLip} onChange={(e) => setGLip(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO }} />
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 14 }}>Annuler</button>
          <button onClick={save} style={{ flex: 1, background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>Enregistrer</button>
        </div>
      </Card>
    </div>
  );
}

function ResetPasswordCard({ client, fireToast }) {
  const [nouveauMdp, setNouveauMdp] = useState(null);
  const [loading, setLoading] = useState(false);

  const genererMotDePasse = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let mdp = "";
    for (let i = 0; i < 8; i++) mdp += chars[Math.floor(Math.random() * chars.length)];
    return mdp;
  };

  const reinitialiser = async () => {
    if (!client.auth_user_id) {
      fireToast("Impossible : ce compte n'a pas d'identifiant d'authentification");
      return;
    }
    if (!confirm(`Générer un nouveau mot de passe pour ${client.prenom} ? L'ancien ne fonctionnera plus.`)) return;
    setLoading(true);
    try {
      const mdp = genererMotDePasse();
      const res = await fetch("/api/reset-client-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUserId: client.auth_user_id, newPassword: mdp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setNouveauMdp(mdp);
      fireToast("Nouveau mot de passe généré", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copier = () => {
    navigator.clipboard.writeText(nouveauMdp);
    fireToast("Copié", "green");
  };

  return (
    <Card>
      <SectionLabel icon={ClipboardList}>Mot de passe</SectionLabel>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
        Si {client.prenom} a oublié son mot de passe, génère-en un nouveau ici et transmets-le-lui toi-même (SMS, en personne...). Aucun email n'est envoyé automatiquement.
      </div>
      {nouveauMdp && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.text, fontWeight: 700, flex: 1 }}>{nouveauMdp}</span>
          <button onClick={copier} style={{ background: C.green, border: "none", borderRadius: 8, padding: "6px 10px", color: "#06171F", fontSize: 11, fontWeight: 700 }}>Copier</button>
        </div>
      )}
      <button
        onClick={reinitialiser}
        disabled={loading}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13.5, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Génération..." : "Générer un nouveau mot de passe"}
      </button>
    </Card>
  );
}

function CalendrierNutritionCoach({ repas }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const datesAvecRepas = useMemo(() => new Set(repas.map((r) => r.date)), [repas]);
  const repasDuJour = useMemo(() => repas.filter((r) => r.date === selectedDate), [repas, selectedDate]);
  const totalKcalJour = repasDuJour.reduce((sum, r) => sum + (r.kcal || 0), 0);

  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
            <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
            {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </div>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, color: C.textDim, fontWeight: 700 }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const iso = isoFor(d);
            const hasRepas = datesAvecRepas.has(iso);
            const estSelectionne = iso === selectedDate;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(iso)}
                style={{
                  aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, background: estSelectionne ? C.blue : (hasRepas ? C.surface : "transparent"),
                  border: estSelectionne ? "none" : "1px solid transparent",
                }}
              >
                <div style={{ fontSize: 10.5, color: estSelectionne ? "#FFFFFF" : C.text, fontWeight: estSelectionne ? 700 : 400 }}>{d}</div>
                {hasRepas && <div style={{ width: 4, height: 4, borderRadius: "50%", background: estSelectionne ? "#FFFFFF" : C.green, marginTop: 2 }} />}
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ fontSize: 12, color: C.textOnBg, margin: "10px 0 6px", fontWeight: 700 }}>
        {formatDateDisplay(selectedDate)} · {totalKcalJour} kcal
      </div>
      {repasDuJour.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucun repas enregistré ce jour-là</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MEAL_DEFS.map((m) => {
            const items = repasDuJour.filter((r) => r.type_repas === m.key);
            if (items.length === 0) return null;
            const totalKcalRepas = items.reduce((sum, r) => sum + (r.kcal || 0), 0);
            return (
              <div key={m.key}>
                <div style={{ fontSize: 12.5, color: C.textOnBg, fontWeight: 700, marginBottom: 6 }}>
                  {m.emoji} {m.nom} <span style={{ color: C.textOnBgMuted, fontWeight: 400 }}>· {totalKcalRepas} kcal</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((r) => (
                    <Card key={r.id} style={{ padding: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.aliment}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{r.grammes}g · {r.kcal} kcal</div>
                      <div style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_MONO, marginTop: 4 }}>
                        P{r.prot} G{r.gluc} L{r.lip}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function JourDetailModal({ date, checkin, poids, seance, seriesDeLaSeance, repasJour, onClose }) {
  const rienDuTout = !checkin && !poids && !seance && repasJour.length === 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel icon={Calendar}>{formatDateDisplay(date)}</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={20} /></button>
        </div>

        {rienDuTout ? (
          <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Rien d'enregistré ce jour-là</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {checkin && (
              <div>
                <SectionLabel icon={Flame}>Bilan du jour</SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Fatigue</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{checkin.fatigue}/5</div>
                  </div>
                  <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Sommeil</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{checkin.sommeil}/5</div>
                  </div>
                  <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Énergie</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{checkin.energie}/5</div>
                  </div>
                </div>
              </div>
            )}

            {poids && (
              <div>
                <SectionLabel icon={TrendingUp}>Poids</SectionLabel>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>{poids.poids} kg</div>
              </div>
            )}

            {seance && (() => {
              const parExercice = [];
              for (const sr of seriesDeLaSeance) {
                let entry = parExercice.find((e) => e.nom === sr.exercice_nom);
                if (!entry) {
                  entry = { nom: sr.exercice_nom, series: [], video: sr.video_url || null };
                  parExercice.push(entry);
                }
                entry.series.push(sr);
                if (!entry.video && sr.video_url) entry.video = sr.video_url;
              }
              return (
                <div>
                  <SectionLabel icon={Dumbbell}>Séance · {seance.nom_programme}</SectionLabel>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{fmtTime(seance.duree_secondes || 0)}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {parExercice.map((ex, ei) => (
                      <div key={ei} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: C.card, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {ex.video ? (
                            <video src={`${ex.video}#t=0.1`} muted playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <VideoIcon size={16} color={C.textDim} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 6 }}>{ex.nom}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {ex.series.map((sr, i) => (
                              <span key={i} style={{ fontSize: 11.5, color: "#FFFFFF", background: C.blue, borderRadius: 8, padding: "5px 9px", fontFamily: FONT_MONO, fontWeight: 700 }}>
                                {sr.poids}kg × {sr.reps} <span style={{ opacity: 0.85 }}>RPE{sr.rpe}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {repasJour.length > 0 && (() => {
              const totalKcalJour = repasJour.reduce((sum, r) => sum + (r.kcal || 0), 0);
              return (
                <div>
                  <SectionLabel icon={Apple}>Nutrition · {totalKcalJour} kcal au total</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {MEAL_DEFS.map((m) => {
                      const items = repasJour.filter((r) => r.type_repas === m.key);
                      if (items.length === 0) return null;
                      const totalKcalRepas = items.reduce((sum, r) => sum + (r.kcal || 0), 0);
                      return (
                        <div key={m.key} style={{ border: `2px solid ${C.amber}`, borderRadius: 12, padding: 10 }}>
                          <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 800, marginBottom: 8 }}>
                            {m.emoji} {m.nom} <span style={{ fontWeight: 400 }}>· {totalKcalRepas} kcal</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {items.map((r) => (
                              <div key={r.id} style={{ fontSize: 12, color: C.text, background: C.surface, borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                                <span>{r.aliment} <span style={{ color: C.textMuted }}>· {r.grammes}g</span></span>
                                <span style={{ fontFamily: FONT_MONO, fontWeight: 700 }}>{r.kcal} kcal</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Card>
    </div>
  );
}

function ClientDetailView({ client, onBack, onLogout, fireToast, onDeleted }) {
  const [tab, setTab] = useState("programme");
  const [loading, setLoading] = useState(true);
  const [seances, setSeances] = useState([]);
  const [seriesBySeance, setSeriesBySeance] = useState({});
  const [previewClientVideo, setPreviewClientVideo] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [repas, setRepas] = useState([]);

  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [customProgrammes, setCustomProgrammes] = useState([]);
  const [checkinsQuotidiens, setCheckinsQuotidiens] = useState([]);
  const [poidsRawDates, setPoidsRawDates] = useState([]);
  const [poidsRawList, setPoidsRawList] = useState([]);
  const [photosHistoryCoach, setPhotosHistoryCoach] = useState([]);
  const [mensurationsCoach, setMensurationsCoach] = useState([]);
  const [notifActivees, setNotifActivees] = useState(null); // null = en cours de vérification
  const [notePrivee, setNotePrivee] = useState(client.note_privee || "");
  const [connexionsRecentes, setConnexionsRecentes] = useState([]);

  useEffect(() => {
    supabase.from("connexions_log").select("connected_at").eq("profil_id", client.id).order("connected_at", { ascending: false }).limit(5)
      .then(({ data }) => setConnexionsRecentes(data || []));
  }, [client.id]);
  const [savingNote, setSavingNote] = useState(false);
  const [masque, setMasque] = useState(client.masque || false);
  const [deleting, setDeleting] = useState(false);

  const enregistrerNote = async () => {
    setSavingNote(true);
    try {
      const { error } = await supabase.from("profils").update({ note_privee: notePrivee }).eq("id", client.id);
      if (error) throw error;
      fireToast("Note enregistrée", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement note");
    } finally {
      setSavingNote(false);
    }
  };

  const toggleMasque = async () => {
    const nouveauMasque = !masque;
    setMasque(nouveauMasque);
    try {
      const { error } = await supabase.from("profils").update({ masque: nouveauMasque }).eq("id", client.id);
      if (error) throw error;
      fireToast(nouveauMasque ? "Client masqué de la liste principale" : "Client de nouveau visible", "green");
    } catch (err) {
      console.error(err);
      setMasque(!nouveauMasque);
      fireToast("Erreur");
    }
  };

  const supprimerClient = async () => {
    if (!confirm(`Supprimer définitivement le profil de ${client.prenom} ${client.nom} ? Toutes ses données (séances, nutrition, bilans, photos) seront perdues. Cette action est irréversible.`)) return;
    if (!confirm("Vraiment sûr(e) ? Cette action ne peut pas être annulée.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilId: client.id, authUserId: client.auth_user_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur suppression");
      fireToast("Client supprimé", "green");
      onDeleted?.();
    } catch (err) {
      console.error(err);
      fireToast(err.message || "Erreur suppression client");
      setDeleting(false);
    }
  };
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [planAlimentaire, setPlanAlimentaire] = useState(() => {
    const kcal = client.objectif_calories || 2400;
    const pctProt = client.pct_prot || 30;
    const pctGluc = client.pct_gluc || 45;
    const pctLip = client.pct_lip || 25;
    return {
      kcal, pctProt, pctGluc, pctLip,
      prot: Math.round((kcal * pctProt / 100) / 4),
      gluc: Math.round((kcal * pctGluc / 100) / 4),
      lip: Math.round((kcal * pctLip / 100) / 9),
    };
  });
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [seancesRes, poidsRes, checkinsRes, repasRes, programmesRes, dailyRes, photosRes, mensurationsRes, pushRes] = await Promise.all([
          supabase.from("seances").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(10),
          supabase.from("poids_historique").select("*").eq("profil_id", client.id).order("date", { ascending: true }),
          supabase.from("bilans_semaine").select("*").eq("profil_id", client.id).order("date", { ascending: false }),
          supabase.from("repas").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(30),
          supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }),
          supabase.from("checkins_quotidiens").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(30),
          supabase.from("photos_bilan").select("*").eq("profil_id", client.id).order("date", { ascending: false }),
          supabase.from("mensurations").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(5),
          supabase.from("push_subscriptions").select("id").eq("profil_id", client.id).limit(1),
        ]);
        if (!active) return;

        const seancesData = seancesRes.data || [];
        setSeances(seancesData);
        setWeightHistory((poidsRes.data || []).map((r) => ({ date: formatDateDisplay(r.date), poids: Number(r.poids) })));
        setPoidsRawDates((poidsRes.data || []).map((r) => r.date));
        setPoidsRawList(poidsRes.data || []);
        setCheckins(checkinsRes.data || []);
        setRepas(repasRes.data || []);
        setCustomProgrammes(programmesRes.data || []);
        setCheckinsQuotidiens(dailyRes.data || []);
        setPhotosHistoryCoach(photosRes.data || []);
        setMensurationsCoach(mensurationsRes.data || []);
        setNotifActivees((pushRes.data || []).length > 0);

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

  const seancesDatesSet = useMemo(() => new Set(seances.map((s) => s.date)), [seances]);
  const poidsDatesSet = useMemo(() => new Set(poidsRawDates), [poidsRawDates]);
  const nutritionDatesSet = useMemo(() => new Set(repas.map((r) => r.date)), [repas]);
  const [selectedJourDetail, setSelectedJourDetail] = useState(null);
  const bilansDatesSet = useMemo(() => {
    const set = new Set();
    for (const c of checkins) {
      const d = parseFrDate(c.date);
      if (d) set.add(d.toISOString().slice(0, 10));
    }
    return set;
  }, [checkins]);

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
          <button onClick={() => { console.log("CLIC RETOUR DETECTE"); setSelectedProgramme(null); }} style={{ background: "transparent", border: "none", color: C.textOnBg, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.textOnBg }}>{selectedProgramme.nom}</div>
              <div style={{ fontSize: 12, color: C.textOnBgMuted }}>{selectedProgramme.muscle}</div>
            </div>
            <button onClick={() => { setEditingProgramme(selectedProgramme); setShowSeanceForm(true); }} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>Modifier</button>
          </div>
          <SectionLabel icon={TrendingUp} onBg>Historique des performances</SectionLabel>
          <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            <LegendDot color={C.green} label="Progrès" />
            <LegendDot color={C.amber} label="Stagnation" />
            <LegendDot color={C.red} label="Régression" />
          </div>
          {historiqueFiltré.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Le client n'a pas encore réalisé cette séance</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {historiqueFiltré.map((s, sIdx) => {
                // Regroupe les séries par exercice (dans l'ordre d'apparition), et détermine
                // les groupes superset à partir de la définition du programme.
                const seriesDeLaSeance = seriesBySeance[s.id] || [];
                const groupeSupersetParNom = {};
                for (const pe of selectedProgramme.programme_exercices || []) {
                  if (pe.groupe_superset) groupeSupersetParNom[pe.nom] = pe.groupe_superset;
                }
                const parExercice = [];
                for (const sr of seriesDeLaSeance) {
                  let entry = parExercice.find((e) => e.nom === sr.exercice_nom);
                  if (!entry) {
                    entry = { nom: sr.exercice_nom, series: [], groupeSuperset: groupeSupersetParNom[sr.exercice_nom] || null };
                    parExercice.push(entry);
                  }
                  entry.series.push(sr);
                }
                // Regroupe les blocs consécutifs de même superset
                const blocs = [];
                let bi = 0;
                while (bi < parExercice.length) {
                  const ex = parExercice[bi];
                  if (ex.groupeSuperset) {
                    const groupe = [ex];
                    let bj = bi + 1;
                    while (bj < parExercice.length && parExercice[bj].groupeSuperset === ex.groupeSuperset) {
                      groupe.push(parExercice[bj]);
                      bj++;
                    }
                    blocs.push({ type: "superset", exs: groupe });
                    bi = bj;
                  } else {
                    blocs.push({ type: "single", exs: [ex] });
                    bi++;
                  }
                }

                const renderExercice = (ex) => {
                  const videoDeLExercice = ex.series.find((sr) => sr.video_url)?.video_url || null;
                  return (
                  <div key={ex.nom} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10 }}>
                    <button
                      onClick={() => videoDeLExercice && setPreviewClientVideo(videoDeLExercice)}
                      style={{
                        width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                        background: C.card, border: `1px solid ${C.cardBorderLight}`,
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                        cursor: videoDeLExercice ? "pointer" : "default",
                      }}
                    >
                      {videoDeLExercice ? (
                        <video src={`${videoDeLExercice}#t=0.1`} muted playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <VideoIcon size={18} color={C.textDim} />
                      )}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 6 }}>{ex.nom}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ex.series.map((sr, i) => {
                          const couleur = getProgressionColor(historiqueFiltré, seriesBySeance, sIdx, sr.exercice_nom, sr.poids, sr.reps);
                          return (
                            <span key={i} style={{ fontSize: 11.5, color: "#FFFFFF", background: couleur, borderRadius: 8, padding: "5px 9px", fontFamily: FONT_MONO, fontWeight: 700 }}>
                              {sr.poids}kg × {sr.reps} <span style={{ opacity: 0.85 }}>RPE{sr.rpe}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                };

                return (
                  <Card key={s.id}>
                    <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>{formatDateDisplay(s.date)} · {fmtTime(s.duree_secondes || 0)}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {blocs.map((bloc, bidx) =>
                        bloc.type === "superset" ? (
                          <div key={bidx} style={{ border: `3px solid ${C.blue}`, borderRadius: 14, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Zap size={12} color={C.blue} />
                              <span style={{ fontSize: 10, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Superset</span>
                            </div>
                            {bloc.exs.map(renderExercice)}
                          </div>
                        ) : (
                          renderExercice(bloc.exs[0])
                        )
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {previewClientVideo && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewClientVideo(null)}>
              <div style={{ width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button onClick={() => setPreviewClientVideo(null)} style={{ background: "transparent", border: "none", color: "#FFFFFF" }}><X size={22} /></button>
                </div>
                <video src={previewClientVideo} controls autoPlay playsInline style={{ width: "100%", borderRadius: 12, background: "#000" }} />
              </div>
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
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.textOnBg, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
          </button>
          <LogoutButton onLogout={onLogout} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: client.photo_url ? `url(${client.photo_url}) center/cover` : C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {!client.photo_url && <User size={20} color={C.blue} />}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.textOnBg }}>
            {client.prenom} {client.nom}
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textOnBgMuted, marginBottom: 16 }}>{client.objectif_principal}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {detailTabs.map((t) => {
            const Icon = t.icon;
            return (
              <PillButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} onBg style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Icon size={14} /> {t.label}
              </PillButton>
            );
          })}
        </div>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : tab === "programme" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => setShowSeanceForm(true)} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={16} /> Créer une séance
            </button>
            {customProgrammes.length > 0 && (() => {
              const JOURS_ORDRE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
              const avecJour = customProgrammes.filter((p) => p.jour_fixe);
              const sansJour = customProgrammes.filter((p) => !p.jour_fixe);

              // Jours de la semaine en cours déjà validés par le client, pour le suivi vert
              const now = new Date();
              const decalage = (now.getDay() + 6) % 7;
              const lundi = new Date(now);
              lundi.setDate(now.getDate() - decalage);
              const lundiIso = `${lundi.getFullYear()}-${String(lundi.getMonth() + 1).padStart(2, "0")}-${String(lundi.getDate()).padStart(2, "0")}`;
              const joursValidesCetteSemaine = new Set();
              for (const s of seances) {
                const dateSeanceIso = String(s.date).slice(0, 10);
                if (dateSeanceIso < lundiIso) continue;
                const p = avecJour.find((prog) => prog.id === s.programme_id) || avecJour.find((prog) => prog.nom === s.nom_programme);
                if (p) joursValidesCetteSemaine.add(p.jour_fixe);
              }

              const renderProgCard = (p) => (
                <Card key={p.id} onClick={() => setSelectedProgramme(p)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      {p.jour_fixe && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{p.jour_fixe}</div>
                      )}
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text }}>{p.nom}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingProgramme(p); setShowSeanceForm(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                      <button onClick={async (e) => { e.stopPropagation(); if (!confirm("Supprimer cette séance ?")) return; await supabase.from("programmes").delete().eq("id", p.id); setCustomProgrammes((prev) => prev.filter((x) => x.id !== p.id)); }} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{p.muscle}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>
                    {(p.programme_exercices || []).length} exercices · {(p.programme_exercices || []).reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries
                  </div>
                </Card>
              );
              return (
                <>
                  {avecJour.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
                      <SectionLabel icon={Calendar} onBg>Semaine type</SectionLabel>
                      {JOURS_ORDRE.map((jour) => {
                        const p = avecJour.find((prog) => prog.jour_fixe === jour);
                        const estValide = joursValidesCetteSemaine.has(jour);
                        return (
                          <Card
                            key={jour}
                            onClick={() => p && setSelectedProgramme(p)}
                            style={{
                              cursor: p ? "pointer" : "default",
                              border: estValide ? `2px solid ${C.green}` : undefined,
                              boxShadow: estValide ? "0 0 14px rgba(34,168,118,0.5)" : undefined,
                            }}
                          >
                            <div style={{ fontSize: 10, fontWeight: 700, color: estValide ? C.green : C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                              {jour}{estValide && " · Validé ✓"}
                            </div>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: p ? C.text : C.textDim }}>{p ? p.nom : "Repos"}</div>
                            {p && (
                              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                                {(p.programme_exercices || []).length} exercices · {(p.programme_exercices || []).reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {sansJour.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <SectionLabel icon={Dumbbell} onBg>{avecJour.length > 0 ? "Autres séances (cycle)" : "Séances personnalisées"}</SectionLabel>
                      {sansJour.map(renderProgCard)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : tab === "bilans" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <MiniCalendarClient seancesDates={seancesDatesSet} poidsDates={poidsDatesSet} bilansDates={bilansDatesSet} nutritionDates={nutritionDatesSet} onSelectDay={setSelectedJourDetail} />
            {selectedJourDetail && (() => {
              const checkinDuJour = checkins.find((c) => c.date === selectedJourDetail);
              const poidsDuJour = poidsRawList.find((p) => p.date === selectedJourDetail);
              const seanceDuJour = seances.find((s) => s.date === selectedJourDetail);
              const seriesDeLaSeance = seanceDuJour ? (seriesBySeance[seanceDuJour.id] || []) : [];
              const repasDuJour = repas.filter((r) => r.date === selectedJourDetail);
              return (
                <JourDetailModal
                  date={selectedJourDetail}
                  checkin={checkinDuJour}
                  poids={poidsDuJour}
                  seance={seanceDuJour}
                  seriesDeLaSeance={seriesDeLaSeance}
                  repasJour={repasDuJour}
                  onClose={() => setSelectedJourDetail(null)}
                />
              );
            })()}
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
                          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
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
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textDim }} axisLine={false} tickLine={false} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: C.textDim }} axisLine={false} tickLine={false} width={30} />
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

            <Card>
              <SectionLabel icon={Camera}>Bilan photo</SectionLabel>
              {photosHistoryCoach.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13 }}>Aucune photo envoyée</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {PHOTO_CATS.map((cat) => {
                    const latest = photosHistoryCoach.find((p) => p.categorie === cat.key);
                    return (
                      <div key={cat.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div
                          style={{
                            width: "100%", aspectRatio: "3/4", borderRadius: 10,
                            background: latest ? `url(${latest.url}) center/cover` : C.surface,
                            border: `1px solid ${C.cardBorderLight}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {!latest && <Camera size={16} color={C.textDim} />}
                        </div>
                        <div style={{ fontSize: 9.5, color: C.textDim, textAlign: "center" }}>{cat.nom}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <SectionLabel icon={Target}>Mensurations</SectionLabel>
              {mensurationsCoach.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13 }}>Aucune mensuration envoyée</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mensurationsCoach.map((m, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10, fontSize: 12, color: C.textMuted }}>
                      <span style={{ color: C.text, fontWeight: 700 }}>{formatDateDisplay(m.date)}</span> — taille {m.tour_taille ?? "—"}cm, poitrine {m.tour_poitrine ?? "—"}cm, épaule {m.tour_epaule ?? "—"}cm, bras D/G {m.tour_bras_droit ?? "—"}/{m.tour_bras_gauche ?? "—"}cm, avant-bras D/G {m.tour_avant_bras_droit ?? "—"}/{m.tour_avant_bras_gauche ?? "—"}cm, cuisse D/G {m.tour_cuisse_droite ?? "—"}/{m.tour_cuisse_gauche ?? "—"}cm, mollet D/G {m.tour_mollet_droit ?? "—"}/{m.tour_mollet_gauche ?? "—"}cm
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : tab === "nutrition" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel icon={Flame}>Plan alimentaire</SectionLabel>
                <button onClick={() => setShowPlanEditor(true)} style={{ background: "transparent", border: "none", color: C.blue, fontSize: 12, fontWeight: 700 }}>Modifier</button>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.text, fontWeight: 700, marginBottom: 6 }}>
                {planAlimentaire.kcal} <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400 }}>kcal / jour</span>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.textMuted }}>
                <span>Protéines <strong style={{ color: C.blue }}>{planAlimentaire.prot}g</strong></span>
                <span>Glucides <strong style={{ color: C.green }}>{planAlimentaire.gluc}g</strong></span>
                <span>Lipides <strong style={{ color: C.amber }}>{planAlimentaire.lip}g</strong></span>
              </div>
            </Card>
            {repas.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucun repas enregistré</div></Card>
            ) : (
              <CalendrierNutritionCoach repas={repas} />
            )}
          </div>
        ) : null}
        {showPlanEditor && (
          <PlanAlimentaireModal
            planActuel={planAlimentaire}
            onClose={() => setShowPlanEditor(false)}
            onSave={async (nouveauPlan) => {
              try {
                const { error } = await supabase.from("profils").update({
                  objectif_calories: nouveauPlan.kcal,
                  pct_prot: nouveauPlan.pctProt,
                  pct_gluc: nouveauPlan.pctGluc,
                  pct_lip: nouveauPlan.pctLip,
                }).eq("id", client.id);
                if (error) throw error;
                setPlanAlimentaire({
                  ...nouveauPlan,
                  prot: Math.round((nouveauPlan.kcal * nouveauPlan.pctProt / 100) / 4),
                  gluc: Math.round((nouveauPlan.kcal * nouveauPlan.pctGluc / 100) / 4),
                  lip: Math.round((nouveauPlan.kcal * nouveauPlan.pctLip / 100) / 9),
                });
                fireToast("Plan alimentaire mis à jour", "green");
                setShowPlanEditor(false);
              } catch (err) {
                console.error(err);
                fireToast("Erreur mise à jour du plan");
              }
            }}
          />
        )}
        {tab === "profil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionLabel icon={User}>Informations personnelles</SectionLabel>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Prénom: {client.prenom}</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Nom: {client.nom}</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Âge: {client.age || "-"} ans</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Taille: {client.taille || "-"} cm</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Poids actuel: {client.poids_actuel || "-"} kg</div>
              <div style={{ fontSize: 14, color: C.text }}>Objectif de poids: {client.poids_objectif || "-"} kg</div>
            </Card>
            <Card>
              <SectionLabel icon={Target}>Objectifs</SectionLabel>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Objectif principal: {client.objectif_principal || "-"}</div>
              <div style={{ fontSize: 14, color: C.text }}>Objectif secondaire: {client.objectif_secondaire || "-"}</div>
            </Card>
            <Card>
              <SectionLabel icon={Bell}>Notifications push</SectionLabel>
              {notifActivees === null ? (
                <div style={{ fontSize: 13, color: C.textMuted }}>Vérification...</div>
              ) : notifActivees ? (
                <div style={{ fontSize: 13, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={15} /> Activées par le client
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
                  Non activées (le client n'a pas encore autorisé les notifications)
                </div>
              )}
            </Card>
            <ResetPasswordCard client={client} fireToast={fireToast} />

            <Card>
              <SectionLabel icon={Clock}>Connexions récentes</SectionLabel>
              {connexionsRecentes.length === 0 ? (
                <div style={{ fontSize: 12.5, color: C.textMuted }}>Aucune connexion enregistrée pour le moment.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {connexionsRecentes.map((c, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: C.text, display: "flex", justifyContent: "space-between" }}>
                      <span>{i === 0 ? "Dernière connexion" : "Connexion"}</span>
                      <span style={{ color: C.textMuted }}>{new Date(c.connected_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionLabel icon={ClipboardList}>Note privée</SectionLabel>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                Visible uniquement par toi — le client n'y a jamais accès.
              </div>
              <textarea
                value={notePrivee}
                onChange={(e) => setNotePrivee(e.target.value)}
                placeholder="Ex : sensible au genou droit, préfère s'entraîner le matin..."
                rows={4}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13, resize: "none", marginBottom: 10 }}
              />
              <button onClick={enregistrerNote} disabled={savingNote} style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 12, padding: "11px", fontWeight: 800, fontSize: 13, opacity: savingNote ? 0.6 : 1 }}>
                {savingNote ? "Enregistrement..." : "Enregistrer la note"}
              </button>
            </Card>

            <Card>
              <SectionLabel icon={Folder}>Visibilité</SectionLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12.5, color: C.textMuted, maxWidth: 240 }}>
                  {masque ? "Ce client est masqué de ta liste principale (visible dans \"Archivés\")." : "Ce client apparaît dans ta liste principale de clients."}
                </div>
                <button
                  onClick={toggleMasque}
                  style={{ background: masque ? C.amber : C.surface, border: `1px solid ${masque ? C.amber : C.cardBorderLight}`, color: masque ? "#3D2600" : C.blue, borderRadius: 10, padding: "9px 12px", fontWeight: 700, fontSize: 12, flexShrink: 0 }}
                >
                  {masque ? "Réafficher" : "Masquer"}
                </button>
              </div>
            </Card>

            <Card style={{ border: `1px solid ${C.red}` }}>
              <SectionLabel icon={Trash2}>Zone dangereuse</SectionLabel>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                Supprime définitivement ce client et toutes ses données (séances, nutrition, bilans, photos). À utiliser quand le suivi est terminé.
              </div>
              <button onClick={supprimerClient} disabled={deleting} style={{ width: "100%", background: C.red, border: "none", color: "#FFFFFF", borderRadius: 12, padding: "11px", fontWeight: 800, fontSize: 13, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Suppression..." : "Supprimer ce client"}
              </button>
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

// Compare une série à la précédente occurrence du même exercice (séances triées du plus récent au plus ancien)
// pour savoir si le client a progressé (vert), stagné (orange) ou régressé (rouge).
function getProgressionColor(seancesTriees, seriesBySeance, index, exerciceNom, poids, reps) {
  for (let j = index + 1; j < seancesTriees.length; j++) {
    const ancienneSeance = seancesTriees[j];
    const anciennesSeries = seriesBySeance[ancienneSeance.id] || [];
    const match = anciennesSeries.find((s) => s.exercice_nom === exerciceNom);
    if (match) {
      const p = Number(poids), mp = Number(match.poids);
      const r = Number(reps), mr = Number(match.reps);
      if (p > mp || (p === mp && r > mr)) return C.green;
      if (p === mp && r === mr) return C.amber;
      return C.red;
    }
  }
  return C.blue;
}

const parseFrDate = (str) => {
  if (!str) return null;
  const parts = str.split("/").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [d, m, y] = parts;
  return new Date(y, m - 1, d);
};

function CoachDashboard({ coachProfil, onLogout, fireToast, viewMode, setViewMode }) {
  const [coachTab, setCoachTab] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [recentSeances, setRecentSeances] = useState([]);
  const [recentBilans, setRecentBilans] = useState([]);
  const [dernierBilanParClient, setDernierBilanParClient] = useState({});
  const [seancesEnAttente, setSeancesEnAttente] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupe, setSelectedGroupe] = useState("Tous");
  const [editingGroupeId, setEditingGroupeId] = useState(null);
  const [groupeInput, setGroupeInput] = useState("");
  const [tachesEnAttenteCount, setTachesEnAttenteCount] = useState(0);
  const [tachesApercu, setTachesApercu] = useState([]);
  const [dernierSeanceParClient, setDernierSeanceParClient] = useState({});
  const [premiereSeanceParClient, setPremiereSeanceParClient] = useState({});
  const [derniereConnexionParClient, setDerniereConnexionParClient] = useState({});
  const [tendancePoidsParClient, setTendancePoidsParClient] = useState({});

  useEffect(() => {
    supabase
      .from("taches")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coachProfil.id)
      .eq("statut", "a_faire")
      .then(({ count }) => setTachesEnAttenteCount(count || 0));
  }, [coachProfil.id, coachTab]);

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
      const clientsData = data || [];
      setClients(clientsData);

      if (clientsData.length > 0) {
        const ids = clientsData.map((c) => c.id);
        const today = todayIso();
        const [seancesRes, bilansRes, programmesRes, seancesAujourdhuiRes, allSeancesRes, poidsRes, tachesRes, connexionsRes] = await Promise.all([
          supabase.from("seances").select("id, profil_id, nom_programme, date").in("profil_id", ids).order("date", { ascending: false }).limit(8),
          supabase.from("bilans_semaine").select("id, profil_id, date").in("profil_id", ids).limit(150),
          supabase.from("programmes").select("id, profil_id, nom").in("profil_id", ids).order("created_at", { ascending: true }),
          supabase.from("seances").select("profil_id").in("profil_id", ids).eq("date", today),
          supabase.from("seances").select("profil_id, date").in("profil_id", ids).order("date", { ascending: false }).limit(500),
          supabase.from("poids_historique").select("profil_id, poids, date").in("profil_id", ids).order("date", { ascending: false }).limit(300),
          supabase.from("taches").select("*").eq("coach_id", coachProfil.id).eq("statut", "a_faire").order("date_echeance", { ascending: true }).limit(5),
          supabase.from("connexions_log").select("profil_id, connected_at").in("profil_id", ids).order("connected_at", { ascending: false }).limit(500),
        ]);
        setRecentSeances(seancesRes.data || []);
        setTachesApercu(tachesRes.data || []);

        const derniereConnexion = {};
        for (const c of connexionsRes.data || []) {
          if (!derniereConnexion[c.profil_id]) derniereConnexion[c.profil_id] = c.connected_at;
        }
        setDerniereConnexionParClient(derniereConnexion);

        const dernierSeance = {};
        const premiereSeance = {};
        for (const s of allSeancesRes.data || []) {
          if (!dernierSeance[s.profil_id]) dernierSeance[s.profil_id] = s.date;
          if (!premiereSeance[s.profil_id] || s.date < premiereSeance[s.profil_id]) premiereSeance[s.profil_id] = s.date;
        }
        setDernierSeanceParClient(dernierSeance);
        setPremiereSeanceParClient(premiereSeance);

        const poidsParClient = {};
        for (const p of poidsRes.data || []) {
          if (!poidsParClient[p.profil_id]) poidsParClient[p.profil_id] = [];
          if (poidsParClient[p.profil_id].length < 2) poidsParClient[p.profil_id].push(p);
        }
        const tendance = {};
        for (const [cid, arr] of Object.entries(poidsParClient)) {
          if (arr.length < 2) continue;
          tendance[cid] = { delta: Number(arr[0].poids) - Number(arr[1].poids), actuel: Number(arr[0].poids) };
        }
        setTendancePoidsParClient(tendance);

        const bilansAvecDate = (bilansRes.data || [])
          .map((b) => ({ ...b, dateParsed: parseFrDate(b.date) }))
          .filter((b) => b.dateParsed)
          .sort((a, b) => b.dateParsed - a.dateParsed);
        setRecentBilans(bilansAvecDate.slice(0, 6));

        const latestByClient = {};
        for (const b of bilansAvecDate) {
          if (!latestByClient[b.profil_id]) latestByClient[b.profil_id] = b.dateParsed;
        }
        setDernierBilanParClient(latestByClient);

        const profilsAvecSeanceAujourdhui = new Set((seancesAujourdhuiRes.data || []).map((s) => s.profil_id));
        const premierProgrammeParClient = {};
        for (const p of programmesRes.data || []) {
          if (!premierProgrammeParClient[p.profil_id]) premierProgrammeParClient[p.profil_id] = p.nom;
        }
        const enAttente = clientsData
          .filter((c) => premierProgrammeParClient[c.id] && !profilsAvecSeanceAujourdhui.has(c.id))
          .map((c) => ({ client: c, programme: premierProgrammeParClient[c.id] }));
        setSeancesEnAttente(enAttente);
      } else {
        setRecentSeances([]);
        setRecentBilans([]);
        setDernierBilanParClient({});
        setSeancesEnAttente([]);
        setTachesApercu([]);
        setDernierSeanceParClient({});
        setPremiereSeanceParClient({});
        setTendancePoidsParClient({});
      }
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

  const saveGroupe = async (clientId, groupe) => {
    try {
      const { error } = await supabase.from("profils").update({ groupe: groupe || null }).eq("id", clientId);
      if (error) throw error;
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, groupe: groupe || null } : c)));
      setEditingGroupeId(null);
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement dossier");
    }
  };

  const bilansEnAttente = useMemo(() => {
    const today = new Date();
    return clients
      .map((c) => {
        const derniere = dernierBilanParClient[c.id];
        const joursSince = derniere ? Math.floor((today - derniere) / 86400000) : null;
        return { client: c, joursSince };
      })
      .filter((x) => x.joursSince === null || x.joursSince > 7)
      .sort((a, b) => (b.joursSince ?? 9999) - (a.joursSince ?? 9999));
  }, [clients, dernierBilanParClient]);

  const clientsInactifs = useMemo(() => {
    const today = todayIso();
    return clients
      .map((c) => {
        const derniereDate = dernierSeanceParClient[c.id];
        if (!derniereDate) return { client: c, joursSince: null };
        const joursSince = Math.floor((new Date(today) - new Date(derniereDate)) / 86400000);
        return { client: c, joursSince };
      })
      .filter((x) => x.joursSince === null || x.joursSince > 7)
      .sort((a, b) => (b.joursSince ?? 9999) - (a.joursSince ?? 9999));
  }, [clients, dernierSeanceParClient]);

  const groupesDisponibles = useMemo(() => {
    const set = new Set(clients.map((c) => c.groupe).filter(Boolean));
    return Array.from(set);
  }, [clients]);

  const clientsFiltres = useMemo(() => {
    return clients
      .filter((c) => {
        const matchSearch = `${c.prenom} ${c.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedGroupe === "Archivés") return matchSearch && c.masque;
        if (c.masque) return false; // les clients masqués n'apparaissent que dans "Archivés"
        const matchGroupe = selectedGroupe === "Tous" || (selectedGroupe === "Sans dossier" ? !c.groupe : c.groupe === selectedGroupe);
        return matchSearch && matchGroupe;
      })
      .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr"));
  }, [clients, searchQuery, selectedGroupe]);

  if (selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onLogout={onLogout}
        fireToast={fireToast}
        onDeleted={() => { setSelectedClient(null); loadClients(); }}
      />
    );
  }

  return (
    <div style={appShellStyle}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <SideMenu viewMode={viewMode} setViewMode={setViewMode} onLogout={onLogout} showViewToggle={true} coachTab={coachTab} setCoachTab={setCoachTab} tachesEnAttenteCount={tachesEnAttenteCount} />
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textOnBgMuted, fontWeight: 600 }}>Espace coach</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.textOnBg }}>
              {coachTab === "dashboard" ? "Tableau de bord" : coachTab === "clients" ? "Mes clients" : coachTab === "taches" ? "Mes tâches" : coachTab === "programmes" ? "Programmes" : coachTab === "alimentation-recettes" ? "Recettes" : coachTab === "alimentation-courses" ? "Liste de courses" : coachTab === "alimentation-supplements" ? "Suppléments" : coachTab === "outils-drive" ? "Drive" : coachTab === "outils-automatisation" ? "Automatisation" : coachTab === "vod" ? "VOD" : "Notifications"}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : coachTab === "taches" ? (
          <TachesView coachId={coachProfil.id} fireToast={fireToast} />
        ) : coachTab === "programmes" ? (
          <ProgrammesModelesView coachId={coachProfil.id} clients={clients} fireToast={fireToast} />
        ) : coachTab === "alimentation-recettes" ? (
          <AlimentationView coachId={coachProfil.id} clients={clients} fireToast={fireToast} section="recettes" />
        ) : coachTab === "alimentation-courses" ? (
          <AlimentationView coachId={coachProfil.id} clients={clients} fireToast={fireToast} section="courses" />
        ) : coachTab === "alimentation-supplements" ? (
          <AlimentationView coachId={coachProfil.id} clients={clients} fireToast={fireToast} section="supplements" />
        ) : coachTab === "outils-drive" ? (
          <OutilsView coachId={coachProfil.id} clients={clients} fireToast={fireToast} section="drive" />
        ) : coachTab === "outils-automatisation" ? (
          <OutilsView coachId={coachProfil.id} clients={clients} fireToast={fireToast} section="automatisation" />
        ) : coachTab === "vod" ? (
          <VODView coachId={coachProfil.id} fireToast={fireToast} />
        ) : coachTab === "notifications" ? (
          <NotificationsView coachId={coachProfil.id} clients={clients} fireToast={fireToast} />
        ) : coachTab === "dashboard" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Card style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <User size={14} color={C.blue} />
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Clients actifs</span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.text, fontWeight: 700 }}>{clients.length}</div>
              </Card>
              <Card style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <AlertCircle size={14} color={bilansEnAttente.length > 0 ? C.red : C.green} />
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Bilans en attente</span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: bilansEnAttente.length > 0 ? C.red : C.green, fontWeight: 700 }}>{bilansEnAttente.length}</div>
              </Card>
            </div>

            {tachesApercu.length > 0 && (
              <Card style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <SectionLabel icon={ClipboardList}>Tes prochaines tâches</SectionLabel>
                  <button onClick={() => setCoachTab("taches")} style={{ background: "transparent", border: "none", color: C.blue, fontSize: 12, fontWeight: 700 }}>Voir tout</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tachesApercu.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 10, padding: "8px 12px" }}>
                      <span style={{ fontSize: 13, color: C.text }}>{t.titre}</span>
                      {t.date_echeance && <span style={{ fontSize: 11, color: C.textMuted }}>{formatDateDisplay(t.date_echeance)}</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {clientsInactifs.length > 0 && (
              <Card style={{ marginBottom: 14 }}>
                <SectionLabel icon={AlertCircle}>À relancer (inactifs)</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {clientsInactifs.slice(0, 5).map(({ client, joursSince }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{client.prenom} {client.nom}</span>
                      <span style={{ fontSize: 11.5, color: C.red }}>{joursSince === null ? "Aucune séance" : `Il y a ${joursSince} j`}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {seancesEnAttente.length > 0 && (
              <Card style={{ marginBottom: 14 }}>
                <SectionLabel icon={Dumbbell}>Séances en attente aujourd'hui</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {seancesEnAttente.slice(0, 6).map(({ client, programme }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                      <span style={{ fontSize: 13, color: C.text }}>
                        <span style={{ fontWeight: 700 }}>{client.prenom}</span> doit faire « {programme} » aujourd'hui
                      </span>
                      <ChevronRight size={14} color={C.textDim} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {bilansEnAttente.length > 0 && (
              <Card style={{ marginBottom: 14 }}>
                <SectionLabel icon={AlertCircle}>Bilans en attente</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bilansEnAttente.slice(0, 5).map(({ client, joursSince }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{client.prenom} {client.nom}</span>
                      <span style={{ fontSize: 11.5, color: C.red }}>{joursSince === null ? "Jamais envoyé" : `Il y a ${joursSince} j`}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(recentSeances.length > 0 || recentBilans.length > 0) && (
              <Card>
                <SectionLabel icon={Flame}>Activité récente</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recentSeances.slice(0, 4).map((s) => {
                    const c = clients.find((cl) => cl.id === s.profil_id);
                    return (
                      <div key={`s-${s.id}`} style={{ fontSize: 12.5, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <Dumbbell size={13} color={C.blue} />
                        <span style={{ color: C.text, fontWeight: 600 }}>{c ? `${c.prenom}` : "Un client"}</span> a terminé « {s.nom_programme} » · {formatDateDisplay(s.date)}
                      </div>
                    );
                  })}
                  {recentBilans.slice(0, 4).map((b) => {
                    const c = clients.find((cl) => cl.id === b.profil_id);
                    return (
                      <div key={`b-${b.id}`} style={{ fontSize: 12.5, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <ClipboardList size={13} color={C.green} />
                        <span style={{ color: C.text, fontWeight: 600 }}>{c ? `${c.prenom}` : "Un client"}</span> a rempli son bilan de semaine · {b.date}
                      </div>
                    );
                  })}
                  {recentSeances.length === 0 && recentBilans.length === 0 && (
                    <div style={{ fontSize: 12.5, color: C.textDim }}>Aucune activité récente</div>
                  )}
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ width: "100%", background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
            >
              <Plus size={18} /> Ajouter un client
            </button>

            {showAddForm && (
              <AddClientForm
                coachProfilId={coachProfil.id}
                onClose={() => setShowAddForm(false)}
                onCreated={loadClients}
                fireToast={fireToast}
                groupesDisponibles={groupesDisponibles}
              />
            )}

            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={15} color={C.textDim} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client..."
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, padding: "10px 12px 10px 36px", color: C.text, fontSize: 13.5 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
              {["Tous", ...groupesDisponibles, "Sans dossier", "Archivés"].map((g) => (
                <PillButton key={g} active={selectedGroupe === g} onClick={() => setSelectedGroupe(g)} onBg style={{ whiteSpace: "nowrap" }}>
                  {g}
                </PillButton>
              ))}
            </div>

            {clientsFiltres.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>Aucun client trouvé</div></Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clientsFiltres.map((c) => (
                  <Card key={c.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div onClick={() => setSelectedClient(c)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.photo_url ? `url(${c.photo_url}) center/cover` : C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {!c.photo_url && <User size={18} color={C.blue} />}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: C.text }}>{c.prenom} {c.nom}</div>
                            {premiereSeanceParClient[c.id] && (
                              <span style={{ fontSize: 10, color: C.blue, background: C.blueSoft, border: `1px solid ${C.blueBorder}`, borderRadius: 999, padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                {formatDureeSuivi(premiereSeanceParClient[c.id])}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.objectif_principal}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                            {(() => {
                              const derniereDate = dernierSeanceParClient[c.id];
                              const joursSince = derniereDate ? Math.floor((new Date(todayIso()) - new Date(derniereDate)) / 86400000) : null;
                              const actif = joursSince !== null && joursSince <= 2;
                              return (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: actif ? C.green : joursSince === null ? C.textDim : C.red, fontWeight: 600 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: actif ? C.green : joursSince === null ? C.textDim : C.red, display: "inline-block" }} />
                                  {joursSince === null ? "Jamais actif" : joursSince === 0 ? "Actif aujourd'hui" : `Actif il y a ${joursSince} j`}
                                </span>
                              );
                            })()}
                            {(() => {
                              const tendance = tendancePoidsParClient[c.id];
                              if (!tendance || tendance.delta === 0) return null;
                              const versObjectif = c.poids_objectif < tendance.actuel ? tendance.delta < 0 : tendance.delta > 0;
                              const Arrow = tendance.delta < 0 ? TrendingDown : TrendingUp;
                              return (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: versObjectif ? C.green : C.red, fontWeight: 600 }}>
                                  <Arrow size={11} /> {Math.abs(tendance.delta).toFixed(1)}kg
                                </span>
                              );
                            })()}
                            {derniereConnexionParClient[c.id] && (
                              <span style={{ fontSize: 10.5, color: C.textDim, fontWeight: 600 }}>
                                · Connecté {formatDerniereConnexion(derniereConnexionParClient[c.id])}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} color={C.textMuted} />
                    </div>
                    {editingGroupeId === c.id ? (
                      <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          autoFocus
                          value={groupeInput}
                          onChange={(e) => setGroupeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveGroupe(c.id, groupeInput); }}
                          placeholder="Nom du dossier"
                          style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 12 }}
                        />
                        <button onClick={() => saveGroupe(c.id, groupeInput)} style={{ background: C.blue, border: "none", borderRadius: 8, padding: "0 10px", color: "#06171F", fontSize: 12, fontWeight: 700 }}>OK</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingGroupeId(c.id); setGroupeInput(c.groupe || ""); }}
                        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: c.groupe ? C.blue : C.textDim, fontSize: 11.5, padding: 0 }}
                      >
                        <Folder size={12} /> {c.groupe || "Ajouter à un dossier"}
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
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

  // Enregistre une connexion (pour que le coach voie la dernière activité de ses clients)
  useEffect(() => {
    if (!profilId) return;
    supabase.from("connexions_log").insert({ profil_id: profilId }).then(({ error }) => {
      if (error) console.error("Erreur log connexion:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilId]);

  useEffect(() => {
    if (!profilId) return;
    supabase
      .from("programmes")
      .select("*, programme_exercices(*)")
      .eq("profil_id", profilId)
      .order("ordre", { ascending: true })
      .then(({ data }) => {
        const formatted = (data || []).map((p) => ({
          id: p.id,
          nom: p.nom,
          muscle: p.muscle,
          duree: "",
          ordre: p.ordre || 0,
          jourFixe: p.jour_fixe || null, echauffementGeneral: p.echauffement_general || "",
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
              type: ex.type_exercice || "muscu",
              dureeMinutes: ex.duree_minutes,
              groupeSuperset: ex.groupe_superset,
              echauffement: ex.series_echauffement || 0,
              objectifRepsMax: ex.objectif_reps_max || null,
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
      .limit(90)
      .then(({ data }) => setRecentSeances(data || []));
  }, [profilId]);
  const [photosHistory, setPhotosHistory] = useState([]);
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [eauVerres, setEauVerres] = useState(0);
  const [mensurationsHistory, setMensurationsHistory] = useState([]);
  const [documentsRecus, setDocumentsRecus] = useState([]);
  const [notificationsRecues, setNotificationsRecues] = useState([]);
  const [datesAvecRepasAnterieures, setDatesAvecRepasAnterieures] = useState(new Set());
  const [dailyCheckinDone, setDailyCheckinDone] = useState(null); // null = en cours de vérification
  const profilIdRef = useRef(profilRow.id);

  const streakNutrition = useMemo(() => {
    const hasFoodToday = Object.values(meals).some((arr) => arr.length > 0);
    if (!hasFoodToday) return 0;
    let streak = 1;
    let cursor = new Date();
    cursor.setDate(cursor.getDate() - 1);
    while (datesAvecRepasAnterieures.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [meals, datesAvecRepasAnterieures]);

  useEffect(() => {
    if (!profilId) return;
    let active = true;
    (async () => {
      try {
        const today = todayIso();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().slice(0, 10);

        const [eauRes, repasDatesRes, photosRes, mensurationsRes, documentsRes, notificationsRes] = await Promise.all([
          supabase.from("eau_quotidien").select("verres").eq("profil_id", profilId).eq("date", today).maybeSingle(),
          supabase.from("repas").select("date").eq("profil_id", profilId).gte("date", thirtyDaysAgoIso).lt("date", today),
          supabase.from("photos_bilan").select("*").eq("profil_id", profilId).order("date", { ascending: false }),
          supabase.from("mensurations").select("*").eq("profil_id", profilId).order("date", { ascending: true }),
          profilRow.coach_id
            ? supabase.from("documents_coach").select("*").eq("coach_id", profilRow.coach_id).or(`client_id.eq.${profilId},client_id.is.null`).order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase.from("notifications").select("*").eq("client_id", profilId).order("created_at", { ascending: false }).limit(20),
        ]);
        if (!active) return;

        if (eauRes.data) setEauVerres(eauRes.data.verres);

        setDatesAvecRepasAnterieures(new Set((repasDatesRes.data || []).map((r) => r.date)));

        setPhotosHistory(photosRes.data || []);
        setDocumentsRecus(documentsRes.data || []);
        setNotificationsRecues(notificationsRes.data || []);
        setMensurationsHistory(
          (mensurationsRes.data || []).map((m) => ({
            date: formatDateDisplay(m.date),
            dateRaw: m.date,
            tourTaille: m.tour_taille,
            tourPoitrine: m.tour_poitrine,
            tourEpaule: m.tour_epaule,
            tourBrasDroit: m.tour_bras_droit,
            tourBrasGauche: m.tour_bras_gauche,
            tourAvantBrasDroit: m.tour_avant_bras_droit,
            tourAvantBrasGauche: m.tour_avant_bras_gauche,
            tourCuisseDroite: m.tour_cuisse_droite,
            tourCuisseGauche: m.tour_cuisse_gauche,
            tourMolletDroit: m.tour_mollet_droit,
            tourMolletGauche: m.tour_mollet_gauche,
          }))
        );
      } catch (err) {
        console.error("Erreur chargement eau/streak/photos:", err);
      }
    })();
    return () => { active = false; };
  }, [profilId]);

  const onMarquerNotifLue = async (notifId) => {
    try {
      const { error } = await supabase.from("notifications").update({ lu: true }).eq("id", notifId);
      if (error) throw error;
      setNotificationsRecues((prev) => prev.map((n) => (n.id === notifId ? { ...n, lu: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const addMensuration = async (form) => {
    if (!profilId) return;
    try {
      const { error } = await supabase.from("mensurations").insert({
        profil_id: profilId,
        date: todayIso(),
        tour_taille: form.tourTaille || null,
        tour_poitrine: form.tourPoitrine || null,
        tour_epaule: form.tourEpaule || null,
        tour_bras_droit: form.tourBrasDroit || null,
        tour_bras_gauche: form.tourBrasGauche || null,
        tour_avant_bras_droit: form.tourAvantBrasDroit || null,
        tour_avant_bras_gauche: form.tourAvantBrasGauche || null,
        tour_cuisse_droite: form.tourCuisseDroite || null,
        tour_cuisse_gauche: form.tourCuisseGauche || null,
        tour_mollet_droit: form.tourMolletDroit || null,
        tour_mollet_gauche: form.tourMolletGauche || null,
      });
      if (error) throw error;
      setMensurationsHistory((prev) => [...prev, { date: formatDateDisplay(todayIso()), dateRaw: todayIso(), ...form }]);
      fireToast("Mensurations enregistrées", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement mensurations");
    }
  };

  const onChangeWater = async (delta) => {
    if (!profilId) return;
    const newValue = Math.max(0, eauVerres + delta);
    setEauVerres(newValue);
    try {
      const { error } = await supabase
        .from("eau_quotidien")
        .upsert({ profil_id: profilId, date: todayIso(), verres: newValue }, { onConflict: "profil_id,date" });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement eau");
    }
  };

  const uploadPhotoProfil = async (file) => {
    if (!profilId || !file) return;
    try {
      const fileName = `profil/${profilId}_${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("photos-bilan").upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("photos-bilan").getPublicUrl(fileName);
      const { error } = await supabase.from("profils").update({ photo_url: urlData.publicUrl }).eq("id", profilId);
      if (error) throw error;
      setUser((u) => ({ ...u, photoUrl: urlData.publicUrl }));
      fireToast("Photo de profil enregistrée", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi photo de profil");
    }
  };

  const uploadPhotoBilan = async (categorie, file) => {
    if (!profilId || !file) return;
    setUploadingPhotoKey(categorie);
    try {
      const today = todayIso();
      const mois = today.slice(0, 7);
      const fileName = `${profilId}/${categorie}_${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("photos-bilan").upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("photos-bilan").getPublicUrl(fileName);
      const { data, error } = await supabase
        .from("photos_bilan")
        .upsert(
          { profil_id: profilId, categorie, date: today, mois, url: urlData.publicUrl },
          { onConflict: "profil_id,categorie,mois" }
        )
        .select("*")
        .single();
      if (error) throw error;
      setPhotosHistory((prev) => {
        const sansAncienneDuMois = prev.filter((p) => !(p.categorie === categorie && p.mois === mois));
        return [data, ...sansAncienneDuMois];
      });
      fireToast("Photo enregistrée", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi photo");
    } finally {
      setUploadingPhotoKey(null);
    }
  };

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
                fibres: Number(r.fibres || 0),
                sucres: Number(r.sucres || 0),
                sodium: Number(r.sodium || 0),
                potassium: Number(r.potassium || 0),
                calcium: Number(r.calcium || 0),
                fer: Number(r.fer || 0),
                magnesium: Number(r.magnesium || 0),
                vitamineD: Number(r.vitamine_d || 0),
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
            const programmeBySeance = Object.fromEntries(seances.map((s) => [s.id, s.nom_programme || ""]));
            const cle = (row) => `${programmeBySeance[row.seance_id]}::${row.exercice_nom}`;
            const dernieresSeanceDateParEx = {};
            for (const row of seriesData) {
              const k = cle(row);
              const seanceDate = dateBySeance[row.seance_id];
              if (!dernieresSeanceDateParEx[k] || seanceDate > dernieresSeanceDateParEx[k]) {
                dernieresSeanceDateParEx[k] = seanceDate;
              }
            }
            const history = {};
            for (const row of seriesData) {
              const k = cle(row);
              const seanceDate = dateBySeance[row.seance_id];
              if (seanceDate !== dernieresSeanceDateParEx[k]) continue;
              if (!history[k]) history[k] = { date: formatDateDisplay(seanceDate), sets: [] };
              history[k].sets.push({
                poids: Number(row.poids),
                reps: Number(row.reps),
                numeroSerie: row.numero_serie || (history[k].sets.length + 1),
              });
            }
            for (const k of Object.keys(history)) {
              history[k].sets.sort((a, b) => a.numeroSerie - b.numeroSerie);
            }
            setExerciseHistory(history);
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
          fibres: item.fibres || 0,
          sucres: item.sucres || 0,
          sodium: item.sodium || 0,
          potassium: item.potassium || 0,
          calcium: item.calcium || 0,
          fer: item.fer || 0,
          magnesium: item.magnesium || 0,
          vitamine_d: item.vitamineD || 0,
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

  const updateFood = async (mealKey, id, nouveauxGrammes) => {
    try {
      const item = meals[mealKey].find((i) => i.id === id);
      if (!item || !nouveauxGrammes) return;
      const ratio = nouveauxGrammes / item.grams;
      const updated = {
        grams: nouveauxGrammes,
        kcal: Math.round(item.kcal * ratio),
        prot: +(item.prot * ratio).toFixed(1),
        gluc: +(item.gluc * ratio).toFixed(1),
        lip: +(item.lip * ratio).toFixed(1),
        fibres: +((item.fibres || 0) * ratio).toFixed(2),
        sucres: +((item.sucres || 0) * ratio).toFixed(2),
        sodium: +((item.sodium || 0) * ratio).toFixed(4),
        potassium: +((item.potassium || 0) * ratio).toFixed(4),
        calcium: +((item.calcium || 0) * ratio).toFixed(4),
        fer: +((item.fer || 0) * ratio).toFixed(4),
        magnesium: +((item.magnesium || 0) * ratio).toFixed(4),
        vitamineD: +((item.vitamineD || 0) * ratio).toFixed(6),
      };
      const { error } = await supabase
        .from("repas")
        .update({
          grammes: updated.grams, kcal: updated.kcal, prot: updated.prot, gluc: updated.gluc, lip: updated.lip,
          fibres: updated.fibres, sucres: updated.sucres, sodium: updated.sodium, potassium: updated.potassium,
          calcium: updated.calcium, fer: updated.fer, magnesium: updated.magnesium, vitamine_d: updated.vitamineD,
        })
        .eq("id", id);
      if (error) throw error;
      setMeals((prev) => ({
        ...prev,
        [mealKey]: prev[mealKey].map((i) => (i.id === id ? { ...i, ...updated } : i)),
      }));
      fireToast("Quantité mise à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur modification quantité");
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
        log.sets.forEach((set, idx) => {
          rows.push({
            seance_id: seance.id,
            exercice_nom: ex.nom,
            poids: set.poids,
            reps: set.reps,
            rpe: String(set.rpe),
            tempo: set.tempo || "",
            video_url: log.video || null,
            numero_serie: idx + 1,
          });
        });
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
            next[ex.nom] = { date: displayDate, sets: log.sets.map((s) => ({ poids: s.poids, reps: s.reps })) };
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
          filter: (dailyCheckinDone === false || (dailyCheckinDone === true && !user.photoUrl)) ? "blur(7px)" : "none",
          pointerEvents: (dailyCheckinDone === false || (dailyCheckinDone === true && !user.photoUrl)) ? "none" : "auto",
          userSelect: (dailyCheckinDone === false || (dailyCheckinDone === true && !user.photoUrl)) ? "none" : "auto",
          transition: "filter .3s ease",
        }}
      >
        <div style={{ width: "100%", padding: "24px 16px 110px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
            <SideMenu viewMode={viewMode} setViewMode={setViewMode} onLogout={onLogout} showViewToggle={!!setViewMode} />
          </div>
          {tab === "accueil" && !activeProgramme && (
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("ordre", { ascending: true }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", ordre: p.ordre || 0, jourFixe: p.jour_fixe || null, echauffementGeneral: p.echauffement_general || "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, videoDemoUrl: ex.video_demo_url, type: ex.type_exercice || "muscu", dureeMinutes: ex.duree_minutes, groupeSuperset: ex.groupe_superset, echauffement: ex.series_echauffement || 0, objectifRepsMax: ex.objectif_reps_max || null })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} meals={meals} objectifsNutrition={objectifsNutrition} streak={streakNutrition} />
          )}
          {tab === "seances" && !activeProgramme && (
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("ordre", { ascending: true }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", ordre: p.ordre || 0, jourFixe: p.jour_fixe || null, echauffementGeneral: p.echauffement_general || "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, videoDemoUrl: ex.video_demo_url, type: ex.type_exercice || "muscu", dureeMinutes: ex.duree_minutes, groupeSuperset: ex.groupe_superset, echauffement: ex.series_echauffement || 0, objectifRepsMax: ex.objectif_reps_max || null })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} mode="seances" />
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
          {tab === "nutrition" && <Nutrition meals={meals} onAdd={addFood} onRemove={removeFood} onUpdate={updateFood} objectifs={objectifsNutrition} profilId={profilId} fireToast={fireToast} saveObjectifsNutrition={saveObjectifsNutrition} eauVerres={eauVerres} onChangeWater={onChangeWater} />}
          {tab === "bilans" && (
            <Bilans
              weightHistory={weightHistory}
              addWeightEntry={addWeightEntry}
              photosHistory={photosHistory}
              uploadPhotoBilan={uploadPhotoBilan}
              uploadingPhotoKey={uploadingPhotoKey}
              checkins={checkins}
              addCheckin={addCheckin}
              mensurationsHistory={mensurationsHistory}
              addMensuration={addMensuration}
            />
          )}
          {tab === "profil" && <Profil user={user} setUser={setUser} fireToast={fireToast} onSave={saveProfile} documentsRecus={documentsRecus} notificationsRecues={notificationsRecues} onMarquerNotifLue={onMarquerNotifLue} onChangePhoto={uploadPhotoProfil} onEnableNotifs={() => subscribeToPush(profilId, fireToast)} />}
        </div>

        {!activeProgramme && <BottomNav active={tab} setActive={setTab} />}
      </div>

      {dailyCheckinDone === false && <DailyCheckinModal onSubmit={submitDailyCheckin} />}
      {dailyCheckinDone === true && !user.photoUrl && <PhotoProfilObligatoireModal onUpload={uploadPhotoProfil} />}
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
  const [viewMode, setViewMode] = useState("client");
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
