"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import { contentTypeLabel, formatPostMonth, sectionLabel, type ManagedPost } from "./content";
import { publishedPosts } from "./posts";

type Page = "home" | "about" | "tech" | "commercial" | "cultures" | "fieldnotes";

const nav: { label: string; page: Page }[] = [
  { label: "HOME", page: "home" },
  { label: "ABOUT", page: "about" },
  { label: "TECH", page: "tech" },
  { label: "COMMERCIAL", page: "commercial" },
  { label: "CULTURES", page: "cultures" },
  { label: "ONLY FIELDNOTES", page: "fieldnotes" },
];

const places = [
  {
    name: "Shenyang",
    country: "China",
    period: "2012–2018",
    coordinates: [123.43, 41.8] as [number, number],
    organisation: "Vanke · V-Learn",
    role: "Market expansion · Partner acquisition · Strategic operations",
    note: "At V-Learn, Jade held two parallel responsibilities. She helped take seven new sites from market opportunity to opening, then stayed accountable for strategic operations and revenue performance as the model scaled.",
    major: true,
  },
  {
    name: "Haikou",
    country: "China",
    period: "2018–2020",
    coordinates: [110.2, 20.04] as [number, number],
    organisation: "Longfor · Hainan Regional Company",
    role: "One operating region across island and mainland",
    note: "As an early member of Longfor Hainan, Jade built and localised the regional administration system, helped standardise business hospitality and connected group policy with local operating reality.",
    major: true,
  },
  {
    name: "Shenzhen",
    country: "China",
    period: "2020–2022",
    coordinates: [114.06, 22.54] as [number, number],
    organisation: "Tencent Meet · Multimedia Lab · Tencent Cloud AI",
    role: "User signals · China and US R&D coordination · Cloud AI storytelling",
    note: "At Tencent, Jade owned an internal-user feedback channel for Tencent Meet, coordinated a distributed China and US R&D team and connected technical work with stakeholders across Cloud AI programmes.",
    major: true,
  },
  {
    name: "Zhanjiang",
    country: "China",
    period: "Regional chapter",
    coordinates: [110.36, 21.27] as [number, number],
    organisation: "Regional operations",
    role: "Western Guangdong",
    note: "Part of a wider cross-city regional portfolio.",
    major: false,
  },
  {
    name: "Maoming",
    country: "China",
    period: "Regional chapter",
    coordinates: [110.93, 21.66] as [number, number],
    organisation: "Regional operations",
    role: "Western Guangdong",
    note: "Part of a wider cross-city regional portfolio.",
    major: false,
  },
  {
    name: "Beihai",
    country: "China",
    period: "Regional chapter",
    coordinates: [109.12, 21.49] as [number, number],
    organisation: "Regional operations",
    role: "Guangxi coast",
    note: "Part of a wider cross-city regional portfolio.",
    major: false,
  },
  {
    name: "Sheffield",
    country: "UK",
    period: "2023–2024",
    coordinates: [-1.47, 53.38] as [number, number],
    organisation: "University of Sheffield",
    role: "MA Intercultural Communication · High Distinction dissertation",
    note: "Jade turned years of cross-border work into a rigorous research practice, using qualitative interviews and quantitative analysis to examine how intercultural competence enables leadership in culturally diverse workplaces.",
    major: true,
  },
  {
    name: "London",
    country: "UK",
    period: "Current",
    coordinates: [-0.13, 51.51] as [number, number],
    organisation: "London, UK",
    role: "Global mobility · International business · AI-enabled work",
    note: "From London, Jade is combining market insight, storytelling and operating judgement while remaining open to international work and relocation.",
    major: true,
  },
];

const routes: [[number, number], [number, number]][] = [
  [
    [123.43, 41.8],
    [110.2, 20.04],
  ],
  [
    [110.2, 20.04],
    [114.06, 22.54],
  ],
  [
    [114.06, 22.54],
    [-1.47, 53.38],
  ],
  [
    [-1.47, 53.38],
    [-0.13, 51.51],
  ],
];

const mapWidth = 960;
const mapHeight = 470;
const projection = geoEqualEarth().fitExtent(
  [
    [12, 12],
    [mapWidth - 12, mapHeight - 12],
  ],
  { type: "Sphere" },
);
const countries: any[] = (feature(
  world as never,
  (world as unknown as { objects: { countries: never } }).objects.countries,
) as unknown as { features: any[] }).features;
const path = geoPath(projection);
const focusCountries = countries.filter((country) => ["156", "826"].includes(String(country.id)));
const countryLabels = [
  { name: "CHINA", coordinates: [94, 33] as [number, number] },
  { name: "UNITED KINGDOM", coordinates: [-3.5, 58.4] as [number, number] },
];

function routePath([start, end]: [[number, number], [number, number]]) {
  const a = projection(start)!;
  const b = projection(end)!;
  const bend = Math.max(18, Math.abs(b[0] - a[0]) * 0.18);
  return `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - bend} ${b[0]},${b[1]}`;
}

type Camera = { x: number; y: number; scale: number };

function journeyCamera(): Camera {
  const [[minX, minY], [maxX, maxY]] = path.bounds({
    type: "FeatureCollection",
    features: focusCountries,
  } as never);
  const paddingLeft = 78;
  const paddingRight = 78;
  const paddingTop = 70;
  const paddingBottom = 70;
  const scale = Math.min(
    2.55,
    (mapWidth - paddingLeft - paddingRight) / (maxX - minX),
    (mapHeight - paddingTop - paddingBottom) / (maxY - minY),
  );
  return {
    scale,
    x: paddingLeft - minX * scale,
    y: paddingTop + (mapHeight - paddingTop - paddingBottom - (maxY - minY) * scale) / 2 - minY * scale,
  };
}

