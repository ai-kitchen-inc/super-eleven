# Half Volley

An eleven-a-side arcade football game that runs in the browser. It is built in the spirit of early-2000s console football: quick to pick up, and animated by hand instead of from motion capture. Hips twist, shoulders counter-rotate, players lean into turns, and every kick has a wind-up and a follow-through.

Everything is original: the clubs, kits and player names are invented, and the pitch, crowd, ball and sound are generated in code. There are no image or audio files.

## Run it

You need Python 3 and a browser with WebGL. The page loads three.js and two fonts from public CDNs, so it also needs an internet connection.

```bash
python3 -m http.server 8765 --directory game
```

Then open <http://localhost:8765>.

`half-volley.html` in the repo root is the same page with every script inlined, for hosting anywhere that takes a single HTML file.

## Controls

The same button does a different job depending on whether your player has the ball.

| Key | With the ball | Without the ball |
| --- | --- | --- |
| Arrow keys | Move | Move |
| `X` | Short pass | Close down and tackle |
| `S` | Through ball | |
| `A` | Long pass or cross | Slide tackle |
| `D` | Shoot: hold for power, Up/Down picks the post | Call a second man to press |
| `Shift` (or `E`, `Space`) | Sprint | Sprint |
| `Q` (or `Tab`) | | Change player |
| `Enter` (or `P`, `Esc`) | Pause | Pause |

A full shot gauge sends the ball over the bar, so release early when you are close to goal.

**Gamepad** (standard layout): left stick or d-pad moves, bottom face button passes, right goes long, left shoots, top plays it through. Right shoulder or trigger sprints, left shoulder or trigger changes player, Start pauses.

**Touch screens** get an on-screen stick and six buttons: SHOOT, PASS, THRU, LONG, CHG and RUN.

## Match options

- **Clubs:** Port Azul, Redmoor Town, Kumo SC, Verdant Athletic, Solano Gold, Nachtberg 09
- **Half length:** 2, 3 or 5 minutes
- **Level:** Easy, Normal or Hard
- **Picture:** 480 lines (the default) or sharp
- **Sound:** on or off

The menu plays a CPU-against-CPU match behind it until you kick off.

## What is in the game

- 4-4-2 teams with formation play, pressing, marking and a goalkeeper who dives, smothers and distributes
- Throw-ins, corners, goal kicks, free kicks and penalties
- Fouls, given only for slide tackles
- Headers, first-time shots and passes, and a slow-motion replay after each goal
- Two halves with the ends swapped, plus added time

Not implemented: offside, cards and substitutions.

## Project layout

```
game/
  index.html     page markup, styles and the menu
  js/
    core.js      constants, maths helpers, input and sound
    rig.js       the player skeleton and its 37-value pose
    anim.js      hand-keyed clips and procedural locomotion
    world.js     stadium, pitch, goals, ball and renderer
    match.js     clubs, player movement, ball physics, kicks and tackles
    ai.js        team shape, the CPU ball carrier and the goalkeeper
    game.js      match flow, restarts and the player's controls
    main.js      camera, replays, menus, HUD and the frame loop
  build.py       inlines js/ into ../half-volley.html
  dev-tools.js   console helpers for stepping the simulation in tests
half-volley.html the single-file build
```

The scripts are plain globals loaded in the order above; there is no bundler and nothing to install.

After changing anything under `game/`, rebuild the single-file page:

```bash
python3 game/build.py
```

`dev-tools.js` is not loaded by the page. To use it, add it from the browser console while the local server is running:

```js
const s = document.createElement('script'); s.src = 'dev-tools.js'; document.head.appendChild(s);
```

It adds `sim(n)` to step the match by `n` frames, `soak(seconds)` to run a CPU-against-CPU match and report errors or a stuck ball, and `stats(seconds)` to count shots, passes, tackles and possession.

## Status

This is an early build. It has been tested by stepping the simulation with scripted keyboard input and by running full CPU-against-CPU matches. Gamepad and touch input are implemented but have not been tested on real devices yet.

## Credits

Rendering uses [three.js](https://threejs.org/) r128. Type is Chakra Petch and Barlow, served by Google Fonts.
