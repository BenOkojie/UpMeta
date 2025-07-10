import { World } from 'horizon/core';
import { Component, PropTypes, Quaternion, Vec3 } from 'horizon/core';

class ModelRotator extends Component<typeof ModelRotator> {
  static propsDefinition = {
    x: { type: PropTypes.Number, default: 0 },
    y: { type: PropTypes.Number, default: 0 },
    z: { type: PropTypes.Number, default: 0 },
    speed: { type: PropTypes.Number, default: 1 }
  };

  private originalRot!: Quaternion;

  start() {
    this.originalRot = this.entity.rotation.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
  }

  update(deltaTime: number) {
    const rotation = Quaternion.fromEuler(new Vec3(this.props.x!, this.props.y!, this.props.z!));
    const newRot = Quaternion.mul(this.originalRot, rotation);
    this.entity.rotation.set(newRot);
    this.originalRot = newRot;
  }
}

Component.register(ModelRotator);
