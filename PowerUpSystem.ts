import * as hz from "horizon/core";

/**
 * PowerUpSystem (rev‑8, 2025‑05‑08)
 * ---------------------------------
 * Simple, non‑upgradeable airborne abilities:
 *   • **Double Jump** – one extra jump while airborne (same key as normal Jump).
 *   • **Air Dash**    – one horizontal dash per airtime (Right Primary).
 *
 * No persistent variables, no levels – every player always has exactly *one*
 * extra jump and *one* dash.  Counters reset each time the player touches
 * ground.
 */
export class PowerUpSystem extends hz.Component<typeof PowerUpSystem> {
  static propsDefinition = {
    dashForce:        { type: hz.PropTypes.Number, default: 12 }, // horizontal burst speed
    doubleJumpForce:  { type: hz.PropTypes.Number, default: 7  }, // vertical boost for extra jump
  } as const;

  private owner!: hz.Player;

  private dashUsed = false;
  private extraJumpUsed = false;
  private jumpReleasedSinceGround = false;

  private dashBtn?: hz.PlayerInput;
  private jumpBtn?: hz.PlayerInput;
  private updateSub?: hz.EventSubscription;

  start() {
    this.owner = this.world.getLocalPlayer();
    this.bindInputs();

    // Reset counters on landing
    this.updateSub = this.connectLocalBroadcastEvent(hz.World.onUpdate, () => {
      if (this.owner.isGrounded.get()) {
        this.dashUsed = false;
        this.extraJumpUsed = false;
        this.jumpReleasedSinceGround = false;
      }
    });
  }

  /* ───── Input wiring ─────────────────────────────────────── */
  private bindInputs() {
    // Dash – Right Primary
    this.dashBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.RightPrimary,
      hz.ButtonIcon.Airstrike,
      this
    );
    this.dashBtn.registerCallback((_, pressed) => pressed && this.tryDash());

    // Jump – same key as normal jump
    this.jumpBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.Jump,
      hz.ButtonIcon.Jump,
      this
    );
    this.jumpBtn.registerCallback((_, pressed) => this.onJumpInput(pressed));
  }

  /* ───── Dash ─────────────────────────────────────────────── */
  private tryDash() {
    if (this.owner.isGrounded.get()) return; // no dash from ground
    if (this.dashUsed) return;

    const dir = new hz.Vec3(
      this.owner.forward.get().x,
      0,
      this.owner.forward.get().z
    ).normalize();
    const vel = dir.mul(this.props.dashForce);
    vel.y = this.owner.velocity.get().y; // keep current vertical velocity
    this.owner.velocity.set(vel);

    this.dashUsed = true;
  }

  /* ───── Double Jump ─────────────────────────────────────── */
  private onJumpInput(pressed: boolean) {
    // We only care about presses/releases while airborne
    if (!pressed) {
      // button released
      if (!this.owner.isGrounded.get()) this.jumpReleasedSinceGround = true;
      return;
    }

    // pressed === true here
    if (this.owner.isGrounded.get()) return; // normal jump handled by engine
    if (!this.jumpReleasedSinceGround) return; // need distinct second press
    if (this.extraJumpUsed) return; // only one extra jump

    const v = this.owner.velocity.get();
    this.owner.velocity.set(new hz.Vec3(v.x, this.props.doubleJumpForce, v.z));

    this.extraJumpUsed = true;
    this.jumpReleasedSinceGround = false; // consume
  }

  /* ───── Cleanup ─────────────────────────────────────────── */
  dispose() {
    this.dashBtn?.disconnect();
    this.jumpBtn?.disconnect();
    this.updateSub?.disconnect();
  }
}

hz.Component.register(PowerUpSystem);
