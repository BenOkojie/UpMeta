/* GameUtils.ts
   -------------------------------------------------------------------
   Very small helper module so other scripts can do:

     import { GameState, Pool } from "GameUtils";
*/

/* ---------- 1 · Match‑flow enum ---------- */
export enum GameState {
  ReadyForMatch  = "ReadyForMatch",   // lobby / waiting room
  PlayingMatch   = "PlayingMatch",    // active round
  EndingMatch    = "EndingMatch",     // post‑round scoreboard etc.
}

/* ---------- 2 · Generic object pool ---------- */
/**
 * Minimal FIFO pool.
 *   • addToPool(obj)         – push an object into the pool.
 *   • getNextAvailable()     – pop and return or `null` if empty.
 *   • release(obj)           – alias to addToPool (puts it back).
 */
export class Pool<T> {
  private store: T[] = [];

  /** put object back into pool */
  addToPool(obj: T) { this.store.push(obj); }

  /** same as addToPool, but named for clarity */
  release(obj: T)   { this.addToPool(obj); }

  /** FIFO pop or `null` if pool empty */
  getNextAvailable(): T | null {
    return this.store.shift() ?? null;
  }
}
