import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell, Apple, Home, TrendingUp, TrendingDown, User, Play, Square, Timer, Video, Upload,
  Eye, EyeOff, Camera, Plus, X, Check, Footprints, Target, Flame, ChevronRight,
  ChevronDown, Send, Clock, ClipboardList, Trash2, CheckCircle2, LogOut, RotateCcw, Menu, Droplet, Award,
  Search, LayoutDashboard, Folder, AlertCircle, Calendar, Wrench, Video as VideoIcon, Bell, Zap, FileText, Download,
  ShoppingCart, Pill, ScanLine, MoreVertical, Edit3, Lock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
/* ------------------------------------------------------------------ */
// Palette "séance" premium (fond bleu nuit profond, cartes ardoise, accents bleu/jaune) —
// alignée sur la charte des visuels marketing (fond sombre, gros titres très gras, badges
// arrondis, checks bleus, accent jaune pour les moments clés type "surcharge progressive").
const C = {
  bg: "#080B1A",
  bgGradA: "#0C1330",
  bgGradB: "#050710",
  surface: "#131A33",
  card: "#161D3D",
  cardBorder: "rgba(90,130,255,0.22)",
  cardBorderLight: "rgba(120,150,255,0.4)",
  text: "#FFFFFF",
  textOnBg: "#FFFFFF",
  textOnBgMuted: "#9AA6C7",
  textMuted: "#B9C4E0",
  textDim: "#7C88AD",
  blue: "#3B6FE0",
  blueSoft: "rgba(59,111,224,0.18)",
  blueBorder: "rgba(59,111,224,0.5)",
  amber: "#F5B833",
  amberSoft: "rgba(245,184,51,0.18)",
  green: "#3AD6A0",
  greenSoft: "rgba(58,214,160,0.16)",
  red: "#FF5D6C",
  redSoft: "rgba(255,93,108,0.16)",
};

// Police du visuel de référence : Inter (formes, chiffres proportionnels, titres gras à
// approche serrée). Un seul jeu de police pour tout : titres, texte et chiffres.
const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
const FONT_DISPLAY = FONT_SANS;
const SIGNED_URL_EXPIRY = 315360000; // ~10 ans, pour les fichiers sur buckets privés (photos-bilan, documents-coach)
const FONT_BODY = FONT_SANS;
// Les chiffres (poids, reps, kcal) utilisent la même police que le reste, comme sur le visuel.
const FONT_MONO = FONT_SANS;

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
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
    input[type=range]::-webkit-slider-runnable-track { height: 8px; border-radius: 999px; background: linear-gradient(90deg, #4C7DF0 var(--fill, 50%), rgba(255,255,255,0.12) var(--fill, 50%)); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -6px; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; border: 4px solid #4C7DF0; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
    /* Champs de saisie : même look partout (fond translucide, coins arrondis, halo bleu au focus) */
    input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select {
      border-radius: 14px !important;
      background-color: rgba(255,255,255,0.05) !important;
      border-color: rgba(255,255,255,0.12) !important;
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    input:not([type=range]):focus, textarea:focus, select:focus {
      border-color: rgba(76,125,240,0.9) !important;
      box-shadow: 0 0 0 3px rgba(76,125,240,0.2);
    }
    input::placeholder, textarea::placeholder { color: rgba(185,196,224,0.55); }
    /* Boutons principaux bleus : texte blanc (comme le visuel) au lieu du texte sombre */
    button[style*="background: rgb(59, 111, 224)"] { box-shadow: 0 4px 16px rgba(59,111,224,0.5) !important; font-weight: 800; }
    button[style*="rgb(6, 23, 31)"][style*="background: rgb(59, 111, 224)"],
    button[style*="rgb(2, 7, 26)"][style*="background: rgb(59, 111, 224)"] { color: #FFFFFF !important; }
    button { font-family: ${FONT_BODY}; cursor: pointer; }
    html, body, #root { font-family: ${FONT_BODY}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-feature-settings: 'cv11', 'ss03'; }
    /* Approche serrée typique du visuel (Inter, -0.01em partout) ; les libellés en capitales
       gardent leur espacement large défini au cas par cas (letterSpacing inline prioritaire). */
    *, *::before, *::after { letter-spacing: -0.011em; }
    /* Gros textes (titres, chiffres clés) : approche plus serrée, comme les titres du visuel */
    [style*="font-size: 18px"],[style*="font-size: 19px"],[style*="font-size: 20px"],[style*="font-size: 21px"],[style*="font-size: 22px"],[style*="font-size: 23px"],[style*="font-size: 24px"],[style*="font-size: 25px"],[style*="font-size: 26px"],[style*="font-size: 27px"],[style*="font-size: 28px"],[style*="font-size: 29px"],[style*="font-size: 30px"],[style*="font-size: 31px"],[style*="font-size: 32px"],[style*="font-size: 33px"],[style*="font-size: 34px"],[style*="font-size: 35px"],[style*="font-size: 36px"],[style*="font-size: 37px"],[style*="font-size: 38px"],[style*="font-size: 39px"],[style*="font-size: 40px"],[style*="font-size: 41px"],[style*="font-size: 42px"],[style*="font-size: 43px"],[style*="font-size: 44px"],[style*="font-size: 45px"],[style*="font-size: 46px"],[style*="font-size: 47px"],[style*="font-size: 48px"],[style*="font-size: 49px"],[style*="font-size: 50px"],[style*="font-size: 51px"],[style*="font-size: 52px"],[style*="font-size: 53px"],[style*="font-size: 54px"],[style*="font-size: 55px"],[style*="font-size: 56px"],[style*="font-size: 57px"],[style*="font-size: 58px"],[style*="font-size: 59px"],[style*="font-size: 60px"],[style*="font-size: 61px"],[style*="font-size: 62px"],[style*="font-size: 63px"],[style*="font-size: 64px"],[style*="font-size: 65px"],[style*="font-size: 66px"],[style*="font-size: 67px"],[style*="font-size: 68px"],[style*="font-size: 69px"],[style*="font-size: 70px"],[style*="font-size: 71px"],[style*="font-size: 72px"] { letter-spacing: -0.028em !important; }
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
      background: `linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%), ${C.card}`,
      border: "1px solid rgba(110,150,255,0.5)",
      borderRadius: 20,
      padding: 16,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(76,125,240,0.16), 0 10px 28px rgba(0,0,0,0.45), 0 0 24px rgba(76,125,240,0.3)",
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
));

const IconBadge = ({ icon: Icon, color = "#9DB8FF", size = 36, iconSize = 18 }) => (
  <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.34), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: `1px solid ${color}55`, boxShadow: `0 0 12px ${color}33` }}>
    <Icon size={iconSize} color={color} />
  </div>
);

const SectionHead = ({ icon, title, count, color = "#9DB8FF", action }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <IconBadge icon={icon} color={color} size={34} iconSize={17} />
    <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: C.text, textAlign: "left" }}>{title}</div>
    {count != null && <span style={{ fontSize: 12.5, fontWeight: 800, color: color, background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 10px" }}>{count}</span>}
    {action}
  </div>
);

const AvatarInitiales = ({ prenom, nom, photo, size = 40, ring = "#4C7DF0" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: photo ? `url(${photo}) center/cover` : "linear-gradient(135deg, #4C7DF0, #2B3F8F)", border: `2px solid ${ring}`, boxShadow: `0 0 12px ${ring}66`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, fontSize: Math.round(size * 0.38) }}>
    {!photo && `${(prenom || "?").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase()}
  </div>
);

const ROW_STYLE = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "11px 14px" };

const SectionLabel = ({ children, icon: Icon, onBg }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
    {Icon && <Icon size={14} color={C.blue} />}
    <span
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0,
        textTransform: "none",
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
      border: `2px solid ${active ? C.blue : C.cardBorderLight}`,
      background: active ? C.blue : "transparent",
      color: active ? "#FFFFFF" : (onBg ? C.textOnBgMuted : C.textMuted),
      fontSize: 13,
      fontWeight: 700,
      opacity: disabled ? 0.4 : 1,
      transition: "all .15s ease",
      boxShadow: active ? "0 0 12px rgba(59,111,224,0.55)" : "none",
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

// Parse une date en gérant aussi l'ancien format texte "JJ/MM/AAAA" (bug corrigé : les
// bilans étaient enregistrés avec toLocaleDateString("fr-FR"), que new Date() réinterprète
// en MM/JJ/AAAA — jour et mois inversés). Les enregistrements existants dans ce format
// doivent continuer à s'afficher et se trier correctement.
const parseDateFlexible = (value) => {
  if (!value) return null;
  const str = String(value);
  const frMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const [, jour, mois, annee] = frMatch;
    const d = new Date(Number(annee), Number(mois) - 1, Number(jour));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateDisplay = (dateStr) => {
  const d = parseDateFlexible(dateStr);
  if (!d) return dateStr;
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

// Bibliothèque générique d'exercices de mobilité, groupée par zone. Le coach compose ses
// routines ("mix chevilles + lombaires", etc.) en piochant dedans — pas de gestion de
// bibliothèque à faire de son côté, juste choisir et assembler.
const MOBILITE_CATALOGUE = {
  "Chevilles": ["Cercles de cheville", "Flexion dorsale genou au mur", "Balancés talon-pointe", "Rotation de cheville assise"],
  "Genoux": ["Cercles de genou", "Fentes dynamiques légères", "Flexion-extension assise"],
  "Hanches": ["Cercles de hanche", "Fentes avec rotation du buste", "90/90 hanche", "Balancés de jambe avant-arrière", "Balancés de jambe latéraux"],
  "Lombaires / dos": ["Chat-vache", "Rotation du tronc assis", "Extension lombaire douce (cobra)", "Torsion allongée au sol"],
  "Thoracique": ["Rotation thoracique à 4 pattes", "Ouverture de bras allongé sur le côté", "Extension thoracique sur banc"],
  "Épaules": ["Cercles de bras", "Rotation externe avec élastique", "Étirement croisé de l'épaule", "Balancés de bras avant-arrière"],
  "Cou": ["Rotation lente du cou", "Flexion latérale du cou", "Rétraction du menton"],
  "Poignets": ["Cercles de poignet", "Étirement flexion/extension du poignet"],
};

const ECHAUFFEMENT_PRESETS = [
  { key: "articulaireHaut", label: "Articulaire — haut du corps", description: "Rotations épaules, coudes, poignets", texte: "• Échauffement articulaire haut du corps (rotations épaules, coudes, poignets) — 3 min" },
  { key: "articulaireBas", label: "Articulaire — bas du corps", description: "Rotations hanches, genoux, chevilles", texte: "• Échauffement articulaire bas du corps (rotations hanches, genoux, chevilles) — 3 min" },
  { key: "cardio", label: "Cardio léger", description: "Vélo, rameur ou tapis à faible intensité", texte: "• Cardio léger (vélo/rameur/tapis) — 5 min" },
  { key: "tractionPoidsCorps", label: "Traction poids du corps", description: "Tractions/rowing léger sans charge pour préparer le dos", texte: "• Échauffement traction poids du corps (tractions ou rowing léger) — 2-3 min" },
  { key: "pompes", label: "Pompes", description: "Séries de pompes légères pour préparer le haut du corps en poussée", texte: "• Échauffement pompes — 2-3 séries légères" },
  { key: "squatsFentes", label: "Squats / fentes", description: "Squats et fentes au poids du corps pour préparer les jambes", texte: "• Échauffement squats/fentes au poids du corps — 2-3 min" },
  { key: "mobilite", label: "Mobilité dynamique", description: "Balancements jambes/bras, gainage dynamique", texte: "• Mobilité dynamique (balancements jambes/bras, gainage dynamique) — 3 min" },
  { key: "activation", label: "Activation spécifique", description: "Séries d'approche légères sur le premier exercice", texte: "• Séries d'approche légères sur le premier exercice de la séance" },
];

const REP_RANGES = [
  { min: 4, max: 8 },
  { min: 6, max: 9 },
  { min: 9, max: 12 },
  { min: 10, max: 15 },
];

function RepRangePersonnalise({ range, onSet }) {
  const estCustom = range && !REP_RANGES.some((r) => r.min === range.min && r.max === range.max);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(estCustom ? range.min : "");
  const [max, setMax] = useState(estCustom ? range.max : "");

  if (open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="min" style={{ width: 42, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "5px", color: C.text, fontSize: 12, textAlign: "center" }} />
        <span style={{ color: C.textDim, fontSize: 12 }}>-</span>
        <input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="max" style={{ width: 42, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "5px", color: C.text, fontSize: 12, textAlign: "center" }} />
        <button
          type="button"
          onClick={() => {
            const mn = parseInt(min), mx = parseInt(max);
            if (mn > 0 && mx >= mn) { onSet({ min: mn, max: mx }); setOpen(false); }
          }}
          style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 700 }}
        >
          OK
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        border: `1px solid ${estCustom ? C.blue : C.cardBorderLight}`, borderRadius: 999, padding: "5px 10px",
        background: estCustom ? C.blueSoft : "transparent", color: estCustom ? C.blue : C.textMuted, fontSize: 12, fontWeight: 700,
      }}
    >
      {estCustom ? `${range.min}-${range.max}` : "+ Perso"}
    </button>
  );
}

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
        boxShadow: "0 0 18px rgba(59,111,224,0.35), 0 -8px 28px rgba(0,0,0,0.5)",
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
        <div style={{ fontWeight: 800, fontSize: 18, color: C.text, textTransform: "capitalize" }}>
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
function EntrainementHome({ user, stats, onStart, fireToast, customProgrammes, isCoach, profilId, onSeanceCreated, weightHistory, recentSeances, setTab, mode = "accueil", meals, objectifsNutrition, streak = 0, streakEnAttente = false, routinesDuJour = [], onLaunchRoutine, onManageRoutines, prochaineRoutine = null, toutesRoutines = [], onVoirRoutines }) {
  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const [draggedProgIdx, setDraggedProgIdx] = useState(null);
  const [dragOverProgIdx, setDragOverProgIdx] = useState(null);
  const progCardRefs = useRef([]);
  // Ensemble des jours de la semaine où au moins une routine de mobilité est prévue, pour la
  // mini frise Lun-Dim affichée à côté de "Routine du jour".
  const joursAvecRoutine = useMemo(() => {
    const set = new Set();
    toutesRoutines.forEach((r) => (r.jours || []).forEach((j) => set.add(j)));
    return set;
  }, [toutesRoutines]);

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
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.textOnBgMuted, fontWeight: 600, textAlign: "center" }}>
              Bienvenue,
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 38, lineHeight: 1.1, textAlign: "center", background: "linear-gradient(90deg, #7FA0FF, #4C7DF0 55%, #F5C542)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>
              {user.prenom}
            </div>
            <div style={{ position: "relative", marginTop: 0, minHeight: 34 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, fontSize: 13.5, color: C.textOnBgMuted, fontWeight: 600, textAlign: "center" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <button
                onClick={() => setShowBadgeDetail(true)}
                aria-label={`Palier du mois : ${tierInfo.label}`}
                style={{ position: "absolute", right: 0, bottom: -10, width: 96, height: 96, padding: 0, background: "transparent", border: "none", cursor: "pointer" }}
              >
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from 200deg, ${tierInfo.color}, #FFFFFF 16%, ${tierInfo.color} 34%, rgba(0,0,0,0.4) 58%, ${tierInfo.color} 80%, #FFFFFF 94%, ${tierInfo.color})`, boxShadow: `0 14px 28px rgba(0,0,0,0.65), 0 0 28px ${tierInfo.color}99` }} />
                <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: `radial-gradient(circle at 35% 25%, ${tierInfo.color}66, #151C40 60%, #090E24)`, boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -10px 16px rgba(0,0,0,0.55)" }} />
                <div style={{ position: "absolute", top: 10, left: 18, width: 46, height: 24, borderRadius: "50%", transform: "rotate(-20deg)", background: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0))" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 8, filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 8px ${tierInfo.color}aa)` }}>
                  <TrophyIcon color={tierInfo.color} size={56} />
                </div>
                <div style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%)", fontSize: 14, fontWeight: 800, color: tierInfo.color, background: "linear-gradient(180deg, #16204A, #0A1029)", border: `1.5px solid ${tierInfo.color}`, borderRadius: 999, padding: "3px 11px", boxShadow: `0 4px 12px rgba(0,0,0,0.6), 0 0 12px ${tierInfo.color}88`, whiteSpace: "nowrap" }}>
                  {Math.round(badgeScore)}%
                </div>
              </button>
            </div>
          </div>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RotateCcw size={13} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: C.textMuted }}>
                  Routine du jour
                </span>
              </div>
              {toutesRoutines.length > 0 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {JOURS_SEMAINE.map((j) => {
                    const actif = joursAvecRoutine.has(j);
                    const estAujourdhui = j === jourDuJourFr();
                    return (
                      <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div style={{ fontSize: 8.5, fontWeight: 800, color: estAujourdhui ? C.text : "rgba(255,255,255,0.45)" }}>
                          {JOURS_SEMAINE_LABEL[j][0]}
                        </div>
                        <div
                          title={JOURS_SEMAINE_LABEL[j]}
                          style={{
                            width: 21,
                            height: 21,
                            borderRadius: 6,
                            background: actif ? "rgba(58,214,160,0.28)" : "rgba(255,255,255,0.07)",
                            border: estAujourdhui ? `1.3px solid ${C.text}` : "1px solid transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {actif ? <Check size={11} color={C.green} strokeWidth={3.5} /> : <X size={9} color="rgba(255,255,255,0.3)" strokeWidth={3.5} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {routinesDuJour.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {routinesDuJour.map((routine) => (
                  <div
                    key={routine.id}
                    onClick={() => onLaunchRoutine?.(routine)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px",
                      borderRadius: 18,
                      textAlign: "left",
                      background: "linear-gradient(135deg, rgba(76,125,240,0.22), rgba(255,255,255,0.05))",
                      border: "1px solid rgba(110,150,255,0.55)",
                      boxShadow: "0 0 16px rgba(76,125,240,0.35)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(76,125,240,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RotateCcw size={19} color="#BBD0FF" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.text, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                        {routine.nom}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 3, textAlign: "left" }}>
                        {routine.exercices.length} exercice{routine.exercices.length > 1 ? "s" : ""} · {routine.duree_travail}s effort / {routine.duree_repos}s repos
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {isCoach && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onManageRoutines?.(); }}
                          style={{ background: "rgba(255,255,255,0.18)", border: "none", color: C.text, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Wrench size={12} />
                        </button>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#FFFFFF", fontWeight: 800, background: C.blue, padding: "10px 18px", borderRadius: 999, boxShadow: "0 4px 14px rgba(76,125,240,0.5)" }}>
                        <Play size={12} fill="#FFFFFF" /> Lancer
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : prochaineRoutine ? (
              <div
                onClick={() => onVoirRoutines?.()}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 14, background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)", cursor: "pointer" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Lock size={15} color={C.textDim} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13.5, color: C.text, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prochaineRoutine.routine.nom}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    Prochaine · {prochaineRoutine.jour.charAt(0).toUpperCase() + prochaineRoutine.jour.slice(1)}
                  </div>
                </div>
                {isCoach ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onManageRoutines?.(); }}
                    style={{ background: "rgba(255,255,255,0.18)", border: "none", color: C.text, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <Wrench size={12} />
                  </button>
                ) : (
                  <ChevronRight size={16} color={C.textDim} style={{ flexShrink: 0 }} />
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 14, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RotateCcw size={17} color={C.textDim} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.35 }}>
                    {isCoach ? "Aucune routine prévue." : "Pas encore de routine pour toi. Ton coach ne t'a pas encore donné de routine."}
                  </div>
                </div>
                {isCoach && (
                  <button
                    onClick={() => onManageRoutines?.()}
                    style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 12, flexShrink: 0 }}
                  >
                    Gérer
                  </button>
                )}
              </div>
            )}
            {routinesDuJour.length > 0 && !isCoach && toutesRoutines.length > routinesDuJour.length && (
              <button
                onClick={() => onVoirRoutines?.()}
                style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 10, background: "transparent", border: "none", color: C.text, opacity: 0.85, fontWeight: 700, fontSize: 12, padding: 0 }}
              >
                Voir toutes mes routines <ChevronRight size={13} />
              </button>
            )}
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card style={{ padding: 14, cursor: "pointer", border: "1.5px solid rgba(255,150,40,0.85)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,140,26,0.4), 0 0 24px rgba(255,140,26,0.5), 0 0 8px rgba(255,166,64,0.6), 0 10px 28px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column" }} onClick={() => setShowCalendrier(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Séances</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{ fontSize: 52, color: C.text, fontWeight: 800, lineHeight: 1 }}>{stats.seancesRealisees}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4, marginBottom: 10 }}>réalisées ce mois</div>
                {objectifSeancesSemaine > 0 && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: seancesCetteSemaine >= objectifSeancesSemaine ? C.green : seancesCetteSemaine === 0 ? C.red : "#F5C542", background: seancesCetteSemaine >= objectifSeancesSemaine ? C.greenSoft : seancesCetteSemaine === 0 ? C.redSoft : "rgba(245,197,66,0.16)", borderRadius: 999, padding: "5px 12px" }}>
                    {seancesCetteSemaine}/{objectifSeancesSemaine} cette semaine
                  </div>
                )}
              </div>
            </Card>
            <Card style={{ padding: 14, cursor: "pointer", border: "1.5px solid rgba(255,150,40,0.85)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,140,26,0.4), 0 0 24px rgba(255,140,26,0.5), 0 0 8px rgba(255,166,64,0.6), 0 10px 28px rgba(0,0,0,0.45)" }} onClick={() => setTab("nutrition")}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Flame size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Calories</span>
              </div>
              <div style={{ fontSize: 34, color: C.text, fontWeight: 800, lineHeight: 1.1 }}>
                {Math.round(caloriesConsommees)} <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>kcal</span>
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                {caloriesObjectif ? `sur ${Math.round(caloriesObjectif)} kcal` : "objectif non défini"}
              </div>
              {caloriesObjectif > 0 && (
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (caloriesConsommees / caloriesObjectif) * 100)}%`, borderRadius: 999, background: "linear-gradient(90deg, #4C7DF0, #7FA0FF)" }} />
                </div>
              )}
              {streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <Flame size={13} color={streakEnAttente ? C.textDim : C.amber} fill={streakEnAttente ? C.textDim : C.amber} />
                  <span style={{ fontSize: 11.5, color: streakEnAttente ? C.textDim : C.amber, fontWeight: 700 }}>
                    {streakEnAttente ? streak : `${streak} jour${streak > 1 ? "s" : ""} de suite`}
                  </span>
                </div>
              )}
            </Card>
          </div>
          <Card>
            <SectionLabel icon={Target}>Objectif de poids</SectionLabel>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 44, color: C.text, fontWeight: 800, lineHeight: 1.05 }}>
                  {user.poidsActuel} <span style={{ fontSize: 18, color: C.textMuted, fontWeight: 700 }}>kg</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Poids actuel</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, color: "#F5C542", fontWeight: 800 }}>
                  {user.poidsObjectif} kg
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {poidsRestant > 0 ? `${poidsRestant} kg restants` : "Objectif atteint 🎉"}
                </div>
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, progressPoids))}%`, borderRadius: 999, background: "linear-gradient(90deg, #4C7DF0, #F5C542)", transition: "width .4s ease" }} />
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <Card style={{ padding: 14, cursor: exerciceProgres ? "pointer" : "default" }} onClick={() => exerciceProgres && setShowProgresDetail(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Dumbbell size={14} color={C.blue} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Progrès</span>
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
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Poids</span>
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
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Prochaine séance</span>
              </div>
              {customProgrammes && customProgrammes.length > 0 ? (
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {customProgrammes[0].nom}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{customProgrammes[0].muscle}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onStart(customProgrammes[0]); }}
                    style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 999, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, fontWeight: 800, fontSize: 11.5 }}
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
                          display: "flex", alignItems: "center", gap: 14, padding: 16,
                          border: estValide ? `2px solid ${C.green}` : (estAujourdhui ? "2px solid #F5C542" : undefined),
                          boxShadow: estValide ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(58,214,160,0.45), 0 0 26px rgba(58,214,160,0.55), 0 0 8px rgba(58,214,160,0.5), 0 10px 28px rgba(0,0,0,0.4)" : (estAujourdhui ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(245,197,66,0.45), 0 0 26px rgba(245,197,66,0.55), 0 0 8px rgba(245,197,66,0.5), 0 10px 28px rgba(0,0,0,0.4)" : undefined),
                          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
                        }}
                      >
                        <div style={{ width: 48, height: 48, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          background: estValide ? "rgba(58,214,160,0.2)" : (estAujourdhui ? "rgba(245,197,66,0.2)" : "rgba(255,255,255,0.06)"),
                          border: `1px solid ${estValide ? "rgba(58,214,160,0.5)" : (estAujourdhui ? "rgba(245,197,66,0.5)" : "rgba(255,255,255,0.08)")}` }}>
                          {estValide ? <Check size={24} color={C.green} strokeWidth={3} /> : p ? <Dumbbell size={22} color={estAujourdhui ? "#F5C542" : "#9DB8FF"} /> : <span style={{ fontSize: 20 }}>😴</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: estValide ? C.green : (estAujourdhui ? "#F5C542" : C.textMuted), textTransform: "capitalize", letterSpacing: 0 }}>
                            {jour}{estAujourdhui && " · Aujourd'hui"}{estValide && " · Validé"}
                          </div>
                          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 19, color: p ? C.text : C.textDim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p ? p.nom : "Repos"}
                          </div>
                          {p && (
                            <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 9px" }}>{p.exercices.length} exercices</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 9px" }}>{p.exercices.reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries</span>
                            </div>
                          )}
                        </div>
                        {p && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => onStart(p)} style={{ background: C.blue, border: "none", color: "#FFFFFF", borderRadius: 999, padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 800, fontSize: 14, boxShadow: "0 4px 14px rgba(76,125,240,0.5)" }}>
                              <Play size={13} fill="#FFFFFF" /> Démarrer
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
              <button onClick={() => setShowSeanceForm(true)} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
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
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{p.muscle}</div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                        {p.exercices.length} exercices · {p.exercices.reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries · {p.duree}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => onStart(p)} style={{ background: C.blue, border: "none", color: "#FFFFFF", borderRadius: 999, padding: "11px 18px", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14, boxShadow: "0 4px 14px rgba(76,125,240,0.5)" }}>
                      <Play size={13} fill="#FFFFFF" /> Démarrer
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
            <button onClick={() => setShowBadgeDetail(false)} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>Fermer</button>
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
            <button onClick={() => setShowProgresDetail(false)} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 16 }}>Fermer</button>
          </Card>
        </div>
      )}
      {showCalendrier && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowCalendrier(false)}>
          <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <SectionLabel icon={Flame}>Séances du mois</SectionLabel>
            <CalendrierSeances recentSeances={recentSeances} />
            <button onClick={() => setShowCalendrier(false)} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 16 }}>Fermer</button>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ENTRAINEMENT — SESSION EN COURS                                    */
