(() => {
  const API = "https://nkxgnqzdswugbjjquxfj.supabase.co";
  const KEY = "sb_publishable_IUK0swkEhqmaWKjUGv_IIQ_Y7LjtayF";
  const SESSION_KEY = "utilora_sb_session";
  const REDIRECT = "https://utilora.github.io/account/";

  const headers = (token) => {
    const value = { apikey: KEY, "Content-Type": "application/json" };
    if (token) value.Authorization = "Bearer " + token;
    return value;
  };

  const readSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  };

  const writeSession = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  const parseJson = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.msg || data.error_description || data.error || data.message || "请求失败";
      const error = new Error(message);
      error.code = data.error_code || data.code;
      throw error;
    }
    return data;
  };

  const fetchUser = async (token) => {
    const response = await fetch(API + "/auth/v1/user", { headers: headers(token) });
    return parseJson(response);
  };

  const saveTokens = async (payload) => {
    const access = payload.access_token;
    const refresh = payload.refresh_token;
    const user = payload.user || (await fetchUser(access));
    const session = {
      access_token: access,
      refresh_token: refresh,
      expires_at: payload.expires_at || Math.floor(Date.now() / 1000) + (payload.expires_in || 3600),
      user,
    };
    writeSession(session);
    return session;
  };

  const refreshIfNeeded = async () => {
    const session = readSession();
    if (!session) return null;
    const skew = 60;
    if (session.expires_at && session.expires_at - skew > Date.now() / 1000) return session;
    if (!session.refresh_token) {
      clearSession();
      return null;
    }
    try {
      const response = await fetch(API + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      const data = await parseJson(response);
      return saveTokens(data);
    } catch {
      clearSession();
      return null;
    }
  };

  const captureRedirect = async () => {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(location.search);
    const error = hash.get("error_description") || search.get("error_description") || search.get("error");
    if (error) {
      history.replaceState({}, "", location.pathname);
      return { error: decodeURIComponent(error.replace(/\+/g, " ")) };
    }
    const access = hash.get("access_token");
    const refresh = hash.get("refresh_token");
    if (!access) return null;
    const type = hash.get("type") || search.get("type") || "";
    await saveTokens({
      access_token: access,
      refresh_token: refresh,
      expires_in: Number(hash.get("expires_in") || 3600),
    });
    history.replaceState({}, "", location.pathname);
    return { type };
  };

  const signup = async (email, password, name) => {
    const response = await fetch(API + "/auth/v1/signup?redirect_to=" + encodeURIComponent(REDIRECT), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email, password, data: { name } }),
    });
    return parseJson(response);
  };

  const login = async (email, password) => {
    const response = await fetch(API + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJson(response);
    return saveTokens(data);
  };

  const recover = async (email) => {
    const response = await fetch(API + "/auth/v1/recover?redirect_to=" + encodeURIComponent(REDIRECT), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email }),
    });
    if (response.status === 429) throw new Error("发送太频繁，请稍后再试");
    return parseJson(response);
  };

  const resend = async (email) => {
    const response = await fetch(API + "/auth/v1/resend", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ type: "signup", email }),
    });
    if (response.status === 429) throw new Error("发送太频繁，请稍后再试");
    return parseJson(response);
  };

  const updateUser = async (body) => {
    const session = await refreshIfNeeded();
    if (!session) throw new Error("请先登录");
    const response = await fetch(API + "/auth/v1/user", {
      method: "PUT",
      headers: headers(session.access_token),
      body: JSON.stringify(body),
    });
    const user = await parseJson(response);
    writeSession({ ...session, user });
    return user;
  };

  const logout = async () => {
    const session = readSession();
    if (session?.access_token) {
      await fetch(API + "/auth/v1/logout", { method: "POST", headers: headers(session.access_token) }).catch(() => {});
    }
    clearSession();
  };

  const displayName = (user) => user?.user_metadata?.name || user?.email?.split("@")[0] || "账号";
  const isVerified = (user) => Boolean(user?.email_confirmed_at || user?.confirmed_at || user?.user_metadata?.email_verified);

  window.UtiloraAuth = {
    readSession,
    refreshIfNeeded,
    captureRedirect,
    signup,
    login,
    recover,
    resend,
    updateUser,
    logout,
    displayName,
    isVerified,
  };
})();
