import { Component, PropTypes, Vec3,Quaternion, World } from 'horizon/core';

class spinningmover extends Component<typeof spinningmover> {
  static propsDefinition = {
    velocityX: { type: PropTypes.Number, default: 0 },
    velocityY: { type: PropTypes.Number, default: 0 },
    velocityZ: { type: PropTypes.Number, default: 0 },
    distanceX: { type: PropTypes.Number, default: 0 },
    distanceY: { type: PropTypes.Number, default: 0 },
    distanceZ: { type: PropTypes.Number, default: 0 },
    x: { type: PropTypes.Number, default: 0 },
    y: { type: PropTypes.Number, default: 0 },
    z: { type: PropTypes.Number, default: 0 },
    speed: { type: PropTypes.Number, default: 1 }
  };

  private velocity!: Vec3;
  private distance!: Vec3;
  private initialPosition!: Vec3;
  private directionX: number = 1;
  private directionY: number = 1;
  private directionZ: number = 1;
  private originalRot!: Quaternion;
  start() {
    this.velocity = new Vec3(this.props.velocityX!, this.props.velocityY!, this.props.velocityZ!);
    this.distance = new Vec3(this.props.distanceX!, this.props.distanceY!, this.props.distanceZ!);
    this.initialPosition = this.entity.position.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data: { deltaTime: number }) => this.update(data.deltaTime));
    this.originalRot = this.entity.rotation.get();
    // this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
    //   this.update(data.deltaTime);
    // });
  }

  update(deltaTime: number) {
    const position = this.entity.position.get();
    const rotation = Quaternion.fromEuler(new Vec3(this.props.x!, this.props.y!, this.props.z!));
    const newRot = Quaternion.mul(this.originalRot, rotation);
    this.entity.rotation.set(newRot);
    this.originalRot = newRot;
    const newPosition = new Vec3(
      position.x + this.velocity.x * this.directionX * deltaTime,
      position.y + this.velocity.y * this.directionY * deltaTime,
      position.z + this.velocity.z * this.directionZ * deltaTime
    );

    if (Math.abs(newPosition.x - this.initialPosition.x) >= this.distance.x) {
      this.directionX *= -1;
    }
    if (Math.abs(newPosition.y - this.initialPosition.y) >= this.distance.y) {
      this.directionY *= -1;
    }
    if (Math.abs(newPosition.z - this.initialPosition.z) >= this.distance.z) {
      this.directionZ *= -1;
    }

    this.entity.position.set(newPosition);
  }
}

Component.register(spinningmover);