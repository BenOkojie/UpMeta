import * as ui from "horizon/ui";

/**
 * RulesBoardUI – static overlay listing the basic rules.
 * Attach to a Screen‑Overlay Custom UI gizmo (Execution = Local).
 */
export class RulesBoardUI extends ui.UIComponent<{}> {
  initializeUI() {
    return ui.View({
      children: [
        ui.Text({
          text: "Game Rules",
          style: {
            fontSize: 32,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 12,
            textAlign: "center",
          },
        }),
        ui.Text({ text: "• Get to the top!", style: this.ruleStyle }),
        ui.Text({ text: "• You can double‑jump.", style: this.ruleStyle }),
        ui.Text({ text: "• You can dash once in the air.", style: this.ruleStyle }),
        ui.Text({ text: "• Trampolines launch you high 😉", style: this.ruleStyle }),
      ],
      style: {
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 24,
        borderRadius: 12,
        alignSelf: "center",
        marginTop: 40,
      },
    });
  }

  private get ruleStyle() {
    return { fontSize: 20, color: "#eee", marginBottom: 8 } as ui.TextStyle;
  }
}

ui.UIComponent.register(RulesBoardUI);
