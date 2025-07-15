/* SkillTreeFounderUI.ts
   ──────────────────────────────────────────────────────────────
   Custom-shop panel that:
   • Shows the player’s coin balance and five skills
     (Speed, Jump, Lives, DoubleJump, AirDash)
   • Loads values when the player steps into this panel’s trigger zone
   • Keeps in sync with CollectibleTracker broadcasts
   • Matches the original visual style you shared                 */

import * as hz from "horizon/core";
import * as ui from "horizon/ui";
import { CollectibleTracker } from "./CollectibleTracker";   // adjust path if needed

/* Persistent-variable identifiers */
const PV_GRP   = "shop";
const COIN_KEY = `${PV_GRP}:coins`;
const SKILL_KEYS = ["Speed", "Jump", "Lives", "DoubleJump", "AirDash"] as const;
type SkillKey = typeof SKILL_KEYS[number];

/* Static metadata */
const META: Record<SkillKey, { desc: string; cost: number }> = {
  Speed:       { desc: "Run faster.",          cost: 10 },
  Jump:        { desc: "Jump higher.",         cost: 10 },
  Lives:       { desc: "Gain an extra life.",  cost: 20 },
  DoubleJump:  { desc: "Jump again mid-air.",  cost: 15 },
  AirDash:     { desc: "Dash through air.",    cost: 15 },
};

type UIProps = { triggerZone: hz.Entity };

export class SkillTreeFounderUI extends ui.UIComponent<UIProps> {
  static propsDefinition = { triggerZone: { type: hz.PropTypes.Entity } };

  /* panel size in headset units */
  panelHeight = 800;
  panelWidth  = 800;

  /* bindings & mirrors */
  private coinVal  = 0;
  private coinBind = new ui.Binding<number>(0);
  private lvlVal : Record<SkillKey, number>            = {} as any;
  private lvlBind: Record<SkillKey, ui.Binding<number>> = {} as any;

  constructor() {
    super();
    for (const k of SKILL_KEYS) {
      this.lvlVal[k]  = 0;
      this.lvlBind[k] = new ui.Binding<number>(0);
    }
  }

  /* safe read (creates var if missing) */
  private loadOrInit(p: hz.Player, key: string, def = 0): number {
    try {
      const v = this.world.persistentStorage.getPlayerVariable(p, key);
      if (v === undefined || v === null) throw 0;
      return v as number;
    } catch {
      this.world.persistentStorage.setPlayerVariable(p, key, def);
      return def;
    }
  }

  /* hydrate when the player walks in */
  preStart() {
    this.connectCodeBlockEvent(
      this.props.triggerZone,
      hz.CodeBlockEvents.OnPlayerEnterTrigger,
      (player: hz.Player) => {
        this.coinVal = this.loadOrInit(player, COIN_KEY, 0);
        this.coinBind.set(this.coinVal);

        for (const k of SKILL_KEYS) {
          const lvl = this.loadOrInit(player, `${PV_GRP}:${k}`, 0);
          this.lvlVal[k] = lvl;
          this.lvlBind[k].set(lvl);
        }
      }
    );

    /* save on exit + broadcast so other panels refresh */
    this.connectCodeBlockEvent(
      this.props.triggerZone,
      hz.CodeBlockEvents.OnPlayerExitTrigger,
      (player: hz.Player) => {
        this.world.persistentStorage.setPlayerVariable(player, COIN_KEY, this.coinVal);
        for (const k of SKILL_KEYS) {
          this.world.persistentStorage.setPlayerVariable(player, `${PV_GRP}:${k}`, this.lvlVal[k]);
        }
        this.sendNetworkBroadcastEvent(
          CollectibleTracker.playerSkillDataLoadedEvent,
          { player, coins: this.coinVal, skills: { ...this.lvlVal } }
        );
        this.sendLocalBroadcastEvent(
          CollectibleTracker.collectedCountUpdatedEvent,
          { player, count: this.coinVal }
        );
      }
    );
  }

