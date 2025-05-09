import * as hz from "horizon/core";

/**
 * PlayerPrefabSpawner (rev‑2) – Server‑side helper that gives every player a
 * locally‑owned prefab containing PowerUpSystem, HUD, etc.
 *
 * ▸ Execution mode: **Default** (runs once on the simulation authority).
 * ▸ Drag this script onto an always‑active world entity (e.g. _Managers).
 * ▸ In the Inspector, assign **prefabAsset** to your saved asset
 *   "PlayerLocalPrefab" (which has PowerUpSystem & PowerUpHUD set to Local).
 */
export class PlayerPrefabSpawner extends hz.Component<typeof PlayerPrefabSpawner> {
  static propsDefinition = {
    prefabAsset: { type: hz.PropTypes.Asset },
    // hudAsset: { type: hz.PropTypes.Asset },
    // liveAsset: { type: hz.PropTypes.Asset },
  } as const;

  async start() {
    // 1) Handle players who are already in‑world when scripts initialise
    for (const p of this.world.getPlayers()) {
      await this.spawnFor(p);
    }

    // 2) Handle players who join later
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => this.spawnFor(player)
    );
  }

  /** Spawn the prefab, place it near the player, transfer ownership */
  private async spawnFor(player: hz.Player): Promise<void> {
    if (!this.props.prefabAsset) {
      console.warn("[PlayerPrefabSpawner] prefabAsset not assigned");
      return;
    }
 
    // if (!this.props.hudAsset) {
    //   console.warn("[PlayerPrefabSpawner] liveasset not assigned");
    //   return;
    // }

    // Guard against double‑spawning for the same player

    const pos = player.position.get();
    const spawnPos = new hz.Vec3(pos.x, pos.y - 0.2, pos.z);

    // world.spawnAsset returns the **root entity**, NOT an array → no destructuring
            let instances: hz.Entity[] | undefined;
            // let live: hz.Entity[] | undefined;
            let huddis: hz.Entity[] | undefined;
    try {
      instances = await this.world.spawnAsset(this.props.prefabAsset, spawnPos);
      // live = await this.world.spawnAsset(this.props.liveAsset, spawnPos);
      // huddis = await this.world.spawnAsset(this.props.hudAsset, spawnPos);
    } catch (e) {
      console.error("[PlayerPrefabSpawner] spawnAsset threw:", e);
      return;
    }
    if (!instances?.length) {
      console.warn("[PlayerPrefabSpawner] spawnAsset returned 0 entities");
      return;
    }
    const instance = instances[0];
    // const liveinstance = live[0];
    // const hudinstance = huddis[0];
    if (!instance) {
      console.error("[PlayerPrefabSpawner] spawnAsset returned null for", player.name.get());
      return;
    }

    instance.owner.set(player); // Local scripts now run on that headset
    // liveinstance.owner.set(player); // Local scripts now run on that headset
    // hudinstance.owner.set(player); // Local scripts now run on that headset
    // Optional: instance.setParent(player);

    console.log(`[Spawner] Spawned prefab for ${player.name.get()}`);
    console.log(`[Spawner] Spawned live prefab for ${player.name.get()}`);
  }
}

hz.Component.register(PlayerPrefabSpawner);
