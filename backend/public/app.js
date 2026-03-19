
const DATA = window.DATA;

const API_BASE = "";

  const state = {
  activeTab: "dashboard",
  theme: "light",
  jobTagFilters: [],
  jobSalaryMin: "",
  jobSalaryMax: "",
  jobTimeFilter: "All",
  jobTagFiltersDraft: [],
  jobSalaryMinDraft: "",
  jobSalaryMaxDraft: "",
  jobTimeFilterDraft: "All",
  selectedJobId: null,
  selectedNewsId: null,
  selectedJobApplicationsId: null,
  showInterviewJobId: null,
  jobDetailBackTo: null,
  gravityActive: false,
  exploded: [],
  authMode: "login",
  currentUser: null,
  currentUserId: null,
  currentRole: null,
  profileDraft: null,
  companyJobTags: [],
  editingJobId: null,
  editingNewsId: null,
  authError: "",
  authSuccess: "",
  resumeModalOpen: false,
  resumePreviewUser: null,
  resumePreviewJobId: null,
  resumeMeta: { hasFile: false, ext: null },
  tags: [],
  userTags: [],
  floatingTags: [],
  floatingTagsKey: "",
  jobs: [],
  news: [],
  jobDetail: null,
  newsDetail: null,
  applications: [],
  companyJobs: [],
  jobApplications: [],
  resume: null,
  viewUserProfile: null,
  viewUserTags: [],
  viewFloatingTags: [],
  viewFloatingTagsKey: "",
  profileDrawerOpen: false,
  loading: {}
};

const STORAGE_KEYS = {
  profilePrefix: "site_profile_v1_"
};

const app = document.getElementById("app");
const overlayRoot = document.getElementById("overlay-root");

const transition = (fn) => document.startViewTransition(fn);
const zh = (value) => value.zh;

const validTabs = new Set([
  "dashboard",
  "portfolio",
  "articles",
  "contact",
  "auth",
  "profile",
  "job-detail",
  "news-detail",
  "applications",
  "company-jobs",
  "job-applications",
  "admin-manage",
  "admin-users",
  "admin-jobs",
  "admin-news",
  "company-post",
  "user-view",
  "admin-post"
]);

const timeOptions = [
  { id: "All", label: "时间不限", days: null },
  { id: "7d", label: "7 天内", days: 7 },
  { id: "30d", label: "30 天内", days: 30 },
  { id: "90d", label: "90 天内", days: 90 }
];

const roleLabels = {
  user: "普通用户",
  company: "企业用户",
  admin: "管理员"
};

function flagToRole(flag) {
  const num = Number(flag);
  if (num === 1) return "company";
  if (num === 2) return "admin";
  return "user";
}

function roleToFlag(role) {
  if (role === "company") return 1;
  if (role === "admin") return 2;
  return 0;
}

function initThemeByTime() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  state.theme = mins >= 18 * 60 + 30 || mins < 6 * 60 ? "dark" : "light";
  applyTheme();
}

function applyTheme() {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatSalary(job) {
  if (!job) return "";
  return `${job.salaryMin}-${job.salaryMax}${job.salaryUnit || "k/月"}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.replaceAll("-", ".");
}

function parseNewsContent(raw = "") {
  const text = String(raw || "");
  try {
    const data = JSON.parse(text);
    if (data && typeof data === "object") {
      return {
        body: String(data.body || ""),
        image: String(data.image || "")
      };
    }
  } catch {}
  return { body: text, image: "" };
}

function defaultProfile(username) {
  return {
    name: username || "",
    purposeRole: "",
    tag: "",
    introduce: "",
    contact: "",
    address: ""
  };
}

function getProfile(username) {
  if (!username) return null;
  const key = `${STORAGE_KEYS.profilePrefix}${username}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultProfile(username);
    return { ...defaultProfile(username), ...JSON.parse(raw) };
  } catch {
    return defaultProfile(username);
  }
}

function saveProfile(username, profile) {
  if (!username) return;
  const key = `${STORAGE_KEYS.profilePrefix}${username}`;
  localStorage.setItem(key, JSON.stringify(profile));
}

async function loadProfileInfo() {
  if (!state.currentUserId) return;
  try {
    const res = await apiGet("/api/profile");
    const data = res.data || {};
    const base = defaultProfile(state.currentUser);
    state.profileDraft = {
      ...base,
      name: state.currentUser,
      purposeRole: data.purpose_role ?? base.purposeRole,
      introduce: data.introduce ?? base.introduce,
      address: data.address ?? base.address,
      contact: data.contact ?? base.contact
    };
    saveProfile(state.currentUser, state.profileDraft);
  } catch {
    if (!state.profileDraft) state.profileDraft = getProfile(state.currentUser);
  }
}

function getAvatarText() {
  if (!state.currentUser) return "未";
  return state.currentUser.slice(0, 1).toUpperCase();
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  const isForm = options.body instanceof FormData;
  const finalOptions = {
    credentials: "include",
    ...options,
    headers: isForm ? headers : { "Content-Type": "application/json", ...headers }
  };
  const response = await fetch(`${API_BASE}${path}`, finalOptions);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    return data;
  }
  return response.text();
}

async function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

async function apiPost(path, body) {
  return apiRequest(path, { method: "POST", body: JSON.stringify(body) });
}

async function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}

async function apiPut(path, body) {
  return apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
}

function normalizeJob(job) {
  const created = job.created_at ? job.created_at.slice(0, 10) : "";
  const rawTags = Array.isArray(job.tags) ? job.tags : [];
  const tagNames = rawTags
    .map((tag) => (typeof tag === "string" ? tag : tag?.name))
    .filter(Boolean);
  const tagIds = rawTags
    .map((tag) => (typeof tag === "string" ? null : tag?.id))
    .filter((id) => id !== null && id !== undefined)
    .map((id) => Number(id));
  return {
    id: job.id,
    title: job.title,
    company: job.company || job.company_name || "",
    location: job.location || job.content?.location || "",
    salaryMin: job.salary_min ?? 0,
    salaryMax: job.salary_max ?? 0,
    salaryUnit: "k/月",
    tags: tagNames,
    tagIds,
    publishDate: created,
    summary: job.summary || job.content?.summary || job.content || "",
    responsibilities: job.responsibilities || job.content?.responsibilities || [],
    requirements: job.requirements || job.content?.requirements || [],
    benefits: job.benefits || job.content?.benefits || [],
    interview: job.interview || null
  };
}

function normalizeNews(item) {
  const raw = String(item.content || "");
  const parsed = parseNewsContent(raw);
  return {
    id: item.id,
    title: item.title,
    category: item.kernel || "新闻",
    kernel: item.kernel || "",
    coverImage: parsed.image || "",
    date: item.created_at ? item.created_at.slice(0, 10) : "",
    summary: parsed.body || "",
    contentRaw: raw,
    content: parsed.body ? String(parsed.body).split("\n") : [],
    source: item.author || "",
    author: item.author || ""
  };
}

async function loadSession() {
  try {
    const res = await apiGet("/api/auth/me");
    if (res && res.data) {
      state.currentUser = res.data.username;
      state.currentUserId = res.data.id || null;
      state.currentRole = flagToRole(res.data.flag);
      state.profileDraft = getProfile(state.currentUser);
      await loadProfileInfo();
    }
  } catch {
    state.currentUser = null;
    state.currentUserId = null;
    state.currentRole = null;
  }
}

async function syncRoleData() {
  state.resume = null;
  state.applications = [];
  state.companyJobs = [];
  state.jobApplications = [];
  state.userTags = [];
  state.floatingTags = [];
  state.floatingTagsKey = "";
  if (state.currentRole === "user") {
    await loadResume();
    await loadApplications();
    await loadUserTags();
  } else if (state.currentRole === "company") {
    await loadCompanyJobs();
  }
}

async function loadTags() {
  const res = await apiGet("/api/tags");
  state.tags = res.data || [];
}

function buildFloatingTags() {
  const tags = state.userTags || [];
  const key = tags.map((t) => String(t.id)).sort().join(",");
  if (state.floatingTagsKey === key) return;
  state.floatingTagsKey = key;
  const placed = [];
  const width = window.innerWidth || 1200;
  const height = window.innerHeight || 800;
  state.floatingTags = tags.map((tag) => {
    const size = Math.floor(140 + Math.random() * 140);
    const radius = size / 2;
    let x = 0;
    let y = 0;
    let tries = 0;
    while (tries < 40) {
      x = Math.floor(6 + Math.random() * 88);
      y = Math.floor(6 + Math.random() * 88);
      tries += 1;
      if (x > 35 && x < 65 && y > 30 && y < 70) continue;
      const cx = (x / 100) * width;
      const cy = (y / 100) * height;
      const overlaps = placed.some((p) => {
        const dx = cx - p.cx;
        const dy = cy - p.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < radius + p.radius + 8;
      });
      if (!overlaps) {
        placed.push({ cx, cy, radius });
        break;
      }
    }
    const float = (Math.random() * 6 + 6).toFixed(2);
    const delay = (Math.random() * 2).toFixed(2);
    const rot = Math.floor(Math.random() * 360);
    const shadowAngle = Math.random() * Math.PI * 2;
    const shadowDist = 12 + Math.random() * 12;
    const shadowX = Math.round(Math.cos(shadowAngle) * shadowDist);
    const shadowY = Math.round(Math.sin(shadowAngle) * shadowDist);
    return {
      id: tag.id,
      name: tag.name,
      size,
      x,
      y,
      float,
      delay,
      rot,
      shadowX,
      shadowY
    };
  });
}

