const input = document.getElementById("input");
const message = document.getElementById("message");

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS", "NULL",
  "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "ON", "AS", "ORDER", "BY", "GROUP",
  "HAVING", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW", "UNION", "ALL", "DISTINCT",
  "CASE", "WHEN", "THEN", "ELSE", "END", "EXISTS", "COUNT", "SUM", "AVG", "MIN", "MAX",
  "ASC", "DESC", "WITH", "RECURSIVE", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "CONSTRAINT", "DEFAULT", "CHECK", "UNIQUE", "CASCADE", "RESTRICT", "TRUE", "FALSE"
];

const SAMPLE = `select u.id, u.name, count(o.id) as order_count
from users u
left join orders o on o.user_id = u.id
where u.status = 1 and u.created_at > '2024-01-01'
group by u.id, u.name
having count(o.id) > 0
order by order_count desc
limit 20;`;

function show(ok, text) {
  message.className = ok ? "message" : "message error";
  message.textContent = text;
}

function upperKeywords(sql) {
  let result = sql;
  KEYWORDS.forEach((kw) => {
    const re = new RegExp("\\b" + kw + "\\b", "gi");
    result = result.replace(re, kw);
  });
  return result;
}

function minifySql(sql) {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*([,;()=<>+\-*/])\s*/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function formatSql(sql) {
  let s = minifySql(sql);
  s = upperKeywords(s);

  // Newlines before major clauses
  const clauses = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "INNER JOIN", "LEFT JOIN",
    "RIGHT JOIN", "FULL JOIN", "OUTER JOIN", "ON", "GROUP BY", "HAVING",
    "ORDER BY", "LIMIT", "OFFSET", "UNION", "UNION ALL", "INSERT INTO",
    "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE",
    "DROP TABLE", "CASE", "WHEN", "THEN", "ELSE", "END"
  ];

  // Longer first to avoid partial matches
  clauses.sort((a, b) => b.length - a.length);

  clauses.forEach((clause) => {
    const re = new RegExp("\\b" + clause.replace(/ /g, "\\s+") + "\\b", "gi");
    s = s.replace(re, "\n" + clause);
  });

  // Indent after SELECT / SET etc. for columns
  const lines = s.split("\n").map((line) => line.trim()).filter(Boolean);
  const out = [];
  let indent = 0;

  lines.forEach((line) => {
    const upper = line.toUpperCase();
    if (/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|UNION|SET|VALUES|ON)\b/.test(upper)) {
      indent = 0;
    }
    if (/^(AND|OR)\b/.test(upper)) {
      out.push("  " + line);
      return;
    }
    if (/^(JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|OUTER JOIN)\b/.test(upper)) {
      indent = 0;
      out.push(line);
      return;
    }
    if (/^SELECT\b/.test(upper) || /^SET\b/.test(upper)) {
      out.push(line);
      indent = 1;
      return;
    }
    if (/^CASE\b/.test(upper)) {
      out.push("  ".repeat(indent) + line);
      indent += 1;
      return;
    }
    if (/^END\b/.test(upper)) {
      indent = Math.max(0, indent - 1);
      out.push("  ".repeat(indent) + line);
      return;
    }
    out.push("  ".repeat(indent) + line);
  });

  return out.join("\n").replace(/^\n+/, "").trim() + (sql.trim().endsWith(";") ? ";" : "");
}

document.getElementById("format").onclick = () => {
  if (!input.value.trim()) {
    show(false, "请输入 SQL");
    return;
  }
  input.value = formatSql(input.value);
  show(true, "已格式化");
};

document.getElementById("minify").onclick = () => {
  if (!input.value.trim()) {
    show(false, "请输入 SQL");
    return;
  }
  input.value = minifySql(input.value);
  show(true, "已压缩");
};

document.getElementById("upper").onclick = () => {
  if (!input.value.trim()) {
    show(false, "请输入 SQL");
    return;
  }
  input.value = upperKeywords(input.value);
  show(true, "关键字已大写");
};

document.getElementById("sample").onclick = () => {
  input.value = SAMPLE;
  show(true, "已填入示例");
};

document.getElementById("copy").onclick = async () => {
  await navigator.clipboard.writeText(input.value);
  show(true, "已复制");
};

document.getElementById("clear").onclick = () => {
  input.value = "";
  show(true, "");
};

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    document.getElementById("format").click();
  }
});
