# Final stage checks

Run from the project root:

```powershell
node --test tests/*.test.cjs
python -m http.server 8000 --bind 127.0.0.1
```

- `http://localhost:8000/?scene=Final`: the 15-round microgame gauntlet.
- `http://localhost:8000/tests/visual-microgames.html`: frozen rendering gallery; Left/Right cycles all 15 games. Add `?game=solder` (or another ID from `src/minigames/engineering.js`) to choose a starting view. This gallery does not advance timers or write saves.

Final uses only arrows and Space. Each five-round block visits all five departments; all 15 games appear once. Four failures end the run. Surviving all rounds completes the thesis and saves the completion count once. There is no rhythm finale. Each round has an untimed animated demonstration; Space starts the real timer. Arrow keys support holding in movement games, and wrong puzzle inputs give a hint instead of immediately losing a life. The normal Home entrance still requires 150 credits.

Automated checks cover 1,350 solvable game variants (15 games × 3 difficulties × 30 seeds), balanced decks, wrong answers, timeouts, scene input gates, pause/resume, retries, direct ending routing, held movement, untimed demonstrations, forgiving corrections, and save isolation. Phaser rendering is mocked in Node; use the browser gallery for visual checks.

Department naming reference: https://www.tokyo-ct.ac.jp/department/
