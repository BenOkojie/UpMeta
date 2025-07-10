import { World, Player, Component } from 'horizon/core';

class SkillManagerComponent extends Component<typeof SkillManagerComponent> {
  private static GROUP_NAME = 'skills';

  private static VARIABLES = {
    jump: {
      cost: 'jumpcost',
      level: 'jumplvl',
      maxLevel: 'jumpmaxlvl',
    },
    speed: {
      cost: 'speedcost',
      level: 'speedlvl',
      maxLevel: 'speedmaxlvl',
    },
    airDash: {
      cost: 'airdashcost',
      level: 'airdashlvl',
      maxLevel: 'airdashmaxlvl',
    },
    saveBounce: {
      cost: 'savebouncecost',
      level: 'savebouncelvl',
      maxLevel: 'savebouncemaxlvl',
    },
    teleport: {
      cost: 'teleportcost',
      level: 'teleportlvl',
      maxLevel: 'teleportmaxlvl',
    },
    checkpoint: {
      cost: 'checkpointcost',
      level: 'checkpointlvl',
      maxLevel: 'checkpointmaxlvl',
    },
    hover: {
      cost: 'hovercost',
      level: 'hoverlvl',
      maxLevel: 'hovermaxlvl',
    },
    slow: {
      cost: 'slowcost',
      level: 'slownlvl',
      maxLevel: 'slowmaxlvl',
    },
    momentum: {
      cost: 'momentumcost',
      level: 'momentumlvl',
      maxLevel: 'momentummaxlvl',
    },
    freeze: {
      cost: 'freezecost',
      level: 'freezelvl',
      maxLevel: 'freezemaxlvl',
    },
  };

  start() {
    const player = this.world.getLocalPlayer();
    this.getVariable(player, SkillManagerComponent.VARIABLES.jump.level);
    this.setVariable(player, SkillManagerComponent.VARIABLES.jump.level, 10);
  }

  private getVariable(player: Player, variableName: string): number {
    return this.world.persistentStorage.getPlayerVariable(player, `${SkillManagerComponent.GROUP_NAME}.${variableName}`);
  }

  private setVariable(player: Player, variableName: string, value: number): void {
    this.world.persistentStorage.setPlayerVariable(player, `${SkillManagerComponent.GROUP_NAME}.${variableName}`, value);
  }

  public getSkillLevel(player: Player, skillName: keyof typeof SkillManagerComponent.VARIABLES): number {
    return this.getVariable(player, SkillManagerComponent.VARIABLES[skillName].level);
  }

  public getSkillCost(player: Player, skillName: keyof typeof SkillManagerComponent.VARIABLES): number {
    return this.getVariable(player, SkillManagerComponent.VARIABLES[skillName].cost);
  }

  public getSkillMaxLevel(player: Player, skillName: keyof typeof SkillManagerComponent.VARIABLES): number {
    return this.getVariable(player, SkillManagerComponent.VARIABLES[skillName].maxLevel);
  }
}

Component.register(SkillManagerComponent);