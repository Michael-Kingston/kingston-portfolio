import { createRequire as c } from "node:module";
import e from "node:path";
import { fileURLToPath as a } from "node:url";
const p = c(import.meta.url), { app: n, BrowserWindow: t } = p("electron"), r = e.dirname(a(import.meta.url));
process.env.APP_ROOT = e.join(r, "..");
const i = process.env.VITE_DEV_SERVER_URL, _ = e.join(process.env.APP_ROOT, "dist-electron"), s = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? e.join(process.env.APP_ROOT, "public") : s;
let o = null;
function l() {
  o = new t({
    width: 1200,
    height: 800,
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(r, "preload.mjs")
    }
  }), o?.webContents.on("did-finish-load", () => {
    o?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? o?.loadURL(i) : o?.loadFile(e.join(s, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), o = null);
});
n.on("activate", () => {
  t.getAllWindows().length === 0 && l();
});
n.whenReady().then(l);
export {
  _ as MAIN_DIST,
  s as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