function buildViewFloatingTags() {
  const tags = state.viewUserTags || [];
  const key = tags.map((t) => String(t.id)).sort().join(",");
  if (state.viewFloatingTagsKey === key) return;
  state.viewFloatingTagsKey = key;
  const placed = [];
  const width = window.innerWidth || 1200;
  const height = window.innerHeight || 800;
  state.viewFloatingTags = tags.map((tag) => {
    const size = Math.floor(140 + Math.random() * 180);
    const radius = size / 2;
    let x = 10;
    let y = 10;
    let attempts = 0;
    while (attempts < 60) {
      x = Math.random() * 90;
      y = Math.random() * 90;
      const px = (x / 100) * width;
      const py = (y / 100) * height;
      const tooClose = placed.some((p) => Math.hypot(p.px - px, p.py - py) < p.r + radius + 60);
      if (!tooClose) {
        placed.push({ px, py, r: radius });
        break;
      }
      attempts += 1;
    }
    const float = (Math.random() * 6 + 6).toFixed(2);
    const delay = (Math.random() * -4).toFixed(2);
    const rot = Math.floor(Math.random() * 360);
    const shadowAngle = Math.random() * Math.PI * 2;
    const shadowDist = 10 + Math.random() * 6;
    const shadowX = Math.round(Math.cos(shadowAngle) * shadowDist);
    const shadowY = Math.round(Math.sin(shadowAngle) * shadowDist);
    return {
      id: tag.id,
      name: tag.name,
      size,
      x,
      y,
      float,
      delay,
      rot,
      shadowX,
      shadowY
    };
  });
}

async function loadUserTags() {
  if (!state.currentUserId) {
    state.userTags = [];
    buildFloatingTags();
    return;
  }
  try {
    const res = await apiGet("/api/user/tags");
    state.userTags = res.data || [];
  } catch {
    state.userTags = [];
  }
  buildFloatingTags();
}

async function loadUserProfileView(userId) {
  try {
    const res = await apiGet(`/api/profile/view?user_id=${userId}`);
    state.viewUserProfile = res.data || null;
    state.viewUserTags = res.data?.tags || [];
    buildViewFloatingTags();
  } catch {
    state.viewUserProfile = null;
    state.viewUserTags = [];
    state.viewFloatingTags = [];
    state.viewFloatingTagsKey = "";
    alert("读取用户信息失败");
  }
}

async function saveUserTags() {
  if (!state.currentUserId) return;
  const ids = (state.userTags || []).map((t) => t.id);
  await apiPut("/api/user/tags", { tag_ids: ids });
}

async function loadJobs() {
  const tagIds = (state.jobTagFilters || []).map((id) => Number(id)).filter(Boolean);
  const query = tagIds.length ? `?tags=${tagIds.join(",")}` : "";
  const res = await apiGet(`/api/jobs${query}`);
  const items = res.data || [];
  state.jobs = items.map(normalizeJob);
}

async function loadNews() {
  const res = await apiGet("/api/coverage");
  const items = res.data || [];
  state.news = items.map(normalizeNews);
}

async function loadResume() {
  try {
    const res = await apiGet("/api/resumes/me");
    const payload = res.data || null;
    if (payload && typeof payload === "object" && "resume" in payload) {
      state.resume = payload.resume;
      state.resumeMeta = {
        hasFile: Boolean(payload.has_file),
        ext: payload.file_ext || null
      };
    } else {
      state.resume = payload;
      state.resumeMeta = { hasFile: Boolean(payload), ext: null };
    }
  } catch {
    state.resume = null;
    state.resumeMeta = { hasFile: false, ext: null };
  }
}

async function loadApplications() {
  const res = await apiGet("/api/my/applications");
  state.applications = res.data || [];
}

async function loadCompanyJobs() {
  const res = await apiGet("/api/company/jobs");
  state.companyJobs = (res.data || []).map(normalizeJob);
}

async function loadAdminUsers() {
  const res = await apiGet("/api/users");
  state.adminUsers = res.data || [];
}

async function loadJobApplications(jobId) {
  const res = await apiGet(`/api/jobs/applications?job_id=${jobId}`);
  state.jobApplications = res.data || [];
}

async function loadJobDetail(jobId) {
  const res = await apiGet(`/api/jobs/detail?id=${jobId}`);
  state.jobDetail = res.data ? normalizeJob(res.data) : null;
}

function shell() {
  app.innerHTML = `
    <div class="app">
      <div class="top-nav-wrap"><nav class="top-nav" id="top-nav"></nav></div>
      <main class="main" id="main" style="view-transition-name: page;"></main>
      <footer class="footer" id="footer"></footer>
    </div>
    <button id="gravity-reset" type="button">Go Back</button>
  `;
}

function renderNav() {
  const navItems = zh(DATA.nav);
  const authBtn = state.currentUser
    ? `<button class="ctrl-btn" data-action="logout" title="退出">退</button>`
    : `<button class="pill" data-nav="auth">登录</button>`;
  const roleBadge = state.currentRole ? `<span class="role-badge">${escapeHtml(roleLabels[state.currentRole] || state.currentRole)}</span>` : "";

  document.getElementById("top-nav").innerHTML = `
    <h1 class="logo" data-nav="dashboard">周师求职大师</h1>
    <div class="nav-links nav-main-links">
      ${navItems
        .map((item) => `<button class="nav-btn ${state.activeTab === item.id ? "active" : ""}" data-nav="${item.id}">${escapeHtml(item.label)}</button>`)
        .join("")}
    </div>
    <div class="nav-links nav-right-links">
      ${roleBadge}
      ${authBtn}
      <button class="avatar-btn" data-nav="profile" title="个人页面">${escapeHtml(getAvatarText())}</button>
      <button class="ctrl-btn" title="Theme" data-action="toggle-theme">${state.theme === "light" ? "?" : "?"}</button>
      <button class="ctrl-btn" title="Gravity" data-action="trigger-gravity">?</button>
    </div>
  `;
}

function renderHero() {
  const content = zh(DATA.home);
  const contact = zh(DATA.contact);
  const heroLines = content.heroItems
    .map(
      (item, idx) =>
        `<h1 class="${item.category ? "hero-click" : ""}" data-hero-index="${idx}">${escapeHtml(item.text)}${item.annotation ? `<span class="annotation">${escapeHtml(item.annotation)}</span>` : ""}</h1>`
    )
    .join("");

  return `
    <section class="grid hero">
      <div class="hero-lines">
        ${heroLines}
      </div>
      <div class="hero-side">
        <h3>${contact.baseLabel}</h3>
        <p>${contact.locationValue}</p>
        <p class="location-tip">${contact.tooltip}</p>
        <h3 data-nav="articles" class="hero-click" style="color: var(--accent)">${contact.contactLabel} →</h3>
        <h3 data-nav="contact" class="hero-click" style="color: var(--accent)">${contact.contactLabel2} →</h3>
      </div>
    </section>
    <div class="section-head">
      <h2>${content.selectedWorks}</h2>
      <p class="section-sub">${content.years}</p>
    </div>
    <p class="hero-intro">${content.intro.split("|").map(escapeHtml).join("<br>")}</p>
  `;
}

function renderCooperateCards() {
  const logos = DATA.cooperate && DATA.cooperate.logo ? DATA.cooperate.logo : [];
  const cards = logos
    .map((src) => {
      const dx = (Math.random() * 10 + 6).toFixed(1);
      const dy = (Math.random() * 10 + 6).toFixed(1);
      const dur = (Math.random() * 12 + 16).toFixed(1);
      const delay = Math.random().toFixed(1);
      const drift = Math.random() > 0.5 ? 1 : -1;
      return `
        <article class="cooperate-card" style="--dx:${dx}px;--dy:${dy}px;--dur:${dur}s;--delay:${delay}s;--dir:${drift};">
          <img src="${encodeURI(src)}" alt="合作企业" loading="lazy" />
        </article>
      `;
    })
    .join("");

  return `<section class="cooperate-grid">${cards}</section>`;
}

function renderNewsList() {
  const page = zh(DATA.newsPage);
  const rows = state.news
    .map(
      (item) => `
      <article class="news-card" data-news="${item.id}">
        <div class="news-cover">
          <img src="${encodeURI(item.coverImage || "")}" alt="${escapeHtml(item.title)}" referrerpolicy="no-referrer" />
        </div>
        <div class="news-body">
          <div class="news-meta">${escapeHtml(item.category || "新闻")} · ${escapeHtml(formatDate(item.date))}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary || "")}</p>
        </div>
      </article>
    `
    )
    .join("");

  return `
    <section class="section-head">
      <h2>${escapeHtml(page.title)}</h2>
      <p class="section-sub">${escapeHtml(page.description)}</p>
    </section>
    <section class="news-list">${rows || "<p class='section-sub'>暂无新闻。</p>"}</section>
  `;
}
function matchesSalary(job) {
  const min = Number(state.jobSalaryMin);
  const max = Number(state.jobSalaryMax);
  const hasMin = Number.isFinite(min) && String(state.jobSalaryMin).trim() !== "";
  const hasMax = Number.isFinite(max) && String(state.jobSalaryMax).trim() !== "";
  if (!hasMin && !hasMax) return true;
  if (hasMin && job.salaryMax < min) return false;
  if (hasMax && job.salaryMin > max) return false;
  return true;
}

