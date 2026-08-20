(() => {
  const ACCOUNTS = "utilora_accounts";
  const SESSION = "utilora_session";

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const digest = async (text) => {
    const bytes = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const setMsg = (id, text, error = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = error ? "message error" : "message";
    el.textContent = text;
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => {
      if (ch === "&") return "&#38;";
      if (ch === "<") return "&#60;";
      if (ch === ">") return "&#62;";
      if (ch === '"') return "&#34;";
      return "&#39;";
    });

  const session = read(SESSION, null);
  if (session) {
    const who = escapeHtml(session.name || session.email || "账号");
    document.querySelector(".login-card").innerHTML = `
      <a class="brand" href="../"><span class="brand-mark">U</span><span>返回工具箱</span></a>
      <h1>已登录</h1>
      <p class="hint">${who}</p>
      <button id="logout" type="button">退出登录</button>
    `;
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem(SESSION);
      location.reload();
    });
    return;
  }

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value.trim();
    const button = document.getElementById("submit");
    button.disabled = true;
    setMsg("form-msg", "请稍候…");
    try {
      if (password.length < 8) throw new Error("密码至少 8 位");
      const pass = await digest(email + ":" + password);
      const accounts = read(ACCOUNTS, []);
      const existing = accounts.find((item) => item.email === email);
      if (existing) {
        if (existing.pass !== pass) throw new Error("邮箱或密码不对");
        write(SESSION, { email, name: existing.name || email.split("@")[0] });
      } else {
        const profile = { email, name: name || email.split("@")[0], pass };
        write(ACCOUNTS, [...accounts, profile]);
        write(SESSION, { email: profile.email, name: profile.name });
      }
      location.href = "../";
    } catch (error) {
      setMsg("form-msg", error.message || "登录失败", true);
    } finally {
      button.disabled = false;
    }
  });
})();
