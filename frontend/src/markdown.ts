/** Markdown, plus a small HTML subset with scripts removed. */

const ALLOWED = new Set([
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
  "SMALL",
]);

const DROP = new Set([
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
  "MATH",
]);

const CSS_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "font-size",
  "text-align",
  "border-radius",
  "padding",
  "margin",
  "font-weight",
  "opacity",
]);

export function renderBlock(content: string, html: boolean): string {
  const source = content.slice(0, 20000);
  if (html) return sanitizeHtml(source);
  return markdownToHtml(source);
}

export function markdownToHtml(source: string): string {
  const lines = escapeHtml(source).split(/\r?\n/);
  const html: string[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (!list) return;
    html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = null;
  };
  for (const line of lines) {
    const item = /^(?:-|\*)\s+(.*)$/.exec(line);
    if (item) {
      list ??= [];
      list.push(item[1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    html.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return html.join("");
}

export function sanitizeHtml(source: string): string {
  if (typeof DOMParser === "undefined") return markdownToHtml(source);
  const doc = new DOMParser().parseFromString(`<div id="gv-root">${source}</div>`, "text/html");
  const root = doc.getElementById("gv-root");
  if (!root) return "";
  sanitizeNode(root);
  return root.innerHTML;
}

function sanitizeNode(node: Element): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }
    if (!(child instanceof Element)) continue;
    if (DROP.has(child.tagName)) {
      child.remove();
      continue;
    }
    if (!ALLOWED.has(child.tagName)) {
      const text = child.textContent ?? "";
      child.replaceWith(docText(child, text));
      continue;
    }
    filterAttributes(child);
    sanitizeNode(child);
  }
}

function filterAttributes(element: Element): void {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    if (name.startsWith("on") || name === "srcdoc" || name === "style") {
      if (name === "style") {
        const cleaned = cleanStyle(attribute.value);
        if (cleaned) element.setAttribute("style", cleaned);
        else element.removeAttribute(name);
      } else {
        element.removeAttribute(attribute.name);
      }
      continue;
    }
    if (element.tagName === "A" && name === "href") {
      if (!safeLink(attribute.value)) element.removeAttribute(attribute.name);
      else element.setAttribute("rel", "noopener noreferrer");
      continue;
    }
    if (element.tagName === "IMG" && name === "src") {
      if (!safeImage(attribute.value)) element.removeAttribute(attribute.name);
      continue;
    }
    if (element.tagName === "IMG" && (name === "alt" || name === "title")) continue;
    if (name === "href" || name === "src" || name === "alt" || name === "title") continue;
    element.removeAttribute(attribute.name);
  }
}

function cleanStyle(value: string): string {
  if (/url\(|expression|javascript|@import/i.test(value)) return "";
  return value
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const [prop, raw] = part.split(":");
      if (!prop || raw === undefined) return false;
      return CSS_PROPS.has(prop.trim().toLowerCase()) && !/url\(|expression/i.test(raw);
    })
    .join("; ");
}

function safeLink(value: string): boolean {
  const cleaned = value.trim();
  return (
    cleaned.startsWith("/") && !cleaned.startsWith("//") ||
    /^https?:\/\//i.test(cleaned) ||
    /^mailto:/i.test(cleaned)
  );
}

function safeImage(value: string): boolean {
  const cleaned = value.trim();
  return (
    (cleaned.startsWith("/") && !cleaned.startsWith("//") && (cleaned.startsWith("/local/") || cleaned.startsWith("/api/"))) ||
    /^https:\/\//i.test(cleaned)
  );
}

function docText(node: Node, text: string): Text {
  return (node.ownerDocument ?? document).createTextNode(text);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
      const safe = unescapeHtml(href);
      if (!safeLink(safe)) return label;
      return `<a href="${escapeHtml(safe)}" rel="noopener noreferrer">${label}</a>`;
    });
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
