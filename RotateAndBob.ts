
import { Component, PropTypes, Vec3, Quaternion, World } from 'horizon/core';

class RotateAndBob extends Component<typeof RotateAndBob> {
  static propsDefinition = {
    rotationSpeed: { type: PropTypes.Number, default: 1 },
    bobSpeed: { type: PropTypes.Number, default: 1 },
    bobAmplitude: { type: PropTypes.Number, default: 0.1 },
  };

  private originalPosition!: Vec3;
  private angle: number = 0;

  start() {
    this.originalPosition = this.entity.position.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      this.update(data.deltaTime);
    });
  }

  update(deltaTime: number) {
    const rotationSpeed = 0
    // this.props.rotationSpeed!;
    const bobSpeed = this.props.bobSpeed!;
    const bobAmplitude = this.props.bobAmplitude!;

    // Rotate
    const rotation = Quaternion.fromAxisAngle(new Vec3(0, -1, 0), rotationSpeed * deltaTime);
    this.entity.rotation.set(Quaternion.mul(this.entity.rotation.get(), rotation));

    // Bob
    this.angle += bobSpeed * deltaTime;
    const bobOffset = bobAmplitude * Math.sin(this.angle);
    const position = this.originalPosition.add(new Vec3(0, bobOffset, 0));
    this.entity.position.set(position);
  }
}

Component.register(RotateAndBob);
