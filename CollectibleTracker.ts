/* CollectibleTracker.ts
   ─────────────────────────────────────────────────────────────
   Central store for player-specific numbers:

   • Coins  (shop:coins)
   • Skills (shop:Speed, Jump, Lives, DoubleJump, AirDash)

   It…
   1. Loads those values from persistent storage the moment a player is
      present in the world.
   2. Keeps an in-memory cache.
   3. Emits:
        • collectibleCollectedEvent        (unchanged – coin pickup)
        • collectedCountUpdatedEvent       (unchanged – coin HUD)
        • playerSkillDataLoadedEvent       (full snapshot for skill HUD)
   4. Exposes   getSnapshot(player) → { coins, skills }   for panels that
      want the data immediately at start-up.                                   */

import {
  Component, Player, LocalEvent, World, NetworkEvent
} from "horizon/core";

/* ────────── persistent-variable keys ────────── */
const PV_GRP       = "shop";
const COIN_KEY     = `${PV_GRP}:coins`;
const SKILL_KEYS   = ["Speed", "Jump", "Lives", "DoubleJump", "AirDash"] as const;
type SkillKey      = typeof SKILL_KEYS[number];

/* ────────── events (all static) ────────── */
export class CollectibleTracker extends Component<typeof CollectibleTracker> {
  /* coin pickup sent by coins */
  static collectibleCollectedEvent = new LocalEvent<{ player: Player }>(
    "CollectibleCollected"
  );
    static coinSpent = new LocalEvent<{ player: Player; amount: number; }>(
    "CoinSpent"
  );
  /* coin total changed – legacy HUDs */
  static collectedCountUpdatedEvent = new LocalEvent<{
    player: Player;
    count: number;
  }>("CollectibleCountUpdated");

  /* NEW: full snapshot (coins + skills) */
  static playerSkillDataLoadedEvent = new NetworkEvent<{
    player: Player;
    coins: number;
    skills: Record<SkillKey, number>;
  }>("PlayerSkillDataLoaded");

  /* ───────── component setup ───────── */
  static propsDefinition = {};
  static Instance: CollectibleTracker | null = null;

  /* live caches */
  private coinsBy      = new Map<number, number>();
  private skillLevels  = new Map<number, Record<SkillKey, number>>();

  /* ─── safe load + auto-init helper ─── */
  private loadOrInit(player: Player, key: string, def = 0): number {
    try {
      const v = this.world.persistentStorage.getPlayerVariable(player, key);
      if (v === undefined || v === null) throw new Error("unset");
      return v as number;
    } catch {
      this.world.persistentStorage.setPlayerVariable(player, key, def);
      return def;
    }
  }

  /* ─── load one player’s data ─── */
  private loadSavedData(player: Player) {
    /* coins */
    console.error("calling saved")
    const coins = this.loadOrInit(player, COIN_KEY, 0);
    this.coinsBy.set(player.id, coins);

    /* skills */
    const skills: Record<SkillKey, number> = {} as any;
    for (const key of SKILL_KEYS) {
      skills[key] = this.loadOrInit(player, `${PV_GRP}:${key}`, 0);
    }
    this.skillLevels.set(player.id, skills);

    /* broadcasts (client copies only) */
    if (this.world.getLocalPlayer()) {
      this.sendLocalBroadcastEvent(
        CollectibleTracker.collectedCountUpdatedEvent,
        { player, count: coins }
      );
      console.log(skills)
      console.log(player)
      this.sendNetworkBroadcastEvent(
        CollectibleTracker.playerSkillDataLoadedEvent,
        { player, coins, skills }
      );
    }
  }
  /* ─── coin pickup handler ─── */
  private onCoinCollected(player: Player) {
    const newCoins = (this.coinsBy.get(player.id) ?? 0) + 10;
    this.coinsBy.set(player.id, newCoins);
    this.world.persistentStorage.setPlayerVariable(player, COIN_KEY, newCoins);

    /* notify coin HUDs */
    this.sendLocalBroadcastEvent(
      CollectibleTracker.collectedCountUpdatedEvent,
      { player, count: newCoins }
    );

    /* resend full snapshot (ensures skill HUD sees updated coin text) */
    const skills = this.skillLevels.get(player.id)!;
    this.sendNetworkBroadcastEvent(
      CollectibleTracker.playerSkillDataLoadedEvent,
      { player, coins: newCoins, skills }
    );
  }

  /* ─── life cycle ─── */
  start() {
    CollectibleTracker.Instance = this;

    /* players already spawned */
    for (const p of this.world.getPlayers()) this.loadSavedData(p);

    /* later joiners */
    /* coin pickups */
    this.connectLocalBroadcastEvent(
      CollectibleTracker.collectibleCollectedEvent,
      ({ player }) => this.onCoinCollected(player)
    );
    this.connectLocalBroadcastEvent(CollectibleTracker.collectedCountUpdatedEvent, (data) =>
        {
            this.coinsBy.set(data.player.id, data.count);
        })
  }

  /* ─── public helper for UIs ─── */
  getSnapshot(player: Player) {
    console.error("loading saved data")
    this.loadSavedData(player);
    return {
      coins:  this.coinsBy.get(player.id) ?? 0,
      skills: this.skillLevels.get(player.id) ??
              Object.fromEntries(SKILL_KEYS.map(k => [k, 0])) as Record<SkillKey, number>,
    };
  }
}

Component.register(CollectibleTracker);