function InteractiveCareerMap() {
  const initialCamera = useMemo(() => journeyCamera(), []);
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [activePlace, setActivePlace] = useState(places[7]);
  const [cardOpen, setCardOpen] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<(typeof places)[number] | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; camera: Camera } | null>(null);

  const zoomAt = (factor: number, clientX?: number, clientY?: number, element?: SVGSVGElement) => {
    setCamera((current) => {
      const nextScale = Math.max(0.72, Math.min(8, current.scale * factor));
      const rect = element?.getBoundingClientRect();
      const px = rect && clientX !== undefined ? ((clientX - rect.left) / rect.width) * mapWidth : mapWidth / 2;
      const py = rect && clientY !== undefined ? ((clientY - rect.top) / rect.height) * mapHeight : mapHeight / 2;
      const worldX = (px - current.x) / current.scale;
      const worldY = (py - current.y) / current.scale;
      return { scale: nextScale, x: px - worldX * nextScale, y: py - worldY * nextScale };
    });
  };

  const focusPlace = (place: (typeof places)[number], openCard: boolean) => {
    setActivePlace(place);
    if (openCard) setCardOpen(true);
    const point = projection(place.coordinates)!;
    setCamera((current) => ({ ...current, x: mapWidth / 2 - point[0] * current.scale, y: mapHeight / 2 - point[1] * current.scale }));
  };

  const selectPlace = (place: (typeof places)[number]) => focusPlace(place, true);

  return (
    <section className="career-map" aria-labelledby="career-map-title">
      <div className="career-map-heading">
        <div><p className="index">MY GLOBAL STORY</p><h2 id="career-map-title">Career Shaped Across Borders</h2></div>
        <button className="journey-reset" onClick={() => setCamera(initialCamera)}>View my journey</button>
      </div>
      <div className="map-stage">
        <svg
          className="map-base"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          role="img"
          aria-label="Interactive career map connecting Jade's work and study locations in China and the UK"
          onWheel={(event) => { event.preventDefault(); zoomAt(event.deltaY < 0 ? 1.18 : 0.84, event.clientX, event.clientY, event.currentTarget); }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()];
              gesture.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), camera };
            }
          }}
          onPointerMove={(event) => {
            const previous = pointers.current.get(event.pointerId);
            if (!previous) return;
            const rect = event.currentTarget.getBoundingClientRect();
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.current.size === 1) {
              const dx = ((event.clientX - previous.x) / rect.width) * mapWidth;
              const dy = ((event.clientY - previous.y) / rect.height) * mapHeight;
              setCamera((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
            } else if (pointers.current.size === 2 && gesture.current) {
              const [a, b] = [...pointers.current.values()];
              const distance = Math.hypot(a.x - b.x, a.y - b.y);
              const scale = Math.max(0.72, Math.min(8, gesture.current.camera.scale * distance / gesture.current.distance));
              setCamera({ ...gesture.current.camera, scale });
            }
          }}
          onPointerUp={(event) => { pointers.current.delete(event.pointerId); gesture.current = null; }}
          onPointerCancel={(event) => { pointers.current.delete(event.pointerId); gesture.current = null; }}
        >
          <rect width={mapWidth} height={mapHeight} className="ocean" />
          <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
            {countries.map((country, countryIndex) => {
              const countryId = String(country.id);
              const focusClass = countryId === "156" ? "country-focus country-china" : countryId === "826" ? "country-focus country-uk" : "";
              return <path key={`${countryId}-${countryIndex}`} d={path(country) || ""} className={`country ${focusClass}`} />;
            })}
            {countryLabels.map((country) => {
              const point = projection(country.coordinates)!;
              return (
                <g key={country.name} className="country-label" transform={`translate(${point[0]} ${point[1]}) scale(${1 / camera.scale})`}>
                  <text textAnchor="middle">{country.name}</text>
                </g>
              );
            })}
            {places.map((place) => {
              const point = projection(place.coordinates)!;
              const selected = activePlace.name === place.name;
              return (
                <g key={place.name} className={`svg-place ${place.major ? "major" : "minor"} ${selected ? "selected" : ""}`} transform={`translate(${point[0]} ${point[1]}) scale(${1 / camera.scale})`} onMouseEnter={() => place.major && setHoveredPlace(place)} onMouseLeave={() => setHoveredPlace(null)} onClick={place.major ? (event) => { event.stopPropagation(); selectPlace(place); } : undefined} role={place.major ? "button" : undefined} tabIndex={place.major ? 0 : undefined} aria-label={place.major ? `${place.name}, ${place.period}` : `${place.name}, regional location`} onKeyDown={place.major ? (event) => { if (event.key === "Enter" || event.key === " ") selectPlace(place); } : undefined}>
                  <circle r={place.major ? 6 : 4} />
                  {place.major && hoveredPlace?.name === place.name && <text x="10" y="-9">{place.name} · {place.period}</text>}
                </g>
              );
            })}
            {routes.map((route, index) => <path key={index} className="travel-route" d={routePath(route)} />)}
          </g>
        </svg>
        <div className="map-controls" aria-label="Map zoom controls">
          <button onClick={() => zoomAt(1.25)} aria-label="Zoom in">＋</button>
          <button onClick={() => zoomAt(0.8)} aria-label="Zoom out">−</button>
        </div>
        <article className={`map-card ${cardOpen ? "open" : ""}`} aria-live="polite" aria-hidden={!cardOpen}>
          <button className="map-card-close" aria-label="Close place details" onClick={() => setCardOpen(false)}>×</button>
          <p className="index">{activePlace.period}</p>
          <h3>{activePlace.name}, {activePlace.country}</h3>
          <strong>{activePlace.organisation}</strong>
          <p>{activePlace.role}</p>
          <p>{activePlace.note}</p>
        </article>
      </div>
      <div className="career-timeline" aria-label="Career journey timeline">
        {places.filter((place) => place.major).map((place) => <button key={place.name} className={activePlace.name === place.name ? "active" : ""} onMouseEnter={() => focusPlace(place, false)} onFocus={() => focusPlace(place, false)} onClick={() => selectPlace(place)}><span>{place.period}</span>{place.name}</button>)}
      </div>
      <p className="map-hint">Drag to explore · Scroll or pinch to zoom · Click a city to see its context.</p>
    </section>
  );
}

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [mobile, setMobile] = useState(false);
  const [likedHome, setLikedHome] = useState(false);
  const managedPosts = publishedPosts;

  const archiveMonths = useMemo(() => Array.from(new Set(["2026-08", ...managedPosts.map((post) => post.publishedAt.slice(0, 7))])).sort().reverse(), [managedPosts]);

  const go = (p: Page, anchor?: string) => {
    setPage(p);
    setMobile(false);
    window.setTimeout(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <main>
      <header className="site-header">
        <a className="subscribe-button" href="mailto:jadeli0630@outlook.com">CONTACT</a>
        <button
          className="menu-button"
          onClick={() => setMobile(!mobile)}
          aria-label="Toggle menu"
        >
          {mobile ? "CLOSE" : "MENU"}
        </button>
        <nav
          className={mobile ? "nav open" : "nav"}
          aria-label="Main navigation"
        >
          {nav.map((i) => (
            <button
              className={page === i.page ? "active" : ""}
              key={i.page}
              onClick={() => go(i.page)}
            >
              {i.label}
            </button>
          ))}
        </nav>
      </header>

      {page === "home" && (
        <>
          <section className="hero shell">
            <div className="hero-copy">
              <img className="hero-portrait" src="/assets/jade-virtual-ip.webp" alt="Jade Li virtual IP avatar" />
              <h1>JADE LI</h1>
              <p className="identity-line">
                <span aria-hidden="true">♋️</span>{" "}
                <span className="dot">·</span> INTJ{" "}
                <span className="dot">·</span> She/Her
              </p>
              <div className="profile-meta">
                <p>
                  <span aria-hidden="true">📍</span>
                  <b>Location:</b> London, UK
                </p>
                <p>
                  <span aria-hidden="true">✉</span>
                  <b>Email:</b>{" "}
                  <a href="mailto:jadeli0630@outlook.com">
                    jadeli0630@outlook.com
                  </a>
                </p>
                <p>
                  <span className="linkedin-icon" aria-hidden="true">
                    in
                  </span>
                  <b>LinkedIn:</b>{" "}
                  <a
                    href="https://www.linkedin.com/in/yujie630"
                    target="_blank"
                    rel="noreferrer"
                  >
                    linkedin.com/in/yujie630
                  </a>
                </p>
                <p>
                  <svg className="github-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.63 5.47 7.7.4.08.55-.18.55-.39 0-.19-.01-.83-.01-1.5-2.01.38-2.53-.5-2.69-.96-.09-.23-.48-.96-.82-1.15-.28-.15-.68-.53-.01-.54.63-.01 1.08.59 1.23.83.72 1.23 1.87.88 2.33.67.07-.53.28-.88.51-1.08-1.78-.21-3.64-.91-3.64-4.02 0-.89.31-1.62.82-2.19-.08-.21-.36-1.04.08-2.16 0 0 .67-.21 2.2.84A7.45 7.45 0 0 1 8 4.97c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.12.16 1.95.08 2.16.51.57.82 1.3.82 2.19 0 3.12-1.87 3.81-3.65 4.02.29.25.54.74.54 1.5 0 1.08-.01 1.95-.01 2.22 0 .22.15.47.55.39A8.14 8.14 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z" />
                  </svg>
                  <b>GitHub:</b>{" "}
                  <a
                    href="https://github.com/jadeli630"
                    target="_blank"
                    rel="noreferrer"
                  >
                    github.com/jadeli630
                  </a>
                </p>
                <p>
                  <span aria-hidden="true">👣</span>
                  <b>Countries:</b> China → UK
                </p>
              </div>
            </div>
            <div className="portrait-column">
              <InteractiveCareerMap />
            </div>
          </section>

          <section className="home-feed shell" aria-label="Featured content and post archive">
            <div className="featured-feed">
              <h2>Selected posts and work</h2>
              <div className="featured-list">
                <button onClick={() => go("tech", "digital-ecosystem-summit")}><span className="featured-section">TECH</span><strong>Tencent Digital Ecosystem Summit 2021</strong><time className="featured-date" dateTime="2026-08">Aug, 2026</time><span>A COVID operations challenge became a secure digital workflow for one of Tencent&apos;s largest hybrid business events.</span></button>
                <button onClick={() => go("tech", "charity-livestream-case")}><span className="featured-section">TECH</span><strong>Connecting Livestream, E-commerce and Fulfilment into One Digital Workflow</strong><time className="featured-date" dateTime="2026-08">Aug, 2026</time><span>A COVID constraint became a connected charity workflow spanning participant management, livestream, commerce, transaction data and offline fulfilment.</span></button>
                <button onClick={() => go("commercial", "vlearn-case")}><span className="featured-section">COMMERCIAL</span><strong>Scaling V-Learn Through Market Expansion and a Winning Operating Model</strong><time className="featured-date" dateTime="2026-08">Aug, 2026</time><span>A repeatable expansion system and disciplined strategic operations turned a new education business into measurable commercial performance.</span></button>
                <button onClick={() => go("commercial", "longfor-case")}><span className="featured-section">COMMERCIAL</span><strong>Building Longfor Hainan from Island Base to Mainland Reach</strong><time className="featured-date" dateTime="2026-08">Aug, 2026</time><span>A high-conviction headquarters decision supported a new regional company expanding from Hainan to the mainland.</span></button>
                {managedPosts.filter((post) => post.featured).map((post) => (
                  <button key={post.id} onClick={() => go(post.section, post.slug)}><span className="featured-section">{sectionLabel(post.section)}</span><strong>{post.title}</strong><time className="featured-date" dateTime={post.publishedAt.slice(0, 7)}>{formatPostMonth(post.publishedAt)}</time><span>{post.summary}</span></button>
                ))}
              </div>
            </div>
            <aside className="post-sidebar">
              <section className="share-block">
                <strong className="share-label">Share this:</strong>
                <div className="share-buttons">
                  <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fjade-li.pages.dev" target="_blank" rel="noreferrer"><span className="share-icon x-icon" aria-hidden="true">𝕏</span><span>X</span></a>
                  <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fjade-li.pages.dev" target="_blank" rel="noreferrer"><span className="share-icon facebook-icon" aria-hidden="true">f</span><span>Facebook</span></a>
                </div>
                <div className="like-row">
                  <button className={likedHome ? "star-like liked" : "star-like"} onClick={() => setLikedHome(!likedHome)} aria-pressed={likedHome}><span className="share-icon" aria-hidden="true">☆</span>{likedHome ? "Liked" : "Like"}</button>
                  <span className="like-audience" aria-live="polite">{likedHome && <><img src="/assets/jade-li-chongqing.jpg" alt="" /><span>1 like</span></>}</span>
                </div>
              </section>
              <section><h3>Recent Posts</h3>{managedPosts.length ? <div className="recent-post-list">{managedPosts.slice(0, 4).map((post) => <button key={post.id} onClick={() => go(post.section, post.slug)}>{post.title}<small>{formatPostMonth(post.publishedAt)}</small></button>)}</div> : <p className="empty-list">New editor-created posts will appear here.</p>}</section>
              <section><h3>Archives</h3><label className="archive-select"><span className="sr-only">Select archive month</span><select defaultValue=""><option value="" disabled>Select Month</option>{archiveMonths.map((month) => <option key={month} value={month}>{formatPostMonth(`${month}-01`)}</option>)}</select></label></section>
            </aside>
          </section>
          <div className="shell"><CommentBox /></div>
        </>
      )}

      {page === "about" && (
        <AboutPage onNavigate={go} />
      )}
      {page === "tech" && (
        <TechPage posts={managedPosts.filter((post) => post.section === "tech")} archiveMonths={archiveMonths} />
      )}
      {page === "commercial" && (
        <CommercialPage posts={managedPosts.filter((post) => post.section === "commercial")} archiveMonths={archiveMonths} />
      )}
      {page === "cultures" && <CulturesPage posts={managedPosts.filter((post) => post.section === "cultures")} archiveMonths={archiveMonths} />}
      {page === "fieldnotes" && <FieldnotesPage posts={managedPosts.filter((post) => post.section === "fieldnotes")} archiveMonths={archiveMonths} />}

      <footer>
        <p>© Jade Li</p>
        <div>
          <a href="mailto:jadeli0630@outlook.com">EMAIL</a>
          <a href="https://www.linkedin.com/in/yujie630">LINKEDIN</a>
        </div>
      </footer>

    </main>
  );
}

