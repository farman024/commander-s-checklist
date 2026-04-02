import { useState, useEffect, useRef } from "react";

// ============================================================
// MOCK DATA LAYER — swap these functions for Supabase calls
// ============================================================
const MockDB = {
  getState: () => {
    try {
      const raw = localStorage.getItem("cdr_state");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  setState: (data) => {
    try { localStorage.setItem("cdr_state", JSON.stringify(data)); } catch {}
  },
  defaultState: () => ({
    streak: 0,
    lastSubmitDate: null, // "YYYY-MM-DD"
    logs: [],
  }),
};

// ============================================================
// QUOTE ENGINE
// ============================================================
const QUOTES = {
  discipline: [
    "I am the master of my fate, the captain of my soul.",
    "The biggest battle is the one you fight with yourself.",
    "Discipline is doing what needs to be done, even when you don't want to.",
    "Every rep, every session, every trade — it compounds.",
    "You signed a contract with yourself. Honor it.",
  ],
  restoration: [
    "You are stronger than you seem, braver than you believe.",
    "You don't have to be great to start — but start to be great.",
    "The warrior rests. The warrior returns. The mission continues.",
    "Missing one day does not erase the war you've been winning.",
    "Integrity is built in the moments no one is watching.",
  ],
  shutdown: [
    "I'm not a backup plan, and I'm not a second choice.",
    "I don't compete. I dominate.",
    "You can't handle the real me.",
    "The alter ego takes — it never gives back.",
    "Every time you let it win, you lose ground you bled to gain.",
  ],
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const today = () => new Date().toISOString().split("T")[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

// ============================================================
// COMPONENTS
// ============================================================

function CRTOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)",
    }} />
  );
}

function GlitchHeader({ text }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "clamp(18px, 4vw, 28px)",
        color: "#00FF41",
        letterSpacing: "0.15em",
        textShadow: glitch
          ? "2px 0 #FF0000, -2px 0 #00FFFF"
          : "0 0 10px rgba(0,255,65,0.6)",
        transition: "text-shadow 0.1s",
        transform: glitch ? "skewX(-1deg)" : "none",
      }}>
        {text}
      </div>
    </div>
  );
}

function TerminalButton({ onClick, children, variant = "primary", disabled }) {
  const [pressed, setPressed] = useState(false);
  const colors = {
    primary: { border: "#00FF41", text: "#00FF41", glow: "rgba(0,255,65,0.3)" },
    danger: { border: "#FF0000", text: "#FF0000", glow: "rgba(255,0,0,0.3)" },
    warn: { border: "#FFD700", text: "#FFD700", glow: "rgba(255,215,0,0.3)" },
  };
  const c = colors[variant] || colors.primary;

  return (
    <button
      onClick={() => { if (!disabled) { setPressed(true); setTimeout(() => setPressed(false), 120); onClick?.(); } }}
      style={{
        background: pressed ? c.glow : "transparent",
        border: `1px solid ${disabled ? "#333" : c.border}`,
        color: disabled ? "#444" : c.text,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "12px",
        letterSpacing: "0.1em",
        padding: "10px 20px",
        cursor: disabled ? "not-allowed" : "pointer",
        textShadow: disabled ? "none" : `0 0 8px ${c.glow}`,
        boxShadow: disabled ? "none" : `0 0 8px ${c.glow}`,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.1s",
        width: "100%",
        marginTop: "8px",
        textTransform: "uppercase",
      }}
    >
      [{children}]
    </button>
  );
}

