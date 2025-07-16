/* Events.ts
   -------------------------------------------------------------
   Central place to define project‑wide broadcast events so every
   script can import the *same* instance.

   ‑ LocalEvent  → only scripts on *this* entity receive it
   ‑ NetworkEvent→ every client copy (and server if sent there)          */

import * as hz from "horizon/core";
import { GameState } from "GameUtils";   // your existing enum

/** Someone dropped a new Spawn‑Point gizmo we can add to the pool. */
const onRegisterOOBRespawner = new hz.LocalEvent<{ caller: hz.Entity }>(
  "RegisterOOBRespawner"
);

/** Game‑flow transition (lobby → match, etc.). */
const onGameStateChanged = new hz.NetworkEvent<{
  fromState: GameState;
  toState:   GameState;
}>("GameStateChanged");

/** Sent by each PlayerOOBController when its owner falls below OOB Y. */
const onPlayerOutOfBounds = new hz.NetworkEvent<{}>(
  "PlayerOutOfBounds"
);

export const Events = {
  onRegisterOOBRespawner,
  onGameStateChanged,
  onPlayerOutOfBounds,
};
