const G = globalThis, ot = G.ShadowRoot && (G.ShadyCSS === void 0 || G.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, lt = /* @__PURE__ */ Symbol(), vt = /* @__PURE__ */ new WeakMap();
let Rt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== lt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ot && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = vt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && vt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ne = (n) => new Rt(typeof n == "string" ? n : n + "", void 0, lt), re = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, r, s) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + n[s + 1], n[0]);
  return new Rt(e, n, lt);
}, se = (n, t) => {
  if (ot) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = G.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, n.appendChild(i);
  }
}, bt = ot ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return ne(e);
})(n) : n;
const { is: ae, defineProperty: oe, getOwnPropertyDescriptor: le, getOwnPropertyNames: ce, getOwnPropertySymbols: de, getPrototypeOf: he } = Object, Y = globalThis, yt = Y.trustedTypes, ue = yt ? yt.emptyScript : "", pe = Y.reactiveElementPolyfillSupport, R = (n, t) => n, K = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? ue : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, t) {
  let e = n;
  switch (t) {
    case Boolean:
      e = n !== null;
      break;
    case Number:
      e = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(n);
      } catch {
        e = null;
      }
  }
  return e;
} }, ct = (n, t) => !ae(n, t), $t = { attribute: !0, type: String, converter: K, reflect: !1, useDefault: !1, hasChanged: ct };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Y.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let V = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = $t) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && oe(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: s } = le(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const o = r?.call(this);
      s?.call(this, a), this.requestUpdate(t, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? $t;
  }
  static _$Ei() {
    if (this.hasOwnProperty(R("elementProperties"))) return;
    const t = he(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(R("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(R("properties"))) {
      const e = this.properties, i = [...ce(e), ...de(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(bt(r));
    } else t !== void 0 && e.push(bt(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return se(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const s = (i.converter?.toAttribute !== void 0 ? i.converter : K).toAttribute(e, i.type);
      this._$Em = t, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const s = i.getPropertyOptions(r), a = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : K;
      this._$Em = r;
      const o = a.fromAttribute(e, s.type);
      this[r] = o ?? this._$Ej?.get(r) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, s) {
    if (t !== void 0) {
      const a = this.constructor;
      if (r === !1 && (s = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? ct)(s, e) || i.useDefault && i.reflect && s === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: s }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), s !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, s] of this._$Ep) this[r] = s;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, s] of i) {
        const { wrapped: a } = s, o = this[r];
        a !== !0 || this._$AL.has(r) || o === void 0 || this.C(r, void 0, s, o);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
V.elementStyles = [], V.shadowRootOptions = { mode: "open" }, V[R("elementProperties")] = /* @__PURE__ */ new Map(), V[R("finalized")] = /* @__PURE__ */ new Map(), pe?.({ ReactiveElement: V }), (Y.reactiveElementVersions ??= []).push("2.1.2");
const dt = globalThis, xt = (n) => n, J = dt.trustedTypes, _t = J ? J.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Ut = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, zt = "?" + C, ge = `<${zt}>`, M = document, z = () => M.createComment(""), D = (n) => n === null || typeof n != "object" && typeof n != "function", ht = Array.isArray, me = (n) => ht(n) || typeof n?.[Symbol.iterator] == "function", it = `[ 	
\f\r]`, N = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, wt = /-->/g, At = />/g, k = RegExp(`>|${it}(?:([^\\s"'>=/]+)(${it}*=${it}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Lt = /'/g, Ct = /"/g, Dt = /^(?:script|style|textarea|title)$/i, fe = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), d = fe(1), A = /* @__PURE__ */ Symbol.for("lit-noChange"), h = /* @__PURE__ */ Symbol.for("lit-nothing"), Ht = /* @__PURE__ */ new WeakMap(), S = M.createTreeWalker(M, 129);
function Wt(n, t) {
  if (!ht(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return _t !== void 0 ? _t.createHTML(t) : t;
}
const ve = (n, t) => {
  const e = n.length - 1, i = [];
  let r, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = N;
  for (let o = 0; o < e; o++) {
    const c = n[o];
    let u, g, p = -1, x = 0;
    for (; x < c.length && (a.lastIndex = x, g = a.exec(c), g !== null); ) x = a.lastIndex, a === N ? g[1] === "!--" ? a = wt : g[1] !== void 0 ? a = At : g[2] !== void 0 ? (Dt.test(g[2]) && (r = RegExp("</" + g[2], "g")), a = k) : g[3] !== void 0 && (a = k) : a === k ? g[0] === ">" ? (a = r ?? N, p = -1) : g[1] === void 0 ? p = -2 : (p = a.lastIndex - g[2].length, u = g[1], a = g[3] === void 0 ? k : g[3] === '"' ? Ct : Lt) : a === Ct || a === Lt ? a = k : a === wt || a === At ? a = N : (a = k, r = void 0);
    const L = a === k && n[o + 1].startsWith("/>") ? " " : "";
    s += a === N ? c + ge : p >= 0 ? (i.push(u), c.slice(0, p) + Ut + c.slice(p) + C + L) : c + C + (p === -2 ? o : L);
  }
  return [Wt(n, s + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class W {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let s = 0, a = 0;
    const o = t.length - 1, c = this.parts, [u, g] = ve(t, e);
    if (this.el = W.createElement(u, i), S.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = S.nextNode()) !== null && c.length < o; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(Ut)) {
          const x = g[a++], L = r.getAttribute(p).split(C), F = /([.?@])?(.*)/.exec(x);
          c.push({ type: 1, index: s, name: F[2], strings: L, ctor: F[1] === "." ? ye : F[1] === "?" ? $e : F[1] === "@" ? xe : Q }), r.removeAttribute(p);
        } else p.startsWith(C) && (c.push({ type: 6, index: s }), r.removeAttribute(p));
        if (Dt.test(r.tagName)) {
          const p = r.textContent.split(C), x = p.length - 1;
          if (x > 0) {
            r.textContent = J ? J.emptyScript : "";
            for (let L = 0; L < x; L++) r.append(p[L], z()), S.nextNode(), c.push({ type: 2, index: ++s });
            r.append(p[x], z());
          }
        }
      } else if (r.nodeType === 8) if (r.data === zt) c.push({ type: 2, index: s });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(C, p + 1)) !== -1; ) c.push({ type: 7, index: s }), p += C.length - 1;
      }
      s++;
    }
  }
  static createElement(t, e) {
    const i = M.createElement("template");
    return i.innerHTML = t, i;
  }
}
function T(n, t, e = n, i) {
  if (t === A) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const s = D(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== s && (r?._$AO?.(!1), s === void 0 ? r = void 0 : (r = new s(n), r._$AT(n, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = r : e._$Cl = r), r !== void 0 && (t = T(n, r._$AS(n, t.values), r, i)), t;
}
class be {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? M).importNode(e, !0);
    S.currentNode = r;
    let s = S.nextNode(), a = 0, o = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let u;
        c.type === 2 ? u = new j(s, s.nextSibling, this, t) : c.type === 1 ? u = new c.ctor(s, c.name, c.strings, this, t) : c.type === 6 && (u = new _e(s, this, t)), this._$AV.push(u), c = i[++o];
      }
      a !== c?.index && (s = S.nextNode(), a++);
    }
    return S.currentNode = M, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = T(this, t, e), D(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== A && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : me(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && D(this._$AH) ? this._$AA.nextSibling.data = t : this.T(M.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = W.createElement(Wt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const s = new be(r, this), a = s.u(this.options);
      s.p(e), this.T(a), this._$AH = s;
    }
  }
  _$AC(t) {
    let e = Ht.get(t.strings);
    return e === void 0 && Ht.set(t.strings, e = new W(t)), e;
  }
  k(t) {
    ht(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const s of t) r === e.length ? e.push(i = new j(this.O(z()), this.O(z()), this, this.options)) : i = e[r], i._$AI(s), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = xt(t).nextSibling;
      xt(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class Q {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, s) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = s, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(t, e = this, i, r) {
    const s = this.strings;
    let a = !1;
    if (s === void 0) t = T(this, t, e, 0), a = !D(t) || t !== this._$AH && t !== A, a && (this._$AH = t);
    else {
      const o = t;
      let c, u;
      for (t = s[0], c = 0; c < s.length - 1; c++) u = T(this, o[i + c], e, c), u === A && (u = this._$AH[c]), a ||= !D(u) || u !== this._$AH[c], u === h ? t = h : t !== h && (t += (u ?? "") + s[c + 1]), this._$AH[c] = u;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ye extends Q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class $e extends Q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class xe extends Q {
  constructor(t, e, i, r, s) {
    super(t, e, i, r, s), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = T(this, t, e, 0) ?? h) === A) return;
    const i = this._$AH, r = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, s = t !== h && (i === h || r);
    r && this.element.removeEventListener(this.name, this, i), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class _e {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    T(this, t);
  }
}
const we = dt.litHtmlPolyfillSupport;
we?.(W, j), (dt.litHtmlVersions ??= []).push("3.3.3");
const Ae = (n, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const s = e?.renderBefore ?? null;
    i._$litPart$ = r = new j(t.insertBefore(z(), s), s, void 0, e ?? {});
  }
  return r._$AI(n), r;
};
const ut = globalThis;
let U = class extends V {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ae(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return A;
  }
};
U._$litElement$ = !0, U.finalized = !0, ut.litElementHydrateSupport?.({ LitElement: U });
const Le = ut.litElementPolyfillSupport;
Le?.({ LitElement: U });
(ut.litElementVersions ??= []).push("4.2.2");
const Ce = { attribute: !0, type: String, converter: K, reflect: !1, hasChanged: ct }, He = (n = Ce, t, e) => {
  const { kind: i, metadata: r } = e;
  let s = globalThis.litPropertyMetadata.get(r);
  if (s === void 0 && globalThis.litPropertyMetadata.set(r, s = /* @__PURE__ */ new Map()), i === "setter" && ((n = Object.create(n)).wrapped = !0), s.set(e.name, n), i === "accessor") {
    const { name: a } = e;
    return { set(o) {
      const c = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(a, c, n, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, n, o), o;
    } };
  }
  if (i === "setter") {
    const { name: a } = e;
    return function(o) {
      const c = this[a];
      t.call(this, o), this.requestUpdate(a, c, n, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Z(n) {
  return (t, e) => typeof e == "object" ? He(n, t, e) : ((i, r, s) => {
    const a = r.hasOwnProperty(s);
    return r.constructor.createProperty(s, i), a ? Object.getOwnPropertyDescriptor(r, s) : void 0;
  })(n, t, e);
}
function $(n) {
  return Z({ ...n, state: !0, attribute: !1 });
}
const pt = { ATTRIBUTE: 1, CHILD: 2 }, gt = (n) => (...t) => ({ _$litDirective$: n, values: t });
let mt = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
};
const jt = "important", ke = " !" + jt, Se = gt(class extends mt {
  constructor(n) {
    if (super(n), n.type !== pt.ATTRIBUTE || n.name !== "style" || n.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(n) {
    return Object.keys(n).reduce((t, e) => {
      const i = n[e];
      return i == null ? t : t + `${e = e.includes("-") ? e : e.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${i};`;
    }, "");
  }
  update(n, [t]) {
    const { style: e } = n.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
    for (const i of this.ft) t[i] == null && (this.ft.delete(i), i.includes("-") ? e.removeProperty(i) : e[i] = null);
    for (const i in t) {
      const r = t[i];
      if (r != null) {
        this.ft.add(i);
        const s = typeof r == "string" && r.endsWith(ke);
        i.includes("-") || s ? e.setProperty(i, s ? r.slice(0, -11) : r, s ? jt : "") : e[i] = r;
      }
    }
    return A;
  }
});
const kt = gt(class extends mt {
  constructor(n) {
    if (super(n), n.type !== pt.ATTRIBUTE || n.name !== "class" || n.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(n) {
    return " " + Object.keys(n).filter((t) => n[t]).join(" ") + " ";
  }
  update(n, [t]) {
    if (this.st === void 0) {
      this.st = /* @__PURE__ */ new Set(), n.strings !== void 0 && (this.nt = new Set(n.strings.join(" ").split(/\s/).filter((i) => i !== "")));
      for (const i in t) t[i] && !this.nt?.has(i) && this.st.add(i);
      return this.render(t);
    }
    const e = n.element.classList;
    for (const i of this.st) i in t || (e.remove(i), this.st.delete(i));
    for (const i in t) {
      const r = !!t[i];
      r === this.st.has(i) || this.nt?.has(i) || (r ? (e.add(i), this.st.add(i)) : (e.remove(i), this.st.delete(i)));
    }
    return A;
  }
}), Zt = [
  "entity",
  "light",
  "climate",
  "sensor",
  "button",
  "text",
  "clock",
  "image",
  "group",
  "markdown"
], St = /^[A-Za-z0-9_-]{1,64}$/, Me = /^mdi:[a-z0-9-]+$/, Mt = /^[a-z0-9_]+\.[a-z0-9_]+$/, Ve = /^[a-z0-9_]+$/, Ee = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent)$/, Te = {
  entity: [6, 4],
  light: [6, 5],
  climate: [8, 6],
  sensor: [8, 5],
  button: [4, 3],
  text: [8, 2],
  clock: [8, 5],
  image: [8, 6],
  group: [8, 7],
  markdown: [10, 5]
};
function Vt() {
  return {
    version: 1,
    language: "sv",
    theme: "auto",
    gridColumns: 24,
    pages: [
      {
        id: "hem",
        title: "Hem",
        icon: "mdi:home-variant",
        widgets: [
          {
            id: "klocka",
            type: "clock",
            x: 0,
            y: 0,
            w: 10,
            h: 6,
            style: { fontSize: 64 },
            config: { mode: "both" }
          },
          {
            id: "titel",
            type: "text",
            x: 10,
            y: 0,
            w: 14,
            h: 2,
            style: { fontSize: 40 },
            config: { text: "Gulavillan", align: "left" }
          },
          {
            id: "valkomst",
            type: "markdown",
            x: 10,
            y: 2,
            w: 14,
            h: 4,
            style: {},
            config: {
              content: `Det här är en fri yta.

Tryck på pennan för att lägga till, dra och ändra storlek på widgets. Layouten sparas i Home Assistant och följer med mellan enheter.`,
              html: !1
            }
          }
        ]
      }
    ]
  };
}
function X(n) {
  const t = Math.random().toString(36).slice(2, 8), e = Date.now().toString(36);
  return `${n}_${e}_${t}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}
function f(n, t, e) {
  return Math.min(e, Math.max(t, n));
}
function Pe(n, t, e, i) {
  const r = (a, o) => n.some(
    (c) => a < c.x + c.w && a + t > c.x && o < c.y + c.h && o + e > c.y
  );
  for (let a = 0; a < 80; a += 1)
    for (let o = 0; o <= i - t; o += 1)
      if (!r(o, a)) return { x: o, y: a };
  return { x: 0, y: n.reduce((a, o) => Math.max(a, o.y + o.h), 0) };
}
function Ne(n, t, e) {
  const [i, r] = Te[n], s = Pe(t.widgets, Math.min(i, e), r, e), a = {
    id: X(n),
    type: n,
    x: s.x,
    y: s.y,
    w: Math.min(i, e),
    h: r,
    style: {},
    config: Bt(n)
  };
  return n === "clock" && (a.style.fontSize = 64), n === "text" && (a.style.fontSize = 32), a;
}
function Bt(n) {
  switch (n) {
    case "entity":
      return { entity_id: "", name: "", show_toggle: !0 };
    case "light":
      return { entity_id: "", name: "", show_brightness: !0 };
    case "climate":
      return { entity_id: "", name: "", step: 0.5 };
    case "sensor":
      return { entity_id: "", name: "", hours: 24, decimals: 1 };
    case "button":
      return { label: "", domain: "", service: "", data: "", entity_id: "", confirm: !1 };
    case "text":
      return { text: "", align: "left" };
    case "clock":
      return { mode: "both" };
    case "image":
      return { source: "entity", entity_id: "", url: "", fit: "cover", refresh: 10 };
    case "group":
      return { name: "", entity_ids: [], show_toggle: !0 };
    case "markdown":
      return { content: "", html: !1 };
  }
}
function P(n) {
  if (!n || typeof n != "object" || Array.isArray(n))
    throw new Error("invalid");
  const t = n;
  if (t.version !== void 0 && t.version !== 1) throw new Error("invalid");
  const e = t.language === "en" ? "en" : "sv", i = t.theme === "light" || t.theme === "dark" || t.theme === "auto" ? t.theme : "auto", r = f(_(t.gridColumns, 24), 8, 48);
  if (!Array.isArray(t.pages) || t.pages.length === 0) throw new Error("invalid");
  const s = /* @__PURE__ */ new Set(), a = t.pages.slice(0, 20).map((o, c) => Re(o, c, r, s));
  if (!a.length) throw new Error("invalid");
  return { version: 1, language: e, theme: i, gridColumns: r, pages: a };
}
function Oe(n) {
  return JSON.stringify(P(n), null, 2);
}
function Ie(n) {
  return P(JSON.parse(n));
}
function Et(n) {
  return [...n].sort((t, e) => t.y - e.y || t.x - e.x);
}
function Re(n, t, e, i) {
  const r = tt(n), s = Ft(r.id, `page_${t + 1}`, i), a = E(y(r.title).trim() || `Sida ${t + 1}`, 80), o = qt(r.icon), c = Array.isArray(r.widgets) ? r.widgets : [], u = {
    id: s,
    title: a,
    widgets: c.slice(0, 80).map((g, p) => Ue(g, p, e, i)).filter((g) => g !== null)
  };
  return o && (u.icon = o), u;
}
function Ue(n, t, e, i) {
  const r = tt(n);
  if (!Zt.includes(r.type)) return null;
  const s = r.type, a = Ft(r.id, `${s}_${t + 1}`, i);
  let o = f(_(r.w, 4), 2, e);
  const c = f(_(r.x, 0), 0, Math.max(0, e - 2));
  return c + o > e && (o = e - c), {
    id: a,
    type: s,
    x: c,
    y: f(_(r.y, 0), 0, 200),
    w: o,
    h: f(_(r.h, 3), 2, 40),
    style: ze(r.style),
    config: De(s, r.config)
  };
}
function ze(n) {
  const t = tt(n), e = {}, i = Tt(t.color), r = Tt(t.background), s = qt(t.icon);
  return i && (e.color = i), r && (e.background = r), t.fontSize !== void 0 && t.fontSize !== "" && (e.fontSize = f(_(t.fontSize, 16), 8, 120)), t.borderRadius !== void 0 && t.borderRadius !== "" && (e.borderRadius = f(_(t.borderRadius, 18), 0, 80)), s && (e.icon = s), e;
}
function De(n, t) {
  const e = tt(t), i = Bt(n), r = (s = "entity_id") => {
    const a = y(e[s]).trim();
    i[s] = Mt.test(a) ? a : "";
  };
  if ((n === "entity" || n === "light" || n === "climate" || n === "sensor") && (r(), i.name = E(y(e.name).trim(), 80)), n === "entity" && (i.show_toggle = e.show_toggle !== !1), n === "light" && (i.show_brightness = e.show_brightness !== !1), n === "climate" && (i.step = f(Ze(e.step, 0.5), 0.1, 5)), n === "sensor" && (i.hours = f(_(e.hours, 24), 1, 168), i.decimals = f(_(e.decimals, 1), 0, 3)), n === "button" && (r(), i.label = E(y(e.label).trim(), 80), i.domain = Pt(e.domain), i.service = Pt(e.service), i.data = je(e.data), i.confirm = e.confirm === !0), n === "text" && (i.text = E(y(e.text), 2e3), i.align = e.align === "center" || e.align === "right" ? e.align : "left"), n === "clock" && (i.mode = e.mode === "time" || e.mode === "date" ? e.mode : "both"), n === "image" && (r(), i.source = e.source === "url" ? "url" : "entity", i.url = We(y(e.url)), i.fit = e.fit === "contain" ? "contain" : "cover", i.refresh = f(_(e.refresh, 10), 0, 3600)), n === "group") {
    i.name = E(y(e.name).trim(), 80);
    const s = Array.isArray(e.entity_ids) ? e.entity_ids : [];
    i.entity_ids = s.map((a) => y(a).trim()).filter((a) => Mt.test(a)).slice(0, 40), i.show_toggle = e.show_toggle !== !1;
  }
  return n === "markdown" && (i.content = E(y(e.content), 2e4), i.html = e.html === !0), i;
}
function Ft(n, t, e) {
  let i = y(n);
  for (St.test(i) || (i = t), St.test(i) || (i = X("id")); e.has(i); ) i = X("id");
  return e.add(i), i;
}
function qt(n) {
  const t = y(n).trim();
  return Me.test(t) ? t : "";
}
function Tt(n) {
  const t = y(n).trim();
  return Ee.test(t) ? t : "";
}
function Pt(n) {
  const t = y(n).trim();
  return Ve.test(t) ? t : "";
}
function We(n) {
  const t = n.trim();
  if (!t || t.length > 500 || /\s/.test(t)) return "";
  const e = t.toLowerCase();
  return /^(javascript|data|file|vbscript):/.test(e) || t.startsWith("//") ? "" : t.startsWith("/") || e.startsWith("https://") || e.startsWith("http://") ? t : "";
}
function je(n) {
  const t = y(n).trim();
  if (!t) return "";
  try {
    const e = JSON.parse(t);
    return !e || typeof e != "object" || Array.isArray(e) ? "" : JSON.stringify(e);
  } catch {
    return "";
  }
}
function tt(n) {
  return !n || typeof n != "object" || Array.isArray(n) ? {} : n;
}
function y(n) {
  return typeof n == "string" ? n : "";
}
function _(n, t) {
  if (typeof n == "boolean") return t;
  const e = typeof n == "number" ? n : Number(n);
  return Number.isFinite(e) ? Math.round(e) : t;
}
function Ze(n, t) {
  if (typeof n == "boolean") return t;
  const e = typeof n == "number" ? n : Number(n);
  return Number.isFinite(e) ? e : t;
}
function E(n, t) {
  return n.length > t ? n.slice(0, t) : n;
}
async function ft(n, t) {
  if (typeof n.callWS == "function")
    return n.callWS(t);
  if (!n.connection.sendMessagePromise)
    throw new Error("missing websocket");
  return n.connection.sendMessagePromise(t);
}
async function Be(n) {
  const t = await ft(n, { type: "gulavillan_dashboard/layout/get" });
  return P(t);
}
async function Fe(n, t) {
  const e = P(t), i = await ft(n, {
    type: "gulavillan_dashboard/layout/save",
    layout: e
  });
  return P(i);
}
async function qe(n, t) {
  const e = n.connection.subscribeEvents(t, "state_changed");
  return e;
}
async function Ge(n, t, e) {
  const i = new Date(Date.now() - e * 60 * 60 * 1e3).toISOString(), r = await ft(n, {
    type: "history/history_during_period",
    start_time: i,
    end_time: (/* @__PURE__ */ new Date()).toISOString(),
    entity_ids: [t],
    minimal_response: !1,
    no_attributes: !0,
    significant_changes_only: !1
  });
  return Ke(r, t);
}
function Ke(n, t) {
  if (!n || typeof n != "object") return [];
  const e = n[t];
  if (!Array.isArray(e)) return [];
  const i = [];
  for (const r of e) {
    if (!r || typeof r != "object") continue;
    const s = r, a = s.state ?? s.s, o = typeof a == "number" ? a : Number.parseFloat(String(a));
    Number.isFinite(o) && i.push(o);
  }
  return i;
}
const Je = /* @__PURE__ */ new Set([
  "light",
  "switch",
  "input_boolean",
  "fan",
  "humidifier",
  "media_player",
  "climate",
  "automation",
  "remote",
  "siren",
  "valve",
  "water_heater",
  "lawn_mower",
  "vacuum",
  "alarm_control_panel",
  "lock",
  "cover"
]);
function Gt(n) {
  return Je.has(n.split(".")[0] ?? "");
}
function Kt(n) {
  return !!n && !["off", "closed", "locked", "unavailable", "unknown", "idle", "standby"].includes(n);
}
async function Xe(n, t) {
  const e = t.split(".")[0], i = n.states[t]?.state;
  if (e === "lock") {
    await n.callService("lock", i === "locked" ? "unlock" : "lock", { entity_id: t });
    return;
  }
  if (e === "cover") {
    await n.callService("cover", i === "open" ? "close_cover" : "open_cover", {
      entity_id: t
    });
    return;
  }
  await n.callService("homeassistant", "toggle", { entity_id: t });
}
function B(n, t) {
  const e = n?.attributes.friendly_name;
  return typeof e == "string" && e.trim() ? e : t;
}
function et(n, t, e) {
  const i = n?.states?.[t];
  if (!i) return e;
  if (n?.formatEntityState)
    try {
      const r = n.formatEntityState(i);
      if (r) return r;
    } catch {
    }
  return i.state;
}
function Ye(n, t) {
  const e = Object.values(n?.states ?? {}), i = t.trim().toLowerCase();
  return e.filter((r) => {
    if (!i) return !0;
    const s = String(r.attributes.friendly_name ?? "").toLowerCase();
    return r.entity_id.includes(i) || s.includes(i);
  }).sort((r, s) => r.entity_id.localeCompare(s.entity_id, "sv")).slice(0, 60);
}
function Qe(n) {
  return Object.keys(n?.services ?? {}).sort((t, e) => t.localeCompare(e, "sv"));
}
function ti(n, t) {
  return Object.keys(n?.services?.[t] ?? {}).sort((e, i) => e.localeCompare(i, "sv"));
}
function ei(n, t, e = "") {
  if (e) return e;
  const i = n?.states?.[t];
  if (!i) return "";
  const r = i.attributes.access_token, s = typeof r == "string" && r ? `?token=${encodeURIComponent(r)}` : "";
  if (t.startsWith("camera.") && s)
    return O(n, `/api/camera_proxy/${t}${s}`);
  if (t.startsWith("image.") && s)
    return O(n, `/api/image_proxy/${t}${s}`);
  const a = i.attributes.entity_picture;
  return typeof a == "string" ? O(n, a) : t.startsWith("camera.") ? O(n, `/api/camera_proxy/${t}`) : t.startsWith("image.") ? O(n, `/api/image_proxy/${t}`) : "";
}
function O(n, t) {
  return t ? /^(https?:|data:image\/)/i.test(t) ? t : n?.hassUrl ? n.hassUrl(t) : t : "";
}
var ii = "M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z", ni = "M20 20.5C20 21.3 19.3 22 18.5 22H13C12.6 22 12.3 21.9 12 21.6L8 17.4L8.7 16.6C8.9 16.4 9.2 16.3 9.5 16.3H9.7L12 18V9C12 8.4 12.4 8 13 8S14 8.4 14 9V13.5L15.2 13.6L19.1 15.8C19.6 16 20 16.6 20 17.1V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.1 2.9 14 4 14H8V12H4V4H20V12H18V14H20C21.1 14 22 13.1 22 12V4C22 2.9 21.1 2 20 2Z", ri = "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z", si = "M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z", ai = "M8,9H11V4H13V9H16L20,17H4L8,9M14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18H14Z", oi = "M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z", li = "M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z", ci = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z", di = "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z", hi = "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z", ui = "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z", pi = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z", gi = "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z", mi = "M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z", fi = "M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z", vi = "M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z", bi = "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z", yi = "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z", $i = "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z", xi = "M6,2C4.89,2 4,2.9 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13M8.93,12.22H16V19.29L13.88,17.17L11.05,20L8.22,17.17L11.05,14.35", _i = "M6,2C4.89,2 4,2.9 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,3.5L18.5,9H13M10.05,11.22L12.88,14.05L15,11.93V19H7.93L10.05,16.88L7.22,14.05", wi = "M15,2L17,9H7L9,2M11,10H13V20H16V22H8V20H11V10Z", Ai = "M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z", Li = "M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z", Ci = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M14,5.89C13.62,5.9 13.26,6.15 13.1,6.54L11.81,9.77L11.71,10C11,10.13 10.41,10.6 10.14,11.26C9.73,12.29 10.23,13.45 11.26,13.86C12.29,14.27 13.45,13.77 13.86,12.74C14.12,12.08 14,11.32 13.57,10.76L13.67,10.5L14.96,7.29L14.97,7.26C15.17,6.75 14.92,6.17 14.41,5.96C14.28,5.91 14.15,5.89 14,5.89M10,6A1,1 0 0,0 9,7A1,1 0 0,0 10,8A1,1 0 0,0 11,7A1,1 0 0,0 10,6M7,9A1,1 0 0,0 6,10A1,1 0 0,0 7,11A1,1 0 0,0 8,10A1,1 0 0,0 7,9M17,9A1,1 0 0,0 16,10A1,1 0 0,0 17,11A1,1 0 0,0 18,10A1,1 0 0,0 17,9Z", Hi = "M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z", ki = "M12,3L20,9V21H15V14H9V21H4V9L12,3Z", Si = "M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z", Mi = "M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6H20.56C21.35 6 22 6.63 22 7.41V16.59C22 17.37 21.35 18 20.56 18M6.81 15.19V11.53L8.73 13.88L10.65 11.53V15.19H12.58V8.81H10.65L8.73 11.16L6.81 8.81H4.89V15.19H6.81M19.69 12H17.77V8.81H15.85V12H13.92L16.81 15.28L19.69 12Z", Vi = "M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z", Ei = "M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z", Ti = "M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z", Pi = "M15 22H13C11.9 22 11 21.1 11 20V15H17V20C17 21.1 16.1 22 15 22M7 14H21L15 9.71V6C15 4.39 13.94 2 11 2S7 4.39 7 6C7 6.45 6.81 7 6 7H5V3H3V12H5V9H6C8.2 9 9 7.21 9 6C9 5.67 9.1 4 11 4C12.83 4 13 5.54 13 6V9.71L7 14Z", Ni = "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z", Oi = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z", Ii = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z", Ri = "M16,7V3H14V7H10V3H8V7H8C7,7 6,8 6,9V14.5L9.5,18V21H14.5V18L18,14.5V9C18,8 17,7 16,7Z", Ui = "M7.95,3L6.53,5.19L7.95,7.4H7.94L5.95,10.5L4.22,9.6L5.64,7.39L4.22,5.19L6.22,2.09L7.95,3M13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L11.95,10.4L10.22,9.5L11.64,7.3L10.22,5.1L12.22,2L13.95,2.89M20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89M2,22V14A2,2 0 0,1 4,12H20A2,2 0 0,1 22,14V22H20V20H4V22H2M6,14A1,1 0 0,0 5,15V17A1,1 0 0,0 6,18A1,1 0 0,0 7,17V15A1,1 0 0,0 6,14M10,14A1,1 0 0,0 9,15V17A1,1 0 0,0 10,18A1,1 0 0,0 11,17V15A1,1 0 0,0 10,14M14,14A1,1 0 0,0 13,15V17A1,1 0 0,0 14,18A1,1 0 0,0 15,17V15A1,1 0 0,0 14,14M18,14A1,1 0 0,0 17,15V17A1,1 0 0,0 18,18A1,1 0 0,0 19,17V15A1,1 0 0,0 18,14Z", zi = "M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z", Di = "M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z", Wi = "M12.5 7C12.5 5.89 13.39 5 14.5 5H18C19.1 5 20 5.9 20 7V9.16C18.84 9.57 18 10.67 18 11.97V14H12.5V7M6 11.96V14H11.5V7C11.5 5.89 10.61 5 9.5 5H6C4.9 5 4 5.9 4 7V9.15C5.16 9.56 6 10.67 6 11.96M20.66 10.03C19.68 10.19 19 11.12 19 12.12V15H5V12C5 10.9 4.11 10 3 10S1 10.9 1 12V17C1 18.1 1.9 19 3 19V21H5V19H19V21H21V19C22.1 19 23 18.1 23 17V12C23 10.79 21.91 9.82 20.66 10.03Z", ji = "M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18A2,2 0 0,0 3,20H21A2,2 0 0,0 23,18V6C23,4.89 22.1,4 21,4Z", Zi = "M5,3C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3H5M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z", Bi = "M7.5,2C5.71,3.15 4.5,5.18 4.5,7.5C4.5,9.82 5.71,11.85 7.53,13C4.46,13 2,10.54 2,7.5A5.5,5.5 0 0,1 7.5,2M19.07,3.5L20.5,4.93L4.93,20.5L3.5,19.07L19.07,3.5M12.89,5.93L11.41,5L9.97,6L10.39,4.3L9,3.24L10.75,3.12L11.33,1.47L12,3.1L13.73,3.13L12.38,4.26L12.89,5.93M9.59,9.54L8.43,8.81L7.31,9.59L7.65,8.27L6.56,7.44L7.92,7.35L8.37,6.06L8.88,7.33L10.24,7.36L9.19,8.23L9.59,9.54M19,13.5A5.5,5.5 0 0,1 13.5,19C12.28,19 11.15,18.6 10.24,17.93L17.93,10.24C18.6,11.15 19,12.28 19,13.5M14.6,20.08L17.37,18.93L17.13,22.28L14.6,20.08M18.93,17.38L20.08,14.61L22.28,17.15L18.93,17.38M20.08,12.42L18.94,9.64L22.28,9.88L20.08,12.42M9.63,18.93L12.4,20.08L9.87,22.27L9.63,18.93Z", Fi = "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z", qi = "M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z", Gi = "M17 6H7C3.69 6 1 8.69 1 12S3.69 18 7 18H17C20.31 18 23 15.31 23 12S20.31 6 17 6M17 16H7C4.79 16 3 14.21 3 12S4.79 8 7 8H17C19.21 8 21 9.79 21 12S19.21 16 17 16M17 9C15.34 9 14 10.34 14 12S15.34 15 17 15 20 13.66 20 12 18.66 9 17 9Z", Ki = "M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07M18.5,10H16.5L12,22H14L15.12,19H19.87L21,22H23L18.5,10M15.88,17L17.5,12.67L19.12,17H15.88Z", Ji = "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z", Xi = "M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z", Yi = "M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z", Qi = "M11,4L7,13H19L15,4H11M4,14V22H6V19H14V14H12V17H6V14H4Z", tn = "M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z", en = "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z", nn = "M12.74,5.47C15.1,6.5 16.35,9.03 15.92,11.46C17.19,12.56 18,14.19 18,16V16.17C18.31,16.06 18.65,16 19,16A3,3 0 0,1 22,19A3,3 0 0,1 19,22H6A4,4 0 0,1 2,18A4,4 0 0,1 6,14H6.27C5,12.45 4.6,10.24 5.5,8.26C6.72,5.5 9.97,4.24 12.74,5.47M11.93,7.3C10.16,6.5 8.09,7.31 7.31,9.07C6.85,10.09 6.93,11.22 7.41,12.13C8.5,10.83 10.16,10 12,10C12.7,10 13.38,10.12 14,10.34C13.94,9.06 13.18,7.86 11.93,7.3M13.55,3.64C13,3.4 12.45,3.23 11.88,3.12L14.37,1.82L15.27,4.71C14.76,4.29 14.19,3.93 13.55,3.64M6.09,4.44C5.6,4.79 5.17,5.19 4.8,5.63L4.91,2.82L7.87,3.5C7.25,3.71 6.65,4.03 6.09,4.44M18,9.71C17.91,9.12 17.78,8.55 17.59,8L19.97,9.5L17.92,11.73C18.03,11.08 18.05,10.4 18,9.71M3.04,11.3C3.11,11.9 3.24,12.47 3.43,13L1.06,11.5L3.1,9.28C3,9.93 2.97,10.61 3.04,11.3M19,18H16V16A4,4 0 0,0 12,12A4,4 0 0,0 8,16H6A2,2 0 0,0 4,18A2,2 0 0,0 6,20H19A1,1 0 0,0 20,19A1,1 0 0,0 19,18Z", rn = "M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13";
const sn = {
  "mdi:alert-circle-outline": ii,
  "mdi:button-pointer": ni,
  "mdi:calendar": ri,
  "mdi:camera": si,
  "mdi:ceiling-light": ai,
  "mdi:cellphone": oi,
  "mdi:chart-line": li,
  "mdi:check": ci,
  "mdi:chevron-down": di,
  "mdi:chevron-up": hi,
  "mdi:clock-outline": ui,
  "mdi:close": pi,
  "mdi:cog": gi,
  "mdi:content-save": mi,
  "mdi:cursor-move": fi,
  "mdi:delete-outline": vi,
  "mdi:door": bi,
  "mdi:download": yi,
  "mdi:fan": $i,
  "mdi:floor-lamp": wi,
  "mdi:file-export": xi,
  "mdi:file-import": _i,
  "mdi:format-list-bulleted": Ai,
  "mdi:format-text": Li,
  "mdi:gauge": Ci,
  "mdi:help-circle-outline": Hi,
  "mdi:home-variant": ki,
  "mdi:image-outline": Si,
  "mdi:language-markdown": Mi,
  "mdi:lightbulb": Vi,
  "mdi:lightbulb-outline": Ei,
  "mdi:monitor": Ti,
  "mdi:outdoor-lamp": Pi,
  "mdi:palette": Ni,
  "mdi:pencil": Oi,
  "mdi:plus": Ii,
  "mdi:power-plug": Ri,
  "mdi:radiator": Ui,
  "mdi:resize-bottom-right": zi,
  "mdi:silverware-fork-knife": Di,
  "mdi:sofa": Wi,
  "mdi:tablet": ji,
  "mdi:text-box-outline": Zi,
  "mdi:theme-light-dark": Bi,
  "mdi:thermometer": Fi,
  "mdi:thermostat": qi,
  "mdi:toggle-switch-outline": Gi,
  "mdi:translate": Ki,
  "mdi:undo": Ji,
  "mdi:upload": Xi,
  "mdi:view-dashboard-outline": Yi,
  "mdi:wall-sconce": Qi,
  "mdi:water-percent": tn,
  "mdi:weather-night": en,
  "mdi:weather-partly-cloudy": nn,
  "mdi:white-balance-sunny": rn
}, an = {
  light: "mdi:lightbulb",
  switch: "mdi:power-plug",
  sensor: "mdi:gauge",
  binary_sensor: "mdi:checkbox-blank-circle-outline",
  climate: "mdi:thermostat",
  camera: "mdi:camera",
  image: "mdi:image-outline",
  fan: "mdi:fan",
  cover: "mdi:window-shutter",
  lock: "mdi:lock",
  media_player: "mdi:cast",
  person: "mdi:account",
  weather: "mdi:weather-partly-cloudy",
  script: "mdi:script-text-outline",
  automation: "mdi:robot",
  input_boolean: "mdi:toggle-switch-outline",
  scene: "mdi:palette"
};
function Jt(n) {
  return an[n.split(".")[0] ?? ""] ?? "mdi:circle-outline";
}
function m(n) {
  const t = n && n.startsWith("mdi:") ? n : "";
  if (!t) return h;
  if (typeof customElements < "u" && customElements.get("ha-icon"))
    return d`<ha-icon icon=${t}></ha-icon>`;
  const e = sn[t];
  return e ? d`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d=${e} fill="currentColor"></path></svg>` : d`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>`;
}
const Nt = {
  sv: {
    edit: "Redigera",
    done: "Klar",
    add: "Lägg till",
    delete: "Ta bort",
    undo: "Ångra",
    export: "Exportera",
    import: "Importera",
    saved: "Sparat",
    saving: "Sparar…",
    save_failed: "Kunde inte spara",
    loading: "Laddar layout…",
    load_failed: "Kunde inte hämta layouten",
    retry: "Försök igen",
    admin_only: "Bara administratörer kan ändra layouten",
    language: "Språk",
    theme: "Tema",
    theme_auto: "Följ Home Assistant",
    theme_light: "Ljust",
    theme_dark: "Mörkt",
    desktop: "Dator",
    tablet: "Surfplatta",
    phone: "Telefon",
    preview: "Förhandsvisning",
    pages: "Sidor",
    add_page: "Ny sida",
    delete_page: "Ta bort sida",
    page_name: "Sidnamn",
    page_icon: "Sidikon",
    widgets: "Widgets",
    content: "Innehåll",
    appearance: "Utseende",
    position: "Plats",
    select_widget: "Välj en widget, eller ändra sidan här.",
    entity: "Entitet",
    search_entities: "Sök entiteter",
    no_entities: "Inga entiteter matchar",
    no_entity: "Ingen entitet vald",
    unavailable: "Otillgänglig",
    unknown: "Okänt",
    brightness: "Ljusstyrka",
    target: "Mål",
    now: "Nu",
    history_empty: "Ingen historik ännu",
    service: "Tjänst",
    service_data: "Data (JSON)",
    domain: "Domän",
    confirm_first: "Fråga först",
    confirm: "Bekräfta",
    cancel: "Avbryt",
    confirm_service: "Vill du köra tjänsten?",
    called: "Tjänsten kördes",
    call_failed: "Tjänsten kunde inte köras",
    missing_service: "Välj domän och tjänst",
    text: "Text",
    align: "Justering",
    left: "Vänster",
    center: "Mitten",
    right: "Höger",
    icon: "Ikon",
    color: "Textfärg",
    background: "Bakgrund",
    font_size: "Textstorlek",
    radius: "Hörnradie",
    clear: "Rensa",
    name: "Namn",
    show_toggle: "Visa knapp",
    show_brightness: "Visa ljusstyrka",
    hours: "Timmar historik",
    decimals: "Decimaler",
    step: "Steg",
    label: "Etikett",
    source: "Källa",
    url: "Sökväg eller adress",
    fit: "Passning",
    cover: "Fyll",
    contain: "Hela bilden",
    refresh: "Uppdatera (sekunder)",
    camera: "Kamera eller bild",
    entities: "Entiteter",
    add_entity: "Lägg till entitet",
    allow_html: "Tolka som HTML",
    html_hint: "Skript och formulär tas bort.",
    markdown_hint: "Markdown. Rubriker, listor, länkar och fetstil.",
    mode: "Visning",
    time: "Tid",
    date: "Datum",
    both: "Tid och datum",
    width: "Bredd",
    height: "Höjd",
    import_invalid: "Ogiltig layoutfil",
    import_done: "Layouten importerades",
    empty_page: "Sidan är tom. Lägg till en widget.",
    placeholder_text: "Skriv något",
    placeholder_markdown: "Skriv en text",
    move_up: "Upp",
    move_down: "Ner",
    grow: "Högre",
    shrink: "Lägre",
    widget_entity: "Entitetsruta",
    widget_light: "Lampa",
    widget_climate: "Klimat",
    widget_sensor: "Sensor",
    widget_button: "Knapp",
    widget_text: "Text",
    widget_clock: "Klocka",
    widget_image: "Bild / kamera",
    widget_group: "Grupp",
    widget_markdown: "Textblock",
    group_empty: "Inga entiteter i gruppen",
    image_empty: "Ingen bild",
    target_entity: "Målentitet",
    on: "På",
    off: "Av"
  },
  en: {
    edit: "Edit",
    done: "Done",
    add: "Add",
    delete: "Delete",
    undo: "Undo",
    export: "Export",
    import: "Import",
    saved: "Saved",
    saving: "Saving…",
    save_failed: "Could not save",
    loading: "Loading layout…",
    load_failed: "Could not load the layout",
    retry: "Try again",
    admin_only: "Only administrators can change the layout",
    language: "Language",
    theme: "Theme",
    theme_auto: "Follow Home Assistant",
    theme_light: "Light",
    theme_dark: "Dark",
    desktop: "Desktop",
    tablet: "Tablet",
    phone: "Phone",
    preview: "Preview",
    pages: "Pages",
    add_page: "New page",
    delete_page: "Delete page",
    page_name: "Page name",
    page_icon: "Page icon",
    widgets: "Widgets",
    content: "Content",
    appearance: "Appearance",
    position: "Position",
    select_widget: "Select a widget, or edit the page here.",
    entity: "Entity",
    search_entities: "Search entities",
    no_entities: "No entities match",
    no_entity: "No entity selected",
    unavailable: "Unavailable",
    unknown: "Unknown",
    brightness: "Brightness",
    target: "Target",
    now: "Now",
    history_empty: "No history yet",
    service: "Service",
    service_data: "Data (JSON)",
    domain: "Domain",
    confirm_first: "Ask first",
    confirm: "Confirm",
    cancel: "Cancel",
    confirm_service: "Run this service?",
    called: "Service called",
    call_failed: "The service could not be called",
    missing_service: "Choose a domain and service",
    text: "Text",
    align: "Alignment",
    left: "Left",
    center: "Center",
    right: "Right",
    icon: "Icon",
    color: "Text color",
    background: "Background",
    font_size: "Font size",
    radius: "Corner radius",
    clear: "Clear",
    name: "Name",
    show_toggle: "Show toggle",
    show_brightness: "Show brightness",
    hours: "Hours of history",
    decimals: "Decimals",
    step: "Step",
    label: "Label",
    source: "Source",
    url: "Path or address",
    fit: "Fit",
    cover: "Cover",
    contain: "Contain",
    refresh: "Refresh (seconds)",
    camera: "Camera or image",
    entities: "Entities",
    add_entity: "Add entity",
    allow_html: "Render as HTML",
    html_hint: "Scripts and forms are removed.",
    markdown_hint: "Markdown. Headings, lists, links and bold text.",
    mode: "Display",
    time: "Time",
    date: "Date",
    both: "Time and date",
    width: "Width",
    height: "Height",
    import_invalid: "Invalid layout file",
    import_done: "Layout imported",
    empty_page: "This page is empty. Add a widget.",
    placeholder_text: "Write something",
    placeholder_markdown: "Write some text",
    move_up: "Up",
    move_down: "Down",
    grow: "Taller",
    shrink: "Shorter",
    widget_entity: "Entity tile",
    widget_light: "Light",
    widget_climate: "Climate",
    widget_sensor: "Sensor",
    widget_button: "Button",
    widget_text: "Text",
    widget_clock: "Clock",
    widget_image: "Image / camera",
    widget_group: "Group",
    widget_markdown: "Text block",
    group_empty: "No entities in the group",
    image_empty: "No image",
    target_entity: "Target entity",
    on: "On",
    off: "Off"
  }
};
function l(n, t) {
  return n === "en" ? Nt.en[t] : Nt.sv[t];
}
const on = re`
  :host {
    display: block;
    height: 100%;
    min-height: 100%;
    color: var(--gv-text);
    background: var(--gv-bg);
    font-family: var(--ha-font-family-body, "Segoe UI", system-ui, sans-serif);
    --gv-bg: var(--primary-background-color, #10151c);
    --gv-card: var(--card-background-color, #1b2430);
    --gv-text: var(--primary-text-color, #f3f0e8);
    --gv-muted: var(--secondary-text-color, #b3aa9c);
    --gv-accent: var(--primary-color, #e0b15a);
    --gv-accent-text: var(--text-primary-color, #1c1408);
    --gv-divider: var(--divider-color, rgba(255, 255, 255, 0.08));
    --gv-shadow: var(--ha-card-box-shadow, 0 12px 32px rgba(0, 0, 0, 0.18));
    --gv-radius: var(--ha-card-border-radius, 20px);
    container-type: inline-size;
  }

  :host([theme="light"]) {
    color-scheme: light;
    --gv-bg: #f4f0e7;
    --gv-card: #fffdf8;
    --gv-text: #211c16;
    --gv-muted: #6d6458;
    --gv-accent: #9a6b12;
    --gv-accent-text: #fffaf0;
    --gv-divider: rgba(48, 36, 18, 0.12);
    --gv-shadow: 0 10px 28px rgba(70, 48, 12, 0.08);
  }

  :host([theme="dark"]) {
    color-scheme: dark;
    --gv-bg: #10151c;
    --gv-card: #1b2430;
    --gv-text: #f3f0e8;
    --gv-muted: #b3aa9c;
    --gv-accent: #e0b15a;
    --gv-accent-text: #1c1408;
    --gv-divider: rgba(255, 255, 255, 0.08);
    --gv-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  }

  * { box-sizing: border-box; }

  button, input, select, textarea { font: inherit; color: inherit; }

  button { cursor: pointer; background: transparent; border: 0; padding: 0; text-align: inherit; }

  .app {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(900px 380px at 0% -10%, color-mix(in srgb, var(--gv-accent) 18%, transparent), transparent 58%),
      var(--gv-bg);
    position: relative;
  }

  .topbar, .subbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    min-height: 56px;
  }

  .subbar { min-height: 48px; padding-top: 0; flex-wrap: wrap; }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 680;
    letter-spacing: -0.03em;
    font-size: 1.2rem;
    white-space: nowrap;
  }

  .brand .ico, .brand ha-icon { width: 22px; height: 22px; color: var(--gv-accent); }

  .tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    min-width: 0;
  }

  .tab, .seg button, .icon-btn, .palette button, .text-btn {
    border: 0;
    background: transparent;
    color: var(--gv-muted);
  }

  .tab, .seg button, .text-btn {
    border-radius: 999px;
    padding: 8px 12px;
    min-height: 40px;
  }

  .tab.active, .seg button.active {
    background: color-mix(in srgb, var(--gv-accent) 20%, transparent);
    color: var(--gv-text);
  }

  .spacer { flex: 1; }

  .icon-btn, .text-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--gv-card) 88%, transparent);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
  }

  .icon-btn.primary, .text-btn.primary {
    background: var(--gv-accent);
    color: var(--gv-accent-text);
    border-color: transparent;
  }

  .text-btn { padding: 0 14px; }

  .seg {
    display: inline-flex;
    padding: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--gv-text) 6%, transparent);
    border: 1px solid var(--gv-divider);
  }

  .workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .workspace.editing { grid-template-columns: 220px minmax(0, 1fr); }
  .workspace.inspecting { grid-template-columns: 220px minmax(0, 1fr) 320px; }

  .palette, .inspector {
    min-height: 0;
    overflow: auto;
    padding: 8px;
    border-color: var(--gv-divider);
  }

  .palette { border-right: 1px solid var(--gv-divider); display: flex; flex-direction: column; gap: 6px; }

  .palette button {
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    border-radius: 12px;
    padding: 10px 12px;
    min-height: 44px;
    color: var(--gv-text);
    background: color-mix(in srgb, var(--gv-card) 80%, transparent);
  }

  .palette button:hover, .tab:hover, .icon-btn:hover, .text-btn:hover {
    filter: brightness(1.06);
  }

  .stage {
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 8px 12px 28px;
    container-type: inline-size;
  }

  .stage.frame {
    width: min(var(--frame), 100%);
    margin: 0 auto;
    border: 1px dashed var(--gv-divider);
    border-radius: 18px;
    background: color-mix(in srgb, var(--gv-bg) 70%, transparent);
  }

  .canvas {
    position: relative;
    width: 100%;
  }

  .canvas.editing {
    background-image: radial-gradient(circle, color-mix(in srgb, var(--gv-text) 28%, transparent) 1.1px, transparent 1.2px);
    background-size: calc(100cqw / var(--cols)) calc(100cqw / var(--cols));
    border-radius: 16px;
  }

  .canvas.stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: auto !important;
    background-image: none;
  }

  .widget {
    position: absolute;
    overflow: hidden;
    border-radius: var(--gv-radius);
    background: var(--gv-card);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
    box-shadow: var(--gv-shadow);
    padding: 14px 16px;
    font-size: 16px;
  }

  .canvas.stack .widget {
    position: relative;
    left: auto !important;
    top: auto !important;
    width: auto !important;
    height: auto !important;
    min-height: 112px;
  }

  .canvas.editing .widget { touch-action: none; user-select: none; cursor: grab; }
  .canvas.editing .widget-body { pointer-events: none; }
  .canvas.editing .chrome,
  .canvas.editing .resize { pointer-events: auto; }
  .widget.selected { outline: 2px solid var(--gv-accent); outline-offset: 2px; z-index: 2; }
  .kind-text, .kind-clock {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }
  .kind-button {
    background: var(--gv-accent);
    color: var(--gv-accent-text);
    border-color: transparent;
    padding: 0;
  }
  .kind-image { padding: 0; }

  .widget-body { height: 100%; min-height: 0; }
  .kind-image .widget-body, .kind-button .widget-body { position: absolute; inset: 0; }

  .chrome, .resize { position: absolute; z-index: 3; }
  .chrome { top: 6px; right: 6px; display: none; gap: 4px; }
  .widget.selected .chrome, .canvas.stack .chrome { display: flex; }
  .chrome .icon-btn { min-width: 36px; min-height: 36px; background: var(--gv-card); }
  .resize {
    right: 2px;
    bottom: 2px;
    width: 28px;
    height: 28px;
    cursor: nwse-resize;
    color: var(--gv-muted);
    display: none;
  }
  .widget.selected .resize { display: flex; align-items: flex-end; justify-content: flex-end; }

  .tile, .sensor, .climate, .group, .prose, .clock, .text-block, .light {
    height: 100%;
    min-height: 0;
  }

  .tile, .light {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--gv-accent) 16%, transparent);
    color: var(--gv-accent);
  }
  .mark .ico, .mark ha-icon, .ico, ha-icon { width: 1.3em; height: 1.3em; }
  .mark.on { background: var(--gv-accent); color: var(--gv-accent-text); }

  .name { font-weight: 650; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .state { color: var(--gv-muted); font-size: 0.92em; margin-top: 2px; }
  .stack-text { min-width: 0; }

  .switch {
    width: 52px;
    height: 32px;
    border-radius: 999px;
    border: 0;
    padding: 0;
    background: color-mix(in srgb, var(--gv-text) 18%, transparent);
    position: relative;
    flex: none;
  }
  .switch::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    top: 4px;
    left: 4px;
    transition: transform 0.18s ease;
  }
  .switch.on { background: var(--gv-accent); }
  .switch.on::after { transform: translateX(20px); }

  .slider { width: 100%; accent-color: var(--gv-accent); margin-top: 8px; }
  .light { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
  .light .tile { height: auto; }
  .light .slider-row { margin-top: auto; }

  .clock-time {
    font-size: 1em;
    font-weight: 660;
    letter-spacing: -0.045em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }
  .clock-date { margin-top: 0.2em; font-size: 0.34em; color: var(--gv-muted); text-transform: capitalize; }

  .text-block { display: flex; align-items: center; white-space: pre-wrap; line-height: 1.15; font-weight: 650; letter-spacing: -0.03em; }

  .sensor { display: flex; flex-direction: column; }
  .sensor-value {
    font-size: 2.5em;
    font-weight: 650;
    letter-spacing: -0.045em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }
  .unit { font-size: 0.42em; margin-left: 0.15em; color: var(--gv-muted); font-weight: 560; }
  .spark { width: 100%; height: 38%; margin-top: auto; display: block; }
  .spark-line { fill: none; stroke: var(--gv-accent); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .spark-fill { fill: color-mix(in srgb, var(--gv-accent) 22%, transparent); stroke: none; }
  .hint { color: var(--gv-muted); font-size: 0.85em; margin-top: auto; }

  .climate { display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
  .temp-row { display: flex; align-items: baseline; gap: 8px; }
  .stepper { display: flex; align-items: center; gap: 8px; }
  .stepper .icon-btn { background: color-mix(in srgb, var(--gv-text) 8%, transparent); }

  .press {
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    font-weight: 680;
    letter-spacing: -0.02em;
    text-align: left;
  }
  .press:active { transform: scale(0.985); }

  .shot, .shot img, .placeholder {
    width: 100%;
    height: 100%;
  }
  .shot img { object-fit: cover; display: block; }
  .placeholder {
    display: grid;
    place-items: center;
    gap: 6px;
    color: var(--gv-muted);
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--gv-accent) 28%, transparent), transparent 55%),
      var(--gv-card);
  }

  .group { display: flex; flex-direction: column; gap: 2px; overflow: auto; }
  .group h3 { margin: 0 0 6px; font-size: 0.95em; }
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
    min-height: 42px;
    border-top: 1px solid var(--gv-divider);
    background: transparent;
    text-align: left;
    padding: 4px 0;
  }
  .row .switch { transform: scale(0.86); transform-origin: right center; }

  .prose { overflow: auto; line-height: 1.45; }
  .prose h1, .prose h2, .prose h3 { margin: 0 0 0.4em; letter-spacing: -0.03em; line-height: 1.1; }
  .prose h1 { font-size: 1.5em; }
  .prose h2 { font-size: 1.25em; }
  .prose p { margin: 0 0 0.6em; }
  .prose ul { margin: 0 0 0.6em; padding-left: 1.1em; }
  .prose a { color: var(--gv-accent); }

  .inspector {
    border-left: 1px solid var(--gv-divider);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .inspector h3 { margin: 4px 0; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gv-muted); }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 0.86rem; color: var(--gv-muted); }
  input[type="text"], input[type="number"], input[type="search"], select, textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--gv-divider);
    background: color-mix(in srgb, var(--gv-bg) 65%, transparent);
    padding: 10px 12px;
    min-height: 42px;
    outline: none;
  }
  textarea { min-height: 110px; resize: vertical; }
  input:focus, select:focus, textarea:focus { border-color: var(--gv-accent); }
  .check { flex-direction: row; align-items: center; gap: 8px; color: var(--gv-text); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .color-row { display: flex; gap: 8px; align-items: center; }
  input[type="color"] { width: 48px; height: 42px; padding: 4px; border: 0; background: transparent; }
  .results { display: flex; flex-direction: column; max-height: 180px; overflow: auto; border-radius: 12px; border: 1px solid var(--gv-divider); }
  .results button, .chip {
    text-align: left;
    border: 0;
    background: transparent;
    color: var(--gv-text);
    padding: 8px 10px;
  }
  .results button small, .chip small { display: block; color: var(--gv-muted); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border-radius: 999px; background: color-mix(in srgb, var(--gv-text) 8%, transparent); }

  .toast, .modal-back { position: absolute; z-index: 6; }
  .toast {
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    background: var(--gv-card);
    color: var(--gv-text);
    border: 1px solid var(--gv-divider);
    border-radius: 999px;
    padding: 10px 16px;
    box-shadow: var(--gv-shadow);
  }
  .modal-back {
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .modal {
    width: min(420px, 100%);
    background: var(--gv-card);
    color: var(--gv-text);
    border-radius: 20px;
    padding: 18px;
    box-shadow: var(--gv-shadow);
  }
  .modal .row-end { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .status, .banner {
    margin: 0 14px 8px;
    color: var(--gv-muted);
  }
  .banner {
    padding: 12px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--gv-accent) 14%, transparent);
    color: var(--gv-text);
  }
  .splash {
    margin: auto;
    text-align: center;
    color: var(--gv-muted);
  }

  @container (max-width: 980px) {
    .workspace.editing, .workspace.inspecting { grid-template-columns: minmax(0, 1fr); }
    .palette { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--gv-divider); }
    .palette button { white-space: nowrap; }
    .inspector {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 8px;
      max-height: 48%;
      z-index: 5;
      border: 1px solid var(--gv-divider);
      border-radius: 18px;
      background: var(--gv-card);
      box-shadow: var(--gv-shadow);
    }
  }
`, ln = /* @__PURE__ */ new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "A",
  "SPAN",
  "DIV",
  "IMG",
  "BLOCKQUOTE",
  "CODE",
  "PRE",
  "HR",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "SMALL"
]), cn = /* @__PURE__ */ new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SVG",
  "MATH"
]), dn = /* @__PURE__ */ new Set([
  "color",
  "background",
  "background-color",
  "font-size",
  "text-align",
  "border-radius",
  "padding",
  "margin",
  "font-weight",
  "opacity"
]);
function hn(n, t) {
  const e = n.slice(0, 2e4);
  return t ? un(e) : Xt(e);
}
function Xt(n) {
  const t = te(n).split(/\r?\n/), e = [];
  let i = null;
  const r = () => {
    i && (e.push(`<ul>${i.map((s) => `<li>${nt(s)}</li>`).join("")}</ul>`), i = null);
  };
  for (const s of t) {
    const a = /^(?:-|\*)\s+(.*)$/.exec(s);
    if (a) {
      i ??= [], i.push(a[1]);
      continue;
    }
    if (r(), !s.trim()) continue;
    const o = /^(#{1,3})\s+(.*)$/.exec(s);
    if (o) {
      const c = o[1].length;
      e.push(`<h${c}>${nt(o[2])}</h${c}>`);
      continue;
    }
    e.push(`<p>${nt(s)}</p>`);
  }
  return r(), e.join("");
}
function un(n) {
  if (typeof DOMParser > "u") return Xt(n);
  const e = new DOMParser().parseFromString(`<div id="gv-root">${n}</div>`, "text/html").getElementById("gv-root");
  return e ? (Yt(e), e.innerHTML) : "";
}
function Yt(n) {
  for (const t of [...n.childNodes]) {
    if (t.nodeType === Node.COMMENT_NODE) {
      t.remove();
      continue;
    }
    if (t instanceof Element) {
      if (cn.has(t.tagName)) {
        t.remove();
        continue;
      }
      if (!ln.has(t.tagName)) {
        const e = t.textContent ?? "";
        t.replaceWith(fn(t, e));
        continue;
      }
      pn(t), Yt(t);
    }
  }
}
function pn(n) {
  for (const t of [...n.attributes]) {
    const e = t.name.toLowerCase();
    if (e.startsWith("on") || e === "srcdoc" || e === "style") {
      if (e === "style") {
        const i = gn(t.value);
        i ? n.setAttribute("style", i) : n.removeAttribute(e);
      } else
        n.removeAttribute(t.name);
      continue;
    }
    if (n.tagName === "A" && e === "href") {
      Qt(t.value) ? n.setAttribute("rel", "noopener noreferrer") : n.removeAttribute(t.name);
      continue;
    }
    if (n.tagName === "IMG" && e === "src") {
      mn(t.value) || n.removeAttribute(t.name);
      continue;
    }
    n.tagName === "IMG" && (e === "alt" || e === "title") || e === "href" || e === "src" || e === "alt" || e === "title" || n.removeAttribute(t.name);
  }
}
function gn(n) {
  return /url\(|expression|javascript|@import/i.test(n) ? "" : n.split(";").map((t) => t.trim()).filter((t) => {
    const [e, i] = t.split(":");
    return !e || i === void 0 ? !1 : dn.has(e.trim().toLowerCase()) && !/url\(|expression/i.test(i);
  }).join("; ");
}
function Qt(n) {
  const t = n.trim();
  return t.startsWith("/") && !t.startsWith("//") || /^https?:\/\//i.test(t) || /^mailto:/i.test(t);
}
function mn(n) {
  const t = n.trim();
  return t.startsWith("/") && !t.startsWith("//") && (t.startsWith("/local/") || t.startsWith("/api/")) || /^https:\/\//i.test(t);
}
function fn(n, t) {
  return (n.ownerDocument ?? document).createTextNode(t);
}
function te(n) {
  return n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function nt(n) {
  return n.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (t, e, i) => {
    const r = vn(i);
    return Qt(r) ? `<a href="${te(r)}" rel="noopener noreferrer">${e}</a>` : e;
  });
}
function vn(n) {
  return n.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
class st extends mt {
  constructor(t) {
    if (super(t), this.it = h, t.type !== pt.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(t) {
    if (t === h || t == null) return this._t = void 0, this.it = t;
    if (t === A) return t;
    if (typeof t != "string") throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (t === this.it) return this._t;
    this.it = t;
    const e = [t];
    return e.raw = e, this._t = { _$litType$: this.constructor.resultType, strings: e, values: [] };
  }
}
st.directiveName = "unsafeHTML", st.resultType = 1;
const bn = gt(st);
function yn(n, t) {
  switch (n.type) {
    case "entity":
      return ee(n, t);
    case "light":
      return xn(n, t);
    case "climate":
      return _n(n, t);
    case "sensor":
      return wn(n, t);
    case "button":
      return An(n, t);
    case "text":
      return Ln(n, t.lang);
    case "clock":
      return Cn(n, t.lang);
    case "image":
      return Hn(n, t);
    case "group":
      return kn(n, t);
    case "markdown":
      return Sn(n, t.lang);
  }
}
function $n(n, t) {
  const e = t.lang, i = n.config, r = (s, a, o) => d`
    <label>${a}
      <input type="text" .value=${o} @input=${(c) => t.patch({ ...i, [s]: w(c) })} />
    </label>
  `;
  if (n.type === "entity" || n.type === "light" || n.type === "climate" || n.type === "sensor")
    return d`
      ${r("name", l(e, "name"), String(i.name ?? ""))}
      ${q(String(i.entity_id ?? ""), t, (s) => t.patch({ ...i, entity_id: s }))}
      ${n.type === "entity" ? I(e, "show_toggle", i.show_toggle !== !1, (s) => t.patch({ ...i, show_toggle: s })) : h}
      ${n.type === "light" ? I(e, "show_brightness", i.show_brightness !== !1, (s) => t.patch({ ...i, show_brightness: s })) : h}
      ${n.type === "climate" ? H(e, "step", Number(i.step ?? 0.5), 0.1, 5, 0.1, (s) => t.patch({ ...i, step: s })) : h}
      ${n.type === "sensor" ? d`
        ${H(e, "hours", Number(i.hours ?? 24), 1, 168, 1, (s) => t.patch({ ...i, hours: s }))}
        ${H(e, "decimals", Number(i.decimals ?? 1), 0, 3, 1, (s) => t.patch({ ...i, decimals: s }))}
      ` : h}
    `;
  if (n.type === "button") {
    const s = String(i.domain ?? "");
    return d`
      ${r("label", l(e, "label"), String(i.label ?? ""))}
      <label>${l(e, "domain")}
        <input list="gv-domains" .value=${s} @input=${(a) => t.patch({ ...i, domain: w(a) })} />
        <datalist id="gv-domains">${Qe(t.hass).map((a) => d`<option value=${a}></option>`)}</datalist>
      </label>
      <label>${l(e, "service")}
        <input list="gv-services" .value=${String(i.service ?? "")} @input=${(a) => t.patch({ ...i, service: w(a) })} />
        <datalist id="gv-services">${ti(t.hass, s).map((a) => d`<option value=${a}></option>`)}</datalist>
      </label>
      ${q(String(i.entity_id ?? ""), t, (a) => t.patch({ ...i, entity_id: a }), "target_entity")}
      <label>${l(e, "service_data")}
        <textarea .value=${String(i.data ?? "")} @input=${(a) => t.patch({ ...i, data: a.target.value })}></textarea>
      </label>
      ${I(e, "confirm_first", i.confirm === !0, (a) => t.patch({ ...i, confirm: a }))}
    `;
  }
  if (n.type === "text")
    return d`
      <label>${l(e, "text")}
        <textarea .value=${String(i.text ?? "")} @input=${(s) => t.patch({ ...i, text: s.target.value })}></textarea>
      </label>
      ${Vn(e, String(i.align ?? "left"), (s) => t.patch({ ...i, align: s }))}
    `;
  if (n.type === "clock") {
    const s = String(i.mode ?? "both");
    return d`
      <label>${l(e, "mode")}
        <select .value=${s} @change=${(a) => t.patch({ ...i, mode: w(a) })}>
          <option value="both">${l(e, "both")}</option>
          <option value="time">${l(e, "time")}</option>
          <option value="date">${l(e, "date")}</option>
        </select>
      </label>
    `;
  }
  if (n.type === "image") {
    const s = String(i.source ?? "entity");
    return d`
      <label>${l(e, "source")}
        <select .value=${s} @change=${(a) => t.patch({ ...i, source: w(a) })}>
          <option value="entity">${l(e, "camera")}</option>
          <option value="url">${l(e, "url")}</option>
        </select>
      </label>
      ${s === "url" ? r("url", l(e, "url"), String(i.url ?? "")) : q(String(i.entity_id ?? ""), t, (a) => t.patch({ ...i, entity_id: a }), "camera")}
      <label>${l(e, "fit")}
        <select .value=${String(i.fit ?? "cover")} @change=${(a) => t.patch({ ...i, fit: w(a) })}>
          <option value="cover">${l(e, "cover")}</option>
          <option value="contain">${l(e, "contain")}</option>
        </select>
      </label>
      ${H(e, "refresh", Number(i.refresh ?? 10), 0, 3600, 1, (a) => t.patch({ ...i, refresh: a }))}
    `;
  }
  if (n.type === "group") {
    const s = Array.isArray(i.entity_ids) ? i.entity_ids.map(String) : [];
    return d`
      ${r("name", l(e, "name"), String(i.name ?? ""))}
      ${I(e, "show_toggle", i.show_toggle !== !1, (a) => t.patch({ ...i, show_toggle: a }))}
      <div class="chips">
        ${s.map((a) => d`<button class="chip" @click=${() => t.patch({ ...i, entity_ids: s.filter((o) => o !== a) })}>${a}</button>`)}
      </div>
      ${q("", t, (a) => {
      !a || s.includes(a) || t.patch({ ...i, entity_ids: [...s, a] });
    }, "add_entity")}
    `;
  }
  return d`
    <label>${l(e, "content")}
      <textarea .value=${String(i.content ?? "")} @input=${(s) => t.patch({ ...i, content: s.target.value })}></textarea>
    </label>
    <p class="hint">${i.html ? l(e, "html_hint") : l(e, "markdown_hint")}</p>
    ${I(e, "allow_html", i.html === !0, (s) => t.patch({ ...i, html: s }))}
  `;
}
function ee(n, t, e) {
  const i = String(n.config.entity_id ?? ""), r = t.hass?.states?.[i], s = String(n.config.name || B(r, i || l(t.lang, "no_entity"))), a = Kt(r?.state), o = n.style.icon || (typeof r?.attributes.icon == "string" ? r.attributes.icon : "") || (i ? Jt(i) : "mdi:shape-outline"), c = n.config.show_toggle !== !1 && !!i && Gt(i);
  return d`
    <div class="tile ${""}">
      <button class="mark ${a ? "on" : ""}" @click=${(u) => i && t.onMoreInfo(i, u)}>${m(o)}</button>
      <button class="stack-text" @click=${(u) => i && t.onMoreInfo(i, u)}>
        <div class="name">${s}</div>
        <div class="state">${i ? et(t.hass, i, l(t.lang, "unknown")) : l(t.lang, "no_entity")}</div>
      </button>
      ${c ? d`<button class="switch ${a ? "on" : ""}" aria-label=${s} @click=${(u) => {
    u.stopPropagation(), t.onToggle(i);
  }}></button>` : h}
    </div>
  `;
}
function xn(n, t) {
  const e = String(n.config.entity_id ?? ""), i = t.hass?.states?.[e], r = Number(i?.attributes.brightness ?? 0), s = i?.state === "on";
  return d`
    <div class="light">
      ${ee(n, t)}
      ${n.config.show_brightness !== !1 && e ? d`<div class="slider-row">
            <input class="slider" type="range" min="1" max="255" .value=${String(r || 1)} aria-label=${l(t.lang, "brightness")}
              @input=${(a) => t.onBrightness(e, Number(a.target.value))}
              @click=${(a) => a.stopPropagation()} />
            <div class="state">${s ? `${Math.round(r / 255 * 100)}%` : et(t.hass, e, "")}</div>
          </div>` : h}
    </div>
  `;
}
function _n(n, t) {
  const e = String(n.config.entity_id ?? ""), i = t.hass?.states?.[e], r = i?.attributes.current_temperature, s = Number(i?.attributes.temperature ?? i?.attributes.target_temp_high ?? NaN), a = Number(n.config.step ?? i?.attributes.target_temp_step ?? 0.5), o = String(n.config.name || B(i, e || l(t.lang, "no_entity")));
  return d`
    <div class="climate">
      <div>
        <div class="name">${o}</div>
        <div class="state">${e ? et(t.hass, e, "") : l(t.lang, "no_entity")}</div>
      </div>
      <div class="temp-row">
        <span class="sensor-value">${at(r, t.lang, 1)}<span class="unit">°</span></span>
      </div>
      ${e ? d`<div class="stepper">
            <button class="icon-btn" @click=${(c) => {
    c.stopPropagation(), t.onTemperature(e, Ot(s, -a));
  }}>${m("mdi:chevron-down")}</button>
            <div><div class="state">${l(t.lang, "target")}</div><strong>${at(s, t.lang, 1)}°</strong></div>
            <button class="icon-btn" @click=${(c) => {
    c.stopPropagation(), t.onTemperature(e, Ot(s, a));
  }}>${m("mdi:chevron-up")}</button>
          </div>` : h}
    </div>
  `;
}
function wn(n, t) {
  const e = String(n.config.entity_id ?? ""), i = t.hass?.states?.[e], r = Number(n.config.decimals ?? 1), s = Number.parseFloat(i?.state ?? ""), a = String(n.config.name || B(i, e || l(t.lang, "no_entity"))), o = typeof i?.attributes.unit_of_measurement == "string" ? i.attributes.unit_of_measurement : "", c = [...t.history[ie(e, n)] ?? []];
  return Number.isFinite(s) && c.push(s), d`
    <div class="sensor">
      <div class="name">${a}</div>
      <div class="sensor-value">${e ? at(s, t.lang, r) : "–"}<span class="unit">${o}</span></div>
      ${c.length > 1 ? Mn(c) : d`<div class="hint">${l(t.lang, "history_empty")}</div>`}
    </div>
  `;
}
function An(n, t) {
  const e = String(n.config.label || l(t.lang, "widget_button")), i = n.style.icon || "mdi:button-pointer";
  return d`<button class="press" ?disabled=${t.edit} @click=${(r) => {
    r.stopPropagation(), t.onService(n);
  }}>${m(i)}<span>${e}</span></button>`;
}
function Ln(n, t) {
  const e = String(n.config.align ?? "left"), i = String(n.config.text || l(t, "placeholder_text"));
  return d`<div class="text-block" style="justify-content: ${e === "center" ? "center" : e === "right" ? "flex-end" : "flex-start"}; text-align: ${e}">${i}</div>`;
}
function Cn(n, t) {
  const e = t === "sv" ? "sv-SE" : "en-GB", i = /* @__PURE__ */ new Date(), r = String(n.config.mode ?? "both"), s = new Intl.DateTimeFormat(e, { hour: "2-digit", minute: "2-digit" }).format(i), a = new Intl.DateTimeFormat(e, { weekday: "long", day: "numeric", month: "long" }).format(i);
  return d`<div class="clock">${r !== "date" ? d`<div class="clock-time">${s}</div>` : h}${r !== "time" ? d`<div class="clock-date">${a}</div>` : h}</div>`;
}
function Hn(n, t) {
  const e = String(n.config.source ?? "entity"), i = String(n.config.entity_id ?? ""), r = e === "url" ? String(n.config.url ?? "") : ei(t.hass, i), s = String(n.config.fit ?? "cover"), a = Number(n.config.refresh ?? 0), o = a > 0 ? Math.floor(Date.now() / (a * 1e3)) : 0, c = r && o && !r.startsWith("data:") ? `${r}${r.includes("?") ? "&" : "?"}t=${o}` : r;
  return c ? d`<div class="shot"><img alt="" src=${c} style="object-fit: ${s}" @error=${(u) => u.target.style.display = "none"} /></div>` : d`<div class="placeholder">${m(n.style.icon || "mdi:image-outline")}<span>${l(t.lang, "image_empty")}</span></div>`;
}
function kn(n, t) {
  const e = Array.isArray(n.config.entity_ids) ? n.config.entity_ids.map(String) : [], i = n.config.show_toggle !== !1;
  return d`
    <div class="group">
      ${n.config.name ? d`<h3>${n.config.name}</h3>` : h}
      ${e.length ? e.map((r) => {
    const s = t.hass?.states?.[r], a = Kt(s?.state);
    return d`<div class="row">
              <span class="mark ${a ? "on" : ""}">${m(n.style.icon || (typeof s?.attributes.icon == "string" ? s.attributes.icon : Jt(r)))}</span>
              <button @click=${(o) => t.onMoreInfo(r, o)}><div class="name">${B(s, r)}</div><div class="state">${et(t.hass, r, l(t.lang, "unknown"))}</div></button>
              <span></span>
              ${i && Gt(r) ? d`<button class="switch ${a ? "on" : ""}" @click=${(o) => {
      o.stopPropagation(), t.onToggle(r);
    }}></button>` : h}
            </div>`;
  }) : d`<div class="hint">${l(t.lang, "group_empty")}</div>`}
    </div>
  `;
}
function Sn(n, t) {
  const e = String(n.config.content || l(t, "placeholder_markdown"));
  return d`<div class="prose">${bn(hn(e, n.config.html === !0))}</div>`;
}
function Mn(n) {
  const i = Math.min(...n), s = Math.max(...n) - i || 1, a = 240 / Math.max(1, n.length - 1), o = n.map((u, g) => {
    const p = g * a, x = 64 - (u - i) / s * 58 - 3;
    return `${g === 0 ? "M" : "L"}${p.toFixed(1)} ${x.toFixed(1)}`;
  }).join(" "), c = `${o} L 240 64 L 0 64 Z`;
  return d`<svg class="spark" viewBox="0 0 ${240} ${64}" preserveAspectRatio="none"><path class="spark-fill" d=${c}></path><path class="spark-line" d=${o}></path></svg>`;
}
function q(n, t, e, i = "entity") {
  const r = Ye(t.hass, t.query);
  return d`
    <label>${l(t.lang, i)}
      <input type="search" placeholder=${l(t.lang, "search_entities")} .value=${t.query} @input=${(s) => t.onQuery(w(s))} />
    </label>
    ${n ? d`<div class="state">${n}</div>` : h}
    <div class="results">
      ${r.length ? r.map((s) => d`<button @click=${() => e(s.entity_id)}>${B(s, s.entity_id)}<small>${s.entity_id}</small></button>`) : d`<div class="hint">${l(t.lang, "no_entities")}</div>`}
    </div>
  `;
}
function I(n, t, e, i) {
  return d`<label class="check"><input type="checkbox" .checked=${e} @change=${(r) => i(r.target.checked)} />${l(n, t)}</label>`;
}
function H(n, t, e, i, r, s, a) {
  return d`<label>${l(n, t)}<input type="number" min=${i} max=${r} step=${s} .value=${String(e)} @input=${(o) => a(Number(w(o)))} /></label>`;
}
function Vn(n, t, e) {
  return d`<label>${l(n, "align")}<select .value=${t} @change=${(i) => e(w(i))}><option value="left">${l(n, "left")}</option><option value="center">${l(n, "center")}</option><option value="right">${l(n, "right")}</option></select></label>`;
}
function w(n) {
  return n.target.value;
}
function at(n, t, e) {
  const i = typeof n == "number" ? n : Number(n);
  return Number.isFinite(i) ? new Intl.NumberFormat(t === "sv" ? "sv-SE" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: e
  }).format(i) : "–";
}
function Ot(n, t) {
  const e = Number.isFinite(n) ? n : 20;
  return Math.round((e + t) * 10) / 10;
}
function ie(n, t) {
  return `${n}:${Number(t.config.hours ?? 24)}`;
}
var En = Object.defineProperty, b = (n, t, e, i) => {
  for (var r = void 0, s = n.length - 1, a; s >= 0; s--)
    (a = n[s]) && (r = a(t, e, r) || r);
  return r && En(t, e, r), r;
};
const Tn = [
  { type: "entity", icon: "mdi:toggle-switch-outline", label: "widget_entity" },
  { type: "light", icon: "mdi:lightbulb-outline", label: "widget_light" },
  { type: "climate", icon: "mdi:thermostat", label: "widget_climate" },
  { type: "sensor", icon: "mdi:chart-line", label: "widget_sensor" },
  { type: "button", icon: "mdi:button-pointer", label: "widget_button" },
  { type: "text", icon: "mdi:format-text", label: "widget_text" },
  { type: "clock", icon: "mdi:clock-outline", label: "widget_clock" },
  { type: "image", icon: "mdi:image-outline", label: "widget_image" },
  { type: "group", icon: "mdi:format-list-bulleted", label: "widget_group" },
  { type: "markdown", icon: "mdi:text-box-outline", label: "widget_markdown" }
];
class v extends U {
  constructor() {
    super(...arguments), this.narrow = !1, this.layout = Vt(), this.status = "loading", this.saveState = "idle", this.edit = !1, this.pageId = "hem", this.selectedId = "", this.preview = "desktop", this.stageWidth = 1200, this.toast = "", this.query = "", this.history = {}, this.tick = 0, this.modal = null, this.clockTimer = 0, this.saveTimer = 0, this.toastTimer = 0, this.drag = null, this.undoStack = [], this.undoArmed = !1, this.loaded = !1, this.historyAt = /* @__PURE__ */ new Map(), this.moveFrame = 0, this.onPointerMove = (t) => {
      !this.drag || t.pointerId !== this.drag.pointerId || (this.lastPointer = t, !this.moveFrame && (this.moveFrame = requestAnimationFrame(() => {
        this.moveFrame = 0;
        const e = this.drag, i = this.lastPointer;
        if (!e || !i) return;
        const r = Math.round((i.clientX - e.startX) / e.cell), s = Math.round((i.clientY - e.startY) / e.cell), a = this.layout.gridColumns;
        e.mode === "move" ? (e.nw = e.w, e.nh = e.h, e.nx = f(e.x + r, 0, Math.max(0, a - e.w)), e.ny = f(e.y + s, 0, 200)) : (e.nx = e.x, e.ny = e.y, e.nw = f(e.w + r, 2, a - e.x), e.nh = f(e.h + s, 2, 40)), this.requestUpdate();
      })));
    }, this.onPointerUp = (t) => {
      const e = this.drag;
      !e || t.pointerId !== e.pointerId || (window.removeEventListener("pointermove", this.onPointerMove), window.removeEventListener("pointerup", this.onPointerUp), this.drag = null, this.layout = It(this.layout, e.id, (i) => ({
        ...i,
        x: e.nx,
        y: e.ny,
        w: e.nw,
        h: e.nh
      })), this.scheduleSave());
    }, this.onKey = (t) => {
      if (!this.edit || t.composedPath().some((s) => s instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(s.tagName)))
        return;
      if ((t.metaKey || t.ctrlKey) && t.key.toLowerCase() === "z") {
        t.preventDefault(), this.undo();
        return;
      }
      if ((t.key === "Delete" || t.key === "Backspace") && this.selectedId) {
        t.preventDefault(), this.removeWidget(this.selectedId);
        return;
      }
      t.key === "Escape" && (this.selectedId = "");
      const e = this.selected;
      if (!e || this.stacked) return;
      const r = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      }[t.key];
      r && (t.preventDefault(), this.updateWidget(e.id, {
        x: f(e.x + r[0], 0, this.layout.gridColumns - e.w),
        y: f(e.y + r[1], 0, 200)
      }));
    };
  }
  static {
    this.styles = on;
  }
  connectedCallback() {
    super.connectedCallback(), this.clockTimer = window.setInterval(() => {
      this.drag || this.currentPage?.widgets.some((t) => t.type === "clock" || t.type === "image") && (this.tick += 1);
    }, 1e3), window.addEventListener("keydown", this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this.clockTimer), window.clearTimeout(this.saveTimer), window.clearTimeout(this.toastTimer), window.removeEventListener("keydown", this.onKey), window.removeEventListener("pointermove", this.onPointerMove), window.removeEventListener("pointerup", this.onPointerUp), this.observer?.disconnect(), this.unsub?.(), this.unsub = void 0;
  }
  firstUpdated() {
    this.watchStage(), this.ensureSubscription(), this.maybeLoad();
  }
  watchStage() {
    if (this.observer) return;
    const t = this.renderRoot.querySelector(".stage");
    t && (this.observer = new ResizeObserver(() => {
      const e = t.clientWidth;
      e && Math.abs(e - this.stageWidth) > 2 && (this.stageWidth = e);
    }), this.observer.observe(t), this.stageWidth = t.clientWidth || this.stageWidth);
  }
  updated(t) {
    t.has("hass") && (this.ensureSubscription(), this.maybeLoad()), this.syncTheme(), this.status === "ready" && this.ensureHistory(), this.observer || this.watchStage();
  }
  get uiLanguage() {
    return this.layout.language === "en" ? "en" : "sv";
  }
  get isAdmin() {
    return this.hass?.user?.is_admin === !0;
  }
  get currentPage() {
    return this.layout.pages.find((t) => t.id === this.pageId) ?? this.layout.pages[0];
  }
  get selected() {
    return this.currentPage?.widgets.find((t) => t.id === this.selectedId);
  }
  get stacked() {
    return this.narrow || this.preview === "phone" || this.stageWidth > 0 && this.stageWidth < 640;
  }
  get panelTitle() {
    const t = this.panel?.config?.sidebar_title;
    return typeof t == "string" && t.trim() ? t : this.panel?.title || "Gulavillan";
  }
  render() {
    if (this.status === "loading" && !this.loaded)
      return d`<div class="app"><div class="splash">${l(this.uiLanguage, "loading")}</div></div>`;
    const t = this.currentPage;
    return d`
      <div class="app">
        ${this.renderToolbar()}
        ${this.status === "error" ? d`<div class="banner">${l(this.uiLanguage, "load_failed")} <button class="text-btn" @click=${() => {
      this.load();
    }}>${l(this.uiLanguage, "retry")}</button></div>` : h}
        ${this.edit ? this.renderSubbar() : h}
        <div class="workspace ${kt({ editing: this.edit, inspecting: this.edit })}">
          ${this.edit ? this.renderPalette() : h}
          <div class="stage ${this.preview === "desktop" ? "" : "frame"}" style=${this.preview === "tablet" ? "--frame: 834px" : this.preview === "phone" ? "--frame: 390px" : ""}>
            ${t ? this.renderCanvas(t) : h}
          </div>
          ${this.edit ? this.renderInspector() : h}
        </div>
        ${this.toast ? d`<div class="toast">${this.toast}</div>` : h}
        ${this.modal ? d`<div class="modal-back"><div class="modal"><p>${this.modal.text}</p><div class="row-end"><button class="text-btn" @click=${() => this.modal = null}>${l(this.uiLanguage, "cancel")}</button><button class="text-btn primary" @click=${() => {
      const e = this.modal?.run;
      this.modal = null, e?.();
    }}>${l(this.uiLanguage, "confirm")}</button></div></div></div>` : h}
      </div>
    `;
  }
  renderToolbar() {
    return d`
      <header class="topbar">
        <div class="brand">${m("mdi:home-variant")}<span>${this.panelTitle}</span></div>
        <nav class="tabs">
          ${this.layout.pages.map((t) => d`
            <button class="tab ${t.id === this.currentPage?.id ? "active" : ""}" @click=${() => this.selectPage(t.id)}>
              ${t.icon ? m(t.icon) : h}${t.title}
            </button>
          `)}
        </nav>
        <span class="spacer"></span>
        ${this.saveState === "saving" ? d`<span class="status">${l(this.uiLanguage, "saving")}</span>` : h}
        ${this.isAdmin ? d`<button class="icon-btn ${this.edit ? "primary" : ""}" title=${this.edit ? l(this.uiLanguage, "done") : l(this.uiLanguage, "edit")} @click=${() => this.toggleEdit()}>${m(this.edit ? "mdi:check" : "mdi:pencil")}</button>` : h}
      </header>
    `;
  }
  renderSubbar() {
    const t = this.uiLanguage;
    return d`
      <div class="subbar">
        <button class="text-btn" @click=${() => this.addPage()}>${m("mdi:plus")} ${l(t, "add_page")}</button>
        <button class="icon-btn" title=${l(t, "undo")} ?disabled=${!this.undoStack.length} @click=${() => this.undo()}>${m("mdi:undo")}</button>
        <button class="text-btn" @click=${() => this.download()}>${m("mdi:download")} ${l(t, "export")}</button>
        <label class="text-btn">${m("mdi:upload")} ${l(t, "import")}<input type="file" accept="application/json,.json" hidden @change=${(e) => {
      this.upload(e);
    }} /></label>
        <span class="spacer"></span>
        <div class="seg" aria-label=${l(t, "preview")}>
          ${["desktop", "tablet", "phone"].map((e) => d`
            <button class=${e === this.preview ? "active" : ""} @click=${() => this.preview = e}>${l(t, e)}</button>
          `)}
        </div>
        <div class="seg">
          <button class=${this.layout.language === "sv" ? "active" : ""} @click=${() => this.patchLayout({ language: "sv" })}>SV</button>
          <button class=${this.layout.language === "en" ? "active" : ""} @click=${() => this.patchLayout({ language: "en" })}>EN</button>
        </div>
        <div class="seg">
          ${["auto", "light", "dark"].map((e) => d`
            <button class=${this.layout.theme === e ? "active" : ""} @click=${() => this.patchLayout({ theme: e })}>${l(t, e === "auto" ? "theme_auto" : e === "light" ? "theme_light" : "theme_dark")}</button>
          `)}
        </div>
      </div>
    `;
  }
  renderPalette() {
    return d`<aside class="palette">${Tn.map((t) => d`
      <button @click=${() => this.addWidget(t.type)}>${m(t.icon)}<span>${l(this.uiLanguage, t.label)}</span></button>
    `)}</aside>`;
  }
  renderCanvas(t) {
    const e = this.stacked, r = Math.max(this.stageWidth - 24, 280) / this.layout.gridColumns, s = e ? Et(t.widgets) : t.widgets, a = t.widgets.reduce((o, c) => Math.max(o, c.y + c.h), 8);
    return d`
      <div class="canvas ${kt({ editing: this.edit, stack: e })}" style=${`--cols: ${this.layout.gridColumns}; height: ${e ? "auto" : `${a * r}px`}`}>
        ${s.length ? s.map((o) => this.renderPlaced(o, r, e)) : d`<div class="banner">${l(this.uiLanguage, "empty_page")}</div>`}
      </div>
    `;
  }
  renderPlaced(t, e, i) {
    const r = this.box(t), s = 8, a = {};
    return t.style.color && (a.color = t.style.color), t.style.background && (a.background = t.style.background), t.style.fontSize && (a.fontSize = `${t.style.fontSize}px`), t.style.borderRadius !== void 0 && (a.borderRadius = `${t.style.borderRadius}px`), i || (a.left = `${r.x * e}px`, a.top = `${r.y * e}px`, a.width = `${Math.max(r.w * e - s, 48)}px`, a.height = `${Math.max(r.h * e - s, 48)}px`), d`
      <article class="widget kind-${t.type} ${t.id === this.selectedId ? "selected" : ""}" style=${Se(a)}
        @pointerdown=${(o) => this.startDrag(o, t, "move")}>
        <div class="widget-body">
          ${yn(t, {
      hass: this.hass,
      lang: this.uiLanguage,
      history: this.history,
      edit: this.edit,
      onToggle: (o) => {
        this.toggle(o);
      },
      onBrightness: (o, c) => {
        this.brightness(o, c);
      },
      onTemperature: (o, c) => {
        this.temperature(o, c);
      },
      onService: (o) => {
        this.runButton(o);
      },
      onMoreInfo: (o, c) => this.moreInfo(o, c)
    })}
        </div>
        ${this.edit ? d`<div class="chrome">
              ${i ? d`<button class="icon-btn" title=${l(this.uiLanguage, "move_up")} @pointerdown=${(o) => o.stopPropagation()} @click=${() => this.nudgeOrder(t, -1)}>${m("mdi:chevron-up")}</button>` : h}
              ${i ? d`<button class="icon-btn" title=${l(this.uiLanguage, "move_down")} @pointerdown=${(o) => o.stopPropagation()} @click=${() => this.nudgeOrder(t, 1)}>${m("mdi:chevron-down")}</button>` : h}
              <button class="icon-btn" title=${l(this.uiLanguage, "delete")} @pointerdown=${(o) => o.stopPropagation()} @click=${() => this.removeWidget(t.id)}>${m("mdi:delete-outline")}</button>
            </div>
            ${i ? h : d`<div class="resize" @pointerdown=${(o) => this.startDrag(o, t, "resize")}>${m("mdi:resize-bottom-right")}</div>`}` : h}
      </article>
    `;
  }
  renderInspector() {
    const t = this.uiLanguage, e = this.currentPage, i = this.selected;
    return e ? d`
      <aside class="inspector">
        ${i ? d`
              <h3>${l(t, "content")}</h3>
              ${$n(i, {
      hass: this.hass,
      lang: t,
      query: this.query,
      onQuery: (r) => this.query = r,
      patch: (r) => this.updateWidget(i.id, { config: r })
    })}
              <h3>${l(t, "appearance")}</h3>
              <label>${l(t, "icon")}<input type="text" .value=${i.style.icon ?? ""} placeholder="mdi:lightbulb" @input=${(r) => this.updateWidget(i.id, { style: { ...i.style, icon: r.target.value } })} /></label>
              ${this.colorField(t, "color", i.style.color, (r) => this.updateWidget(i.id, { style: { ...i.style, color: r } }))}
              ${this.colorField(t, "background", i.style.background, (r) => this.updateWidget(i.id, { style: { ...i.style, background: r } }))}
              ${H(t, "font_size", i.style.fontSize ?? 16, 8, 120, 1, (r) => this.updateWidget(i.id, { style: { ...i.style, fontSize: r } }))}
              ${H(t, "radius", i.style.borderRadius ?? 20, 0, 80, 1, (r) => this.updateWidget(i.id, { style: { ...i.style, borderRadius: r } }))}
              <h3>${l(t, "position")}</h3>
              <div class="grid-2">
                ${H(t, "width", i.w, 2, this.layout.gridColumns, 1, (r) => this.updateWidget(i.id, { w: r }))}
                ${H(t, "height", i.h, 2, 40, 1, (r) => this.updateWidget(i.id, { h: r }))}
              </div>
              <button class="text-btn" @click=${() => this.removeWidget(i.id)}>${m("mdi:delete-outline")} ${l(t, "delete")}</button>
            ` : d`
              <h3>${l(t, "pages")}</h3>
              <p class="hint">${l(t, "select_widget")}</p>
              <label>${l(t, "page_name")}<input type="text" .value=${e.title} @input=${(r) => this.renamePage(e.id, r.target.value)} /></label>
              <label>${l(t, "page_icon")}<input type="text" .value=${e.icon ?? ""} placeholder="mdi:home-variant" @input=${(r) => this.iconPage(e.id, r.target.value)} /></label>
              ${this.layout.pages.length > 1 ? d`<button class="text-btn" @click=${() => this.deletePage(e.id)}>${l(t, "delete_page")}</button>` : h}
            `}
      </aside>
    ` : d``;
  }
  colorField(t, e, i, r) {
    return d`<label>${l(t, e)}<span class="color-row"><input type="color" .value=${Nn(i)} @input=${(s) => r(s.target.value)} /><button class="text-btn" @click=${() => r("")}>${l(t, "clear")}</button></span></label>`;
  }
  async maybeLoad() {
    this.loaded || !this.hass || (this.loaded = !0, await this.load());
  }
  async load() {
    if (this.hass) {
      this.status = "loading";
      try {
        this.layout = await Be(this.hass), this.pageId = this.layout.pages[0]?.id ?? "", this.status = "ready";
      } catch {
        this.layout = Vt(), this.pageId = this.layout.pages[0]?.id ?? "", this.status = "error";
      }
    }
  }
  async ensureSubscription() {
    if (!(!this.hass || this.unsub))
      try {
        this.unsub = await qe(this.hass, () => {
          this.drag || this.requestUpdate();
        });
      } catch {
        this.unsub = void 0;
      }
  }
  async ensureHistory() {
    if (!this.hass) return;
    const t = this.currentPage?.widgets.filter((e) => e.type === "sensor") ?? [];
    await Promise.all(t.map(async (e) => {
      const i = String(e.config.entity_id ?? "");
      if (!i) return;
      const r = ie(i, e), s = this.historyAt.get(r) ?? 0;
      if (!(Date.now() - s < 6e4)) {
        this.historyAt.set(r, Date.now());
        try {
          const a = await Ge(this.hass, i, Number(e.config.hours ?? 24));
          this.history = { ...this.history, [r]: a };
        } catch {
          this.history = { ...this.history, [r]: this.history[r] ?? [] };
        }
      }
    }));
  }
  toggleEdit() {
    if (!this.isAdmin) {
      this.flash(l(this.uiLanguage, "admin_only"));
      return;
    }
    this.edit = !this.edit, this.edit || (this.selectedId = "", this.persist());
  }
  patchLayout(t) {
    this.beforeChange(), this.layout = P({ ...this.layout, ...t }), this.scheduleSave();
  }
  addPage() {
    this.beforeChange();
    const t = { id: X("sida"), title: `${l(this.uiLanguage, "pages")} ${this.layout.pages.length + 1}`, widgets: [] };
    this.layout = { ...this.layout, pages: [...this.layout.pages, t] }, this.pageId = t.id, this.selectedId = "", this.scheduleSave();
  }
  selectPage(t) {
    this.pageId = t, this.selectedId = "", this.query = "";
  }
  renamePage(t, e) {
    this.beforeChange(), this.layout = {
      ...this.layout,
      pages: this.layout.pages.map((i) => i.id === t ? { ...i, title: e } : i)
    }, this.scheduleSave();
  }
  iconPage(t, e) {
    this.beforeChange(), this.layout = {
      ...this.layout,
      pages: this.layout.pages.map((i) => i.id === t ? { ...i, icon: e } : i)
    }, this.scheduleSave();
  }
  deletePage(t) {
    if (this.layout.pages.length < 2) return;
    this.beforeChange();
    const e = this.layout.pages.filter((i) => i.id !== t);
    this.layout = { ...this.layout, pages: e }, this.pageId = e[0]?.id ?? "", this.scheduleSave();
  }
  addWidget(t) {
    const e = this.currentPage;
    if (!e || !Zt.includes(t)) return;
    this.beforeChange();
    const i = Ne(t, e, this.layout.gridColumns);
    this.layout = rt(this.layout, e.id, (r) => ({ ...r, widgets: [...r.widgets, i] })), this.selectedId = i.id, this.query = "", this.scheduleSave();
  }
  updateWidget(t, e) {
    this.beforeChange(), this.layout = It(this.layout, t, (i) => ({
      ...i,
      ...e,
      style: e.style ? { ...i.style, ...Pn(e.style) } : i.style,
      config: e.config ?? i.config,
      w: e.w ? f(e.w, 2, this.layout.gridColumns) : i.w,
      h: e.h ? f(e.h, 2, 40) : i.h
    })), this.scheduleSave();
  }
  removeWidget(t) {
    const e = this.currentPage;
    e && (this.beforeChange(), this.layout = rt(this.layout, e.id, (i) => ({
      ...i,
      widgets: i.widgets.filter((r) => r.id !== t)
    })), this.selectedId === t && (this.selectedId = ""), this.scheduleSave());
  }
  nudgeOrder(t, e) {
    const i = this.currentPage;
    if (!i) return;
    const r = Et(i.widgets), s = r.findIndex((o) => o.id === t.id), a = r[s + e];
    a && (this.beforeChange(), this.layout = rt(this.layout, i.id, (o) => ({
      ...o,
      widgets: o.widgets.map((c) => c.id === t.id ? { ...c, y: a.y, x: a.x } : c.id === a.id ? { ...c, y: t.y, x: t.x } : c)
    })), this.scheduleSave());
  }
  startDrag(t, e, i) {
    const s = !!t.target?.closest(".chrome, button, input, textarea, select, a");
    if (!this.edit || this.stacked || i === "move" && s) {
      this.edit && (this.selectedId = e.id);
      return;
    }
    t.preventDefault(), t.stopPropagation();
    const o = (t.currentTarget.closest(".canvas")?.clientWidth || this.stageWidth) / this.layout.gridColumns;
    this.beforeChange(), this.selectedId = e.id, this.drag = {
      id: e.id,
      pointerId: t.pointerId,
      mode: i,
      startX: t.clientX,
      startY: t.clientY,
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      cell: o || 32,
      nx: e.x,
      ny: e.y,
      nw: e.w,
      nh: e.h
    }, window.addEventListener("pointermove", this.onPointerMove), window.addEventListener("pointerup", this.onPointerUp);
  }
  box(t) {
    return this.drag?.id === t.id ? { x: this.drag.nx, y: this.drag.ny, w: this.drag.nw, h: this.drag.nh } : t;
  }
  beforeChange() {
    this.undoArmed || (this.undoStack.push(structuredClone(this.layout)), this.undoStack.length > 40 && this.undoStack.shift(), this.undoArmed = !0, window.setTimeout(() => {
      this.undoArmed = !1;
    }, 700));
  }
  undo() {
    const t = this.undoStack.pop();
    t && (this.layout = t, this.scheduleSave());
  }
  scheduleSave() {
    this.isAdmin && (window.clearTimeout(this.saveTimer), this.saveState = "saving", this.saveTimer = window.setTimeout(() => {
      this.persist();
    }, 400));
  }
  async persist() {
    if (!(!this.hass || !this.isAdmin)) {
      this.saveState = "saving";
      try {
        const t = await Fe(this.hass, this.layout);
        this.shadowRoot?.activeElement || (this.layout = t, t.pages.some((e) => e.id === this.pageId) || (this.pageId = t.pages[0]?.id ?? "")), this.saveState = "saved", this.flash(l(this.uiLanguage, "saved"));
      } catch {
        this.saveState = "error", this.flash(l(this.uiLanguage, "save_failed"));
      }
    }
  }
  download() {
    const t = new Blob([Oe(this.layout)], { type: "application/json" }), e = URL.createObjectURL(t), i = document.createElement("a");
    i.href = e, i.download = "gulavillan-layout.json", i.click(), URL.revokeObjectURL(e);
  }
  async upload(t) {
    const e = t.target, i = e.files?.[0];
    if (e.value = "", !!i)
      try {
        this.beforeChange(), this.layout = Ie(await i.text()), this.pageId = this.layout.pages[0]?.id ?? "", this.selectedId = "", this.scheduleSave(), this.flash(l(this.uiLanguage, "import_done"));
      } catch {
        this.flash(l(this.uiLanguage, "import_invalid"));
      }
  }
  async toggle(t) {
    if (!(!this.hass || this.edit))
      try {
        await Xe(this.hass, t);
      } catch {
        this.flash(l(this.uiLanguage, "call_failed"));
      }
  }
  async brightness(t, e) {
    if (!(!this.hass || this.edit))
      try {
        await this.hass.callService("light", "turn_on", { entity_id: t, brightness: e });
      } catch {
        this.flash(l(this.uiLanguage, "call_failed"));
      }
  }
  async temperature(t, e) {
    if (!(!this.hass || this.edit))
      try {
        await this.hass.callService("climate", "set_temperature", { entity_id: t, temperature: e });
      } catch {
        this.flash(l(this.uiLanguage, "call_failed"));
      }
  }
  async runButton(t) {
    if (!this.hass || this.edit) return;
    const e = String(t.config.domain ?? ""), i = String(t.config.service ?? "");
    if (!e || !i) {
      this.flash(l(this.uiLanguage, "missing_service"));
      return;
    }
    const r = () => {
      this.callButton(t, e, i);
    };
    if (t.config.confirm === !0) {
      this.modal = { text: l(this.uiLanguage, "confirm_service"), run: r };
      return;
    }
    r();
  }
  async callButton(t, e, i) {
    if (!this.hass) return;
    let r = {};
    const s = String(t.config.data ?? "").trim();
    if (s)
      try {
        const o = JSON.parse(s);
        if (!o || typeof o != "object" || Array.isArray(o)) throw new Error("data");
        r = o;
      } catch {
        this.flash(l(this.uiLanguage, "call_failed"));
        return;
      }
    const a = String(t.config.entity_id ?? "");
    try {
      await this.hass.callService(e, i, r, a ? { entity_id: a } : void 0), this.flash(l(this.uiLanguage, "called"));
    } catch {
      this.flash(l(this.uiLanguage, "call_failed"));
    }
  }
  moreInfo(t, e) {
    this.edit || (e.stopPropagation(), this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: t },
      bubbles: !0,
      composed: !0
    })));
  }
  syncTheme() {
    if (this.layout.theme === "auto") {
      this.removeAttribute("theme"), this.style.colorScheme = this.hass?.themes?.darkMode === !1 ? "light" : "dark";
      return;
    }
    this.setAttribute("theme", this.layout.theme), this.style.colorScheme = this.layout.theme;
  }
  flash(t) {
    this.toast = t, window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(() => {
      this.toast = "";
    }, 2200);
  }
}
b([
  Z({ attribute: !1 })
], v.prototype, "hass");
b([
  Z({ type: Boolean })
], v.prototype, "narrow");
b([
  Z({ attribute: !1 })
], v.prototype, "panel");
b([
  Z({ attribute: !1 })
], v.prototype, "route");
b([
  $()
], v.prototype, "layout");
b([
  $()
], v.prototype, "status");
b([
  $()
], v.prototype, "saveState");
b([
  $()
], v.prototype, "edit");
b([
  $()
], v.prototype, "pageId");
b([
  $()
], v.prototype, "selectedId");
b([
  $()
], v.prototype, "preview");
b([
  $()
], v.prototype, "stageWidth");
b([
  $()
], v.prototype, "toast");
b([
  $()
], v.prototype, "query");
b([
  $()
], v.prototype, "history");
b([
  $()
], v.prototype, "tick");
b([
  $()
], v.prototype, "modal");
function rt(n, t, e) {
  return { ...n, pages: n.pages.map((i) => i.id === t ? e(i) : i) };
}
function It(n, t, e) {
  return {
    ...n,
    pages: n.pages.map((i) => ({
      ...i,
      widgets: i.widgets.map((r) => r.id === t ? e(r) : r)
    }))
  };
}
function Pn(n) {
  const t = {};
  return n.color && (t.color = n.color), n.background && (t.background = n.background), n.fontSize && (t.fontSize = n.fontSize), n.borderRadius !== void 0 && n.borderRadius !== null && (t.borderRadius = n.borderRadius), n.icon && n.icon.startsWith("mdi:") && (t.icon = n.icon), t;
}
function Nn(n) {
  return n && /^#[0-9a-fA-F]{6}$/.test(n) ? n : "#e0b15a";
}
customElements.get("gulavillan-dashboard") || customElements.define("gulavillan-dashboard", v);
export {
  v as GulavillanDashboard
};
