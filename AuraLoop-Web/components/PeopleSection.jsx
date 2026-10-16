import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import Avatar from "./Avatar.jsx";
import { CLASSIC_ROWS, PEOPLE, PEOPLE_CARDS } from "../data.js";
import { unsplash } from "../shared/img.js";

const move = { type: "spring", bounce: 0, duration: 0.75 };

const MODES = [
  { id: "classic", label: "Static Desktop" },
  { id: "grouped", label: "AuraLoop 4K Motion" },
];

const COPY = {
  classic:
    "A static desktop leaves you staring at frozen pixels all day, disconnected from natural light cycles and multi-display pacing.",
  grouped:
    "AuraLoop animates your Mac with cinematic 4K 60fps dynamic atmospheres, hardware-decoded with zero CPU overhead.",
};

const ATMOSPHERES = {
  snowfall: {
    badge: "4K · 60fps",
    codec: "HEVC 10-bit P3",
    resolution: "3840×2160 Master",
    telemetry: "0.28% CPU · AVFoundation GPU",
    status: "Active",
    dotColor: "#10b981",
  },
  aurora: {
    badge: "Dynamic Solar",
    codec: "Solar Ephemeris",
    resolution: "24h Solar Keyframes",
    telemetry: "Sun Angle: -14.2° · Metal Shaders",
    status: "Night Cycle",
    dotColor: "#6366f1",
  },
  fuji: {
    badge: "Mini-LED XDR",
    codec: "ExtensionKit Sync",
    resolution: "Liquid Retina XDR",
    telemetry: "Shadows: 0.00 nits · Lock Screen",
    status: "Synced",
    dotColor: "#f59e0b",
  },
};

function ClassicRow({ row, mark }) {
  const p = PEOPLE[row.who];
  return (
    <motion.li
      layoutId={`ta-cmp-${row.id}`}
      layout="position"
      transition={move}
      className={`ta-cmp-row${mark ? " is-mark" : ""}`}
    >
      <div className="ta-cmp-row__thumb">
        {p?.photo ? (
          <img
            src={unsplash(p.photo, { w: 80, h: 56, crop: "crop", q: 75 })}
            alt=""
            loading="lazy"
          />
        ) : (
          <Avatar id={row.who} size={28} />
        )}
      </div>
      <span className="ta-cmp-row__who">{p?.name || row.who}</span>
      <span className="ta-cmp-row__subject">{row.subject}</span>
      <span className="ta-cmp-row__badge">Fixed Frame</span>
      <time className="ta-cmp-row__time">{row.time}</time>
    </motion.li>
  );
}

export default function PeopleSection() {
  const [mode, setMode] = useState("grouped");

  return (
    <section
      id="wallpapers"
      className="ta-sec ta-people"
      aria-labelledby="ta-people-title"
      tabIndex={-1}
    >
      <div className="ta-wrap">
        <div className="ta-sec__head" data-reveal>
          <div className="ta-sec__title">
            <p className="ta-eyebrow">
              <span>01</span> Atmosphere
            </p>
            <h2 id="ta-people-title" className="ta-h2">
              Sorted by atmosphere, not by static pixels.
            </h2>
          </div>
          <div className="ta-sec__aside">
            <p className="ta-lead ta-people__copy" aria-live="polite">
              {COPY[mode]}
            </p>
            <div
              className="ta-seg"
              role="group"
              aria-label="Compare desktop layouts"
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`ta-seg__btn${mode === m.id ? " is-on" : ""}`}
                  aria-pressed={mode === m.id}
                  onClick={() => setMode(m.id)}
                >
                  {mode === m.id && (
                    <motion.span
                      layoutId="ta-seg-hl"
                      className="ta-seg__hl"
                      transition={move}
                    />
                  )}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`ta-compare is-${mode}`} data-reveal>
          <LayoutGroup id="ta-compare">
            {mode === "classic" ? (
              <div className="ta-classic">
                <div className="ta-classic__bar" aria-hidden="true">
                  <span>Standard Static Wallpaper</span>
                  <span>
                    Frozen display · <em>Snowfall</em> bundled master
                  </span>
                </div>
                <ol
                  className="ta-classic__list"
                  role="list"
                  aria-label="Static wallpapers list"
                >
                  {CLASSIC_ROWS.map((r) => (
                    <ClassicRow
                      key={r.id}
                      row={r}
                      mark={r.who === "snowfall"}
                    />
                  ))}
                </ol>
              </div>
            ) : (
              <div className="ta-pcards">
                {PEOPLE_CARDS.map((who, i) => {
                  const p = PEOPLE[who];
                  const spec = ATMOSPHERES[who] || {
                    badge: "4K Motion",
                    codec: "Metal GPU",
                    resolution: "Ultra HD",
                    telemetry: "Hardware Decoded",
                    status: "Ready",
                    dotColor: "#10b981",
                  };
                  return (
                    <motion.article
                      key={who}
                      className="ta-pcard"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.05 * i,
                        ease: [0.2, 0.7, 0.2, 1],
                      }}
                      aria-label={`${p.name}, living atmosphere`}
                    >
                      <header className="ta-pcard__head">
                        <div className="ta-pcard__meta">
                          <strong>{p.name}</strong>
                          <small>{p.role}</small>
                        </div>
                        <span className="ta-pcard__tag">
                          <span
                            className="ta-pcard__pulse"
                            style={{ backgroundColor: spec.dotColor }}
                          />
                          {spec.badge}
                        </span>
                      </header>

                      <div className="ta-pcard__preview">
                        {p.photo && (
                          <img
                            src={unsplash(p.photo, {
                              w: 720,
                              h: 405,
                              crop: "crop",
                              q: 85,
                            })}
                            alt={p.name}
                            loading="lazy"
                            className="ta-pcard__img"
                          />
                        )}
                        <div className="ta-pcard__overlay">
                          <span className="ta-pcard__codec">{spec.codec}</span>
                          <span className="ta-pcard__res">{spec.resolution}</span>
                        </div>
                      </div>

                      <footer className="ta-pcard__foot">
                        <span className="ta-pcard__telemetry">
                          {spec.telemetry}
                        </span>
                        <span className="ta-pcard__status">
                          <span
                            className="ta-pcard__status-dot"
                            style={{ backgroundColor: spec.dotColor }}
                          />
                          {spec.status}
                        </span>
                      </footer>
                    </motion.article>
                  );
                })}
                <motion.p
                  className="ta-pcards__sum"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                >
                  8 static backgrounds <span aria-hidden="true">→</span>
                  <span className="sr-only">become</span> 3 living atmospheres.
                  <span> Same Mac, pure cinematic serenity.</span>
                </motion.p>
              </div>
            )}
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