function Toggle({ label, value, onChange, variant = "primary" }) {
  const activeColor = variant === "danger" ? "#FF0000" : "#00FF41";
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        cursor: "pointer", padding: "12px 0", borderBottom: "1px solid #111",
        userSelect: "none",
      }}
    >
      <div style={{
        width: "40px", height: "20px", borderRadius: "0",
        border: `1px solid ${value ? activeColor : "#333"}`,
        background: value ? `${activeColor}22` : "transparent",
        display: "flex", alignItems: "center",
        justifyContent: value ? "flex-end" : "flex-start",
        padding: "2px",
        transition: "all 0.2s",
        boxShadow: value ? `0 0 8px ${activeColor}44` : "none",
        flexShrink: 0,
      }}>
        <div style={{
          width: "14px", height: "14px",
          background: value ? activeColor : "#333",
          transition: "all 0.2s",
          boxShadow: value ? `0 0 6px ${activeColor}` : "none",
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "12px", color: value ? activeColor : "#999",
        letterSpacing: "0.05em",
        textShadow: value ? `0 0 6px ${activeColor}44` : "none",
        transition: "all 0.2s",
      }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// SOUND ENGINE
// ============================================================
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Three-tone digital success beep
    const tones = [
      { freq: 523, start: 0,    dur: 0.08 },
      { freq: 659, start: 0.09, dur: 0.08 },
      { freq: 784, start: 0.18, dur: 0.18 },
    ];
    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.12, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.01);
    });
  } catch (e) {}
}

function ProgressBar({ label, onComplete, alterEgoWon }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const steps = [0, 15, 30, 48, 62, 78, 89, 95, 100];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) {
        const val = steps[i];
        setPct(val);
        if (val === 100 && !firedRef.current && !alterEgoWon) {
          firedRef.current = true;
          playSuccessSound();
        }
        i++;
      } else {
        setDone(true);
        clearInterval(iv);
        setTimeout(onComplete, 600);
      }
    }, 280);
    return () => clearInterval(iv);
  }, []);

  const bars = Math.floor(pct / 4);
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "11px", color: "#00FF41", letterSpacing: "0.15em",
        marginBottom: "20px",
        textShadow: "0 0 8px rgba(0,255,65,0.6)",
      }}>
        {done ? "// LOGS SECURED" : label}
      </div>
      <div style={{ border: "1px solid #00FF41", padding: "4px", marginBottom: "12px" }}>
        <div style={{
          height: "16px",
          width: `${pct}%`,
          background: done ? "#00FF41" : "repeating-linear-gradient(90deg, #00FF41 0px, #00FF41 6px, #003300 6px, #003300 8px)",
          transition: "width 0.25s",
          boxShadow: "0 0 10px rgba(0,255,65,0.5)",
        }} />
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "10px", color: "#00FF41", opacity: 0.7,
      }}>
        {"[" + "█".repeat(bars) + "░".repeat(25 - bars) + "]"} {pct}%
      </div>
    </div>
  );
}

function QuoteBox({ text, variant = "discipline" }) {
  const color = variant === "shutdown" ? "#FF0000" : variant === "restore" ? "#FFD700" : "#00FF41";
  return (
    <div style={{
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      padding: "14px 16px",
      margin: "16px 0",
      background: `${color}08`,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "11px", color, letterSpacing: "0.05em",
        lineHeight: "1.7",
        textShadow: `0 0 6px ${color}44`,
        fontStyle: "italic",
      }}>
        // "{text}"
      </div>
    </div>
  );
}

// ============================================================
// SCREENS
// ============================================================

