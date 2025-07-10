
import * as hz from 'horizon/core';

// This component teleports an object to a random child of a parent object every 3 seconds
class shuffle extends hz.Component<typeof shuffle> {
  static propsDefinition = {
    parent: { type: hz.PropTypes.Entity } // The parent object whose children will be used as teleport destinations
  };

  private children: hz.Entity[] = []; // Store the children of the parent object

  start() {
    // Get the children of the parent object
    this.children = this.props.parent?.children.get() || [];

    // Check if there are any children
    if (this.children.length === 0) {
      console.error('Parent object has no children');
      return;
    }

    // Teleport to a random child every 3 seconds
    this.async.setInterval(() => {
      this.teleportToRandomChild();
    }, 3000);
  }

  teleportToRandomChild() {
    // Choose a random child from the list of children
    const randomChild = this.children[Math.floor(Math.random() * this.children.length)];

    // Teleport the entity to the position of the random child
    this.entity.position.set(randomChild.position.get());
  }
}

// Register the component
hz.Component.register(shuffle);