  /* listen for tracker broadcasts */
  start() {
    const me = this.world.getLocalPlayer();
    this.connectNetworkBroadcastEvent(
      CollectibleTracker.playerSkillDataLoadedEvent,
      ({ player, coins, skills }) => {
        if (player !== me) return;
        this.applySnapshot(coins, skills);
      }
    );
  }

  /* apply snapshot to bindings */
  private applySnapshot(coins: number, skills: Record<string, number>) {
    this.coinVal = coins;
    this.coinBind.set(coins);

    for (const k in skills) {
      const lvl = skills[k as SkillKey] ?? 0;
      this.lvlVal[k as SkillKey] = lvl;
      this.lvlBind[k as SkillKey].set(lvl);
    }
  }

  /* ────── UI helpers ────── */
  private TopBar = () =>
    ui.View({
      children: [
        ui.Text({
          text: "Shop",
          style: { fontSize: 28, fontWeight: "bold", color: "white" },
        }),
        ui.Text({
          text: this.coinBind.derive(c => `🪙 ${c}`),
          style: { fontSize: 22, color: "gold" },
        }),
      ],
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 20,
      },
    });

  private SkillCard = (key: SkillKey) => {
    const meta = META[key];
    const lvlB = this.lvlBind[key];

    const buy = () => {
      if (this.coinVal < meta.cost) return;
      this.coinVal -= meta.cost;
      this.coinBind.set(this.coinVal);
      const newLvl = this.lvlVal[key] + 1;
      this.lvlVal[key] = newLvl;
      lvlB.set(newLvl);
      this.sendNetworkBroadcastEvent(
    CollectibleTracker.playerSkillDataLoadedEvent,
    {
      player: this.world.getLocalPlayer(),
      coins:  this.coinVal,
      skills: { ...this.lvlVal },   // spread so every key is included
    }
  );
    };

    return ui.View({
      children: [
        ui.Text({
          text: key,
          style: {
            fontSize: 20,
            fontWeight: "bold",
            color: "white",
            marginBottom: 6,
          },
        }),
        ui.Text({
          text: meta.desc,
          style: { fontSize: 14, color: "#b0b0b0", marginBottom: 6 },
        }),
        ui.Text({
          text: lvlB.derive(l => `Level: ${l}`),
          style: { fontSize: 14, color: "#66d9ff", marginBottom: 10 },
        }),
        ui.Pressable({
          onClick: buy,
          children: [
            ui.Text({
              text: lvlB.derive(l => l === 0
                ? `Buy 🪙 ${meta.cost}` : `Upgrade 🪙 ${meta.cost}`),
              style: {
                fontSize: 16,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
              },
            }),
          ],
          style: {
            backgroundColor: "#2087ff",
            paddingVertical: 8,
            borderRadius: 8,
            shadowColor: "#000",
            shadowRadius: 4,
          },
        }),
      ],
      style: {
        backgroundColor: "#12274b",
        borderRadius: 12,
        padding: 18,
        marginBottom: 18,
        width: 340,
        borderWidth: 2,
        borderColor: "#ffffff30",
      },
    });
  };

  /* root view */
  initializeUI() {
    const col1: SkillKey[] = ["Jump", "Lives", "DoubleJump"];
    const col2: SkillKey[] = ["Speed", "AirDash"];

    const makeCol = (arr: SkillKey[], addGap = false) =>
      ui.View({
        children: arr.map(this.SkillCard),
        style: { flexDirection: "column", flex: 1, marginRight: addGap ? 48 : 0 },
      });

    return ui.View({
      children: [
        this.TopBar(),
        ui.ScrollView({
          horizontal: false,
          style: { height: 680, width: "100%" },
          contentContainerStyle: {
            flexDirection: "row",
            width: "100%",
          },
          children: [makeCol(col1, true), makeCol(col2)],
        }),
      ],
      style: {
        backgroundColor: "#0C1F3F",
        padding: 30,
        flex: 1,
        alignItems: "flex-start",
      } as ui.ViewStyle,
    });
  }
}

ui.UIComponent.register(SkillTreeFounderUI);
