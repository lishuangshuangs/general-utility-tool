(() => {
  const codes = [
    { c: 100, n: "Continue", d: "客户端应继续请求，服务器已收到请求头。" },
    { c: 101, n: "Switching Protocols", d: "服务器正根据客户端请求切换协议。" },
    { c: 102, n: "Processing", d: "服务器已收到并正在处理请求，但尚无响应可用。" },
    { c: 200, n: "OK", d: "请求成功。最常见的成功状态码。" },
    { c: 201, n: "Created", d: "请求成功并创建了新资源，常用于 POST。" },
    { c: 202, n: "Accepted", d: "请求已接受但尚未处理完成，用于异步任务。" },
    { c: 204, n: "No Content", d: "成功处理但无返回内容，常用于 DELETE。" },
    { c: 206, n: "Partial Content", d: "成功返回部分内容，用于断点续传或范围请求。" },
    { c: 301, n: "Moved Permanently", d: "资源已永久移动到新 URL，应更新书签与链接。" },
    { c: 302, n: "Found", d: "临时重定向，后续请求仍可使用原 URL。" },
    { c: 303, n: "See Other", d: "请用 GET 方法到另一个 URI 获取结果。" },
    { c: 304, n: "Not Modified", d: "资源未修改，客户端可使用缓存版本。" },
    { c: 307, n: "Temporary Redirect", d: "临时重定向，且方法不得改变。" },
    { c: 308, n: "Permanent Redirect", d: "永久重定向，且方法不得改变。" },
    { c: 400, n: "Bad Request", d: "请求语法错误或参数无效，服务器无法理解。" },
    { c: 401, n: "Unauthorized", d: "需要身份验证，请提供有效凭证。" },
    { c: 403, n: "Forbidden", d: "服务器理解请求但拒绝执行，权限不足。" },
    { c: 404, n: "Not Found", d: "请求的资源不存在。" },
    { c: 405, n: "Method Not Allowed", d: "请求方法不被允许，请检查 Allow 头。" },
    { c: 408, n: "Request Timeout", d: "服务器等待请求时超时。" },
    { c: 409, n: "Conflict", d: "请求与服务器当前状态冲突，如资源版本。" },
    { c: 410, n: "Gone", d: "资源已永久删除且无转发地址。" },
    { c: 413, n: "Payload Too Large", d: "请求体过大，超出服务器处理能力。" },
    { c: 415, n: "Unsupported Media Type", d: "不支持的媒体类型。" },
    { c: 422, n: "Unprocessable Entity", d: "语义错误，服务器无法处理该实体。" },
    { c: 429, n: "Too Many Requests", d: "请求过于频繁，请稍后重试。" },
    { c: 500, n: "Internal Server Error", d: "服务器内部错误，无法完成请求。" },
    { c: 501, n: "Not Implemented", d: "服务器不支持请求的功能。" },
    { c: 502, n: "Bad Gateway", d: "网关或代理从上游收到无效响应。" },
    { c: 503, n: "Service Unavailable", d: "服务暂时不可用，通常因过载或维护。" },
    { c: 504, n: "Gateway Timeout", d: "网关或代理等待上游响应超时。" },
  ];

  const list = document.getElementById("list");
  const search = document.getElementById("search");
  const message = document.getElementById("message");
  let group = "all";

  function render() {
    const q = search.value.trim().toLowerCase();
    const filtered = codes.filter((item) => {
      if (group !== "all" && String(item.c)[0] !== group) return false;
      if (!q) return true;
      return (
        String(item.c).includes(q) ||
        item.n.toLowerCase().includes(q) ||
        item.d.includes(q)
      );
    });
    list.innerHTML = filtered
      .map(
        (item) =>
          `<div class="status-item"><code>${item.c}</code><div><strong>${item.n}</strong><span>${item.d}</span></div></div>`
      )
      .join("");
    message.textContent = filtered.length ? `共 ${filtered.length} 条` : "无匹配结果";
    message.className = "message";
  }

  search.addEventListener("input", render);
  document.querySelectorAll("[data-group]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-group]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      group = btn.dataset.group;
      render();
    });
  });

  render();
})();
