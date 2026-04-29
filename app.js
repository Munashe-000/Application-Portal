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
const auditLog = document.getElementById("audit-log");
const scorecardBody = document.querySelector("#scorecard-table tbody");
const tabs = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".tab-panel");
const eligibilityForm = document.getElementById("eligibility-form");
const eligibilityResult = document.getElementById("eligibility-result");

let currentRole = "essay";
let currentApplicantId = applicants[0].id;

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
}

function renderAuditLog() {
  auditLog.innerHTML = auditEvents.map((entry) => `<div class="list-item">${entry}</div>`).join("");
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
