import * as hz from 'horizon/core';

class MovingCar extends hz.Component<typeof MovingCar> {
  static propsDefinition = {
    speed: { type: hz.PropTypes.Number, default: 1 },
    distance: { type: hz.PropTypes.Number, default: 10 },
    waitTime: { type: hz.PropTypes.Number, default: 2 },
    rotateX: { type: hz.PropTypes.Boolean, default: false },
    rotateY: { type: hz.PropTypes.Boolean, default: true },
    rotateZ: { type: hz.PropTypes.Boolean, default: false },
    direction: { type: hz.PropTypes.Vec3, default: new hz.Vec3(1, 0, 0) },
    spawnLocation: { type: hz.PropTypes.Entity },
  };

  private initialPosition!: hz.Vec3;
  private targetPosition!: hz.Vec3;
  private isMovingForward = true;
  private isRotating = false;

  start() {
    this.initialPosition = this.entity.position.get().clone();
    this.targetPosition = this.initialPosition.add(this.props.direction!.clone().mul(this.props.distance!));
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerCollision, (player: hz.Player, collisionAt: hz.Vec3, normal: hz.Vec3, relativeVelocity: hz.Vec3) => {
          console.log("touch")
          player.position.set(this.props.spawnLocation!.position.get());
        });
    this.connectLocalBroadcastEvent(hz.World.onUpdate, this.update.bind(this));
  }

  update(data: { deltaTime: number }) {
    if (!this.isRotating) {
      const direction = this.isMovingForward ? 1 : -1;
      const movement = this.props.direction!.clone().mul(direction * this.props.speed! * data.deltaTime);
      this.entity.position.set(this.entity.position.get().add(movement));

      if (this.isMovingForward && this.entity.position.get().distance(this.targetPosition) < 0.1) {
        this.isMovingForward = false;
        this.isRotating = true;
        this.rotateEntity();
      } else if (!this.isMovingForward && this.entity.position.get().distance(this.initialPosition) < 0.1) {
        this.isMovingForward = true;
        this.isRotating = true;
        this.rotateEntity();
      }
    }
  }

  rotateEntity() {
    const rotation = new hz.Quaternion(0, 0, 0, 1);
    if (this.props.rotateX!) {
      rotation.mulInPlace(hz.Quaternion.fromAxisAngle(hz.Vec3.right, hz.degreesToRadians(180)));
    }
    if (this.props.rotateY!) {
      rotation.mulInPlace(hz.Quaternion.fromAxisAngle(hz.Vec3.up, hz.degreesToRadians(180)));
    }
    if (this.props.rotateZ!) {
      rotation.mulInPlace(hz.Quaternion.fromAxisAngle(hz.Vec3.forward, hz.degreesToRadians(180)));
    }
    this.entity.rotation.set(this.entity.rotation.get().mul(rotation));
    this.async.setTimeout(() => {
      this.isRotating = false;
    }, this.props.waitTime! * 1000);
  }
}

hz.Component.register(MovingCar);