function BreachScreen({ onResolve }) {
  const [choice, setChoice] = useState(null); // null | "forgot" | "broke"

  return (
    <div style={{ padding: "0 0 30px" }}>
      <div style={{
        textAlign: "center", marginBottom: "30px",
        animation: "pulse-red 1.5s ease-in-out infinite",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "clamp(20px, 5vw, 32px)",
          color: "#FF0000",
          letterSpacing: "0.2em",
          textShadow: "0 0 20px rgba(255,0,0,0.8)",
          marginBottom: "8px",
        }}>
          ⚠ BREACH DETECTED
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "11px", color: "#FF000088", letterSpacing: "0.15em",
        }}>
          // CHECKLIST NOT FILED — YESTERDAY
        </div>
      </div>

      {!choice ? (
        <>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "12px", color: "#aaa",
            letterSpacing: "0.1em", marginBottom: "20px", lineHeight: "1.8",
          }}>
            {">"} INCIDENT REPORT REQUIRED.<br />
            {">"} STATE THE REASON FOR NON-COMPLIANCE:
          </div>
          <TerminalButton onClick={() => setChoice("forgot")} variant="warn">
            Forgot / Was Unwell
          </TerminalButton>
          <TerminalButton onClick={() => setChoice("broke")} variant="danger">
            Broke The Rule
          </TerminalButton>
        </>
      ) : choice === "forgot" ? (
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "14px", color: "#FFD700", textAlign: "center",
            letterSpacing: "0.1em", margin: "20px 0",
            textShadow: "0 0 10px rgba(255,215,0,0.5)",
          }}>
            // INTEGRITY MAINTAINED
          </div>
          <QuoteBox text={getRandom(QUOTES.restoration)} variant="restore" />
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "11px", color: "#888", marginBottom: "20px",
          }}>
            {">"} Streak preserved. Do not miss again.
          </div>
          <TerminalButton onClick={() => onResolve("restore")}>
            Acknowledge & Continue
          </TerminalButton>
        </div>
      ) : (
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "14px", color: "#FF0000", textAlign: "center",
            letterSpacing: "0.1em", margin: "20px 0",
            textShadow: "0 0 10px rgba(255,0,0,0.8)",
          }}>
            // SYSTEM FAILURE — STREAK RESET
          </div>
          <QuoteBox text={getRandom(QUOTES.shutdown)} variant="shutdown" />
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "11px", color: "#FF000066", marginBottom: "20px",
          }}>
            {">"} Rebuild from zero. Earn it back.
          </div>
          <TerminalButton onClick={() => onResolve("reset")} variant="danger">
            Accept Consequence
          </TerminalButton>
        </div>
      )}
    </div>
  );
}

const ASCII_BANNER = [
  "███╗   ███╗██╗███████╗███████╗██╗ ██████╗ ███╗  ██╗",
  "████╗ ████║██║██╔════╝██╔════╝██║██╔═══██╗████╗ ██║",
  "██╔████╔██║██║███████╗███████╗██║██║   ██║██╔██╗██║",
  "██║╚██╔╝██║██║╚════██║╚════██║██║██║   ██║██║╚████║",
  "██║ ╚═╝ ██║██║███████║███████║██║╚██████╔╝██║ ╚███║",
  "╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚══╝",
  "",
  "█████╗  ██████╗ ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ██╗███████╗██╗  ██╗███████╗██████╗ ",
  "██╔══██╗██╔════╝██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██║██╔════╝██║  ██║██╔════╝██╔══██╗",
  "███████║██║     ██║     ██║   ██║██╔████╔██║██████╔╝██║     ██║███████╗███████║█████╗  ██║  ██║",
  "██╔══██║██║     ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██║╚════██║██╔══██║██╔══╝  ██║  ██║",
  "██║  ██║╚██████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗██║███████║██║  ██║███████╗██████╔╝",
  "╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ ",
];

function ResultScreen({ alterEgoWon, improvement, onDone }) {
  const isFailure = alterEgoWon;
  const color = isFailure ? "#FF0000" : "#00FF41";
  const quote = getRandom(isFailure ? QUOTES.shutdown : QUOTES.discipline);
  const label = isFailure ? "// RED DAY — ALTER EGO CLAIMED THIS ONE" : "// MISSION COMPLETE — DISCIPLINE LOGGED";
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      textAlign: "center", padding: "10px 0 30px",
      position: "relative",
      transition: "background 0.3s",
      background: pulse && !isFailure
        ? "radial-gradient(ellipse at center, rgba(0,255,65,0.07) 0%, transparent 70%)"
        : "transparent",
      animation: pulse && !isFailure ? "success-pulse 2s ease-out forwards" : "none",
    }}>

      {/* ASCII Banner — green day only */}
      {!isFailure && (
        <div style={{
          overflowX: "auto",
          marginBottom: "20px",
          padding: "16px 0 8px",
        }}>
          <pre style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "clamp(3px, 1.1vw, 6px)",
            color: "#00FF41",
            textShadow: "0 0 8px rgba(0,255,65,0.7), 0 0 20px rgba(0,255,65,0.3)",
            lineHeight: "1.3",
            letterSpacing: "0.02em",
            display: "inline-block",
            textAlign: "left",
            animation: "flicker-in 0.6s ease-out forwards",
          }}>
            {ASCII_BANNER.join("\n")}
          </pre>
        </div>
      )}

      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "12px",
        color, letterSpacing: "0.1em",
        textShadow: `0 0 10px ${color}88`,
        marginBottom: "20px",
        lineHeight: "1.8",
      }}>
        {label}
      </div>
      <QuoteBox text={quote} variant={isFailure ? "shutdown" : "discipline"} />
      {improvement && (
        <div style={{
          border: "1px solid #222",
          padding: "12px 14px",
          margin: "16px 0",
          textAlign: "left",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "10px", color: "#888", marginBottom: "6px",
          }}>
            // 1% IMPROVEMENT FILED:
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "12px", color: "#aaa", lineHeight: "1.6",
          }}>
            {improvement}
          </div>
        </div>
      )}
      <TerminalButton onClick={onDone} variant={isFailure ? "danger" : "primary"}>
        Close Session
      </TerminalButton>
    </div>
  );
}