function matchesTime(job) {
  if (state.jobTimeFilter === "All") return true;
  const option = timeOptions.find((opt) => opt.id === state.jobTimeFilter);
  if (!option || !option.days) return true;
  const publish = new Date(job.publishDate);
  const diffDays = (Date.now() - publish.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= option.days;
}

function renderJobFilters() {
  const tagButtons = state.tags
    .map((tag) => {
      const active = state.jobTagFiltersDraft.includes(Number(tag.id));
      return `<button class="pill ${active ? "active" : ""}" data-action="toggle-job-tag" data-value="${escapeHtml(String(tag.id))}">${escapeHtml(tag.name)}</button>`;
    })
    .join("");

  const timeButtons = timeOptions
    .map((opt) => `<button class="pill ${state.jobTimeFilterDraft === opt.id ? "active" : ""}" data-action="job-time" data-value="${opt.id}">${escapeHtml(opt.label)}</button>`)
    .join("");

  return `
    <div class="filter-block">
      <div class="filter-title">标签</div>
      <div class="filter-row">
        ${tagButtons}
        <button class="pill" data-action="clear-job-tags">清空标签</button>
      </div>
    </div>
    <div class="filter-block">
      <div class="filter-title">薪资</div>
      <div class="filter-range">
        <input type="number" min="0" placeholder="最低薪资" data-action="job-salary-min" value="${escapeHtml(String(state.jobSalaryMinDraft || ""))}" />
        <span class="filter-split">—</span>
        <input type="number" min="0" placeholder="最高薪资" data-action="job-salary-max" value="${escapeHtml(String(state.jobSalaryMaxDraft || ""))}" />
      </div>
    </div>
    <div class="filter-block">
      <div class="filter-title">发布时间</div>
      <div class="filter-row">${timeButtons}</div>
    </div>
    <div class="filter-row">
      <button class="pill active" data-action="apply-job-filters">应用所有筛选</button>
    </div>
  `;
}

function renderJobsList() {
  const page = zh(DATA.jobsPage);
  const jobs = state.jobs
    .filter((job) => {
      if (state.jobTagFilters.length) {
        const hasTag = (job.tagIds || []).some((tagId) => state.jobTagFilters.includes(Number(tagId)));
        if (!hasTag) return false;
      }
      if (!matchesSalary(job)) return false;
      if (!matchesTime(job)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  const cards = jobs
    .map(
      (job) => `
      <article class="job-card" data-job="${job.id}">
        <div class="job-head">
          <div>
            <h3>${escapeHtml(job.title)}</h3>
            <p class="job-company">${escapeHtml(job.company)} · ${escapeHtml(job.location || "")}</p>
          </div>
          <div class="job-salary">${escapeHtml(formatSalary(job))}</div>
        </div>
        <p class="job-summary">${escapeHtml(job.summary || "")}</p>
        <div class="job-tags">${(job.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="job-meta">发布于 ${escapeHtml(formatDate(job.publishDate))}</div>
      </article>
    `
    )
    .join("");

  return `
    <section class="section-head">
      <h2>${escapeHtml(page.title)}</h2>
      <p class="section-sub">${escapeHtml(page.description)}</p>
    </section>
    ${renderJobFilters()}
    <section class="job-list">${cards || "<p class='section-sub'>暂无符合条件的岗位。</p>"}</section>
  `;
}

function renderJobDetail() {
  const job = state.jobDetail || state.jobs.find((item) => item.id === state.selectedJobId);
  if (!job) {
    return `<section class="empty-state"><p class="section-sub">未找到该职位。</p><button class="pill" data-action="back-jobs">返回招聘广场</button></section>`;
  }
  const canApply = state.currentUser && state.currentRole === "user";
  const applied = state.applications.some((app) => Number(app.job_id) === Number(job.id));
  const applyText = applied ? "已投递" : "投递简历";
  const showInterview = state.currentRole === "company" || state.currentRole === "admin" || state.showInterviewJobId === job.id;

  return `
    <section class="detail-page">
      ${state.jobDetailBackTo === "applications" ? `<button class="back-circle" data-action="back-applications" aria-label="返回">＜</button>` : ""}
      <button class="pill" data-action="back-jobs">← 返回招聘广场</button>
      <div class="detail-hero">
        <div>
          <h2>${escapeHtml(job.title)}</h2>
          <p class="section-sub">${escapeHtml(job.company)} · ${escapeHtml(job.location || "")}</p>
          <div class="job-tags">${(job.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
        <div class="detail-salary">${escapeHtml(formatSalary(job))}</div>
      </div>
      <div class="detail-grid">
        <div class="detail-section">
          <h3>岗位描述</h3>
          <p>${escapeHtml(job.summary || "")}</p>
          <h4>工作职责</h4>
          <ul class="detail-list">${(job.responsibilities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <h4>岗位要求</h4>
          <ul class="detail-list">${(job.requirements || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <h4>福利亮点</h4>
          <div class="detail-tags">${(job.benefits || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        </div>
        <div class="detail-aside">
          ${showInterview ? `
            <div class="detail-card">
              <h4>面试信息</h4>
              <p><strong>地点：</strong>${escapeHtml(job.interview?.interview_where || "待定")}</p>
              <p><strong>时间：</strong>${escapeHtml(job.interview?.interview_when || "待定")}</p>
              <p><strong>备注：</strong>${escapeHtml(job.interview?.interview_remark || "待定")}</p>
              <p class="section-sub">发布于 ${escapeHtml(formatDate(job.publishDate))}</p>
            </div>
          ` : `
            <div class="detail-card">
              <h4>面试信息</h4>
              <p class="section-sub">投递通过后可查看面试信息</p>
              <p class="section-sub">发布于 ${escapeHtml(formatDate(job.publishDate))}</p>
            </div>
          `}
          <div class="detail-card">
            <h4>投递简历</h4>
            ${!state.currentUser ? `<p class="section-sub">请先登录后再投递。</p>` : ""}
            ${state.currentUser && state.currentRole !== "user" ? `<p class="section-sub">当前账号类型无法投递简历。</p>` : ""}
            ${state.currentUser && state.currentRole === "user" && !state.resume ? `<p class="section-sub">请先在个人页面上传简历。</p>` : ""}
            <button class="pill active" data-action="apply-job" data-job="${job.id}" ${!canApply || !state.resume || applied ? "disabled" : ""}>${applyText}</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderNewsDetail() {
  const news = state.newsDetail || state.news.find((item) => Number(item.id) === Number(state.selectedNewsId));
  if (!news) {
    return `<section class="empty-state"><p class="section-sub">未找到该新闻。</p><button class="pill" data-action="back-news">返回新闻</button></section>`;
  }

  return `
    <section class="detail-page">
      <button class="pill" data-action="back-news">← 返回新闻</button>
      <div class="news-detail-hero">
        <div>
          <h2>${escapeHtml(news.title)}</h2>
          <p class="section-sub">${escapeHtml(news.category || "新闻")} · ${escapeHtml(formatDate(news.date))}</p>
        </div>
      </div>
      ${news.coverImage ? `<div class="news-detail-cover"><img src="${encodeURI(news.coverImage)}" alt="${escapeHtml(news.title)}" referrerpolicy="no-referrer" /></div>` : ""}
      <div class="detail-section">
        ${(news.content || []).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        ${news.source ? `<p class="section-sub">来源：${escapeHtml(news.source)}</p>` : ""}
      </div>
    </section>
  `;
}

function renderProfile() {
  if (!state.currentUser) {
    return `
      <section class="auth-wrap">
        <div class="auth-card">
          <h2 class="auth-title">请先登录</h2>
          <p class="section-sub">登录后可编辑你的个人工牌信息</p>
          <button class="pill active auth-submit" data-nav="auth">前往登录</button>
        </div>
      </section>
    `;
  }

  if (!state.profileDraft) state.profileDraft = getProfile(state.currentUser);
  const p = state.profileDraft;

  const roleActions = [];
  if (state.currentRole === "user") {
  }
  if (state.currentRole === "company") {
    roleActions.push(`<button class="pill" data-nav="company-jobs">我发布的职位</button>`);
    roleActions.push(`<button class="pill" data-nav="company-post">发布职位</button>`);
  }
  if (state.currentRole === "admin") {
    roleActions.push(`<button class="pill" data-nav="admin-manage">管理后台</button>`);
    roleActions.push(`<button class="pill" data-nav="admin-post">发布新闻</button>`);
  }

  const showBadge = state.currentRole === "user";
  const showAdmin = state.currentRole === "admin";
  const showResumeView = Boolean(state.resumeMeta && state.resumeMeta.hasFile && state.resume);
  const tagText = (state.userTags || []).map((t) => t.name).join(" / ");
  buildFloatingTags();

  return `
    <section class="profile-wrap ${showBadge ? "profile-user" : ""}">
      ${showBadge ? `
        <button class="drawer-toggle ${state.profileDrawerOpen ? "open" : ""}" data-action="toggle-profile-drawer" aria-label="编辑工牌">
          <span class="drawer-triangle"></span>
          <span class="drawer-ghost"></span>
        </button>
        <aside class="profile-drawer ${state.profileDrawerOpen ? "open" : ""}">
          <div class="drawer-head">
            <h2>个人工牌信息</h2>
            <p class="section-sub">编辑内容会实时更新右侧预览</p>
          </div>
          <div class="profile-grid">
            <label>昵称<input data-profile-field="name" value="${escapeHtml(p.name)}" /></label>
            <label>意向职位<input data-profile-field="purposeRole" value="${escapeHtml(p.purposeRole)}" /></label>
            <label>介绍自己<input data-profile-field="introduce" value="${escapeHtml(p.introduce)}" /></label>
            <label>联系方式<textarea data-profile-field="contact" rows="3">${escapeHtml(p.contact)}</textarea></label>
            <label>我的地址<textarea data-profile-field="address" rows="3">${escapeHtml(p.address)}</textarea></label>
          </div>
          <div class="tag-selector">
            <div class="tag-selector-head">
              <span>选择标签（最多 6 个）</span>
              <em>${state.userTags.length}/6</em>
            </div>
            <div class="tag-selector-grid">
              ${(state.tags || []).map((tag) => {
                const active = state.userTags.some((t) => Number(t.id) === Number(tag.id));
                const disabled = !active && state.userTags.length >= 6;
                return `<button class="tag-chip ${active ? "active" : ""} ${disabled ? "disabled" : ""}" data-action="toggle-user-tag" data-tag="${tag.id}">${escapeHtml(tag.name)}</button>`;
              }).join("")}
            </div>
          </div>
          <button class="pill active auth-submit" data-action="save-profile">保存工牌信息</button>
          ${roleActions.length ? `<div class="profile-actions">${roleActions.join("")}</div>` : ""}
          <div class="resume-actions">
            <div class="resume-card">
              <h3>上传简历</h3>
              <p class="section-sub">支持 PDF / DOC / DOCX</p>
              <button class="pill active" data-action="open-resume-upload">上传/更新</button>
              <button class="pill" data-action="remove-resume" ${state.resume ? "" : "disabled"}>删除简历</button>
            </div>
            ${showResumeView ? `
              <div class="resume-card">
                <h3>在线查看简历</h3>
                <p class="section-sub">已上传：ID ${escapeHtml(String(state.resume ? state.resume.id : "-"))}</p>
                <div class="resume-actions-row">
                  <button class="pill" data-action="open-resume-view">查看简历</button>
                </div>
              </div>
            ` : ""}
          </div>
        </aside>
        <div class="badge-scene">
          <div class="floating-tags">
            ${(state.floatingTags || []).map((item) => `
              <div class="float-tag" style="--size:${item.size}px; --x:${item.x}%; --y:${item.y}%; --float:${item.float}s; --delay:${item.delay}s; --rot:${item.rot}deg; --sx:${item.shadowX}px; --sy:${item.shadowY}px;">
                <span>${escapeHtml(item.name)}</span>
              </div>
            `).join("")}
        </div>
        <div class="badge-rig" data-action="wiggle-badge">
            <div class="lanyard">
              <div class="lanyard-strap">
                <div class="lanyard-text">INTERNET DEVELOPMENT STUDIO // ACCESS GRANTED // 2026</div>
                <div class="lanyard-stitch left"></div>
                <div class="lanyard-stitch right"></div>
              </div>
              <div class="lanyard-clasp">
                <div class="lanyard-metal"></div>
                <div class="lanyard-hook"></div>
              </div>
            </div>
            <div class="badge-card" id="badge-preview-card">
              <div class="badge-top">
                <span class="badge-kicker">周师求职大师</span>
                <span class="badge-id">@${escapeHtml(state.currentUser)}</span>
              </div>
              <div class="badge-name" id="preview-name">${escapeHtml(p.name)}</div>
              <div class="badge-purposeRole" id="preview-purposeRole">${escapeHtml(p.purposeRole)}</div>
              <div class="badge-line"></div>
              <div class="badge-meta"><span>标签</span><strong id="preview-tag">${escapeHtml(tagText || "未选择")}</strong></div>
              <div class="badge-meta"><span>关于我</span><strong id="preview-introduce">${escapeHtml(p.introduce)}</strong></div>
              <div class="badge-text"><span>联系方式</span><pre id="preview-contact">${escapeHtml(p.contact)}</pre></div>
              <div class="badge-text"><span>地址</span><pre id="preview-address">${escapeHtml(p.address)}</pre></div>
              <div class="badge-foot">ID · ${escapeHtml(state.currentUser)}</div>
            </div>
          </div>
        </div>
        <button class="profile-float-btn" data-nav="applications">我的投递</button>
      ` : `
        <div class="profile-editor">
          ${showAdmin ? `
            <h2>管理员账户</h2>
            <p class="section-sub">管理用户、职位与新闻内容。</p>
          ` : `
            <h2>企业账户</h2>
            <p class="section-sub">企业用户无需工牌信息，可通过下方入口管理职位。</p>
          `}
          ${roleActions.length ? `<div class="profile-actions">${roleActions.join("")}</div>` : ""}
        </div>
      `}
    </section>
  `;
}

function renderUserProfileView() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后查看用户主页。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "company" && state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法查看用户主页。</p></section>`;
  }

  const payload = state.viewUserProfile || {};
  const user = payload.user || {};
  const profile = payload.profile || {};
  buildViewFloatingTags();

  return `
    <section class="profile-wrap profile-user profile-readonly">
      <div class="badge-scene">
        <div class="floating-tags">
          ${(state.viewFloatingTags || []).map((item) => `
            <div class="float-tag" style="--size:${item.size}px; --x:${item.x}%; --y:${item.y}%; --float:${item.float}s; --delay:${item.delay}s; --rot:${item.rot}deg; --sx:${item.shadowX}px; --sy:${item.shadowY}px;">
              <span>${escapeHtml(item.name)}</span>
            </div>
          `).join("")}
        </div>
        <div class="badge-rig">
          <div class="lanyard">
            <div class="lanyard-strap">
              <div class="lanyard-text">INTERNET DEVELOPMENT STUDIO // ACCESS GRANTED // 2026</div>
              <div class="lanyard-stitch left"></div>
              <div class="lanyard-stitch right"></div>
            </div>
            <div class="lanyard-clasp">
              <div class="lanyard-metal"></div>
              <div class="lanyard-hook"></div>
            </div>
          </div>
          <div class="badge-card">
            <div class="badge-top">
              <span class="badge-kicker">周师求职大师</span>
              <span class="badge-id">@${escapeHtml(user.username || "")}</span>
            </div>
            <div class="badge-name">${escapeHtml(user.username || "")}</div>
            <div class="badge-purposeRole">${escapeHtml(profile.purpose_role || "")}</div>
            <div class="badge-line"></div>
            <div class="badge-meta"><span>标签</span><strong>${escapeHtml((state.viewUserTags || []).map((t) => t.name).join(" / ") || "未选择")}</strong></div>
            <div class="badge-meta"><span>关于我</span><strong>${escapeHtml(profile.introduce || "")}</strong></div>
            <div class="badge-text"><span>联系方式</span><pre>${escapeHtml(profile.contact || "")}</pre></div>
            <div class="badge-text"><span>地址</span><pre>${escapeHtml(profile.address || "")}</pre></div>
            <div class="badge-foot">ID · ${escapeHtml(String(user.id || ""))}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAuth() {
  const loginActive = state.authMode === "login";
  return `
    <section class="auth-wrap">
      <div class="auth-card">
        <div class="auth-tabs">
          <button class="pill ${loginActive ? "active" : ""}" data-action="auth-mode" data-mode="login">登录</button>
          <button class="pill ${!loginActive ? "active" : ""}" data-action="auth-mode" data-mode="register">注册</button>
        </div>
        <h2 class="auth-title">${loginActive ? "欢迎回来" : "创建账号"}</h2>
        <p class="section-sub">数据来自后台数据库</p>
          <form id="auth-form" class="auth-form">
            ${loginActive ? `
              <label>手机号或邮箱</label>
              <input name="account" autocomplete="username" placeholder="请输入手机号或邮箱" required />
            ` : `
              <label>用户名</label>
              <input name="username" autocomplete="username" placeholder="请输入用户名" required />
            `}
            <label>密码</label>
            <input type="password" name="password" autocomplete="current-password" placeholder="请输入密码" required />
            ${loginActive ? "" : `
              <label>确认密码</label>
              <input type="password" name="confirm" autocomplete="new-password" placeholder="请再次输入密码" required />
              <label>邮箱</label>
              <input name="email" placeholder="test@example.com" required />
              <label>手机</label>
              <input name="phone" placeholder="138xxxx" required />
              <label>账号类型</label>
              <div class="role-choose">
                <label><input type="radio" name="role" value="user" checked /> 普通用户</label>
                <label><input type="radio" name="role" value="company" /> 企业用户</label>
              </div>
          `}
          ${state.authError ? `<p class="auth-msg auth-error">${escapeHtml(state.authError)}</p>` : ""}
          ${state.authSuccess ? `<p class="auth-msg auth-success">${escapeHtml(state.authSuccess)}</p>` : ""}
          <button class="pill active auth-submit" type="submit">${loginActive ? "登录" : "注册并登录"}</button>
        </form>
      </div>
    </section>
  `;
}

function renderMyApplications() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后查看投递记录。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "user") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法查看投递记录。</p></section>`;
  }

  const rows = state.applications
    .map((app) => {
      const status = Number(app.pass || 0);
      const statusLabel = status === 1 ? "通过" : status === 2 ? "拒绝" : "待处理";
      const statusClass = status === 1 ? "pass" : status === 2 ? "reject" : "pending";
      return `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(app.job_title || app.title || "未知职位")}</h4>
            <p class="section-sub">${escapeHtml(app.company_name || "-")}</p>
          </div>
          <div class="list-actions">
            <span class="status-pill status-${statusClass}">${escapeHtml(statusLabel)}</span>
            <button class="pill" data-action="cancel-application" data-job="${app.job_id}">撤销投递</button>
            <button class="pill" data-action="open-job-detail" data-job="${app.job_id}" data-pass="${status}" data-from="applications">查看职位</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <button class="back-circle" data-action="back-profile" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>我的投递</h2>
      <p class="section-sub">查看你投递过的岗位与状态</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂无投递记录。</p>"}</section>
  `;
}

function renderCompanyJobs() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后查看发布记录。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "company") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法查看发布记录。</p></section>`;
  }

  const rows = state.companyJobs
    .map(
      (job) => `
      <div class="list-item company-item">
        <div>
          <h4>${escapeHtml(job.title)}</h4>
          <p class="section-sub">${escapeHtml(job.location || "")} · ${escapeHtml(formatSalary(job))}</p>
        </div>
        <div class="list-actions">
          <button class="pill" data-action="open-job-applications" data-job="${job.id}">查看投递</button>
          <button class="pill" data-action="open-job-detail" data-job="${job.id}">详情</button>
          <button class="pill" data-action="edit-job" data-job="${job.id}">修改</button>
        </div>
      </div>
    `
    )
    .join("");

  return `
    <button class="back-circle" data-action="back-profile" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>我发布的职位</h2>
      <p class="section-sub">共 ${state.companyJobs.length} 个职位</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂无发布职位。</p>"}</section>
  `;
}

function renderJobApplications() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后查看投递。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "company") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法查看投递列表。</p></section>`;
  }

  const job = state.companyJobs.find((item) => item.id === state.selectedJobApplicationsId);
  if (!job) {
    return `<section class="empty-state"><p class="section-sub">未找到职位信息。</p><button class="pill" data-nav="company-jobs">返回职位列表</button></section>`;
  }

  const rows = state.jobApplications
    .map((app) => {
      const pass = Number(app.pass || 0);
      const statusLabel = pass === 1 ? "通过" : pass === 2 ? "拒绝" : "待处理";
      const statusClass = pass === 1 ? "pass" : pass === 2 ? "reject" : "pending";
      return `
        <div class="list-item">
          <div>
            <h4><button class="text-link" data-action="view-user-profile" data-user="${escapeHtml(String(app.user_id))}">${escapeHtml(app.user_name || app.user_id)}</button></h4>
            <p class="section-sub">投递简历 ID：${escapeHtml(String(app.resume_id))}</p>
          </div>
          <div class="list-actions">
            <span class="status-pill status-${statusClass}">${statusLabel}</span>
            <button class="pill ${pass === 1 ? "active" : ""}" data-action="set-application-pass" data-pass="1" data-current="${pass}" data-user="${escapeHtml(String(app.user_id))}">通过</button>
            <button class="pill ${pass === 2 ? "active" : ""}" data-action="set-application-pass" data-pass="2" data-current="${pass}" data-user="${escapeHtml(String(app.user_id))}">拒绝</button>
            <button class="pill" data-action="view-resume-user" data-user="${escapeHtml(String(app.user_id))}">查看简历</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <button class="back-circle" data-action="back-company-jobs" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>${escapeHtml(job.title)}</h2>
      <p class="section-sub">共收到 ${state.jobApplications.length} 份简历</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂未收到简历。</p>"}</section>
  `;
}

function renderAdminManage() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后管理内容。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法进入管理后台。</p></section>`;
  }

  return `
    <section class="section-head">
      <h2>管理后台</h2>
      <p class="section-sub">请选择管理模块</p>
    </section>
    <div class="admin-grid">
      <div class="admin-panel">
        <h3>用户管理</h3>
        <p class="section-sub">查看并删除普通用户/企业用户</p>
        <button class="pill" data-nav="admin-users">进入</button>
      </div>
      <div class="admin-panel">
        <h3>职位管理</h3>
        <p class="section-sub">删除异常或违规职位</p>
        <button class="pill" data-nav="admin-jobs">进入</button>
      </div>
      <div class="admin-panel">
        <h3>新闻管理</h3>
        <p class="section-sub">管理新闻列表</p>
        <button class="pill" data-nav="admin-news">进入</button>
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后管理内容。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法进入用户管理。</p></section>`;
  }

  const users = (state.adminUsers || []).filter((u) => Number(u.flag) !== 2);
  const rows = users
    .map((user) => {
      const role = Number(user.flag) === 1 ? "企业用户" : "普通用户";
      const roleClass = Number(user.flag) === 1 ? "tag-company" : "tag-user";
      return `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(user.username || user.id)}</h4>
            <p class="section-sub">ID：${escapeHtml(String(user.id))}</p>
          </div>
          <div class="list-actions">
            <span class="status-pill ${roleClass}">${role}</span>
            <button class="pill" data-action="delete-user" data-user="${escapeHtml(String(user.id))}">删除</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <button class="back-circle" data-action="back-admin" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>用户管理</h2>
      <p class="section-sub">共 ${users.length} 个用户</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂无用户。</p>"}</section>
  `;
}

function renderAdminJobs() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后管理内容。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法进入职位管理。</p></section>`;
  }

  const rows = state.jobs
    .map((job) => `
      <div class="list-item">
        <div>
          <h4>${escapeHtml(job.title)}</h4>
          <p class="section-sub">${escapeHtml(job.company)}</p>
        </div>
        <div class="list-actions">
          <button class="pill" data-action="delete-job" data-job="${job.id}">删除</button>
        </div>
      </div>
    `)
    .join("");

  return `
    <button class="back-circle" data-action="back-admin" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>职位管理</h2>
      <p class="section-sub">共 ${state.jobs.length} 个职位</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂无职位。</p>"}</section>
  `;
}

function renderAdminNews() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后管理内容。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法进入新闻管理。</p></section>`;
  }

  const rows = state.news
    .map((item) => `
      <div class="list-item">
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="section-sub">${escapeHtml(item.category)} · ${escapeHtml(formatDate(item.date))}</p>
        </div>
        <div class="list-actions">
          <button class="pill" data-action="edit-news" data-news="${item.id}">修改</button>
          <button class="pill" data-action="delete-news" data-news="${item.id}">删除</button>
        </div>
      </div>
    `)
    .join("");

  return `
    <button class="back-circle" data-action="back-admin" aria-label="返回">＜</button>
    <section class="section-head">
      <h2>新闻管理</h2>
      <p class="section-sub">共 ${state.news.length} 条新闻</p>
    </section>
    <section class="list-panel">${rows || "<p class='section-sub'>暂无新闻。</p>"}</section>
  `;
}

function renderCompanyPostJob() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后发布职位。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "company") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法发布职位。</p></section>`;
  }

  const editing = state.editingJobId
    ? state.companyJobs.find((job) => Number(job.id) === Number(state.editingJobId))
    : null;
  const draft = editing || {};
  const selectedTags = state.companyJobTags || [];
  const titleText = editing ? "修改职位" : "发布职位";
  const submitText = editing ? "保存修改" : "提交发布";

  return `
    <section class="section-head">
      <h2>${titleText}</h2>
      <p class="section-sub">面试要求信息必须填写</p>
    </section>
    <form id="company-job-form" class="form-grid">
      <label>职位名称<input name="title" required placeholder="例如：前端开发工程师" value="${escapeHtml(draft.title || "")}" /></label>
      <label>工作地点<input name="location" required placeholder="例如：深圳·南山" value="${escapeHtml(draft.location || "")}" /></label>
      <div class="form-row">
        <label>最低薪资(k/月)<input type="number" name="salaryMin" min="0" required value="${escapeHtml(String(draft.salaryMin ?? ""))}" /></label>
        <label>最高薪资(k/月)<input type="number" name="salaryMax" min="0" required value="${escapeHtml(String(draft.salaryMax ?? ""))}" /></label>
      </div>
      <div class="tag-selector job-tag-selector">
        <div class="tag-selector-head">
          <span>选择标签（最多 4 个）</span>
          <em>${selectedTags.length}/4</em>
        </div>
        <div class="tag-selector-grid">
          ${(state.tags || []).map((tag) => {
            const active = selectedTags.includes(Number(tag.id));
            const disabled = !active && selectedTags.length >= 4;
            return `<button class="tag-chip ${active ? "active" : ""} ${disabled ? "disabled" : ""}" data-action="toggle-company-tag" data-tag="${tag.id}">${escapeHtml(tag.name)}</button>`;
          }).join("")}
        </div>
      </div>
      <label>职位摘要<textarea name="summary" rows="3" required>${escapeHtml(draft.summary || "")}</textarea></label>
      <label>工作职责（每行一条）<textarea name="responsibilities" rows="4">${escapeHtml((draft.responsibilities || []).join("\n"))}</textarea></label>
      <label>岗位要求（每行一条）<textarea name="requirements" rows="4">${escapeHtml((draft.requirements || []).join("\n"))}</textarea></label>
      <label>福利亮点（每行一条）<textarea name="benefits" rows="3">${escapeHtml((draft.benefits || []).join("\n"))}</textarea></label>
      <div class="form-divider">面试要求</div>
      <label>面试地点<input name="interviewWhere" required placeholder="例如：南山科技园 A 座 5F" value="${escapeHtml(draft.interview?.interview_where || "")}" /></label>
      <label>面试时间<input name="interviewWhen" required placeholder="例如：每周三 14:00" value="${escapeHtml(draft.interview?.interview_when || "")}" /></label>
      <label>面试备注<input name="interviewRemark" required placeholder="例如：携带简历与作品集" value="${escapeHtml(draft.interview?.interview_remark || "")}" /></label>
      <button class="pill active" type="submit">${submitText}</button>
    </form>
  `;
}

