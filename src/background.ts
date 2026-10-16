import { b } from "./browser.js";
import { LOG_PREFIX } from "./constants.js";

b.runtime.onInstalled.addListener((details) => {
  console.log(`${LOG_PREFIX} installed`, details.reason);
});