function ChecklistForm({ state, onSubmit }) {
  const [energy, setEnergy] = useState(false);
  const [alterEgo, setAlterEgo] = useState(false);
  const [improvement, setImprovement] = useState("");
  const [encrypting, setEncrypting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    setEncrypting(true);
  };

  if (done) {
    return (
      <ResultScreen
        alterEgoWon={alterEgo}
        improvement={improvement}
        onDone={() => onSubmit({ energy, alterEgo, improvement })}
      />
    );
  }

  if (encrypting) {
    return <ProgressBar label="// ENCRYPTING LOGS..." onComplete={() => setDone(true)} alterEgoWon={alterEgo} />;
  }

  return (
    <div>
      {/* Streak display */}
      <div style={{
        textAlign: "center",
        padding: "20px 0 24px",
        borderBottom: "1px solid #0a0a0a",
        marginBottom: "24px",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "11px", color: "#aaa", letterSpacing: "0.15em", marginBottom: "4px",
        }}>
          // DAYS OF DISCIPLINE
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "clamp(48px, 12vw, 72px)",
          color: "#00FF41",
          textShadow: "0 0 30px rgba(0,255,65,0.4)",
          lineHeight: "1",
        }}>
          {String(state.streak).padStart(3, "0")}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ marginBottom: "24px" }}>
        <Toggle
          label="Protected my energy today"
          value={energy}
          onChange={setEnergy}
        />
        <Toggle
          label="Let the Alter Ego win [CRITICAL]"
          value={alterEgo}
          onChange={setAlterEgo}
          variant="danger"
        />
      </div>

      {/* 1% input */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "10px", color: "#aaa", letterSpacing: "0.1em", marginBottom: "8px",
        }}>
          {">"} 1% IMPROVEMENT FOR TOMORROW:
        </div>
        <textarea
          value={improvement}
          onChange={e => setImprovement(e.target.value)}
          placeholder="> Enter directive..."
          style={{
            width: "100%", minHeight: "80px",
            background: "#000", border: "1px solid #1a1a1a",
            color: "#00FF41",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "12px",
            padding: "12px",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
            caretColor: "#00FF41",
            lineHeight: "1.6",
          }}
          onFocus={e => e.target.style.border = "1px solid #00FF41"}
          onBlur={e => e.target.style.border = "1px solid #1a1a1a"}
        />
      </div>

      <TerminalButton
        onClick={handleSubmit}
        disabled={!improvement.trim()}
        variant={alterEgo ? "danger" : "primary"}
      >
        Submit Daily Audit
      </TerminalButton>
    </div>
  );
}

