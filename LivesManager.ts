import * as hz from "horizon/core";

/**
 * LivesManager – LOCAL component that tracks per‑player extra lives and last
 * grounded position so enemies can respawn you correctly.
 *
 * Persistent keys used:
 *   • skills:liveslvl   – permanent upgrade purchased by the player.
 *
 * Runtime (session‑only) keys written:
 *   • runtime:livesLeft – current remaining lives this run.
 *   • runtime:respawnX/Y/Z – last grounded world position.
 *
 * Attach this to the same PlayerLocalPrefab that holds PowerUpSystem. It runs
 * locally for its owner and updates PVs every time you touch the ground.
 */
export class LivesManager extends hz.Component<typeof LivesManager> {
  static propsDefinition = {
    /** Where to send the player when they fully die (no lives left). */
    worldSpawn: { type: hz.PropTypes.Entity },
  } as const;

  private owner!: hz.Player;

  async start() {
    this.owner = this.world.getLocalPlayer();

    // Wait until skills:liveslvl exists
    const store = this.world.persistentStorage;
    while (store.getPlayerVariable<number>(this.owner, "skills:liveslvl") == null) {
      await new Promise<void>((r) => this.async.setTimeout(() => r(), 0.05));
    }

    // Compute max lives and set runtime counter if not set
    const livesLvl = store.getPlayerVariable<number>(this.owner, "skills:liveslvl") ?? 0;
    const maxLives = 1 + livesLvl;
    if (store.getPlayerVariable<number>(this.owner, "skills:liveslvl") == null) {
      store.setPlayerVariable(this.owner, "skills:liveslvl", maxLives);
    }

    // Save initial respawn = worldSpawn (if provided) or current pos
    const init = this.props.worldSpawn ? this.props.worldSpawn.position.get() : this.owner.position.get();
    store.setPlayerVariable(this.owner, "runtime:respawnX", init.x);
    store.setPlayerVariable(this.owner, "runtime:respawnY", init.y);
    store.setPlayerVariable(this.owner, "runtime:respawnZ", init.z);

    // Update respawn point whenever we land
    this.connectLocalBroadcastEvent(hz.World.onUpdate, () => {
      if (this.owner.isGrounded.get()) {
        const p = this.owner.position.get();
        store.setPlayerVariable(this.owner, "runtime:respawnX", p.x);
        store.setPlayerVariable(this.owner, "runtime:respawnY", p.y);
        store.setPlayerVariable(this.owner, "runtime:respawnZ", p.z);
      }
    });
  }
}

hz.Component.register(LivesManager);
