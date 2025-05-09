/**
 * PlayerDataManager.ts – initialises and manages persistent player variables.
 *
 * Horizon Worlds API v2.0 uses `IPersistentStorage.getPlayerVariable()` and
 * `setPlayerVariable()`—there is no group string. We therefore prepend the key
 * names with a common prefix ("skills:") so everything appears clustered in
 * the Variables panel while remaining compatible with the flat‑key API.
 *
 *  • If a variable is undefined (brand‑new player) we create it with value 0.
 *  • Exposes helper functions (get/set/addCoins/spendCoins) for other scripts.
 */

import * as hz from "horizon/core";

export class PlayerDataManager extends hz.Component<typeof PlayerDataManager> {
  /*──────────────────────────────────────────────────────────────────────────*/
  /*  Constants                                                              */
  /*──────────────────────────────────────────────────────────────────────────*/

  private static readonly PREFIX = "skills:";
  private static readonly KEYS = [
    "airdashlvl",   // Air Dash ability level
    "hoverlvl",     // Hover ability level
    "momentumlvl",  // Momentum Jump ability level
    "coin",         // Player currency
  ] as const;

  /*──────────────────────────────────────────────────────────────────────────*/
  /*  Lifecycle                                                              */
  /*──────────────────────────────────────────────────────────────────────────*/

  /** Horizon requires a concrete start() implementation on every Component */
  start(): void {
    // Nothing to do on the very first frame; all init happens in preStart.
  }

  /** Register an event before Horizon calls start() so it’s ready for join */
  preStart(): void {
    // Fire for each player that joins the world.
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => this.initialiseFor(player),
    );
  }
  
  /** Ensure each tracked variable exists for the given player */
  private initialiseFor(player: hz.Player): void {
    const store = this.world.persistentStorage;

    PlayerDataManager.KEYS.forEach((key) => {
      const fullKey = PlayerDataManager.PREFIX + key;
      const current = store.getPlayerVariable<number>(player, fullKey);
      if (current == null) {
        store.setPlayerVariable<number>(player, fullKey, 1);
        console.log("www")
      }
      else{
        store.setPlayerVariable<number>(player, fullKey, 1);
        console.log(" real see issue")
        console.error(fullKey + "  -  "+ store.getPlayerVariable<number>(player, fullKey));
      }
    });
  }

  /*──────────────────────────────────────────────────────────────────────────*/
  /*  Static helper utilities                                                */
  /*──────────────────────────────────────────────────────────────────────────*/

  private static store(world: hz.World) {
    return world.persistentStorage;
  }

  private static fullKey(key: (typeof PlayerDataManager.KEYS)[number]): string {
    return PlayerDataManager.PREFIX + key;
  }

  /** Read a numeric variable (defaults to 0) */
  public static get(
    world: hz.World,
    player: hz.Player,
    key: (typeof PlayerDataManager.KEYS)[number],
  ): number {
    return (
      PlayerDataManager.store(world).getPlayerVariable<number>(
        player,
        PlayerDataManager.fullKey(key),
      ) ?? 0
    );
  }

  /** Write a numeric variable */
  public static set(
    world: hz.World,
    player: hz.Player,
    key: (typeof PlayerDataManager.KEYS)[number],
    value: number,
  ): void {
    PlayerDataManager.store(world).setPlayerVariable<number>(
      player,
      PlayerDataManager.fullKey(key),
      value,
    );
  }

  /*─────────────── Convenience wrappers for the in‑game currency ───────────*/

  public static getCoins(world: hz.World, player: hz.Player): number {
    return PlayerDataManager.get(world, player, "coin");
  }

  public static addCoins(world: hz.World, player: hz.Player, amount: number): void {
    const total = PlayerDataManager.getCoins(world, player) + amount;
    PlayerDataManager.set(world, player, "coin", total);
  }

  public static spendCoins(
    world: hz.World,
    player: hz.Player,
    amount: number,
  ): boolean {
    const current = PlayerDataManager.getCoins(world, player);
    if (current < amount) return false;
    PlayerDataManager.set(world, player, "coin", current - amount);
    return true;
  }
}

hz.Component.register(PlayerDataManager);
