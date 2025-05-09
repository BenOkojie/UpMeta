import * as hz from 'horizon/core';

class AirDashOnR extends hz.Component {
  static propsDefinition = {
    dashSpeed: { type: hz.PropTypes.Number, default: 10 },
  };

  private input: hz.PlayerInput | null = null;

  start() {
    
    this.input = hz.PlayerControls.connectLocalInput(hz.PlayerInputAction.RightSecondary, hz.ButtonIcon.None, this);
    this.input.registerCallback((action: hz.PlayerInputAction, pressed: boolean) => {
      if (pressed) {
        const player = this.world.getLocalPlayer();
        if (!player.isGrounded.get()) {
          this.dash(player);
        }
      }
    });
  }

  dash(player: hz.Player) {
    const direction = player.forward.get();
    direction.y = 0; // Ignore vertical movement
    const velocity = direction.mul(this.props.dashSpeed!);
    player.velocity.set(velocity);
  }

  dispose() {
    if (this.input) {
      this.input.disconnect();
    }
  }
}

hz.Component.register(AirDashOnR);