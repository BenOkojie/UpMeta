import * as hz from "horizon/core";

/**
 * PowerUpSystem (rev‑3, 2025‑05‑07)
 * ---------------------------------
 * Local‑execution component that enables three air abilities gated by the
 * player’s persistent variables in the **skills:** key‑space.
 *   • Air Dash        – Right Primary (tap in mid‑air)
 *   • Hover / Glide   – hold Left Secondary
 *   • Momentum Jump   – Left Primary (super jump based on run charge)
 *
 * This revision simplifies lifecycle: we now run **all** setup in `start()`
 * on the client that owns the prefab, after blocking until PV replication is
 * complete.  No more `preStart` owner gymnastics.
 */

const PVAR_PREFIX = "skills:";
const PVAR_AIRDASH   = `${PVAR_PREFIX}airdashlvl`;
const PVAR_HOVER     = `${PVAR_PREFIX}hoverlvl`;
const PVAR_MOMENTUM  = `${PVAR_PREFIX}momentumlvl`;

export class PowerUpSystem extends hz.Component<typeof PowerUpSystem> {
  /* ───── Exposed props ─────────────────────────────────────────────── */
  static propsDefinition = {
    /* Air dash */
    baseAirDashForce:  { type: hz.PropTypes.Number, default: 10 },
    airDashForcePerLvl:{ type: hz.PropTypes.Number, default: 3  },
    airDashCooldown:   { type: hz.PropTypes.Number, default: 1  },

    /* Hover */
    baseHoverGravity:  { type: hz.PropTypes.Number, default: 0.4 },
    hoverGravityPerLvl:{ type: hz.PropTypes.Number, default: 0.1 },

    /* Momentum jump */
    baseMomentumMax:   { type: hz.PropTypes.Number, default: 4 },
    momentumMaxPerLvl: { type: hz.PropTypes.Number, default: 2 },
    momentumChargeRate:{ type: hz.PropTypes.Number, default: 1.2 },
    momentumDecayRate: { type: hz.PropTypes.Number, default: 2 },
    baseMomentumJump:  { type: hz.PropTypes.Number, default: 6 },
    momentumJumpFactor:{ type: hz.PropTypes.Number, default: 2 },
  } as const;

  /* ───── Locals ────────────────────────────────────────────────────── */
  private owner!: hz.Player;
  private elapsed = 0;
  private lastDash = 0;

  private dashBtn?: hz.PlayerInput;
  private hoverBtn?: hz.PlayerInput;
  private jumpBtn?: hz.PlayerInput;

  private hoverActive = false;
  private momentum = 0;

  private updateSub?: hz.EventSubscription;

  /* ───── Lifecycle ────────────────────────────────────────────────── */
  async start() {
    this.owner = this.entity.owner.get();
    console.log(`[PowerUpSystem] start for ${this.entity.owner.get()}`);

    await this.waitForPVReady();
    this.initControls();
  }

  /** Block until PVs are replicated to the client */
  private async waitForPVReady(): Promise<void> {
    const store = this.world.persistentStorage;
    while (
      store.getPlayerVariable<number>(this.owner, PVAR_AIRDASH) == null ||
      store.getPlayerVariable<number>(this.owner, PVAR_HOVER)   == null ||
      store.getPlayerVariable<number>(this.owner, PVAR_MOMENTUM)== null
    ) {
      await new Promise<void>(r => this.async.setTimeout(() => r(), 0.05));
    }
  }