/* ------------------------------------------------------------------ */
function ExerciceCard({ ex, history, log, onValidate, onVideo, programmeNom, onSaveNotePerso }) {
  const [open, setOpen] = useState(false);
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("");
  const [tempo, setTempo] = useState("");
  const [rpe, setRpe] = useState("8");
  const [showTempoExplication, setShowTempoExplication] = useState(false);
  const [showVideoExecution, setShowVideoExecution] = useState(false);
  const [showEnregistreur, setShowEnregistreur] = useState(false);
  const [showNotePerso, setShowNotePerso] = useState(false);
  const [notePersoDraft, setNotePersoDraft] = useState(ex.notePerso || "");
  const [notePersoStatus, setNotePersoStatus] = useState("idle"); // idle | saving | enregistre
  const notePersoTimeoutRef = useRef(null);
  const fileRef = useRef(null);

  // Auto-sauvegarde de la note perso : dès que le coach/client arrête de taper pendant ~700ms,
  // on enregistre automatiquement (pas de bouton "Enregistrer" à cliquer) — la note doit être
  // là au prochain passage sur cette séance, sans action supplémentaire.
  useEffect(() => {
    if (!showNotePerso) return;
    if (notePersoDraft.trim() === (ex.notePerso || "").trim()) return;
    setNotePersoStatus("saving");
    if (notePersoTimeoutRef.current) clearTimeout(notePersoTimeoutRef.current);
    notePersoTimeoutRef.current = setTimeout(async () => {
      await onSaveNotePerso?.(ex.id, notePersoDraft.trim());
      setNotePersoStatus("enregistre");
    }, 700);
    return () => clearTimeout(notePersoTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notePersoDraft, showNotePerso]);

  const closeNotePerso = async () => {
    if (notePersoTimeoutRef.current) {
      clearTimeout(notePersoTimeoutRef.current);
      notePersoTimeoutRef.current = null;
    }
    if (notePersoDraft.trim() !== (ex.notePerso || "").trim()) {
      await onSaveNotePerso?.(ex.id, notePersoDraft.trim());
    }
    setShowNotePerso(false);
    setNotePersoStatus("idle");
  };
  const hasVideo = !!log.video;
  const historique = history[`${programmeNom}::${ex.nom}`]; // { date, sets: [{poids, reps, numeroSerie}, ...] }
  const nbEchauffement = ex.echauffement || 0;
  const currentSetIndex = Math.max(0, log.sets.length - nbEchauffement); // 0-indexée, hors séries d'échauffement
  const rappelSerieActuelle = historique?.sets?.[currentSetIndex];
  const derniereSerieGlobale = historique?.sets?.[historique.sets.length - 1];
  const seriesEffectivesValidees = Math.max(0, log.sets.length - nbEchauffement);
  const rangeActuelle = (ex.objectifRepsRangeParSerie || [])[currentSetIndex] || null;
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
    const restantes = nbEchauffement - log.sets.length;
    for (let i = 0; i < restantes; i++) {
      onValidate(ex, { poids: 0, reps: 0, tempo: "", rpe: "" }, true);
    }
    setOpen(false);
  };

  return (
    <Card
      style={{
        padding: 0,
        overflow: "hidden",
        background: cardFillGradient(),
        transition: "background 0.4s ease",
        border: progressionPct >= 100 ? `2px solid ${C.green}` : "2px solid rgba(245,197,66,0.9)",
        boxShadow: progressionPct >= 100 ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(58,214,160,0.4), 0 0 22px rgba(58,214,160,0.5), 0 10px 28px rgba(0,0,0,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(245,197,66,0.35), 0 0 22px rgba(245,197,66,0.4), 0 10px 28px rgba(0,0,0,0.4)",
        borderRadius: 22,
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
                <VideoThumb url={ex.videoDemoUrl} />
              ) : (
                <Dumbbell size={22} color={C.textDim} />
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: C.text }}>{ex.nom}</div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              {ex.type === "cardio" ? (
                <>🏃 {ex.dureeMinutes} min {log.sets.length > 0 && "· Fait ✓"}</>
              ) : (
                <>
                  {seriesEffectivesValidees}/{ex.sets} séries
                  {nbEchauffement > 0 && <span style={{ color: "#F5C542" }}> · {Math.min(log.sets.length, nbEchauffement)}/{nbEchauffement} échauffement</span>}
                  {derniereSerieGlobale && (
                    <span style={{ color: C.blue }}> · dernière fois {derniereSerieGlobale.poids}kg × {derniereSerieGlobale.reps}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); setNotePersoDraft(ex.notePerso || ""); setNotePersoStatus("idle"); setShowNotePerso(true); }}
            title="Ma note perso"
            style={{ background: "transparent", border: "none", padding: 4, color: ex.notePerso ? C.amber : C.textDim, opacity: ex.notePerso ? 1 : 0.55, display: "flex" }}
          >
            <FileText size={15} />
          </div>
          <ChevronDown
            size={18}
            color={C.textMuted}
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}
          />
        </div>
      </button>

      {showNotePerso && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 175, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={closeNotePerso}>
          <Card style={{ width: "100%", maxWidth: 360, padding: "16px 14px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: C.text }}>
                <FileText size={15} color={C.amber} /> Ma note perso — {ex.nom}
              </div>
              <button onClick={closeNotePerso} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 8 }}>
              Visible seulement par toi — réglage de machine, hauteur de siège, repère technique...
            </div>
            <textarea
              value={notePersoDraft}
              onChange={(e) => setNotePersoDraft(e.target.value)}
              placeholder="Ex : siège position 4, dossier incliné 2"
              rows={3}
              autoFocus
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 8, minHeight: 16 }}>
              {notePersoStatus === "saving" && (
                <span style={{ fontSize: 11, color: C.textDim }}>Enregistrement...</span>
              )}
              {notePersoStatus === "enregistre" && (
                <span style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 3 }}>
                  <CheckCircle2 size={12} /> Enregistré automatiquement
                </span>
              )}
            </div>
          </Card>
        </div>
      )}

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setOpen(false)}>
        <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto", padding: "16px 14px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: C.surface, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {ex.videoDemoUrl ? (
                <VideoThumb url={ex.videoDemoUrl} />
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
                <div style={{ marginTop: 6 }}>
                  <VideoPlayer url={ex.videoDemoUrl} style={{ maxHeight: 240 }} />
                </div>
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
                background: "linear-gradient(135deg, rgba(245,197,66,0.16), rgba(76,125,240,0.14))",
                border: "1px solid rgba(245,197,66,0.5)",
                borderRadius: 18,
                padding: enEchauffement ? "9px 11px" : "12px 14px",
                fontSize: enEchauffement ? 11 : 13,
                color: C.text,
                boxShadow: "0 8px 22px rgba(0,0,0,0.35), 0 0 16px rgba(245,197,66,0.15)",
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
                      fontSize: enEchauffement ? 10 : 12, fontFamily: FONT_SANS, fontWeight: 700,
                      color: i === currentSetIndex ? "#2B1D00" : "#B9C4E0",
                      background: i === currentSetIndex ? "#F5C542" : "rgba(255,255,255,0.08)",
                      border: `1px solid ${i === currentSetIndex ? "#F5C542" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8, padding: enEchauffement ? "3px 7px" : "5px 10px",
                    }}
                  >
                    S{i + 1}: {s.poids}kg×{s.reps}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: enEchauffement ? 10 : 11.5, color: C.textMuted, marginTop: 8, fontWeight: 600 }}>Séance du {historique.date}</div>
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
                🔥 {nbEchauffement - log.sets.length} série{nbEchauffement - log.sets.length > 1 ? "s" : ""} d'échauffement à faire
              </div>
              <div style={{ fontSize: 11.5, color: C.textOnBg }}>
                Charge légère, environ 5 répétitions — augmente progressivement le poids à chaque série. Ne compte pas dans tes séries effectives. Valide-les toutes d'un coup ci-dessous.
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
              <Check size={16} /> Valider {nbEchauffement - log.sets.length > 1 ? `les ${nbEchauffement - log.sets.length} séries d'échauffement` : "la série d'échauffement"}
            </button>
          ) : ex.type === "cardio" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "14px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: C.text, fontWeight: 700 }}>{ex.dureeMinutes} min</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Valide une fois terminé</div>
              </div>
              <button
                onClick={submit}
                style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Check size={15} /> Terminé
              </button>
            </div>
          ) : (
            <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>Charge (kg)</div>
              <input
                type="number"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                placeholder={rappelSerieActuelle ? String(rappelSerieActuelle.poids) : "0"}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 16,
                  padding: "14px 14px",
                  color: C.text,
                  fontSize: 22,
                  fontWeight: 800,
                  textAlign: "center",
                  fontFamily: FONT_SANS,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>
                Répétitions{rangeActuelle && <span style={{ color: "#F5C542", fontWeight: 800, fontSize: 14 }}> · vise {rangeActuelle.min}-{rangeActuelle.max}</span>}
              </div>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={rappelSerieActuelle ? String(rappelSerieActuelle.reps) : (rangeActuelle ? `${rangeActuelle.min}-${rangeActuelle.max}` : "0")}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.cardBorderLight}`,
                  borderRadius: 16,
                  padding: "14px 14px",
                  color: C.text,
                  fontSize: 22,
                  fontWeight: 800,
                  textAlign: "center",
                  fontFamily: FONT_SANS,
                }}
              />
            </div>
            </div>

          {((rangeActuelle && parseInt(reps) >= rangeActuelle.max) || (!rangeActuelle && ex.objectifRepsMax && parseInt(reps) >= ex.objectifRepsMax)) && (
            <div style={{ background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: C.green, fontWeight: 700 }}>
              🎯 Objectif de {rangeActuelle ? rangeActuelle.max : ex.objectifRepsMax} reps atteint ! Augmente la charge la prochaine fois.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>Tempo</div>
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
              <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>RPE</div>
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
              onClick={submit}
              style={{
                flex: 1,
                background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)",
                border: "none",
                color: "#FFFFFF",
                borderRadius: 16,
                padding: "16px 12px",
                fontWeight: 800,
                fontSize: 16,
                boxShadow: "0 6px 18px rgba(76,125,240,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Check size={18} strokeWidth={3} /> Valider la série
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
      <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>Repos</span>
        <button onClick={onSkip} style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "14px 28px", fontWeight: 800, fontSize: 15 }}>
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

  const restInput = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,150,255,0.45)", borderRadius: 16, padding: "14px", color: C.text, fontSize: 24, fontWeight: 800, textAlign: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" };
  const restLabel = { fontSize: 12.5, color: C.textMuted, marginBottom: 6, fontWeight: 700, textAlign: "center" };

  return (
    <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse 90% 45% at 50% 30%, rgba(245,184,51,0.13) 0%, rgba(8,11,26,0) 70%), ${C.bg}`, zIndex: 200, display: "flex", flexDirection: "column", padding: "24px 20px", overflowY: "auto", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconBadge icon={Clock} color="#F5B833" size={34} iconSize={17} />
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.text, fontWeight: 800 }}>Repos</span>
        </div>
        <button onClick={onSkip} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: C.text, borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
      </div>

      {nextInfo ? (
        <Card style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 14, border: "1.5px solid rgba(140,190,255,0.85)", boxShadow: "0 0 20px rgba(120,170,255,0.45), 0 8px 24px rgba(0,0,0,0.4)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,150,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {nextInfo.image ? (
              <img src={nextInfo.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Dumbbell size={26} color="#9DB8FF" />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#8CBEFF", fontWeight: 700 }}>{nextInfo.label}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 17, color: C.text, marginTop: 1 }}>{nextInfo.nom}</div>
            {nextInfo.last && (
              <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 3, fontWeight: 600 }}>Dernière fois : <span style={{ color: C.text, fontWeight: 800 }}>{nextInfo.last.poids}kg × {nextInfo.last.reps}</span></div>
            )}
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 17, color: C.text }}>Dernière série de la séance 💪</div>
        </Card>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
        {rest.termine ? (
          <div style={{ textAlign: "center", animation: "pulseGlow 1s infinite" }}>
            <div style={{ width: 150, height: 150, borderRadius: "50%", background: "linear-gradient(135deg,#FFD25A,#F5A020)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 0 50px rgba(255,170,50,0.7), inset 0 2px 0 rgba(255,255,255,0.4)" }}>
              <Clock size={60} color="#3D2600" />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.text }}>Temps écoulé !</div>
            <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>C'est reparti 💪</div>
          </div>
        ) : (
          <div style={{ position: "relative", width: 240, height: 240, filter: "drop-shadow(0 0 18px rgba(255,170,50,0.45))" }}>
            <svg width="240" height="240" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFD25A" />
                  <stop offset="100%" stopColor="#F58A20" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r={ringRadius} fill="rgba(255,255,255,0.03)" stroke="rgba(110,150,255,0.25)" strokeWidth="14" />
              <circle
                cx="110" cy="110" r={ringRadius} fill="none" stroke="url(#restGrad)" strokeWidth="14"
                strokeDasharray={ringCirc} strokeDashoffset={ringOffset}
                strokeLinecap="round" transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT_SANS, fontSize: 64, color: C.text, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{rest.left}</div>
              <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600, marginTop: 4 }}>secondes</div>
            </div>
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>Ta série qui vient d'être validée</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={restLabel}>Charge (kg)</div>
            <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} style={restInput} />
          </div>
          <div>
            <div style={restLabel}>Répétitions</div>
            <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} style={restInput} />
          </div>
        </div>
      </Card>

      <button
        onClick={() => { onUpdateSet(poids, reps); onSkip(); }}
        style={{
          width: "100%", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16,
          background: rest.termine ? C.amber : C.blue,
          backgroundImage: rest.termine ? "linear-gradient(135deg,#FFD25A,#F5A020)" : "linear-gradient(135deg,#5B8CFF,#2F5BD0)",
          boxShadow: rest.termine ? "0 6px 24px rgba(255,170,50,0.55)" : "0 6px 24px rgba(59,111,224,0.55)",
          color: rest.termine ? "#3D2600" : "#FFFFFF",
        }}
      >
        {rest.termine ? "Continuer la séance" : "Terminer le repos"}
      </button>
    </div>
  );
}

function RoutineMobilitePlayer({ routine, onClose }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("travail"); // "travail" | "repos" | "fini"
  const [secondsLeft, setSecondsLeft] = useState(routine.duree_travail || 30);
  const [paused, setPaused] = useState(false);

  useEffect(() => { unlockAudio(); }, []);

  useEffect(() => {
    if (phase === "fini" || paused) return;
    if (secondsLeft <= 0) {
      playBeep();
      if (navigator.vibrate) navigator.vibrate(200);
      const dernierExercice = index >= routine.exercices.length - 1;
      if (phase === "travail") {
        if (dernierExercice) {
          setPhase("fini");
        } else {
          setPhase("repos");
          setSecondsLeft(routine.duree_repos || 30);
        }
      } else if (phase === "repos") {
        setIndex((i) => i + 1);
        setPhase("travail");
        setSecondsLeft(routine.duree_travail || 30);
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, phase, paused, index, routine]);

  const passer = () => {
    playBeep();
    const dernierExercice = index >= routine.exercices.length - 1;
    if (phase === "travail") {
      if (dernierExercice) { setPhase("fini"); return; }
      setPhase("repos");
      setSecondsLeft(routine.duree_repos || 30);
    } else {
      setIndex((i) => i + 1);
      setPhase("travail");
      setSecondsLeft(routine.duree_travail || 30);
    }
  };

  if (phase === "fini") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(6,12,28,0.94)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 44 }}>🎉</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#FFFFFF" }}>Routine terminée</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{routine.nom}</div>
          <button onClick={onClose} style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 999, padding: "12px 28px", fontWeight: 800, marginTop: 8 }}>Fermer</button>
        </div>
      </div>
    );
  }

  const exerciceActuel = routine.exercices[index];
  const prochainExercice = routine.exercices[index + 1];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
        background: phase === "travail" ? "#0A1E46" : "#1F1503",
        transition: "background 0.3s",
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "rgba(255,255,255,0.6)" }}><X size={24} /></button>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0, textTransform: "none", color: phase === "travail" ? "#6FA8FF" : C.amber, marginBottom: 10 }}>
        {phase === "travail" ? "Effort" : "Repos"} · {index + 1}/{routine.exercices.length}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 72, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>{secondsLeft}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginTop: 20, textAlign: "center" }}>{exerciceActuel}</div>
      {phase === "repos" && prochainExercice && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>Ensuite : {prochainExercice}</div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
        <button onClick={() => setPaused((p) => !p)} style={{ background: "rgba(255,255,255,0.14)", border: "none", color: "#FFFFFF", borderRadius: 999, padding: "12px 20px", fontWeight: 700 }}>{paused ? "Reprendre" : "Pause"}</button>
        <button onClick={passer} style={{ background: "rgba(255,255,255,0.14)", border: "none", color: "#FFFFFF", borderRadius: 999, padding: "12px 20px", fontWeight: 700 }}>Passer</button>
      </div>
    </div>
  );
}

// Liste complète des routines du client (pas seulement celle du jour) : celles prévues
// aujourd'hui se lancent directement, les autres affichent un cadenas et n'ouvrent qu'un
// aperçu en lecture seule (pas de minuteur) via onPreview.
function RoutinesListeClientModal({ routines, onLaunch, onPreview, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel icon={RotateCcw}>Mes routines</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        {routines.length === 0 ? (
          <div style={{ color: C.textMuted, fontSize: 13 }}>Aucune routine pour l'instant.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {routines.map((r) => {
              const estAujourdhui = (r.jours || []).includes(jourDuJourFr());
              return (
                <div
                  key={r.id}
                  onClick={() => (estAujourdhui ? onLaunch(r) : onPreview(r))}
                  style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 14, padding: 12, cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 3 }}>{r.nom}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted }}>
                        {r.exercices.length} exercice{r.exercices.length > 1 ? "s" : ""} · {r.duree_travail}s effort / {r.duree_repos}s repos
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {JOURS_SEMAINE.map((j) => (
                          <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: "3px 6px", borderRadius: 6, background: r.jours.includes(j) ? C.blueSoft : "transparent", color: r.jours.includes(j) ? C.blue : C.textDim }}>
                            {JOURS_SEMAINE_LABEL[j]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {estAujourdhui ? (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#06171F", background: C.blue, padding: "6px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>Lancer</div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }}>
                          <Lock size={13} color={C.textDim} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// Aperçu en lecture seule d'une routine qui n'est pas prévue aujourd'hui : le client voit
// le contenu (exercices, durées) mais ne peut pas lancer le minuteur avant le bon jour.
function RoutinePreviewModal({ routine, onClose }) {
  const joursLabel = JOURS_SEMAINE.filter((j) => routine.jours.includes(j)).map((j) => JOURS_SEMAINE_LABEL[j]).join(", ");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionLabel icon={RotateCcw}>{routine.nom}</SectionLabel>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
          <Lock size={13} color={C.textDim} />
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Prévue {joursLabel || "aucun jour"} · pas encore lançable aujourd'hui
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
          {routine.exercices.length} exercice{routine.exercices.length > 1 ? "s" : ""} · {routine.duree_travail}s effort / {routine.duree_repos}s repos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {routine.exercices.map((ex, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: C.surface }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.blueSoft, color: C.blue, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: C.text }}>{ex}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const MACRO_MODES = [
  { key: "pourcentage", label: "Pourcentage (%)" },
  { key: "grammes", label: "Grammes" },
  { key: "poids", label: "Poids de corps" },
];
const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const JOURS_SEMAINE_LABEL = { lundi: "Lun", mardi: "Mar", mercredi: "Mer", jeudi: "Jeu", vendredi: "Ven", samedi: "Sam", dimanche: "Dim" };
const jourDuJourFr = () => JOURS_SEMAINE[(new Date().getDay() + 6) % 7];

// Configuration macro par défaut pour un jour qui n'en a pas encore (nouveau jour, ou données
// pré-existantes migrées depuis l'ancien système global % / poids de corps).
function configMacroParDefaut(planActuel) {
  return {
    macroMode: planActuel?.protParKg != null || planActuel?.lipParKg != null ? "poids" : "pourcentage",
    pctProt: planActuel?.pctProt ?? 30,
    pctGluc: planActuel?.pctGluc ?? 45,
    pctLip: planActuel?.pctLip ?? 25,
    gProt: planActuel?.prot ?? 0,
    gGluc: planActuel?.gluc ?? 0,
    gLip: planActuel?.lip ?? 0,
    protParKg: planActuel?.protParKg ?? 2,
    lipParKg: planActuel?.lipParKg ?? 1,
  };
}

// Calcule protéines/glucides/lipides (en grammes) pour un nombre de calories et une config macro
// (% / grammes / poids de corps) donnés. Utilisé à la fois dans l'éditeur (aperçu par jour) et
// côté client pour dériver les objectifs du jour à partir de "nutrition_par_jour".
function calculerMacros(kcal, cfg, poidsActuel) {
  const k = parseInt(kcal) || 0;
  if (!cfg) return { prot: 0, gluc: 0, lip: 0 };
  if (cfg.macroMode === "poids") {
    const prot = Math.round((parseFloat(cfg.protParKg) || 0) * (poidsActuel || 0));
    const lip = Math.round((parseFloat(cfg.lipParKg) || 0) * (poidsActuel || 0));
    const gluc = Math.max(0, Math.round((k - prot * 4 - lip * 4) / 4));
    return { prot, gluc, lip };
  }
  if (cfg.macroMode === "grammes") {
    const total = (parseFloat(cfg.gProt) || 0) * 4 + (parseFloat(cfg.gGluc) || 0) * 4 + (parseFloat(cfg.gLip) || 0) * 9 || 1;
    const rProt = ((parseFloat(cfg.gProt) || 0) * 4) / total;
    const rGluc = ((parseFloat(cfg.gGluc) || 0) * 4) / total;
    const rLip = ((parseFloat(cfg.gLip) || 0) * 9) / total;
    return { prot: Math.round((k * rProt) / 4), gluc: Math.round((k * rGluc) / 4), lip: Math.round((k * rLip) / 9) };
  }
  const pctProt = parseFloat(cfg.pctProt) || 0, pctGluc = parseFloat(cfg.pctGluc) || 0, pctLip = parseFloat(cfg.pctLip) || 0;
  return {
    prot: Math.round((k * pctProt / 100) / 4),
    gluc: Math.round((k * pctGluc / 100) / 4),
    lip: Math.round((k * pctLip / 100) / 9),
  };
}

// Formulaire coach : composer une routine de mobilité en piochant dans MOBILITE_CATALOGUE,
// choisir les jours où elle doit apparaître sur l'accueil du client, et les durées du
// minuteur effort/repos.
function RoutineMobiliteModal({ routineActuelle, onSave, onClose }) {
  const [nom, setNom] = useState(routineActuelle?.nom || "");
  const [jours, setJours] = useState(routineActuelle?.jours || []);
  const [dureeTravail, setDureeTravail] = useState(routineActuelle?.duree_travail || 30);
  const [dureeRepos, setDureeRepos] = useState(routineActuelle?.duree_repos || 30);
  const [exercices, setExercices] = useState(routineActuelle?.exercices || []);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [manqueMessage, setManqueMessage] = useState(null);

  const toggleJour = (j) => setJours((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]));
  const toggleExercice = (nomEx) => setExercices((prev) => (prev.includes(nomEx) ? prev.filter((x) => x !== nomEx) : [...prev, nomEx]));

  const valide = nom.trim() && exercices.length > 0 && jours.length > 0;

  const save = async () => {
    setErreur(null);
    if (!valide) {
      const manques = [];
      if (!nom.trim()) manques.push("un nom");
      if (jours.length === 0) manques.push("au moins un jour");
      if (exercices.length === 0) manques.push("au moins un exercice");
      setManqueMessage(`Il manque : ${manques.join(", ")}.`);
      return;
    }
    setManqueMessage(null);
    setSaving(true);
    try {
      await onSave({
        nom: nom.trim(),
        jours,
        duree_travail: parseInt(dureeTravail) || 30,
        duree_repos: parseInt(dureeRepos) || 30,
        exercices,
      });
    } catch (err) {
      console.error("Erreur enregistrement routine (modal):", err);
      setErreur(err?.message || "Erreur inconnue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <SectionHead icon={RotateCcw} title={<>{routineActuelle ? "Modifier la routine" : "Nouvelle routine mobilité"}</>} />

        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4, marginTop: 10 }}>Nom</div>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Mix chevilles + lombaires"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14, marginBottom: 14, boxSizing: "border-box" }}
        />

        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Jours</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {JOURS_SEMAINE.map((j) => (
            <button
              key={j}
              onClick={() => toggleJour(j)}
              style={{
                background: jours.includes(j) ? C.blue : C.surface,
                border: `1px solid ${jours.includes(j) ? C.blue : C.cardBorderLight}`,
                color: jours.includes(j) ? "#06171F" : C.textMuted,
                borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700,
              }}
            >
              {JOURS_SEMAINE_LABEL[j]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Effort (sec)</div>
            <input type="number" value={dureeTravail} onChange={(e) => setDureeTravail(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO, boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Repos (sec)</div>
            <input type="number" value={dureeRepos} onChange={(e) => setDureeRepos(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
          Exercices ({exercices.length} sélectionné{exercices.length > 1 ? "s" : ""})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 260, overflowY: "auto", border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: 10 }}>
          {Object.entries(MOBILITE_CATALOGUE).map(([zone, exs]) => (
            <div key={zone}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, textTransform: "none", letterSpacing: 0, marginBottom: 4 }}>{zone}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {exs.map((exNom) => {
                  const selected = exercices.includes(exNom);
                  return (
                    <button key={exNom} onClick={() => toggleExercice(exNom)} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: "3px 0", textAlign: "left" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected ? C.blue : C.cardBorderLight}`, background: selected ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {selected && <Check size={11} color="#06171F" />}
                      </div>
                      <span style={{ fontSize: 12.5, color: C.text }}>{exNom}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {manqueMessage && (
          <div style={{ fontSize: 12.5, color: "#F5A623", marginBottom: 10, fontWeight: 600 }}>{manqueMessage}</div>
        )}
        {erreur && (
          <div style={{ fontSize: 12.5, color: "#FF5A5A", marginBottom: 10, fontWeight: 600 }}>{erreur}</div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 14 }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: valide ? C.blue : C.surface, border: "none", color: valide ? "#06171F" : C.textDim, borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function SessionView({ programme, history, setHistory, onFinish, onCancel, fireToast, onSessionComplete, profilId, coachId, onSaveNotePerso }) {
  const [seconds, setSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState("pending"); // "pending" | "ok" | "error"
  // Verrou anti double-envoi : un double-tap sur "Terminer" avant le prochain rendu pouvait
  // déclencher deux sauvegardes en parallèle et laisser une séance fantôme en base.
  const dejaEnvoyeRef = useRef(false);
  const sessionKey = programme.id || programme.nom;
  const startTimeKey = `session_start_${sessionKey}`;
  const logsKey = `session_logs_${sessionKey}`;
  const restKey = `session_rest_${sessionKey}`;

  // Sécurité : si une séance a été abandonnée (app fermée sans appuyer sur "Terminer"),
  // son chrono restait figé dans le localStorage. En relançant le même programme plus
  // tard, on reprenait ce vieux départ et on obtenait des durées absurdes (ex: plusieurs
  // jours). Au-delà d'un délai qu'aucune vraie séance ne dépasse, on repart de zéro.
  const SEANCE_ABANDON_MAX_MS = 6 * 60 * 60 * 1000; // 6h
  const staleStart = localStorage.getItem(startTimeKey);
  if (staleStart && Date.now() - parseInt(staleStart, 10) > SEANCE_ABANDON_MAX_MS) {
    localStorage.removeItem(startTimeKey);
    localStorage.removeItem(logsKey);
    localStorage.removeItem(restKey);
  }

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
  const [autoEnvoyee, setAutoEnvoyee] = useState(false);

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

  // Suivi côté serveur de la séance en cours : permet d'envoyer un rappel push à 3h
  // même si l'app est totalement fermée (le timer JS ci-dessus ne peut pas tourner
  // dans ce cas). Un cron externe (api/check-long-sessions.js) lit cette table.
  useEffect(() => {
    if (!profilId) return;
    const start = localStorage.getItem(startTimeKey);
    const demarreeA = start ? new Date(parseInt(start, 10)).toISOString() : new Date().toISOString();
    supabase
      .from("seances_en_cours")
      .upsert(
        { profil_id: profilId, coach_id: coachId || null, programme_nom: programme.nom, demarree_a: demarreeA, alerte_envoyee: false },
        { onConflict: "profil_id" }
      )
      .then(({ error }) => { if (error) console.error("Erreur suivi séance en cours:", error); });
  }, [profilId]);

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
    if (profilId) {
      supabase.from("seances_en_cours").delete().eq("profil_id", profilId).then(({ error }) => {
        if (error) console.error("Erreur nettoyage séance en cours (serveur):", error);
      });
    }
  };

  // Auto-envoi à 3h de séance en cours : plutôt que de compter sur une notification que le
  // client doit remarquer et suivre, on clôture et on envoie automatiquement ce qui a été
  // fait. S'il n'y a rien eu de loggé (aucune série validée), il n'y a rien à envoyer — on
  // referme simplement la séance fantôme sans créer d'entrée vide côté coach.
  useEffect(() => {
    const SEUIL_AUTO_ENVOI_SECONDES = 3 * 60 * 60; // 3h
    if (seconds < SEUIL_AUTO_ENVOI_SECONDES) return;
    if (dejaEnvoyeRef.current) return;
    dejaEnvoyeRef.current = true;
    (async () => {
      nettoyerStockageSession();
      if (totalSets === 0) {
        onFinish?.();
        return;
      }
      setAutoEnvoyee(true);
      setFinished(true);
      setSaveStatus("pending");
      const ok = await onSessionComplete?.({ programme, logs, seconds });
      setSaveStatus(ok ? "ok" : "error");
    })();
  }, [seconds]);

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
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: saveStatus === "error" ? C.redSoft : C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={30} color={saveStatus === "error" ? C.red : C.green} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.textOnBg }}>
          {saveStatus === "error" ? "Échec de l'envoi" : saveStatus === "pending" ? "Envoi en cours..." : autoEnvoyee ? "Séance envoyée automatiquement" : "Séance envoyée à ton coach"}
        </div>
        {autoEnvoyee && saveStatus === "ok" && (
          <div style={{ fontSize: 12, color: C.amber, marginTop: -8 }}>Envoyée après 3h sans clôture manuelle</div>
        )}
        <div style={{ fontSize: 13, color: C.textOnBgMuted, maxWidth: 280 }}>{programme.nom}</div>

        {saveStatus === "error" && (
          <div style={{ background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 12, padding: "12px 16px", maxWidth: 300, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12.5, color: C.red, fontWeight: 600 }}>
              Ta séance n'a pas pu être envoyée à ton coach — vérifie ta connexion et réessaie.
            </div>
            <button
              onClick={async () => {
                setSaveStatus("pending");
                const ok = await onSessionComplete?.({ programme, logs, seconds });
                setSaveStatus(ok ? "ok" : "error");
              }}
              style={{ background: C.red, border: "none", color: "#FFFFFF", borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13 }}
            >
              Réessayer l'envoi
            </button>
          </div>
        )}

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

        {saveStatus === "pending" ? (
          // Le bouton de retour n'apparaît qu'une fois l'envoi réellement terminé (succès
          // ou échec) : s'il était affiché tout de suite, le client pourrait quitter l'écran
          // avant que la séance ait fini d'être enregistrée côté serveur.
          <div style={{ fontSize: 12.5, color: C.textOnBgMuted, fontWeight: 600 }}>
            Envoi de la séance en cours, un instant...
          </div>
        ) : (
          <button
            onClick={onFinish}
            style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 999, padding: "12px 24px", fontWeight: 800 }}
          >
            Retour à mes séances
          </button>
        )}
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
            <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, textTransform: "none", letterSpacing: 0, marginBottom: 2 }}>Échauffement</div>
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
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, textTransform: "none", letterSpacing: 0 }}>Superset · {block.exs.length} exercices</span>
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
                    onSaveNotePerso={onSaveNotePerso}
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
                onSaveNotePerso={onSaveNotePerso}
              />
            )
          );
        })()}
      </div>
      <button
        onClick={async () => {
          if (dejaEnvoyeRef.current) return;
          dejaEnvoyeRef.current = true;
          setFinished(true);
          nettoyerStockageSession();
          setSaveStatus("pending");
          const ok = await onSessionComplete?.({ programme, logs, seconds });
          setSaveStatus(ok ? "ok" : "error");
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
          <SectionHead icon={Flame} title={<>Choisir le RPE</>} />
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
          <SectionHead icon={Clock} title={<>Choisir le tempo</>} />
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
          <SectionHead icon={Clock} title={<>Tempo {tempo}</>} />
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
          <SectionHead icon={Clock} title={<>Choisir le temps de repos</>} />
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

function RepRangePickerModal({ value, onSelect, onClose, titre }) {
  const [showCustom, setShowCustom] = useState(false);
  const [min, setMin] = useState(value?.min ?? "");
  const [max, setMax] = useState(value?.max ?? "");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionHead icon={Target} title={<>{titre || "Choisir la fourchette de reps"}</>} />
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {REP_RANGES.map((r) => {
            const actif = value && value.min === r.min && value.max === r.max;
            return (
              <button
                key={`${r.min}-${r.max}`}
                onClick={() => { onSelect({ min: r.min, max: r.max }); onClose(); }}
                style={{
                  padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: FONT_MONO,
                  background: actif ? C.blue : C.surface,
                  color: actif ? "#06171F" : C.text,
                  border: `1px solid ${actif ? C.blue : C.cardBorderLight}`,
                }}
              >
                {r.min}-{r.max}
              </button>
            );
          })}
        </div>
        {!showCustom ? (
          <button onClick={() => setShowCustom(true)} style={{ width: "100%", marginTop: 10, background: "transparent", border: `1px dashed ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600 }}>
            + Fourchette personnalisée
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="min" style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px", color: C.text, fontSize: 13, textAlign: "center" }} />
            <span style={{ color: C.textDim }}>-</span>
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="max" style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px", color: C.text, fontSize: 13, textAlign: "center" }} />
            <button
              onClick={() => {
                const mn = parseInt(min), mx = parseInt(max);
                if (mn > 0 && mx >= mn) { onSelect({ min: mn, max: mx }); onClose(); }
              }}
              style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
            >
              OK
            </button>
          </div>
        )}
        {value && (
          <button onClick={() => { onSelect(null); onClose(); }} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: C.red, fontSize: 12.5, fontWeight: 600 }}>
            Retirer la fourchette
          </button>
        )}
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

function getYouTubeEmbedId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function VideoThumb({ url, style }) {
  if (!url) return null;
  const ytId = getYouTubeEmbedId(url);
  if (ytId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
        alt="aperçu de l'exercice"
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
      />
    );
  }
  return <video src={`${url}#t=0.1`} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />;
}

function VideoPlayer({ url, style }) {
  if (!url) return null;
  const ytId = getYouTubeEmbedId(url);
  if (ytId) {
    return (
      <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000", ...style }}>
        <iframe
          title="vidéo d'exécution"
          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <video src={url} controls autoPlay playsInline style={{ width: "100%", borderRadius: 12, background: "#000", ...style }} />;
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

function EnregistreurVideoModal({ onClose, onRecorded }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [enregistrement, setEnregistrement] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "environment" },
        audio: true,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Erreur accès caméra:", err);
        setErreur("Impossible d'accéder à la caméra. Vérifie les autorisations dans les réglages.");
      });
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const demarrer = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 400000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start();
    recorderRef.current = recorder;
    setEnregistrement(true);
    setSecondes(0);
    timerRef.current = setInterval(() => setSecondes((s) => s + 1), 1000);
  };

  const arreter = () => {
    if (recorderRef.current) recorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setEnregistrement(false);
    setTimeout(async () => {
      const mimeType = recorderRef.current?.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setEnvoi(true);
      await onRecorded(blob, mimeType);
      setEnvoi(false);
    }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 210, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>
          {enregistrement ? `🔴 ${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}` : "Filmer ton exécution"}
        </span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#FFFFFF" }}><X size={22} /></button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {erreur ? (
          <div style={{ color: "#FF5D6C", fontSize: 13, textAlign: "center", padding: 30 }}>{erreur}</div>
        ) : (
          <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }} />
        )}
      </div>
      <div style={{ padding: 30, display: "flex", justifyContent: "center" }}>
        {envoi ? (
          <div style={{ color: "#FFFFFF", fontSize: 13 }}>Envoi en cours...</div>
        ) : !erreur && (
          <button
            onClick={enregistrement ? arreter : demarrer}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: enregistrement ? "#FF5D6C" : "#FFFFFF",
              border: "4px solid rgba(255,255,255,0.5)",
            }}
          />
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
        {
          facingMode: "environment",
          // Résolution plus haute + mise au point continue : le code-barres reste net et
          // lisible sans avoir à rapprocher l'emballage à quelques centimètres de l'appareil,
          // et l'appareil refait la mise au point tout seul si le client s'approche quand même.
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }],
        },
        {
          fps: 10,
          // Zone de scan plus large (proportionnelle à l'écran, jusqu'à une taille max) : le
          // code-barres peut remplir la zone à une distance plus confortable, sans avoir à
          // coller le produit à la caméra.
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.min(320, Math.floor(viewfinderWidth * 0.9)),
            height: Math.min(200, Math.floor(viewfinderHeight * 0.5)),
          }),
          aspectRatio: 1.5,
          // Utilise le détecteur de codes-barres natif du téléphone quand il est disponible
          // (plus rapide et plus tolérant à la distance/l'angle que le décodeur JS pur).
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
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
      <div style={{ fontSize: 14, color: "#FFFFFF", marginBottom: 6, fontWeight: 700, textAlign: "center" }}>
        Scanne le code-barres de l'emballage
      </div>
      {!erreur && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14, textAlign: "center", maxWidth: 280 }}>
          Tiens le produit à 15-20 cm de la caméra, pas plus près
        </div>
      )}
      {erreur ? (
        <div style={{ color: "#FF5D6C", fontSize: 13, textAlign: "center", maxWidth: 280 }}>{erreur}</div>
      ) : (
        <div id="scanner-zone-cowave" style={{ width: "100%", maxWidth: 340, borderRadius: 16, overflow: "hidden" }} />
      )}
    </div>
  );
}

