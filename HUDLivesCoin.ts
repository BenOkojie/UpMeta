import * as hz from "horizon/core";
import { UIComponent, View, Text } from "horizon/ui";

/**
 * HUDLivesOverlay – minimalist top‑right HUD that *only* shows lives.
 * ---------------------------------------------------------------
 * No persistent variables, no coins. Every player starts each run with
 * **3 lives**, so we simply render ♥ x3 and leave live‑count wiring for the
 * next iteration.
 *
 * How to use:
 *   1. Add a **Custom UI gizmo** to the scene.
 *   2. Set Display Mode → **Screen Overlay**.
 *   3. Attach this script (Execution = Local).
 */
export class HUDLivesCoin extends UIComponent<typeof HUDLivesCoin> {
  initializeUI() {
    return View({
      children: [
        Text({ text: "♥", style: { fontSize: 28, marginRight: 4 } }),
        Text({ text: "x3", style: { fontSize: 22, fontWeight: "600", color: "white" } }),
      ],
      style: {
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        right: 16,
        top: 16,
        padding: 6,
        backgroundColor: new hz.Color(0, 0, 0),
        borderRadius: 6,
      },
    });
  }
}

hz.Component.register(HUDLivesCoin);
