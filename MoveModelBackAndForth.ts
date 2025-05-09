import { Component, PropTypes, Vec3, World } from 'horizon/core';

class MoveModelBackAndForth extends Component<typeof MoveModelBackAndForth> {
  static propsDefinition = {
    velocityX: { type: PropTypes.Number, default: 0 },
    velocityY: { type: PropTypes.Number, default: 0 },
    velocityZ: { type: PropTypes.Number, default: 0 },
    distanceX: { type: PropTypes.Number, default: 0 },
    distanceY: { type: PropTypes.Number, default: 0 },
    distanceZ: { type: PropTypes.Number, default: 0 },
  };

  private velocity!: Vec3;
  private distance!: Vec3;
  private initialPosition!: Vec3;
  private directionX: number = 1;
  private directionY: number = 1;
  private directionZ: number = 1;

  start() {
    this.velocity = new Vec3(this.props.velocityX!, this.props.velocityY!, this.props.velocityZ!);
    this.distance = new Vec3(this.props.distanceX!, this.props.distanceY!, this.props.distanceZ!);
    this.initialPosition = this.entity.position.get();
    this.connectLocalBroadcastEvent(World.onUpdate, (data: { deltaTime: number }) => this.update(data.deltaTime));
  }

  update(deltaTime: number) {
    const position = this.entity.position.get();
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

Component.register(MoveModelBackAndForth);