function MealCard({ meal, items, onAdd, onRemove, onUpdate, fireToast, profilId, isCoach = false }) {
  const [showScanner, setShowScanner] = useState(false);
  const [editingNomAliment, setEditingNomAliment] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editGrams, setEditGrams] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSaveRecette, setShowSaveRecette] = useState(false);
  const [nomRecette, setNomRecette] = useState("");
  const [savingRecette, setSavingRecette] = useState(false);
  const [ajouterAuxBrouillons, setAjouterAuxBrouillons] = useState(false);
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

      // Optionnel (coach uniquement) : ajoute aussi la recette à ses brouillons, pour
      // pouvoir la préparer et l'envoyer plus tard à un client sans tout retaper.
      if (isCoach && ajouterAuxBrouillons) {
        const totalKcal = items.reduce((s, it) => s + it.kcal, 0);
        const ingredientsTexte = items.map((it) => `${it.nom} — ${it.grams}g (${it.kcal} kcal)`).join("\n");
        await supabase.from("recettes").insert({
          coach_id: profilId,
          client_id: null,
          nom: nomRecette,
          description: `${meal.nom} · ${totalKcal} kcal au total`,
          ingredients: ingredientsTexte,
          instructions: "",
          envoyee: false, // atterrit dans le dossier "Brouillons" du coach, à envoyer plus tard
        });
      }

      fireToast("Recette enregistrée", "green");
      setShowSaveRecette(false);
      setNomRecette("");
      setAjouterAuxBrouillons(false);
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
      // On ne filtre plus par type de repas : une recette enregistrée depuis le petit-déjeuner
      // doit pouvoir être réutilisée dans n'importe quel repas (déjeuner, collation...).
      const { data, error } = await supabase
        .from("recettes_personnelles")
        .select("*")
        .eq("profil_id", profilId)
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
          supabase.from("aliments_ciqual").select("*").ilike("nom", `%${searchQuery}%`).limit(10),
          fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=20&lc=fr`).then((r) => r.json()).catch(() => ({ products: [] })),
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
          .filter((p) => p.product_name && p.nutriments && (p.nutriments["energy-kcal_100g"] != null || p.nutriments["energy_100g"] != null))
          .map((p) => ({
            nom: p.product_name,
            source: p.brands || "Open Food Facts",
            kcal: p.nutriments["energy-kcal_100g"] != null ? p.nutriments["energy-kcal_100g"] : Math.round((p.nutriments["energy_100g"] || 0) / 4.184),
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
    }, 300);
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
    const grams = parseFloat(manualGrams) || 0;
    onAdd(meal.key, {
      id: Date.now(),
      nom,
      grams,
      kcal: Math.round(kcal),
      prot: +prot.toFixed(1),
      gluc: +gluc.toFixed(1),
      lip: +lip.toFixed(1),
      fibres: 0, sucres: 0, sodium: 0, potassium: 0, calcium: 0, fer: 0, magnesium: 0, vitamineD: 0,
    });

    // Enregistre cet aliment dans la base personnelle pour le retrouver facilement la prochaine fois
    if (profilId) {
      const ratio = grams > 0 ? 100 / grams : 1; // ramène à une valeur pour 100g
      supabase.from("aliments_scannes").insert({
        profil_id: profilId,
        code_barre: null,
        nom,
        kcal: Math.round(kcal * ratio),
        prot: +(prot * ratio).toFixed(1),
        gluc: +(gluc * ratio).toFixed(1),
        lip: +(lip * ratio).toFixed(1),
      }).then(({ error }) => {
        if (error) console.error("Erreur sauvegarde aliment manuel:", error);
      });
    }

    setManualNom(""); setManualGrams(""); setManualKcal(""); setManualProt(""); setManualGluc(""); setManualLip("");
    setManualMode(false);
    setShowAddForm(false);
  };

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>{meal.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{meal.nom}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 1 }}>{items.length} aliment{items.length > 1 ? "s" : ""}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{totalKcal}</span>
            <span style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}> kcal</span>
          </div>
        </div>
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
        </div>
      </div>
      {(
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((it) => (
            <div
              key={it.id}
              onClick={() => { setEditingItem(it); setEditGrams(String(it.grams)); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "11px 12px 11px 14px", cursor: "pointer" }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14.5, color: C.text, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nom}</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 10px", marginTop: 3, fontSize: 12 }}>
                  <span style={{ color: C.textMuted, fontWeight: 600 }}>{it.grams} g</span>
                  <span style={{ color: "#7FA0FF" }}>P {it.prot}</span>
                  <span style={{ color: "#F5C542" }}>G {it.gluc}</span>
                  <span style={{ color: "#F28C38" }}>L {it.lip}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 15, color: C.text, fontWeight: 800 }}>{it.kcal}<span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}> kcal</span></span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(meal.key, it.id); }} style={{ background: "transparent", border: "none", color: C.textDim, padding: 6, display: "flex" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {editingItem && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditingItem(null)}>
              <Card style={{ width: "100%", maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <SectionHead icon={ClipboardList} title={<>{editingItem.nom}</>} />
                  <button onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>Quantité (grammes)</div>
                <input
                  type="number"
                  value={editGrams}
                  onChange={(e) => setEditGrams(e.target.value)}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14, fontFamily: FONT_MONO, marginBottom: 14 }}
                />
                <button
                  onClick={() => { onUpdate(meal.key, editingItem.id, parseFloat(editGrams) || editingItem.grams); setEditingItem(null); }}
                  style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}
                >
                  Enregistrer
                </button>
              </Card>
            </div>
          )}

          <button
            onClick={() => setShowAddForm(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.blueSoft, border: `1px dashed ${C.blueBorder}`, color: "#7FA0FF", fontSize: 14, fontWeight: 700, padding: "11px 0", borderRadius: 14 }}
          >
            <Plus size={16} /> Ajouter un aliment
          </button>
        </div>
      )}
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 170, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setShowAddForm(false); setManualMode(false); setSelectedFood(null); setSearchQuery(""); }}>
          <Card style={{ width: "100%", maxWidth: 400, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{meal.emoji}</div>
                <div>
                  <div style={{ fontSize: 12.5, color: C.textMuted }}>Ajouter à</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{meal.nom}</div>
                </div>
              </div>
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
                    style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 14 }}
                  />
                  <button
                    onClick={() => setShowScanner(true)}
                    style={{ background: C.blue, border: "none", borderRadius: 14, width: 48, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <ScanLine size={20} />
                  </button>
                </div>
                {searching && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Recherche...</div>}
                {searchResults.length > 0 && !selectedFood && (
                  <div style={{ marginTop: 6, maxHeight: 200, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}>
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedFood(r); setSearchResults([]); setSearchQuery(r.nom); if (r.poidsPortionSuggere) setPoidsPortion(String(r.poidsPortionSuggere)); }}
                        style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? `1px solid ${C.cardBorderLight}` : "none", padding: "11px 14px" }}
                      >
                        <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{r.nom}</div>
                        <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>
                          {Math.round(r.kcal)} kcal / 100g · <span style={{ color: r.source === "Mes aliments" ? C.amber : (r.source === "CIQUAL" ? C.green : C.blue) }}>{r.source}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedFood && (
                <div style={{ fontSize: 11.5, color: C.blue, display: "flex", alignItems: "center", gap: 6 }}>
                  {editingNomAliment ? (
                    <input
                      autoFocus
                      type="text"
                      value={selectedFood.nom}
                      onChange={(e) => setSelectedFood({ ...selectedFood, nom: e.target.value })}
                      onBlur={() => setEditingNomAliment(false)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingNomAliment(false)}
                      style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 6, padding: "2px 6px", color: C.text, fontSize: 11.5 }}
                    />
                  ) : (
                    <>
                      <Check size={12} /> {selectedFood.nom}
                      <button onClick={() => setEditingNomAliment(true)} style={{ background: "transparent", border: "none", color: C.textDim, display: "flex", opacity: 0.6 }}>
                        <Edit3 size={11} />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelectedFood(null); setSearchQuery(""); setEditingNomAliment(false); }} style={{ background: "transparent", border: "none", color: C.textDim, display: "flex" }}><X size={12} /></button>
                </div>
              )}

              <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {[["grammes", "Grammes"], ["portion", "Par portion"]].map(([k, lab]) => (
                  <button key={k} onClick={() => setModeQuantite(k)} style={{ flex: 1, border: "none", borderRadius: 12, padding: "9px 6px", fontSize: 13.5, fontWeight: 700, background: modeQuantite === k ? C.blue : "transparent", color: modeQuantite === k ? "#FFFFFF" : C.textMuted, boxShadow: modeQuantite === k ? "0 2px 10px rgba(59,111,224,0.45)" : "none", transition: "all .15s ease" }}>
                    {lab}
                  </button>
                ))}
              </div>

              {modeQuantite === "grammes" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" placeholder="Quantité en grammes" value={grams} onChange={(e) => setGrams(e.target.value)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                  <button onClick={add} disabled={!selectedFood} style={{ background: selectedFood ? C.blue : "rgba(255,255,255,0.06)", border: "none", borderRadius: 14, width: 48, display: "flex", alignItems: "center", justifyContent: "center", color: selectedFood ? "#FFFFFF" : C.textDim }}>
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 3 }}>Nombre de portions</div>
                      <input type="number" placeholder="ex : 2" value={nbPortions} onChange={(e) => setNbPortions(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 3 }}>Poids d'une portion (g)</div>
                      <input type="number" placeholder="ex : 25" value={poidsPortion} onChange={(e) => setPoidsPortion(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
                    </div>
                  </div>
                  {nbPortions && poidsPortion && (
                    <div style={{ fontSize: 11, color: C.textDim }}>= {(parseFloat(nbPortions) * parseFloat(poidsPortion)).toFixed(0)}g au total</div>
                  )}
                  <button onClick={add} disabled={!selectedFood} style={{ background: selectedFood ? C.blue : "rgba(255,255,255,0.06)", border: "none", borderRadius: 14, padding: "13px", color: selectedFood ? "#FFFFFF" : C.textDim, fontWeight: 700, fontSize: 14.5 }}>
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
              <SectionHead icon={Download} title={<>Copier {meal.emoji} {meal.nom}</>} />
              <button onClick={() => setShowCopieModal(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>
              Choisis le jour à copier — tout ce qui a été mangé à ce repas ce jour-là sera ajouté à aujourd'hui.
            </div>
            <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>Date à copier</div>
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
              style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: copiantHier ? 0.6 : 1 }}
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
              <SectionHead icon={ClipboardList} title={<>Enregistrer comme recette</>} />
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
            {isCoach && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={ajouterAuxBrouillons} onChange={(e) => setAjouterAuxBrouillons(e.target.checked)} />
                <span style={{ fontSize: 12, color: C.textMuted }}>Ajouter aussi à mes brouillons de recettes (à envoyer à un client plus tard)</span>
              </label>
            )}
            <button
              onClick={enregistrerCommeRecette}
              disabled={savingRecette || !nomRecette.trim()}
              style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: savingRecette || !nomRecette.trim() ? 0.6 : 1 }}
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
              <SectionHead icon={ClipboardList} title={<>Mes recettes · ajouter à {meal.nom}</>} />
              <button onClick={() => setShowUseRecette(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            {loadingRecettes ? (
              <div style={{ color: C.textMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
            ) : mesRecettes.length === 0 ? (
              <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 10 }}>
                Aucune recette enregistrée. Utilise "Enregistrer comme recette" une fois que tu as ajouté des aliments.
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
          boxShadow: "0 0 10px rgba(59,111,224,0.4), 0 4px 12px rgba(0,0,0,0.4)",
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
              <SectionHead icon={ShoppingCart} title={<>Liste de courses</>} />
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
              <SectionHead icon={Pill} title={<>Suppléments recommandés</>} />
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

// Anneau de progression pour un macronutriment (pourcentage de l'objectif atteint au centre).
function MacroRing({ label, val, obj, color }) {
  const size = 78, r = 32, circ = 2 * Math.PI * r;
  const ratio = obj > 0 ? val / obj : 0;
  const depasse = obj > 0 && val > obj;
  const arc = depasse ? C.red : color;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={arc} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - Math.min(1, ratio) * circ}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset .4s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: depasse ? C.red : C.text }}>
          {Math.round(ratio * 100)}%
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: C.text, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>
        {Math.round(val)} / {obj} g
      </div>
    </div>
  );
}

function Nutrition({ meals, onAdd, onRemove, onUpdate, objectifs, profilId, fireToast, saveObjectifsNutrition, eauVerres, onChangeWater, isCoach = false, selfClientPlan = null, onSaveParJour, onSaveParKg, onSaveNutritionParJour }) {
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

      <Card style={{ cursor: "pointer", padding: 18 }} onClick={() => setShowNutriDetail(true)}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 46, fontWeight: 800, color: totals.kcal > objectifs.kcal ? C.red : C.text, lineHeight: 1 }}>{Math.round(totals.kcal)}</span>
          <span
            onClick={(e) => { e.stopPropagation(); setShowGoalEditor(true); }}
            style={{ fontSize: 16, color: C.textMuted, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            / {Math.round(objectifs.kcal).toLocaleString("fr-FR")} kcal <Edit3 size={13} color={C.textDim} />
          </span>
        </div>
        <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 14 }}>
          <div style={{
            height: "100%", width: `${Math.min(100, (totals.kcal / (objectifs.kcal || 1)) * 100)}%`, borderRadius: 999,
            background: totals.kcal > objectifs.kcal ? C.red : `linear-gradient(90deg, ${C.amber}, #F28C38)`,
            transition: "width .4s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            {totals.kcal <= objectifs.kcal
              ? `${Math.round(objectifs.kcal - totals.kcal)} kcal restantes`
              : `${Math.round(totals.kcal - objectifs.kcal)} kcal dépassées`}
          </span>
          <span style={{ fontSize: 13, color: "#7FA0FF", fontWeight: 600 }}>Voir détails →</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {/* objectifs.prot/gluc/lip sont déjà calculés correctement en amont (calculerMacros),
              quel que soit le mode choisi (% / grammes / poids de corps). */}
          <MacroRing label="Protéines" val={totals.prot} obj={Math.round(objectifs.prot) || 0} color="#4C7DF0" />
          <MacroRing label="Glucides" val={totals.gluc} obj={Math.round(objectifs.gluc) || 0} color="#F5C542" />
          <MacroRing label="Lipides" val={totals.lip} obj={Math.round(objectifs.lip) || 0} color="#F28C38" />
        </div>
      </Card>

      <div>
        <SectionLabel icon={Apple} onBg>Repas</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MEAL_DEFS.map((m) => (
            <MealCard key={m.key} meal={m} items={meals[m.key]} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} fireToast={fireToast} profilId={profilId} isCoach={isCoach} />
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
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Macronutriments</div>
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
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0, marginTop: 8 }}>Autres nutriments</div>
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
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", letterSpacing: 0, marginTop: 8 }}>Minéraux & vitamines</div>
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
      {showGoalEditor && selfClientPlan ? (
        // Le coach, sur sa propre nutrition, a le même éditeur complet que celui qu'il utilise
        // pour ses clients (par jour de la semaine, ou par poids de corps).
        <PlanAlimentaireModal
          planActuel={objectifs}
          client={selfClientPlan}
          onClose={() => setShowGoalEditor(false)}
          onSave={(np) => { saveObjectifsNutrition(np); setShowGoalEditor(false); }}
          onSaveParJour={(k) => { onSaveParJour?.(k); setShowGoalEditor(false); }}
          onSaveParKg={(k) => { onSaveParKg?.(k); setShowGoalEditor(false); }}
          onSaveNutritionParJour={(cfg) => { onSaveNutritionParJour?.(cfg); setShowGoalEditor(false); }}
        />
      ) : showGoalEditor ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowGoalEditor(false)}>
          <Card style={{ width: "100%", maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <SectionHead icon={Flame} title={<>Objectif calorique</>} />
            <input type="number" defaultValue={objectifs.kcal} id="goalKcalInput" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 16, fontFamily: FONT_MONO, marginBottom: 16 }} />
            <SectionHead icon={ClipboardList} title={<>Répartition des macros (%)</>} />
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
            }} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>Enregistrer</button>
          </Card>
        </div>
      ) : null}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={() => ref.current && ref.current.click()}
        style={{
          width: "100%", aspectRatio: "3/4", borderRadius: 18, padding: 0,
          border: displayUrl ? `1.5px solid ${C.blueBorder}` : "1px solid rgba(255,255,255,0.1)",
          background: displayUrl ? `url(${displayUrl}) center/cover` : "linear-gradient(160deg, rgba(76,125,240,0.22), rgba(255,255,255,0.03) 70%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        {!displayUrl && <User size={38} color="rgba(185,196,224,0.35)" strokeWidth={1.5} />}
        {!displayUrl && (
          <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "#4C7DF0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(76,125,240,0.5)" }}>
            <Plus size={15} color="#FFFFFF" strokeWidth={3} />
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,7,16,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>Envoi...</div>
          </div>
        )}
        {displayUrl && !uploading && (
          <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={14} color="#062018" strokeWidth={3} />
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
      <div style={{ fontSize: 12.5, color: displayUrl ? C.text : C.textMuted, textAlign: "center", fontWeight: 600, lineHeight: 1.25 }}>{cat.nom}</div>
    </div>
  );
}

