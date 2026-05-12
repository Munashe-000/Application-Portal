const applicants = [
  {
    id: "APP-2026-001",
    name: "Lindiwe Mokoena",
    status: "Shortlisted",
    experienceYears: 4,
    tefl: true,
    degree: true,
    essayScore: 8.8,
    academicAverage: 84.5,
    interviewScore: 7.4,
    documentsComplete: true,
    missingDocuments: [],
    finalDecision: "Pending",
    consentedAt: "2026-04-02 08:14",
    reviewers: { essay: "reviewer-02", academic: "academic-01", docs: "docs-01" }
  },
  {
    id: "APP-2026-002",
    name: "Anele Dlamini",
    status: "Interviewed",
    experienceYears: 2,
    tefl: true,
    degree: true,
    essayScore: 7.6,
    academicAverage: 80.25,
    interviewScore: 6.9,
    documentsComplete: true,
    missingDocuments: [],
    finalDecision: "Standby",
    consentedAt: "2026-04-03 11:42",
    reviewers: { essay: "reviewer-01", academic: "academic-01", docs: "docs-01" }
  },
  {
    id: "APP-2026-003",
    name: "Kea Modise",
    status: "Document Review",
    experienceYears: 1,
    tefl: false,
    degree: true,
    essayScore: 6.5,
    academicAverage: 77.4,
    interviewScore: null,
    documentsComplete: false,
    missingDocuments: ["TEFL Certificate", "Reference Letter 2"],
    finalDecision: "Pending",
    consentedAt: "2026-04-03 14:10",
    reviewers: { essay: "reviewer-02", academic: "academic-02", docs: null }
  },
  {
    id: "APP-2026-004",
    name: "Tshepo Nkosi",
    status: "Essay Review",
    experienceYears: 5,
    tefl: true,
    degree: false,
    essayScore: null,
    academicAverage: null,
    interviewScore: null,
    documentsComplete: true,
    missingDocuments: [],
    finalDecision: "Pending",
    consentedAt: "2026-04-04 09:33",
    reviewers: { essay: null, academic: null, docs: "docs-01" }
  }
];

const roles = {
  essay: {
    label: "Essay Reviewer",
    description: "Can review essays only. Academic and peer-review information is hidden."
  },
  academic: {
    label: "Academic Reviewer",
    description: "Can capture transcript scores only. Final ranking and unrelated reviewer inputs stay hidden."
  },
  docs: {
    label: "Document Checker",
    description: "Can verify document completeness and note issues before shortlisting."
  },
  screener: {
    label: "Screener",
    description: "Can view combined scores and shortlist only when prerequisite stages are complete."
  },
  interview: {
    label: "Interview Admin",
    description: "Can score interviews for shortlisted applicants only."
  },
  final: {
    label: "Final Decision Maker",
    description: "Can review all completed scores and apply final decisions."
  }
};

const auditEvents = [
  "2026-04-21 09:10 | reviewer-02 | Essay score saved | APP-2026-001",
  "2026-04-21 10:44 | academic-01 | Transcript scoring updated | APP-2026-001",
  "2026-04-21 11:22 | docs-01 | Document checklist verified | APP-2026-002",
  "2026-04-22 08:58 | screener-01 | Shortlisting decision applied | APP-2026-001",
  "2026-04-23 13:07 | interview-01 | Interview score submitted | APP-2026-002"
];

const roleSelector = document.getElementById("role-selector");
const roleDescription = document.getElementById("role-description");
const applicantQueue = document.getElementById("applicant-queue");
const applicantDetail = document.getElementById("applicant-detail");
const roleActions = document.getElementById("role-actions");
const auditLog = document.getElementById("audit-log");
const scorecardBody = document.querySelector("#scorecard-table tbody");
const tabs = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".tab-panel");
const eligibilityForm = document.getElementById("eligibility-form");
const eligibilityResult = document.getElementById("eligibility-result");

let currentRole = "essay";
let currentApplicantId = applicants[0].id;

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pushAudit(actor, action, applicantId) {
  auditEvents.unshift(`${nowStamp()} | ${actor} | ${action} | ${applicantId}`);
  if (auditEvents.length > 12) auditEvents.length = 12;
}

function isReadyForShortlist(applicant) {
  return applicant.documentsComplete && applicant.essayScore !== null && applicant.academicAverage !== null;
}

function isReadyForFinal(applicant) {
  return applicant.interviewScore !== null && applicant.essayScore !== null && applicant.academicAverage !== null;
}

function experiencePoints(years) {
  if (years >= 3) return 5;
  if (years >= 1) return 3;
  return 1;
}

function totalScore(applicant) {
  return experiencePoints(applicant.experienceYears)
    + (applicant.tefl ? 1 : 0)
    + (applicant.degree ? 1 : 0)
    + (applicant.essayScore ?? 0)
    + (applicant.interviewScore ?? 0);
}

