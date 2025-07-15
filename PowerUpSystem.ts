import * as hz from "horizon/core";
import { CollectibleTracker } from "./CollectibleTracker";   // adjust path if needed

/* persistent-var helpers */
const PV_GRP   = "shop";
const SKILL_KEYS = {
  AirDash:     "AirDash",
  DoubleJump:  "DoubleJump",
  Speed:       "Speed",
  Jump:        "Jump",
  Lives:        "Lives"
} as const;
type SkillKey = keyof typeof SKILL_KEYS;

/* tuning defaults */
const STEP = 5;                          // +5 force per level step

export class PowerUpSystem extends hz.Component<typeof PowerUpSystem> {
  static propsDefinition = {
    baseDash:        { type: hz.PropTypes.Number, default: 1 }, // multiplied by level*STEP
    baseDoubleJump:  { type: hz.PropTypes.Number, default: 1 },
    baseLocomotion:  { type: hz.PropTypes.Number, default: 1 }, // speed boost per level*STEP
    baseJumpSpeed:   { type: hz.PropTypes.Number, default: 1 }, // jump speed per level*STEP
  } as const;

  private owner!: hz.Player;

  /* ability state */
  private dashUsed = false;
  private extraJumpUsed = false;
  private jumpReleasedSinceGround = false;

  /* live skill levels */
  private levels: Record<SkillKey, number> = {
    AirDash: 0,
    DoubleJump: 0,
    Speed: 0,
    Jump: 0,
    Lives:0,
  };

  /* cached forces */
  private get dashForce()       { return this.props.baseDash       * this.levels.AirDash    * STEP; }
  private get doubleJumpForce() { return this.props.baseDoubleJump * this.levels.DoubleJump * STEP; }

  private dashBtn?: hz.PlayerInput;
  private jumpBtn?: hz.PlayerInput;
  private updateSub?: hz.EventSubscription;

  /* ───────── Startup ───────── */
  start() {
    this.owner = this.world.getLocalPlayer();
    if (!this.owner) return;  
    this.bindInputs();
    console.warn("bruh")
    /* 1️⃣  initial load */
    const snap = CollectibleTracker.Instance?.getSnapshot(this.owner)
    console.log(this.owner)
    this.applySnapshot(snap);

    /* 2️⃣  listen for tracker broadcasts */
    this.connectNetworkBroadcastEvent(
      CollectibleTracker.playerSkillDataLoadedEvent,
      ({ player,coins, skills }) => {
        console.error("not gdugdibjjbejvvjejvvjefnow")
        if (player === this.owner){
          this.applySnapshot({ skills });
        console.error("sent and recieved")
        } 
        else{
          console.error("not now")
        }
      }
    );

    /* 3️⃣  reset counters on ground contact */
    this.updateSub = this.connectLocalBroadcastEvent(hz.World.onUpdate, () => {
      if (this.owner.isGrounded.get()) {
        this.dashUsed = false;
        this.extraJumpUsed = false;
        this.jumpReleasedSinceGround = false;
      }
    });
  }

  /* apply snapshot of skills */
  private applySnapshot(snap?: { coins?: number; skills: Record<string, number> }) {
    console.log("snapshot trying to do something") 
    console.log(snap)
    if (!snap) return;
    
    for (const k in SKILL_KEYS) {
      const key = k as SkillKey;
      this.levels[key] = snap.skills[key] ?? 0;
      console.error(key)
      console.error(this.levels[key])
    }

    /* speed + jump height */
    this.owner.locomotionSpeed.set(
      1 + this.props.baseLocomotion * this.levels.Speed * STEP
    );
    this.owner.jumpSpeed.set(
      1 + this.props.baseJumpSpeed * this.levels.Jump * STEP
    );
  }

  /* ───────── Input wiring ───────── */
  private bindInputs() {
    /* Dash – Right Primary */
    this.dashBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.RightPrimary,
      hz.ButtonIcon.Airstrike,
      this
    );
    this.dashBtn.registerCallback((_, pressed) => pressed && this.tryDash());

    /* Jump – same key as normal jump */
    this.jumpBtn = hz.PlayerControls.connectLocalInput(
      hz.PlayerInputAction.Jump,
      hz.ButtonIcon.Jump,
      this
    );
    this.jumpBtn.registerCallback((_, pressed) => this.onJumpInput(pressed));
  }

  /* ───────── Dash ───────── */
  private tryDash() {
    if (this.levels.AirDash === 0) return;      // locked
    if (this.owner.isGrounded.get()) return;
    if (this.dashUsed) return;

    const dir = new hz.Vec3(
      this.owner.forward.get().x,
      0,
      this.owner.forward.get().z
    ).normalize();
    const vel = dir.mul(this.dashForce);
    vel.y = this.owner.velocity.get().y; // keep vertical
    this.owner.velocity.set(vel);
    this.dashUsed = true;
  }

  /* ───────── Double Jump ───────── */
  private onJumpInput(pressed: boolean) {
    if (!pressed) {
      if (!this.owner.isGrounded.get()) this.jumpReleasedSinceGround = true;
      return;
    }

    if (this.levels.DoubleJump === 0){
      console.warn("uh ohhhhh no double jump ")
       return;   // locked
    }
    if (this.owner.isGrounded.get()) return;
    if (!this.jumpReleasedSinceGround) return;
    if (this.extraJumpUsed) return;

    const v = this.owner.velocity.get();
    this.owner.velocity.set(new hz.Vec3(v.x, this.doubleJumpForce, v.z));
    console.warn(this.doubleJumpForce)
    this.extraJumpUsed = true;
    this.jumpReleasedSinceGround = false;
  }

  /* ───────── Cleanup ───────── */
  dispose() {
    this.dashBtn?.disconnect();
    this.jumpBtn?.disconnect();
    this.updateSub?.disconnect();
  }
}

hz.Component.register(PowerUpSystem);
