import { Component, PropTypes, World, Player, CodeBlockEvents, Vec3, Quaternion, AudioGizmo, ParticleGizmo } from 'horizon/core';
import { CollectibleTracker } from 'CollectibleTracker';

class CollectableObject extends Component<typeof CollectableObject> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    objectToCollect: { type: PropTypes.Entity },
    collectSfx: { type: PropTypes.Entity },
    collectVfx: { type: PropTypes.Entity },
    animHeight: { type: PropTypes.Number, default: 0.5 },
    animTranslateTime: { type: PropTypes.Number, default: 0.5 },
    animSpinRate: { type: PropTypes.Number, default: 540 },
    animHoldTime: { type: PropTypes.Number, default: 0.5 },
  };

  collected: boolean = false;

  start() {
    console.log('CollectableObject started!');
    this.connectCodeBlockEvent(
      this.props.trigger!,
      CodeBlockEvents.OnPlayerEnterTrigger,
      (player: Player) => {
        console.log('CollectableObject: player entered trigger');

        if (!this.collected) {
          this.collectObject(player);
        }
      }
    );
  }

  collectObject(player: Player) {
    const object = this.props.objectToCollect!;
    object.simulated.set(false);
    object.collidable.set(false);
    let sfx = this.props.collectSfx!.as(AudioGizmo);
    sfx?.play();
    this.collected = true;
    let t = 0;
    let step = 0;
    let updateSubscription = this.connectLocalBroadcastEvent(World.onUpdate, ({deltaTime}) =>
    {
      t += deltaTime;
      if (step == 0) {
        let dt = deltaTime;
        if (t >= this.props.animTranslateTime) {
          dt -= t - this.props.animTranslateTime
          step++;
          t -= this.props.animTranslateTime;
        }
        object.position.set(object.position.get().add(new Vec3(0, this.props.animHeight * dt, 0)));
      }
      else if (step == 1) {
        if (t >= this.props.animHoldTime){
          ++step;
          t -= this.props.animHoldTime;
        }
      }
      else if (step == 2) {
        let s =  1 - (t / this.props.animTranslateTime);
        if (s <= 0) {
          s = 0;
          ++step;
          updateSubscription.disconnect();
          let vfx = this.props.collectVfx!.as(ParticleGizmo);
          vfx?.play();
        }
        object.scale.set(new Vec3(s, s, s));
        object.position.set(object.position.get().sub(new Vec3(0, this.props.animHeight * deltaTime, 0)));
      }
      object.rotation.set(object.rotation.get().mul(Quaternion.fromAxisAngle(Vec3.up, this.props.animSpinRate * deltaTime)));
    })
    this.sendLocalBroadcastEvent(CollectibleTracker.collectibleCollectedEvent, { player: player })
  }
}

Component.register(CollectableObject);