  /* ───── Input & update binding ───────────────────────────────────── */
  private initControls() {
    /* Inputs */
    this.dashBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.RightPrimary,
      hz.ButtonIcon.Airstrike,
      this,
    );
    this.hoverBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.LeftSecondary,
      hz.ButtonIcon.EagleEye,
      this,
    );
    this.jumpBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.LeftPrimary,
      hz.ButtonIcon.RocketJump,
      this,
    );

    this.dashBtn.registerCallback((_, pressed) => pressed && this.tryAirDash());
    this.hoverBtn.registerCallback((_, pressed) => this.toggleHover(pressed));
    this.jumpBtn.registerCallback((_, pressed) => pressed && this.fireMomentumJump());

    /* Frame loop */
    this.updateSub = this.connectLocalBroadcastEvent(hz.World.onUpdate, ({ deltaTime }) => {
      this.elapsed += deltaTime;
      this.updateMomentum(deltaTime);
      this.applyHoverDrag();
      this.resetOnGround();
    });
  }

  /* ───── Helpers ───────────────────────────────────────────────────── */
  private getLvl(key: string): number {
    const val = this.world.persistentStorage.getPlayerVariable<number>(this.owner, key);
    console.log("val" + " = " + val);  
    return typeof val === "number" ? val : 0;
  }

  /* ───── Air Dash ─────────────────────────────────────────────────── */
  private tryAirDash() {
    if (this.owner.isGrounded.get()) return;

    const lvl = this.getLvl(PVAR_AIRDASH);
    console.log(`[PowerUpSystem] tryAirDash: ${lvl}`);
    if (lvl <= 0) return;
    if (this.elapsed - this.lastDash < this.props.airDashCooldown) return;

    const force = this.props.baseAirDashForce + (lvl - 1) * this.props.airDashForcePerLvl;
    const dir = new hz.Vec3(this.owner.forward.get().x, 0, this.owner.forward.get().z).normalize();
    const vel = dir.mul(force);
    vel.y = this.owner.velocity.get().y; // preserve vertical
    this.owner.velocity.set(vel);
    this.lastDash = this.elapsed;
  }

  /* ───── Hover ────────────────────────────────────────────────────── */
  private toggleHover(pressed: boolean) {
    const lvl = this.getLvl(PVAR_HOVER);
    if (lvl <= 0) return;

    this.hoverActive = pressed;
    const g = pressed
      ? Math.max(0.05, this.props.baseHoverGravity - (lvl - 1) * this.props.hoverGravityPerLvl)
      : 1;
    this.owner.gravity.set(g);
  }

  private applyHoverDrag() {
    if (!this.hoverActive) return;
    const v = this.owner.velocity.get();
    if (v.y < 0) {
      this.owner.velocity.set(new hz.Vec3(v.x, v.y * 0.5, v.z));
    }
  }

  /* ───── Momentum Jump ───────────────────────────────────────────── */
  private updateMomentum(dt: number) {
    const lvl = this.getLvl(PVAR_MOMENTUM);
    if (lvl <= 0) return;

    const horiz = new hz.Vec3(this.owner.velocity.get().x, 0, this.owner.velocity.get().z).magnitude();
    const max = this.props.baseMomentumMax + (lvl - 1) * this.props.momentumMaxPerLvl;

    if (horiz > 0.1) {
      this.momentum = Math.min(max, this.momentum + horiz * this.props.momentumChargeRate * dt);
    } else {
      this.momentum = Math.max(0, this.momentum - this.props.momentumDecayRate * dt);
    }
  }

  private fireMomentumJump() {
    const lvl = this.getLvl(PVAR_MOMENTUM);
    if (lvl <= 0 || this.momentum <= 0.1) return;

    const jump = this.props.baseMomentumJump + this.momentum * this.props.momentumJumpFactor;
    const cur = this.owner.velocity.get();
    this.owner.velocity.set(new hz.Vec3(cur.x, jump, cur.z));
    this.momentum = 0;
  }

  /* ───── Ground reset ─────────────────────────────────────────────── */
  private resetOnGround() {
    if (this.owner.isGrounded.get()) {
      this.hoverActive = false;
      this.owner.gravity.set(1);
    }
  }

  /* ───── Cleanup ──────────────────────────────────────────────────── */
  dispose() {
    this.dashBtn?.disconnect();
    this.hoverBtn?.disconnect();
    this.jumpBtn?.disconnect();
    this.updateSub?.disconnect();
  }
}

hz.Component.register(PowerUpSystem);
