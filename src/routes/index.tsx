import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// Imported before DragonScene so drei's loading-manager patch is installed
// before DragonScene's module-scope useGLTF.preload fires — otherwise the
// big dragon GLB download wouldn't be tracked by the preloader's progress.
import { useProgress } from "@react-three/drei";
import { DragonScene } from "@/components/DragonScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FAST TECH — Premium Web Development for Big Brands" },
      {
        name: "description",
        content:
          "Fast Tech crafts cinematic 3D websites and fluid digital products for the world's most ambitious brands.",
      },
      { property: "og:title", content: "FAST TECH — Premium Web Development" },
      {
        property: "og:description",
        content: "Cinematic 3D experiences for ambitious brands.",
      },
    ],
  }),
  component: Index,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Web3Forms access key — delivers the contact form straight to our inbox
// without a backend. Read from the environment so no credential is committed;
// set VITE_WEB3FORMS_ACCESS_KEY in .env locally and in the Vercel project.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as
  | string
  | undefined;

const CONTACT_EMAIL = "build.fasttech@gmail.com";

// Shared styling for every contact-form field.
const FIELD_CLASS =
  "glass rounded-xl px-5 py-4 text-sm text-ink placeholder:text-ink/40 outline-none focus:ring-2 focus:ring-crimson/60";

/**
 * Full-screen branded loading screen. Holds the site behind it until every
 * asset tracked by THREE's loading manager (the ~20MB dragon GLB + the HDR
 * environment) has finished, then fades out to reveal a fully preloaded page.
 */
