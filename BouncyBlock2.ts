import * as hz from 'horizon/core';

class BouncyBlock extends hz.Component<typeof BouncyBlock> {
  static propsDefinition = {
    bounceForce: { type: hz.PropTypes.Number, default: 5 },
  };

  start() {
    console.log("testing")
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerCollision, (player: hz.Player, collisionAt: hz.Vec3, normal: hz.Vec3, relativeVelocity: hz.Vec3) => {
      console.log("touch")
      const bounceDirection = normal.normalize();
      // const bounceVelocity = bounceDirection.mul(this.props.bounceForce!);
      bounceDirection.y *= -this.props.bounceForce!;
      player.velocity.set(bounceDirection);
      // console.log(.toString());
    });
  }
}

hz.Component.register(BouncyBlock);