<div align="center">

# 📐 The Theorem Blackboard

### An interactive playground demoing the [**codymath**](https://www.npmjs.com/package/codymath) library in action

_Seven functions, each holding a small mathematical truth — drag, slide, and play, and every panel proves its property live._

[![Live Demo](https://img.shields.io/badge/live%20demo-online-9ed69e?style=for-the-badge)](https://jacksondouglasdesouza.github.io/mini-project-codymath-function-tests-01/)
[![codymath on npm](https://img.shields.io/npm/v/codymath?style=for-the-badge&color=e8859a&label=codymath)](https://www.npmjs.com/package/codymath)
[![Made with](https://img.shields.io/badge/tested%20by-theorems-f2c14e?style=for-the-badge)](https://github.com/jacksondouglasdesouza/codymath)

</div>

---

## ✨ What is this?

**The Theorem Blackboard** is a mini test project — a public, interactive showcase of the **codymath** math library running live in the browser. It loads the real package straight from the [jsDelivr CDN](https://www.jsdelivr.com/package/npm/codymath) (with a local fallback) and turns seven of its functions into playable demos: a working piano, a draggable joystick, a bill splitter that never loses a cent, and more. Each panel signs off with a `∎` when its underlying property checks out — _tested by theorems_, made visible.

## 🔗 Links

|                            |                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------- |
| 🎮 **Live demo**           | https://jacksondouglasdesouza.github.io/mini-project-codymath-function-tests-01/ |
| 📦 **codymath on npm**     | https://www.npmjs.com/package/codymath                                           |
| 💻 **codymath repository** | https://github.com/jacksondouglasdesouza/codymath                                |
| 👤 **Author (LinkedIn)**   | https://www.linkedin.com/in/jacksondouglasdsouza                                 |
| 💚 **Support the project** | https://www.paypal.com/donate/?hosted_button_id=8XYHYQNR2E27J                    |

## 🎬 Demo

<div align="center">

![videoOp](assets/demo-max.gif)

</div>

## 🧩 The seven functions on display

| Function             | Panel                 | What it proves                                                     |
| -------------------- | --------------------- | ------------------------------------------------------------------ |
| `geometricLerp`      | 🎹 Playable piano     | One octave split into 12 equal ratios — each step ×2^(1/12)        |
| `deadzone`           | 🕹️ Draggable joystick | Zero inside the threshold, smoothly rescaled past it — no jump     |
| `signedPow`          | 📈 Easing curve       | A power curve that keeps its sign — solves the `(-x)^k = NaN` trap |
| `proportionalSplit`  | 💰 Bill splitter      | Whole cents that always reconcile to the exact total               |
| `normalizeToSum`     | 📊 Proportion bars    | Any weights rescaled to sum exactly 100%, proportions intact       |
| `cumulativeSum`      | 📉 Running balance    | A list of changes turned into a balance over time                  |
| `roundToSignificant` | 🔬 Sig-figs slider    | Rounding by significant figures, following the magnitude           |

> Behind the scenes it also uses `hypot`, `clamp` and `sum` from the same library.

## 🛠️ Built with

- **Vanilla JavaScript** (no framework, no build step)
- **SVG** for all the live graphics
- **Web Audio API** for the piano
- **[codymath](https://www.npmjs.com/package/codymath)** loaded via jsDelivr CDN (with an inline fallback)
- **GitHub Pages** for hosting

## 💚 Support

If this project helped or inspired you, consider [supporting it](https://www.paypal.com/donate/?hosted_button_id=8XYHYQNR2E27J) — it keeps the math coming.

---

<div align="center">

Made with ❤️ by **[Jackson Douglas de Souza](https://www.linkedin.com/in/jacksondouglasdsouza)**

_codymath — tested by theorems_ ∎

</div>
