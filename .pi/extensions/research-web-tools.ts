import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

export default function (pi: ExtensionAPI) {
  type SubagentBridge = {
    registerToolExtension(name: string, path: string): void;
  };

  pi.on("session_start", (_event, ctx) => {
    const globals = globalThis as typeof globalThis & {
      __pi_interactive_subagents?: SubagentBridge;
    };

    const bridge = globals.__pi_interactive_subagents;

    if (!bridge) {
      throw new Error("The interactive subagent extension is not loaded.");
    }

    const packageUrl = new URL(
      "../npm/node_modules/pi-web-access/",
      import.meta.url,
    );

    const manifest = JSON.parse(
      readFileSync(new URL("package.json", packageUrl), "utf-8"),
    );

    const entry = manifest.pi?.extensions?.[0];

    if (typeof entry !== "string") {
      throw new Error("Cannot find the web package's extension entry.");
    }

    const extensionPath = fileURLToPath(new URL(entry, packageUrl));

    if (!existsSync(extensionPath)) {
      throw new Error(`Extension file missing: ${extensionPath}`);
    }

    for (const tool of ["web_search", "fetch_content", "get_search_content"]) {
      bridge.registerToolExtension(tool, extensionPath);
    }

    // ctx.ui.setStatus("research-web-tools", "Web research ready");
  });
}
