/* ============================================================
   第二章讲义 · 动态可视化
   app.js — 所有交互都在这里，无依赖、无网络请求
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------------------------------------------
     1. 滚动进度 + 顶部导航 + 回到顶部
     ------------------------------------------------------------ */
  const progress = $("#progress");
  const nav = $("#nav");
  const navLinks = $$("#nav .navlinks a");
  const sections = $$("main section");
  const hero = $(".hero");

  function onScroll() {
    const st = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (st / max) * 100 : 0) + "%";

    if (nav) {
      const threshold = hero ? hero.offsetHeight * 0.55 : 400;
      nav.classList.toggle("show", st > threshold);
    }

    let current = "";
    for (const sec of sections) {
      if (st >= sec.offsetTop - 160) current = sec.id;
    }
    navLinks.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });

    const toTop = $("#toTop");
    if (toTop) toTop.classList.toggle("show", st > 700);
  }

  let scrollTick = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTick) {
        scrollTick = true;
        requestAnimationFrame(() => {
          onScroll();
          scrollTick = false;
        });
      }
    },
    { passive: true }
  );
  onScroll();

  const toTop = $("#toTop");
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ------------------------------------------------------------
     1.5 页内锚点：统一用 JS 滚动
     某些预览窗口 / iframe 会拦掉原生 #hash 跳转，导致"点了没反应"，
     所以这里统一接管：JS 滚动 + 失败时提示用浏览器打开。
     ------------------------------------------------------------ */
  let previewToastShown = false;
  function showPreviewToast() {
    if (previewToastShown) return;
    previewToastShown = true;
    const t = document.createElement("div");
    t.className = "preview-toast";
    t.textContent =
      "页面没有滚动：当前预览窗口可能禁止了滚动。双击 index.html，用系统浏览器打开即可正常使用。";
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => t.classList.remove("show"), 8000);
    setTimeout(() => t.remove(), 8800);
  }

  function goToTarget(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    const navH = nav ? nav.offsetHeight : 0;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - navH - 12);
    const startY = window.scrollY;
    try {
      window.scrollTo({ top, behavior: "smooth" });
    } catch (err) {
      window.scrollTo(0, top);
    }
    setTimeout(() => {
      // 有些环境会忽略 smooth，甚至完全禁止滚动：先硬跳一次，再判断是否失败
      if (Math.abs(window.scrollY - startY) < 4) {
        window.scrollTo(0, top);
        try {
          el.scrollIntoView({ block: "start" });
        } catch (err) {}
      }
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        const invisible = r.top < -8 || r.top > window.innerHeight - 60;
        if (Math.abs(window.scrollY - startY) < 4 && invisible) showPreviewToast();
      }, 220);
    }, 900);
    try {
      history.replaceState(null, "", "#" + id);
    } catch (err) {}
    return true;
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      goToTarget(id);
    });
  });

  const scrollHint = $(".scroll-hint");
  if (scrollHint) {
    scrollHint.style.cursor = "pointer";
    scrollHint.addEventListener("click", () => goToTarget("overview"));
  }

  /* ------------------------------------------------------------
     2. 滚动揭示动画
     ------------------------------------------------------------ */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ------------------------------------------------------------
     3. 通用 tabs（tsconfig 等）
     ------------------------------------------------------------ */
  $$(".tabs").forEach((wrap) => {
    const tabs = $$(".tab", wrap);
    const panels = $$(".tabpanel", wrap);
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === tab.dataset.tab));
      });
    });
  });

  /* ------------------------------------------------------------
     4. 目录树 explorer
     ------------------------------------------------------------ */
  const TREE = {
    root: {
      title: "AI_Agent_Dev/",
      path: "仓库根目录",
      desc: "只负责“怎么把三个包一起跑起来”，自己不含业务代码。根 package.json 是调度台，workspaces 字段把三个目录纳入同一个依赖图。",
      points: [
        "package.json：脚本、workspaces、包管理器版本",
        "turbo.json：任务编排规则",
        "bunfig.toml：依赖安装方式（isolated）",
        "tsconfig.base.json：共享的 TS 编译选项与路径别名",
      ],
    },
    clients: {
      title: "clients/",
      path: "clients/",
      desc: "所有“面向用户”的应用都放这里。当前只有一个 chat-web；以后加移动端、管理后台，也是这个目录下的新 workspace 包。",
      points: ["每个子目录 = 一个独立应用包", "拥有自己的 package.json / tsconfig / next.config", "构建产物是静态资源，最终交给浏览器"],
    },
    "chat-web": {
      title: "clients/chat-web/",
      path: "@autix/chat-web · version 0.1.0",
      desc: "Next.js 16 + React 19 的聊天前端。dev 端口 3002；启动前用 wait-on 等后端 4001 就绪。",
      points: [
        "src/app/page.tsx：显示 APP_NAME + 按钮 fetch /hello",
        "next.config.ts：transpilePackages / standalone / outputFileTracingRoot / env",
        "依赖 @autix/contracts workspace:*",
        "AGENTS.md：给 AI 协作的说明文件",
      ],
    },
    services: {
      title: "services/",
      path: "services/",
      desc: "长期驻留的服务进程。当前只有 chat（NestJS，端口 4001）；以后可加 worker、网关等。",
      points: ["进程型产物，不是静态文件", "直接与数据库 / 外部 API 打交道", "对外只暴露 HTTP 接口"],
    },
    chat: {
      title: "services/chat/",
      path: "@autix/chat · version 0.0.1",
      desc: "NestJS 12 后端。main.ts 建应用开 CORS 监听 4001；controller 接请求，service 拼 APP_NAME 返回 JSON。",
      points: [
        "dev：bun node_modules/.bin/nest start --watch（修过）",
        "build：bun node_modules/.bin/nest build（修过）",
        "start：bun run dist/main.js",
        "5 个源文件：main / app.module / controller / service / 测试",
      ],
    },
    packages: {
      title: "packages/",
      path: "packages/",
      desc: "被多个包共享的代码。这里放 contracts；将来可以放 ui 组件库、utils、配置包。",
      points: ["不直接部署，只被别人 import", "版本通常 0.0.0（内部包不发布）", "是前端与后端唯一的共享耦合层"],
    },
    contracts: {
      title: "packages/contracts/",
      path: "@autix/contracts · version 0.0.0",
      desc: "零构建共享包：exports / types 直接指向 src/index.ts，目前只导出 APP_NAME = \"llm\"。",
      points: [
        "src/index.ts：export const APP_NAME = \"llm\"",
        "两端都用 workspace:* 依赖它",
        "exports 指向源码，打包器友好；裸 Node import .ts 会失败",
        "生产环境建议改为构建 dist 后导出",
      ],
    },
    infra: {
      title: "infra/",
      path: "infra/",
      desc: "基础设施目录，目前 infra/compose 是空的，预留给 2.8 的 Docker Compose 编排。",
      points: ["之后会放 docker-compose.yml", "把 chat-web + chat 编成一个可部署环境", "与业务代码分开，避免污染包结构"],
    },
    configs: {
      title: "根配置文件",
      path: "仓库根 · 配置四件套",
      desc: "四个文件分别管四件事：依赖安装（bunfig.toml）、任务编排（turbo.json）、TypeScript 共享选项（tsconfig.base.json）、脚本与工作区声明（package.json）。",
      points: [
        "bunfig.toml：linker = isolated",
        "turbo.json：build / dev / typecheck 任务规则",
        "tsconfig.base.json：target ES2022 + @autix/contracts paths",
        "package.json：workspaces + clean:ports + turbo scripts",
      ],
    },
    docs: {
      title: "README / docs",
      path: "文档与讲义",
      desc: "README.md 说明目录结构与根配置；docs/第二章项目讲义.md 是本次学习的完整文字版；docs/lecture/ 就是你现在正在看的这个页面。",
      points: ["README.md：根 package.json 逐项说明", "docs/第二章项目讲义.md：16 章 + 附录", "docs/lecture/：index.html + style.css + app.js"],
    },
  };

  const treeList = $("#treeList");
  const treePanel = $("#treePanel");
  if (treeList && treePanel) {
    treeList.addEventListener("click", (e) => {
      const btn = e.target.closest(".tree-node");
      if (!btn) return;
      const data = TREE[btn.dataset.node];
      if (!data) return;
      $$(".tree-node", treeList).forEach((b) => b.classList.toggle("active", b === btn));
      treePanel.innerHTML =
        "<h3>" + data.title + "</h3>" +
        '<div class="path">' + data.path + "</div>" +
        "<p>" + data.desc + "</p>" +
        "<ul>" + data.points.map((p) => "<li>" + p + "</li>").join("") + "</ul>";
    });
  }

  /* ------------------------------------------------------------
     5. package.json 字段解释
     ------------------------------------------------------------ */
  const PJ = {
    name: {
      title: '"name": "root"',
      path: '根包名 · 必填',
      desc: "根包也是 workspace 图里的一个节点，但它 private: true，永远不会被发布。它不产出代码，只承载脚本与依赖管理。",
      why: "没有它，根目录就只是一个文件夹，而不是依赖图里的包；Turbo / 包管理器也无从识别。",
    },
    private: {
      title: '"private": true',
      path: "禁止发布",
      desc: "告诉包管理器：这个包不能 npm publish。对根包和所有内部 workspace 包都建议打开。",
      why: "防止手滑把整个 monorepo 根目录（或内部包）发布到 npm，同时让包管理器容忍没有 version / description 等字段。",
    },
    workspaces: {
      title: '"workspaces": ["clients/*", "services/*", "packages/*"]',
      path: "工作区声明",
      desc: "三个 glob 把 clients / services / packages 下的每个 package.json 纳入同一个依赖图，共用根 bun.lock。",
      why: "这是 monorepo 的入口：没有它，三个目录只是普通文件夹，bun install 不会把它们互相软链，workspace:* 也无从解析。",
    },
    packageManager: {
      title: '"packageManager": "bun@1.4.4"',
      path: "包管理器版本声明",
      desc: "声明这个仓库使用 Bun 1.4.4。Corepack、Turbo、编辑器会读取它，用来判断该用哪个锁文件、怎么执行脚本。",
      why: "避免“我这用 bun、他那用 npm”导致的锁文件冲突；也避免 Turbo 猜错包管理器。",
    },
    scripts: {
      title: '"scripts" · 7 个任务',
      path: "根级命令入口",
      desc: "clean:ports 清端口；dev / dev:chat / dev:chat-web 启动进程；build / typecheck / lint 交给 Turbo 分发到各包。",
      why: "根脚本只做“调度”，不写业务逻辑。真正的实现都在子包里，根目录负责组合。",
    },
    devDependencies: {
      title: '"devDependencies"',
      path: "根级开发依赖",
      desc: "turbo 是任务编排器；wait-on 是等待端口就绪的工具（实际更多写在 chat-web 的 dev 脚本里）。",
      why: "根目录只放“所有包共用、且只在开发时需要”的工具；业务依赖留在各自包里。",
    },
  };

  const pjWrap = $(".pj-wrap");
  const pjPanel = $("#pjPanel");
  if (pjWrap && pjPanel) {
    pjWrap.addEventListener("click", (e) => {
      const target = e.target.closest("[data-pj]");
      if (!target) return;
      const data = PJ[target.dataset.pj];
      if (!data) return;
      $$("[data-pj]", pjWrap).forEach((el) => el.classList.toggle("active", el === target));
      pjPanel.innerHTML =
        "<h3><code>" + data.title + "</code></h3>" +
        '<div class="path">' + data.path + "</div>" +
        "<p>" + data.desc + "</p>" +
        "<p><b>为什么重要：</b>" + data.why + "</p>";
    });
  }

  /* ------------------------------------------------------------
     6. 注释演示
     ------------------------------------------------------------ */
  const commentBtn = $("#commentBtn");
  const commentOut = $("#commentOut");
  if (commentBtn && commentOut) {
    commentBtn.addEventListener("click", () => {
      const hidden = commentOut.style.display === "none";
      commentOut.style.display = hidden ? "block" : "none";
      commentBtn.textContent = hidden ? "收起报错" : "点我看报错";
    });
  }

  /* ------------------------------------------------------------
     7. Turbo 构建模拟
     ------------------------------------------------------------ */
  const turboLog = $("#turboLog");
  const turboTimer = $("#turboTimer");
  const turboRunBtn = $("#turboRun");
  const turboAgainBtn = $("#turboRunAgain");
  const taskEls = { contracts: $("#taskContracts"), chat: $("#taskChat"), web: $("#taskWeb") };
  let turboBusy = false;

  function tLine(text, cls) {
    if (!turboLog) return;
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "");
    div.textContent = text;
    turboLog.appendChild(div);
    turboLog.scrollTop = turboLog.scrollHeight;
  }

  function resetTasks() {
    Object.values(taskEls).forEach((el) => {
      if (!el) return;
      el.className = "task";
      const stat = $(".tstat", el);
      if (stat) stat.textContent = "build · 等待中";
    });
  }

  function setTask(key, cls, statText) {
    const el = taskEls[key];
    if (!el) return;
    el.className = "task" + (cls ? " " + cls : "");
    const stat = $(".tstat", el);
    if (stat) stat.textContent = statText;
  }

  async function runTurbo(cachedRun) {
    if (turboBusy || !turboLog) return;
    turboBusy = true;
    if (turboRunBtn) turboRunBtn.disabled = true;
    if (turboAgainBtn) turboAgainBtn.disabled = true;
    turboLog.innerHTML = "";
    resetTasks();
    if (turboTimer) turboTimer.textContent = "Time: —";

    tLine("$ turbo run build", "cmd");
    await sleep(420);

    if (!cachedRun) {
      tLine("读取根 package.json · workspaces: clients/* services/* packages/*");
      await sleep(260);
      tLine("读取 turbo.json · tasks: build / dev / typecheck");
      await sleep(240);
      tLine("包图：@autix/contracts  @autix/chat  @autix/chat-web", "dim");
      await sleep(300);

      setTask("contracts", "skip", "跳过 · 没有 build 脚本");
      tLine("@autix/contracts   跳过：package.json 里没有 build 脚本", "warn");
      await sleep(420);

      setTask("chat", "running", "编译中…");
      await sleep(760);
      setTask("chat", "ok", "✓ dist/ · 2.3s");
      tLine("@autix/chat        build: nest build → dist/            (2.3s)");
      await sleep(320);

      setTask("web", "running", "构建中…");
      await sleep(880);
      setTask("web", "ok", "✓ .next/ · 3.1s");
      tLine("@autix/chat-web    build: next build → .next/         (3.1s)");
      await sleep(320);

      tLine("Tasks: 2 successful, 2 total     Time: 5.4s", "ok");
      if (turboTimer) turboTimer.textContent = "Time: 5.4s";
    } else {
      tLine("读取缓存指纹（hash）… 和上次一致");
      await sleep(420);
      setTask("contracts", "skip", "跳过 · 没有 build 脚本");
      tLine("@autix/contracts   跳过：没有 build 脚本", "warn");
      await sleep(220);
      setTask("chat", "cached", "cache hit · 0.01s");
      tLine("@autix/chat        cache hit  (输入未变化)", "cached");
      await sleep(220);
      setTask("web", "cached", "cache hit · 0.01s");
      tLine("@autix/chat-web    cache hit  (输入未变化)", "cached");
      await sleep(220);
      tLine("Tasks: 2 successful, 2 cached     Time: 0.08s", "ok");
      if (turboTimer) turboTimer.textContent = "Time: 0.08s";
    }

    if (turboRunBtn) turboRunBtn.disabled = false;
    if (turboAgainBtn) turboAgainBtn.disabled = false;
    turboBusy = false;
  }

  if (turboRunBtn) turboRunBtn.addEventListener("click", () => runTurbo(false));
  if (turboAgainBtn) turboAgainBtn.addEventListener("click", () => runTurbo(true));

  /* ------------------------------------------------------------
     8. isolated / hoisted 切换
     ------------------------------------------------------------ */
  const linkerSwitch = $("#linkerSwitch");
  const linkerLabel = $("#linkerLabel");
  const hoistedPanel = $("#hoistedPanel");
  const isolatedPanel = $("#isolatedPanel");

  function updateLinker() {
    if (!linkerSwitch) return;
    const isolated = linkerSwitch.checked;
    if (linkerLabel) {
      linkerLabel.innerHTML = isolated
        ? "<b>isolated</b> · 每个包只看见自己声明的依赖（当前）"
        : "<b>hoisted</b> · 依赖提升到根 node_modules，所有包都能看到";
    }
    if (hoistedPanel) hoistedPanel.classList.toggle("dimmed", isolated);
    if (isolatedPanel) isolatedPanel.classList.toggle("dimmed", !isolated);
  }
  if (linkerSwitch) {
    linkerSwitch.addEventListener("change", updateLinker);
    updateLinker();
  }

  /* ------------------------------------------------------------
     9. contracts 实时联动
     ------------------------------------------------------------ */
  const appNameInput = $("#appNameInput");
  if (appNameInput) {
    const contractsLine = $("#contractsLine");
    const webTitle = $("#webTitle");
    const apiMessage = $("#apiMessage");
    const contractChip = $("#contractsChip");
    const webCol = $(".demo-web");
    const apiCol = $(".demo-api");

    const updateContracts = () => {
      const v = appNameInput.value.trim() || "llm";
      if (contractsLine) contractsLine.textContent = '"' + v + '"';
      if (webTitle) webTitle.textContent = v;
      if (apiMessage) {
        apiMessage.textContent = '{\n  "message": "Hello from Chat, shared APP_NAME=' + v + '"\n}';
      }
      [webCol, apiCol].forEach((el) => {
        if (!el) return;
        el.classList.remove("pulse");
        void el.offsetWidth;
        el.classList.add("pulse");
      });
      if (contractChip) {
        contractChip.textContent = "live · " + new Date().toLocaleTimeString("zh-CN", { hour12: false });
      }
    };

    appNameInput.addEventListener("input", updateContracts);
    updateContracts();
  }

  /* ------------------------------------------------------------
     10. NEXT_PUBLIC 内联演示
     ------------------------------------------------------------ */
  const inlineBuild = $("#inlineBuild");
  if (inlineBuild) {
    const envUrl = $("#envUrl");
    const envPrefix = $("#envPrefix");
    const bundleCode = $("#bundleCode");
    const browserOut = $("#inlineBrowserOut");
    let building = false;

    inlineBuild.addEventListener("click", async () => {
      if (building) return;
      building = true;
      inlineBuild.disabled = true;
      const val = (envUrl.value || "").trim() || "http://localhost:4001";
      const prefixed = envPrefix.checked;

      if (bundleCode) bundleCode.textContent = "// 编译中…（SWC 正在替换 process.env）";
      await sleep(520);

      if (prefixed) {
        if (bundleCode) {
          bundleCode.textContent =
            '// 浏览器 bundle 里实际是字符串字面量\n' +
            'const API_BASE_URL = "' + val + '";\n\n' +
            '// fetch(API_BASE_URL + "/hello")  → "' + val + '/hello"';
        }
        if (browserOut) {
          browserOut.textContent = val;
          browserOut.classList.remove("undef");
        }
      } else {
        if (bundleCode) {
          bundleCode.textContent =
            '// 没有 NEXT_PUBLIC_ 前缀 → 构建时不会被注入\n' +
            "const API_BASE_URL = undefined;\n\n" +
            "// fetch(API_BASE_URL + \"/hello\") → \"undefined/hello\"";
        }
        if (browserOut) {
          browserOut.textContent = "undefined";
          browserOut.classList.add("undef");
        }
      }

      await sleep(200);
      inlineBuild.disabled = false;
      building = false;
    });
  }

  /* ------------------------------------------------------------
     11. 事故重演
     ------------------------------------------------------------ */
  const incidentPlay = $("#incidentPlay");
  const incidentSteps = $$("#incidentSteps .inc-step");
  const incidentError = $("#incidentError");
  let incidentBusy = false;

  async function playIncident() {
    if (incidentBusy || !incidentSteps.length) return;
    incidentBusy = true;
    incidentPlay.disabled = true;
    incidentSteps.forEach((s) => s.classList.remove("on"));
    if (incidentError) incidentError.classList.remove("show");
    await sleep(250);
    for (const step of incidentSteps) {
      step.classList.add("on");
      await sleep(520);
    }
    if (incidentError) incidentError.classList.add("show");
    incidentPlay.disabled = false;
    incidentBusy = false;
  }
  if (incidentPlay) incidentPlay.addEventListener("click", playIncident);

  /* ------------------------------------------------------------
     12. 启动流程播放
     ------------------------------------------------------------ */
  const startPlay = $("#startPlay");
  const startLog = $("#startLog");
  const startState = $("#startState");
  const startSteps = $$("#startSteps .seq-step");
  const portApi = $("#portApi");
  const portWeb = $("#portWeb");
  let startBusy = false;

  function sLine(text, cls) {
    if (!startLog) return;
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "");
    div.textContent = text;
    startLog.appendChild(div);
    startLog.scrollTop = startLog.scrollHeight;
  }

  async function playStartup() {
    if (startBusy) return;
    startBusy = true;
    startPlay.disabled = true;
    if (startLog) startLog.innerHTML = "";
    startSteps.forEach((s) => s.classList.remove("on", "done"));
    if (portApi) portApi.classList.remove("live");
    if (portWeb) portWeb.classList.remove("live");
    if (startState) startState.textContent = "启动中…";

    const seq = [
      { stage: 0, line: "$ bun run clean:ports", cls: "cmd" },
      { stage: 0, line: "▸ 释放 3002 / 4001，端口已清空", cls: "dim" },
      { stage: 1, line: "$ turbo run dev --parallel --filter=@autix/chat --filter=@autix/chat-web", cls: "cmd" },
      { stage: 2, line: "@autix/chat: $ bun node_modules/.bin/nest start --watch" },
      { stage: 2, line: "  → tsc watch 编译 src → dist/ …", cls: "dim" },
      { stage: 2, line: "  → node dist/main.js 监听 :4001", cls: "ok", port: "api" },
      { stage: 3, line: "@autix/chat-web: $ wait-on tcp:4001 && next dev --port 3002" },
      { stage: 3, line: "  → 等待 4001 就绪 … 已就绪", cls: "dim" },
      { stage: 4, line: "  → Next dev server 启动 :3002", cls: "ok", port: "web" },
      { stage: 4, line: "✔ Chat service running on http://localhost:4001", cls: "ok" },
      { stage: 4, line: "✔ Ready in 1.2s — 打开 http://localhost:3002", cls: "ok" },
    ];

    let lastStage = -1;
    for (const item of seq) {
      if (item.stage !== lastStage) {
        startSteps.forEach((el, i) => {
          el.classList.toggle("done", i < item.stage);
          el.classList.toggle("on", i === item.stage);
        });
        lastStage = item.stage;
      }
      sLine(item.line, item.cls);
      if (item.port === "api" && portApi) portApi.classList.add("live");
      if (item.port === "web" && portWeb) portWeb.classList.add("live");
      await sleep(item.port ? 620 : 460);
    }

    startSteps.forEach((el) => el.classList.add("done"));
    startSteps.forEach((el) => el.classList.remove("on"));
    if (startState) startState.textContent = "已就绪 · 两个端口都在线";
    startPlay.disabled = false;
    startBusy = false;
  }
  if (startPlay) startPlay.addEventListener("click", playStartup);

  /* ------------------------------------------------------------
     13. 请求链路演示
     ------------------------------------------------------------ */
  const callApiBtn = $("#callApiBtn");
  const flow = $("#flow");
  const packet = $("#packet");
  const flowResult = $("#flowResult");
  const flowTitle = $("#flowTitle");
  const netlogRows = $$("#netlog .row");
  const srvSteps = ["#srvRoute", "#srvService", "#srvContract"].map((s) => $(s));
  const corsToggle = $("#corsToggle");
  const corsLabel = $("#corsLabel");
  const reqState = $("#reqState");
  let requestBusy = false;

  if (corsToggle && corsLabel) {
    corsToggle.addEventListener("change", () => {
      corsLabel.textContent = corsToggle.checked
        ? "Nest 已开启 CORS（允许 3002）"
        : "Nest 未开启 CORS（浏览器会拦截）";
    });
  }

  function resetNetlog() {
    netlogRows.forEach((row) => {
      row.classList.remove("on", "ok", "err");
    });
    srvSteps.forEach((el) => {
      if (el) el.classList.remove("on");
    });
    if (flowResult) {
      flowResult.classList.remove("err", "ok");
      flowResult.textContent = "请求中…";
    }
  }

  async function flyPacket(label, dir, cls) {
    if (!flow || !packet) return;
    const browser = $("#flowBrowser");
    const server = $("#flowServer");
    if (!browser || !server) return;

    const fr = flow.getBoundingClientRect();
    const br = browser.getBoundingClientRect();
    const sr = server.getBoundingClientRect();

    packet.className = "packet" + (cls ? " " + cls : "");
    packet.textContent = label;
    packet.style.opacity = "0";
    packet.style.transition = "none";

    const pw = packet.offsetWidth || 90;
    const y = (br.top + br.height / 2 + sr.top + sr.height / 2) / 2 - fr.top - 14;
    const sendStart = br.right - fr.left;
    const sendEnd = sr.left - fr.left - pw - 8;
    const recvStart = sr.left - fr.left - pw - 8;
    const recvEnd = br.right - fr.left - pw - 10;

    const startX = dir === "send" ? sendStart : recvStart;
    const endX = dir === "send" ? sendEnd : recvEnd;

    packet.style.transform = "translate(" + startX + "px, " + y + "px)";
    await sleep(30);
    packet.style.opacity = "1";
    packet.style.transition = "transform .78s cubic-bezier(.45,.05,.25,1), opacity .35s";
    packet.style.transform = "translate(" + endX + "px, " + y + "px)";
    await sleep(820);
    packet.style.opacity = "0";
  }

  async function callApi() {
    if (requestBusy) return;
    requestBusy = true;
    if (callApiBtn) callApiBtn.disabled = true;
    resetNetlog();
    if (reqState) reqState.textContent = "请求发送中…";

    const corsOn = !corsToggle || corsToggle.checked;
    const appName = ($("#appNameInput") && $("#appNameInput").value.trim()) || "llm";
    const contractLine = srvSteps[2];
    if (contractLine) contractLine.textContent = 'APP_NAME = "' + appName + '"';

    // ① fetch
    netlogRows[0] && netlogRows[0].classList.add("on");
    await sleep(380);

    // ② Origin + 请求包飞向服务端
    if (netlogRows[1]) netlogRows[1].classList.add("on");
    await flyPacket("GET /hello", "send");
    await sleep(120);

    // ③ 路由 + controller
    if (netlogRows[2]) netlogRows[2].classList.add("on");
    if (srvSteps[0]) srvSteps[0].classList.add("on");
    await sleep(420);

    // ④ service + contracts
    if (netlogRows[3]) netlogRows[3].classList.add("on");
    if (srvSteps[1]) srvSteps[1].classList.add("on");
    if (srvSteps[2]) srvSteps[2].classList.add("on");
    await sleep(420);

    if (corsOn) {
      // ⑤ 响应 + CORS 头
      if (netlogRows[4]) {
        netlogRows[4].classList.add("on", "ok");
        netlogRows[4].querySelector(".txt").textContent =
          "返回 200 + Access-Control-Allow-Origin: http://localhost:3002";
      }
      await flyPacket("200 JSON", "recv", "resp");
      await sleep(120);
      if (netlogRows[5]) netlogRows[5].classList.add("on", "ok");
      if (flowResult) {
        flowResult.textContent = JSON.stringify(
          { message: "Hello from Chat, shared APP_NAME=" + appName },
          null,
          2
        );
        flowResult.classList.add("ok");
      }
      if (flowTitle) flowTitle.textContent = appName;
      if (reqState) reqState.textContent = "✔ 完成 · 页面已重渲染";
    } else {
      // CORS 拦截：响应其实到了浏览器，但被浏览器丢弃
      if (netlogRows[4]) {
        netlogRows[4].classList.add("on", "err");
        netlogRows[4].querySelector(".txt").textContent =
          "❌ 响应缺少 Access-Control-Allow-Origin → 浏览器拦截";
      }
      await flyPacket("CORS ✕", "recv", "err");
      await sleep(120);
      if (netlogRows[5]) {
        netlogRows[5].classList.add("on", "err");
        netlogRows[5].querySelector(".txt").textContent =
          "fetch 抛 TypeError: Failed to fetch → 拿到的是空结果";
      }
      if (flowResult) {
        flowResult.textContent = "CORS error：跨域被浏览器拦截\n（Nest 服务端其实已经返回 200）";
        flowResult.classList.add("err");
      }
      if (reqState) reqState.textContent = "✕ CORS 拦截";
    }

    await sleep(250);
    if (callApiBtn) callApiBtn.disabled = false;
    requestBusy = false;
  }

  if (callApiBtn) callApiBtn.addEventListener("click", callApi);

  /* ------------------------------------------------------------
     14. 踩坑筛选
     ------------------------------------------------------------ */
  const pitFilters = $("#pitFilters");
  const pitList = $("#pitList");
  const pitCount = $("#pitCount");
  if (pitFilters && pitList) {
    pitFilters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip[data-filter]");
      if (!chip) return;
      $$(".chip", pitFilters).forEach((c) => c.classList.toggle("active", c === chip));
      const filter = chip.dataset.filter;
      let visible = 0;
      $$(".pit", pitList).forEach((pit) => {
        const show = filter === "all" || pit.dataset.cat === filter;
        pit.classList.toggle("hide", !show);
        if (show) visible += 1;
      });
      if (pitCount) pitCount.textContent = visible + " 条";
    });
  }

  /* ------------------------------------------------------------
     15. 自检进度
     ------------------------------------------------------------ */
  const quizDetails = $$("details.q");
  const quizFill = $("#quizFill");
  const quizCount = $("#quizCount");
  const quizReset = $("#quizReset");

  function updateQuiz() {
    const total = quizDetails.length;
    const open = quizDetails.filter((d) => d.open).length;
    if (quizFill) quizFill.style.width = (total ? (open / total) * 100 : 0) + "%";
    if (quizCount) {
      quizCount.textContent =
        open + " / " + total + " 已展开" + (open === total && total > 0 ? " · 全部通关 🎉" : "");
    }
  }

  quizDetails.forEach((d) => d.addEventListener("toggle", updateQuiz));
  if (quizReset) {
    quizReset.addEventListener("click", () => {
      quizDetails.forEach((d) => {
        d.open = false;
      });
      updateQuiz();
    });
  }
  updateQuiz();
})();