function renderAdminPostNews() {
  if (!state.currentUser) {
    return `<section class="empty-state"><p class="section-sub">请先登录后发布新闻。</p><button class="pill" data-nav="auth">前往登录</button></section>`;
  }
  if (state.currentRole !== "admin") {
    return `<section class="empty-state"><p class="section-sub">当前账号类型无法发布新闻。</p></section>`;
  }

  const editing = state.editingNewsId
    ? state.news.find((item) => Number(item.id) === Number(state.editingNewsId))
    : null;
  const draft = editing || {};
  const titleText = editing ? "修改新闻" : "发布新闻";
  const submitText = editing ? "保存修改" : "发布新闻";
  const parsed = parseNewsContent(draft.contentRaw || (draft.content || []).join("\n"));

  return `
    <section class="section-head">
      <h2>${titleText}</h2>
      <p class="section-sub">面向全站展示的资讯</p>
    </section>
    <form id="admin-news-form" class="form-grid">
      <label>新闻标题<input name="title" required value="${escapeHtml(draft.title || "")}" /></label>
      <label>关键字<input name="kernel" required placeholder="校园宣讲 / 职业讲座" value="${escapeHtml(draft.kernel || "")}" /></label>
      <label>发布者<input name="author" required placeholder="管理员名称" value="${escapeHtml(draft.author || "")}" /></label>
      <label>上传图片<input type="file" name="cover" accept="image/*" /></label>
      ${parsed.image ? `<div class="news-cover-preview"><img src="${encodeURI(parsed.image)}" alt="封面预览" referrerpolicy="no-referrer" /></div>` : ""}
      <label>正文内容<textarea name="content" rows="6" required>${escapeHtml(parsed.body || "")}</textarea></label>
      <button class="pill active" type="submit">${submitText}</button>
    </form>
  `;
}

