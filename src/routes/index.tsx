import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

function Index() {
  const progressRef = useRef<number>(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          href="https://mail.google.com/mail/?view=cm&fs=1&to=build.fasttech@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
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
            <h2 className="font-display text-6xl md:text-[10rem] leading-[0.85] mt-6">
              Let's build<br />
              <span className="text-crimson italic font-jp">something</span><br />
              unforgettable.
            </h2>
            <div className="mt-16 glass rounded-3xl sm:rounded-full flex flex-col sm:inline-flex sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 p-6 sm:p-2 sm:pl-8 w-full sm:w-auto">
              <span className="text-sm tracking-widest uppercase">build.fasttech@gmail.com</span>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=build.fasttech@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ink text-paper px-8 py-4 rounded-full text-xs uppercase tracking-[0.3em] font-semibold hover:bg-crimson transition-colors text-center"
              >
                Start a project →
              </a>
            </div>
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