function AboutPage({ onNavigate }: { onNavigate: (page: Page, anchor?: string) => void }) {
  return (
    <section className="inner-page about-page shell">
      <div className="about-heading">
        <p className="index">ABOUT</p>
        <h1>About Jade</h1>
        <p>Jade brings market insight, storytelling and operational judgement together to move ambiguous work from possibility to impact.</p>
      </div>

      <div className="about-opening">
        <figure className="about-portrait">
          <img src="/assets/jade-li-chongqing.jpg" alt="Portrait of Jade" />
        </figure>

        <div className="about-story">
          <section data-copy-status="locked">
            <p className="index">TECH</p>
            <h2>Troubleshooting Complexity, Building Workable Solutions</h2>
            <div className="about-tags" aria-label="Technology context">
              <span>storytelling</span><span>Influence without authority</span><span>B2B SaaS</span><span>solution owner</span><span>troubleshooting</span><span>value translator</span><span>needs discovery</span><span>product sense</span>
            </div>
            <p>Jade joined Tencent in 2020, as nationwide home working accelerated demand for <span className="accent-text">Tencent Meet</span> (China&apos;s answer to <span className="accent-text">Zoom</span>) and compressed the product cycle to roughly two weeks. As an internal communication bridge, she used early internal access to identify recurring friction and emerging needs, translated those signals into product-ready context, and kept Product and R&amp;D connected to the realities of use. This added an earlier, structured signal to the wider feedback loop, helping the team anticipate practical demand and respond at speed.</p>
            <p>Meanwhile, Jade coordinated work across <span className="accent-text">Multimedia Lab</span>&apos;s China and US teams. Following Tencent Cloud&apos;s reorganisation, she worked at the interface between clients and the <span className="accent-text">Tencent Cloud AI team</span>. By coordinating visits and working sessions, she connected business questions with the relevant Product and R&amp;D expertise, preserved context across organisational boundaries and helped conversations move towards workable solutions.</p>
            <button className="case-link" onClick={() => onNavigate("tech")}>Explore the cases <span aria-hidden="true">→</span></button>
          </section>

          <section>
            <p className="index">CULTURES</p>
            <h2>Living and Working Across Cultures</h2>
            <div className="about-tags" aria-label="Academic context">
              <span>Intercultural Leadership</span><span>Anthropology</span><span>Qualitative Research</span><span>Digital Business</span><span>Localisation</span><span>Global Mobility</span>
            </div>
            <p>Jade moved from China to the UK in 2023 to study Intercultural Communication and experience cultural difference as part of everyday life. She brought her professional experience into the classroom, then used study to build a more thoughtful framework for understanding what she had encountered at work. She remains curious about how people make meaning across cultures and continues learning how to listen, question assumptions and adapt within culturally diverse environments.</p>
          </section>

          <section>
            <p className="index">COMMERCIAL</p>
            <h2>Scaling Markets and Building Operating Advantage</h2>
            <div className="about-tags" aria-label="Commercial context">
              <span>Scaling</span><span>Expansion</span><span>Partnerships</span><span>Research</span><span>Operations</span><span>Commercial Judgement</span><span>Localisation</span><span>B2C</span><span>B2G</span>
            </div>
            <p>Jade built her commercial foundation at Vanke · Shenyang, where she was born. As V-Learn&apos;s second team member, she grew with the business through two roles. As expansion PM, she developed <span className="accent-text">a repeatable 0 → 1 → scale model</span>. As operations supervisor, she helped the team respond to performance and saw the business achieve <span className="accent-text">three-year ROI payback</span> and <span className="accent-text">more than RMB 10 million in net revenue in H1 2016</span>.</p>
            <p>She then moved from China&apos;s northeast to its southern edge to join Longfor Hainan as an early team member, bringing her 0-to-1 experience into a new business setting and a new regional challenge. She built and localised the administration system across Hainan and three mainland cities. For the Haikou headquarters, she introduced a component-based interior delivery approach, with elements manufactured off site and assembled on site. The project saved <span className="accent-text">15% of budget</span> and <span className="accent-text">10% of time</span>, earned a formal Group commendation and secured an <span className="accent-text">RMB 100,000 award</span> for the company.</p>
            <div className="case-links">
              <button className="case-link" onClick={() => onNavigate("commercial")}>Explore the cases <span aria-hidden="true">→</span></button>
            </div>
          </section>
        </div>
      </div>

      <div className="about-contact">
        <p>Jade can be reached at <a href="mailto:jadeli0630@outlook.com">jadeli0630@outlook.com</a> or on <a href="https://www.linkedin.com/in/yujie630" target="_blank" rel="noreferrer">LinkedIn</a>.</p>
      </div>

      <CommentBox />
    </section>
  );
}

