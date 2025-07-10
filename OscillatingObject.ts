import { CodeBlockEvents, Player } from 'horizon/core';
import { Component, PropTypes, Vec3, Quaternion, World } from 'horizon/core';

class OscillatingObject extends Component<typeof OscillatingObject> {
  static propsDefinition = {
    amplitude: { type: PropTypes.Number, default: 0.02 },
    speed: { type: PropTypes.Number, default: 1 },
    animationOffset: { type: PropTypes.Number, default: 0 },
  };

  private initialPosition!: Vec3;
  private time: number = 0;

  start() {
    this.initialPosition = this.entity.position.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, this.OnGrabStart.bind(this));
  }

  OnGrabStart(right: boolean, player: Player) {
    this.entity.position.set(this.initialPosition);
    this.world.ui.showPopupForPlayer(player, 'Grabbed!', 3);
  }

  update(deltaTime: number) {
    this.time = (this.time + deltaTime) % (2 * Math.PI / this.props.speed!);
    const yPos = this.initialPosition.y + this.props.amplitude! * Math.sin(this.props.speed! * this.time + this.props.animationOffset!);
    const position = new Vec3(this.initialPosition.x, yPos, this.initialPosition.z);
    this.entity.position.set(position);
  }
}

Component.register(OscillatingObject);