import * as hz from "horizon/core";
import * as ui from "horizon/ui";     // import whole UI module for ScrollView etc.

/* ---------- static skill metadata ---------- */
const SKILL_DATA = {
  Jump:         { desc: "Unlocks the attributes tree.", cost: 10 },
  Speed:        { desc: "Unlocks the attributes tree.", cost: 10 },
  "Air Dash":   { desc: "Unlocks the ability to place a beacon.", cost: 10 },
  "Save Bounce":{ desc: "Unlocks the ability to place blocks.", cost: 10 },
  Teleport:     { desc: "Unlocks the ability to hand craft items.", cost: 10 },
  "Check Point":{ desc: "Unlocks the ability to join or create a guild.", cost: 10 },
  Hover:        { desc: "Reveals more info on the HUD.", cost: 10 },
  "Slow Down":  { desc: "Unlocks the proficiency tree.", cost: 10 },
  Momentum:     { desc: "Unlocks the traits tree.", cost: 10 },
  Freeze:       { desc: "Unlocks the ability to trade.", cost: 10 },
} as const;

type SkillName = keyof typeof SKILL_DATA;

class SkillTreeFounderUI extends ui.UIComponent<{}> {
  /* panel fills most of headset view */
  panelHeight = 800;
  panelWidth  = 800;

  /* one numeric‑binding per skill level */
  levels: Record<SkillName, ui.Binding<number>> = {} as any;
  locked: Record<SkillName, ui.Binding<boolean>> = {} as any;
  currency = new ui.Binding<number>(45);

  constructor() {
    super();
    for (const name in SKILL_DATA) {
      const init = name === "Jump" || name === "Speed" ? 1 : 0;
      this.levels[name as SkillName] = new ui.Binding<number>(init);
      this.locked[name as SkillName] = new ui.Binding<boolean>(init === 0);
    }
  }

  /* ---------- reusable pieces ---------- */
  TopBar = () =>
    ui.View({
      children: [
        ui.Text({ text: "Skills", style: { fontSize: 28, fontWeight: "bold", color: "white" } }),
        ui.Text({
          text: this.currency.derive(c => `💰 ${c}`),
          style: { fontSize: 20, color: "lightgreen" },
        }),
      ],
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 24,
      },
    });

  SkillCard = (name: SkillName) => {
    const meta  = SKILL_DATA[name];
    const lvlB  = this.levels[name];
    const lockB = this.locked[name];

    /* button look‑alike */
    const Upgrade = () =>
      ui.Pressable({
        onClick: () => {
          if (lockB) return;                 // still locked
          lvlB.set(prev => prev + 1);
        },
        children: [
          ui.Text({
            text: lockB.derive(l => (l ? "Locked" : "Upgrade")),
            style: {
              fontSize: 16,
              fontWeight: "bold",
              color: lockB.derive(l => (l ? "#999" : "white")),
              textAlign: "center",
            },
          }),
        ],
        style: {
          backgroundColor: lockB.derive(l => (l ? "#555" : "#0077cc")),
          padding: 10,
          borderRadius: 6,
          marginTop: 10,
        },
      });

    return ui.View({
      children: [
        ui.Text({
          text: lockB.derive(l => (l ? `🔒 ${name}` : name)),
          style: {
            fontSize: 20,
            fontWeight: "bold",
            color: lockB.derive(l => (l ? "#aaa" : "white")),
            marginBottom: 6,
          },
        }),
        ui.Text({
          text: meta.desc,
          style: { fontSize: 14, color: lockB.derive(l => (l ? "#666" : "#ccc")), marginBottom: 6 },
        }),
        ui.Text({
          text: lvlB.derive(lvl => `Level: ${lvl}`),
          style: { fontSize: 14, color: "lightblue", marginBottom: 6 },
        }),
        ui.Text({
          text: lockB.derive(l => (l
            ? "Next Upgrade: unlock this skill first."
            : "Next Upgrade: +5% boost or new ability")),
          style: { fontSize: 13, color: "#aaa", marginBottom: 8 },
        }),
        Upgrade(),
      ],
      style: {
        backgroundColor: lockB.derive(l => (l ? "#2e2e2e" : "#0d4a8a")),
        borderRadius: 10,
        padding: 18,
        marginBottom: 18,
        borderColor: "#fff",
        borderWidth: 2,
        width: 340,                    // wider rectangle card
      },
    });
  };

  /* ---------- UI root ---------- */
  initializeUI() {
    /* scrollable vertical container holding the two‑column grid */
    const ScrollGrid = ui.ScrollView({
      horizontal: false,                         // vertical scrolling
      contentContainerStyle: {
        height: 1200,                            // > panelHeight ⇒ scrollbar appears
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingRight: 24,
      },
      children: [
        /* left column */
        ui.View({
          children: [
            this.SkillCard("Jump"),
            this.SkillCard("Air Dash"),
            this.SkillCard("Save Bounce"),
            this.SkillCard("Teleport"),
            this.SkillCard("Check Point"),
          ],
          style: { flexDirection: "column", flex: 1 },
        }),
        /* right column */
        ui.View({
          children: [
            this.SkillCard("Speed"),
            this.SkillCard("Hover"),
            this.SkillCard("Slow Down"),
            this.SkillCard("Momentum"),
            this.SkillCard("Freeze"),
          ],
          style: { flexDirection: "column", flex: 1, marginLeft: 48 },
        }),
      ],
      style: {
        height: 680,                              // visible area (panelHeight minus top bar & padding)
        width: "100%",
      },
    });

    return ui.View({
      children: [
        this.TopBar(),
        ScrollGrid,
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