function TechPage({ posts, archiveMonths }: { posts: ManagedPost[]; archiveMonths: string[] }) {
  return (
    <PageShell
      eyebrow="TECH"
      title="Troubleshooting Complexity, Building Workable Solutions"
      intro="These cases show how Jade identifies the real constraint, reframes the problem and coordinates people, data and technology into solutions that can operate under pressure."
      roomAfterIntro
      archiveMonths={archiveMonths}
    >
      <article className="case-study compact-case" id="digital-ecosystem-summit">
        <header className="case-study-header">
          <p className="index">FEATURED CASE</p>
          <h2>Tencent Digital Ecosystem Summit · Wuhan 2021</h2>
          <div className="about-tags" aria-label="Case context">
            <span>Troubleshooting</span><span>Problem Reframing</span><span>Solution Ownership</span><span>Workflow Design</span><span>Data Governance</span><span>Client Data Security</span><span>Influence Without Authority</span><span>Cross Functional Delivery</span><span>Agile Project Management</span><span>COVID Operations</span>
          </div>
          <PostDate />
        </header>
        <CaseDisclosure initiallyOpen>
          <div className="case-facts" aria-label="Case facts">
            <div><strong>3</strong><span>Tencent Digital Ecosystem Summit</span></div>
            <div><strong>1</strong><span>Edition delivered during COVID-19</span></div>
            <div><strong>7</strong><span>PMO team · air, rail and hotel bookings</span></div>
            <div><strong>10,000</strong><span>Attendees</span></div>
          </div>
          <div className="case-media-strip" aria-label="Tencent Digital Ecosystem Summit 2021 imagery">
            <figure className="case-media-secondary">
              <img src="/assets/tencent-summit-venue.jpeg" alt="Wuhan Optics Valley Convention and Exhibition Center prepared for the 2021 summit" />
            </figure>
            <figure className="case-media-primary">
              <img src="/assets/tencent-summit-stage.jpeg" alt="Tencent Digital Ecosystem Summit 2021 main stage in Wuhan" />
            </figure>
            <figure className="case-media-secondary">
              <img src="/assets/tencent-summit-mini-program.png" alt="Screens from the Tencent Digital Ecosystem Summit WeChat mini program" />
            </figure>
          </div>
          <div className="case-body">
            <p><strong>COVID made the attendee population a moving operational variable.</strong> Changes to Wuhan&apos;s entry controls, testing requirements, transport availability, hotel inventory and venue capacity could invalidate an already confirmed journey overnight. Each replacement then changed the information required by booking, accommodation and catering teams. Jade managed the travel and hotel workstream against this shifting baseline, keeping dependencies visible, revalidating records as conditions moved and holding decisions open until the latest responsible point. The pace of change also exposed a structural weakness: a spreadsheet snapshot could be outdated before the team had finished reconciling it.</p>
            <p><strong>She recognised that more manual checking would not solve the underlying risk.</strong> Seven coordinators were reconciling shared files, email and telephone updates across a continuously rotating pool. Re-entry consumed time, multiplied opportunities for human error and required broad edit and download access to commercially sensitive client records.</p>
            <p><strong>Jade therefore reframed the task as a product and data-governance problem.</strong> The new workflow would let participants maintain their own current information, validate exceptions in one backend, restrict access by operational need and release only verified data to booking partners. With the Head of PM&apos;s approval and VP-backed Product, Engineering and Design support, she defined the inputs, rules and user journeys, built the wireframes and no-code prototype, and led delivery, testing and integration.</p>
            <div className="case-flow" aria-label="Mini program operating flow">
              <span>Participant self-service</span><span>Live monitoring</span><span>Exception validation</span><span>Verified release</span><span>Booking and fulfilment</span>
            </div>
            <p><strong>The mini-program reduced manual load while strengthening data security and budget control.</strong> Participants updated identity, travel, accommodation, dietary and COVID-related information directly; the PMO monitored changes and investigated exceptions; operational partners received only the records needed for fulfilment. For a seven-person team supporting a final 10,000-person event, the workflow reduced repeated entry and version confusion, narrowed opportunities for booking errors and limited unnecessary exposure of sensitive data. It also allowed supplier releases to sit closer to current conditions, reducing exposure to avoidable cancellations, amendments and fees. Designed as a structured workflow rather than a one-off spreadsheet fix, it could be adapted to future high-volume event operations without separate software procurement.</p>
          </div>
          <CommentBox context="Tencent Digital Ecosystem Summit · Wuhan 2021" />
        </CaseDisclosure>
      </article>

      <article className="case-study compact-case charity-case" id="charity-livestream-case">
        <header className="case-study-header">
          <p className="index">DIGITAL CHARITY CASE</p>
          <h2>Connecting Livestream, E-commerce and Fulfilment into One Digital Workflow</h2>
          <div className="about-tags" aria-label="Charity livestream case capabilities">
            <span>Systems Thinking</span><span>Product Sense</span><span>Digital Solution Design</span><span>Tool Orchestration</span><span>E-commerce</span><span>Participant Data</span><span>Technical-Business Translation</span><span>Cross Functional Delivery</span><span>End-to-end Ownership</span>
          </div>
          <PostDate />
        </header>
        <CaseDisclosure initiallyOpen={false}>
          <p className="case-deck">During COVID restrictions, a mass-participation charity campaign needed an alternative to a large offline gathering. Jade connected participant management, livestream infrastructure, digital commerce, transaction data and physical fulfilment into one workable experience.</p>

          <div className="charity-context" aria-label="Charity campaign context">
            <div><strong>10K</strong><span>Target participation scale</span></div>
            <div><strong>3</strong><span>Livestream, commerce and fulfilment layers</span></div>
            <div><strong>1</strong><span>Connected participant-to-collection workflow</span></div>
          </div>

          <section className="reasoning-stage" aria-labelledby="charity-problem-title">
            <div className="reasoning-stage-heading"><span>01</span><div><p>PROBLEM</p><h3 id="charity-problem-title">The campaign could not depend on a mass offline gathering</h3></div></div>
            <div className="constraint-chain" aria-label="Problem reframing from COVID constraint to a new delivery model">
              <span>COVID constraint</span><span>Large offline gathering</span><span>Health and operational risk</span><span>New delivery model required</span>
            </div>
          </section>

          <section className="reasoning-stage" aria-labelledby="charity-requirements-title">
            <div className="reasoning-stage-heading"><span>02</span><div><p>REQUIREMENTS</p><h3 id="charity-requirements-title">The constraint became seven design requirements</h3></div></div>
            <div className="requirements-grid">
              <article><strong>Reach</strong><span>Support a 10K-scale invited or target audience.</span></article>
              <article><strong>Participant workflow</strong><span>Know who the intended participants were and maintain usable records.</span></article>
              <article><strong>Experience</strong><span>Create a shared live experience instead of simply cancelling the campaign.</span></article>
              <article><strong>Commerce</strong><span>Let participants discover products, place orders and pay digitally.</span></article>
              <article><strong>Traceability</strong><span>Match buyers with their orders, payments and physical items.</span></article>
              <article><strong>Fulfilment</strong><span>Ensure each purchased item reached the correct buyer through offline collection.</span></article>
              <article><strong>Reliability</strong><span>Support large-scale livestream traffic with sufficient network stability.</span></article>
            </div>
          </section>

          <section className="reasoning-stage" aria-labelledby="charity-system-title">
            <div className="reasoning-stage-heading"><span>03</span><div><p>SYSTEM</p><h3 id="charity-system-title">One journey connected audience access to charitable outcome</h3></div></div>
            <div className="charity-system-flow" aria-label="End-to-end charity livestream operating workflow">
              <span><b>01</b>Participant data and eligibility</span>
              <span><b>02</b>Managed access</span>
              <span><b>03</b>Livestream experience</span>
              <span><b>04</b>E-commerce store</span>
              <span><b>05</b>Order and payment</span>
              <span><b>06</b>Buyer and order matching</span>
              <span><b>07</b>Offline fulfilment</span>
              <span><b>08</b>Charity outcome</span>
            </div>
            <div className="engineering-layer"><strong>Engineering support layer</strong><span>Livestream environment · Network operations · 10K-scale stability</span><small>Technical infrastructure delivered with engineering colleagues.</small></div>
          </section>

          <section className="reasoning-stage" aria-labelledby="charity-prototype-title">
            <div className="reasoning-stage-heading"><span>04</span><div><p>PROTOTYPE</p><h3 id="charity-prototype-title">The prototype was the assembled working experience</h3></div></div>
            <p className="stage-intro">Jade did not build a new commerce platform or livestream system from scratch. She configured existing capabilities, identified the gaps between them and coordinated the support needed to make the complete workflow operate.</p>
            <div className="prototype-stack" aria-label="Composable campaign building blocks">
              <span>Existing WeChat commerce capability</span><span>Configured storefront</span><span>Campaign content and hosting</span><span>Participant, order and payment workflow</span><span>Offline collection</span>
            </div>
            <div className="ownership-grid" aria-label="Ownership and collaboration boundaries">
              <article><p>JADE</p><h4>Designed and operated</h4><span>Campaign workflow, products, storefront, listings, pricing, livestream content, host script, participant records and offline collection.</span></article>
              <article><p>JADE</p><h4>Translated into requirements</h4><span>Audience scale, livestream environment, reliability expectations and the operational dependencies requiring technical support.</span></article>
              <article><p>ENGINEERING</p><h4>Delivered infrastructure</h4><span>Livestream technical environment, network operations and capacity support for 10K-scale traffic.</span></article>
            </div>

            <figure className="donation-evidence">
              <figcaption><strong>Campaign outcome evidence</strong><span>Donation amount and designated charity project shown in Tencent Charity&apos;s transparency notice</span></figcaption>
              <div className="evidence-translation">
                <p className="evidence-kicker">TENCENT CHARITY</p>
                <h4>Tencent Charity Transparency Notice</h4>
                <p className="evidence-principle">Tencent Charity is committed to building a transparent and rational charitable platform.</p>
                <p className="evidence-amount">You are about to donate <strong>RMB 29,192.45</strong></p>
                <dl>
                  <div><dt>Donation project</dt><dd>Caring Meals in the Daliangshan Mountains</dd></div>
                  <div><dt>Funds received by</dt><dd>Amity Foundation</dd></div>
                  <div><dt>Project implemented by</dt><dd>Amity Foundation</dd></div>
                </dl>
                <ul>
                  <li>Project active for 5.2 years</li>
                  <li>One project progress update in the past three months</li>
                  <li>Two financial disclosures since 2020</li>
                </ul>
                <p className="evidence-actions"><span>Learn more about the project</span><span>I understand and wish to continue with the donation</span></p>
              </div>
              <div className="evidence-image-wrap">
                <img src="/assets/tencent-charity-donation.jpg" alt="Original Chinese Tencent Charity transparency notice showing an intended donation of RMB 29,192.45 to Caring Meals in the Daliangshan Mountains" />
              </div>
            </figure>
          </section>

          <section className="reasoning-stage learning-stage" aria-labelledby="charity-learning-title">
            <div className="reasoning-stage-heading"><span>05</span><div><p>LEARNING</p><h3 id="charity-learning-title">Builder judgement includes deciding what not to build</h3></div></div>
            <p className="stage-intro">The value came from the system working end to end, not from owning every technical component. Jade selected an existing commerce capability, designed the missing connections and brought in engineering expertise where infrastructure reliability mattered.</p>
            <div className="learning-flow" aria-label="Capability synthesis">
              <span>Business problem</span><span>Workflow design</span><span>Tool selection</span><span>Technical coordination</span><span>Digital execution</span><span>Operational closure</span>
            </div>
          </section>

          <CommentBox context="Connecting Livestream, E-commerce and Fulfilment into One Digital Workflow" />
        </CaseDisclosure>
      </article>
      <ManagedPostList posts={posts} />
    </PageShell>
  );
}

