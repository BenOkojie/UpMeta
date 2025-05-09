import * as hz from 'horizon/core';

class Enemy extends hz.Component<typeof Enemy> {
  static propsDefinition = {
     spawnLocation: { type: hz.PropTypes.Entity },
    };

  start() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerCollision, this.onPlayerCollision.bind(this));
  }

  onPlayerCollision(collidedWith: hz.Player, collisionAt: hz.Vec3, normal: hz.Vec3, relativeVelocity: hz.Vec3, localColliderName: string, otherColliderName: string) {
    // Kill the player
    // You can implement your own kill logic hereplayer.respawn();
    collidedWith.position.set(this.props.spawnLocation!.position.get());
    console.log(`Player ${collidedWith.name.get()} was killed by enemy ${this.entity.name.get()}`);
  }
}

hz.Component.register(Enemy);
