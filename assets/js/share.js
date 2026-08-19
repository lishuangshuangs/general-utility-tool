(() => {
  const PREFIX = ".";

  function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(value) {
    try {
      const pad = (4 - (value.length % 4)) % 4;
      const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
      const bin = atob(padded);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  }

  function encodeShareQuery(text) {
    return PREFIX + toBase64Url(text);
  }

  function decodeShareQuery(q) {
    if (!q) return "";
    if (q.startsWith(PREFIX) && q.length > 1) {
      const decoded = fromBase64Url(q.slice(1));
      if (decoded != null) return decoded;
    }
    return q;
  }

  function readShareQuery() {
    return decodeShareQuery(new URLSearchParams(location.search).get("q") || "");
  }

  async function copyShareLink(text, messageEl) {
    const url = new URL(location.href);
    if (text) url.searchParams.set("q", encodeShareQuery(text));
    else url.searchParams.delete("q");
    try {
      await navigator.clipboard.writeText(url.toString());
      if (messageEl) {
        messageEl.className = "message";
        messageEl.textContent = "已复制分享链接";
      }
    } catch {
      if (messageEl) {
        messageEl.className = "message error";
        messageEl.textContent = "复制失败，请手动复制地址栏";
      }
    }
  }

  window.UtiloraShare = { encodeShareQuery, decodeShareQuery, readShareQuery, copyShareLink };
})();
