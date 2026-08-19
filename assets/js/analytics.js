(() => {
  const script = document.currentScript;
  const tool = script?.dataset.tool || null;
  const url = "https://nkxgnqzdswugbjjquxfj.supabase.co/rest/v1/rpc/track_analytics_event";
  const apikey = "sb_publishable_IUK0swkEhqmaWKjUGv_IIQ_Y7LjtayF";
  const key = "utilora_visitor_id";
  let sessionId;
  try {
    sessionId = localStorage.getItem(key) || crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  } catch {
    sessionId = crypto.randomUUID();
  }
  const ua = navigator.userAgent;
  const device = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Other";
  let referrer = "direct";
  try {
    if (document.referrer) referrer = new URL(document.referrer).hostname || "direct";
  } catch {}
  function track(eventType, toolSlug = null) {
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: { apikey, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_event_type: eventType,
        p_tool_slug: toolSlug,
        p_path: location.pathname.slice(0, 200),
        p_session_id: sessionId,
        p_referrer: referrer,
        p_device: device,
        p_browser: browser,
      }),
    }).catch(() => {});
  }
  track("page_view", tool);
  if (tool) track("tool_use", tool);

  if (script?.src && !window.__utiloraAppLoaded) {
    const app = document.createElement("script");
    app.src = new URL("app.js", script.src).href;
    document.head.append(app);
  }
})();