function CommercialPage({ posts, archiveMonths }: { posts: ManagedPost[]; archiveMonths: string[] }) {
  return (
    <PageShell
      eyebrow="COMMERCIAL"
      title="Scaling Markets and Building Operating Advantage"
      intro="Jade's commercial strength is turning ambiguity into operating advantage. She can read where a market is moving, shape a viable offer, build the partner and delivery system around it, and stay close enough to revenue, cost and customer signals to change course early. Her record combines expansion, operating discipline and calculated risk. She moves from opportunity to repeatable execution and measurable results."
      archiveMonths={archiveMonths}
    >
      <article className="case-study" id="vlearn-case">
        <header className="case-study-header">
          <p className="index">VENTURE BUILDING</p>
          <h2>Scaling V-Learn Through Market Expansion and a Winning Operating Model</h2>
          <div className="about-tags" aria-label="V-Learn case context">
            <span>Entrepreneur</span><span>Scaling</span><span>Market Expansion</span><span>Partner Acquisition</span><span>Operating Model</span><span>Strategic Operations</span><span>Commercial Judgement</span><span>ROI</span><span>B2C</span><span>B2G</span>
          </div>
          <PostDate />
        </header>
        <CaseDisclosure initiallyOpen={false}>
          <div className="case-body">
            <p><strong>From <span className="accent-text">0 to 7 + 2</span>, V-Learn scaled fast.</strong> As the project&apos;s second team member and expansion PM, Jade delivered seven new campuses and two flagship upgrades, then codified the work into a <span className="accent-text">reusable fit-out template</span> and <span className="accent-text">new-site expansion playbook</span>. These reusable assets reduced reinvention as V-Learn grew. Every delivery met quality standards and finished ahead of deadline, and the H2 2015 opening programme earned an <span className="accent-text">RMB 90K cash award</span>.</p>
            <div className="case-media-strip" aria-label="V-Learn learning environments and exterior design">
              <figure><img src="/assets/vlearn-facade.jpg" alt="V-Learn exterior brand treatment at a learning centre" /></figure>
              <figure><img src="/assets/vlearn-interior.jpg" alt="Interior learning and reception environment at V-Learn" /></figure>
              <figure><img src="/assets/vlearn-interactive-space.jpg" alt="Outdoor interactive play installation at V-Learn" /></figure>
            </div>
            <p className="case-caption">V-Learn brought Vanke&apos;s community education model to life through interactive classes, play-based spaces and outdoor learning close to home.</p>
            <p><strong>Market-responsive operations turned frontline insight into profitable growth.</strong></p>
            <div className="case-outcomes" aria-label="V-Learn strategic operations results">
              <div><strong>3 years</strong><span>ROI payback</span></div>
              <div><strong>RMB 10M+</strong><span>Net revenue · H1 2016</span></div>
              <div><strong>RMB 50K</strong><span>Shenyang vs Guangdong performance-based agreement</span></div>
            </div>
            <p>As operations supervisor, Jade read day-to-day operating data alongside direct customer and campus feedback. Together, they revealed shifts in demand and informed changes to marketing strategy, commercial targets, budgets and resource allocation.</p>
          </div>
          <CommentBox context="Scaling V-Learn Through Market Expansion and a Winning Operating Model" />
        </CaseDisclosure>
      </article>

      <article className="case-study" id="longfor-case">
        <header className="case-study-header">
          <p className="index">REGIONAL ADMINISTRATION</p>
          <h2>Building Longfor Hainan from Island Base to Mainland Reach</h2>
          <div className="about-tags" aria-label="Longfor case context">
            <span>Administration</span><span>Ownership</span><span>0–1 Build</span><span>Workplace Strategy</span><span>Localisation</span><span>Cost Control</span><span>Adaptive Delivery</span><span>Regional Coordination</span><span>Executive Alignment</span>
          </div>
          <PostDate />
        </header>
        <CaseDisclosure initiallyOpen={false}>
          <div className="case-body">
            <p><strong>Built from zero, Longfor Hainan&apos;s administration system gave the new regional company the structure to scale.</strong> As Admin Head and an early team member, Jade created the regional framework around Group standards and local operating realities. Strong regional practice later informed a Group-wide corporate hospitality playbook, turning frontline experience into a reference for other teams.</p>
            <p><strong>Strategic administration made room for growth without losing cost discipline.</strong> Because a 2,000㎡ head office exceeded the company&apos;s immediate footprint under Group standards, Jade took ownership of the recommendation by framing it around total regional occupancy rather than one office in isolation. She balanced future headcount and workplace requirements with lease exits across other cities and a blended Haikou, project-site and remote working model, giving the General Manager and Group a disciplined basis for approval.</p>
            <div className="case-media-strip case-media-two" aria-label="Haikou Paradise Walk project imagery">
              <figure><img src="/assets/haikou-paradise-walk.jpg" alt="Haikou Paradise Walk exterior" /></figure>
              <figure><img src="/assets/haikou-paradise-walk-aerial.jpg" alt="Aerial view of Haikou Paradise Walk and the surrounding city" /></figure>
            </div>
            <p className="case-caption">Haikou Paradise Walk is a 324,000㎡ provincial key project and the development that accelerated Longfor Hainan&apos;s need for a head office in Haikou.</p>
            <p><strong>Delivery protected speed, cost and regional flexibility.</strong> The head office was completed <span className="accent-text">10% faster</span> and <span className="accent-text">15% under budget</span>, earning a formal Group commendation and an <span className="accent-text">RMB 100K award</span> for Longfor Hainan. This performance resulted from Jade&apos;s component-based fit-out strategy, with suitable elements fabricated off site and assembled on site to reduce delivery time and cost without lowering workplace standards. The regional administration system was subsequently extended across three mainland cities.</p>
          </div>
          <CommentBox context="Building Longfor Hainan from Island Base to Mainland Reach" />
        </CaseDisclosure>
      </article>
      <ManagedPostList posts={posts} />
    </PageShell>
  );
}

