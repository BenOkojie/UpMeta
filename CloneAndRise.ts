import { Asset, Color, Component, Entity, PropTypes, Vec3, Quaternion, World } from 'horizon/core';
import * as hz from 'horizon/core';

class CloneAndRise extends hz.Component<typeof CloneAndRise> {
  static propsDefinition = {
    modelToClone: { type: hz.PropTypes.Asset },
    riseSpeed: { type: hz.PropTypes.Number, default: 0.1 },
    fadeOutDuration: { type: hz.PropTypes.Number, default: 1.0 },
  };

  private riseSubscription!: hz.EventSubscription;

  start() {
    this.cloneAndRise();
  }

  cloneAndRise() {
    if (!this.props.modelToClone!) return;

    const asset = this.props.modelToClone!;
    const position = this.entity.position.get();
    const rotation = this.entity.rotation.get();
    const scale = this.entity.transform.scale.get();

    this.world.spawnAsset(asset, position, rotation, scale).then((entities) => {
      const clonedEntity = entities[0];
      this.animateAsh(clonedEntity);
    });
  }
  delayedClone(delaySeconds: number) {
    const startTime = Date.now();
    const sub = this.connectLocalBroadcastEvent(hz.World.onUpdate, () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= delaySeconds) {
        this.cloneAndRise();
        sub.disconnect(); // clean up
      }
    });
  }
  
  animateAsh(entity: hz.Entity) {
    const initialPosition = entity.position.get();
    const initialScale = entity.transform.scale.get();
    const initialColor = entity.color.get().clone();
    const startTime = Date.now();
    const duration = this.props.fadeOutDuration!;

    this.riseSubscription = this.connectLocalBroadcastEvent(hz.World.onUpdate, (data: { deltaTime: number }) => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const t = Math.min(elapsedTime / duration, 1.0);

      // RISE
      const riseAmount = this.props.riseSpeed! * t;
      entity.position.set(initialPosition.add(new Vec3(0, riseAmount, 0)));

      // SHRINK
      const shrinkScale = initialScale.mul(1.0 - t);
      entity.scale.set(shrinkScale);



      // GLOW BRIGHTER (simulate glowing before disappearing)
      // const glowFactor = 1.0 + (t * 1.5); // gets brighter as t → 1
      // const brightColor = new Color(
      //   Math.min(initialColor.r * glowFactor, 1.0),
      //   Math.min(initialColor.g * glowFactor, 1.0),
      //   Math.min(initialColor.b * glowFactor, 1.0),
       
      // );
      // entity.color.set(brightColor);

      if (t >= 1.0) {
        this.world.deleteAsset(entity, true);
        this.riseSubscription.disconnect();
        const delay = 2 + Math.random() * 2;
        this.delayedClone(delay);
        
      }
    });
  }
}

hz.Component.register(CloneAndRise);
