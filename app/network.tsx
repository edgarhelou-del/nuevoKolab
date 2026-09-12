"use client";
import { useEffect, useRef, useState } from "react";
const clusters = [
  {
    name: "Cultura",
    color: "#d6ff59",
    label: "Confianza",
    x: -0.7,
    y: -0.2,
    z: 0.2,
  },
  {
    name: "Arte",
    color: "#dcabff",
    label: "Crear juntos",
    x: 0.1,
    y: -0.75,
    z: -0.15,
  },
  {
    name: "Tecnología",
    color: "#60d9d9",
    label: "Inteligencia colectiva",
    x: 0.8,
    y: 0.05,
    z: 0.1,
  },
  {
    name: "Naturaleza",
    color: "#b4cd8a",
    label: "Interdependencia",
    x: 0,
    y: 0.65,
    z: -0.2,
  },
];
import type { PublicMember } from "@/lib/contracts/member";
export type Member = PublicMember;
export default function Network({
  paused,
  zoom,
  filter,
  members = [],
  onSelect,
  onConcept,
  viewReset = 0,
}: {
  paused: boolean;
  zoom: number;
  filter: string;
  members?: Member[];
  onSelect?: (m: Member) => void;
  onConcept?: (concept: string) => void;
  viewReset?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    paused,
    zoom,
    filter,
    members,
    onSelect,
    onConcept,
    viewReset,
  });
  useEffect(() => {
    state.current = {
      paused,
      zoom,
      filter,
      members,
      onSelect,
      onConcept,
      viewReset,
    };
  }, [paused, zoom, filter, members, onSelect, onConcept, viewReset]);
  const [hover, setHover] = useState<{
    name: string;
    interests?: string[];
  } | null>(null);
  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    if (!ctx) return;
    let w = 0,
      h = 0,
      raf = 0,
      angle = 0.2,
      tilt = -0.18,
      drag = false,
      lastX = 0,
      lastY = 0,
      travel = 0,
      visible = true;
    let hit: {
      x: number;
      y: number;
      r: number;
      name: string;
      member?: Member;
    }[] = [];
    let pointer = { x: -100, y: -100 };
    const rand = (n: number) => {
      const s = Math.sin(n * 127.1 + 31.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const nodes = Array.from({ length: 480 }, (_, i) => {
      const g = i % 4,
        a = rand(i + 9) * Math.PI * 2,
        b = Math.acos(2 * rand(i + 25) - 1),
        r = 0.2 + rand(i + 81) * 0.58,
        cl = clusters[g];
      return {
        x: cl.x + Math.sin(b) * Math.cos(a) * r,
        y: cl.y + Math.sin(b) * Math.sin(a) * r,
        z: cl.z + Math.cos(b) * r,
        g,
        r: rand(i + 8) > 0.95 ? 2.4 : 0.7 + rand(i + 19) * 1.2,
      };
    });
    const edges: number[][] = [];
    nodes.forEach((n, i) => {
      nodes.forEach((m, j) => {
        if (j <= i) return;
        const d = (m.x - n.x) ** 2 + (m.y - n.y) ** 2 + (m.z - n.z) ** 2;
        if (d < 0.09 && (n.g === m.g || rand(i + j) > 0.9)) edges.push([i, j]);
      });
    });
    const resize = () => {
      const r = c.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const d = Math.min(devicePixelRatio || 1, 2);
      c.width = w * d;
      c.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    io.observe(c);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const project = (n: { x: number; y: number; z: number }) => {
      const x = n.x * Math.cos(angle) - n.z * Math.sin(angle),
        z = n.x * Math.sin(angle) + n.z * Math.cos(angle);
      const y = n.y * Math.cos(tilt) - z * Math.sin(tilt),
        zz = n.y * Math.sin(tilt) + z * Math.cos(tilt);
      const p = 3.4 / (3.4 + zz);
      const size = Math.min(w * 0.34, h * 0.41) * state.current.zoom;
      return {
        x: w * (w < 700 ? 0.51 : 0.66) + x * size * p,
        y: h * (w < 700 ? 0.57 : 0.47) + y * size * p,
        z: zz,
        p,
      };
    };
    let t0 = 0,
      resetSeen = state.current.viewReset;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || t - t0 < 28) return;
      if (resetSeen !== state.current.viewReset) {
        angle = 0.2;
        tilt = -0.18;
        resetSeen = state.current.viewReset;
      }
      const dt = Math.min(t - t0, 50);
      t0 = t;
      if (!state.current.paused && !reduced && !drag) angle += dt * 0.00006;
      ctx.clearRect(0, 0, w, h);
      const points = nodes.map(project);
      const active = (g: number) =>
        state.current.filter === "Todas" ||
        clusters[g].name === state.current.filter;
      for (const [a, b] of edges) {
        const p = points[a],
          q = points[b];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = clusters[nodes[a].g].color;
        ctx.globalAlpha =
          (active(nodes[a].g) ? 0.12 : 0.025) * Math.max(0.3, 1 - p.z * 0.35);
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }
      hit = [];
      points.forEach((p, i) => {
        const n = nodes[i];
        ctx.fillStyle = clusters[n.g].color;
        ctx.globalAlpha = active(n.g) ? Math.max(0.2, 0.7 - p.z * 0.22) : 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.r * p.p, 0, Math.PI * 2);
        ctx.fill();
      });
      clusters.forEach((cl, i) => {
        const p = project(cl);
        ctx.globalAlpha = active(i) ? 0.85 : 0.2;
        ctx.fillStyle = cl.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cl.color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "14px monospace";
        ctx.fillText(cl.label, p.x + 17, p.y - 10);
        hit.push({ x: p.x, y: p.y, r: 28, name: cl.label });
      });
      state.current.members.forEach((m) => {
        const g = Math.max(
          0,
          clusters.findIndex((c) => m.interests.some((i) => i === c.name)),
        );
        const seed = m.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const cl = clusters[g];
        const n = {
          x: cl.x + (rand(seed) - 0.5) * 0.8,
          y: cl.y + (rand(seed + 10) - 0.5) * 0.8,
          z: cl.z + (rand(seed + 22) - 0.5) * 0.8,
        };
        const p = project(n);
        m.interests.forEach((interest) => {
          const anchor = clusters.find((c) => c.name === interest);
          if (!anchor) return;
          const q = project(anchor);
          ctx.strokeStyle = anchor.color;
          ctx.globalAlpha = active(g) ? 0.48 : 0.08;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        });
        ctx.globalAlpha = active(g) ? 1 : 0.2;
        ctx.fillStyle = "#fff";
        ctx.shadowColor = clusters[g].color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = clusters[g].color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "13px sans-serif";
        ctx.fillText(m.name, p.x + 18, p.y + 4);
        hit.push({ x: p.x, y: p.y, r: 30, name: m.name, member: m });
      });
      ctx.globalAlpha = 1;
      const found = hit
        .slice()
        .reverse()
        .find((p) => Math.hypot(p.x - pointer.x, p.y - pointer.y) < p.r);
      const next = found
        ? { name: found.name, interests: found.member?.interests }
        : null;
      setHover((prev) =>
        prev?.name === next?.name && prev?.interests === next?.interests
          ? prev
          : next,
      );
      c.style.cursor = found ? "pointer" : drag ? "grabbing" : "grab";
    };
    raf = requestAnimationFrame(draw);
    const down = (e: PointerEvent) => {
      drag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      travel = 0;
      const r = c.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      c.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (drag) {
        const dx = e.clientX - lastX,
          dy = e.clientY - lastY;
        angle += dx * 0.006;
        tilt += dy * 0.004;
        travel += Math.abs(dx) + Math.abs(dy);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const leave = () => {
      pointer = { x: -10000, y: -10000 };
      setHover(null);
    };
    const cancel = () => {
      drag = false;
      leave();
    };
    const up = () => {
      drag = false;
      if (travel < 8) {
        const found = hit
          .slice()
          .reverse()
          .find((p) => Math.hypot(p.x - pointer.x, p.y - pointer.y) < p.r);
        if (found?.member) state.current.onSelect?.(found.member);
        else if (found) state.current.onConcept?.(found.name);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowLeft") angle -= 0.15;
        if (e.key === "ArrowRight") angle += 0.15;
        if (e.key === "ArrowUp") tilt -= 0.15;
        if (e.key === "ArrowDown") tilt += 0.15;
      }
    };
    c.addEventListener("keydown", key);
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", cancel);
    c.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener("keydown", key);
      ro.disconnect();
      io.disconnect();
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", cancel);
      c.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div className="network-stage">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="Red tridimensional de intereses de Kolab. Arrastra o usa las flechas del teclado para girarla; los filtros y controles están debajo."
      />
      <span className="network-hover" role="status">
        {hover && (
          <>
            <strong>{hover.name}</strong>
            {hover.interests && <span>{hover.interests.join(" · ")}</span>}
          </>
        )}
      </span>
    </div>
  );
}
