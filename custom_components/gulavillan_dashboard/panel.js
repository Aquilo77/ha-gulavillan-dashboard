class GulavillanPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    this._sendAuth();
  }

  connectedCallback() {
    if (this._iframe) return;
    this.style.display = "block";
    this.style.height = "100%";
    this.style.background = "#141c2c";
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Gulavillan");
    iframe.style.border = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.background = "#141c2c";
    iframe.src = "/local/gulavillan/app.html";
    iframe.addEventListener("load", () => this._sendAuth());
    this.append(iframe);
    this._iframe = iframe;
    this._watch();
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  _sendAuth() {
    const token = this._hass && this._hass.auth && this._hass.auth.data && this._hass.auth.data.access_token;
    if (!token || !this._iframe || !this._iframe.contentWindow) return;
    this._iframe.contentWindow.postMessage({ type: "gulavillan-auth", access_token: token }, location.origin);
  }

  async _watch() {
    const tick = async () => {
      try {
        const response = await fetch("/local/gulavillan/version.json?t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!data.version || data.version === this._version) return;
        this._version = data.version;
        this._iframe.src = "/local/gulavillan/app.html?v=" + encodeURIComponent(data.version);
      } catch (err) {
        /* The page also watches version.json. */
      }
    };
    await tick();
    this._timer = setInterval(tick, 30000);
  }
}

customElements.define("gulavillan-panel", GulavillanPanel);
