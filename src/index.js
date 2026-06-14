(function () {
   "use strict";

   // ── Resolve the library: CDN first, local fallback only if it fails ──
   const fallback = (function () {
      const sgn = Math.sign;
      const ab = Math.abs;
      const flr = Math.floor;
      return {
         sum: (...xs) => xs.reduce((a, b) => a + b, 0),
         clamp: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
         hypot: (...xs) => Math.sqrt(xs.reduce((s, x) => s + x * x, 0)),
         geometricLerp: (a, b, t) => {
            if (![a, b, t].every(Number.isFinite) || a <= 0 || b <= 0)
               return NaN;
            return Math.pow(a, 1 - t) * Math.pow(b, t);
         },
         deadzone: (v, t) => {
            if (!Number.isFinite(v) || !Number.isFinite(t) || t < 0 || t >= 1)
               return NaN;
            const m = Math.min(ab(v), 1);
            if (m <= t) return 0;
            return sgn(v) * ((m - t) / (1 - t));
         },
         signedPow: (b, e) => {
            if (!Number.isFinite(b) || !Number.isFinite(e)) return NaN;
            return sgn(b) * Math.pow(ab(b), e);
         },
         roundToSignificant: (n, s) => {
            if (
               !Number.isFinite(n) ||
               !Number.isFinite(s) ||
               !Number.isInteger(s) ||
               s < 1
            )
               return NaN;
            if (n === 0) return 0;
            const mag = flr(Math.log10(ab(n)));
            const sc = Math.pow(10, mag - s + 1);
            return sgn(n) * Math.round(ab(n) / sc) * sc;
         },
         normalizeToSum: (vals, target = 1) => {
            if (
               !Number.isFinite(target) ||
               vals.some((v) => !Number.isFinite(v))
            ) {
               return vals.map(() => NaN);
            }
            const tot = vals.reduce((a, b) => a + b, 0);
            if (tot === 0) return vals.map(() => NaN);
            return vals.map((v) => (v * target) / tot);
         },
         cumulativeSum: (...xs) => {
            const r = [];
            let a = 0;
            for (const x of xs) {
               a += x;
               r.push(a);
            }
            return r;
         },
         proportionalSplit: (total, ...w) => {
            if (!w.length) return [];
            if (
               !Number.isInteger(total) ||
               w.some((x) => !Number.isFinite(x) || x < 0)
            ) {
               return w.map(() => NaN);
            }
            const ws = w.reduce((a, b) => a + b, 0);
            if (ws === 0) return w.map(() => NaN);
            const ex = w.map((x) => (total * x) / ws);
            const fl = ex.map(flr);
            const rem = total - fl.reduce((a, b) => a + b, 0);
            const ord = ex
               .map((s, i) => ({ i, f: s - fl[i] }))
               .sort((a, b) => b.f - a.f || a.i - b.i);
            const res = fl.slice();
            for (let k = 0; k < rem; k++) res[ord[k].i]++;
            return res;
         },
      };
   })();

   const fromCdn =
      !window.__cdnFailed && window.codymath && window.codymath.arithmetic;
   const lib = fromCdn ? window.codymath.arithmetic : fallback;

   // status badge
   const st = document.getElementById("libStatus");
   if (fromCdn) {
      st.className = "status cdn";
      st.innerHTML =
         '<span class="dot"></span><span>running on <b>codymath@0.7.0</b> · jsDelivr CDN</span>';
   } else {
      st.className = "status fallback";
      st.innerHTML =
         '<span class="dot"></span><span>CDN unavailable — using <b>local fallback</b> (open via GitHub Pages for the live CDN)</span>';
   }

   const fmt = (x, d = 2) => Number(x.toFixed(d)).toString();
   const NS = "http://www.w3.org/2000/svg";
   const mk = (t, a) => {
      const e = document.createElementNS(NS, t);
      for (const k in a) e.setAttribute(k, a[k]);
      return e;
   };

   // ── 1. geometricLerp — playable octave ──
   (function () {
      const names = [
         "A",
         "A♯",
         "B",
         "C",
         "C♯",
         "D",
         "D♯",
         "E",
         "F",
         "F♯",
         "G",
         "G♯",
         "A",
      ];
      const keysEl = document.getElementById("keys");
      const out = document.getElementById("pianoOut");
      let actx = null;
      const freqs = [];
      for (let i = 0; i <= 12; i++)
         freqs.push(lib.geometricLerp(220, 440, i / 12));

      const play = (f) => {
         if (!actx)
            actx = new (window.AudioContext || window.webkitAudioContext)();
         const o = actx.createOscillator();
         const g = actx.createGain();
         o.type = "triangle";
         o.frequency.value = f;
         g.gain.setValueAtTime(0.0001, actx.currentTime);
         g.gain.exponentialRampToValueAtTime(0.22, actx.currentTime + 0.02);
         g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.6);
         o.connect(g).connect(actx.destination);
         o.start();
         o.stop(actx.currentTime + 0.62);
      };

      freqs.forEach((f, i) => {
         const k = document.createElement("button");
         k.className = "key";
         k.innerHTML = `<span class="note">${names[i]}</span>${Math.round(f)}`;
         k.addEventListener("pointerdown", () => {
            play(f);
            k.classList.add("lit");
            const ratio = i > 0 ? freqs[i] / freqs[i - 1] : freqs[1] / freqs[0];
            out.innerHTML = `${names[i]} = <span class="num">${fmt(f, 1)} Hz</span> &nbsp;·&nbsp; ratio to previous = <b>${fmt(ratio, 5)}</b> <span class="qed show">≈ 2<sup>1/12</sup> ∎</span>`;
            setTimeout(() => k.classList.remove("lit"), 180);
         });
         keysEl.appendChild(k);
      });
   })();

   // ── 2. deadzone — joystick (uses lib.hypot for magnitude) ──
   (function () {
      const svg = document.getElementById("padSvg");
      const out = document.getElementById("dzOut");
      const thIn = document.getElementById("dzTh");
      const thLbl = document.getElementById("dzThLbl");
      const C = 90;
      const R = 78;
      let raw = { x: 0, y: 0 };

      const outer = mk("circle", {
         cx: C,
         cy: C,
         r: R,
         fill: "rgba(255,255,255,0.02)",
         stroke: "var(--rule)",
      });
      const dead = mk("circle", {
         cx: C,
         cy: C,
         r: 1,
         fill: "rgba(232,133,154,0.10)",
         stroke: "rgba(232,133,154,0.5)",
         "stroke-dasharray": "3 3",
      });
      const line = mk("line", {
         x1: C,
         y1: C,
         x2: C,
         y2: C,
         stroke: "var(--blue)",
         "stroke-width": 2,
      });
      const proc = mk("circle", { cx: C, cy: C, r: 6, fill: "var(--green)" });
      const handle = mk("circle", {
         cx: C,
         cy: C,
         r: 11,
         fill: "var(--yellow)",
         stroke: "var(--board)",
         "stroke-width": 2,
      });
      svg.append(outer, dead, line, proc, handle);

      const render = () => {
         const th = parseFloat(thIn.value);
         thLbl.textContent = fmt(th, 2);
         dead.setAttribute("r", th * R);
         const mag = lib.hypot(raw.x, raw.y); // ← codymath
         const dzMag = lib.deadzone(mag, th); // ← codymath
         const ang = Math.atan2(raw.y, raw.x);
         const px = Math.cos(ang) * dzMag;
         const py = Math.sin(ang) * dzMag;
         handle.setAttribute("cx", C + raw.x * R);
         handle.setAttribute("cy", C + raw.y * R);
         proc.setAttribute("cx", C + px * R);
         proc.setAttribute("cy", C + py * R);
         line.setAttribute("x2", C + px * R);
         line.setAttribute("y2", C + py * R);
         out.innerHTML = `input <b>${fmt(mag, 2)}</b><br>output <span class="num">${fmt(dzMag, 2)}</span><br><span style="color:var(--chalk-dim)">${mag <= th ? "inside dead zone" : "rescaled past edge"}</span>`;
      };

      const move = (e) => {
         const r = svg.getBoundingClientRect();
         const sx = ((e.clientX - r.left) / r.width) * 180;
         const sy = ((e.clientY - r.top) / r.height) * 180;
         let dx = (sx - C) / R;
         let dy = (sy - C) / R;
         const m = lib.hypot(dx, dy); // ← codymath
         if (m > 1) {
            dx /= m;
            dy /= m;
         }
         raw = { x: dx, y: dy };
         render();
      };

      let dragging = false;
      svg.addEventListener("pointerdown", (e) => {
         dragging = true;
         svg.setPointerCapture(e.pointerId);
         move(e);
      });
      svg.addEventListener("pointermove", (e) => {
         if (dragging) move(e);
      });
      svg.addEventListener("pointerup", () => {
         dragging = false;
         raw = { x: 0, y: 0 };
         render();
      });
      thIn.addEventListener("input", render);

      raw = { x: 0.62, y: -0.36 };
      render();
   })();

   // ── 3. signedPow — easing curve ──
   (function () {
      const svg = document.getElementById("powSvg");
      const kIn = document.getElementById("powK");
      const kLbl = document.getElementById("powKLbl");
      const W = 240;
      const H = 200;
      const P = 20;
      const X = (x) => P + ((x + 1) / 2) * (W - 2 * P);
      const Y = (y) => H - P - ((y + 1) / 2) * (H - 2 * P);

      svg.appendChild(
         mk("line", {
            x1: X(0),
            y1: P,
            x2: X(0),
            y2: H - P,
            stroke: "var(--rule)",
         }),
      );
      svg.appendChild(
         mk("line", {
            x1: P,
            y1: Y(0),
            x2: W - P,
            y2: Y(0),
            stroke: "var(--rule)",
         }),
      );
      svg.appendChild(
         mk("line", {
            x1: P,
            y1: Y(-1),
            x2: W - P,
            y2: Y(1),
            stroke: "rgba(255,255,255,0.05)",
            "stroke-dasharray": "2 4",
         }),
      );
      const path = mk("path", {
         fill: "none",
         stroke: "var(--yellow)",
         "stroke-width": 2.5,
         "stroke-linejoin": "round",
      });
      svg.appendChild(path);

      const render = () => {
         const k = parseFloat(kIn.value);
         kLbl.textContent = fmt(k, 1);
         let d = "";
         for (let i = 0; i <= 100; i++) {
            const x = -1 + (2 * i) / 100;
            const y = lib.signedPow(x, k); // ← codymath
            d += `${i === 0 ? "M" : "L"}${X(x).toFixed(1)} ${Y(y).toFixed(1)} `;
         }
         path.setAttribute("d", d);
      };

      kIn.addEventListener("input", render);
      render();
   })();

   // ── 4. proportionalSplit — bill splitter (verified with lib.sum) ──
   (function () {
      let amount = 10000;
      let people = 3;
      const amtLbl = document.getElementById("amtLbl");
      const pplLbl = document.getElementById("pplLbl");
      const coins = document.getElementById("coins");
      const out = document.getElementById("splitOut");
      const brl = (c) => "R$ " + (c / 100).toFixed(2).replace(".", ",");

      const render = () => {
         amtLbl.textContent = brl(amount);
         pplLbl.textContent = people;
         const weights = Array(people).fill(1);
         const parts = lib.proportionalSplit(amount, ...weights); // ← codymath
         coins.innerHTML = parts
            .map((p) => `<span class="coin">${brl(p)}</span>`)
            .join("");
         const sum = lib.sum(...parts); // ← codymath
         out.innerHTML = `sum of parts = <b>${brl(sum)}</b> = total &nbsp;<span class="qed show">∎</span>`;
      };

      document.querySelectorAll("[data-amt]").forEach((b) => {
         b.addEventListener("click", () => {
            amount = Math.max(0, amount + Number(b.dataset.amt));
            render();
         });
      });
      document.querySelectorAll("[data-ppl]").forEach((b) => {
         b.addEventListener("click", () => {
            people = Math.min(8, Math.max(1, people + Number(b.dataset.ppl)));
            render();
         });
      });
      render();
   })();

   // ── 5. normalizeToSum — proportion bars ──
   (function () {
      const colors = [
         "var(--yellow)",
         "var(--pink)",
         "var(--blue)",
         "var(--green)",
      ];
      const labels = ["alpha", "beta", "gamma", "delta"];
      const weights = [3, 5, 2, 6];
      const wrap = document.getElementById("normBars");
      const out = document.getElementById("normOut");

      const render = () => {
         const pct = lib.normalizeToSum(weights, 100); // ← codymath
         const rows = wrap.querySelectorAll(".bar-row");
         rows.forEach((row, i) => {
            const val = pct[i];
            row.querySelector(".bar-fill").style.width =
               (Number.isFinite(val) ? val : 0) + "%";
            row.querySelector(".bar-val").textContent = Number.isFinite(val)
               ? fmt(val, 1) + "%"
               : "—";
         });
         const total = pct.reduce(
            (a, b) => a + (Number.isFinite(b) ? b : 0),
            0,
         );
         out.innerHTML = `weights [${weights.join(", ")}] → always sum to <b>${fmt(total, 0)}%</b> <span class="qed show">∎</span>`;
      };

      weights.forEach((w, i) => {
         const row = document.createElement("div");
         row.className = "bar-row";
         row.innerHTML = `<span class="bar-label">${labels[i]}</span><div class="bar-track"><div class="bar-fill" style="background:${colors[i]}"></div></div><span class="bar-val"></span>`;
         const slider = document.createElement("input");
         slider.type = "range";
         slider.min = "0";
         slider.max = "10";
         slider.step = "1";
         slider.value = w;
         slider.style.maxWidth = "70px";
         slider.style.flex = "0 0 70px";
         slider.addEventListener("input", () => {
            weights[i] = Number(slider.value);
            render();
         });
         row.appendChild(slider);
         wrap.appendChild(row);
      });
      render();
   })();

   // ── 6. cumulativeSum — running balance (total cross-checked with lib.sum) ──
   (function () {
      let deltas = [50, -20, 35, -15];
      const chart = document.getElementById("cumChart");
      const out = document.getElementById("cumOut");

      const render = () => {
         const totals = lib.cumulativeSum(...deltas); // ← codymath
         let max = 10;
         totals.forEach((t) => (max = Math.max(max, Math.abs(t))));
         chart.innerHTML = "";
         totals.forEach((t) => {
            const col = document.createElement("div");
            col.className = "cum-col";
            const h = (Math.abs(t) / max) * 78;
            const color = t >= 0 ? "var(--green)" : "var(--pink)";
            col.innerHTML = `<div class="cum-bar" style="height:${h}px;background:${color}"></div><span class="cum-tick">${t}</span>`;
            chart.appendChild(col);
         });
         const grand = lib.sum(...deltas); // ← codymath (cross-check)
         out.innerHTML = `deltas [${deltas.join(", ")}] → balance ends at <b>${grand}</b>`;
      };

      document.getElementById("cumDep").addEventListener("click", () => {
         deltas.push(10 + Math.floor(Math.random() * 50));
         render();
      });
      document.getElementById("cumWd").addEventListener("click", () => {
         deltas.push(-(10 + Math.floor(Math.random() * 50)));
         render();
      });
      document.getElementById("cumReset").addEventListener("click", () => {
         deltas = [50, -20, 35, -15];
         render();
      });
      render();
   })();

   // ── 7. roundToSignificant — significant figures ──
   (function () {
      const values = [];
      for (let i = 0; i <= 100; i++) {
         const exp = -6 + (i / 100) * 15;
         const mant = 1 + ((i * 137) % 9000) / 1000;
         values.push(mant * Math.pow(10, exp));
      }
      const valIn = document.getElementById("sigVal");
      const figIn = document.getElementById("sigFig");
      const valLbl = document.getElementById("sigValLbl");
      const figLbl = document.getElementById("sigFigLbl");
      const out = document.getElementById("sigOut");
      const tidy = (n) =>
         n.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "");

      const render = () => {
         const v = values[Number(valIn.value)];
         const f = Number(figIn.value);
         const r = lib.roundToSignificant(v, f); // ← codymath
         valLbl.textContent = tidy(v);
         figLbl.textContent = f;
         out.innerHTML = `roundToSignificant(<span class="num">${tidy(v)}</span>, <b>${f}</b>) = <span class="num">${r.toPrecision(f)}</span><br><span style="color:var(--chalk-dim)">${f} significant figure${f > 1 ? "s" : ""}, wherever the decimal point sits</span>`;
      };

      valIn.addEventListener("input", render);
      figIn.addEventListener("input", render);
      render();
   })();
})();
