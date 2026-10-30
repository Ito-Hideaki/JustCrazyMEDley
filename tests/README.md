# Final stage checks

Run from the project root:

```powershell
node --test tests/*.test.cjs
python -m http.server 8000 --bind 127.0.0.1
```

- `http://localhost:8000/?scene=Final`: the 25-round microgame gauntlet.
- `http://localhost:8000/tests/visual-microgames.html`: frozen rendering gallery; Left/Right cycles all 25 games. Add `?game=solder` (or another ID from `src/minigames/engineering.js`) to choose a starting view. This gallery does not advance timers or write saves.

Final uses only arrows and Space. Each five-round block visits all five departments; all 25 games appear once. Four failures end the run. Surviving all rounds completes the thesis and saves the completion count once. There is no rhythm finale. Each round has an untimed animated demonstration; Space starts the real timer. Arrow keys support holding in movement games, and wrong puzzle inputs give a hint instead of immediately losing a life. The normal Home entrance still requires 150 credits.

Final difficulty comes from the sum of the five department records (maximum 40 each), ignoring the separate `totalTangye` counter. At 150 credits the challenge is highest; at 200 it is lowest. Between those totals, timers lengthen, movement slows, timing windows widen, and arrow sequences shorten in steps. The profile is fixed for the visit, including retries and all rounds. Separate demonstration puzzles use the same difficulty settings. Direct scene previews without a save use the hardest settings.

Automated checks cover 2,250 solvable game variants (25 games × 3 difficulties × 30 seeds), balanced decks, wrong answers, timeouts, scene input gates, pause/resume, retries, direct ending routing, held movement, untimed demonstrations, forgiving corrections, and save isolation. Phaser rendering is mocked in Node; use the browser gallery for visual checks.

Department naming reference: https://www.tokyo-ct.ac.jp/department/

Timers now use `(game base seconds - tier × 0.2) × (1 - 0.35 × challenge)`, with challenge 1 at 150 tangye and 0 at 200. For example, a 7-second game allows 4.55 seconds at 150 and 7 seconds at 200 before later-round reductions. The old extra 3-second allowance has been removed. Catching/dodging schedules are shortened to fit, and result screens last 0.9 seconds. Demonstrations remain untimed.

To reduce repeated mechanics, six earlier games were replaced: arrow-recipe mixing → temperature control (`thermal`), waveform timing → lightning reaction (`lightning`), numeric balancing → projectile launch (`launch`), polarity matching → flash memory (`memory`), grid specimen finding → counting moving microbes (`microbes`), and metal selection → continuously steering an iron ball through a maze (`magnetmaze`). The run still contains 25 games, five per department.
