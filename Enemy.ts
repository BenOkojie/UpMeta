import * as hz from "horizon/core";

class Enemy extends hz.Component<typeof Enemy> {
  static propsDefinition = {
    spawnLocation: { type: hz.PropTypes.Entity }, // start‑of‑level location
  };

  start() {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerCollision,
      this.onPlayerCollision.bind(this)
    );
  }

  private onPlayerCollision(
    player: hz.Player,
    _at: hz.Vec3,
    _n: hz.Vec3,
    _rv: hz.Vec3
  ) {
    const store = this.world.persistentStorage;

    // Current lives left (session variable set by LivesManager)
    let lives = store.getPlayerVariable<number>(player, "runtime:livesLeft") ?? 1;

    // Permanent upgrade level
    const livesLvl = store.getPlayerVariable<number>(player, "skills:liveslvl") ?? 0;
    const maxLives = 1 + livesLvl;

    if (lives > 1) {
      // Lose a life and respawn at last grounded position
      lives -= 1;
      store.setPlayerVariable(player, "runtime:livesLeft", lives);

      const x = store.getPlayerVariable<number>(player, "runtime:respawnX") ?? this.props.spawnLocation!.position.get().x;
      const y = store.getPlayerVariable<number>(player, "runtime:respawnY") ?? this.props.spawnLocation!.position.get().y;
      const z = store.getPlayerVariable<number>(player, "runtime:respawnZ") ?? this.props.spawnLocation!.position.get().z;
      player.position.set(new hz.Vec3(x, y, z));
    } else {
      // Out of lives – reset to level start and refill lives
      store.setPlayerVariable(player, "runtime:livesLeft", maxLives);
      player.position.set(this.props.spawnLocation!.position.get());
    }
  }
}
hz.Component.register(Enemy);
