# Triads Frontend

The Angular/Ionic client for the Triads word-association game. This glossary captures terms specific to the daily-puzzle and game-entry flow.

## Language

**Daily Rollover**:
The moment the Eastern-time calendar day changes, making a new daily puzzle available and the previously loaded one stale.
_Avoid_: Midnight refresh, daily reset

**Brain-Warming Intro**:
The deliberate animated entry ritual (the warmup + confetti Play button) that precedes a daily game. It lives only on the home page; entering a daily puzzle is expected to pass through it.
_Avoid_: Welcome, loading screen

**Stale Tab / Re-entry**:
A daily game left open in a backgrounded tab across a rollover, then returned to via focus or visibility change. Re-entry — not the live midnight timer — is what triggers sending the player home.
_Avoid_: Idle tab, refresh

**Load-time Eastern Date**:
The Eastern calendar date recorded whenever the daily view loads any content (playable puzzle, no-schedule, error, or completed result). On re-entry, comparing today's Eastern date against this anchor determines whether the view is stale. Subsumes a loaded puzzle's `puzzleDate` as the single staleness anchor.
_Avoid_: Loaded date, snapshot date

**Eastern Day Watcher**:
The shared service mechanism that detects rollover. It exposes two distinct signals: a live midnight-timer rollover and a re-entry (focus/visibility) rollover, so consumers can react to each independently.
_Avoid_: Day timer, midnight watcher
