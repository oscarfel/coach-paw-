import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dumbbell, Apple, TrendingUp, User, Play, Square, Timer, Video, Upload,
  Camera, Plus, X, Check, Footprints, Target, Flame, ChevronRight,
  ChevronDown, Send, Clock, ClipboardList, Trash2, CheckCircle2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

function SessionView({ programme, history, setHistory, onFinish, onCancel, fireToast }) {
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
        onClick={() => { setRunning(false); setFinished(true); }}
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

function Nutrition({ meals, setMeals, objectifs }) {
  const totals = useMemo(() => {
    const all = Object.values(meals).flat();
    return all.reduce(
      (a, i) => ({ kcal: a.kcal + i.kcal, prot: a.prot + i.prot, gluc: a.gluc + i.gluc, lip: a.lip + i.lip }),
      { kcal: 0, prot: 0, gluc: 0, lip: 0 }
    );
  }, [meals]);

  const addFood = (mealKey, item) => setMeals((prev) => ({ ...prev, [mealKey]: [...prev[mealKey], item] }));
  const removeFood = (mealKey, id) => setMeals((prev) => ({ ...prev, [mealKey]: prev[mealKey].filter((i) => i.id !== id) }));

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
            <MealCard key={m.key} meal={m} items={meals[m.key]} onAdd={addFood} onRemove={removeFood} />
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

function Profil({ user, setUser, fireToast }) {
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

      <button onClick={() => fireToast("Profil mis à jour", "green")} style={{ background: C.blue, border: "none", color: "#06171F", borderRadius: 14, padding: "13px", fontWeight: 800, fontSize: 14 }}>
        Enregistrer les modifications
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP ROOT                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [tab, setTab] = useState("entrainement");
  const [toastNode, fireToast] = useToast();

  const [user, setUser] = useState({
    prenom: "Alex", nom: "Martin", age: 29, taille: 178,
    poidsDepart: 84, poidsActuel: 78.4, poidsObjectif: 74,
    objectifPrincipal: "Perte de graisse", objectifSecondaire: "Gain de force",
  });

  const [stats] = useState({ seancesRealisees: 11, pasJour: 6420, pasMoyenneSemaine: 8150 });

  const [activeProgramme, setActiveProgramme] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({
    "Développé couché barre": { poids: 62.5, reps: 8, date: "24/06" },
    "Squat barre basse": { poids: 90, reps: 6, date: "22/06" },
    "Tractions lestées": { poids: 15, reps: 7, date: "20/06" },
  });

  const [meals, setMeals] = useState({
    petitDej: [{ id: 1, nom: "Flocons d'avoine", grams: 80, kcal: 311, prot: 13.5, gluc: 53, lip: 5.5 }],
    dejeuner: [], collation: [], diner: [],
  });
  const objectifsNutrition = { kcal: 2400, prot: 180, gluc: 250, lip: 70 };

  const [weightHistory, setWeightHistory] = useState([
    { date: "03/06", poids: 80.5 },
    { date: "10/06", poids: 79.8 },
    { date: "17/06", poids: 79.1 },
    { date: "24/06", poids: 78.4 },
  ]);
  const addWeightEntry = (w) => {
    setWeightHistory((h) => [...h, { date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), poids: w }]);
    setUser((u) => ({ ...u, poidsActuel: w }));
    fireToast("Poids enregistré", "green");
  };

  const [photos, setPhotos] = useState({ face: null, profil: null, dos: null, bicepsAvant: null, bicepsArriere: null });
  const [checkins, setCheckins] = useState([]);
  const addCheckin = (c) => { setCheckins((prev) => [...prev, c]); fireToast("Bilan de semaine envoyé", "green"); };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: `radial-gradient(circle at 15% 0%, ${C.bgGradA}, ${C.bg} 55%), ${C.bg}`,
        fontFamily: FONT_BODY,
        color: C.text,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <FontImports />
      <div style={{ width: "100%", maxWidth: 440, padding: "24px 16px 110px", position: "relative" }}>
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
          />
        )}
        {tab === "nutrition" && <Nutrition meals={meals} setMeals={setMeals} objectifs={objectifsNutrition} />}
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
        {tab === "profil" && <Profil user={user} setUser={setUser} fireToast={fireToast} />}
      </div>

      {!activeProgramme && <BottomNav active={tab} setActive={setTab} />}
      {toastNode}
    </div>
  );
}
