import {
  Component, PropTypes,
  World, Player, CodeBlockEvents,
  Vec3, Quaternion,
  AudioGizmo, ParticleGizmo, Entity
} from 'horizon/core';
import { CollectibleTracker } from 'CollectibleTracker';

class CollectibleCoin extends Component<typeof CollectibleCoin> {
  /* ───────── props ───────── */
  static propsDefinition = {
    collectSfx:    { type: PropTypes.Entity },
    collectVfx:    { type: PropTypes.Entity },
    jumpablesParent: { type: PropTypes.Entity },
    
    /* idle anim */
    bobSpeed:      { type: PropTypes.Number, default: 1   },
    bobAmplitude:  { type: PropTypes.Number, default: 0.1 },
    rotationSpeed: { type: PropTypes.Number, default: 90  },   // °/s

    /* pickup anim */
    animHeight:        { type: PropTypes.Number, default: 0.5 },
    animTranslateTime: { type: PropTypes.Number, default: 0.5 },
    animSpinRate:      { type: PropTypes.Number, default: 540 },
    animHoldTime:      { type: PropTypes.Number, default: 0.5 },
  };

  /* ───────── state ───────── */
  private collected = false;
  private idleAngle = 0;
  private basePos!: Vec3;
  private ogsize !: Vec3

  /* ───────── start ───────── */
  start() {
    this.ogsize = this.entity.scale.get();
    this.shuffle();
     this.basePos = this.entity.position.get();
    /* 1️⃣ detect player collision */
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerCollision,            
      (player: Player) => {
        if (!this.collected) this.collect(player);
      }
    );

    /* 2️⃣ idle spin + bob */
    this.connectLocalBroadcastEvent(World.onUpdate, ({ deltaTime }) => {
      if (this.collected) return;

      const rotation = Quaternion.fromAxisAngle(new Vec3(1, -1, 0), this.props.rotationSpeed! * deltaTime);
    this.entity.rotation.set(Quaternion.mul(this.entity.rotation.get(), rotation));
    });
  }
  private shuffle(){
      const jumpablesParent = this.props.jumpablesParent?.as(Entity);
    
     if (jumpablesParent) {
      const jumpables = jumpablesParent.children.get();
      const randomJumpable = jumpables[Math.floor(Math.random() * jumpables.length)];
      this.entity.position.set(randomJumpable.position.get().add(new Vec3(0, 3, 0)));
     }
  }
  /* ───────── pick-up logic ───────── */
  private collect(player: Player) {
    this.collected = true;

    this.entity.collidable.set(false);   // stop further collisions
    this.entity.simulated.set(false);

    this.props.collectSfx?.as(AudioGizmo)?.play();

    /* rise / shrink animation */
    let t = 0, phase = 0;
    const riseT  = this.props.animTranslateTime!;
    const holdT  = this.props.animHoldTime!;
    const dropT  = riseT;
    const h      = this.props.animHeight!;
    const spin   = this.props.animSpinRate!;

    const sub = this.connectLocalBroadcastEvent(World.onUpdate, ({ deltaTime }) => {
      t += deltaTime;

      if (phase === 0) {                         // rise
        const dt = Math.min(deltaTime, riseT - t + deltaTime);
        this.entity.position.set(
          this.entity.position.get().add(new Vec3(0, (h * dt) / riseT, 0))
        );
        if (t >= riseT) { phase = 1; t = 0; }
      }
      else if (phase === 1) {                    // hold
        if (t >= holdT) { phase = 2; t = 0; }
      }
      else if (phase === 2) {                    // shrink & drop
        const frac = Math.min(1, t / dropT);
        const scale = 1 - frac;
        this.entity.scale.set(new Vec3(scale, scale, scale));
        const dt = Math.min(deltaTime, dropT - t + deltaTime);
        this.entity.position.set(
          this.entity.position.get().sub(new Vec3(0, (h * dt) / dropT, 0))
        );
        if (frac >= 1) {
          sub.disconnect();
          this.props.collectVfx?.as(ParticleGizmo)?.play();
        }
      }

      const rot = Quaternion.fromAxisAngle(new Vec3(1, -1, 0), spin * deltaTime);
      this.entity.rotation.set(this.entity.rotation.get().mul(rot));
    });

    /* notify any global tracker */
    this.sendLocalBroadcastEvent(
      CollectibleTracker.collectibleCollectedEvent,
      { player }
    );
    this.async.setTimeout(() => {
    this.collected = false;
    this.shuffle();
    this.entity.scale.set(this.ogsize);
    this.entity.collidable.set(true);   // stop further collisions
    this.entity.simulated.set(true);
      
    }, 3000);
  }
}

Component.register(CollectibleCoin);
