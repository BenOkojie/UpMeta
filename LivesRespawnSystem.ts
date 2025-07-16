/**
 *  LivesOOBManager
 *  ----------------
 *  • Keeps your original “last‑ground respawn” logic.
 *  • Adds a lives counter based on skill `shop:Lives`
 *      level 0 → 1 life  (die once, then lobby)
 *      level 1 → 2 lives (1 respawn)
 *      ...
 */

import * as hz from "horizon/core";
import { GameState, Pool } from "GameUtils";
import { Events } from "Events";
import { CollectibleTracker } from "./CollectibleTracker";

/* constants */
const PV_GRP    = "shop";
const LIVES_KEY = "Lives";          // skill key in all scripts
const STEP      = 1;                // extra lives per level

type PlayerState = {
  player:   hz.Player;
  spawner:  hz.SpawnPointGizmo;
  eventSub: hz.EventSubscription;
  lives:    number;
};

export class LivesRespawnSystem extends hz.Component<typeof LivesRespawnSystem> {
  static propsDefinition = {
    recordIntervalMS:       { type: hz.PropTypes.Number, default: 500 },
    OOBWorldYHeight:        { type: hz.PropTypes.Number, default: 50 },
    bufferRespawnYHeight:   { type: hz.PropTypes.Number, default: 3 },
    lobbyStartRespawnGizmo: { type: hz.PropTypes.Entity },
  };

  /* singleton */
  private static s_instance: LivesRespawnSystem;
  public  static getInstance() { return LivesRespawnSystem.s_instance; }

  constructor() {
    super();
    if (!LivesRespawnSystem.s_instance) LivesRespawnSystem.s_instance = this;
    else console.error("Duplicate LivesOOBManager in world!");
  }

  /* internal state */
  private asyncIntervalID = 0;
  private respawnBuffer!: hz.Vec3;
  private lobbyStart!: hz.SpawnPointGizmo;

  private spawnerPool = new Pool<hz.Entity>();
  private playerMap   = new Map<number, PlayerState>();
  private lastState   = GameState.ReadyForMatch;

  /* ────────── preStart ────────── */
  preStart() {
    this.respawnBuffer = new hz.Vec3(0, this.props.bufferRespawnYHeight, 0);
    this.lobbyStart    = this.props.lobbyStartRespawnGizmo!.as(hz.SpawnPointGizmo);

    /* player join / leave */
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld,
      (p) => this.onPlayerEnter(p));
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld,
      (p) => this.onPlayerExit(p));

    /* pool enrichment */
    this.connectLocalBroadcastEvent(Events.onRegisterOOBRespawner,
      ({ caller }) => this.spawnerPool.addToPool(caller));

    /* game‑state updates */
    this.connectNetworkBroadcastEvent(Events.onGameStateChanged,
      ({ toState }) => { this.lastState = toState; });

    /* listen for lives snapshots (NEED Network scope) */
    this.connectNetworkBroadcastEvent(
      CollectibleTracker.playerSkillDataLoadedEvent,
      ({ player, skills }) => {
        const st = this.playerMap.get(player.id);
        if (st) st.lives = 1 + (skills[LIVES_KEY] ?? 0) * STEP;
      }
    );

    /* poll loop */
    this.asyncIntervalID = this.async.setInterval(() => this.tick(),
      this.props.recordIntervalMS);
  }
  start(){
      
  }

  dispose() { this.async.clearInterval(this.asyncIntervalID); }

  /* ────────── player hooks ────────── */
  private onPlayerEnter(p: hz.Player) {
    const entity = this.spawnerPool.getNextAvailable();
    if (!entity) { console.error("No free respawner gizmos!"); return; }

    const spawner = entity.as(hz.SpawnPointGizmo)!;

    /* lives = 1 + skill level */
    const snap = CollectibleTracker.Instance?.getSnapshot(p);
    const lvl  = snap?.skills[LIVES_KEY] ?? 0;
    const lives = 1 + lvl * STEP;

    /* per‑player OOB subscription */
    const sub = this.connectNetworkEvent(
      p,
      Events.onPlayerOutOfBounds,
      () => this.respawnOrDie(p)
    );

    this.playerMap.set(p.id, { player: p, spawner, eventSub: sub, lives });
  }

  private onPlayerExit(p: hz.Player) {
    const st = this.playerMap.get(p.id);
    if (!st) return;

    this.spawnerPool.addToPool(st.spawner);
    st.eventSub.disconnect();
    this.playerMap.delete(p.id);
  }

  /* ────────── poll tick ────────── */
  private tick() {
    this.playerMap.forEach(st => {
      const p   = st.player;
      const pos = p.position.get();
      const rot = p.rotation.get();

      if (pos.y < this.props.OOBWorldYHeight) this.respawnOrDie(p);
      else if (p.isGrounded.get()) {
        st.spawner.position.set(pos.add(this.respawnBuffer));
        st.spawner.rotation.set(rot);
      }
    });
  }

  /* ────────── core logic ────────── */
  private respawnOrDie(p: hz.Player) {
    const st = this.playerMap.get(p.id);
    if (!st) return;

    if (st.lives > 1) {
      st.lives--;
      st.spawner.teleportPlayer(p);
    } else {
      /* out of lives */
      st.lives = 0;
      this.lobbyStart.teleportPlayer(p);
    }
  }
}

hz.Component.register(LivesRespawnSystem);
