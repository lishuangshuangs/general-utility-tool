(() => {
  const auth = window.UtiloraAuth;
  const title = document.getElementById("title");
  const lead = document.getElementById("lead");
  const form = document.getElementById("auth-form");
  const nameField = document.getElementById("name-field");
  const confirmField = document.getElementById("confirm-field");
  const passwordField = document.getElementById("password-field");
  const strength = document.getElementById("strength");
  const submit = document.getElementById("submit");
  const toggleMode = document.getElementById("toggle-mode");
  const toggleRecover = document.getElementById("toggle-recover");
  const resend = document.getElementById("resend");
  const banner = document.getElementById("banner");
  const formMsg = document.getElementById("form-msg");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm");
  const nameInput = document.getElementById("name");

  let mode = "in";

  const setMsg = (el, text, error = false) => {
    el.className = error ? "message error" : "message";
    el.textContent = text || "";
  };

  const passwordIssue = (password, confirm) => {
    if (password.length < 8) return "密码至少 8 位";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "请同时包含字母和数字";
    if (confirm !== undefined && password !== confirm) return "两次密码不一致";
    return null;
  };

  const paint = () => {
    const isUp = mode === "up";
    const isRecover = mode === "recover";
    title.textContent = isUp ? "创建账号" : isRecover ? "重置密码" : "登录";
    lead.textContent = isUp
      ? "使用真实邮箱注册。我们会发送验证邮件，点击链接后才能登录。"
      : isRecover
        ? "输入注册邮箱，我们会发送重置链接。请到邮箱收件箱或垃圾箱查收。"
        : "使用已验证的邮箱登录。工具本身仍可免登录使用。";
    nameField.hidden = !isUp;
    confirmField.hidden = !isUp;
    passwordField.hidden = isRecover;
    passwordInput.required = !isRecover;
    confirmInput.required = isUp;
    submit.textContent = isUp ? "发送验证邮件" : isRecover ? "发送重置邮件" : "登录";
    toggleMode.textContent = isUp || isRecover ? "返回登录" : "没有账号？注册";
    toggleRecover.hidden = isRecover;
    strength.hidden = !isUp;
  };

  const goAccount = () => {
    location.href = "../account/";
  };

  (async () => {
    const captured = await auth.captureRedirect();
    if (captured?.error) setMsg(banner, captured.error, true);
    else if (captured) goAccount();
    else {
      const session = await auth.refreshIfNeeded();
      if (session) goAccount();
    }
  })();

  passwordInput.addEventListener("input", () => {
    if (mode !== "up") return;
    const value = passwordInput.value;
    if (!value) {
      strength.hidden = true;
      return;
    }
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const label = score <= 1 ? "弱" : score === 2 ? "一般" : score === 3 ? "较好" : "强";
    strength.hidden = false;
    strength.textContent = "密码强度：" + label;
  });

  toggleMode.addEventListener("click", () => {
    mode = mode === "in" ? "up" : "in";
    setMsg(formMsg, "");
    resend.hidden = true;
    paint();
  });

  toggleRecover.addEventListener("click", () => {
    mode = "recover";
    setMsg(formMsg, "");
    paint();
  });

  resend.addEventListener("click", async () => {
    resend.disabled = true;
    try {
      await auth.resend(emailInput.value.trim().toLowerCase());
      setMsg(formMsg, "验证邮件已重新发送，请查收。");
    } catch (error) {
      setMsg(formMsg, error.message || "发送失败", true);
    } finally {
      resend.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const name = nameInput.value.trim() || email.split("@")[0];
    submit.disabled = true;
    setMsg(formMsg, "请稍候…");
    resend.hidden = true;
    try {
      if (mode === "recover") {
        await auth.recover(email);
        setMsg(formMsg, "如果该邮箱已注册，重置邮件已发出。");
        return;
      }
      if (mode === "up") {
        const issue = passwordIssue(password, confirm);
        if (issue) throw new Error(issue);
        const data = await auth.signup(email, password, name);
        if (data.access_token) {
          await auth.login(email, password).catch(() => {});
          goAccount();
          return;
        }
        setMsg(formMsg, "验证邮件已发送到 " + email + "。请打开邮件中的链接后再登录。");
        resend.hidden = false;
        return;
      }
      await auth.login(email, password);
      goAccount();
    } catch (error) {
      const unconfirmed = /confirm|not.*verified|email_not_confirmed/i.test(error.code + " " + error.message);
      setMsg(formMsg, unconfirmed ? "邮箱尚未验证。请先打开验证邮件中的链接。" : error.message || "登录失败", true);
      resend.hidden = !unconfirmed;
    } finally {
      submit.disabled = false;
    }
  });

  paint();
})();
