import * as hz from "horizon/core";
import * as ui from "horizon/ui";

/**
 * FinishZoneUI (simple) – BIG overlay that appears once when the local player
 * touches the finish‑line trigger.
 * Attach this LOCAL script to the finish‑line entity (trigger collider).
 */
export class FinishZoneUI extends ui.UIComponent<{}> {
  private visible = new ui.Binding<boolean>(false);

  /* -------- UI -------- */
  initializeUI() {
    return ui.View({
      children: [
        ui.Text({
          text: "YOU WIN! 🎉",
          style: {
            fontSize: 72,
            fontWeight: "bold",
            color: "#ffe756",
            textAlign: "center",
            marginBottom: 32,
            textShadowColor: "#000",
            textShadowRadius: 4,
          },
        }),
        ui.Text({
          text: "Thanks for playing!\nI hope it didn't take that many tries 😉",
          style: {
            fontSize: 32,
            color: "white",
            textAlign: "center",
          },
        }),
      ],
      style: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        width: "100%",
        height: "100%",
        display: this.visible.derive(v => (v ? "flex" : "none")),
      } as ui.ViewStyle,
    });
  }

  /* -------- Trigger detection -------- */
  start() {
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerCollision,
      (player: hz.Player) => {
        if (player === this.world.getLocalPlayer()) {
          this.visible.set(true); // show overlay once
        }
      }
    );
  }
}

ui.UIComponent.register(FinishZoneUI);