function Preloader() {
  const { active, loaded, total } = useProgress();
  const [shown, setShown] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);
  const realRef = useRef(0);

  // Real fraction of assets the loading manager has finished (item count).
  realRef.current = total > 0 ? (loaded / total) * 100 : 0;

  // Everything that registered with the manager has finished loading.
  const ready = total > 0 && loaded >= total && !active;

  // The dragon GLB is one huge item, so item-count progress jumps in big
  // steps. Ease a synthetic bar toward ~90% while loading so it never looks
  // frozen at 0%, then snap to 100% once everything is ready.
  useEffect(() => {
    if (ready) {
      setShown(100);
      return;
    }
    const id = setInterval(() => {
      setShown((s) =>
        Math.max(s, realRef.current, Math.min(90, s + (90 - s) * 0.1))
      );
    }, 280);
    return () => clearInterval(id);
  }, [ready]);

  // Fade out shortly after ready. Debounced via `ready` so a late-registering
  // asset (e.g. the HDR environment) cancels a premature hide.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setHidden(true), 650);
    return () => clearTimeout(t);
  }, [ready]);

  // Safety net: never trap the visitor behind the loader if an asset stalls.
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 15000);
    return () => clearTimeout(t);
  }, []);

  // After the fade, fully unmount the overlay so it can never linger over the
  // page (belt-and-suspenders in case an opacity transition is ever flaky).
  useEffect(() => {
    if (!hidden) return;
    const t = setTimeout(() => setRemoved(true), 800);
    return () => clearTimeout(t);
  }, [hidden]);

  // Lock scroll while the loader covers the page.
  useEffect(() => {
    if (hidden) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hidden]);

  // Early return must come AFTER every hook above (rules of hooks).
  if (removed) return null;

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${
        hidden ? "pointer-events-none" : ""
      }`}
      style={{
        background: "var(--gradient-paper)",
        opacity: hidden ? 0 : 1,
        transition: "opacity 0.7s ease",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-crimson animate-pulse" />
        <span className="font-display text-4xl md:text-6xl tracking-[0.25em] text-ink">
          FAST/TECH
        </span>
      </div>

      <span className="font-jp text-base text-ink/50 mt-4 mb-10">速い・技術</span>

      <div className="h-px w-56 md:w-72 overflow-hidden bg-ink/15">
        <div
          className="h-full bg-crimson transition-[width] duration-300 ease-out"
          style={{ width: `${shown}%` }}
        />
      </div>

      <span className="mt-4 text-[10px] uppercase tracking-[0.4em] text-ink/50">
        {Math.round(shown)}% · loading experience
      </span>
    </div>
  );
}

function Index() {
  const progressRef = useRef<number>(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [formStatus, setFormStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Send the contact form straight to our inbox via Web3Forms — no Gmail
  // compose window, the visitor never leaves the site.
  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!WEB3FORMS_ACCESS_KEY) {
      setFormStatus("error");
      return;
    }
    setFormStatus("sending");
    const data = new FormData(form);
    data.append("access_key", WEB3FORMS_ACCESS_KEY);
    data.append("subject", "New project inquiry — FAST TECH");
    data.append("from_name", "FAST TECH website");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setFormStatus("success");
        form.reset();
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      // Scroll progress drives the dragon's transformation
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "+=1800",
        scrub: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      // Hero title parallax — slides up from behind canvas
      gsap.fromTo(
        ".hero-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.6,
          ease: "expo.out",
          stagger: 0.12,
          delay: 0.2,
        }
      );

      // On scroll, title pushes further up & fades
      gsap.to(".hero-title", {
        yPercent: -40,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=800",
          scrub: 1,
        },
      });

      // Reveal glass cards as they enter
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 80%" },
          }
        );
      });
    });

    return () => ctx.revert();
  }, [mounted]);

  return (
    <div className="relative">
      {/* Loading screen — holds until the dragon + environment are ready */}
      <Preloader />

      {/* Fixed 3D background */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {mounted && <DragonScene progress={progressRef} />}
      </div>

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="h-2 w-2 rounded-full bg-crimson animate-pulse" />
          <span className="font-display text-base md:text-xl tracking-[0.15em] md:tracking-[0.3em]">FAST/TECH</span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-sm uppercase tracking-[0.2em] text-ink/70">
          <a className="hover:text-crimson transition-colors" href="#work">Work</a>
          <a className="hover:text-crimson transition-colors" href="#services">Services</a>
          <a className="hover:text-crimson transition-colors" href="#process">Process</a>
          <a className="hover:text-crimson transition-colors" href="#contact">Contact</a>
        </nav>
        <a
          href="#contact"
          className="glass shrink-0 whitespace-nowrap px-3 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] font-semibold hover:bg-crimson hover:text-paper transition-all"
        >
          Start a project
        </a>
      </header>

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      >
        {/* JP vertical marker */}
        <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-3 text-ink/50">
          <span className="font-jp text-2xl [writing-mode:vertical-rl]">速い・技術</span>
          <span className="h-16 w-px bg-ink/30" />
          <span className="text-[10px] tracking-[0.4em] uppercase">est. mmxxv</span>
        </div>

        {/* Right vertical info */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 flex-col items-end gap-3 text-ink/50">
          <span className="text-[10px] tracking-[0.4em] uppercase">[ 001 / dragon ]</span>
          <span className="h-16 w-px bg-ink/30" />
          <span className="font-jp text-2xl [writing-mode:vertical-rl]">龍</span>
        </div>

        {/* Massive title BEHIND canvas via z-index trick:
            canvas is z-10, but we'll use mix-blend-mode + place title at z-20 with mask?
            For the "emerging from behind dragon" effect, we render title at z-0 (under canvas)
            so dragon's silhouette occludes it. */}
        <div
          ref={titleRef}
          className="hero-title absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none select-none"
        >
          <div className="overflow-hidden">
            <div className="hero-line font-display text-[18vw] leading-[0.85] text-ink">
              FAST
            </div>
          </div>
          <div className="overflow-hidden -mt-[2vw]">
            <div className="hero-line font-display text-[18vw] leading-[0.85] text-crimson">
              TECH
            </div>
          </div>
        </div>

        {/* Foreground micro-copy (in front of canvas) */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-xs uppercase tracking-[0.4em] text-ink/60 mb-4"
          >
            Cinematic web experiences · for ambitious brands
          </motion.p>
          <div className="flex items-center justify-center gap-2 text-ink/40">
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="h-8 w-px overflow-hidden">
              <div className="h-2 w-px bg-crimson animate-scroll-hint" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT — sits in front of fixed dragon canvas */}
      <main className="relative z-20">
        {/* Intro band */}
        <section id="work" className="min-h-screen px-8 md:px-20 py-32 flex items-center">
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4 reveal">
              <span className="font-jp text-crimson text-sm tracking-widest">— 序章 / prologue</span>
              <h2 className="font-display text-6xl md:text-7xl mt-4 leading-[0.9]">
                Built for the<br />
                <span className="text-crimson">unreasonable</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 reveal">
              <div className="glass rounded-3xl p-10">
                <p className="text-xl md:text-2xl leading-relaxed text-ink/85">
                  Fast Tech is a small studio of engineers, motion designers and 3D
                  artists shipping flagship websites for category-defining brands.
                  We blend real-time WebGL, restrained typography, and ruthless
                  performance budgets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="min-h-screen px-8 md:px-20 py-32">
          <div className="max-w-7xl mx-auto">
            <div className="reveal flex items-end justify-between mb-20">
              <div>
                <span className="font-jp text-crimson text-sm tracking-widest">— 仕事 / craft</span>
                <h2 className="font-display text-7xl md:text-8xl mt-4 leading-[0.9]">
                  What we make
                </h2>
              </div>
              <span className="hidden md:block text-xs uppercase tracking-[0.3em] text-ink/50">
                [ four disciplines ]
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  jp: "体験",
                  no: "01",
                  title: "Immersive 3D Sites",
                  body: "Photoreal WebGL stages, scroll-driven cinematography, real-time product configurators.",
                },
                {
                  jp: "製品",
                  no: "02",
                  title: "Flagship Products",
                  body: "End-to-end design and engineering for hero pages, brand campaigns, and product launches.",
                },
                {
                  jp: "運動",
                  no: "03",
                  title: "Motion Systems",
                  body: "GSAP + Framer Motion choreography systems — fluid, restrained, never gratuitous.",
                },
                {
                  jp: "性能",
                  no: "04",
                  title: "Performance Audits",
                  body: "Sub-second TTI on every device. Core Web Vitals as a design constraint, not an afterthought.",
                },
              ].map((s) => (
                <div
                  key={s.no}
                  className="reveal glass rounded-3xl p-10 group hover:bg-ink hover:text-paper transition-colors duration-500 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-8">
                    <span className="font-display text-5xl text-crimson">{s.no}</span>
                    <span className="font-jp text-3xl opacity-50 group-hover:opacity-100 transition-opacity">{s.jp}</span>
                  </div>
                  <h3 className="font-display text-4xl mb-4">{s.title}</h3>
                  <p className="text-ink/75 group-hover:text-paper/75 transition-colors text-lg leading-relaxed">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process band — wide floating text */}
        <section id="process" className="min-h-screen px-8 md:px-20 py-32 flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="reveal text-center mb-20">
              <span className="font-jp text-crimson text-sm tracking-widest">— 過程 / process</span>
              <h2 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">
                Discover · Design<br /><span className="text-stroke">Ship · Iterate</span>
              </h2>
            </div>

            <div className="reveal glass-dark rounded-[2rem] p-14 grid md:grid-cols-4 gap-10">
              {[
                ["Discovery", "Brand audit, technical scoping, mood direction."],
                ["Design", "Visual system, motion language, 3D R&D."],
                ["Build", "Engineering, integration, performance work."],
                ["Launch", "QA, analytics, ongoing optimisation."],
              ].map(([t, d]) => (
                <div key={t}>
                  <div className="font-display text-3xl text-paper">{t}</div>
                  <div className="text-paper/70 mt-3 text-sm leading-relaxed">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="min-h-screen px-8 md:px-20 py-32 flex items-center">
          <div className="max-w-5xl mx-auto text-center reveal">
            <span className="font-jp text-crimson text-sm tracking-widest">— 連絡 / contact</span>
            <h2 className="font-display text-5xl sm:text-6xl md:text-[10rem] leading-[0.85] mt-6">
              Let's build<br />
              <span className="text-crimson">something</span><br />
              unforgettable.
            </h2>

            {/* On-site contact form — sends straight to our inbox */}
            <form
              onSubmit={handleContactSubmit}
              className="mt-12 sm:mt-16 w-full max-w-2xl mx-auto text-left"
            >
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className={FIELD_CLASS}
                />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Your email"
                  className={FIELD_CLASS}
                />
                <input
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Phone number"
                  className={FIELD_CLASS}
                />
                <input
                  name="company"
                  autoComplete="organization"
                  placeholder="Company / brand name"
                  className={FIELD_CLASS}
                />
                <input
                  name="website"
                  type="url"
                  autoComplete="url"
                  placeholder="Current website (if any)"
                  className={`${FIELD_CLASS} sm:col-span-2`}
                />
                <input
                  name="company_about"
                  placeholder="What does your company do?"
                  className={`${FIELD_CLASS} sm:col-span-2`}
                />
                <select
                  name="project_type"
                  defaultValue=""
                  className={`${FIELD_CLASS} cursor-pointer`}
                >
                  <option value="" disabled>
                    What do you need?
                  </option>
                  <option>New website</option>
                  <option>Website redesign</option>
                  <option>Web app / product</option>
                  <option>Brand + website</option>
                  <option>Something else</option>
                </select>
                <select
                  name="wants_3d"
                  defaultValue=""
                  className={`${FIELD_CLASS} cursor-pointer`}
                >
                  <option value="" disabled>
                    Want a 3D experience?
                  </option>
                  <option>Yes — go cinematic</option>
                  <option>Maybe / not sure</option>
                  <option>No, keep it minimal</option>
                </select>
                <select
                  name="timeline"
                  defaultValue=""
                  className={`${FIELD_CLASS} cursor-pointer sm:col-span-2`}
                >
                  <option value="" disabled>
                    Ideal timeline
                  </option>
                  <option>As soon as possible</option>
                  <option>1–3 months</option>
                  <option>3–6 months</option>
                  <option>Flexible</option>
                </select>
              </div>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Anything else about your project?"
                className={`${FIELD_CLASS} mt-3 sm:mt-4 w-full resize-none`}
              />
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs tracking-widest uppercase text-ink/50">
                  {CONTACT_EMAIL}
                </span>
                <button
                  type="submit"
                  disabled={formStatus === "sending" || formStatus === "success"}
                  className="w-full sm:w-auto bg-ink text-paper px-8 py-4 rounded-full text-xs uppercase tracking-[0.3em] font-semibold hover:bg-crimson transition-colors text-center disabled:opacity-60"
                >
                  {formStatus === "sending"
                    ? "Sending…"
                    : formStatus === "success"
                      ? "Sent ✓"
                      : "Send message →"}
                </button>
              </div>
              {formStatus === "success" && (
                <p className="mt-4 text-sm text-crimson">
                  Thanks — we'll be in touch shortly.
                </p>
              )}
              {formStatus === "error" && (
                <p className="mt-4 text-sm text-crimson">
                  Something went wrong. Please email us directly at {CONTACT_EMAIL}.
                </p>
              )}
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 md:px-20 py-12 border-t border-ink/10 flex flex-wrap justify-between items-center text-xs uppercase tracking-[0.3em] text-ink/50">
          <span>© MMXXV Fast Tech Studio</span>
          <span className="font-jp text-base">速い技術 — tokyo · london · ny</span>
          <span>v1.0 · crafted with intent</span>
        </footer>
      </main>
    </div>
  );
}