function CulturesPage({ posts, archiveMonths }: { posts: ManagedPost[]; archiveMonths: string[] }) {
  return (
    <PageShell eyebrow="CULTURES" title="Living and Working Across Cultures" intro="Normal is usually local. A greeting, a recipe, a meeting or even a silence can change meaning as soon as it crosses a border. Cultures is where Jade follows those shifts with curiosity, humour and care, collecting what people eat, say, avoid, celebrate and quietly assume. Some observations become research. Others simply make the world feel larger." archiveMonths={archiveMonths}>
      <article className="editorial-section">
        <p className="index">RESEARCH</p>
        <h2>From Intercultural Insight to Global Market Practice</h2>
        <div className="about-tags" aria-label="Research and international market capabilities">
          <span>Intercultural Insight</span><span>Audience Intelligence</span><span>Value Proposition</span><span>Research Ethics</span><span>Localisation</span><span>International PM</span><span>International GTM</span>
        </div>
        <PostDate />
        <CaseDisclosure initiallyOpen={false} label="post">
          <p>Jade&apos;s research examined how intercultural competence shapes trust, judgement and collaboration in global leadership, combining a decade inside Fortune Global 500 companies with mixed-method evidence and an Asian professional perspective.</p>
          <p>She chose the Digital Information pathway as practical preparation for working across international markets. The purpose was to strengthen the decisions behind GTM, including how to read a market, identify a credible value proposition, learn responsibly from digital behaviour, adapt an offer without diluting it and coordinate delivery across functions and cultures.</p>

          <h3 className="research-subheading">Building a practical framework for international GTM</h3>
          <ul className="study-pathway-list">
            <li><strong>Find the real market signal</strong><span>Jade can move past surface engagement to ask what behaviour, conversation and context reveal about an audience&apos;s unmet needs. She frames the question before selecting the data, then separates useful signals from platform noise and misleading certainty.</span></li>
            <li><strong>Shape value for a specific market</strong><span>She can connect those signals to a proposition people can recognise, then test how the offer creates, communicates and captures value in that market. The result is a clearer commercial reason to care, not a generic launch message.</span></li>
            <li><strong>Adapt without diluting the offer</strong><span>Jade treats localisation as a GTM decision across language, interface, discoverability, accessibility and channel. She can judge what must change for local relevance and what must remain to protect the core value.</span></li>
            <li><strong>Make cross-border plans deliverable</strong><span>She can turn international ambition into scope, roles, stakeholder alignment, risk decisions and learning loops. Her intercultural judgement supports the practical work of keeping functions and markets moving towards the same outcome.</span></li>
          </ul>
          <p>Together, this work is shaping a practical route from market question to market entry. It connects the judgement Jade has already built in China with the research, localisation and delivery discipline needed for international GTM.</p>
          <CommentBox context="From Intercultural Insight to Global Market Practice" />
        </CaseDisclosure>
      </article>
      <ManagedPostList posts={posts} />
    </PageShell>
  );
}

