import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import Avatar from "./Avatar.jsx";
import { PEOPLE, PEOPLE_CARDS } from "../data.js";
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

const STATIC_WALLPAPERS = [
  {
    id: "s1",
    who: "snowfall",
    name: "Snowfall in Forest",
    format: "Static HEIC (4K)",
    fps: "0 fps · Still",
    solar: "Frozen daylight",
    status: "Static Frame",
  },
  {
    id: "s2",
    who: "aurora",
    name: "Aurora Lake",
    format: "Static JPEG (4K)",
    fps: "0 fps · Still",
    solar: "No solar tracking",
    status: "Static Frame",
  },
  {
    id: "s3",
    who: "fuji",
    name: "Milky Way Over Fuji",
    format: "Static HEIC (4K)",
    fps: "0 fps · Still",
    solar: "Frozen night",
    status: "Static Frame",
  },
  {
    id: "s4",
    who: "patagonia",
    name: "Patagonia Flyover",
    format: "Static JPEG (4K)",
    fps: "0 fps · Still",
    solar: "Fixed exposure",
    status: "Static Frame",
  },
  {
    id: "s5",
    who: "shore",
    name: "Moonlit Shore",
    format: "Static PNG (4K)",
    fps: "0 fps · Still",
    solar: "Frozen dusk",
    status: "Static Frame",
  },
  {
    id: "s6",
    who: "sakura",
    name: "Sakura Light",
    format: "Static JPEG (4K)",
    fps: "0 fps · Still",
    solar: "Fixed color temp",
    status: "Static Frame",
  },
  {
    id: "s7",
    who: "dune",
    name: "Arrakis Dune",
    format: "Static JPEG (4K)",
    fps: "0 fps · Still",
    solar: "Static sunset",
    status: "Static Frame",
  },
  {
    id: "s8",
    who: "space",
    name: "Cosmic Earth Orbit",
    format: "Static PNG (4K)",
    fps: "0 fps · Still",
    solar: "No orbital motion",
    status: "Static Frame",
  },
];

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
                  <div className="ta-classic__bar-left">
                    <span className="ta-classic__bar-title">Standard macOS Desktop Library</span>
                    <span className="ta-classic__bar-count">8 Wallpapers</span>
                  </div>
                  <div className="ta-classic__bar-right">
                    <span>Rendering State: <em>Frozen at 0 fps · No Motion</em></span>
                  </div>
                </div>

                <div className="ta-classic__table-head" aria-hidden="true">
                  <span>WALLPAPER</span>
                  <span>FORMAT</span>
                  <span>FRAME RATE</span>
                  <span>SOLAR CYCLE</span>
                  <span>STATUS</span>
                </div>

                <ol
                  className="ta-classic__list"
                  role="list"
                  aria-label="Static wallpapers list"
                >
                  {STATIC_WALLPAPERS.map((item) => {
                    const p = PEOPLE[item.who];
                    return (
                      <motion.li
                        key={item.id}
                        layoutId={`ta-cmp-${item.id}`}
                        layout="position"
                        transition={move}
                        className="ta-cmp-row"
                      >
                        <div className="ta-cmp-row__primary">
                          <div className="ta-cmp-row__thumb">
                            {p?.photo ? (
                              <img
                                src={unsplash(p.photo, {
                                  w: 96,
                                  h: 64,
                                  crop: "crop",
                                  q: 75,
                                })}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <Avatar id={item.who} size={28} />
                            )}
                          </div>
                          <strong className="ta-cmp-row__name">{item.name}</strong>
                        </div>
                        <span className="ta-cmp-row__format">{item.format}</span>
                        <span className="ta-cmp-row__fps">{item.fps}</span>
                        <span className="ta-cmp-row__solar">{item.solar}</span>
                        <span className="ta-cmp-row__status">
                          <span className="ta-cmp-row__status-dot" />
                          {item.status}
                        </span>
                      </motion.li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <div className="ta-pcards">
                {PEOPLE_CARDS.map((who, i) => {
                  const p = PEOPLE[who];
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
                      </div>
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
