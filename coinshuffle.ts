
import * as hz from 'horizon/core';



class coinshuffle extends hz.Component<typeof coinshuffle> {
  static propsDefinition = {
    collectablesParent: { type: hz.PropTypes.Entity },
    jumpablesParent: { type: hz.PropTypes.Entity },
  };

  start() {
    const collectablesParent = this.props.collectablesParent?.as(hz.Entity);
    const jumpablesParent = this.props.jumpablesParent?.as(hz.Entity);

    if (collectablesParent && jumpablesParent) {
      const collectables = collectablesParent.children.get();
      const jumpables = jumpablesParent.children.get();

      // Shuffle collectables
      for (const collectable of collectables) {
        const randomJumpable = jumpables[Math.floor(Math.random() * jumpables.length)];
        console.warn(collectable.name.get())
        
        collectable.position.set(randomJumpable.position.get());
        console.warn(randomJumpable.name.get())
        console.warn(randomJumpable.position.get())
      }
    }
  }
}

hz.Component.register(coinshuffle);