function FieldnotesPage({ posts, archiveMonths }: { posts: ManagedPost[]; archiveMonths: string[] }) {
  return (
    <PageShell eyebrow="OF" title="Only Fieldnotes" intro="Fieldnotes from a career still moving. This is where Jade keeps observations that do not need to become a Case, from AI and product storytelling to work, culture, food and the small details that reveal how people make meaning." archiveMonths={archiveMonths}>
      <div className="fieldnote-grid">
        <article><p className="index">AI AND WORK</p><h2>How judgement changes when execution gets cheaper</h2><PostDate /><CaseDisclosure initiallyOpen={false} label="post"><p>Notes on curiosity, taste, learning rate and the systems people build around AI.</p><CommentBox context="How judgement changes when execution gets cheaper" /></CaseDisclosure></article>
        <article><p className="index">CULTURE</p><h2>Meaning lives in the details</h2><PostDate /><CaseDisclosure initiallyOpen={false} label="post"><p>Observations on language, food, identity and the contexts that shape how people understand one another.</p><CommentBox context="Meaning lives in the details" /></CaseDisclosure></article>
        <article><p className="index">IN PROGRESS</p><h2>Work worth returning to</h2><PostDate /><CaseDisclosure initiallyOpen={false} label="post"><p>Ideas, experiments and unfinished questions that may later grow into a Case or a longer essay.</p><CommentBox context="Work worth returning to" /></CaseDisclosure></article>
      </div>
      <ManagedPostList posts={posts} label="post" />
    </PageShell>
  );
}

function PublicPostBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return <div className="managed-post-body">{blocks.map((block, index) => {
    const lines = block.split("\n");
    if (lines.every((line) => line.trim().startsWith("- "))) {
      return <ul key={index}>{lines.map((line) => <li key={line}>{line.trim().slice(2)}</li>)}</ul>;
    }
    if (block.startsWith("## ")) return <h3 key={index}>{block.slice(3)}</h3>;
    return <p key={index}>{block}</p>;
  })}</div>;
}

function ManagedPostList({ posts, label = "case" }: { posts: ManagedPost[]; label?: "case" | "post" }) {
  return <>{posts.map((post) => (
    <article className="case-study compact-case managed-post" id={post.slug} key={post.id}>
      <header className="case-study-header">
        <p className="index">{contentTypeLabel(post.contentType)}</p>
        <h2>{post.title}</h2>
        {post.tags.length > 0 && <div className="about-tags" aria-label={`${post.title} capabilities`}>{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        <time className="post-date" dateTime={post.publishedAt.slice(0, 7)}>{formatPostMonth(post.publishedAt)}</time>
      </header>
      <CaseDisclosure initiallyOpen={false} label={label}>
        {post.summary && <p className="case-deck">{post.summary}</p>}
        <PublicPostBody body={post.body} />
        <CommentBox context={post.title} />
      </CaseDisclosure>
    </article>
  ))}</>;
}

function CaseDisclosure({ children, initiallyOpen = true, label = "case" }: { children: React.ReactNode; initiallyOpen?: boolean; label?: "case" | "post" }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <div className={`case-disclosure ${open ? "open" : "closed"}`}>
      <button className="case-disclosure-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? `Collapse ${label}` : `Expand ${label}`}<span aria-hidden="true">{open ? "↑" : "↓"}</span>
      </button>
      {open && <div className="case-disclosure-content">{children}</div>}
    </div>
  );
}

function PostDate() {
  return <time className="post-date" dateTime="2026-08">Aug, 2026</time>;
}

function ArchivePanel({ months = ["2026-08"] }: { months?: string[] }) {
  return (
    <aside className="content-archive" aria-label="Archives">
      <section>
        <h2>Archives</h2>
        <label className="archive-select">
          <span className="sr-only">Select archive month</span>
          <select defaultValue=""><option value="" disabled>Select Month</option>{months.map((month) => <option key={month} value={month}>{formatPostMonth(`${month}-01`)}</option>)}</select>
        </label>
      </section>
    </aside>
  );
}

function PageShell({
  eyebrow,
  title,
  intro,
  roomAfterIntro = false,
  archiveMonths = ["2026-08"],
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  roomAfterIntro?: boolean;
  archiveMonths?: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="inner-page content-page shell">
      <div className={`page-intro ${roomAfterIntro ? "roomy" : ""}`}>
        <p className="index">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <div className="content-page-layout">
        <div className="content-page-main">
          {children}
        </div>
        <ArchivePanel months={archiveMonths} />
      </div>
    </section>
  );
}

type PublicComment = {
  id: number;
  name: string;
  body: string;
  created_at: string;
};

function formatCommentDate(value: string) {
  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function CommentBox({ context, compact = false }: { context?: string; compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [comments, setComments] = useState<PublicComment[]>([]);

  useEffect(() => {
    let active = true;
    const commentContext = context ?? "Home";

    void fetch(`/api/comments?context=${encodeURIComponent(commentContext)}`)
      .then((response) => response.json())
      .then((data: { comments?: PublicComment[] }) => {
        if (active) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (active) setComments([]);
      });

    return () => {
      active = false;
    };
  }, [context]);

  async function submitComment() {
    setCommentError("");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: context ?? "Home", body: commentBody }),
    });
    const data = await response.json() as { submitted?: boolean; error?: string };
    if (data.submitted) {
      setSent(true);
      setCommentBody("");

      const commentContext = context ?? "Home";
      try {
        const refreshedResponse = await fetch(`/api/comments?context=${encodeURIComponent(commentContext)}`);
        const refreshedData = await refreshedResponse.json() as { comments?: PublicComment[] };
        setComments(refreshedData.comments ?? []);
      } catch {
        // The comment is already stored; the thread can refresh on the next visit.
      }
    } else {
      setCommentError(data.error ?? "Your comment could not be submitted.");
    }
  }

  return (
    <section className={`comments ${context ? "post-comments" : ""} ${compact ? "compact-comments" : ""}`}>
      <h2>Leave a comment</h2>
      {context && <p className="comment-context">On “{context}”</p>}
      {comments.length > 0 && (
        <div className="comment-thread" aria-label="Published comments">
          {comments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <div className="comment-meta">
                <span className="comment-author">{comment.name}</span>
                <time dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
              </div>
              <p>{comment.body}</p>
            </article>
          ))}
        </div>
      )}
      {compact && !expanded ? (
        <button className="comment-expand" type="button" onClick={() => setExpanded(true)}>Write a comment <span aria-hidden="true">→</span></button>
      ) : (
        <>
          {sent ? (
            <p className="comment-thanks">
              Thank you. Your comment is now live.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitComment();
              }}
            >
              <label>
                Comment
                <textarea required rows={5} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} />
              </label>
              <button className="primary">POST COMMENT</button>
              <small>Comments appear publicly after submission.</small>
              {commentError && <small role="alert">{commentError}</small>}
            </form>
          )}
        </>
      )}
    </section>
  );
}