function AlreadyFiledScreen({ state }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "clamp(48px, 12vw, 72px)",
        color: "#00FF41",
        textShadow: "0 0 30px rgba(0,255,65,0.4)",
        lineHeight: "1", marginBottom: "8px",
      }}>
        {String(state.streak).padStart(3, "0")}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: "11px", color: "#888", letterSpacing: "0.15em", marginBottom: "24px",
      }}>
        // DAYS OF DISCIPLINE
      </div>
      <div style={{
        border: "1px solid #001100",
        padding: "14px 16px",
        marginBottom: "16px",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "11px", color: "#00FF4188", letterSpacing: "0.1em",
        }}>
          // AUDIT LOGGED FOR TODAY<br />
          {">"} Return tomorrow, Commander.
        </div>
      </div>
      <QuoteBox text={getRandom(QUOTES.discipline)} variant="discipline" />
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function CommandersChecklist() {
  const [appState, setAppState] = useState(null); // null = loading
  const [screen, setScreen] = useState("loading"); // loading | breach | checklist | filed

  useEffect(() => {
    const raw = MockDB.getState() || MockDB.defaultState();
    const todayStr = today();
    const yStr = yesterday();

    // Already filed today?
    if (raw.lastSubmitDate === todayStr) {
      setAppState(raw);
      setScreen("filed");
      return;
    }

    // Missed yesterday? (only if they have a previous submission)
    if (raw.lastSubmitDate && raw.lastSubmitDate !== yStr && raw.lastSubmitDate !== todayStr) {
      setAppState(raw);
      setScreen("breach");
      return;
    }

    setAppState(raw);
    setScreen("checklist");
  }, []);

  const handleBreachResolve = (resolution) => {
    const updated = { ...appState };
    if (resolution === "reset") updated.streak = 0;
    // "restore" keeps streak as-is
    setAppState(updated);
    MockDB.setState(updated);
    setScreen("checklist");
  };

  const handleSubmit = ({ energy, alterEgo, improvement }) => {
    const updated = { ...appState };
    updated.lastSubmitDate = today();
    if (alterEgo) {
      updated.streak = 0;
    } else {
      updated.streak = (updated.streak || 0) + 1;
    }
    updated.logs = [
      ...(updated.logs || []),
      { date: today(), energy, alterEgo, improvement },
    ];
    MockDB.setState(updated);
    setAppState(updated);
    setScreen("filed");
  };

  const renderScreen = () => {
    if (screen === "loading" || !appState) {
      return (
        <div style={{
          textAlign: "center", padding: "40px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "11px", color: "#999",
        }}>
          {">"} INITIALIZING SYSTEM...
        </div>
      );
    }
    if (screen === "breach") return <BreachScreen onResolve={handleBreachResolve} />;
    if (screen === "checklist") return <ChecklistForm state={appState} onSubmit={handleSubmit} />;
    if (screen === "filed") return <AlreadyFiledScreen state={appState} />;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes success-pulse {
          0%   { background: radial-gradient(ellipse at center, rgba(0,255,65,0.18) 0%, transparent 70%); }
          40%  { background: radial-gradient(ellipse at center, rgba(0,255,65,0.10) 0%, transparent 70%); }
          100% { background: transparent; }
        }
        @keyframes flicker-in {
          0%   { opacity: 0; text-shadow: 0 0 30px rgba(0,255,65,1); }
          30%  { opacity: 0.4; }
          60%  { opacity: 0.9; text-shadow: 0 0 12px rgba(0,255,65,0.8); }
          80%  { opacity: 0.7; }
          100% { opacity: 1; text-shadow: 0 0 8px rgba(0,255,65,0.7), 0 0 20px rgba(0,255,65,0.3); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #00FF4133; }
        ::placeholder { color: #333; }
      `}</style>

      <CRTOverlay />

      <div style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        justifyContent: "center",
        padding: "20px 16px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "480px",
        }}>
          {/* Header */}
          <div style={{ marginBottom: "8px" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: "10px", color: "#556",
              letterSpacing: "0.2em", marginBottom: "6px",
            }}>
              {">"} FALCON'S HUNT — CLASSIFIED SYSTEM v1.0
            </div>
            <GlitchHeader text="THE COMMANDER'S CHECKLIST" />
            <div style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: "10px", color: "#556",
              letterSpacing: "0.1em", marginTop: "4px",
            }}>
              {">"} {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, #00FF41, transparent)",
            margin: "16px 0 24px",
            boxShadow: "0 0 6px rgba(0,255,65,0.3)",
          }} />

          {/* Content */}
          {renderScreen()}

          {/* Footer */}
          <div style={{
            marginTop: "40px",
            borderTop: "1px solid #0a0a0a",
            paddingTop: "16px",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: "9px", color: "#555",
            letterSpacing: "0.1em",
            textAlign: "center",
          }}>
            // OPERATIONAL SECURITY ENABLED — ALL LOGS ENCRYPTED LOCALLY
          </div>
        </div>
      </div>
    </>
  );
}
