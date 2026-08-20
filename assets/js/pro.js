(() => {
  const fromUser = (user) => {
    const meta = (user && user.user_metadata) || {};
    if (meta.plan === "pro" || meta.pro === true) return "pro";
    if (meta.pro_until && Date.parse(meta.pro_until) > Date.now()) return "pro";
    return "free";
  };

  const currentUser = () => {
    const auth = window.UtiloraAuth;
    if (auth && auth.readSession) {
      const session = auth.readSession();
      return session && session.user;
    }
    try {
      const session = JSON.parse(localStorage.getItem("utilora_sb_session") || "null");
      return session && session.user;
    } catch {
      return null;
    }
  };

  const plan = () => fromUser(currentUser());
  const isPro = () => plan() === "pro";

  window.UtiloraPro = {
    fromUser,
    plan,
    isPro,
    href: "/pro/",
  };
})();