function renderContact() {
  const c = zh(DATA.contact);
  const cards = [
    { title: "邮箱", value: c.email, url: "https://github.com/matchlessLian/Graduation-project-Web-Based-" },
    { title: "GitHub", value: c.github, url: "https://github.com/matchlessLian/Graduation-project-Web-Based-" },
    { title: "致谢对象", value: c.thanks1, url: "https://chatgpt.com/" }
  ];

  return `
    <section style="text-align:center;">
      <h2 style="font-size:clamp(52px,10vw,200px);line-height:1.5;margin:0;">${c.hello}</h2>
      <p class="hero-intro" style="margin:10px auto 28px;max-width:860px;">${c.intro}</p>
      <div class="contact-grid">
        ${cards
          .map(
            (card) => `
            <a class="contact-card" href="${card.url}" target="_blank" rel="noreferrer noopener">
              <h3 style="margin:0 0 10px;font-size:28px;">${escapeHtml(card.title)}</h3>
              <p style="margin:0;color:var(--muted)">${escapeHtml(card.value)}</p>
            </a>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}
function renderMain() {
  const main = document.getElementById("main");

  if (state.activeTab === "dashboard") {
    main.innerHTML = `${renderHero()}${renderCooperateCards()}`;
    return;
  }

  if (state.activeTab === "portfolio") {
    main.innerHTML = renderNewsList();
    return;
  }

  if (state.activeTab === "articles") {
    main.innerHTML = renderJobsList();
    return;
  }

  if (state.activeTab === "job-detail") {
    main.innerHTML = renderJobDetail();
    return;
  }

  if (state.activeTab === "news-detail") {
    main.innerHTML = renderNewsDetail();
    return;
  }

  if (state.activeTab === "applications") {
    main.innerHTML = renderMyApplications();
    return;
  }

  if (state.activeTab === "company-jobs") {
    main.innerHTML = renderCompanyJobs();
    return;
  }

  if (state.activeTab === "job-applications") {
    main.innerHTML = renderJobApplications();
    return;
  }

  if (state.activeTab === "admin-manage") {
    main.innerHTML = renderAdminManage();
    return;
  }

  if (state.activeTab === "admin-users") {
    if (!state.adminUsers || state.adminUsers.length === 0) {
      loadAdminUsers().then(() => renderMain());
    }
    main.innerHTML = renderAdminUsers();
    return;
  }

  if (state.activeTab === "admin-jobs") {
    main.innerHTML = renderAdminJobs();
    return;
  }

  if (state.activeTab === "admin-news") {
    main.innerHTML = renderAdminNews();
    return;
  }

  if (state.activeTab === "company-post") {
    main.innerHTML = renderCompanyPostJob();
    return;
  }

  if (state.activeTab === "user-view") {
    main.innerHTML = renderUserProfileView();
    return;
  }

  if (state.activeTab === "admin-post") {
    main.innerHTML = renderAdminPostNews();
    return;
  }

  if (state.activeTab === "auth") {
    main.innerHTML = renderAuth();
    return;
  }

  if (state.activeTab === "profile") {
    main.innerHTML = renderProfile();
    return;
  }

  main.innerHTML = renderContact();
}