function renderScorecard() {
  const ranked = [...applicants]
    .map((applicant) => ({ ...applicant, total: totalScore(applicant) }))
    .sort((left, right) => right.total - left.total);

  scorecardBody.innerHTML = ranked.map((applicant, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${applicant.name}<br><span class="muted">${applicant.id}</span></td>
      <td>${experiencePoints(applicant.experienceYears)}</td>
      <td>${applicant.tefl ? "1" : "0"}</td>
      <td>${applicant.degree ? "1" : "0"}</td>
      <td>${applicant.essayScore ?? "Pending"}</td>
      <td>${applicant.academicAverage ?? "Pending"}</td>
      <td>${applicant.interviewScore ?? "Pending"}</td>
      <td>${applicant.total.toFixed(1)}</td>
      <td>${applicant.status}</td>
    </tr>
  `).join("");
}

function visibleApplicants(role) {
  switch (role) {
    case "essay":
      return applicants.filter((applicant) => applicant.status === "Essay Review" || applicant.essayScore !== null);
    case "academic":
      return applicants.filter((applicant) => applicant.essayScore !== null);
    case "docs":
      return applicants.filter((applicant) => applicant.status !== "Essay Review");
    case "screener":
      return applicants.filter((applicant) => applicant.essayScore !== null && applicant.academicAverage !== null);
    case "interview":
      return applicants.filter((applicant) => applicant.status === "Shortlisted" || applicant.status === "Interviewed");
    case "final":
      return applicants.filter((applicant) => applicant.interviewScore !== null);
    default:
      return applicants;
  }
}

function renderRoleSelector() {
  roleSelector.innerHTML = Object.keys(roles).map((role) => `
    <option value="${role}">${roles[role].label}</option>
  `).join("");
  roleSelector.value = currentRole;
  roleDescription.textContent = roles[currentRole].description;
}

function renderQueue() {
  const list = visibleApplicants(currentRole);
  if (!list.find((entry) => entry.id === currentApplicantId) && list.length > 0) {
    currentApplicantId = list[0].id;
  }

  applicantQueue.innerHTML = list.map((applicant) => `
    <button class="list-item queue-button ${applicant.id === currentApplicantId ? "active" : ""}" data-id="${applicant.id}">
      <strong>${applicant.name}</strong><br>
      <span class="muted">${applicant.id} | ${applicant.status}</span>
    </button>
  `).join("");
}

function renderDetail() {
  const applicant = applicants.find((entry) => entry.id === currentApplicantId);
  if (!applicant) {
    applicantDetail.innerHTML = "<div class='list-item'>No applicants available for this role.</div>";
    if (roleActions) roleActions.innerHTML = "";
    return;
  }

  const rows = [
    `<div class="list-item"><strong>${applicant.name}</strong><br><span class="muted">${applicant.id}</span></div>`,
    `<div class="list-item">Status: ${applicant.status}</div>`,
    `<div class="list-item">Consent captured: ${applicant.consentedAt}</div>`
  ];

  if (currentRole === "essay") {
    rows.push(`<div class="list-item">Essay score: ${applicant.essayScore ?? "Awaiting score"}</div>`);
    rows.push("<div class='list-item'>Restricted: transcript grades, rank, peer scores</div>");
  }

  if (currentRole === "academic") {
    rows.push(`<div class="list-item">Academic average: ${applicant.academicAverage ?? "Not entered"}</div>`);
    rows.push("<div class='list-item'>Locking rule: one reviewer edit session at a time</div>");
  }

  if (currentRole === "docs") {
    rows.push(`<div class="list-item">Documents complete: ${applicant.documentsComplete ? "Yes" : "No"}</div>`);
    rows.push(`<div class="list-item">Missing items: ${applicant.missingDocuments.join(", ") || "None"}</div>`);
  }

  if (currentRole === "screener") {
    const ready = applicant.documentsComplete && applicant.essayScore !== null && applicant.academicAverage !== null;
    rows.push(`<div class="list-item">Composite score: ${totalScore(applicant).toFixed(1)}</div>`);
    rows.push(`<div class="list-item">Shortlisting allowed: ${ready ? "Yes" : "No"}</div>`);
  }

  if (currentRole === "interview") {
    rows.push(`<div class="list-item">Interview score: ${applicant.interviewScore ?? "Not entered"}</div>`);
  }

  if (currentRole === "final") {
    rows.push(`<div class="list-item">Essay ${applicant.essayScore ?? "-"} | Academic ${applicant.academicAverage ?? "-"} | Interview ${applicant.interviewScore ?? "-"}</div>`);
    rows.push(`<div class="list-item">Final decision: ${applicant.finalDecision}</div>`);
  }

  applicantDetail.innerHTML = rows.join("");
  renderActions(applicant);
}

function renderAuditLog() {
  auditLog.innerHTML = auditEvents.map((entry) => `<div class="list-item">${entry}</div>`).join("");
}

function renderActions(applicant) {
  if (!roleActions) return;

  const stagePills = [];
  stagePills.push(applicant.essayScore !== null ? `<span class="pill good">Essay: done</span>` : `<span class="pill warn">Essay: pending</span>`);
  stagePills.push(applicant.academicAverage !== null ? `<span class="pill good">Academics: done</span>` : `<span class="pill warn">Academics: pending</span>`);
  stagePills.push(applicant.documentsComplete ? `<span class="pill good">Docs: verified</span>` : `<span class="pill bad">Docs: incomplete</span>`);
  stagePills.push(applicant.status === "Shortlisted" || applicant.status === "Interviewed" ? `<span class="pill good">Shortlist: yes</span>` : `<span class="pill warn">Shortlist: no</span>`);
  stagePills.push(applicant.interviewScore !== null ? `<span class="pill good">Interview: done</span>` : `<span class="pill warn">Interview: pending</span>`);

  const header = `
    <h4>Actions (Mock)</h4>
    <div class="muted">This panel simulates stage enforcement, role visibility, and audit logging.</div>
    <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;">${stagePills.join("")}</div>
  `;

  if (currentRole === "essay") {
    const disabled = applicant.status === "EligibilityFailed" || applicant.status === "Draft";
    roleActions.innerHTML = header + `
      <div class="row">
        <label>Essay score (0 - 10)
          <input id="essay-score" type="number" min="0" max="10" step="0.1" value="${applicant.essayScore ?? ""}" ${disabled ? "disabled" : ""}>
        </label>
        <div>
          <div class="muted">Visibility: academic scores and other reviewers’ inputs are hidden in this role.</div>
          <button type="button" data-action="save-essay" ${disabled ? "disabled" : ""}>Save Essay Score</button>
        </div>
      </div>
    `;
    return;
  }

  if (currentRole === "academic") {
    const disabled = applicant.status === "EligibilityFailed" || applicant.status === "Draft";
    roleActions.innerHTML = header + `
      <div class="row">
        <label>Academic average (auto / mock)
          <input id="academic-avg" type="number" min="0" max="100" step="0.01" value="${applicant.academicAverage ?? ""}" ${disabled ? "disabled" : ""}>
        </label>
        <div>
          <div class="muted">Visibility: essay notes and peer scores are hidden in this role.</div>
          <button type="button" data-action="save-academic" ${disabled ? "disabled" : ""}>Save Academic Average</button>
        </div>
      </div>
      <div class="muted">In the production build, this is captured as per-subject grades with an audited calculation.</div>
    `;
    return;
  }

  if (currentRole === "docs") {
    roleActions.innerHTML = header + `
      <div class="row single">
        <div class="muted">Mandatory documents must be present before verification is accepted.</div>
        <button type="button" data-action="toggle-docs">${applicant.documentsComplete ? "Mark as Incomplete (Mock)" : "Mark as Verified (Mock)"}</button>
      </div>
    `;
    return;
  }

  if (currentRole === "screener") {
    const ready = isReadyForShortlist(applicant);
    roleActions.innerHTML = header + `
      <div class="row single">
        <div>Shortlisting allowed: ${ready ? "<span class='pill good'>Yes</span>" : "<span class='pill bad'>No</span>"}</div>
        <button type="button" data-action="shortlist" ${ready ? "" : "disabled"}>Mark as Shortlisted</button>
        <button type="button" data-action="not-shortlist">Mark as Not Shortlisted</button>
      </div>
    `;
    return;
  }

  if (currentRole === "interview") {
    const disabled = applicant.status !== "Shortlisted" && applicant.status !== "Interviewed";
    roleActions.innerHTML = header + `
      <div class="row">
        <label>Interview score (0 - 10)
          <input id="interview-score" type="number" min="0" max="10" step="0.1" value="${applicant.interviewScore ?? ""}" ${disabled ? "disabled" : ""}>
        </label>
        <div>
          <div class="muted">Rule: only shortlisted applicants can be scored for interview.</div>
          <button type="button" data-action="save-interview" ${disabled ? "disabled" : ""}>Save Interview Score</button>
        </div>
      </div>
      <div class="muted">In the production build, this is a multi-field scoring sheet with an audited average.</div>
    `;
    return;
  }

  if (currentRole === "final") {
    const canFinalize = isReadyForFinal(applicant);
    roleActions.innerHTML = header + `
      <div class="row">
        <label>Final decision
          <select id="final-decision" ${canFinalize ? "" : "disabled"}>
            <option value="">Select...</option>
            <option value="Approved" ${applicant.finalDecision === "Approved" ? "selected" : ""}>Approved</option>
            <option value="Rejected" ${applicant.finalDecision === "Rejected" ? "selected" : ""}>Rejected</option>
            <option value="Standby" ${applicant.finalDecision === "Standby" ? "selected" : ""}>Standby</option>
          </select>
        </label>
        <div>
          <div class="muted">Finalisation allowed only once essay, academics, and interview are complete.</div>
          <button type="button" data-action="save-final" ${canFinalize ? "" : "disabled"}>Save Final Decision</button>
        </div>
      </div>
      <div class="row single">
        <button type="button" data-action="mock-emails" ${applicant.finalDecision ? "" : "disabled"}>Generate Result Emails (Mock)</button>
        <div class="muted">Approved: Accept/Reject form. Standby: “I agree / I disagree” standby form request.</div>
      </div>
    `;
    return;
  }

  roleActions.innerHTML = header + `<div class="muted">Select a role to see relevant actions.</div>`;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((button) => button.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

roleSelector.addEventListener("change", (event) => {
  currentRole = event.target.value;
  roleDescription.textContent = roles[currentRole].description;
  renderQueue();
  renderDetail();
});

applicantQueue.addEventListener("click", (event) => {
  const target = event.target.closest("[data-id]");
  if (!target) return;
  currentApplicantId = target.dataset.id;
  renderQueue();
  renderDetail();
});

roleActions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const applicant = applicants.find((entry) => entry.id === currentApplicantId);
  if (!applicant) return;

  const actorId = {
    essay: "essay-reviewer",
    academic: "academic-reviewer",
    docs: "document-checker",
    screener: "screener",
    interview: "interview-admin",
    final: "final-decision"
  }[currentRole] ?? "staff";

  if (action === "save-essay") {
    const value = Number(document.getElementById("essay-score")?.value);
    if (Number.isFinite(value)) {
      applicant.essayScore = Math.max(0, Math.min(10, value));
      if (applicant.status === "Submitted") applicant.status = "Essay Review";
      pushAudit(actorId, "Essay score saved", applicant.id);
    }
  }

  if (action === "save-academic") {
    const value = Number(document.getElementById("academic-avg")?.value);
    if (Number.isFinite(value)) {
      applicant.academicAverage = Math.max(0, Math.min(100, value));
      pushAudit(actorId, "Transcript scoring updated", applicant.id);
    }
  }

  if (action === "toggle-docs") {
    applicant.documentsComplete = !applicant.documentsComplete;
    applicant.missingDocuments = applicant.documentsComplete ? [] : ["TEFL Certificate", "Reference Letter 2"];
    pushAudit(actorId, applicant.documentsComplete ? "Document checklist verified" : "Document checklist flagged", applicant.id);
  }

  if (action === "shortlist") {
    if (isReadyForShortlist(applicant)) {
      applicant.status = "Shortlisted";
      pushAudit(actorId, "Shortlisting decision applied (Shortlisted)", applicant.id);
    }
  }

  if (action === "not-shortlist") {
    applicant.status = "Not Shortlisted";
    pushAudit(actorId, "Shortlisting decision applied (Not Shortlisted)", applicant.id);
  }

  if (action === "save-interview") {
    const value = Number(document.getElementById("interview-score")?.value);
    if (Number.isFinite(value) && (applicant.status === "Shortlisted" || applicant.status === "Interviewed")) {
      applicant.interviewScore = Math.max(0, Math.min(10, value));
      applicant.status = "Interviewed";
      pushAudit(actorId, "Interview score submitted", applicant.id);
    }
  }

  if (action === "save-final") {
    const value = document.getElementById("final-decision")?.value;
    if (value && isReadyForFinal(applicant)) {
      applicant.finalDecision = value;
      applicant.status = `Final: ${value}`;
      pushAudit(actorId, `Final decision saved (${value})`, applicant.id);
    }
  }

  if (action === "mock-emails") {
    if (applicant.finalDecision) {
      pushAudit(actorId, `Result emails generated (${applicant.finalDecision})`, applicant.id);
      alert(`Mock emails generated for ${applicant.name} (${applicant.finalDecision}).`);
    }
  }

  renderQueue();
  renderDetail();
  renderScorecard();
  renderAuditLog();
});

eligibilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(eligibilityForm);
  const eligible = [...data.values()].every((value) => value === "yes");

  eligibilityResult.className = eligible ? "status-box success" : "status-box error";
  eligibilityResult.textContent = eligible
    ? "Eligible to proceed. In the full system, the applicant would continue to the full form and required uploads."
    : "Not eligible to apply. The process stops here, while still reserving an application number for statistics.";
});

renderScorecard();
renderRoleSelector();
renderQueue();
renderDetail();
renderAuditLog();