function CheckinSlider({ label, value, onChange, emojis }) {
  const fill = ((value - 1) / 4) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14.5, color: C.text, fontWeight: 600 }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 19 }}>{emojis[value - 1]}</span>
          <span style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 700 }}>{value}/5</span>
        </span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: "100%", "--fill": `${fill}%` }} />
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
        <SectionHead icon={Camera} title={<>Ta photo de profil</>} />
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
  const [showBilanForm, setShowBilanForm] = useState(false);
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
  // Brouillon du bilan persisté : si le client quitte l'app en cours de rédaction (ou que
  // l'app se ferme en arrière-plan), il retrouve ce qu'il avait déjà écrit en revenant,
  // au lieu de devoir tout retaper avant de pouvoir l'envoyer à son coach.
  const BILAN_DRAFT_KEY = "bilan_draft_form";
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(BILAN_DRAFT_KEY);
      if (saved) return { ...emptyForm, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return emptyForm;
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    localStorage.setItem(BILAN_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

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
    // Date au format ISO (comme pour les séances) : un format "JJ/MM/AAAA" stocké tel quel
    // se fait reparser jour/mois inversés partout ailleurs (tri, affichage), ce qui faisait
    // apparaître un bilan comme plus récent qu'il ne l'était réellement.
    addCheckin({ ...form, date: todayIso() });
    setForm(emptyForm);
    localStorage.removeItem(BILAN_DRAFT_KEY);
    setShowBilanForm(false);
  };

  const dernierPoids = weightHistory.length ? weightHistory[weightHistory.length - 1].poids : null;
  const premierPoids = weightHistory.length ? weightHistory[0].poids : null;
  const delta = dernierPoids != null && premierPoids != null ? dernierPoids - premierPoids : null;
  const fmtKg = (n) => Number(n).toFixed(1).replace(".", ",");
  const nbPhotosMois = PHOTO_CATS.filter((c) => photosActuelles[c.key]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.textOnBgMuted, fontWeight: 600 }}>Suivi · {weightHistory.length} pesée{weightHistory.length > 1 ? "s" : ""}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: C.textOnBg }}>Bilans</div>
      </div>

      {/* Poids actuel + évolution */}
      {dernierPoids != null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 60, fontWeight: 800, color: C.text, lineHeight: 1 }}>{fmtKg(dernierPoids)}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.textMuted }}>kg</span>
          </div>
          {delta != null && weightHistory.length > 1 && (
            <div style={{ background: "rgba(245,184,51,0.2)", border: "1px solid rgba(245,184,51,0.5)", color: "#F8D27A", borderRadius: 12, padding: "7px 12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              {delta <= 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />} {fmtKg(Math.abs(delta))} kg
            </div>
          )}
        </div>
      )}

      {/* Courbe de poids */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>Poids</span>
          {weightHistory.length > 1 && <span style={{ fontSize: 13, fontWeight: 700, color: "#F5C542" }}>Depuis le {weightHistory[0].date}</span>}
        </div>
        <div style={{ height: 190, marginBottom: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightHistory} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4C7DF0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#4C7DF0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wstroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7FA0FF" />
                  <stop offset="100%" stopColor="#F5C542" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textDim }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
              <YAxis orientation="right" domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: C.textDim }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => Math.round(v)} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, fontSize: 13 }} labelStyle={{ color: C.textMuted }} />
              <Area
                type="monotone" dataKey="poids" stroke="url(#wstroke)" strokeWidth={3.5} fill="url(#wgrad)"
                dot={(pr) => (pr.index === weightHistory.length - 1
                  ? <circle key={pr.index} cx={pr.cx} cy={pr.cy} r={7} fill="#FFFFFF" stroke="#F5C542" strokeWidth={4} />
                  : <g key={pr.index} />)}
                activeDot={{ r: 6, fill: "#FFFFFF", stroke: "#4C7DF0", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input type="number" step="0.1" placeholder="Poids de la semaine (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} style={{ flex: 1, border: "1px solid rgba(255,255,255,0.12)", padding: "13px 14px", color: C.text, fontSize: 14.5 }} />
          <button onClick={submitWeight} style={{ background: C.blue, border: "none", borderRadius: 14, padding: "0 20px", color: "#FFFFFF", fontWeight: 700, fontSize: 14.5 }}>
            Ajouter
          </button>
        </div>
      </Card>

      {/* Repères rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 500 }}>Bilans envoyés</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: C.text }}>{checkins.length}</span>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 500 }}>Photos du mois</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: C.text }}>{nbPhotosMois}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.textMuted }}> / {PHOTO_CATS.length}</span>
          </div>
        </div>
      </div>

      {/* Check-in hebdo : carte résumé, le formulaire s'ouvre au clic */}
      {(() => {
        const brouillon = JSON.stringify(form) !== JSON.stringify(emptyForm);
        const dernier = checkins.length ? checkins[checkins.length - 1] : null;
        return (
          <button
            onClick={() => setShowBilanForm(true)}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer", padding: 18, borderRadius: 24,
              background: "linear-gradient(135deg, rgba(76,125,240,0.28), rgba(26,34,74,0.9) 60%)",
              border: "1px solid rgba(76,125,240,0.45)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.4), 0 0 22px rgba(59,111,224,0.2)",
              display: "flex", alignItems: "center", gap: 14, color: C.text,
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 16, background: "rgba(76,125,240,0.25)", border: "1px solid rgba(76,125,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ClipboardList size={24} color="#9DB8FF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Bilan de la semaine</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                {brouillon ? "Brouillon en cours · reprends où tu t'es arrêté" : dernier ? `Dernier envoi : ${dernier.date}` : "Prends 2 minutes pour faire le point"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {["Sensation de force", "Satisfaction", "Sommeil"].map((t) => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "4px 10px" }}>{t}</span>
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F8D27A", background: "rgba(245,184,51,0.16)", borderRadius: 999, padding: "4px 10px" }}>+ 6 questions</span>
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(76,125,240,0.55)" }}>
              <Plus size={22} color="#FFFFFF" strokeWidth={3} />
            </div>
          </button>
        );
      })()}

      {showBilanForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(2,4,14,0.75)", zIndex: 130, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowBilanForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto",
              background: "linear-gradient(180deg, #151D42, #0B1230)", borderRadius: "28px 28px 0 0",
              border: "1px solid rgba(76,125,240,0.35)", borderBottom: "none", padding: "20px 20px 28px",
              boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.text }}>Bilan de la semaine</div>
              <button onClick={() => setShowBilanForm(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>Tes réponses sont enregistrées en brouillon si tu quittes.</div>
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
            <Send size={16} /> Envoyer le bilan de semaine
          </button>
        </div>
          </div>
        </div>
      )}

      {/* Photos */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel icon={Camera}>Bilan photo</SectionLabel>
          {photosHistory.length > 0 && (
            <button onClick={() => setShowPhotoHistory(true)} style={{ background: C.blueSoft, border: `1px solid ${C.blueBorder}`, borderRadius: 999, padding: "6px 14px", color: "#7FA0FF", fontSize: 13, fontWeight: 700 }}>
              Historique
            </button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, color: C.textMuted }}>Ce mois-ci</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{nbPhotosMois} / {PHOTO_CATS.length}</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", width: `${(nbPhotosMois / PHOTO_CATS.length) * 100}%`, borderRadius: 999, background: "linear-gradient(90deg, #4C7DF0, #F5C542)", transition: "width .4s ease" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
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
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 14px" }}>
                <div style={{ fontSize: 14.5, color: C.text, fontWeight: 700, marginBottom: 8 }}>{c.date}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    [`Force ${c.sensationForce}/5`, "#7FA0FF"],
                    [`Satisfaction ${c.satisfaction}/5`, "#F5C542"],
                    [`Sommeil ${c.heuresSommeil || "—"} h`, "#B9C4E0"],
                    [`Écarts ${c.ecartsNutrition > 0 ? (c.ecartsNutrition === 3 ? "3+" : c.ecartsNutrition) : "0"}`, "#F28C38"],
                  ].map(([txt, col]) => (
                    <span key={txt} style={{ fontSize: 12.5, fontWeight: 600, color: col, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "4px 10px" }}>{txt}</span>
                  ))}
                </div>
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
      <button onClick={submit} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5 }}>
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
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 0, textTransform: "none", textAlign: "left" }}>{label}</div>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,150,255,0.35)",
  borderRadius: 14, padding: "12px 14px", color: C.text, fontSize: 15, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
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
      <Card style={{ border: "1.5px solid rgba(140,190,255,0.9)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 22px rgba(120,170,255,0.55), 0 0 6px rgba(160,205,255,0.7), 0 10px 28px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
          <button
            onClick={() => photoFileRef.current && photoFileRef.current.click()}
            style={{
              width: 78, height: 78, borderRadius: "50%",
              background: user.photoUrl ? `url(${user.photoUrl}) center/cover` : "linear-gradient(135deg, #4C7DF0, #2B3F8F)",
              border: "2px solid #8CBEFF", boxShadow: "0 0 18px rgba(140,190,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, position: "relative",
            }}
          >
            {!user.photoUrl && <User size={32} color="#fff" />}
            <span style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", border: "2px solid #080B1A", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={13} color="#fff" /></span>
          </button>
          <input ref={photoFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f && onChangePhoto) onChangePhoto(f); }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{user.age} ans · {user.taille} cm</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, fontWeight: 700, color: "#8CBEFF", background: "rgba(140,190,255,0.12)", border: "1px solid rgba(140,190,255,0.4)", borderRadius: 999, padding: "3px 10px" }}><Target size={12} /> {user.objectifPrincipal}</div>
          </div>
        </div>
      </Card>

      {notificationsRecues && notificationsRecues.length > 0 && (
        <Card>
          <SectionHead icon={Bell} title={<>Notifications</>} />
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
          <SectionHead icon={FileText} title={<>Documents de ton coach</>} />
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
        <SectionHead icon={User} title={<>Informations personnelles</>} />
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
        <SectionHead icon={Target} title={<>Objectifs</>} />
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
          <SectionHead icon={Bell} title="Notifications push" />
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
                style={{ width: "100%", background: "rgba(59,111,224,0.15)", border: "1px solid rgba(110,150,255,0.6)", color: "#B9D0FF", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14, boxShadow: "0 0 16px rgba(76,125,240,0.35)" }}
              >
                Activer les notifications
              </button>
            </>
          )}
        </Card>
      )}

      <button onClick={onSave} style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14 }}>
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
        <button onClick={onClose} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>
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
        <button onClick={onClose} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14, marginTop: 18 }}>
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
  background: `radial-gradient(circle at 50% 0%, ${C.bgGradA} 0%, ${C.bgGradB} 60%)`,
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
        background: "rgba(240,84,110,0.12)",
        border: "1px solid rgba(240,84,110,0.45)",
        color: "#FF8FA0",
        borderRadius: 16,
        padding: "12px 16px",
        width: "100%",
        justifyContent: "center",
        fontSize: 14.5,
        fontWeight: 700,
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
          width: 44, height: 44, borderRadius: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,150,255,0.5)",
          boxShadow: "0 0 14px rgba(76,125,240,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Menu size={19} color={C.text} />
      </button>

      {open && (() => {
        const go = (tab) => { setCoachTab(tab); setOpen(false); };
        const NavItem = ({ tab, icon: Icon, label, badge, onClick, actif, chevron, chevronOpen }) => {
          const on = actif !== undefined ? actif : coachTab === tab;
          return (
            <button
              onClick={onClick || (() => go(tab))}
              style={{
                position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 16, width: "100%", textAlign: "left",
                background: on ? "linear-gradient(90deg, rgba(76,125,240,0.32), rgba(76,125,240,0.08))" : "transparent",
                border: on ? "1px solid rgba(110,150,255,0.55)" : "1px solid transparent",
                boxShadow: on ? "0 0 18px rgba(76,125,240,0.35)" : "none",
                color: on ? "#FFFFFF" : C.textMuted, fontWeight: 700, fontSize: 15,
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: on ? "#4C7DF0" : "rgba(255,255,255,0.06)", boxShadow: on ? "0 4px 12px rgba(76,125,240,0.55)" : "none" }}>
                <Icon size={17} color={on ? "#FFFFFF" : "#9DB8FF"} />
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge > 0 && <span style={{ background: C.red, color: "#FFFFFF", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "2px 8px", boxShadow: "0 0 10px rgba(240,84,110,0.6)" }}>{badge}</span>}
              {chevron && <ChevronDown size={16} style={{ transform: chevronOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
            </button>
          );
        };
        const SubItem = ({ tab, icon: Icon, label }) => {
          const on = coachTab === tab;
          return (
            <button onClick={() => go(tab)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 13, textAlign: "left", background: on ? "rgba(76,125,240,0.25)" : "transparent", border: on ? "1px solid rgba(110,150,255,0.5)" : "1px solid transparent", color: on ? "#FFFFFF" : C.textMuted, fontWeight: 600, fontSize: 14 }}>
              <Icon size={15} color={on ? "#FFFFFF" : "#9DB8FF"} /> {label}
            </button>
          );
        };
        const subWrap = { display: "flex", flexDirection: "column", gap: 4, paddingLeft: 12, borderLeft: "2px solid rgba(110,150,255,0.3)", marginLeft: 22, marginTop: 2, marginBottom: 4 };
        const titreSection = { fontSize: 12.5, color: C.textDim, fontWeight: 700, marginBottom: 10, paddingLeft: 4 };
        return (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex" }}>
          <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(2,4,14,0.7)", backdropFilter: "blur(3px)" }} />
          <div
            style={{
              position: "relative", width: 292, maxWidth: "84%", height: "100%",
              background: "linear-gradient(180deg, #151D42 0%, #0B1230 100%)",
              borderRight: "1px solid rgba(110,150,255,0.5)",
              boxShadow: "6px 0 40px rgba(0,0,0,0.6), 0 0 26px rgba(76,125,240,0.25)",
              padding: "26px 16px 22px", display: "flex", flexDirection: "column", gap: 22,
              animation: "slideInLeft .25s ease", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 4 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.text }}>Menu</div>
              <button onClick={() => setOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
                <X size={18} />
              </button>
            </div>

            {showViewToggle && (
              <div>
                <div style={titreSection}>Affichage</div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,150,255,0.3)", borderRadius: 18, padding: "12px 14px" }}>
                  <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
              </div>
            )}

            {viewMode === "coach" && coachTab && setCoachTab && (
              <div>
                <div style={titreSection}>Navigation</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <NavItem tab="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
                  <NavItem tab="clients" icon={User} label="Clients" />
                  <NavItem tab="taches" icon={ClipboardList} label="Tâches" badge={tachesEnAttenteCount} />
                  <NavItem tab="programmes" icon={Dumbbell} label="Programmes" />
                  <NavItem icon={Apple} label="Alimentation" chevron chevronOpen={alimentationOuvert} onClick={() => setAlimentationOuvert(!alimentationOuvert)} actif={["alimentation-recettes", "alimentation-courses", "alimentation-supplements"].includes(coachTab)} />
                  {alimentationOuvert && (
                    <div style={subWrap}>
                      <SubItem tab="alimentation-recettes" icon={ClipboardList} label="Recettes" />
                      <SubItem tab="alimentation-courses" icon={ShoppingCart} label="Liste de courses" />
                      <SubItem tab="alimentation-supplements" icon={Pill} label="Suppléments" />
                    </div>
                  )}
                  <NavItem icon={Wrench} label="Outils" chevron chevronOpen={outilsOuvert} onClick={() => setOutilsOuvert(!outilsOuvert)} actif={["outils-drive", "outils-automatisation"].includes(coachTab)} />
                  {outilsOuvert && (
                    <div style={subWrap}>
                      <SubItem tab="outils-drive" icon={FileText} label="Drive" />
                      <SubItem tab="outils-automatisation" icon={Zap} label="Automatisation" />
                    </div>
                  )}
                  <NavItem tab="vod" icon={VideoIcon} label="VOD" />
                  <NavItem tab="notifications" icon={Bell} label="Notifications" />
                </div>
              </div>
            )}

            <div style={{ marginTop: "auto" }}>
              <LogoutButton onLogout={onLogout} />
            </div>
          </div>
        </div>
        );
      })()}
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
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) fireToast(error.message);
  };

  const loginInput = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,150,255,0.4)", borderRadius: 14, padding: "14px 16px", color: C.text, fontSize: 15 };
  const loginLabel = { fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textMuted, marginBottom: 6, fontWeight: 700, textAlign: "left" };

  return (
    <div style={{ ...appShellStyle, background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,111,224,0.35) 0%, rgba(8,11,26,0) 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,184,51,0.12) 0%, rgba(8,11,26,0) 70%), ${C.bg}` }}>
      <FontImports />
      <div style={{ width: "100%", maxWidth: 420, padding: "40px 20px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          <img src="/cowave-icon-transparent.png" alt="CoWave" style={{ width: 170, height: "auto", filter: "drop-shadow(0 0 24px rgba(76,125,240,0.6))" }} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 34, textAlign: "center", background: "linear-gradient(135deg,#FFFFFF,#9DB8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
          CoWave
        </div>
        <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4, marginBottom: 22, textAlign: "center" }}>Ton coaching, au même endroit</div>
        <Card style={{ padding: 22, border: "1.5px solid rgba(140,190,255,0.9)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 30px rgba(120,170,255,0.5), 0 0 8px rgba(160,205,255,0.6), 0 14px 36px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4, textAlign: "left" }}>Connexion</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 18, textAlign: "left" }}>Connecte-toi pour continuer</div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={loginLabel}>Email</div>
              <input type="email" required autoComplete="email" placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} style={loginInput} />
            </div>
            <div>
              <div style={loginLabel}>Mot de passe</div>
              <div style={{ position: "relative" }}>
                <input type={showPwd ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...loginInput, paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: C.textMuted, padding: 6, display: "flex" }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ marginTop: 6, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 6px 22px rgba(59,111,224,0.55)", border: "none", color: "#FFFFFF", borderRadius: 14, padding: "15px", fontWeight: 800, fontSize: 15, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </Card>
        <div style={{ fontSize: 13, color: "rgba(185,196,224,0.75)", fontStyle: "italic", textAlign: "center", marginTop: 22, padding: "0 16px" }}>
          « Chaque séance te rapproche de la meilleure version de toi-même. »
        </div>
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
    <Card style={{ marginBottom: 14, border: "1.5px solid rgba(140,190,255,0.9)", boxShadow: "0 0 22px rgba(120,170,255,0.5), 0 10px 28px rgba(0,0,0,0.45)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}><SectionHead icon={Plus} title={<>Nouveau client</>} /></div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: C.textMuted, borderRadius: 12, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
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
        <button type="submit" disabled={submitting} style={{ background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13.5, opacity: submitting ? 0.6 : 1 }}>
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

  const degrouperSuperset = (groupeId) => {
    setExercices((prev) => prev.map((ex) => (ex.groupeSuperset === groupeId ? { ...ex, groupeSuperset: null } : ex)));
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
      objectifRepsRangeParSerie: ex.objectifRepsRangeParSerie || (ex.objectif_reps_range_par_serie ? JSON.parse(ex.objectif_reps_range_par_serie) : []),
    }));
  });
  const [exNom, setExNom] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exRest, setExRest] = useState(90);
  const [saving, setSaving] = useState(false);
  const [exRepsParSerie, setExRepsParSerie] = useState([10, 10, 10]);
  const [exType, setExType] = useState("muscu");
  const [exEchauffement, setExEchauffement] = useState(0);
  const [showRpePickerNew, setShowRpePickerNew] = useState(false);
  const [showTempoPickerNew, setShowTempoPickerNew] = useState(false);
  const [showRepoPickerNew, setShowRepoPickerNew] = useState(false);
  const [showRepoPickerIdx, setShowRepoPickerIdx] = useState(null);
  const [showRpePickerIdx, setShowRpePickerIdx] = useState(null);
  const [showTempoPickerIdx, setShowTempoPickerIdx] = useState(null);
  const [showRangePickerSi, setShowRangePickerSi] = useState(null);
  const [showEchauffementPicker, setShowEchauffementPicker] = useState(false);
  const [showExercicePickerPage, setShowExercicePickerPage] = useState(false);
  const [exDureeMinutes, setExDureeMinutes] = useState(15);
  const [exObjectifRepsRangeParSerie, setExObjectifRepsRangeParSerie] = useState([null, null, null]);
  const [showRangePickerSiNew, setShowRangePickerSiNew] = useState(null);

  useEffect(() => {
    setExRepsParSerie((prev) => {
      const arr = [...prev];
      while (arr.length < exSets) arr.push(10);
      while (arr.length > exSets) arr.pop();
      return arr;
    });
    setExObjectifRepsRangeParSerie((prev) => {
      const arr = [...prev];
      while (arr.length < exSets) arr.push(null);
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
  const [newExVideoUrl, setNewExVideoUrl] = useState("");
  const [selectedExId, setSelectedExId] = useState("");
  const [showAjoutExercice, setShowAjoutExercice] = useState(false);

  useEffect(() => {
    if (!coachId) return;
    supabase.from("exercices_bibliotheque").select("*").eq("coach_id", coachId).order("nom").then(({ data }) => setBibliotheque(data || []));
  }, [coachId]);

  const createExercice = async () => {
    if (!newExNom.trim()) return;
    if (newExVideoUrl.trim() && !getYouTubeEmbedId(newExVideoUrl.trim())) {
      fireToast("Lien YouTube non reconnu — colle un lien du type youtube.com/watch?v=... ou youtu.be/...");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("exercices_bibliotheque")
        .insert({ coach_id: coachId, nom: newExNom, video_demo_url: newExVideoUrl.trim() || null })
        .select()
        .single();
      if (error) throw error;
      setBibliotheque((prev) => [...prev, data]);
      setSelectedExId(data.id);
      setNewExNom("");
      setNewExVideoUrl("");
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
      objectifRepsMax: null,
      objectifRepsRangeParSerie: exType === "cardio" ? [] : exObjectifRepsRangeParSerie,
    }]);
    setSelectedExId("");
    setExSets(3);
    setExRepsParSerie([10, 10, 10]);
    setExObjectifRepsRangeParSerie([null, null, null]);
    setExRest(90);
    setExTempo("");
    setExRpe("");
    setExNote("");
    setExType("muscu");
    setExDureeMinutes(15);
    setExEchauffement(0);
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
          objectifRepsRangeParSerie: ex.objectifRepsRangeParSerie || null,
        }));
        if (editingProgramme?.id) {
          const { error } = await supabase.from("programmes_modeles").update({ nom, muscle, exercices: exercicesJson, jour_fixe: modeleJourFixe || null, echauffement_general: echauffementGeneral || null, updated_at: new Date().toISOString() }).eq("id", editingProgramme.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("programmes_modeles").insert({ coach_id: coachId, nom, muscle, exercices: exercicesJson, modele_semaine_id: modeleSemaineId || null, jour_fixe: modeleJourFixe || null, echauffement_general: echauffementGeneral || null });
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
          .update({ nom, muscle, jour_fixe: jourFixe || null, echauffement_general: echauffementGeneral || null, updated_at: new Date().toISOString() })
          .eq("id", editingProgramme.id);
        if (updateErr) throw updateErr;
        progId = editingProgramme.id;

        // On ne touche que ce qui a vraiment changé : les exercices déjà existants (avec un id réel)
        // sont mis à jour EN PLACE (leur id ne change pas, donc leur historique reste intact) ;
        // seuls les nouveaux exercices sont insérés, et ceux retirés sont supprimés.
        const exercicesExistants = exercices.filter((ex) => ex.id && typeof ex.id !== "number");
        const exercicesNouveaux = exercices.filter((ex) => !ex.id || typeof ex.id === "number");
        const idsConserves = exercicesExistants.map((ex) => ex.id);

        if (idsConserves.length > 0) {
          await supabase.from("programme_exercices").delete().eq("programme_id", progId).not("id", "in", `(${idsConserves.join(",")})`);
        } else {
          await supabase.from("programme_exercices").delete().eq("programme_id", progId);
        }

        for (const ex of exercicesExistants) {
          const { error: updExErr } = await supabase
            .from("programme_exercices")
            .update({
              nom: ex.nom, sets: ex.sets, reps_par_serie: JSON.stringify(ex.repsParSerie), rest: ex.rest,
              tempo: ex.tempo, rpe: ex.rpe || null, note: ex.note, video_demo_url: ex.videoDemoUrl,
              ordre: ex.ordre, groupe_superset: ex.groupeSuperset || null, type_exercice: ex.type || "muscu",
              duree_minutes: ex.dureeMinutes || null, series_echauffement: ex.echauffement || 0,
              objectif_reps_max: ex.objectifRepsMax || null,
              objectif_reps_range_par_serie: JSON.stringify(ex.objectifRepsRangeParSerie || null),
            })
            .eq("id", ex.id);
          if (updExErr) throw updExErr;
        }

        if (exercicesNouveaux.length > 0) {
          const nouvellesRows = exercicesNouveaux.map((ex) => ({
            programme_id: progId, nom: ex.nom, sets: ex.sets, reps_par_serie: JSON.stringify(ex.repsParSerie),
            rest: ex.rest, tempo: ex.tempo, rpe: ex.rpe || null, note: ex.note, video_demo_url: ex.videoDemoUrl,
            ordre: ex.ordre, groupe_superset: ex.groupeSuperset || null, type_exercice: ex.type || "muscu",
            duree_minutes: ex.dureeMinutes || null, series_echauffement: ex.echauffement || 0,
            objectif_reps_max: ex.objectifRepsMax || null,
            objectif_reps_range_par_serie: JSON.stringify(ex.objectifRepsRangeParSerie || null),
          }));
          const { error: newExErr } = await supabase.from("programme_exercices").insert(nouvellesRows);
          if (newExErr) throw newExErr;
        }

        fireToast("Séance modifiée", "green");
        onCreated();
        onClose();
        return;
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
        objectif_reps_range_par_serie: JSON.stringify(ex.objectifRepsRangeParSerie || null),
      }));
      const { error: exErr } = await supabase.from("programme_exercices").insert(rows);
      if (exErr) throw exErr;
      fireToast("Séance créée", "green");
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
        <SectionHead icon={Dumbbell} title={<>{estModele ? (editingProgramme?.id ? "Modifier le modèle" : "Nouveau modèle") : (editingProgramme?.id ? "Modifier la séance" : "Nouvelle séance")}</>} />
        <input type="text" placeholder="Nom (ex: Push)" value={nom} onChange={(e) => setNom(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 8 }} />
        <input type="text" placeholder="Muscle ciblé (ex: Pecs / Épaules)" value={muscle} onChange={(e) => setMuscle(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, marginBottom: 16 }} />
        {!estModele && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4, fontWeight: 600, textTransform: "none" }}>Type de programme</div>
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
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4, fontWeight: 600, textTransform: "none" }}>Échauffement général (optionnel)</div>
          {(() => {
            const lignes = echauffementGeneral.split("\n").filter(Boolean);
            const presetsActifs = ECHAUFFEMENT_PRESETS.filter((p) => lignes.includes(p.texte));
            return (
              <button
                type="button"
                onClick={() => setShowEchauffementPicker(true)}
                style={{
                  width: "100%", textAlign: "left", background: presetsActifs.length ? C.blueSoft : C.surface,
                  border: `1px solid ${presetsActifs.length ? C.blue : C.cardBorderLight}`, borderRadius: 10,
                  padding: "9px 10px", color: presetsActifs.length ? C.blue : C.textDim, fontSize: 13, fontWeight: presetsActifs.length ? 700 : 400,
                  marginBottom: 8,
                }}
              >
                {presetsActifs.length === 0 ? "Choisir un type d'échauffement..." : presetsActifs.map((p) => p.label).join(" · ")}
              </button>
            );
          })()}
          <textarea
            value={echauffementGeneral}
            onChange={(e) => setEchauffementGeneral(e.target.value)}
            placeholder="ex : 5 min de vélo + rotations articulaires (épaules, hanches, chevilles) — ou choisis un type ci-dessus"
            rows={2}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13, resize: "none" }}
          />
        </div>
        {showEchauffementPicker && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowEchauffementPicker(false)}>
            <Card style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionHead icon={Flame} title={<>Type d'échauffement</>} />
                <button onClick={() => setShowEchauffementPicker(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ECHAUFFEMENT_PRESETS.map((preset) => {
                  const lignes = echauffementGeneral.split("\n").filter(Boolean);
                  const actif = lignes.includes(preset.texte);
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      title={preset.description}
                      onClick={() => {
                        const next = actif ? lignes.filter((l) => l !== preset.texte) : [...lignes, preset.texte];
                        setEchauffementGeneral(next.join("\n"));
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                        border: `1px solid ${actif ? C.blue : C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px",
                        background: actif ? C.blueSoft : "transparent", color: actif ? C.blue : C.textMuted,
                        fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {actif ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${C.cardBorderLight}`, flexShrink: 0 }} />}
                      <div>
                        <div>{preset.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 400, color: C.textDim, marginTop: 1 }}>{preset.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowEchauffementPicker(false)} style={{ width: "100%", marginTop: 14, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 10, padding: "11px", fontWeight: 800, fontSize: 13 }}>
                Terminé
              </button>
            </Card>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionHead icon={Plus} title={<>Exercices</>} />
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
                  : "2px solid rgba(255,180,60,0.85)",
              boxShadow: (!ex.groupeSuperset && !(dragOverIdx === i && draggedIdx !== i))
                ? "0 0 18px rgba(255,180,60,0.5), 0 0 8px rgba(255,210,80,0.6)"
                : undefined,
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={13} color={C.blue} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, textTransform: "none", letterSpacing: 0 }}>Superset</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); degrouperSuperset(ex.groupeSuperset); }}
                  style={{ background: "transparent", border: "none", color: C.blue, fontSize: 10.5, fontWeight: 700, padding: 0, textDecoration: "underline" }}
                >
                  Dégrouper
                </button>
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
        {showRangePickerSi !== null && expandedIdx !== null && exercices[expandedIdx] && (
          <RepRangePickerModal
            titre={`Série ${showRangePickerSi + 1} — fourchette de reps`}
            value={(exercices[expandedIdx].objectifRepsRangeParSerie || [])[showRangePickerSi] || null}
            onSelect={(r) => {
              const arr = [...(exercices[expandedIdx].objectifRepsRangeParSerie || [])];
              while (arr.length < exercices[expandedIdx].sets) arr.push(null);
              arr[showRangePickerSi] = r;
              updateExercice(expandedIdx, "objectifRepsRangeParSerie", arr);
            }}
            onClose={() => setShowRangePickerSi(null)}
          />
        )}
        {expandedIdx !== null && exercices[expandedIdx] && (() => {
          const ex = exercices[expandedIdx];
          const i = expandedIdx;
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setExpandedIdx(null)}>
              <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionHead icon={Dumbbell} title={<>{ex.nom}</>} />
                  <button onClick={() => setExpandedIdx(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={20} /></button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Séries</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <button onClick={() => {
                    const n = Math.max(1, ex.sets - 1);
                    const arr = [...(ex.repsParSerie || [])];
                    while (arr.length > n) arr.pop();
                    const rangeArr = Array.from({ length: n }, () => (ex.objectifRepsRangeParSerie || [])[0] || null);
                    updateExercice(i, "sets", n);
                    updateExercice(i, "repsParSerie", arr);
                    updateExercice(i, "objectifRepsRangeParSerie", rangeArr);
                  }} style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, color: C.text, fontSize: 18, fontWeight: 700 }}>−</button>
                  <div style={{ flex: 1, textAlign: "center", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 0", color: C.text, fontSize: 15, fontWeight: 700 }}>{ex.sets}</div>
                  <button onClick={() => {
                    const n = ex.sets + 1;
                    const arr = [...(ex.repsParSerie || [])];
                    while (arr.length < n) arr.push(10);
                    const rangeArr = Array.from({ length: n }, () => (ex.objectifRepsRangeParSerie || [])[0] || null);
                    updateExercice(i, "sets", n);
                    updateExercice(i, "repsParSerie", arr);
                    updateExercice(i, "objectifRepsRangeParSerie", rangeArr);
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
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                  🎯 Répétitions par série <span style={{ color: C.textDim }}>(atteindre le haut de la fourchette suggère d'augmenter la charge)</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {Array.from({ length: ex.sets }).map((_, si) => {
                    const range = (ex.objectifRepsRangeParSerie || [])[si] || null;
                    return (
                      <div key={si} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.textDim, marginBottom: 3, fontWeight: 700 }}>S{si + 1}</div>
                        <button
                          type="button"
                          onClick={() => setShowRangePickerSi(si)}
                          style={{
                            width: 56, background: range ? C.blueSoft : C.surface, border: `1px solid ${range ? C.blue : C.cardBorderLight}`,
                            borderRadius: 8, padding: "8px 4px", color: range ? C.blue : C.textDim, fontSize: 12.5, fontWeight: 700, fontFamily: FONT_MONO,
                          }}
                        >
                          {range ? `${range.min}-${range.max}` : "—"}
                        </button>
                      </div>
                    );
                  })}
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
                <button onClick={() => setExpandedIdx(null)} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 14 }}>
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
                <SectionHead icon={Plus} title={<>Nouvel exercice</>} />
                <button onClick={() => setShowAjoutExercice(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
              </div>

              {showNewExercice ? (
                <div style={{ background: C.surface, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <input type="text" placeholder="Nom du nouvel exercice" value={newExNom} onChange={(e) => setNewExNom(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 6 }} />
                  <input
                    type="text"
                    placeholder="Lien YouTube non répertorié (optionnel)"
                    value={newExVideoUrl}
                    onChange={(e) => setNewExVideoUrl(e.target.value)}
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowNewExercice(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 8, padding: "8px", fontSize: 12 }}>Annuler</button>
                    <button onClick={createExercice} style={{ flex: 1, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700 }}>Ajouter</button>
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
                    <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>Durée (minutes)</div>
                    <input type="number" value={exDureeMinutes} onChange={(e) => setExDureeMinutes(parseInt(e.target.value) || 15)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>Repos après</div>
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
                  <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>
                    🎯 RÉPÉTITIONS PAR SÉRIE <span style={{ color: C.textDim, fontWeight: 400, textTransform: "none" }}>(choisis une fourchette pour activer l'objectif de progression — laisse vide sinon)</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {exObjectifRepsRangeParSerie.map((range, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.textDim, marginBottom: 3, fontWeight: 700 }}>S{i + 1}</div>
                        <button
                          type="button"
                          onClick={() => setShowRangePickerSiNew(i)}
                          style={{
                            width: 56, background: range ? C.blueSoft : C.surface, border: `1px solid ${range ? C.blue : C.cardBorderLight}`,
                            borderRadius: 8, padding: "8px 4px", color: range ? C.blue : C.textDim, fontSize: 12.5, fontWeight: 700, fontFamily: FONT_MONO,
                          }}
                        >
                          {range ? `${range.min}-${range.max}` : "—"}
                        </button>
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
        {showRangePickerSiNew !== null && (
          <RepRangePickerModal
            titre={`Série ${showRangePickerSiNew + 1} — fourchette de reps`}
            value={exObjectifRepsRangeParSerie[showRangePickerSiNew] || null}
            onSelect={(r) => setExObjectifRepsRangeParSerie((prev) => prev.map((x, idx) => (idx === showRangePickerSiNew ? r : x)))}
            onClose={() => setShowRangePickerSiNew(null)}
          />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14 }}>Annuler</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>{saving ? "..." : editingProgramme?.id ? "Enregistrer" : "Créer"}</button>
        </div>
      </Card>
    </div>
  );
}

const TrophyIcon = ({ color, size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="trophyBody" x1="14" y1="8" x2="50" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.35" stopColor={color} />
        <stop offset="1" stopColor={color} />
      </linearGradient>
      <linearGradient id="trophyShade" x1="0" y1="8" x2="0" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    <path d="M19 15 H10 C10 25 13.5 30.5 21.5 32.5" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M45 15 H54 C54 25 50.5 30.5 42.5 32.5" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8 H47 V26 C47 35.5 40.5 41.5 32 41.5 C23.5 41.5 17 35.5 17 26 Z" fill="url(#trophyBody)" />
    <path d="M17 8 H47 V26 C47 35.5 40.5 41.5 32 41.5 C23.5 41.5 17 35.5 17 26 Z" fill="url(#trophyShade)" />
    <path d="M22 12 V26 C22 31 24.5 35 28 37" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M32 15.5 L34.6 21 L40.5 21.7 L36.2 25.7 L37.4 31.5 L32 28.6 L26.6 31.5 L27.8 25.7 L23.5 21.7 L29.4 21 Z" fill="#FFFFFF" fillOpacity="0.92" />
    <rect x="28.5" y="41" width="7" height="8" rx="1.5" fill={color} />
    <rect x="28.5" y="41" width="7" height="8" rx="1.5" fill="url(#trophyShade)" />
    <rect x="20" y="49" width="24" height="7.5" rx="3" fill="url(#trophyBody)" />
    <rect x="20" y="49" width="24" height="7.5" rx="3" fill="url(#trophyShade)" />
  </svg>
);

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
    <span style={{ fontSize: 11, color: C.textOnBg, fontWeight: 700 }}>{label}</span>
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
        <div style={{ fontWeight: 800, fontSize: 18, color: C.text, textTransform: "capitalize" }}>
          {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </div>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[[C.blue, "Séances"], [C.red, "Poids"], [C.green, "Bilan"], [C.amber, "Nutrition"]].map(([col, lab]) => (
          <span key={lab} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.text, background: "rgba(255,255,255,0.06)", border: `1px solid ${col}55`, borderRadius: 999, padding: "4px 10px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}` }} />{lab}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 12, color: C.textDim, fontWeight: 700, paddingBottom: 4 }}>{d}</div>
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
              style={{ height: 46, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 14, background: (hasS || hasP || hasB || hasN) ? "rgba(76,125,240,0.16)" : "transparent", border: iso === todayIso() ? "1.5px solid #F5C542" : ((hasS || hasP || hasB || hasN) ? "1px solid rgba(110,150,255,0.35)" : "1px solid transparent"), boxShadow: iso === todayIso() ? "0 0 12px rgba(245,197,66,0.45)" : "none" }}
            >
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{d}</div>
              <div style={{ display: "flex", gap: 3, marginTop: 3, minHeight: 6 }}>
                {hasS && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, boxShadow: `0 0 6px ${C.blue}` }} />}
                {hasP && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, boxShadow: `0 0 6px ${C.red}` }} />}
                {hasB && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />}
                {hasN && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber, boxShadow: `0 0 6px ${C.amber}` }} />}
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
      <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 16, textAlign: "left" }}>
        Gérez vos tâches quotidiennes et suivez leur avancement.
      </div>
      <button
        onClick={openNew}
        style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)" }}
      >
        <Plus size={20} strokeWidth={3} /> Créer une tâche
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
            <Card key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, ...(t.statut === "termine" ? { border: "1.5px solid rgba(58,214,160,0.6)", boxShadow: "0 0 18px rgba(58,214,160,0.3), 0 10px 28px rgba(0,0,0,0.4)" } : {}) }}>
              <button
                onClick={() => toggleStatut(t)}
                style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${t.statut === "termine" ? C.green : C.cardBorderLight}`, background: t.statut === "termine" ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {t.statut === "termine" && <Check size={13} color="#FFFFFF" />}
              </button>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => openEdit(t)}>
                <div style={{ fontSize: 16, color: t.statut === "termine" ? C.textMuted : C.text, fontWeight: 700, textAlign: "left", textDecoration: t.statut === "termine" ? "line-through" : "none" }}>{t.titre}</div>
                {t.date_echeance && <span style={{ display: "inline-block", fontSize: 12.5, color: "#F5C542", fontWeight: 700, background: "rgba(245,197,66,0.14)", borderRadius: 999, padding: "3px 10px", marginTop: 6 }}>{formatDateDisplay(t.date_echeance)}</span>}
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
            <SectionHead icon={ClipboardList} title={<>{editingTache ? "Modifier la tâche" : "Nouvelle tâche"}</>} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 5, fontWeight: 600, textTransform: "none" }}>Titre</div>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="ex : Préparer le programme d'Oscar" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 5, fontWeight: 600, textTransform: "none" }}>Date d'échéance</div>
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
          .insert({ profil_id: clientId, nom: s.nom, muscle: s.muscle, jour_fixe: s.jour_fixe || null, echauffement_general: s.echauffement_general || null })
          .select()
          .single();
        if (progErr) throw progErr;
        const exercicesRows = (s.exercices || []).map((ex, i) => ({
          programme_id: prog.id, nom: ex.nom, sets: ex.sets, reps_par_serie: JSON.stringify(ex.repsParSerie || []),
          rest: ex.rest, tempo: ex.tempo, rpe: ex.rpe || null, note: ex.note, video_demo_url: ex.videoDemoUrl,
          ordre: ex.ordre ?? i, groupe_superset: ex.groupeSuperset || null,
          type_exercice: ex.type || "muscu", duree_minutes: ex.dureeMinutes || null,
          series_echauffement: ex.echauffement || 0, objectif_reps_max: ex.objectifRepsMax || null,
          objectif_reps_range_par_serie: JSON.stringify(ex.objectifRepsRangeParSerie || null),
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
      fireToast("Erreur assignation semaine type : " + (err.message || err.code || "inconnue"));
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
        <button onClick={() => { setFormMode(null); setEditingModele(null); }} style={{ background: "transparent", border: "none", color: C.textOnBgMuted, fontSize: 13.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionHead icon={User} title={<>Assigner « {editingModele.nom} » à...</>} />
        {clients.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun client pour le moment</div></Card>
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
        <button onClick={() => setFormMode(null)} style={{ background: "transparent", border: "none", color: C.textOnBgMuted, fontSize: 13.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionHead icon={Calendar} title="Nouvelle semaine type" />
        <div style={{ fontSize: 13.5, color: C.textOnBgMuted, marginBottom: 12 }}>
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
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14.5, resize: "none", marginBottom: 14 }}
        />
        <button onClick={creerSemaine} disabled={savingSemaine || !nomSemaine.trim()} style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", opacity: savingSemaine || !nomSemaine.trim() ? 0.6 : 1 }}>
          {savingSemaine ? "Création..." : "Créer et ajouter les séances"}
        </button>
      </div>
    );
  }

  if (formMode === "detailSemaine" && selectedSemaine) {
    const seances7 = modelesDeSemaine(selectedSemaine.id);
    return (
      <div>
        <button onClick={() => { setFormMode(null); setSelectedSemaine(null); }} style={{ background: "transparent", border: "none", color: C.textOnBgMuted, fontSize: 13.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <SectionLabel onBg icon={Calendar}>{selectedSemaine.nom}</SectionLabel>
          <button onClick={() => supprimerSemaine(selectedSemaine.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={16} /></button>
        </div>
        {selectedSemaine.description && <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>{selectedSemaine.description}</div>}
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, textTransform: "capitalize", letterSpacing: 0, marginBottom: 2 }}>{jour}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: seance ? C.text : C.textDim }}>{seance ? seance.nom : "Repos — appuyer pour créer"}</div>
                  {seance && (
                    <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>
                      {(seance.exercices || []).length} exercices · {(seance.exercices || []).reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0)} séries
                    </div>
                  )}
                </div>
                <ChevronRight size={16} color={C.textMuted} />
              </Card>
            );
          })}
        </div>
        <button
          onClick={() => setFormMode("pickClientSemaine")}
          disabled={seances7.length === 0}
          style={{ width: "100%", background: seances7.length === 0 ? C.surface : C.blue, border: "none", color: seances7.length === 0 ? C.textDim : "#FFFFFF", borderRadius: 12, padding: "13px", fontWeight: 800, fontSize: 14 }}
        >
          Assigner cette semaine type à un client
        </button>
      </div>
    );
  }

  if (formMode === "pickClientSemaine" && selectedSemaine) {
    return (
      <div>
        <button onClick={() => setFormMode("detailSemaine")} style={{ background: "transparent", border: "none", color: C.textOnBgMuted, fontSize: 13.5, display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>
        <SectionHead icon={User} title={<>Assigner « {selectedSemaine.nom} » à...</>} />
        <div style={{ fontSize: 13, color: C.textOnBgMuted, marginBottom: 12 }}>
          Toutes les séances de cette semaine type seront ajoutées au programme du client, avec leurs jours fixes.
        </div>
        {clients.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun client pour le moment</div></Card>
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
            style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
          >
            <Plus size={18} /> Créer un modèle
          </button>
          {loading ? (
            <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 30 }}>Chargement...</div>
          ) : modelesSansSemaine.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun modèle individuel pour le moment</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modelesSansSemaine.map((m) => (
                <Card key={m.id} style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, textAlign: "left" }}>
                    <IconBadge icon={Dumbbell} color="#7FA0FF" size={46} iconSize={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 19, color: C.text }}>{m.nom}</div>
                      {m.muscle && <div style={{ fontSize: 13.5, color: C.textMuted, marginTop: 1 }}>{m.muscle}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 10px" }}>{(m.exercices || []).length} exercices</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 10px" }}>{(m.exercices || []).reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0)} séries</span>
                    {m.updated_at && <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textDim, padding: "3px 4px" }}>Modifié le {formatDateDisplay(m.updated_at)}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingModele(m); setFormMode("modele"); }} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 14, padding: "11px 0", color: C.text, fontSize: 14, fontWeight: 600 }}>Modifier</button>
                    <button onClick={() => { setEditingModele(m); setFormMode("pickClient"); }} style={{ flex: 1, background: C.blueSoft, border: "none", borderRadius: 14, padding: "11px 0", color: C.blue, fontSize: 14, fontWeight: 700 }}>Assigner</button>
                    <button onClick={() => remove(m.id)} style={{ background: "transparent", border: "none", color: C.red, padding: "0 8px" }}><Trash2 size={16} /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: C.textOnBgMuted, marginBottom: 12 }}>
            Regroupe plusieurs séances sur 7 jours (ex: "Programme épaule faible") pour les assigner d'un coup à un client.
          </div>
          <button
            onClick={() => setFormMode("nouvelleSemaine")}
            style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}
          >
            <Plus size={18} /> Créer une semaine type
          </button>
          {loading ? (
            <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 30 }}>Chargement...</div>
          ) : semaines.length === 0 ? (
            <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucune semaine type pour le moment</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {semaines.map((s) => {
                const nbSeances = modelesDeSemaine(s.id).length;
                return (
                  <Card key={s.id} onClick={() => { setSelectedSemaine(s); setFormMode("detailSemaine"); }} style={{ cursor: "pointer", padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                    <IconBadge icon={Calendar} color="#F5C542" size={46} iconSize={22} />
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 19, color: C.text }}>{s.nom}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                        {[0,1,2,3,4,5,6].map((i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i < nbSeances ? "linear-gradient(90deg, #4C7DF0, #F5C542)" : "rgba(255,255,255,0.1)" }} />)}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>{nbSeances}/7 jours programmés</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight size={18} color="#9DB8FF" /></div>
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
  const [savingRecette, setSavingRecette] = useState(false);
  const [cibleEnvoiParRecette, setCibleEnvoiParRecette] = useState({}); // { [recetteId]: clientId | "tous" }
  const [envoyingRecetteId, setEnvoyingRecetteId] = useState(null);

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

  // envoyerMaintenant=false : la recette est enregistrée comme brouillon (pas encore
  // visible par un client), pour la préparer à l'avance et l'envoyer plus tard.
  const creerRecette = async (envoyerMaintenant) => {
    if (!nomRecette.trim()) { fireToast("Donne un nom à la recette"); return; }
    setSavingRecette(true);
    try {
      const { error } = await supabase.from("recettes").insert({
        coach_id: coachId,
        client_id: envoyerMaintenant ? cibleActuelle : null,
        nom: nomRecette,
        description: descRecette, ingredients, instructions,
        envoyee: envoyerMaintenant,
      });
      if (error) throw error;
      fireToast(envoyerMaintenant ? "Recette créée et envoyée" : "Recette enregistrée en brouillon", "green");
      setNomRecette(""); setDescRecette(""); setIngredients(""); setInstructions("");
      load();
    } catch (err) {
      console.error(err);
      fireToast("Erreur création recette");
    } finally {
      setSavingRecette(false);
    }
  };

  const envoyerRecette = async (recette) => {
    const cible = cibleEnvoiParRecette[recette.id];
    const clientIdCible = !cible || cible === "tous" ? null : cible;
    setEnvoyingRecetteId(recette.id);
    try {
      const { error } = await supabase.from("recettes").update({ client_id: clientIdCible, envoyee: true }).eq("id", recette.id);
      if (error) throw error;
      fireToast("Recette envoyée", "green");
      setRecettes((prev) => prev.map((r) => (r.id === recette.id ? { ...r, client_id: clientIdCible, envoyee: true } : r)));
    } catch (err) {
      console.error(err);
      fireToast("Erreur envoi recette");
    } finally {
      setEnvoyingRecetteId(null);
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

  // Les recettes créées avant cette fonctionnalité n'ont pas de champ "envoyee" : on les
  // considère comme déjà envoyées (comportement d'avant), seul un brouillon explicite
  // (envoyee === false) va dans le petit dossier "Brouillons".
  const recettesBrouillons = recettes.filter((r) => r.envoyee === false);
  const recettesEnvoyees = recettes.filter((r) => r.envoyee !== false);

  const selecteurClient = (
    <select
      value={targetClientId}
      onChange={(e) => setTargetClientId(e.target.value)}
      style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10 }}
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
        <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>
          Crée des recettes à envoyer à un client précis ou à tous.
        </div>
        <Card style={{ marginBottom: 20 }}>
          <SectionHead icon={ClipboardList} title="Nouvelle recette" />
          {selecteurClient}
          <input type="text" value={nomRecette} onChange={(e) => setNomRecette(e.target.value)} placeholder="Nom de la recette" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 8 }} />
          <textarea value={descRecette} onChange={(e) => setDescRecette(e.target.value)} placeholder="Description (optionnel)" rows={2} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 8, resize: "none" }} />
          <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingrédients (un par ligne)" rows={3} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 8, resize: "none" }} />
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions de préparation" rows={3} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10, resize: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => creerRecette(false)}
              disabled={savingRecette || !nomRecette.trim()}
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.text, borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14.5, opacity: savingRecette || !nomRecette.trim() ? 0.6 : 1 }}
            >
              <Folder size={14} style={{ verticalAlign: -2, marginRight: 5 }} /> Enregistrer en brouillon
            </button>
            <button
              onClick={() => creerRecette(true)}
              disabled={savingRecette || !nomRecette.trim()}
              style={{ flex: 1, background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", opacity: savingRecette || !nomRecette.trim() ? 0.6 : 1 }}
            >
              Créer et envoyer
            </button>
          </div>
        </Card>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
        ) : (
          <>
            <SectionHead icon={Folder} title="Brouillons — à préparer et envoyer plus tard" />
            {recettesBrouillons.length === 0 ? (
              <Card style={{ marginBottom: 20 }}><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun brouillon pour le moment</div></Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {recettesBrouillons.map((r) => (
                  <Card key={r.id} style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.nom}</div>
                      <button onClick={() => supprimerRecette(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                    </div>
                    {r.description && <div style={{ fontSize: 13.5, color: C.textMuted, marginTop: 6, marginBottom: 8 }}>{r.description}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <select
                        value={cibleEnvoiParRecette[r.id] || "tous"}
                        onChange={(e) => setCibleEnvoiParRecette((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px", color: C.text, fontSize: 14 }}
                      >
                        <option value="tous">Tous mes clients</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => envoyerRecette(r)}
                        disabled={envoyingRecetteId === r.id}
                        style={{ background: C.blue, border: "none", color: "#FFFFFF", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 14, opacity: envoyingRecetteId === r.id ? 0.6 : 1 }}
                      >
                        {envoyingRecetteId === r.id ? "Envoi..." : "Envoyer"}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <SectionHead icon={Send} title="Envoyées" />
            {recettesEnvoyees.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucune recette envoyée pour le moment</div></Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recettesEnvoyees.map((r) => (
                  <Card key={r.id} style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.nom}</div>
                        <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>{nomClient(r.client_id)}</div>
                      </div>
                      <button onClick={() => supprimerRecette(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                    </div>
                    {r.description && <div style={{ fontSize: 13.5, color: C.textMuted, marginTop: 6 }}>{r.description}</div>}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </>
    );
  }

  if (section === "courses") {
    return (
      <>
        <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>
          Envoie une liste de courses à un client précis ou à tous. Il la retrouve dans son onglet Nutrition.
        </div>
        <Card style={{ marginBottom: 20 }}>
          <SectionHead icon={ShoppingCart} title="Nouvelle liste de courses" />
          {selecteurClient}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="text" value={nouvelItem} onChange={(e) => setNouvelItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ajouterItemCourse(); }}
              placeholder="Ajouter un article (ex : yaourts nature)"
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5 }}
            />
            <button onClick={ajouterItemCourse} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 10, padding: "8px 12px" }}><Plus size={14} /></button>
          </div>
          {itemsCourse.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {itemsCourse.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 8, padding: "7px 10px" }}>
                  <span style={{ fontSize: 14.5, color: C.text }}>{item}</span>
                  <button onClick={() => retirerItemCourse(i)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={enregistrerListeCourses} style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)" }}>Envoyer la liste</button>
        </Card>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
        ) : listesCourses.length === 0 ? (
          <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucune liste envoyée pour le moment</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {listesCourses.map((l) => (
              <Card key={l.id} style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{nomClient(l.client_id)}</div>
                  <button onClick={() => supprimerListeCourses(l.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={15} /></button>
                </div>
                <div style={{ fontSize: 13.5, color: C.textMuted }}>{(l.items || []).join(" · ")}</div>
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
      <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>
        Ajoute des suppléments recommandés avec un lien direct (ex : lien Amazon), visibles par le client dans son onglet Nutrition.
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionHead icon={Pill} title="Nouveau supplément" />
        {selecteurClient}
        <input type="text" value={nomSupplement} onChange={(e) => setNomSupplement(e.target.value)} placeholder="Nom du supplément (ex : Whey protéine)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 8 }} />
        <input type="text" value={lienSupplement} onChange={(e) => setLienSupplement(e.target.value)} placeholder="Lien (ex : https://amazon.fr/...)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 8 }} />
        <input type="text" value={noteSupplement} onChange={(e) => setNoteSupplement(e.target.value)} placeholder="Note (ex : 1 dose après l'entraînement)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10 }} />
        <button onClick={ajouterSupplement} style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)" }}>Ajouter le supplément</button>
      </Card>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
      ) : supplements.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun supplément pour le moment</div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supplements.map((s) => (
            <Card key={s.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <IconBadge icon={Pill} color="#3AD6A0" size={42} iconSize={20} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{s.nom}</div>
                <div style={{ fontSize: 12.5, color: C.textDim }}>{nomClient(s.client_id)}{s.note ? ` · ${s.note}` : ""}</div>
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
      const { data: urlData, error: signErr } = await supabase.storage.from("documents-coach").createSignedUrl(fileName, SIGNED_URL_EXPIRY);
      if (signErr) throw signErr;
      const { error } = await supabase.from("documents_coach").insert({
        coach_id: coachId,
        client_id: targetClientId === "tous" ? null : targetClientId,
        nom: file.name,
        url: urlData.signedUrl,
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
          <SectionHead icon={FileText} title="Drive" />
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 12 }}>
              Envoie des PDF (programmes, guides, factures...) à un client précis ou à tous tes clients d'un coup.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select
                value={targetClientId}
                onChange={(e) => setTargetClientId(e.target.value)}
                style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5 }}
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
              style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: uploading ? 0.6 : 1 }}
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
                    <IconBadge icon={FileText} color="#7FA0FF" size={42} iconSize={20} />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 14.5, color: C.text, fontWeight: 600 }}>{d.nom}</div>
                      <div style={{ fontSize: 12.5, color: C.textMuted }}>{c ? `${c.prenom} ${c.nom}` : "Tous les clients"}</div>
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
          <SectionHead icon={Zap} title="Automatisation" />
          <Card>
            <div style={{ fontSize: 14.5, color: C.text, fontWeight: 600, marginBottom: 6 }}>Bientôt disponible</div>
            <div style={{ fontSize: 13.5, color: C.textMuted }}>
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
  const [nouvelExVideoUrl, setNouvelExVideoUrl] = useState("");
  const [groupeExercice, setGroupeExercice] = useState(GROUPES_MUSCULAIRES[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingGroupe, setEditingGroupe] = useState(GROUPES_MUSCULAIRES[0]);
  const [selectedGroupeVOD, setSelectedGroupeVOD] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editingVideoUrl, setEditingVideoUrl] = useState("");

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

  const upload = async () => {
    if (!nomExercice.trim()) { fireToast("Donne un nom à l'exercice avant de l'ajouter"); return; }
    const lien = nouvelExVideoUrl.trim();
    if (lien && !getYouTubeEmbedId(lien)) {
      fireToast("Lien YouTube non reconnu — colle un lien du type youtube.com/watch?v=... ou youtu.be/...");
      return;
    }
    setUploading(true);
    try {
      const { error } = await supabase.from("exercices_bibliotheque").insert({ coach_id: coachId, nom: nomExercice, video_demo_url: lien || null, groupe_musculaire: groupeExercice });
      if (error) throw error;
      fireToast("Exercice ajouté", "green");
      setNomExercice("");
      setNouvelExVideoUrl("");
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

  const replaceVideo = async (id, url) => {
    const lien = (url || "").trim();
    if (lien && !getYouTubeEmbedId(lien)) {
      fireToast("Lien YouTube non reconnu — colle un lien du type youtube.com/watch?v=... ou youtu.be/...");
      return;
    }
    try {
      const exerciceConcerne = exercices.find((ex) => ex.id === id);
      const { error } = await supabase.from("exercices_bibliotheque").update({ video_demo_url: lien || null }).eq("id", id);
      if (error) throw error;
      setExercices((prev) => prev.map((ex) => (ex.id === id ? { ...ex, video_demo_url: lien || null } : ex)));

      // Propage aussi vers toutes les séances déjà créées avec cet exercice (sinon les clients
      // qui l'avaient déjà dans leur programme gardent l'ancienne version, sans vidéo)
      if (exerciceConcerne) {
        const { error: propagErr } = await supabase
          .from("programme_exercices")
          .update({ video_demo_url: lien || null })
          .eq("nom", exerciceConcerne.nom);
        if (propagErr) console.error("Erreur propagation vidéo:", propagErr);
      }

      fireToast("Vidéo mise à jour partout où l'exercice est utilisé", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur : " + (err.message || "mise à jour vidéo"));
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
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 14.5 }}
            />
            <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={16} /></button>
          </div>
          <select value={editingGroupe} onChange={(e) => setEditingGroupe(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 14.5 }}>
            {GROUPES_MUSCULAIRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={saveEdit} style={{ background: C.blue, border: "none", borderRadius: 8, padding: "8px", color: "#FFFFFF", fontSize: 13.5, fontWeight: 700 }}>Enregistrer</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => ex.video_demo_url && setPreviewVideoUrl(ex.video_demo_url)}
            style={{ width: 36, height: 36, borderRadius: 8, background: C.card, border: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: ex.video_demo_url ? "pointer" : "default" }}
          >
            {ex.video_demo_url ? (
              <VideoThumb url={ex.video_demo_url} />
            ) : (
              <Dumbbell size={16} color={C.textDim} />
            )}
          </div>
          <div style={{ flex: 1, fontSize: 14.5, color: C.text, fontWeight: 600 }}>{ex.nom}</div>
          <button onClick={() => { setEditingVideoId(ex.id); setEditingVideoUrl(ex.video_demo_url || ""); }} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 12.5 }}>
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
      <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>
        Ta bibliothèque d'exercices avec vidéos de démo. Elle est directement utilisée quand tu crées une séance — les exercices que tu ajoutes ici apparaissent dans "Choisir un exercice".
      </div>
      <Card style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={nomExercice}
          onChange={(e) => setNomExercice(e.target.value)}
          placeholder="Nom de l'exercice (ex : Squat barre)"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10 }}
        />
        <select value={groupeExercice} onChange={(e) => setGroupeExercice(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10 }}>
          {GROUPES_MUSCULAIRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input
          type="text"
          value={nouvelExVideoUrl}
          onChange={(e) => setNouvelExVideoUrl(e.target.value)}
          placeholder="Lien YouTube non répertorié (optionnel)"
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 10 }}
        />
        <button
          onClick={upload}
          disabled={uploading}
          style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? "Ajout..." : "+ Ajouter l'exercice"}
        </button>
      </Card>

      {loading ? (
        <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 20 }}>Chargement...</div>
      ) : exercices.length === 0 ? (
        <Card><div style={{ color: C.textMuted, fontSize: 14.5, textAlign: "center" }}>Aucun exercice pour le moment</div></Card>
      ) : selectedGroupeVOD ? (
        <div>
          <button
            onClick={() => setSelectedGroupeVOD(null)}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(110,150,255,0.4)", borderRadius: 999, color: C.text, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 16px 8px 10px", marginBottom: 14 }}
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
              <div style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                <IconBadge icon={Dumbbell} color="#7FA0FF" size={46} iconSize={22} />
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>{groupe}</div>
                  <div style={{ fontSize: 13.5, color: C.textMuted, marginTop: 2 }}>{exs.length} exercice{exs.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight size={18} color="#9DB8FF" /></div>
            </Card>
          ))}
        </div>
      )}
      {editingVideoId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditingVideoId(null)}>
          <Card style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionHead icon={VideoIcon} title="Lien vidéo de l'exercice" />
              <button onClick={() => setEditingVideoId(null)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
            </div>
            <input
              type="text"
              autoFocus
              value={editingVideoUrl}
              onChange={(e) => setEditingVideoUrl(e.target.value)}
              placeholder="Lien YouTube non répertorié"
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {editingVideoUrl && (
                <button onClick={() => { setEditingVideoUrl(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.red, borderRadius: 10, padding: "10px", fontSize: 14.5, fontWeight: 600 }}>
                  Retirer
                </button>
              )}
              <button
                onClick={async () => { await replaceVideo(editingVideoId, editingVideoUrl); setEditingVideoId(null); }}
                style={{ flex: 1, background: C.blue, border: "none", color: "#FFFFFF", borderRadius: 10, padding: "10px", fontSize: 14.5, fontWeight: 700 }}
              >
                Enregistrer
              </button>
            </div>
          </Card>
        </div>
      )}
      {previewVideoUrl && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewVideoUrl(null)}>
          <div style={{ width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => setPreviewVideoUrl(null)} style={{ background: "transparent", border: "none", color: "#FFFFFF" }}><X size={22} /></button>
            </div>
            <VideoPlayer url={previewVideoUrl} />
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
      <div style={{ fontSize: 14, color: C.textOnBgMuted, marginBottom: 14 }}>
        Envoie une notification tout de suite, ou programme-la pour qu'elle parte automatiquement à une date et une heure précises (ex : rappel du bilan chaque dimanche soir).
      </div>
      <Card style={{ marginBottom: 20 }}>
        <SectionHead icon={Bell} title="Nouvelle notification" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <select
            value={targetClientId}
            onChange={(e) => setTargetClientId(e.target.value)}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5 }}
          >
            <option value="tous">Tous mes clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
          <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5 }} />
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5, resize: "none" }} />

          <div style={{ display: "flex", gap: 8 }}>
            <PillButton active={mode === "maintenant"} onClick={() => setMode("maintenant")} style={{ flex: 1, textAlign: "center" }}>Envoyer maintenant</PillButton>
            <PillButton active={mode === "programmer"} onClick={() => setMode("programmer")} style={{ flex: 1, textAlign: "center" }}>Programmer</PillButton>
          </div>

          {mode === "programmer" && (
            <input
              type="datetime-local"
              value={dateProgrammee}
              onChange={(e) => setDateProgrammee(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "9px 10px", color: C.text, fontSize: 14.5 }}
            />
          )}

          <button onClick={send} disabled={sending} style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", opacity: sending ? 0.6 : 1 }}>
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
              <Card key={n.id} style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left" }}>
                <IconBadge icon={Bell} color={n.lu ? "#7C88AD" : "#F5C542"} size={40} iconSize={19} />
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, color: C.text, fontWeight: 800 }}>{n.titre}</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 6 }}>
                  {c ? `${c.prenom} ${c.nom}` : "Client"} · {n.lu ? "Lu" : "Non lu"}
                  {n.type === "relance_inactif" && <span style={{ color: C.amber }}> · Relance auto</span>}
                  {n.type === "rapport_hebdo" && <span style={{ color: C.green }}> · Rapport hebdo</span>}
                  {n.type === "rappel_bilan" && <span style={{ color: C.blue }}> · Rappel bilan</span>}
                  {n.type === "nouveau_bilan" && <span style={{ color: C.green }}> · Nouveau bilan reçu</span>}
                  {n.type?.startsWith("stagnation_") && <span style={{ color: C.red }}> · Stagnation</span>}
                  {n.type === "resume_quotidien" && <span style={{ color: C.blue }}> · Résumé du jour</span>}
                  {n.type?.startsWith("objectif_poids_") && <span style={{ color: C.green }}> · Objectif atteint</span>}
                  {!n.envoyee && n.date_prevue && (
                    <span style={{ color: C.amber }}> · Programmée pour le {new Date(n.date_prevue).toLocaleString("fr-FR")}</span>
                  )}
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

const FACTEURS_ACTIVITE = [
  { key: "sedentaire", label: "Sédentaire", description: "Peu ou pas d'exercice, travail assis", valeur: 1.2 },
  { key: "leger", label: "Légèrement actif", description: "Sport léger 1-3 jours / semaine", valeur: 1.375 },
  { key: "modere", label: "Modérément actif", description: "Sport modéré 3-5 jours / semaine", valeur: 1.55 },
  { key: "actif", label: "Très actif", description: "Sport intense 6-7 jours / semaine", valeur: 1.725 },
  { key: "extreme", label: "Extrêmement actif", description: "Sport intense quotidien + travail physique", valeur: 1.9 },
];

function CalculateurCalories({ client, onUtiliser }) {
  const [sexe, setSexe] = useState("homme");
  const [poids, setPoids] = useState(client.poids_actuel || "");
  const [taille, setTaille] = useState(client.taille || "");
  const [age, setAge] = useState(client.age || "");
  const [activite, setActivite] = useState("modere");
  const [objectif, setObjectif] = useState("maintien"); // "deficit" | "maintien" | "surplus"

  const poidsN = parseFloat(poids) || 0;
  const tailleN = parseFloat(taille) || 0;
  const ageN = parseInt(age) || 0;
  const facteur = FACTEURS_ACTIVITE.find((f) => f.key === activite)?.valeur || 1.2;

  const bmr = poidsN && tailleN && ageN
    ? 10 * poidsN + 6.25 * tailleN - 5 * ageN + (sexe === "homme" ? 5 : -161)
    : 0;
  const maintenance = bmr * facteur;
  const ajustement = objectif === "deficit" ? 0.8 : objectif === "surplus" ? 1.15 : 1;
  const resultat = Math.round(maintenance * ajustement);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <PillButton active={sexe === "homme"} onClick={() => setSexe("homme")} style={{ flex: 1, textAlign: "center" }}>Homme</PillButton>
        <PillButton active={sexe === "femme"} onClick={() => setSexe("femme")} style={{ flex: 1, textAlign: "center" }}>Femme</PillButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Poids (kg)</div>
          <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Taille (cm)</div>
          <input type="number" value={taille} onChange={(e) => setTaille(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Âge</div>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "8px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO }} />
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "none" }}>Niveau d'activité</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {FACTEURS_ACTIVITE.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActivite(f.key)}
            style={{
              textAlign: "left", border: `1px solid ${activite === f.key ? C.blue : C.cardBorderLight}`, borderRadius: 10, padding: "8px 10px",
              background: activite === f.key ? C.blueSoft : "transparent", color: activite === f.key ? C.blue : C.text,
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{f.label}</div>
            <div style={{ fontSize: 10.5, color: activite === f.key ? C.blue : C.textMuted }}>{f.description}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "none" }}>Objectif</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <PillButton active={objectif === "deficit"} onClick={() => setObjectif("deficit")} style={{ flex: 1, textAlign: "center" }}>Perte (-20%)</PillButton>
        <PillButton active={objectif === "maintien"} onClick={() => setObjectif("maintien")} style={{ flex: 1, textAlign: "center" }}>Maintien</PillButton>
        <PillButton active={objectif === "surplus"} onClick={() => setObjectif("surplus")} style={{ flex: 1, textAlign: "center" }}>Prise (+15%)</PillButton>
      </div>

      <Card style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600, textTransform: "none", marginBottom: 4 }}>Résultat estimé</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.text, fontWeight: 700 }}>{resultat || "—"} <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400 }}>kcal / jour</span></div>
        {!resultat && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Renseigne poids, taille et âge</div>}
      </Card>

      <button
        onClick={() => resultat && onUtiliser(resultat)}
        disabled={!resultat}
        style={{ width: "100%", background: resultat ? C.blue : C.surface, border: "none", color: resultat ? "#06171F" : C.textDim, borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}
      >
        Utiliser ce résultat
      </button>
    </>
  );
}

function PlanAlimentaireModal({ planActuel, onSave, onSaveParJour, onSaveParKg, onSaveNutritionParJour, onClose, client }) {
  const supportsParJour = !!(client && onSaveParJour);
  const [mode, setMode] = useState(supportsParJour ? "parJour" : "pourcentage"); // "pourcentage" | "grammes" | "calculateur" | "parJour"
  const [kcal, setKcal] = useState(planActuel.kcal);
  const [pctProt, setPctProt] = useState(planActuel.pctProt);
  const [pctGluc, setPctGluc] = useState(planActuel.pctGluc);
  const [pctLip, setPctLip] = useState(planActuel.pctLip);
  const [gProt, setGProt] = useState(planActuel.prot);
  const [gGluc, setGGluc] = useState(planActuel.gluc);
  const [gLip, setGLip] = useState(planActuel.lip);
  const poidsClient = client?.poids_actuel || 0;
  const kcalDepuisGrammes = (parseFloat(gProt) || 0) * 4 + (parseFloat(gGluc) || 0) * 4 + (parseFloat(gLip) || 0) * 9;
  const pctTotal = (parseFloat(pctProt) || 0) + (parseFloat(pctGluc) || 0) + (parseFloat(pctLip) || 0);

  // Chaque jour a sa PROPRE config macro (% / grammes / poids de corps), indépendante des
  // autres jours — construite à partir de "nutrition_par_jour" si déjà réglé, sinon migrée
  // depuis l'ancien système global (mêmes valeurs pour tous les jours au départ, puis
  // modifiables jour par jour).
  const buildInitialJoursConfig = () => {
    let parsedNutrition = {};
    try { parsedNutrition = client?.nutrition_par_jour ? JSON.parse(client.nutrition_par_jour) : {}; } catch { /* ignore */ }
    let parsedKcal = {};
    try { parsedKcal = client?.objectifs_kcal_par_jour ? JSON.parse(client.objectifs_kcal_par_jour) : {}; } catch { /* ignore */ }
    const defaultCfg = configMacroParDefaut(planActuel);
    const base = {};
    for (const j of JOURS_SEMAINE) {
      base[j] = parsedNutrition[j] ? { ...defaultCfg, ...parsedNutrition[j] } : { ...defaultCfg, kcal: parsedKcal[j] ?? planActuel.kcal };
    }
    return base;
  };
  const [joursConfig, setJoursConfig] = useState(buildInitialJoursConfig);
  const [semaineCfg, setSemaineCfg] = useState(() => buildInitialJoursConfig()[JOURS_SEMAINE[0]]);
  // "Semaine" = même config (calories + macros) tous les jours ; "Jour" = réglages indépendants
  // par jour. Détection automatique au départ selon si les 7 jours sont déjà identiques.
  const [kcalMode, setKcalMode] = useState(() => {
    const cfg = buildInitialJoursConfig();
    const sig = (c) => JSON.stringify([c.kcal, c.macroMode, c.pctProt, c.pctGluc, c.pctLip, c.gProt, c.gGluc, c.gLip, c.protParKg, c.lipParKg]);
    const sigs = JOURS_SEMAINE.map((j) => sig(cfg[j]));
    return sigs.every((s) => s === sigs[0]) ? "semaine" : "jour";
  });
  const [expandedJour, setExpandedJour] = useState(null);
  const moyenneKcalSemaine = Math.round(JOURS_SEMAINE.reduce((sum, j) => sum + (parseInt(joursConfig[j].kcal) || 0), 0) / 7);

  const save = () => {
    if (mode === "parJour") {
      const finalConfig = {};
      if (kcalMode === "semaine") {
        const sc = { ...semaineCfg, kcal: parseInt(semaineCfg.kcal) || planActuel.kcal };
        for (const j of JOURS_SEMAINE) finalConfig[j] = sc;
      } else {
        for (const j of JOURS_SEMAINE) finalConfig[j] = { ...joursConfig[j], kcal: parseInt(joursConfig[j].kcal) || planActuel.kcal };
      }
      // Un seul appel, une seule écriture en base : "nutrition_par_jour" contient déjà les
      // calories de chaque jour (finalConfig[j].kcal), donc plus besoin d'un deuxième appel
      // à onSaveParJour en parallèle sur l'ancienne colonne "objectifs_kcal_par_jour" — les
      // deux appels indépendants (deux requêtes réseau, deux mises à jour d'état séparées)
      // pouvaient se terminer dans un ordre imprévisible et laisser les grammes de macros
      // affichés ne pas refléter la dernière sauvegarde.
      onSaveNutritionParJour?.(finalConfig);
      return;
    }
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

  // Petit éditeur inline de macros (% / grammes / poids) pour UN jour donné (ou pour la
  // config "semaine"). `cfg` et `setCfg` ciblent soit joursConfig[jour], soit semaineCfg.
  const renderMacroInputs = (cfg, setCfg) => (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={() => {
          const idx = MACRO_MODES.findIndex((m) => m.key === cfg.macroMode);
          const next = MACRO_MODES[(idx + 1) % MACRO_MODES.length];
          setCfg({ ...cfg, macroMode: next.key });
        }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 999, border: `2px solid ${C.blue}`, background: C.blue, color: "#FFFFFF", fontSize: 12.5, fontWeight: 700, boxShadow: "0 0 12px rgba(59,111,224,0.55)", marginBottom: 8 }}
      >
        <span>{MACRO_MODES.find((m) => m.key === cfg.macroMode)?.label || "Pourcentage (%)"}</span>
        <ChevronDown size={14} />
      </button>
      {cfg.macroMode === "pourcentage" && (
        <div style={{ display: "flex", gap: 6 }}>
          {[["P %", "pctProt"], ["G %", "pctGluc"], ["L %", "pctLip"]].map(([label, key]) => (
            <div key={key} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 2 }}>{label}</div>
              <input type="number" value={cfg[key]} onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      )}
      {cfg.macroMode === "grammes" && (
        <div style={{ display: "flex", gap: 6 }}>
          {[["P g", "gProt"], ["G g", "gGluc"], ["L g", "gLip"]].map(([label, key]) => (
            <div key={key} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 2 }}>{label}</div>
              <input type="number" value={cfg[key]} onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      )}
      {cfg.macroMode === "poids" && (
        <>
          {!poidsClient && <div style={{ fontSize: 10.5, color: C.red, marginBottom: 6 }}>Poids actuel non renseigné.</div>}
          <div style={{ display: "flex", gap: 6 }}>
            {[["P g/kg", "protParKg"], ["L g/kg", "lipParKg"]].map(([label, key]) => (
              <div key={key} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.textDim, marginBottom: 2 }}>{label}</div>
                <input type="number" step="0.1" value={cfg[key]} onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })} style={{ width: "100%", background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>Glucides = reste des calories du jour</div>
        </>
      )}
    </div>
  );

  // Une ligne "jour" (ou "semaine") : label + champ kcal + aperçu des macros calculées, avec
  // l'éditeur macro qui s'ouvre au clic sur la ligne.
  const renderJourRow = (keyName, label, cfg, setCfg, isOpen, onToggle) => {
    const m = calculerMacros(cfg.kcal, cfg, poidsClient);
    return (
      <div key={keyName} style={{ background: C.surface, borderRadius: 10, padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onToggle}>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 600, width: 66, textTransform: "capitalize", flexShrink: 0 }}>{label}</div>
          <input
            type="number"
            value={cfg.kcal}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setCfg({ ...cfg, kcal: e.target.value })}
            style={{ flex: 1, background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 13, fontFamily: FONT_MONO, boxSizing: "border-box" }}
          />
          <span style={{ fontSize: 10, color: C.textDim, width: 22, flexShrink: 0 }}>kcal</span>
          <ChevronDown size={14} color={C.textDim} style={{ transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
        </div>
        <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 4, marginLeft: 66 }}>
          P {m.prot}g · G {m.gluc}g · L {m.lip}g
        </div>
        {isOpen && renderMacroInputs(cfg, setCfg)}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <Card style={{ width: "100%", maxWidth: 380, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <SectionHead icon={Flame} title={<>Plan alimentaire</>} />

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {supportsParJour ? (
            <PillButton active={mode === "parJour"} onClick={() => setMode("parJour")} style={{ flex: 1, textAlign: "center" }}>Par jour</PillButton>
          ) : (
            <>
              <PillButton active={mode === "pourcentage"} onClick={() => setMode("pourcentage")} style={{ flex: 1, textAlign: "center" }}>En %</PillButton>
              <PillButton active={mode === "grammes"} onClick={() => setMode("grammes")} style={{ flex: 1, textAlign: "center" }}>En grammes</PillButton>
            </>
          )}
          {client && <PillButton active={mode === "calculateur"} onClick={() => setMode("calculateur")} style={{ flex: 1, textAlign: "center" }}>Calculateur</PillButton>}
        </div>

        {mode === "calculateur" && client ? (
          <CalculateurCalories client={client} onUtiliser={(resultat) => {
            if (supportsParJour) setJoursConfig((prev) => ({ ...prev, [jourDuJourFr()]: { ...prev[jourDuJourFr()], kcal: resultat } }));
            else setKcal(resultat);
            setMode(supportsParJour ? "parJour" : "pourcentage");
          }} />
        ) : mode === "parJour" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <PillButton active={kcalMode === "semaine"} onClick={() => setKcalMode("semaine")} style={{ flex: 1, textAlign: "center" }}>Fixe toute la semaine</PillButton>
              <PillButton active={kcalMode === "jour"} onClick={() => setKcalMode("jour")} style={{ flex: 1, textAlign: "center" }}>Par jour</PillButton>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 8, fontWeight: 600, textTransform: "none" }}>
              Calories — clique sur un jour pour régler ses macros
            </div>
            {kcalMode === "semaine" ? (
              renderJourRow("semaine", "Semaine", semaineCfg, setSemaineCfg, expandedJour === "semaine", () => setExpandedJour(expandedJour === "semaine" ? null : "semaine"))
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {JOURS_SEMAINE.map((j) =>
                  renderJourRow(
                    j, j, joursConfig[j],
                    (newCfg) => setJoursConfig((prev) => ({ ...prev, [j]: newCfg })),
                    expandedJour === j,
                    () => setExpandedJour(expandedJour === j ? null : j)
                  )
                )}
              </div>
            )}
            <div style={{ fontSize: 12, color: C.text, fontWeight: 700, marginTop: 12, background: C.surface, borderRadius: 10, padding: "8px 10px" }}>
              Moyenne : {kcalMode === "semaine" ? (parseInt(semaineCfg.kcal) || 0) : moyenneKcalSemaine} kcal / jour
            </div>
          </>
        ) : mode === "pourcentage" ? (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 4, fontWeight: 600, textTransform: "none" }}>Objectif calorique</div>
            <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 16, fontFamily: FONT_MONO, marginBottom: 16 }} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 8, fontWeight: 600, textTransform: "none" }}>
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
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, color: C.textDim, marginBottom: 8, fontWeight: 600, textTransform: "none" }}>
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

        {mode !== "calculateur" && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.textMuted, borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 14 }}>Annuler</button>
            <button onClick={save} style={{ flex: 1, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 14 }}>Enregistrer</button>
          </div>
        )}
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
      <SectionHead icon={ClipboardList} title={<>Mot de passe</>} />
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

function CalendrierNutritionCoach({ repas, plan }) {
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
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text, textTransform: "capitalize" }}>
            {viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </div>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", color: C.textMuted }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 12, color: C.textDim, fontWeight: 700, paddingBottom: 4 }}>{d}</div>
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
                  height: 46, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 14, background: estSelectionne ? C.blue : (hasRepas ? C.surface : "transparent"),
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

      {(() => {
        const tot = repasDuJour.reduce((t, r) => ({ p: t.p + (Number(r.prot) || 0), g: t.g + (Number(r.gluc) || 0), l: t.l + (Number(r.lip) || 0) }), { p: 0, g: 0, l: 0 });
        const objK = plan && plan.kcal ? Number(plan.kcal) : 0;
        return (
          <Card style={{ margin: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{formatDateDisplay(selectedDate)}</span>
              <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}><span style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{Math.round(totalKcalJour)}</span>{objK ? ` / ${objK}` : ""} kcal</span>
            </div>
            {objK > 0 && (
              <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", width: `${Math.min(100, (totalKcalJour / objK) * 100)}%`, borderRadius: 999, background: totalKcalJour > objK * 1.05 ? "linear-gradient(90deg, #F5C542, #FF6B84)" : "linear-gradient(90deg, #4C7DF0, #7FA0FF)" }} />
              </div>
            )}
            {plan && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                <MacroRing label="Protéines" val={tot.p} obj={plan.prot} color="#7FA0FF" />
                <MacroRing label="Glucides" val={tot.g} obj={plan.gluc} color="#3AD6A0" />
                <MacroRing label="Lipides" val={tot.l} obj={plan.lip} color="#F5C542" />
              </div>
            )}
          </Card>
        );
      })()}
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
                            <VideoThumb url={ex.video} />
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
  const [openBilans, setOpenBilans] = useState({});
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
  const [poidsRawDates, setPoidsRawDates] = useState([]);
  const [poidsRawList, setPoidsRawList] = useState([]);
  const [photosHistoryCoach, setPhotosHistoryCoach] = useState([]);
  const [zoomPhoto, setZoomPhoto] = useState(null);
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
  // notifications_actives est true par défaut (colonne absente = true) : seule une désactivation
  // explicite par le coach doit couper les notifs push envoyées à ce client.
  const [notifsCoachActivees, setNotifsCoachActivees] = useState(client.notifications_actives !== false);
  const [savingNotifsCoach, setSavingNotifsCoach] = useState(false);
  const [suppressionPhotoId, setSuppressionPhotoId] = useState(null);

  const supprimerPhotoBilan = async (photo) => {
    if (!confirm("Supprimer définitivement cette photo ?")) return;
    setSuppressionPhotoId(photo.id);
    try {
      const { error } = await supabase.from("photos_bilan").delete().eq("id", photo.id);
      if (error) throw error;
      // Best-effort : on essaie aussi de virer le fichier du storage pour ne pas garder
      // de photos orphelines. Si l'URL signée ne matche pas le format attendu, on ignore.
      try {
        const m = photo.url.match(/\/photos-bilan\/([^?]+)/);
        if (m) await supabase.storage.from("photos-bilan").remove([decodeURIComponent(m[1])]);
      } catch { /* ignore, la ligne DB est supprimée, c'est le principal */ }
      setPhotosHistoryCoach((prev) => prev.filter((p) => p.id !== photo.id));
      fireToast("Photo supprimée", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression photo");
    } finally {
      setSuppressionPhotoId(null);
    }
  };

  const toggleNotifsCoach = async () => {
    const nouvelEtat = !notifsCoachActivees;
    setSavingNotifsCoach(true);
    setNotifsCoachActivees(nouvelEtat);
    try {
      const { error } = await supabase.from("profils").update({ notifications_actives: nouvelEtat }).eq("id", client.id);
      if (error) throw error;
      fireToast(nouvelEtat ? "Notifications réactivées pour ce client" : "Notifications désactivées pour ce client", "green");
    } catch (err) {
      console.error(err);
      setNotifsCoachActivees(!nouvelEtat);
      fireToast("Erreur mise à jour notifications");
    } finally {
      setSavingNotifsCoach(false);
    }
  };

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
  const [routinesMobilite, setRoutinesMobilite] = useState([]);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.from("routines_mobilite").select("*").eq("profil_id", client.id).order("created_at", { ascending: true }).then(({ data, error }) => {
      if (!active) return;
      if (error) { console.error("Erreur chargement routines mobilité:", error); return; }
      setRoutinesMobilite((data || []).map((r) => ({
        ...r,
        jours: typeof r.jours === "string" ? JSON.parse(r.jours) : (r.jours || []),
        exercices: typeof r.exercices === "string" ? JSON.parse(r.exercices) : (r.exercices || []),
      })));
    });
    return () => { active = false; };
  }, [client.id]);

  const saveRoutineMobilite = async (routine) => {
    try {
      if (editingRoutine?.id) {
        const { error } = await supabase.from("routines_mobilite").update({
          nom: routine.nom, jours: JSON.stringify(routine.jours), duree_travail: routine.duree_travail,
          duree_repos: routine.duree_repos, exercices: JSON.stringify(routine.exercices),
        }).eq("id", editingRoutine.id);
        if (error) throw error;
        setRoutinesMobilite((prev) => prev.map((r) => (r.id === editingRoutine.id ? { ...r, ...routine } : r)));
      } else {
        const { data, error } = await supabase.from("routines_mobilite").insert({
          profil_id: client.id, coach_id: client.coach_id, nom: routine.nom, jours: JSON.stringify(routine.jours),
          duree_travail: routine.duree_travail, duree_repos: routine.duree_repos, exercices: JSON.stringify(routine.exercices),
        }).select("*").single();
        if (error) throw error;
        setRoutinesMobilite((prev) => [...prev, { ...data, jours: routine.jours, exercices: routine.exercices }]);
      }
      fireToast("Routine enregistrée", "green");
      setShowRoutineModal(false);
      setEditingRoutine(null);
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement de la routine");
      throw err;
    }
  };

  const supprimerRoutineMobilite = async (id) => {
    if (!confirm("Supprimer cette routine ?")) return;
    try {
      const { error } = await supabase.from("routines_mobilite").delete().eq("id", id);
      if (error) throw error;
      setRoutinesMobilite((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression de la routine");
    }
  };

  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [planAlimentaire, setPlanAlimentaire] = useState(() => {
    const kcal = client.objectif_calories || 2400;
    const pctProt = client.pct_prot || 30;
    const pctGluc = client.pct_gluc || 45;
    const pctLip = client.pct_lip || 25;
    const protParKg = client.prot_par_kg ?? null;
    const lipParKg = client.lip_par_kg ?? null;
    const poidsClient = client.poids_actuel || 0;
    const prot = protParKg != null ? Math.round(protParKg * poidsClient) : Math.round((kcal * pctProt / 100) / 4);
    const lip = lipParKg != null ? Math.round(lipParKg * poidsClient) : Math.round((kcal * pctLip / 100) / 9);
    const gluc = (protParKg != null || lipParKg != null)
      ? Math.max(0, Math.round((kcal - prot * 4 - lip * 4) / 4))
      : Math.round((kcal * pctGluc / 100) / 4);
    return { kcal, pctProt, pctGluc, pctLip, protParKg, lipParKg, prot, gluc, lip };
  });
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [seancesRes, poidsRes, checkinsRes, repasRes, programmesRes, dailyRes, photosRes, mensurationsRes, pushRes] = await Promise.all([
          supabase.from("seances").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(10),
          supabase.from("poids_historique").select("*").eq("profil_id", client.id).order("date", { ascending: true }),
          supabase.from("bilans_semaine").select("*").eq("profil_id", client.id).order("date", { ascending: false }).limit(1),
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
        setCustomProgrammes(
          (programmesRes.data || []).map((p) => ({
            ...p,
            programme_exercices: [...(p.programme_exercices || [])].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)),
          }))
        );
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

  // NOTE : il y avait ici un nettoyage automatique qui supprimait en base les séances
  // sans aucune série enregistrée. Supprimé : ce nettoyage tournait dès le premier
  // chargement de l'écran coach, et rien ne garantissait que la série d'une séance tout
  // juste envoyée par le client avait fini d'arriver avant ce contrôle — un simple écart
  // de timing suffisait à faire disparaître une séance pourtant réelle. On ne supprime
  // plus jamais rien automatiquement ; une séance sans série est simplement masquée à
  // l'affichage ci-dessous (voir seancesAvecSeries), sans toucher à la base.
  const seancesAvecSeries = useMemo(
    () => seances.filter((s) => (seriesBySeance[s.id] || []).length > 0),
    [seances, seriesBySeance]
  );

  // Rafraîchit l'historique des séances à chaque fois que le coach ouvre le détail d'un
  // programme. Sans ça, l'écran restait figé sur les données chargées à l'ouverture de la
  // fiche client (un seul fetch au montage, aucun abonnement temps réel) : si le client
  // envoyait sa séance pendant que le coach avait déjà cette page ouverte — le cas le plus
  // courant en usage réel —, "le client n'a pas encore réalisé cette séance" restait affiché
  // indéfiniment jusqu'à un rechargement complet de la page. C'est ce vieux problème de
  // fraîcheur des données, pas un bug d'enregistrement, qui causait ce symptôme précis.
  useEffect(() => {
    if (!selectedProgramme) return;
    let active = true;
    (async () => {
      const { data: seancesFraiches } = await supabase
        .from("seances")
        .select("*")
        .eq("profil_id", client.id)
        .order("date", { ascending: false })
        .limit(10);
      if (!active || !seancesFraiches) return;
      setSeances(seancesFraiches);
      if (seancesFraiches.length > 0) {
        const ids = seancesFraiches.map((s) => s.id);
        const { data: seriesFraiches } = await supabase.from("series").select("*").in("seance_id", ids);
        if (!active) return;
        const grouped = {};
        for (const row of seriesFraiches || []) {
          if (!grouped[row.seance_id]) grouped[row.seance_id] = [];
          grouped[row.seance_id].push(row);
        }
        setSeriesBySeance(grouped);
      }
    })();
    return () => { active = false; };
  }, [selectedProgramme?.id, client.id]);

  const seancesDatesSet = useMemo(() => new Set(seancesAvecSeries.map((s) => s.date)), [seancesAvecSeries]);
  const poidsDatesSet = useMemo(() => new Set(poidsRawDates), [poidsRawDates]);
  const nutritionDatesSet = useMemo(() => new Set(repas.map((r) => r.date)), [repas]);
  const [selectedJourDetail, setSelectedJourDetail] = useState(null);
  const bilansDatesSet = useMemo(() => new Set(checkins.map((c) => String(c.date).slice(0, 10))), [checkins]);

  const detailTabs = [
    { key: "programme", label: "Programme", icon: Dumbbell },
    { key: "bilans", label: "Bilans", icon: TrendingUp },
    { key: "nutrition", label: "Nutrition", icon: Apple },
    { key: "routines", label: "Routine", icon: RotateCcw },
    { key: "profil", label: "Profil", icon: User },
  ];

  if (selectedProgramme) {
    const historiqueFiltré = seancesAvecSeries.filter((s) => s.programme_id === selectedProgramme.id || s.nom_programme === selectedProgramme.nom);
    return (
      <div style={appShellStyle}>
        <FontImports />
        <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px", position: "relative", textAlign: "left" }}>
          <button onClick={() => setSelectedProgramme(null)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(110,150,255,0.4)", borderRadius: 999, color: C.text, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 16px 8px 10px", marginBottom: 16 }}>
            <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Retour
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <IconBadge icon={Dumbbell} color="#7FA0FF" size={48} iconSize={23} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, lineHeight: 1.1, color: C.textOnBg }}>{selectedProgramme.nom}</div>
                <div style={{ fontSize: 13.5, color: C.textOnBgMuted, marginTop: 2 }}>{selectedProgramme.muscle}</div>
              </div>
            </div>
            <button onClick={() => { setEditingProgramme(selectedProgramme); setShowSeanceForm(true); }} style={{ background: C.blue, border: "none", color: "#FFFFFF", borderRadius: 14, padding: "10px 16px", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>Modifier</button>
          </div>
          <SectionHead icon={TrendingUp} title="Historique des performances" count={historiqueFiltré.length} />
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[[C.green, "Progrès"], [C.amber, "Stagnation"], [C.red, "Régression"], [C.blue, "Première fois"]].map(([col, lab]) => (
              <span key={lab} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.text, background: "rgba(255,255,255,0.06)", border: `1px solid ${col}55`, borderRadius: 999, padding: "5px 11px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 8px ${col}` }} />{lab}
              </span>
            ))}
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
                const echauffementParNom = {};
                const objectifParNom = {};
                for (const pe of selectedProgramme.programme_exercices || []) {
                  if (pe.groupe_superset) groupeSupersetParNom[pe.nom] = pe.groupe_superset;
                  echauffementParNom[pe.nom] = pe.series_echauffement || 0;
                  objectifParNom[pe.nom] = { rpe: pe.rpe || null, tempo: pe.tempo || null };
                }
                const parExercice = [];
                for (const sr of seriesDeLaSeance) {
                  let entry = parExercice.find((e) => e.nom === sr.exercice_nom);
                  if (!entry) {
                    entry = { nom: sr.exercice_nom, series: [], groupeSuperset: groupeSupersetParNom[sr.exercice_nom] || null, objectif: objectifParNom[sr.exercice_nom] || null };
                    parExercice.push(entry);
                  }
                  entry.series.push(sr);
                }
                // Les séries d'échauffement sont toujours enregistrées en premier (numero_serie
                // le plus bas) : on retire ce nombre de séries par exercice, connu depuis la
                // définition du programme, pour n'afficher au coach que les vraies séries de travail.
                for (const entry of parExercice) {
                  entry.series.sort((a, b) => (a.numero_serie || 0) - (b.numero_serie || 0));
                  const nbEchauffement = echauffementParNom[entry.nom] || 0;
                  if (nbEchauffement > 0) entry.series = entry.series.slice(nbEchauffement);
                }
                // Un exercice dont il ne reste plus aucune série après retrait de l'échauffement
                // (le client n'a validé que l'échauffement, sans série de travail) ne doit pas
                // afficher une carte vide.
                const parExerciceAffiche = parExercice.filter((e) => e.series.length > 0);
                // Regroupe les blocs consécutifs de même superset
                const blocs = [];
                let bi = 0;
                while (bi < parExerciceAffiche.length) {
                  const ex = parExerciceAffiche[bi];
                  if (ex.groupeSuperset) {
                    const groupe = [ex];
                    let bj = bi + 1;
                    while (bj < parExerciceAffiche.length && parExerciceAffiche[bj].groupeSuperset === ex.groupeSuperset) {
                      groupe.push(parExerciceAffiche[bj]);
                      bj++;
                    }
                    blocs.push({ type: "superset", exs: groupe });
                    bi = bj;
                  } else {
                    blocs.push({ type: "single", exs: [ex] });
                    bi++;
                  }
                }

                const compteurs = { p: 0, s: 0, r: 0 };
                let volumeTotal = 0;
                for (const e of parExerciceAffiche) {
                  for (const sr of e.series) {
                    volumeTotal += (Number(sr.poids) || 0) * (Number(sr.reps) || 0);
                    const col = getProgressionColor(historiqueFiltré, seriesBySeance, sIdx, sr.exercice_nom, sr.poids, sr.reps);
                    if (col === C.green) compteurs.p++; else if (col === C.amber) compteurs.s++; else if (col === C.red) compteurs.r++;
                  }
                }
                const nbSeries = parExerciceAffiche.reduce((t, e) => t + e.series.length, 0);
                const renderExercice = (ex) => {
                  const objectifTexte = ex.objectif && (ex.objectif.tempo || ex.objectif.rpe)
                    ? [ex.objectif.tempo ? `Tempo ${ex.objectif.tempo}` : null, ex.objectif.rpe ? `RPE cible ${ex.objectif.rpe}` : null].filter(Boolean).join(" · ")
                    : null;
                  const cell = { fontSize: 11.5, color: C.textDim, fontWeight: 700 };
                  return (
                  <div key={ex.nom} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "14px 14px 10px" }}>
                    <div style={{ fontSize: 16, color: C.text, fontWeight: 800, textAlign: "left" }}>{ex.nom}</div>
                    {objectifTexte && (
                      <div style={{ fontSize: 12, color: "#F5C542", fontWeight: 600, marginTop: 3, textAlign: "left" }}>{objectifTexte}</div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "34px 1fr 54px 52px 22px", gap: 6, alignItems: "center", padding: "10px 6px 6px" }}>
                      <span style={cell}>Série</span><span style={cell}>Charge × reps</span><span style={{ ...cell, textAlign: "center" }}>RPE</span><span style={{ ...cell, textAlign: "center" }}>Tempo</span><span />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ex.series.map((sr, i) => {
                        const couleur = getProgressionColor(historiqueFiltré, seriesBySeance, sIdx, sr.exercice_nom, sr.poids, sr.reps);
                        const Fleche = couleur === C.green ? TrendingUp : couleur === C.red ? TrendingDown : null;
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr 54px 52px 22px", gap: 6, alignItems: "center", background: `${couleur}1F`, borderLeft: `4px solid ${couleur}`, borderRadius: 12, padding: "10px 8px 10px 8px" }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: couleur }}>S{i + 1}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{sr.poids} kg <span style={{ color: C.textMuted, fontWeight: 700 }}>× {sr.reps}</span></span>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textMuted, textAlign: "center" }}>{sr.rpe ?? "—"}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textMuted, textAlign: "center" }}>{sr.tempo || "—"}</span>
                            <span style={{ display: "flex", justifyContent: "center" }}>{Fleche ? <Fleche size={15} color={couleur} strokeWidth={3} /> : couleur === C.amber ? <span style={{ fontSize: 15, color: couleur, fontWeight: 800, lineHeight: 1 }}>=</span> : null}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                };

                return (
                  <Card key={s.id} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: C.text }}>{formatDateDisplay(s.date)}</div>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "4px 11px" }}><Clock size={13} /> {fmtTime(s.duree_secondes || 0)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{parExerciceAffiche.length}</div>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>exercices</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{nbSeries}</div>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>séries</div>
                      </div>
                    </div>
                    {nbSeries > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ width: `${(compteurs.p / nbSeries) * 100}%`, background: C.green }} />
                          <div style={{ width: `${(compteurs.s / nbSeries) * 100}%`, background: C.amber }} />
                          <div style={{ width: `${(compteurs.r / nbSeries) * 100}%`, background: C.red }} />
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 7, fontSize: 12.5, fontWeight: 700 }}>
                          <span style={{ color: C.green }}>{compteurs.p} progrès</span>
                          <span style={{ color: C.amber }}>{compteurs.s} stagnation</span>
                          <span style={{ color: C.red }}>{compteurs.r} régression</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {blocs.map((bloc, bidx) =>
                        bloc.type === "superset" ? (
                          <div key={bidx} style={{ border: `2px solid ${C.blue}`, boxShadow: "0 0 16px rgba(76,125,240,0.35)", borderRadius: 20, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Zap size={12} color={C.blue} />
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, textTransform: "none", letterSpacing: 0 }}>Superset</span>
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
          {showSeanceForm && (
            <SeanceForm
              clientId={client.id}
              coachId={client.coach_id}
              editingProgramme={editingProgramme}
              onClose={() => { setShowSeanceForm(false); setEditingProgramme(null); }}
              onCreated={() => {
                supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }).then(({ data }) => setCustomProgrammes((data || []).map((p) => ({ ...p, programme_exercices: [...(p.programme_exercices || [])].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) }))));
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
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px", position: "relative", textAlign: "left" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(110,150,255,0.4)", borderRadius: 999, color: C.text, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 16px 8px 10px", marginBottom: 18 }}>
          <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Retour
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <AvatarInitiales prenom={client.prenom} nom={client.nom} photo={client.photo_url} size={68} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: C.textOnBg }}>{client.prenom} {client.nom}</div>
            {client.objectif_principal && (
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 700, color: "#7FA0FF", background: "rgba(76,125,240,0.18)", border: "1px solid rgba(76,125,240,0.5)", borderRadius: 999, padding: "4px 12px" }}>{client.objectif_principal}</span>
            )}
          </div>
        </div>

        {(() => {
          const dernierPoids = weightHistory.length ? weightHistory[weightHistory.length - 1].poids : client.poids_actuel;
          const premierPoids = weightHistory.length ? weightHistory[0].poids : null;
          const deltaPoids = weightHistory.length > 1 ? dernierPoids - premierPoids : null;
          const ilYa30 = Date.now() - 30 * 86400000;
          const seances30 = seancesAvecSeries.filter((x) => new Date(x.date).getTime() >= ilYa30).length;
          const dernierBilan = checkins.length ? checkins[checkins.length - 1] : null;
          const tuile = { display: "flex", flexDirection: "column", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,150,255,0.35)", borderRadius: 18, padding: "12px 10px", textAlign: "center", boxShadow: "0 0 14px rgba(76,125,240,0.18)" };
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
              <div onClick={() => { setTab("bilans"); setTimeout(() => { const el = document.getElementById("coach-poids-chart"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150); }} style={{ ...tuile, cursor: "pointer", border: "1.5px solid rgba(255,170,50,0.9)", boxShadow: "0 0 0 1px rgba(255,150,30,0.4), 0 0 22px rgba(255,150,30,0.55), 0 0 8px rgba(255,190,80,0.55)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{dernierPoids != null ? Number(dernierPoids).toFixed(1).replace(".", ",") : "—"}<span style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}> kg</span></div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>Poids{client.poids_objectif ? ` · obj. ${client.poids_objectif}` : ""}</div>
                {deltaPoids != null && deltaPoids !== 0 && <div style={{ fontSize: 12, fontWeight: 800, color: "#F5C542", marginTop: 3 }}>{deltaPoids > 0 ? "+" : ""}{deltaPoids.toFixed(1).replace(".", ",")} kg</div>}
              </div>
              <div style={tuile}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{seances30}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>Séances · 30 j</div>
              </div>
              <div onClick={() => { setTab("bilans"); setTimeout(() => { const el = document.getElementById("coach-bilans-list"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150); }} style={{ ...tuile, cursor: "pointer", border: "1.5px solid rgba(140,190,255,0.9)", boxShadow: "0 0 0 1px rgba(140,190,255,0.35), 0 0 22px rgba(120,180,255,0.55), 0 0 8px rgba(160,205,255,0.5)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: dernierBilan ? C.text : C.textDim }}>{dernierBilan ? formatDateDisplay(dernierBilan.date) : "—"}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>Dernier bilan</div>
              </div>
            </div>
          );
        })()}

        <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 6, marginLeft: -4, paddingLeft: 4, scrollbarWidth: "none" }}>
          {detailTabs.map((t) => {
            const Icon = t.icon;
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flexShrink: 0, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 999, fontSize: 14.5, fontWeight: 700, color: on ? "#FFFFFF" : C.textMuted, background: on ? "linear-gradient(90deg, #4C7DF0, #3B6FE0)" : "rgba(255,255,255,0.05)", border: on ? "1px solid rgba(160,190,255,0.7)" : "1px solid rgba(110,150,255,0.35)", boxShadow: on ? "0 4px 16px rgba(76,125,240,0.55)" : "none" }}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ color: C.textOnBgMuted, textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : tab === "programme" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => setShowSeanceForm(true)} style={{ background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, boxShadow: "0 6px 20px rgba(76,125,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
              for (const s of seancesAvecSeries) {
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
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.blue, textTransform: "capitalize", letterSpacing: 0, marginBottom: 2 }}>{p.jour_fixe}</div>
                      )}
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 19, color: C.text }}>{p.nom}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingProgramme(p); setShowSeanceForm(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                      <button onClick={async (e) => { e.stopPropagation(); if (!confirm("Supprimer cette séance ?")) return; await supabase.from("programmes").delete().eq("id", p.id); setCustomProgrammes((prev) => prev.filter((x) => x.id !== p.id)); }} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 6 }}>{p.muscle}</div>
                  <div style={{ fontSize: 12.5, color: C.textDim }}>
                    {(p.programme_exercices || []).length} exercices · {(p.programme_exercices || []).reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries
                  </div>
                  {p.updated_at && (
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>Modifié le {formatDateDisplay(p.updated_at)}</div>
                  )}
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
                              cursor: p ? "pointer" : "default", display: "flex", alignItems: "center", gap: 14, padding: 16,
                              border: estValide ? `2px solid ${C.green}` : undefined,
                              boxShadow: estValide ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(58,214,160,0.45), 0 0 26px rgba(58,214,160,0.55), 0 10px 28px rgba(0,0,0,0.4)" : undefined,
                            }}
                          >
                            <div style={{ width: 48, height: 48, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: estValide ? "rgba(58,214,160,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${estValide ? "rgba(58,214,160,0.5)" : "rgba(255,255,255,0.08)"}` }}>
                              {estValide ? <Check size={24} color={C.green} strokeWidth={3} /> : p ? <Dumbbell size={22} color="#9DB8FF" /> : <span style={{ fontSize: 20 }}>😴</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: estValide ? C.green : C.textMuted, textTransform: "capitalize", letterSpacing: 0 }}>
                                {jour}{estValide && " · Validé cette semaine"}
                              </div>
                              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 19, color: p ? C.text : C.textDim, marginTop: 2 }}>{p ? p.nom : "Repos"}</div>
                              {p && (
                                <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 9px" }}>{(p.programme_exercices || []).length} exercices</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#B9C4E0", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "3px 9px" }}>{(p.programme_exercices || []).reduce((sum, ex) => sum + (ex.sets || 0), 0)} séries</span>
                                </div>
                              )}
                            </div>
                            {p && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight size={18} color="#9DB8FF" /></div>}
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
        ) : tab === "routines" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => { setEditingRoutine(null); setShowRoutineModal(true); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13 }}
            >
              <Plus size={16} /> Ajouter une routine
            </button>
            {routinesMobilite.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucune routine de mobilité pour ce client</div></Card>
            ) : (
              routinesMobilite.map((r) => (
                <Card key={r.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 3 }}>{r.nom}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted }}>
                        {r.exercices.length} exercice{r.exercices.length > 1 ? "s" : ""} · {r.duree_travail}s effort / {r.duree_repos}s repos
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {JOURS_SEMAINE.map((j) => (
                          <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: "3px 6px", borderRadius: 6, background: r.jours.includes(j) ? C.blueSoft : C.surface, color: r.jours.includes(j) ? C.blue : C.textDim }}>
                            {JOURS_SEMAINE_LABEL[j]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditingRoutine(r); setShowRoutineModal(true); }} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                      <button onClick={() => supprimerRoutineMobilite(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </Card>
              ))
            )}
            {showRoutineModal && (
              <RoutineMobiliteModal
                routineActuelle={editingRoutine}
                onClose={() => { setShowRoutineModal(false); setEditingRoutine(null); }}
                onSave={saveRoutineMobilite}
              />
            )}
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
              <SectionHead icon={Flame} title="Fatigue, sommeil, énergie" color="#F5C542" />
              {checkinsQuotidiens.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 14 }}>Aucun check-in quotidien pour le moment</div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: C.textDim, marginBottom: 12 }}>
                    Moyenne sur les {checkinsQuotidiens.length} derniers jours renseignés
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Fatigue", key: "fatigue", col: "#FF8FA0" },
                      { label: "Sommeil", key: "sommeil", col: "#7FA0FF" },
                      { label: "Énergie", key: "energie", col: "#3AD6A0" },
                    ].map((m) => {
                      const avg = checkinsQuotidiens.reduce((a, c) => a + (c[m.key] || 0), 0) / checkinsQuotidiens.length;
                      return (
                        <div key={m.key} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${m.col}44`, borderRadius: 18, padding: "12px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontSize: 28, color: C.text, fontWeight: 800, lineHeight: 1.1 }}>{avg.toFixed(1)}<span style={{ fontSize: 13, color: C.textMuted, fontWeight: 700 }}>/5</span></div>
                          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", margin: "10px 6px 0" }}>
                            <div style={{ height: "100%", width: `${(avg / 5) * 100}%`, borderRadius: 999, background: m.col }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
            <Card id="coach-poids-chart" style={{ scrollMarginTop: 12 }}>
              <SectionHead icon={TrendingUp} title="Évolution du poids" color="#7FA0FF" />
              {weightHistory.length > 0 ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: C.text, lineHeight: 1 }}>{Number(weightHistory[weightHistory.length - 1].poids).toFixed(1).replace(".", ",")}</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: C.textMuted }}>kg</span>
                    {weightHistory.length > 1 && (() => {
                      const d = weightHistory[weightHistory.length - 1].poids - weightHistory[0].poids;
                      return <span style={{ marginLeft: "auto", background: "rgba(245,184,51,0.2)", border: "1px solid rgba(245,184,51,0.5)", color: "#F8D27A", borderRadius: 12, padding: "5px 11px", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>{d <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {d > 0 ? "+" : ""}{d.toFixed(1).replace(".", ",")} kg</span>;
                    })()}
                  </div>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightHistory} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="coachWgrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4C7DF0" stopOpacity={0.55} />
                            <stop offset="100%" stopColor="#4C7DF0" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="coachWstroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#7FA0FF" />
                            <stop offset="100%" stopColor="#F5C542" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textDim }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                        <YAxis orientation="right" domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: C.textDim }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => Math.round(v)} />
                        <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cardBorderLight}`, borderRadius: 12, fontSize: 13 }} />
                        <Area type="monotone" dataKey="poids" stroke="url(#coachWstroke)" strokeWidth={3.5} fill="url(#coachWgrad)"
                          dot={(pr) => (pr.index === weightHistory.length - 1
                            ? <circle key={pr.index} cx={pr.cx} cy={pr.cy} r={7} fill="#FFFFFF" stroke="#F5C542" strokeWidth={4} />
                            : <g key={pr.index} />)}
                          activeDot={{ r: 6, fill: "#FFFFFF", stroke: "#4C7DF0", strokeWidth: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div style={{ color: C.textMuted, fontSize: 14 }}>Aucune donnée de poids</div>
              )}
            </Card>
            <Card id="coach-bilans-list" style={{ scrollMarginTop: 12 }}>
              <SectionHead icon={ClipboardList} title="Bilans de semaine" count={checkins.length || null} color="#3AD6A0" />
              {checkins.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 14 }}>Aucun bilan envoyé</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {checkins.slice().reverse().map((c, i) => {
                  const ouvert = openBilans[c.id ?? i] ?? (i === 0);
                  const QA = ({ q, a, sur5 }) => a === null || a === undefined || a === "" ? null : (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 600, marginBottom: 7 }}>{q}</div>
                      {sur5 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                            <div style={{ width: `${(a / 5) * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #4C7DF0, #F5C542)" }} />
                          </div>
                          <span style={{ fontSize: 15, color: C.text, fontWeight: 800 }}>{a}<span style={{ color: C.textMuted, fontWeight: 600 }}>/5</span></span>
                        </div>
                      ) : (
                        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "11px 14px", color: C.text, fontSize: 14.5, lineHeight: 1.45 }}>
                          {a}
                        </div>
                      )}
                    </div>
                  );
                  const chip = (txt, col) => <span key={txt} style={{ fontSize: 12.5, fontWeight: 700, color: col, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "4px 10px" }}>{txt}</span>;
                  return (
                    <div key={c.id ?? i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ouvert ? "rgba(110,150,255,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: 14 }}>
                      <button onClick={() => setOpenBilans({ ...openBilans, [c.id ?? i]: !ouvert })} style={{ width: "100%", background: "transparent", border: "none", padding: 0, textAlign: "left", color: C.text }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 17, fontWeight: 800 }}>{formatDateDisplay(c.date)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {c.cent_pourcent === true && <span style={{ fontSize: 12, fontWeight: 800, color: "#3AD6A0", background: "rgba(58,214,160,0.16)", borderRadius: 999, padding: "3px 9px" }}>100 %</span>}
                            {c.cent_pourcent === false && <span style={{ fontSize: 12, fontWeight: 800, color: "#F5C542", background: "rgba(245,197,66,0.16)", borderRadius: 999, padding: "3px 9px" }}>{c.estimation_pourcentage != null ? `${c.estimation_pourcentage} %` : "Pas 100 %"}</span>}
                            <ChevronDown size={18} color={C.textMuted} style={{ transform: ouvert ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          {c.sensation_force != null && chip(`Force ${c.sensation_force}/5`, "#7FA0FF")}
                          {c.satisfaction != null && chip(`Satisfaction ${c.satisfaction}/5`, "#F5C542")}
                          {c.motivation != null && chip(`Motivation ${c.motivation}/5`, "#3AD6A0")}
                          {c.heures_sommeil != null && chip(`Sommeil ${c.heures_sommeil} h`, "#B9C4E0")}
                          {c.ecarts_nutrition != null && chip(`Écarts ${c.ecarts_nutrition >= 3 ? "3+" : c.ecarts_nutrition}`, c.ecarts_nutrition > 0 ? "#F28C38" : "#B9C4E0")}
                        </div>
                      </button>
                      {ouvert && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <QA q="Sensation de force" a={c.sensation_force} sur5 />
                          <QA q="Un exercice t'a posé problème ?" a={c.douleurs} />
                          <QA q="Écarts nutritionnels cette semaine" a={c.ecarts_nutrition != null ? (c.ecarts_nutrition >= 3 ? "3+" : String(c.ecarts_nutrition)) : null} />
                          <QA q="Qu'as-tu mangé en dehors du plan ?" a={c.description_ecarts} />
                          <QA q="Heures de sommeil moyennes par nuit" a={c.heures_sommeil != null ? `${c.heures_sommeil} h` : null} />
                          <QA q="Satisfaction de la semaine" a={c.satisfaction} sur5 />
                          <QA q="Pourquoi es-tu (ou pas) satisfait(e) de ta semaine ?" a={c.satisfaction_raison} />
                          <QA q="As-tu été à 100 % cette semaine ?" a={c.cent_pourcent === true ? "Oui" : c.cent_pourcent === false ? "Non" : null} />
                          <QA q="Pourquoi ?" a={c.pourquoi_pas_cent} />
                          <QA q="À combien tu t'estimes ?" a={c.estimation_pourcentage != null ? `${c.estimation_pourcentage} %` : null} />
                          <QA q="Motivation" a={c.motivation} sur5 />
                          <QA q="Commentaire libre pour ton coach" a={c.commentaire} />
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </Card>

            <Card>
              <SectionHead icon={Camera} title="Bilan photo" color="#F5C542" />
              {photosHistoryCoach.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 14 }}>Aucune photo envoyée</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {PHOTO_CATS.map((cat) => {
                    const photosCat = photosHistoryCoach
                      .filter((p) => p.categorie === cat.key)
                      .slice()
                      .sort((a, b) => new Date(a.date) - new Date(b.date));
                    if (photosCat.length === 0) return null;
                    return (
                      <div key={cat.key}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 8, textTransform: "none", letterSpacing: 0 }}>{cat.nom}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                          {photosCat.map((p) => (
                            <div key={p.id} style={{ position: "relative" }}>
                              <div
                                onClick={() => setZoomPhoto(p.url)}
                                style={{ width: "100%", aspectRatio: "3/4", borderRadius: 16, background: `url(${p.url}) center/cover`, border: "1px solid rgba(110,150,255,0.45)", boxShadow: "0 0 12px rgba(76,125,240,0.25)", cursor: "pointer" }}
                              />
                              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.textMuted, textAlign: "center", marginTop: 4 }}>{formatDateDisplay(p.date)}</div>
                              <button
                                onClick={() => supprimerPhotoBilan(p)}
                                disabled={suppressionPhotoId === p.id}
                                title="Supprimer cette photo"
                                style={{
                                  position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%",
                                  background: "rgba(0,0,0,0.65)", border: "none", color: "#FFFFFF",
                                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                  opacity: suppressionPhotoId === p.id ? 0.5 : 1,
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            {zoomPhoto && (
              <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}
                onClick={() => setZoomPhoto(null)}
              >
                <button onClick={() => setZoomPhoto(null)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: "#FFFFFF" }}><X size={26} /></button>
                <img src={zoomPhoto} alt="" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 14 }}>Appuie longuement sur la photo pour l'enregistrer / la partager</div>
              </div>
            )}

            <Card>
              <SectionHead icon={Target} title="Mensurations" color="#B9C4E0" />
              {mensurationsCoach.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 14 }}>Aucune mensuration envoyée</div>
              ) : (() => {
                const CHAMPS = [
                  ["Taille", "tour_taille"], ["Poitrine", "tour_poitrine"], ["Épaule", "tour_epaule"],
                  ["Bras D", "tour_bras_droit"], ["Bras G", "tour_bras_gauche"],
                  ["Avant-bras D", "tour_avant_bras_droit"], ["Avant-bras G", "tour_avant_bras_gauche"],
                  ["Cuisse D", "tour_cuisse_droite"], ["Cuisse G", "tour_cuisse_gauche"],
                  ["Mollet D", "tour_mollet_droit"], ["Mollet G", "tour_mollet_gauche"],
                ];
                const tri = mensurationsCoach.slice().sort((x, y) => String(y.date).localeCompare(String(x.date)));
                const dernier = tri[0];
                const precedent = tri[1];
                return (
                  <>
                    <div style={{ fontSize: 13, color: C.textDim, marginBottom: 10 }}>Dernière mesure : {formatDateDisplay(dernier.date)}{precedent ? ` · écart vs ${formatDateDisplay(precedent.date)}` : ""}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {CHAMPS.map(([lab, key]) => {
                        const v = dernier[key];
                        if (v == null) return null;
                        const dv = precedent && precedent[key] != null ? v - precedent[key] : null;
                        return (
                          <div key={key} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "10px 12px" }}>
                            <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>{lab}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{v}</span><span style={{ fontSize: 12, color: C.textMuted }}>cm</span>
                              {dv != null && dv !== 0 && <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: dv > 0 ? "#3AD6A0" : "#FF8FA0" }}>{dv > 0 ? "+" : ""}{Number(dv.toFixed(1))}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        ) : tab === "nutrition" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Card>
              <SectionHead icon={Flame} title="Plan alimentaire" color="#F5C542" action={
                <button onClick={() => setShowPlanEditor(true)} style={{ background: C.blueSoft, border: `1px solid ${C.blueBorder}`, borderRadius: 999, padding: "6px 14px", color: "#7FA0FF", fontSize: 13.5, fontWeight: 800 }}>Modifier</button>
              } />
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 44, color: C.text, fontWeight: 800, lineHeight: 1 }}>{planAlimentaire.kcal}</span>
                <span style={{ fontSize: 16, color: C.textMuted, fontWeight: 700 }}>kcal / jour</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[["Protéines", planAlimentaire.prot, "#7FA0FF"], ["Glucides", planAlimentaire.gluc, "#3AD6A0"], ["Lipides", planAlimentaire.lip, "#F5C542"]].map(([lab, val, col]) => (
                  <div key={lab} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col}55`, borderRadius: 16, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{val}<span style={{ fontSize: 12, fontWeight: 700 }}> g</span></div>
                    <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600, marginTop: 2 }}>{lab}</div>
                  </div>
                ))}
              </div>
              {(planAlimentaire.protParKg != null || planAlimentaire.lipParKg != null) && (
                <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 10 }}>
                  Basé sur le poids de corps ({client.poids_actuel || "-"} kg) · glucides = reste des calories
                </div>
              )}
            </Card>
            {repas.length === 0 ? (
              <Card><div style={{ color: C.textMuted, fontSize: 13 }}>Aucun repas enregistré</div></Card>
            ) : (
              <CalendrierNutritionCoach repas={repas} plan={planAlimentaire} />
            )}
          </div>
        ) : null}
        {showPlanEditor && (
          <PlanAlimentaireModal
            planActuel={planAlimentaire}
            client={client}
            onClose={() => setShowPlanEditor(false)}
            onSave={async (nouveauPlan) => {
              try {
                // Repasser en mode % désactive le mode "par poids de corps" s'il était actif.
                const { error } = await supabase.from("profils").update({
                  objectif_calories: nouveauPlan.kcal,
                  pct_prot: nouveauPlan.pctProt,
                  pct_gluc: nouveauPlan.pctGluc,
                  pct_lip: nouveauPlan.pctLip,
                  prot_par_kg: null,
                  lip_par_kg: null,
                }).eq("id", client.id);
                if (error) throw error;
                client.prot_par_kg = null;
                client.lip_par_kg = null;
                setPlanAlimentaire({
                  ...nouveauPlan,
                  protParKg: null,
                  lipParKg: null,
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
            onSaveParJour={async (kcalParJour) => {
              try {
                const { error } = await supabase.from("profils").update({
                  objectifs_kcal_par_jour: JSON.stringify(kcalParJour),
                }).eq("id", client.id);
                if (error) throw error;
                client.objectifs_kcal_par_jour = JSON.stringify(kcalParJour);
                setPlanAlimentaire((prev) => ({ ...prev, kcal: kcalParJour[jourDuJourFr()] ?? prev.kcal }));
                fireToast("Calories par jour mises à jour", "green");
                setShowPlanEditor(false);
              } catch (err) {
                console.error(err);
                fireToast("Erreur mise à jour du plan par jour");
              }
            }}
            onSaveParKg={async ({ protParKg, lipParKg }) => {
              try {
                const { error } = await supabase.from("profils").update({
                  prot_par_kg: protParKg,
                  lip_par_kg: lipParKg,
                }).eq("id", client.id);
                if (error) throw error;
                client.prot_par_kg = protParKg;
                client.lip_par_kg = lipParKg;
                const poidsClient = client.poids_actuel || 0;
                const prot = Math.round(protParKg * poidsClient);
                const lip = Math.round(lipParKg * poidsClient);
                setPlanAlimentaire((prev) => ({
                  ...prev,
                  protParKg,
                  lipParKg,
                  prot,
                  lip,
                  gluc: Math.max(0, Math.round((prev.kcal - prot * 4 - lip * 4) / 4)),
                }));
                fireToast("Objectifs par poids de corps mis à jour", "green");
                setShowPlanEditor(false);
              } catch (err) {
                console.error(err);
                fireToast("Erreur mise à jour des objectifs par poids");
              }
            }}
            onSaveNutritionParJour={async (joursConfig) => {
              try {
                const { error } = await supabase.from("profils").update({
                  nutrition_par_jour: JSON.stringify(joursConfig),
                }).eq("id", client.id);
                if (error) throw error;
                client.nutrition_par_jour = JSON.stringify(joursConfig);
                const cfgToday = joursConfig[jourDuJourFr()];
                if (cfgToday) {
                  const m = calculerMacros(cfgToday.kcal, cfgToday, client.poids_actuel || 0);
                  setPlanAlimentaire((prev) => ({
                    ...prev,
                    kcal: parseInt(cfgToday.kcal) || prev.kcal,
                    protParKg: cfgToday.macroMode === "poids" ? cfgToday.protParKg : null,
                    lipParKg: cfgToday.macroMode === "poids" ? cfgToday.lipParKg : null,
                    prot: m.prot, gluc: m.gluc, lip: m.lip,
                  }));
                }
                fireToast("Répartition des macros mise à jour", "green");
                setShowPlanEditor(false);
              } catch (err) {
                console.error(err);
                fireToast("Erreur mise à jour de la répartition des macros");
              }
            }}
          />
        )}
        {tab === "profil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionHead icon={User} title="Informations personnelles" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["Prénom", client.prenom], ["Nom", client.nom], ["Âge", client.age ? `${client.age} ans` : "-"], ["Taille", client.taille ? `${client.taille} cm` : "-"], ["Poids actuel", client.poids_actuel ? `${client.poids_actuel} kg` : "-"], ["Objectif de poids", client.poids_objectif ? `${client.poids_objectif} kg` : "-"]].map(([lab, val]) => (
                  <div key={lab} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>{lab}</div>
                    <div style={{ fontSize: 17, color: C.text, fontWeight: 800, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionHead icon={Target} title="Objectifs" color="#F5C542" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Objectif principal", client.objectif_principal], ["Objectif secondaire", client.objectif_secondaire]].map(([lab, val]) => (
                  <div key={lab} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "10px 14px" }}>
                    <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>{lab}</div>
                    <div style={{ fontSize: 16, color: C.text, fontWeight: 700, marginTop: 2 }}>{val || "-"}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionHead icon={Bell} title={<>Notifications push</>} />
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
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cardBorderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Notifications automatiques</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>
                    {notifsCoachActivees ? "Ce client reçoit les rappels et alertes automatiques." : "Désactivées : ce client ne recevra plus aucune notification push, même si l'app le déclenche."}
                  </div>
                </div>
                <button
                  onClick={toggleNotifsCoach}
                  disabled={savingNotifsCoach}
                  style={{
                    flexShrink: 0, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 800,
                    background: notifsCoachActivees ? C.greenSoft : C.surface, color: notifsCoachActivees ? C.green : C.textMuted,
                    opacity: savingNotifsCoach ? 0.6 : 1,
                  }}
                >
                  {notifsCoachActivees ? "Activées — couper" : "Désactivées — réactiver"}
                </button>
              </div>
            </Card>
            <ResetPasswordCard client={client} fireToast={fireToast} />

            <Card>
              <SectionHead icon={Clock} title="Connexions récentes" color="#B9C4E0" />
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
              <SectionHead icon={ClipboardList} title="Note privée" color="#F5C542" />
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
              <button onClick={enregistrerNote} disabled={savingNote} style={{ width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "11px", fontWeight: 800, fontSize: 13, opacity: savingNote ? 0.6 : 1 }}>
                {savingNote ? "Enregistrement..." : "Enregistrer la note"}
              </button>
            </Card>

            <Card>
              <SectionHead icon={Folder} title={<>Visibilité</>} />
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
              <SectionHead icon={Trash2} title={<>Zone dangereuse</>} color={C.red} />
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
              supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", client.id).order("created_at", { ascending: false }).then(({ data }) => setCustomProgrammes((data || []).map((p) => ({ ...p, programme_exercices: [...(p.programme_exercices || [])].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) }))));
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
          .map((b) => ({ ...b, dateParsed: parseDateFlexible(b.date) }))
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
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 40px", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <SideMenu viewMode={viewMode} setViewMode={setViewMode} onLogout={onLogout} showViewToggle={true} coachTab={coachTab} setCoachTab={setCoachTab} tachesEnAttenteCount={tachesEnAttenteCount} />
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.textOnBgMuted, fontWeight: 600 }}>Espace coach</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, lineHeight: 1.15, color: C.textOnBg }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Card style={{ padding: 16 }}>
                <IconBadge icon={User} color="#7FA0FF" size={38} />
                <div style={{ fontSize: 44, color: C.text, fontWeight: 800, lineHeight: 1, marginTop: 14 }}>{clients.length}</div>
                <div style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 600, marginTop: 4 }}>Clients actifs</div>
              </Card>
              <Card style={{ padding: 16, border: bilansEnAttente.length > 0 ? "1.5px solid rgba(240,84,110,0.85)" : "1.5px solid rgba(58,214,160,0.7)", boxShadow: bilansEnAttente.length > 0 ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(240,84,110,0.3), 0 0 24px rgba(240,84,110,0.45), 0 10px 28px rgba(0,0,0,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 22px rgba(58,214,160,0.4), 0 10px 28px rgba(0,0,0,0.4)" }}>
                <IconBadge icon={bilansEnAttente.length > 0 ? AlertCircle : CheckCircle2} color={bilansEnAttente.length > 0 ? "#FF6B84" : "#3AD6A0"} size={38} />
                <div style={{ fontSize: 44, color: bilansEnAttente.length > 0 ? "#FF6B84" : C.green, fontWeight: 800, lineHeight: 1, marginTop: 14 }}>{bilansEnAttente.length}</div>
                <div style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 600, marginTop: 4 }}>Bilans en attente</div>
              </Card>
            </div>

            {tachesApercu.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHead icon={ClipboardList} title="Tes prochaines tâches" count={tachesApercu.length} action={
                  <button onClick={() => setCoachTab("taches")} style={{ background: "transparent", border: "none", color: "#7FA0FF", fontSize: 13.5, fontWeight: 700, padding: 0 }}>Voir tout</button>
                } />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tachesApercu.map((t) => (
                    <div key={t.id} style={ROW_STYLE}>
                      <span style={{ fontSize: 14.5, color: C.text, fontWeight: 600, textAlign: "left" }}>{t.titre}</span>
                      {t.date_echeance && <span style={{ fontSize: 12.5, color: "#F5C542", fontWeight: 700, background: "rgba(245,197,66,0.14)", borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>{formatDateDisplay(t.date_echeance)}</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {clientsInactifs.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHead icon={AlertCircle} title="À relancer" count={clientsInactifs.length} color="#F5C542" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {clientsInactifs.slice(0, 5).map(({ client, joursSince }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ ...ROW_STYLE, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <AvatarInitiales prenom={client.prenom} nom={client.nom} photo={client.photo_url} size={38} ring="#F5C542" />
                        <span style={{ fontSize: 15, color: C.text, fontWeight: 700 }}>{client.prenom} {client.nom}</span>
                      </div>
                      <span style={{ fontSize: 12.5, color: "#FF8FA0", fontWeight: 700, background: "rgba(240,84,110,0.14)", borderRadius: 999, padding: "4px 10px", flexShrink: 0 }}>{joursSince === null ? "Aucune séance" : `Il y a ${joursSince} j`}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {seancesEnAttente.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHead icon={Dumbbell} title="Séances en attente aujourd'hui" count={seancesEnAttente.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {seancesEnAttente.slice(0, 6).map(({ client, programme }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ ...ROW_STYLE, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <AvatarInitiales prenom={client.prenom} nom={client.nom} photo={client.photo_url} size={38} />
                        <span style={{ fontSize: 14, color: C.textMuted, textAlign: "left" }}>
                          <span style={{ fontWeight: 800, color: C.text }}>{client.prenom}</span> doit faire « {programme} »
                        </span>
                      </div>
                      <ChevronRight size={18} color={C.textDim} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {bilansEnAttente.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHead icon={AlertCircle} title="Bilans en attente" count={bilansEnAttente.length} color="#FF6B84" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bilansEnAttente.slice(0, 5).map(({ client, joursSince }) => (
                    <div key={client.id} onClick={() => setSelectedClient(client)} style={{ ...ROW_STYLE, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <AvatarInitiales prenom={client.prenom} nom={client.nom} photo={client.photo_url} size={38} ring="#FF6B84" />
                        <span style={{ fontSize: 15, color: C.text, fontWeight: 700 }}>{client.prenom} {client.nom}</span>
                      </div>
                      <span style={{ fontSize: 12.5, color: "#FF8FA0", fontWeight: 700, background: "rgba(240,84,110,0.14)", borderRadius: 999, padding: "4px 10px", flexShrink: 0 }}>{joursSince === null ? "Jamais envoyé" : `Il y a ${joursSince} j`}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(recentSeances.length > 0 || recentBilans.length > 0) && (
              <Card>
                <SectionHead icon={Flame} title="Activité récente" color="#F5C542" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ...recentSeances.map((s) => ({ type: "seance", date: s.date, data: s })),
                    ...recentBilans.map((b) => ({ type: "bilan", date: b.date, data: b })),
                  ]
                    // parseDateFlexible gère aussi l'ancien format "JJ/MM/AAAA" des bilans —
                    // une simple comparaison de chaînes triait mal ce format face aux dates ISO.
                    .sort((a, b) => (parseDateFlexible(b.date) || 0) - (parseDateFlexible(a.date) || 0))
                    .slice(0, 6)
                    .map((item) => {
                      const c = clients.find((cl) => cl.id === item.data.profil_id);
                      const estSeance = item.type === "seance";
                      return (
                        <div key={`${item.type}-${item.data.id}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <IconBadge icon={estSeance ? Dumbbell : ClipboardList} color={estSeance ? "#7FA0FF" : "#3AD6A0"} size={36} iconSize={17} />
                          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.35 }}>
                              <span style={{ color: C.text, fontWeight: 800 }}>{c ? c.prenom : "Un client"}</span>{estSeance ? ` a terminé « ${item.data.nom_programme} »` : " a rempli son bilan de semaine"}
                            </div>
                            <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>{formatDateDisplay(item.data.date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  {recentSeances.length === 0 && recentBilans.length === 0 && (
                    <div style={{ fontSize: 13, color: C.textDim }}>Aucune activité récente</div>
                  )}
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ width: "100%", background: "linear-gradient(90deg, #4C7DF0, #3B6FE0)", border: "none", color: "#FFFFFF", borderRadius: 18, padding: "15px", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, boxShadow: "0 6px 20px rgba(76,125,240,0.5)" }}
            >
              <Plus size={20} strokeWidth={3} /> Ajouter un client
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
              <Search size={18} color="#9DB8FF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client..."
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,150,255,0.4)", borderRadius: 18, padding: "14px 14px 14px 42px", color: C.text, fontSize: 15 }}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                                                <AvatarInitiales prenom={c.prenom} nom={c.nom} photo={c.photo_url} size={52} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>{c.prenom} {c.nom}</div>
                            {premiereSeanceParClient[c.id] && (
                              <span style={{ fontSize: 10, color: C.blue, background: C.blueSoft, border: `1px solid ${C.blueBorder}`, borderRadius: 999, padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                {formatDureeSuivi(premiereSeanceParClient[c.id])}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13.5, color: C.textMuted, marginTop: 2, textAlign: "left" }}>{c.objectif_principal}</div>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 4, marginTop: 6 }}>
                            {(() => {
                              const derniereDate = dernierSeanceParClient[c.id];
                              const joursSince = derniereDate ? Math.floor((new Date(todayIso()) - new Date(derniereDate)) / 86400000) : null;
                              const actif = joursSince !== null && joursSince <= 2;
                              return (
                                <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontSize: 12.5, color: actif ? C.green : joursSince === null ? C.textDim : C.red, fontWeight: 600 }}>
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
                                <span style={{ display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", fontSize: 12.5, color: versObjectif ? C.green : C.red, fontWeight: 600 }}>
                                  <Arrow size={11} /> {Math.abs(tendance.delta).toFixed(1)}kg
                                </span>
                              );
                            })()}
                            {derniereConnexionParClient[c.id] && (
                              <span style={{ fontSize: 12.5, color: C.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>
                                Connecté {formatDerniereConnexion(derniereConnexionParClient[c.id])}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ChevronRight size={18} color="#9DB8FF" /></div>
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
              notePerso: ex.note_perso || "",
              videoDemoUrl: ex.video_demo_url,
              type: ex.type_exercice || "muscu",
              dureeMinutes: ex.duree_minutes,
              groupeSuperset: ex.groupe_superset,
              echauffement: ex.series_echauffement || 0,
              objectifRepsMax: ex.objectif_reps_max || null,
              objectifRepsRangeParSerie: ex.objectif_reps_range_par_serie ? JSON.parse(ex.objectif_reps_range_par_serie) : [],
            })),
        }));
        setCustomProgrammes(formatted);
      });
  }, [profilId]);
  // Reprise automatique de la séance en cours : si l'app se ferme (changement d'appli,
  // mise en arrière-plan trop longue...) puis se rouvre, on ne doit pas retomber sur
  // l'accueil en ayant perdu la séance — le chrono et les séries sont déjà sauvegardés
  // dans le localStorage par SessionView, il ne restait qu'à retrouver quel programme
  // était en cours pour rouvrir directement dessus.
  const ACTIVE_PROGRAMME_KEY = `active_programme_${profilId}`;
  const [activeProgramme, setActiveProgrammeState] = useState(null);
  const setActiveProgramme = (p) => {
    setActiveProgrammeState(p);
    if (p) localStorage.setItem(ACTIVE_PROGRAMME_KEY, String(p.id || p.nom));
    else localStorage.removeItem(ACTIVE_PROGRAMME_KEY);
  };
  useEffect(() => {
    if (activeProgramme || customProgrammes.length === 0) return;
    const savedKey = localStorage.getItem(ACTIVE_PROGRAMME_KEY);
    if (!savedKey) return;
    const match = customProgrammes.find((p) => String(p.id) === savedKey || p.nom === savedKey);
    if (!match) { localStorage.removeItem(ACTIVE_PROGRAMME_KEY); return; }
    // Ne reprend que s'il reste vraiment une séance en cours (chrono démarré) — sinon
    // rien à reprendre, et mieux vaut nettoyer la référence.
    if (localStorage.getItem(`session_start_${match.id || match.nom}`)) {
      setActiveProgrammeState(match);
    } else {
      localStorage.removeItem(ACTIVE_PROGRAMME_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customProgrammes]);
  const [exerciseHistory, setExerciseHistory] = useState({});
  // Vue affichable de exerciseHistory : retire les séries d'échauffement (toujours
  // enregistrées en premier) avant que le rappel "la dernière fois" ne soit montré pendant
  // la séance en cours. Recalculé à chaque changement de customProgrammes, donc toujours
  // correct même si le chargement des programmes et celui des séries se terminent dans un
  // ordre imprévisible au démarrage de l'app.
  const exerciseHistoryFiltered = useMemo(() => {
    const echauffementParCle = {};
    for (const p of customProgrammes) {
      for (const ex of p.exercices || []) {
        echauffementParCle[`${p.nom}::${ex.nom}`] = ex.echauffement || 0;
      }
    }
    const out = {};
    for (const k of Object.keys(exerciseHistory)) {
      const nb = echauffementParCle[k] || 0;
      const sets = nb > 0 ? exerciseHistory[k].sets.slice(nb) : exerciseHistory[k].sets;
      if (sets.length > 0) out[k] = { ...exerciseHistory[k], sets };
    }
    return out;
  }, [exerciseHistory, customProgrammes]);

  // Note personnelle par exercice : un mémo privé du client (réglage de machine, hauteur
  // de siège...) qui n'a rien à voir avec la note technique du coach — stocké directement
  // sur sa propre ligne programme_exercices (chaque client a ses propres lignes), donc rien
  // à créer côté coach ni aucun risque de le mélanger avec un autre client.
  const saveExerciceNotePerso = async (exId, notePerso) => {
    try {
      const { error } = await supabase.from("programme_exercices").update({ note_perso: notePerso }).eq("id", exId);
      if (error) throw error;
      const appliquer = (p) => ({ ...p, exercices: p.exercices.map((e) => (e.id === exId ? { ...e, notePerso } : e)) });
      setCustomProgrammes((prev) => prev.map(appliquer));
      setActiveProgrammeState((prev) => (prev ? appliquer(prev) : prev));
      return true;
    } catch (err) {
      console.error("Erreur enregistrement note personnelle:", err);
      fireToast("Erreur enregistrement de la note");
      return false;
    }
  };

  const [meals, setMeals] = useState(EMPTY_MEALS);
  // Réglages nutrition bruts (tels que stockés en base). On dérive kcal du jour / prot / gluc /
  // lip via un useMemo plutôt que des getters sur un objet d'état : un getter capturé dans un
  // spread ({...prev, x}) se fige à sa valeur du moment et ne se recalcule plus ensuite, ce qui
  // cassait le recalcul après une sauvegarde partielle (ex: changer juste le poids/kg sans
  // retoucher le %). Le useMemo ci-dessous est toujours correct, quel que soit le champ modifié.
  const [nutriParams, setNutriParams] = useState(() => {
    let kcalParJour = {};
    try { kcalParJour = profilRow.objectifs_kcal_par_jour ? JSON.parse(profilRow.objectifs_kcal_par_jour) : {}; } catch { /* ignore */ }
    let nutritionParJour = {};
    try { nutritionParJour = profilRow.nutrition_par_jour ? JSON.parse(profilRow.nutrition_par_jour) : {}; } catch { /* ignore */ }
    return {
      kcalParJour,
      nutritionParJour,
      objectifCaloriesDefaut: profilRow.objectif_calories ?? 2400,
      pctProt: profilRow.pct_prot || 30,
      pctGluc: profilRow.pct_gluc || 45,
      pctLip: profilRow.pct_lip || 25,
      protParKg: profilRow.prot_par_kg ?? null,
      lipParKg: profilRow.lip_par_kg ?? null,
      poidsActuel: profilRow.poids_actuel || 0,
    };
  });
  const objectifsNutrition = useMemo(() => {
    const { kcalParJour, nutritionParJour, objectifCaloriesDefaut, pctProt, pctGluc, pctLip, protParKg, lipParKg, poidsActuel } = nutriParams;
    const cfgAujourdhui = nutritionParJour?.[jourDuJourFr()];
    if (cfgAujourdhui) {
      // Réglage propre à aujourd'hui (per-day macros) — prioritaire sur tout le reste.
      const m = calculerMacros(cfgAujourdhui.kcal, cfgAujourdhui, poidsActuel);
      return {
        kcal: parseInt(cfgAujourdhui.kcal) || 0,
        pctProt: cfgAujourdhui.pctProt, pctGluc: cfgAujourdhui.pctGluc, pctLip: cfgAujourdhui.pctLip,
        protParKg: cfgAujourdhui.macroMode === "poids" ? cfgAujourdhui.protParKg : null,
        lipParKg: cfgAujourdhui.macroMode === "poids" ? cfgAujourdhui.lipParKg : null,
        poidsActuel, prot: m.prot, gluc: m.gluc, lip: m.lip,
        kcalParJourRaw: JSON.stringify(kcalParJour),
        nutritionParJourRaw: JSON.stringify(nutritionParJour),
      };
    }
    // Repli sur l'ancien système (kcal par jour + % ou poids global) pour les profils pas
    // encore migrés vers "nutrition_par_jour".
    const kcal = kcalParJour[jourDuJourFr()] ?? objectifCaloriesDefaut;
    const parPoids = protParKg != null || lipParKg != null;
    const prot = parPoids ? Math.round((protParKg || 0) * poidsActuel) : Math.round((kcal * pctProt / 100) / 4);
    const lip = parPoids ? Math.round((lipParKg || 0) * poidsActuel) : Math.round((kcal * pctLip / 100) / 9);
    const gluc = parPoids ? Math.max(0, Math.round((kcal - prot * 4 - lip * 4) / 4)) : Math.round((kcal * pctGluc / 100) / 4);
    return {
      kcal, pctProt, pctGluc, pctLip, protParKg, lipParKg, poidsActuel, prot, gluc, lip,
      kcalParJourRaw: JSON.stringify(kcalParJour),
      nutritionParJourRaw: JSON.stringify(nutritionParJour),
    };
  }, [nutriParams]);

  // Routines de mobilité assignées par le coach, filtrées sur celles du jour — affichées en
  // bannière pleine largeur tout en haut de l'accueil. Pur outil live (minuteur), rien n'est
  // enregistré en base à la fin d'une routine.
  const [routinesMobilite, setRoutinesMobilite] = useState([]);
  const [activeRoutine, setActiveRoutine] = useState(null);
  useEffect(() => {
    if (!profilId) return;
    supabase.from("routines_mobilite").select("*").eq("profil_id", profilId).then(({ data, error }) => {
      if (error) { console.error("Erreur chargement routines mobilité:", error); return; }
      setRoutinesMobilite((data || []).map((r) => ({
        ...r,
        jours: typeof r.jours === "string" ? JSON.parse(r.jours) : (r.jours || []),
        exercices: typeof r.exercices === "string" ? JSON.parse(r.exercices) : (r.exercices || []),
      })));
    });
  }, [profilId]);
  const routinesDuJour = useMemo(() => routinesMobilite.filter((r) => r.jours.includes(jourDuJourFr())), [routinesMobilite]);
  // Quand rien n'est prévu aujourd'hui : la prochaine routine à venir (jour le plus proche,
  // strictement dans le futur), tous jours confondus, pour l'afficher sur l'accueil.
  const prochaineRoutine = useMemo(() => {
    if (routinesMobilite.length === 0) return null;
    const todayIdx = JOURS_SEMAINE.indexOf(jourDuJourFr());
    let meilleure = null;
    routinesMobilite.forEach((r) => {
      (r.jours || []).forEach((j) => {
        const idx = JOURS_SEMAINE.indexOf(j);
        if (idx < 0) return;
        let delta = idx - todayIdx;
        if (delta <= 0) delta += 7;
        if (!meilleure || delta < meilleure.delta) meilleure = { routine: r, jour: j, delta };
      });
    });
    return meilleure;
  }, [routinesMobilite]);
  const [showRoutinesListeClient, setShowRoutinesListeClient] = useState(false);
  const [previewRoutine, setPreviewRoutine] = useState(null);

  // Gestion des routines par le coach sur SON PROPRE profil (viewMode "client" sur lui-même) —
  // même CRUD que celui utilisé côté fiche client, mais ciblant profilId (son propre id).
  const [showRoutineManager, setShowRoutineManager] = useState(false);
  const [showRoutineFormSelf, setShowRoutineFormSelf] = useState(false);
  const [editingRoutineSelf, setEditingRoutineSelf] = useState(null);

  const saveRoutineMobiliteSelf = async (routine) => {
    try {
      if (editingRoutineSelf?.id) {
        const { error } = await supabase.from("routines_mobilite").update({
          nom: routine.nom, jours: JSON.stringify(routine.jours), duree_travail: routine.duree_travail,
          duree_repos: routine.duree_repos, exercices: JSON.stringify(routine.exercices),
        }).eq("id", editingRoutineSelf.id);
        if (error) throw error;
        setRoutinesMobilite((prev) => prev.map((r) => (r.id === editingRoutineSelf.id ? { ...r, ...routine } : r)));
      } else {
        const { data, error } = await supabase.from("routines_mobilite").insert({
          profil_id: profilId, coach_id: profilRow.coach_id || null, nom: routine.nom, jours: JSON.stringify(routine.jours),
          duree_travail: routine.duree_travail, duree_repos: routine.duree_repos, exercices: JSON.stringify(routine.exercices),
        }).select("*").single();
        if (error) throw error;
        setRoutinesMobilite((prev) => [...prev, { ...data, jours: routine.jours, exercices: routine.exercices }]);
      }
      fireToast("Routine enregistrée", "green");
      setShowRoutineFormSelf(false);
      setEditingRoutineSelf(null);
    } catch (err) {
      console.error(err);
      fireToast("Erreur enregistrement de la routine");
      throw err;
    }
  };
  const supprimerRoutineMobiliteSelf = async (id) => {
    if (!confirm("Supprimer cette routine ?")) return;
    try {
      const { error } = await supabase.from("routines_mobilite").delete().eq("id", id);
      if (error) throw error;
      setRoutinesMobilite((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      fireToast("Erreur suppression de la routine");
    }
  };

  const saveObjectifsNutrition = async (updates) => {
    if (!profilId) return;
    // Repasser en mode %/kcal unique désactive le mode "par poids de corps" s'il était actif.
    setNutriParams((prev) => ({
      ...prev,
      objectifCaloriesDefaut: updates.kcal ?? prev.objectifCaloriesDefaut,
      pctProt: updates.pctProt ?? prev.pctProt,
      pctGluc: updates.pctGluc ?? prev.pctGluc,
      pctLip: updates.pctLip ?? prev.pctLip,
      protParKg: null,
      lipParKg: null,
    }));
    try {
      const { error } = await supabase
        .from("profils")
        .update({
          objectif_calories: updates.kcal,
          pct_prot: updates.pctProt,
          pct_gluc: updates.pctGluc,
          pct_lip: updates.pctLip,
          prot_par_kg: null,
          lip_par_kg: null,
        })
        .eq("id", profilId);
      if (error) throw error;
      fireToast("Objectifs nutritionnels mis à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour objectifs");
    }
  };

  // Les deux fonctions suivantes ne sont utilisées que par le coach quand il visualise/édite
  // sa PROPRE nutrition (viewMode "client" sur son propre profil) : même éditeur complet
  // (par jour / par poids de corps) que celui qu'il utilise pour ses clients.
  const saveObjectifsKcalParJourSelf = async (kcalParJour) => {
    if (!profilId) return;
    setNutriParams((prev) => ({ ...prev, kcalParJour }));
    try {
      const { error } = await supabase.from("profils").update({
        objectifs_kcal_par_jour: JSON.stringify(kcalParJour),
      }).eq("id", profilId);
      if (error) throw error;
      fireToast("Calories par jour mises à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour du plan par jour");
    }
  };
  const saveObjectifsParKgSelf = async ({ protParKg, lipParKg }) => {
    if (!profilId) return;
    setNutriParams((prev) => ({ ...prev, protParKg, lipParKg }));
    try {
      const { error } = await supabase.from("profils").update({
        prot_par_kg: protParKg,
        lip_par_kg: lipParKg,
      }).eq("id", profilId);
      if (error) throw error;
      fireToast("Objectifs par poids de corps mis à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour des objectifs par poids");
    }
  };
  const saveNutritionParJourSelf = async (joursConfig) => {
    if (!profilId) return;
    setNutriParams((prev) => ({ ...prev, nutritionParJour: joursConfig }));
    try {
      const { error } = await supabase.from("profils").update({
        nutrition_par_jour: JSON.stringify(joursConfig),
      }).eq("id", profilId);
      if (error) throw error;
      fireToast("Répartition des macros mise à jour", "green");
    } catch (err) {
      console.error(err);
      fireToast("Erreur mise à jour de la répartition des macros");
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

  // La flamme ne s'éteint pas immédiatement à minuit si rien n'est encore renseigné
  // aujourd'hui : elle reste affichée (en gris, "en attente") tant que la journée n'est
  // pas terminée. Elle ne s'éteint vraiment que le lendemain si la journée s'est
  // écoulée sans repas renseigné.
  const { streakNutrition, streakNutritionEnAttente } = useMemo(() => {
    const hasFoodToday = Object.values(meals).some((arr) => arr.length > 0);
    let streakJusquHier = 0;
    let cursor = new Date();
    cursor.setDate(cursor.getDate() - 1);
    while (datesAvecRepasAnterieures.has(cursor.toISOString().slice(0, 10))) {
      streakJusquHier++;
      cursor.setDate(cursor.getDate() - 1);
    }
    if (hasFoodToday) return { streakNutrition: streakJusquHier + 1, streakNutritionEnAttente: false };
    return { streakNutrition: streakJusquHier, streakNutritionEnAttente: streakJusquHier > 0 };
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
      const { data: urlData, error: signErr } = await supabase.storage.from("photos-bilan").createSignedUrl(fileName, SIGNED_URL_EXPIRY);
      if (signErr) throw signErr;
      const { error } = await supabase.from("profils").update({ photo_url: urlData.signedUrl }).eq("id", profilId);
      if (error) throw error;
      setUser((u) => ({ ...u, photoUrl: urlData.signedUrl }));
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
      const { data: urlData, error: signErr } = await supabase.storage.from("photos-bilan").createSignedUrl(fileName, SIGNED_URL_EXPIRY);
      if (signErr) throw signErr;
      const { data, error } = await supabase
        .from("photos_bilan")
        .upsert(
          { profil_id: profilId, categorie, date: today, mois, url: urlData.signedUrl },
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
            // Stocké BRUT (échauffement compris) : les séries d'échauffement sont retirées
            // au moment de l'affichage par exerciseHistoryFiltered (useMemo plus bas), jamais
            // ici. Ce fetch et celui de customProgrammes tournent en parallèle au démarrage de
            // l'app ; si on filtrait ici avec un echauffementParCle basé sur customProgrammes,
            // on risquait de figer un résultat non filtré si ce fetch gagnait la course — un
            // filtrage réactif (qui se recalcule dès que customProgrammes arrive) est fiable
            // dans tous les cas, un filtrage ponctuel au chargement ne l'est pas.
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
      // Supprime tout bilan précédent — un seul bilan (le plus récent) est conservé à la fois
      const { error: delErr } = await supabase.from("bilans_semaine").delete().eq("profil_id", profilId);
      if (delErr) throw delErr;

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
      setCheckins([c]);
      fireToast("Bilan de semaine envoyé", "green");

      // Notifie le coach immédiatement que son client a rempli son bilan
      if (profilRow.coach_id) {
        try {
          const { data: notifData } = await supabase.from("notifications").insert({
            coach_id: profilRow.coach_id, client_id: null,
            titre: `Nouveau bilan : ${profilRow.prenom}`,
            message: `${profilRow.prenom} vient d'envoyer son bilan de la semaine.`,
            lu: false, type: "nouveau_bilan", envoyee: true,
          }).select().single();
          await fetch("/api/send-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              coachId: profilRow.coach_id,
              titre: `Nouveau bilan : ${profilRow.prenom}`,
              message: `${profilRow.prenom} vient d'envoyer son bilan de la semaine.`,
            }),
          });
        } catch (notifErr) {
          console.error("Erreur notification coach:", notifErr);
        }
      }
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
    if (!profilId) return false;
    try {
      // Chaque séance terminée crée son propre enregistrement, avec uniquement les
      // exercices réellement remplis cette fois-ci — jamais mélangé avec les séries
      // d'une séance précédente. La "dernière performance" affichée pour les exercices
      // non touchés aujourd'hui vient de exerciseHistory (calculée sur l'historique
      // complet), pas d'un report des anciennes séries dans la séance du jour.
      //
      // S'il existe déjà une séance envoyée aujourd'hui pour ce même programme (renvoi
      // après un test, session relancée deux fois...), on la supprime avant d'insérer la
      // nouvelle : le coach ne doit voir qu'une seule séance par programme et par jour,
      // toujours la plus récente — jamais un doublon qui traîne.
      const todayStr = todayIso();
      let doublonsQuery = supabase
        .from("seances")
        .select("id")
        .eq("profil_id", profilId)
        .eq("date", todayStr);
      doublonsQuery = programme.id
        ? doublonsQuery.eq("programme_id", programme.id)
        : doublonsQuery.eq("nom_programme", programme.nom);
      const { data: doublons } = await doublonsQuery;
      if (doublons && doublons.length > 0) {
        const idsASupprimer = doublons.map((d) => d.id);
        await supabase.from("series").delete().in("seance_id", idsASupprimer);
        await supabase.from("seances").delete().in("id", idsASupprimer);
      }

      const { data: seance, error: seanceErr } = await supabase
        .from("seances")
        .insert({
          profil_id: profilId,
          nom_programme: programme.nom,
          programme_id: programme.id || null,
          duree_secondes: seconds,
          date: todayIso(),
          envoyee_au_coach: true,
        })
        .select("*")
        .single();
      if (seanceErr) throw seanceErr;
      const seanceId = seance.id;

      const rows = [];
      for (const ex of programme.exercices) {
        const log = logs[ex.id];
        if (!log || !log.sets.length) continue;
        log.sets.forEach((set, idx) => {
          // Chaque champ numérique est blindé individuellement : une valeur vide/NaN/undefined
          // (champ laissé vide par le client, série d'échauffement sans RPE, etc.) ne doit
          // jamais partir telle quelle vers une colonne numérique Postgres — ça fait échouer
          // l'insertion de TOUTE la séance d'un coup, charges et répétitions comprises.
          const poidsSafe = Number.isFinite(Number(set.poids)) ? Number(set.poids) : 0;
          const repsSafe = Number.isFinite(Number(set.reps)) ? Number(set.reps) : 0;
          const rpeSafe = set.rpe === "" || set.rpe === undefined || set.rpe === null || Number.isNaN(Number(set.rpe))
            ? null
            : String(set.rpe);
          rows.push({
            seance_id: seanceId,
            exercice_nom: ex.nom,
            poids: poidsSafe,
            reps: repsSafe,
            rpe: rpeSafe,
            tempo: set.tempo || "",
            video_url: log.video || null,
            numero_serie: idx + 1,
          });
        });
      }
      if (rows.length) {
        const { error: seriesErr } = await supabase.from("series").insert(rows);
        if (seriesErr) {
          // Si l'enregistrement des séries échoue, on ne laisse jamais traîner la séance
          // vide créée juste avant : sans ce nettoyage immédiat, elle resterait en base
          // sans aucune série, invisible ou trompeuse pour le coach, sans que le client
          // sache qu'il doit réessayer.
          await supabase.from("seances").delete().eq("id", seanceId);
          throw seriesErr;
        }
      }

      // Historique borné : on garde seulement les N séances les plus récentes par
      // programme. Le minimum technique est 2 — la couleur Progrès/Stagnation/Régression
      // compare toujours la séance du jour à celle d'avant, donc les deux doivent exister
      // en base en même temps. Avec 1 seule séance gardée, il n'y a plus jamais de séance
      // "d'avant" disponible pour la comparaison, et la coloration ne s'affiche plus jamais.
      const RETENTION_SEANCES_PAR_PROGRAMME = 2;
      try {
        let historiqueQuery = supabase
          .from("seances")
          .select("id")
          .eq("profil_id", profilId)
          .order("date", { ascending: false });
        historiqueQuery = programme.id
          ? historiqueQuery.eq("programme_id", programme.id)
          : historiqueQuery.eq("nom_programme", programme.nom);
        const { data: historiqueSeances } = await historiqueQuery;
        if (historiqueSeances && historiqueSeances.length > RETENTION_SEANCES_PAR_PROGRAMME) {
          const idsAPurger = historiqueSeances.slice(RETENTION_SEANCES_PAR_PROGRAMME).map((s) => s.id);
          await supabase.from("series").delete().in("seance_id", idsAPurger);
          await supabase.from("seances").delete().in("id", idsAPurger);
        }
      } catch (purgeErr) {
        // Un échec de purge ne doit jamais faire échouer l'envoi de la séance elle-même —
        // au pire l'historique garde une séance de trop, ce n'est pas grave.
        console.error("Erreur purge historique séances:", purgeErr);
      }

      setStats((s) => ({ ...s, seancesRealisees: s.seancesRealisees + 1 }));
      const displayDate = formatDateDisplay(todayIso());
      // Stocké BRUT (échauffement compris) ici aussi — voir exerciseHistoryFiltered, seul
      // endroit qui retire les séries d'échauffement avant affichage.
      setExerciseHistory((prev) => {
        const next = { ...prev };
        for (const ex of programme.exercices) {
          const log = logs[ex.id];
          if (log?.sets.length) {
            next[`${programme.nom}::${ex.nom}`] = { date: displayDate, sets: log.sets.map((s) => ({ poids: s.poids, reps: s.reps })) };
          }
        }
        return next;
      });
      return true;
    } catch (err) {
      console.error("Erreur saveSession:", err?.message || err, err);
      fireToast("Erreur envoi séance — vérifie ta connexion et réessaie");
      return false;
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
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("ordre", { ascending: true }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", ordre: p.ordre || 0, jourFixe: p.jour_fixe || null, echauffementGeneral: p.echauffement_general || "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, notePerso: ex.note_perso || "", videoDemoUrl: ex.video_demo_url, type: ex.type_exercice || "muscu", dureeMinutes: ex.duree_minutes, groupeSuperset: ex.groupe_superset, echauffement: ex.series_echauffement || 0, objectifRepsMax: ex.objectif_reps_max || null, objectifRepsRangeParSerie: ex.objectif_reps_range_par_serie ? JSON.parse(ex.objectif_reps_range_par_serie) : [] })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} meals={meals} objectifsNutrition={objectifsNutrition} streak={streakNutrition} streakEnAttente={streakNutritionEnAttente} routinesDuJour={routinesDuJour} onLaunchRoutine={setActiveRoutine} onManageRoutines={() => setShowRoutineManager(true)} prochaineRoutine={prochaineRoutine} toutesRoutines={routinesMobilite} onVoirRoutines={() => setShowRoutinesListeClient(true)} />
          )}
          {tab === "seances" && !activeProgramme && (
            <EntrainementHome user={user} stats={stats} onStart={setActiveProgramme} fireToast={fireToast} customProgrammes={customProgrammes} isCoach={profilRow.role === "coach"} profilId={profilId} onSeanceCreated={() => { supabase.from("programmes").select("*, programme_exercices(*)").eq("profil_id", profilId).order("ordre", { ascending: true }).then(({ data }) => { const formatted = (data || []).map((p) => ({ id: p.id, nom: p.nom, muscle: p.muscle, duree: "", ordre: p.ordre || 0, jourFixe: p.jour_fixe || null, echauffementGeneral: p.echauffement_general || "", exercices: (p.programme_exercices || []).sort((a, b) => a.ordre - b.ordre).map((ex) => ({ id: ex.id, nom: ex.nom, sets: ex.sets, rest: ex.rest, repsParSerie: ex.reps_par_serie ? JSON.parse(ex.reps_par_serie) : [], tempo: ex.tempo, rpe: ex.rpe, note: ex.note, notePerso: ex.note_perso || "", videoDemoUrl: ex.video_demo_url, type: ex.type_exercice || "muscu", dureeMinutes: ex.duree_minutes, groupeSuperset: ex.groupe_superset, echauffement: ex.series_echauffement || 0, objectifRepsMax: ex.objectif_reps_max || null, objectifRepsRangeParSerie: ex.objectif_reps_range_par_serie ? JSON.parse(ex.objectif_reps_range_par_serie) : [] })) })); setCustomProgrammes(formatted); }); }} weightHistory={weightHistory} recentSeances={recentSeances} setTab={setTab} mode="seances" />
          )}
          {activeProgramme && (
            <SessionView
              programme={activeProgramme}
              history={exerciseHistoryFiltered}
              setHistory={setExerciseHistory}
              onFinish={() => setActiveProgramme(null)}
              onCancel={() => setActiveProgramme(null)}
              fireToast={fireToast}
              onSessionComplete={saveSession}
              profilId={profilId}
              coachId={profilRow.coach_id}
              onSaveNotePerso={saveExerciceNotePerso}
            />
          )}
          {activeRoutine && (
            <RoutineMobilitePlayer routine={activeRoutine} onClose={() => setActiveRoutine(null)} />
          )}
          {showRoutinesListeClient && (
            <RoutinesListeClientModal
              routines={routinesMobilite}
              onClose={() => setShowRoutinesListeClient(false)}
              onLaunch={(r) => { setShowRoutinesListeClient(false); setActiveRoutine(r); }}
              onPreview={(r) => { setShowRoutinesListeClient(false); setPreviewRoutine(r); }}
            />
          )}
          {previewRoutine && (
            <RoutinePreviewModal routine={previewRoutine} onClose={() => setPreviewRoutine(null)} />
          )}
          {showRoutineManager && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowRoutineManager(false)}>
              <Card style={{ width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionLabel icon={RotateCcw}>Mes routines</SectionLabel>
                  <button onClick={() => setShowRoutineManager(false)} style={{ background: "transparent", border: "none", color: C.textMuted }}><X size={18} /></button>
                </div>
                <button
                  onClick={() => { setEditingRoutineSelf(null); setShowRoutineFormSelf(true); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", background: C.blue, backgroundImage: "linear-gradient(135deg,#5B8CFF,#2F5BD0)", boxShadow: "0 4px 18px rgba(59,111,224,0.45)", border: "none", color: "#FFFFFF", borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13, marginBottom: 12 }}
                >
                  <Plus size={16} /> Ajouter une routine
                </button>
                {routinesMobilite.length === 0 ? (
                  <div style={{ color: C.textMuted, fontSize: 13 }}>Aucune routine pour l'instant</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {routinesMobilite.map((r) => (
                      <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.cardBorderLight}`, borderRadius: 14, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 3 }}>{r.nom}</div>
                            <div style={{ fontSize: 11.5, color: C.textMuted }}>
                              {r.exercices.length} exercice{r.exercices.length > 1 ? "s" : ""} · {r.duree_travail}s effort / {r.duree_repos}s repos
                            </div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                              {JOURS_SEMAINE.map((j) => (
                                <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: "3px 6px", borderRadius: 6, background: r.jours.includes(j) ? C.blueSoft : "transparent", color: r.jours.includes(j) ? C.blue : C.textDim }}>
                                  {JOURS_SEMAINE_LABEL[j]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => { setEditingRoutineSelf(r); setShowRoutineFormSelf(true); }} style={{ background: "transparent", border: `1px solid ${C.cardBorderLight}`, color: C.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>Modifier</button>
                            <button onClick={() => supprimerRoutineMobiliteSelf(r.id)} style={{ background: "transparent", border: "none", color: C.red }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
          {showRoutineFormSelf && (
            <RoutineMobiliteModal
              routineActuelle={editingRoutineSelf}
              onClose={() => { setShowRoutineFormSelf(false); setEditingRoutineSelf(null); }}
              onSave={saveRoutineMobiliteSelf}
            />
          )}
          {tab === "nutrition" && (
            <Nutrition
              meals={meals}
              onAdd={addFood}
              onRemove={removeFood}
              onUpdate={updateFood}
              objectifs={objectifsNutrition}
              profilId={profilId}
              fireToast={fireToast}
              saveObjectifsNutrition={saveObjectifsNutrition}
              eauVerres={eauVerres}
              onChangeWater={onChangeWater}
              isCoach={profilRow.role === "coach"}
              // Editeur complet (par jour / % / grammes / poids de corps) réservé au coach qui
              // règle SON PROPRE objectif — un client ne doit jamais pouvoir modifier lui-même
              // ses grammes de protéines/glucides/lipides, c'est le coach qui les règle pour lui
              // depuis la fiche client (ClientDetailView). Ne pas retirer ce garde-fou.
              selfClientPlan={profilRow.role === "coach" ? { poids_actuel: objectifsNutrition.poidsActuel, objectifs_kcal_par_jour: objectifsNutrition.kcalParJourRaw, nutrition_par_jour: objectifsNutrition.nutritionParJourRaw } : null}
              onSaveParJour={saveObjectifsKcalParJourSelf}
              onSaveParKg={saveObjectifsParKgSelf}
              onSaveNutritionParJour={saveNutritionParJourSelf}
            />
          )}
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
