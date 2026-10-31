/** Sidebar panel entry. Home Assistant creates <gulavillan-dashboard>. */

import { GulavillanDashboard } from "./dashboard";

if (!customElements.get("gulavillan-dashboard")) {
  customElements.define("gulavillan-dashboard", GulavillanDashboard);
}

export { GulavillanDashboard };