function renderBackButton() {
  const host = document.getElementById("back-root");
  if (!host) return;

  const showTabs = new Set([
    "applications",
    "company-jobs",
    "job-applications",
    "admin-users",
    "admin-jobs",
    "admin-news",
    "admin-manage",
    "user-view",
    "admin-post",
    "company-post"
  ]);
  if (!showTabs.has(state.activeTab)) {
    host.innerHTML = "";
    return;
  }

  let action = "back-profile";
  if (state.activeTab === "job-applications") action = "back-company-jobs";
  if (state.activeTab === "user-view") action = "back-job-applications";
  if (state.activeTab === "admin-post") action = "back-admin";
  if (state.activeTab === "company-post") action = "back-company-jobs";
  if (state.activeTab === "admin-users" || state.activeTab === "admin-jobs" || state.activeTab === "admin-news") {
    action = "back-admin";
  }

  host.innerHTML = `<button class="back-circle" data-action="${action}" aria-label="返回">＜</button>`;
}
function renderFooter() {
  const c = zh(DATA.contact);
  document.getElementById("footer").innerHTML = `<p>? 2026 LiAN</p><p>${escapeHtml(c.footerDesign)}</p>`;
}

function renderResumeModal() {
  if (!state.resumeModalOpen && !state.resumePreviewUser) {
    overlayRoot.innerHTML = "";
    return;
  }

  if (state.resumeModalOpen) {
    overlayRoot.innerHTML = `
      <div class="overlay open" data-action="close-resume-modal">
        <div class="modal">
          <button class="close" data-action="close-resume-modal">×</button>
          <h2>上传简历</h2>
          <p class="section-sub">文件将上传到服务器</p>
          <form id="resume-upload-form" class="form-grid">
            <label>选择文件<input type="file" name="resume" accept=".pdf,.doc,.docx" required /></label>
            <button class="pill active" type="submit">确认上传</button>
          </form>
        </div>
      </div>
    `;
    return;
  }

  const userId = state.resumePreviewUser;
  if (!userId) return;
  const jobIdParam = state.resumePreviewJobId ? `&job_id=${state.resumePreviewJobId}` : "";
  const inlineParam = "&inline=1";
  const url = `/api/resumes/download?user_id=${userId}${jobIdParam}`;
  const previewUrl = `${url}${inlineParam}`;
  const ext = state.resumeMeta && state.resumeMeta.ext ? String(state.resumeMeta.ext).toLowerCase() : "";
  const canPreview = ext === "pdf";

  overlayRoot.innerHTML = `
    <div class="overlay open" data-action="close-resume-modal">
      <div class="modal">
        <button class="close" data-action="close-resume-modal">×</button>
        <h2>简历预览</h2>
        ${canPreview ? `
          <div class="resume-preview-shell">
            <iframe class="resume-preview" src="${previewUrl}"></iframe>
          </div>
        ` : `
          <p class="section-sub">当前简历格式为 ${ext ? ext.toUpperCase() : "未知"}，请下载后查看。</p>
        `}
        <a class="pill active" href="${url}" target="_blank">下载简历</a>
      </div>
    </div>
  `;
}

function updateProfilePreview() {
  const p = state.profileDraft;
  if (!p) return;

  const tagText = (state.userTags || []).map((t) => t.name).join(" / ") || "未选择";
  const map = [
    ["preview-name", p.name],
    ["preview-purposeRole", p.purposeRole],
    ["preview-tag", tagText],
    ["preview-introduce", p.introduce],
    ["preview-contact", p.contact],
    ["preview-address", p.address]
  ];

  map.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  });
}

function setTab(tab) {
  const safeTab = validTabs.has(tab) ? tab : "dashboard";
  transition(() => {
    state.activeTab = safeTab;
    state.authError = "";
    state.authSuccess = "";
    if (safeTab !== "job-detail") state.selectedJobId = null;
    if (safeTab !== "job-detail") state.showInterviewJobId = null;
    if (safeTab !== "news-detail") state.selectedNewsId = null;
    if (safeTab !== "job-applications") state.selectedJobApplicationsId = null;
    if (safeTab !== "job-detail") state.jobDetailBackTo = null;
    if (safeTab === "company-post" && !state.editingJobId) state.companyJobTags = [];
    if (safeTab !== "admin-post") state.editingNewsId = null;
    if (safeTab !== "user-view") {
      state.viewUserProfile = null;
      state.viewUserTags = [];
      state.viewFloatingTags = [];
      state.viewFloatingTagsKey = "";
    }
    renderNav();
    renderMain();
  renderFooter();
  renderBackButton();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function triggerGravity() {
  if (state.gravityActive) return;
  state.gravityActive = true;
  const resetBtn = document.getElementById("gravity-reset");
  const targets = [...document.querySelectorAll("main h1, main h2, main h3, main p, .card, .pill, .top-nav button, .logo")];

  state.exploded = targets;
  targets.forEach((el) => {
    el.classList.add("exploded");
    const tx = (Math.random() - 0.5) * window.innerWidth * 0.8;
    const ty = (Math.random() - 0.5) * window.innerHeight * 1.2;
    const rot = (Math.random() - 0.5) * 140;
    el.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
    el.style.opacity = "0.1";
    el.style.pointerEvents = "none";
  });

  resetBtn.style.display = "block";
}

function resetGravity() {
  state.gravityActive = false;
  state.exploded.forEach((el) => {
    el.style.transform = "";
    el.style.opacity = "";
    el.style.pointerEvents = "";
    el.classList.remove("exploded");
  });
  state.exploded = [];
  document.getElementById("gravity-reset").style.display = "none";
}

async function handleAuthSubmit(form) {
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const account = String(formData.get("account") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim();
  let role = String(formData.get("role") || "user").trim();
  if (role !== "company") role = "user";
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  state.authError = "";
  state.authSuccess = "";

  if (!password || (state.authMode === "login" ? !account : !username)) {
    state.authError = state.authMode === "login" ? "手机号或邮箱和密码不能为空" : "用户名和密码不能为空";
    renderMain();
    renderBackButton();
    return;
  }

  if (state.authMode === "register") {
    if (password.length < 4) {
      state.authError = "密码至少 4 位";
      renderMain();
        renderBackButton();
        return;
    }

    if (password !== confirm) {
      state.authError = "两次输入的密码不一致";
      renderMain();
        renderBackButton();
        return;
    }

    if (!email || !phone) {
      state.authError = "邮箱和手机号为必填项";
      renderMain();
      renderBackButton();
      return;
    }

    try {
      await apiPost("/api/auth/register", {
        username,
        password,
        email,
        phone,
        flag: roleToFlag(role)
      });
      await loadSession();
      state.profileDraft = getProfile(state.currentUser);
      await loadProfileInfo();
      await syncRoleData();
      state.authSuccess = "注册成功，已自动登录";
      renderNav();
      setTab("profile");
    } catch (err) {
      state.authError = "注册失败";
      renderMain();
    }
    return;
  }

  try {
    await apiPost("/api/auth/login", { account, password });
    await loadSession();
    state.profileDraft = getProfile(state.currentUser);
    await loadProfileInfo();
    await syncRoleData();
    state.authSuccess = "登录成功";
    renderNav();
    setTab("profile");
  } catch (err) {
    state.authError = "用户名或密码错误";
    renderMain();
  }
}

async function applyToJob(jobId) {
  if (!state.currentUser) {
    alert("请先登录后再投递");
    return;
  }
  if (state.currentRole !== "user") {
    alert("当前账号类型无法投递简历");
    return;
  }
  if (!state.resume) {
    alert("请先在个人页面上传简历");
    return;
  }
  await apiPost("/api/applications", { resume_id: state.resume.id, job_id: jobId });
  await loadApplications();
  renderMain();
  alert("投递成功！");
}

async function handleJobSubmit(form) {
  const formData = new FormData(form);
  const payload = {
    title: String(formData.get("title") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    salary_min: Number(formData.get("salaryMin") || 0),
    salary_max: Number(formData.get("salaryMax") || 0),
    summary: String(formData.get("summary") || "").trim(),
    responsibilities: String(formData.get("responsibilities") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    requirements: String(formData.get("requirements") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    benefits: String(formData.get("benefits") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    tag_ids: (state.companyJobTags || []).map((id) => Number(id)).filter(Boolean),
    interview_where: String(formData.get("interviewWhere") || "").trim(),
    interview_when: String(formData.get("interviewWhen") || "").trim(),
    interview_remark: String(formData.get("interviewRemark") || "").trim()
  };

  try {
    if (state.editingJobId) {
      await apiPut("/api/jobs", { ...payload, id: state.editingJobId });
    } else {
      await apiPost("/api/jobs", payload);
    }
    await loadCompanyJobs();
    await loadJobs();
    alert(state.editingJobId ? "职位已更新" : "职位发布成功");
    state.editingJobId = null;
    state.companyJobTags = [];
    setTab("company-jobs");
  } catch (err) {
    alert("职位提交失败，请检查填写");
  }
}

async function handleNewsSubmit(form) {
  const formData = new FormData(form);
  const payload = {
    title: String(formData.get("title") || "").trim(),
    kernel: String(formData.get("kernel") || "").trim(),
    author: String(formData.get("author") || "").trim(),
    content: String(formData.get("content") || "").trim()
  };
  const coverFile = formData.get("cover");
  let imageUrl = "";
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploadData = new FormData();
    uploadData.append("image", coverFile);
    const uploadRes = await apiRequest("/api/coverage/upload", { method: "POST", body: uploadData });
    imageUrl = uploadRes?.data?.url || "";
  } else if (state.editingNewsId) {
    const existing = state.news.find((n) => Number(n.id) === Number(state.editingNewsId));
    imageUrl = existing?.coverImage || "";
  }
  payload.content = JSON.stringify({ image: imageUrl, body: payload.content });

  try {
    if (state.editingNewsId) {
      await apiPut("/api/coverage", { ...payload, id: state.editingNewsId });
    } else {
      await apiPost("/api/coverage", payload);
    }
    await loadNews();
    alert(state.editingNewsId ? "新闻已更新" : "新闻已发布");
    state.editingNewsId = null;
    setTab("admin-news");
  } catch {
    alert("新闻发布失败，请检查填写");
  }
}

async function handleResumeUpload(form) {
  const formData = new FormData(form);
  const file = formData.get("resume");
  if (!(file instanceof File)) return;

  const uploadData = new FormData();
  uploadData.append("resume", file);

  try {
    await apiRequest("/api/resumes/upload", { method: "POST", body: uploadData });
    await loadResume();
    state.resumeModalOpen = false;
    renderResumeModal();
    renderMain();
  } catch {
    alert("上传失败，请重试");
  }
}

function attachGlobalEvents() {
  document.addEventListener("click", async (event) => {
    const target = event.target;
    const navEl = target.closest("[data-nav]");
    if (navEl) {
      const tab = navEl.dataset.nav;
      if (tab === "profile" && !state.currentUser) {
        state.authMode = "login";
        setTab("auth");
      } else {
        if (tab === "applications") await loadApplications();
        if (tab === "company-jobs") await loadCompanyJobs();
        if (tab === "admin-users") await loadAdminUsers();
        setTab(tab);
      }
      return;
    }

    const actionEl = target.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.dataset.action;

      if (action === "toggle-theme") {
        state.theme = state.theme === "light" ? "dark" : "light";
        applyTheme();
        renderNav();
        return;
      }

      if (action === "trigger-gravity") {
        triggerGravity();
        return;
      }

      if (action === "auth-mode") {
        state.authMode = actionEl.dataset.mode === "register" ? "register" : "login";
        state.authError = "";
        state.authSuccess = "";
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "logout") {
        await apiPost("/api/auth/logout", {});
        state.currentUser = null;
        state.currentUserId = null;
        state.currentRole = null;
        state.profileDraft = null;
        state.editingJobId = null;
        state.companyJobTags = [];
        state.showInterviewJobId = null;
        state.jobDetailBackTo = null;
        state.editingNewsId = null;
        state.jobTagFilters = [];
        state.jobSalaryMin = "";
        state.jobSalaryMax = "";
        state.jobTimeFilter = "All";
        state.jobTagFiltersDraft = [];
        state.jobSalaryMinDraft = "";
        state.jobSalaryMaxDraft = "";
        state.jobTimeFilterDraft = "All";
        state.resume = null;
        state.resumeMeta = { hasFile: false, ext: null };
        state.applications = [];
        state.companyJobs = [];
        state.jobApplications = [];
        state.userTags = [];
        state.floatingTags = [];
        state.floatingTagsKey = "";
        state.viewUserProfile = null;
        state.viewUserTags = [];
        state.viewFloatingTags = [];
        state.viewFloatingTagsKey = "";
        renderNav();
        setTab("dashboard");
        return;
      }

      if (action === "toggle-profile-drawer") {
        state.profileDrawerOpen = !state.profileDrawerOpen;
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "wiggle-badge") {
        const rig = actionEl.closest(".badge-rig");
        const card = rig ? rig.querySelector(".badge-card") : null;
        const targetEl = card || rig;
        if (targetEl) {
          targetEl.classList.remove("wiggle");
          void targetEl.offsetWidth;
          targetEl.classList.add("wiggle");
          window.setTimeout(() => targetEl.classList.remove("wiggle"), 800);
        }
        return;
      }

      if (action === "toggle-user-tag") {
        const tagId = Number(actionEl.dataset.tag || 0);
        if (!tagId) return;
        const exists = state.userTags.find((t) => Number(t.id) === tagId);
        if (exists) {
          state.userTags = state.userTags.filter((t) => Number(t.id) !== tagId);
        } else if (state.userTags.length < 6) {
          const tag = state.tags.find((t) => Number(t.id) === tagId);
          if (tag) state.userTags = [...state.userTags, { id: tag.id, name: tag.name }];
        }
        buildFloatingTags();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "toggle-company-tag") {
        const tagId = Number(actionEl.dataset.tag || 0);
        if (!tagId) return;
        const exists = state.companyJobTags.includes(tagId);
        if (exists) {
          state.companyJobTags = state.companyJobTags.filter((id) => Number(id) !== tagId);
        } else if (state.companyJobTags.length < 4) {
          state.companyJobTags = [...state.companyJobTags, tagId];
        }
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "save-profile") {
        if (state.currentUser && state.profileDraft) {
          state.profileDraft.tag = (state.userTags || []).map((t) => t.name).join(" / ");
          const payload = {
            username: state.profileDraft.name,
            purpose_role: state.profileDraft.purposeRole,
            introduce: state.profileDraft.introduce,
            address: state.profileDraft.address,
            contact: state.profileDraft.contact
          };
          try {
            const res = await apiPut("/api/profile", payload);
            if (res && res.data && res.data.username) {
              state.currentUser = res.data.username;
              state.profileDraft.name = res.data.username;
              renderNav();
            }
            saveProfile(state.currentUser, state.profileDraft);
            await saveUserTags();
            alert("工牌信息已保存");
          } catch {
            alert("保存失败，请稍后重试");
          }
        }
        return;
      }

      if (action === "toggle-job-tag") {
        const value = Number(actionEl.dataset.value || 0);
        if (!value) return;
        if (state.jobTagFiltersDraft.includes(value)) {
          state.jobTagFiltersDraft = state.jobTagFiltersDraft.filter((tag) => Number(tag) !== value);
        } else {
          state.jobTagFiltersDraft = [...state.jobTagFiltersDraft, value];
        }
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "clear-job-tags") {
        state.jobTagFiltersDraft = [];
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "job-time") {
        state.jobTimeFilterDraft = actionEl.dataset.value || "All";
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "apply-job-filters") {
        state.jobTagFilters = [...state.jobTagFiltersDraft];
        state.jobSalaryMin = state.jobSalaryMinDraft;
        state.jobSalaryMax = state.jobSalaryMaxDraft;
        state.jobTimeFilter = state.jobTimeFilterDraft;
        await loadJobs();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "open-job-detail") {
        state.selectedJobId = Number(actionEl.dataset.job);
        const pass = Number(actionEl.dataset.pass || 0);
        state.showInterviewJobId = pass === 1 ? state.selectedJobId : null;
        state.jobDetailBackTo = actionEl.dataset.from || null;
        await loadJobDetail(state.selectedJobId);
        setTab("job-detail");
        return;
      }

      if (action === "open-job-applications") {
        state.selectedJobApplicationsId = Number(actionEl.dataset.job);
        await loadJobApplications(state.selectedJobApplicationsId);
        setTab("job-applications");
        return;
      }

      if (action === "edit-job") {
        const jobId = Number(actionEl.dataset.job || 0);
        if (!jobId) return;
        const job = state.companyJobs.find((item) => Number(item.id) === jobId);
        if (!job) return;
        state.editingJobId = jobId;
        state.companyJobTags = Array.isArray(job.tagIds) ? [...job.tagIds] : [];
        setTab("company-post");
        return;
      }

      if (action === "open-resume-upload") {
        state.resumeModalOpen = true;
        state.resumePreviewUser = null;
        state.resumePreviewJobId = null;
        renderResumeModal();
        return;
      }

      if (action === "open-resume-view") {
        if (!state.currentUserId) {
          alert("未获取到用户信息，请重新登录");
          return;
        }
        state.resumePreviewUser = state.currentUserId;
        state.resumePreviewJobId = null;
        state.resumeModalOpen = false;
        if (!state.resumeMeta || !state.resumeMeta.ext) {
          await loadResume();
        }
        renderResumeModal();
        return;
      }

      if (action === "remove-resume") {
        if (state.resume) {
          await apiDelete(`/api/resumes?id=${state.resume.id}`);
          state.resume = null;
          renderMain();
        }
        return;
      }

      if (action === "view-resume-user") {
        state.resumePreviewUser = actionEl.dataset.user;
        state.resumePreviewJobId = state.selectedJobApplicationsId;
        state.resumeModalOpen = false;
        renderResumeModal();
        return;
      }

      if (action === "view-user-profile") {
        const userId = Number(actionEl.dataset.user || 0);
        if (!userId) return;
        await loadUserProfileView(userId);
        setTab("user-view");
        return;
      }

      if (action === "close-resume-modal") {
        if (target.closest(".modal") && !target.closest(".close")) {
          return;
        }
        state.resumeModalOpen = false;
        state.resumePreviewUser = null;
        state.resumePreviewJobId = null;
        renderResumeModal();
        return;
      }

      if (action === "back-profile") {
        setTab("profile");
        return;
      }

      if (action === "back-company-jobs") {
        setTab("company-jobs");
        return;
      }

      if (action === "back-applications") {
        setTab("applications");
        return;
      }

      if (action === "back-job-applications") {
        setTab("job-applications");
        return;
      }

      if (action === "back-admin") {
        setTab("admin-manage");
        return;
      }

      if (action === "apply-job") {
        await applyToJob(Number(actionEl.dataset.job));
        return;
      }

      if (action === "cancel-application") {
        const jobId = Number(actionEl.dataset.job);
        if (!jobId) return;
        await apiDelete(`/api/applications?job_id=${jobId}`);
        await loadApplications();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "back-jobs") {
        state.showInterviewJobId = null;
        setTab("articles");
        return;
      }

      if (action === "back-news") {
        setTab("portfolio");
        return;
      }

      if (action === "delete-job") {
        await apiDelete(`/api/jobs?id=${actionEl.dataset.job}`);
        await loadJobs();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "delete-news") {
        await apiDelete(`/api/coverage?id=${actionEl.dataset.news}`);
        await loadNews();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "edit-news") {
        const newsId = Number(actionEl.dataset.news || 0);
        if (!newsId) return;
        state.editingNewsId = newsId;
        setTab("admin-post");
        return;
      }

      if (action === "delete-user") {
        await apiDelete(`/api/users?id=${actionEl.dataset.user}`);
        await loadAdminUsers();
        renderMain();
        renderBackButton();
        return;
      }

      if (action === "set-application-pass") {
        const userId = Number(actionEl.dataset.user);
        const jobId = state.selectedJobApplicationsId;
        const pass = Number(actionEl.dataset.pass || 0);
        const current = Number(actionEl.dataset.current || 0);
        const nextPass = current === pass ? 0 : pass;
        await apiPut("/api/applications/pass", { user_id: userId, job_id: jobId, pass: nextPass });
        await loadJobApplications(jobId);
        renderMain();
        renderBackButton();
        return;
      }
    }

    const jobEl = target.closest("[data-job]");
    if (jobEl) {
      state.selectedJobId = Number(jobEl.dataset.job);
      state.showInterviewJobId = null;
      state.jobDetailBackTo = null;
      await loadJobDetail(state.selectedJobId);
      setTab("job-detail");
      return;
    }

    const newsEl = target.closest("[data-news]");
    if (newsEl) {
      state.selectedNewsId = Number(newsEl.dataset.news);
      setTab("news-detail");
      return;
    }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "auth-form") {
      event.preventDefault();
      handleAuthSubmit(form);
      return;
    }

    if (form.id === "company-job-form") {
      event.preventDefault();
      handleJobSubmit(form);
      return;
    }

    if (form.id === "admin-news-form") {
      event.preventDefault();
      handleNewsSubmit(form);
      return;
    }

    if (form.id === "resume-upload-form") {
      event.preventDefault();
      handleResumeUpload(form);
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const field = target.dataset.profileField;
    if (!field || !state.profileDraft) return;

    state.profileDraft[field] = target.value;
    updateProfilePreview();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === "job-salary-min") {
      state.jobSalaryMinDraft = target.value;
      renderMain();
      renderBackButton();
      return;
    }
    if (action === "job-salary-max") {
      state.jobSalaryMaxDraft = target.value;
      renderMain();
      renderBackButton();
    }
  });

  document.getElementById("gravity-reset").addEventListener("click", resetGravity);
}

async function init() {
  initThemeByTime();
  shell();
  renderNav();
  renderMain();
  renderFooter();
  renderBackButton();
  attachGlobalEvents();

  await loadSession();
  await loadTags();
  await loadJobs();
  await loadNews();
  await syncRoleData();
  renderNav();
  renderMain();
}

init();
