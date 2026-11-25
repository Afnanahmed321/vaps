(() => {
  const scriptUrl = document.currentScript.src;
  const routes = {
    overview: "System%20Overview/html%20%26%20css%20files/index.html",
    applications: "Applications/html%20%26%20css%20files/application.html",
    students: "Students/html%20%26%20css%20files/students.html",
    teachers: "Teachers/html%20%26%20css%20files/teachers.html",
    reports: "Reports/html%20%26%20css%20files/reports.html",
    master: "Modules/Preconfiguration/Master/master.html",
    general: "Modules/Preconfiguration/General/general.html"
  };
  const routeUrl = (key) => new URL(routes[key], scriptUrl).href;
  const root = document.createElement("div");
  root.className = "site-assistant-root";
  root.innerHTML = `
    <button class="site-assistant-launcher" type="button" aria-label="Open Principal Assistant" aria-haspopup="dialog" aria-expanded="false">
      <span class="site-assistant-launcher-avatar" aria-hidden="true">
        <span class="site-assistant-bot-avatar">
          <span class="site-assistant-bot-antenna"></span>
          <span class="site-assistant-bot-ear site-assistant-bot-ear-left"></span>
          <span class="site-assistant-bot-ear site-assistant-bot-ear-right"></span>
          <span class="site-assistant-bot-body"></span>
          <span class="site-assistant-bot-head">
            <i class="site-assistant-bot-eye site-assistant-bot-eye-left"></i>
            <i class="site-assistant-bot-eye site-assistant-bot-eye-right"></i>
            <i class="site-assistant-bot-cheek site-assistant-bot-cheek-left"></i>
            <i class="site-assistant-bot-cheek site-assistant-bot-cheek-right"></i>
            <span class="site-assistant-bot-mouth"></span>
          </span>
        </span>
      </span>
      <span class="site-assistant-launcher-label">Principal Assistant</span>
    </button>
    <section class="site-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="site-assistant-title" hidden>
      <header class="site-assistant-header">
        <span class="site-assistant-avatar" aria-hidden="true">
          <span class="site-assistant-bot-avatar site-assistant-bot-avatar-header">
            <span class="site-assistant-bot-antenna"></span>
            <span class="site-assistant-bot-ear site-assistant-bot-ear-left"></span>
            <span class="site-assistant-bot-ear site-assistant-bot-ear-right"></span>
            <span class="site-assistant-bot-body"></span>
            <span class="site-assistant-bot-head">
              <i class="site-assistant-bot-eye site-assistant-bot-eye-left"></i>
              <i class="site-assistant-bot-eye site-assistant-bot-eye-right"></i>
              <i class="site-assistant-bot-cheek site-assistant-bot-cheek-left"></i>
              <i class="site-assistant-bot-cheek site-assistant-bot-cheek-right"></i>
              <span class="site-assistant-bot-mouth"></span>
            </span>
          </span>
        </span>
        <div class="site-assistant-heading">
          <h2 id="site-assistant-title">Principal Assistant</h2>
          <span><i></i> School workspace guide</span>
        </div>
        <button class="site-assistant-clear" type="button" aria-label="Start a new conversation" title="Start a new conversation"><i data-lucide="rotate-ccw"></i></button>
        <button class="site-assistant-close" type="button" aria-label="Close assistant"><i data-lucide="x"></i></button>
      </header>
      <div class="site-assistant-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <div class="site-assistant-disclaimer"><i data-lucide="info"></i><span>Site guide preview · Live school records are not connected</span></div>
      <div class="site-assistant-command-menu" id="site-assistant-command-menu" role="group" aria-label="Slash commands" hidden>
        <button type="button" class="site-assistant-command-option" data-command="/reports">
          <span class="site-assistant-command-copy"><strong>/reports</strong><small>Generate and save a report</small></span>
          <i data-lucide="chart-no-axes-column-increasing"></i>
        </button>
        <button type="button" class="site-assistant-command-option" data-command="/status">
          <span class="site-assistant-command-copy"><strong>/status</strong><small>Show student status</small></span>
          <i data-lucide="users-round"></i>
        </button>
      </div>
      <form class="site-assistant-composer">
        <label class="site-assistant-input-wrap">
          <span class="sr-only">Ask Principal Assistant</span>
          <textarea rows="1" maxlength="500" placeholder="Ask about any page or feature..." aria-autocomplete="list" aria-controls="site-assistant-command-menu" aria-expanded="false" required></textarea>
        </label>
        <button class="site-assistant-send" type="submit" aria-label="Send message"><i data-lucide="arrow-up"></i></button>
      </form>
      <p class="site-assistant-footnote">Enter to send <span>·</span> Shift + Enter for a new line</p>
    </section>
  `;
  document.body.append(root);

  const launcher = root.querySelector(".site-assistant-launcher");
  const panel = root.querySelector(".site-assistant-panel");
  const messages = root.querySelector(".site-assistant-messages");
  const composer = root.querySelector(".site-assistant-composer");
  const input = root.querySelector("textarea");
  const commandMenu = root.querySelector(".site-assistant-command-menu");
  const commandOptions = [...commandMenu.querySelectorAll("[data-command]")];
  const closeButton = root.querySelector(".site-assistant-close");
  const clearButton = root.querySelector(".site-assistant-clear");
  let responseTimer;
  let activeCommandIndex = 0;
  const reportStorageKey = "vaps.savedReports.v1";

  function currentPageLabel() {
    const path = decodeURIComponent(window.location.pathname).toLowerCase();
    if (path.includes("reports")) return "Reports";
    if (path.includes("students")) return "Students";
    if (path.includes("teachers")) return "Teachers";
    if (path.includes("applications")) return "Applications";
    if (path.includes("master")) return "Master Configuration";
    if (path.includes("general")) return "General Configuration";
    if (path.includes("system overview")) return "System Overview";
    return "your school workspace";
  }

  function createLinkList(links) {
    if (!links || !links.length) return null;
    const list = document.createElement("div");
    list.className = "site-assistant-links";
    links.forEach(({ key, label, reportId }) => {
      const link = document.createElement("a");
      const target = new URL(routes[key], scriptUrl);
      if (reportId) target.searchParams.set("report", reportId);
      link.href = target.href;
      link.className = "site-assistant-link";
      link.innerHTML = `<span>${label}</span><i data-lucide="arrow-up-right"></i>`;
      list.append(link);
    });
    return list;
  }

  function createPromptButtons(prompts) {
    if (!prompts || !prompts.length) return null;
    const list = document.createElement("div");
    list.className = "site-assistant-prompts";
    prompts.forEach((prompt) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "site-assistant-prompt";
      button.textContent = prompt;
      button.addEventListener("click", () => submitQuestion(prompt));
      list.append(button);
    });
    return list;
  }

  function scrollMessages() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addUserMessage(text) {
    const row = document.createElement("div");
    row.className = "site-assistant-message site-assistant-user-message";
    const bubble = document.createElement("p");
    bubble.className = "site-assistant-bubble";
    bubble.textContent = text;
    row.append(bubble);
    messages.append(row);
    scrollMessages();
  }

  function addAssistantMessage(response) {
    const row = document.createElement("div");
    row.className = "site-assistant-message site-assistant-bot-message";
    const avatar = document.createElement("span");
    avatar.className = "site-assistant-message-avatar";
    const avatarIcon = document.createElement("i");
    avatarIcon.dataset.lucide = "sparkles";
    avatar.append(avatarIcon);

    const content = document.createElement("div");
    content.className = "site-assistant-message-content";
    const bubble = document.createElement("div");
    bubble.className = "site-assistant-bubble";
    response.paragraphs.forEach((paragraph) => {
      const text = document.createElement("p");
      text.textContent = paragraph;
      bubble.append(text);
    });
    content.append(bubble);
    if (response.stats && response.stats.length) {
      const stats = document.createElement("div");
      stats.className = "site-assistant-status-stats";
      response.stats.forEach(({ label, value }) => {
        const stat = document.createElement("div");
        stat.className = "site-assistant-status-stat";
        const statValue = document.createElement("strong");
        statValue.textContent = value;
        const statLabel = document.createElement("span");
        statLabel.textContent = label;
        stat.append(statValue, statLabel);
        stats.append(stat);
      });
      content.append(stats);
    }

    const links = createLinkList(response.links);
    const prompts = createPromptButtons(response.prompts);
    if (links) content.append(links);
    if (prompts) content.append(prompts);
    row.append(avatar, content);
    messages.append(row);
    if (window.lucide) lucide.createIcons();
    scrollMessages();
  }

  function addTypingIndicator() {
    const row = document.createElement("div");
    row.className = "site-assistant-message site-assistant-bot-message site-assistant-typing";
    row.setAttribute("role", "status");
    row.setAttribute("aria-label", "Assistant is preparing a response");
    const avatar = document.createElement("span");
    avatar.className = "site-assistant-message-avatar";
    const icon = document.createElement("i");
    icon.dataset.lucide = "sparkles";
    avatar.append(icon);
    const bubble = document.createElement("span");
    bubble.className = "site-assistant-bubble";
    bubble.innerHTML = "<i></i><i></i><i></i>";
    row.append(avatar, bubble);
    messages.append(row);
    if (window.lucide) lucide.createIcons();
    scrollMessages();
    return row;
  }

  function makeResponse(paragraphs, links = [], prompts = [], stats = []) {
    return { paragraphs, links, prompts, stats };
  }

  function makeStudentStatusResponse() {
    return makeResponse([
      "Student status summary — demo data only. These figures are not connected to live school records or individual student profiles."
    ], [{ key: "students", label: "Open Students" }], [], [
      { label: "Enrolled", value: "104" },
      { label: "Present today", value: "98" },
      { label: "Absent today", value: "6" },
      { label: "Attendance", value: "94.2%" }
    ]);
  }

  function makeApplicationStatusResponse() {
    return makeResponse([
      "Application status summary — demo data only. These figures are not connected to live application records."
    ], [{ key: "applications", label: "Open Applications" }], [], [
      { label: "Applications", value: "18" },
      { label: "Reviewed", value: "12" },
      { label: "Awaiting action", value: "6" }
    ]);
  }

  function makeTeacherStatusResponse() {
    return makeResponse([
      "Teacher status summary — demo data only. These figures are not connected to live staff records."
    ], [{ key: "teachers", label: "Open Teachers" }], [], [
      { label: "Teachers", value: "80" },
      { label: "Present today", value: "76" },
      { label: "On leave", value: "4" }
    ]);
  }

  function getRequestedStatusResponse(query) {
    const text = query.toLocaleLowerCase();
    if (/\b(application|applications|applicant|applicants|admission|admissions)\b/.test(text)) {
      return makeApplicationStatusResponse();
    }
    if (/\b(teacher|teachers|staff|employee|employees)\b/.test(text)) {
      return makeTeacherStatusResponse();
    }
    if (/\b(student|students)\b/.test(text)) {
      return makeStudentStatusResponse();
    }
    return null;
  }

  function createAssistantReport(question) {
    const text = question.toLocaleLowerCase();
    let category = "overview";
    if (/\b(fee|fees|collection|collected|payment|payments|revenue|dues|money)\b/.test(text)) category = "finance";
    else if (/\b(attendance|absent|absence|present|late|tardy)\b/.test(text)) category = "attendance";
    else if (/\b(exam|exams|marks|grades|results|subject|subjects|academic|academics|performance|scores?)\b/.test(text)) category = "academics";
    else if (/\b(admission|admissions|application|applications|enquir(y|ies)|applicant)\b/.test(text)) category = "admissions";
    else if (/\b(staff|teacher|teachers|employee|employees|payroll|leave)\b/.test(text)) category = "staff";
    else if (/\b(student|students|enrollment|enrolment|class|classes|section|sections|roster)\b/.test(text)) category = "students";
    else if (/\b(bus|transport|hostel|supplies|library|facilit(y|ies)|operations)\b/.test(text)) category = "operations";

    const templates = {
      finance: {
        categoryLabel: "Fee Collection",
        icon: "wallet",
        metrics: [
          { label: "Collected today", value: "₹36,140", detail: "Demo figures" },
          { label: "Transactions", value: "42", detail: "Demo payments" },
          { label: "Outstanding", value: "₹12,800", detail: "Demo pending dues" }
        ],
        columns: ["Payment method", "Transactions", "Amount"],
        rows: [["UPI", "23", "₹17,200"], ["Card", "12", "₹11,700"], ["Cash", "7", "₹7,240"]],
        summary: "UPI is the leading payment method in this example. Review pending dues and follow up on unpaid balances."
      },
      attendance: {
        categoryLabel: "Attendance",
        icon: "calendar-check",
        metrics: [
          { label: "Attendance rate", value: "94.2%", detail: "Demo period" },
          { label: "Present", value: "98", detail: "Demo students" },
          { label: "Absent", value: "6", detail: "Demo students" }
        ],
        columns: ["Class group", "Present", "Absent", "Rate"],
        rows: [["Primary", "36", "2", "94.7%"], ["Middle", "34", "2", "94.4%"], ["Senior", "28", "2", "93.3%"]],
        summary: "Attendance is steady in this example. Check repeated absences and contact families where follow-up is needed."
      },
      academics: {
        categoryLabel: "Academic Performance",
        icon: "book-open-check",
        metrics: [
          { label: "Average score", value: "82%", detail: "Demo assessments" },
          { label: "Top subject", value: "Mathematics", detail: "Demo average: 88%" },
          { label: "Needs support", value: "7", detail: "Demo students" }
        ],
        columns: ["Subject", "Average score", "Students assessed", "Status"],
        rows: [["Mathematics", "88%", "34", "Strong"], ["Science", "83%", "35", "On track"], ["English", "76%", "35", "Review"]],
        summary: "Mathematics leads this example. English may benefit from targeted revision and additional student support."
      },
      admissions: {
        categoryLabel: "Admissions",
        icon: "user-round-plus",
        metrics: [
          { label: "Applications", value: "18", detail: "Demo figures for this week" },
          { label: "Reviewed", value: "12", detail: "Demo applications" },
          { label: "Awaiting action", value: "6", detail: "Demo applications" }
        ],
        columns: ["Application stage", "Applications", "Next step"],
        rows: [["Under review", "6", "Complete document checks"], ["Assessment", "4", "Schedule assessment"], ["Offer sent", "2", "Follow up with families"]],
        summary: "Six demo applications are awaiting action. Prioritize document checks and assessment scheduling."
      },
      staff: {
        categoryLabel: "Staff Overview",
        icon: "users-round",
        metrics: [
          { label: "Staff members", value: "80", detail: "Demo figures" },
          { label: "Present", value: "76", detail: "Demo figures for today" },
          { label: "On leave", value: "4", detail: "Demo figures for today" }
        ],
        columns: ["Department", "Staff", "Present", "On leave"],
        rows: [["Teaching", "52", "50", "2"], ["Administration", "16", "15", "1"], ["Support", "12", "11", "1"]],
        summary: "Most staff are present in this example. Review cover arrangements for teams with leave today."
      },
      students: {
        categoryLabel: "Student Enrollment",
        icon: "graduation-cap",
        metrics: [
          { label: "Students", value: "104", detail: "Across the demo school" },
          { label: "New this term", value: "6", detail: "Demo enrollments" },
          { label: "Class groups", value: "12", detail: "Demo figures" }
        ],
        columns: ["Class group", "Students", "New enrollments", "Change"],
        rows: [["Primary", "38", "3", "+2"], ["Middle", "36", "2", "+1"], ["Senior", "30", "1", "0"]],
        summary: "Enrollment is distributed across all three class groups in this example. Review class capacity before the next intake."
      },
      operations: {
        categoryLabel: "Operations",
        icon: "building-2",
        metrics: [
          { label: "Open items", value: "8", detail: "Demo operations" },
          { label: "Completed", value: "24", detail: "Demo figures for this week" },
          { label: "Needs attention", value: "3", detail: "Demo follow-up" }
        ],
        columns: ["Area", "Open items", "Status"],
        rows: [["Transport", "2", "On track"], ["Facilities", "3", "Review"], ["Library & supplies", "3", "On track"]],
        summary: "Three demo operational items may need follow-up. Review facilities requests and assign an owner to each open item."
      },
      overview: {
        categoryLabel: "School Overview",
        icon: "chart-no-axes-column-increasing",
        metrics: [
          { label: "Students", value: "104", detail: "Illustrative figure" },
          { label: "Teachers", value: "80", detail: "Illustrative figure" },
          { label: "Fee collection", value: "₹36,140", detail: "Illustrative figure" }
        ],
        columns: ["Area", "Indicator", "Demo value"],
        rows: [["Students", "Enrolled", "104"], ["Attendance", "Present today", "98"], ["Finance", "Collected today", "₹36,140"]],
        summary: "This overview combines demo enrollment, attendance, and finance indicators. Connect live school data for verified results."
      }
    };
    const template = templates[category];
    let period = { title: "Current", label: "Current demo period" };
    if (/\b(today|today's|todays)\b/.test(text)) period = { title: "Today's", label: "Today" };
    else if (/\b(yesterday|yesterday's)\b/.test(text)) period = { title: "Yesterday's", label: "Yesterday" };
    else if (/\b(this week|weekly|week)\b/.test(text)) period = { title: "This week's", label: "This week" };
    else if (/\b(this month|monthly|month)\b/.test(text)) period = { title: "This month's", label: "This month" };
    else if (/\b(this term|term)\b/.test(text)) period = { title: "This term's", label: "This term" };

    return {
      id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      categoryLabel: template.categoryLabel,
      icon: template.icon,
      title: `${period.title === "Current" ? "" : `${period.title} `}${template.categoryLabel}`,
      question,
      period: period.label,
      createdAt: new Date().toISOString(),
      metrics: template.metrics,
      columns: template.columns,
      rows: template.rows,
      summary: template.summary
    };
  }

  function saveAssistantReport(report) {
    try {
      const stored = window.localStorage.getItem(reportStorageKey);
      const existing = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(existing)) throw new TypeError("Saved reports must be a list.");
      window.localStorage.setItem(reportStorageKey, JSON.stringify([
        report,
        ...existing.filter((item) => item && item.id !== report.id)
      ]));
      window.dispatchEvent(new Event("vaps:report-saved"));
      return true;
    } catch (error) {
      console.error("Assistant report storage error:", error);
      return false;
    }
  }

  function getCommandResponse(question) {
    if (!question.startsWith("/")) return null;
    const match = question.match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
    if (!match || !/^(?:reports?|status)$/i.test(match[1])) {
      return makeResponse([
        "I don’t recognize that command. Try /reports to generate and save a report, or /status to view the student status summary."
      ]);
    }
    if (/^status$/i.test(match[1])) {
      return getRequestedStatusResponse(match[2] || "") || makeStudentStatusResponse();
    }

    const reportQuestion = match[2]?.trim() || "School overview report";
    const report = createAssistantReport(reportQuestion);
    if (!saveAssistantReport(report)) {
      return makeResponse([
        "I created the report preview, but couldn’t save it to Reports because browser storage is unavailable. Please check this browser’s storage permissions and try again."
      ], [{ key: "reports", label: "Open Reports" }]);
    }
    return makeResponse([
      `Report is ready: ${report.title} has been saved in Reports.`,
      "This report uses illustrative figures, not live school records."
    ], [{ key: "reports", label: "View report", reportId: report.id }]);
  }

  function getSiteResponse(question) {
    const text = question.toLocaleLowerCase();
    const reportsLink = { key: "reports", label: "Open Reports" };
    const studentLink = { key: "students", label: "Open Students" };
    const applicationLink = { key: "applications", label: "Open Applications" };
    const teacherLink = { key: "teachers", label: "Open Teachers" };
    const overviewLink = { key: "overview", label: "Open System Overview" };
    const settingsLinks = [
      { key: "master", label: "Master Configuration" },
      { key: "general", label: "General Configuration" }
    ];

    if (/\b(status|attendance|present|absent)\b/.test(text)) {
      const statusResponse = getRequestedStatusResponse(text);
      if (statusResponse) return statusResponse;
    }

    if (/\b(?:what(?:'s| is) (?:in|on) (?:the )?(?:site|website|system)|what all (?:is|are) (?:there )?(?:in|on) (?:the )?(?:site|website|system)|what can (?:i|you) do|website features|site features|all (?:the )?(?:pages|sections|modules)|what pages|what modules|show me (?:the )?(?:site|website)|tell me about (?:the )?(?:site|website)|overview of (?:the )?(?:site|website))\b/.test(text)) {
      return makeResponse([
        "VAPS brings the school's main workspace together: System Overview, Applications, Students, Teachers, Reports, and configuration pages.",
        "Operation Tools also groups Pre-Configuration, Preadmission, Admission, Fees, Exams, HRMS, and Front Office tools. I can guide you to a section or explain how to use it."
      ], [
        overviewLink,
        applicationLink,
        studentLink,
        teacherLink,
        reportsLink,
        ...settingsLinks
      ], ["How do I create a report?", "What is in Operation Tools?"]);
    }

    if (/\b(save|saved|saving|store|stored)\b/.test(text) && /\breport(s)?\b/.test(text)) {
      return makeResponse([
        "After a report is generated, select “Save report”. It will appear in the Saved Reports list and remain available in this browser on the Reports page.",
        "Reports currently use illustrative figures; live school data is not connected."
      ], [reportsLink], ["How do I create a report?"]);
    }

    if (/\b(report|reports|\/report|generate|create)\b/.test(text)) {
      return makeResponse([
        "In Principal Assistant, type /reports followed by your question—for example, “/reports fee collection today”—to generate and save a report automatically. You can also create a report on the Reports page and choose Save report.",
        "This preview builds reports from demo figures. It does not retrieve live school records."
      ], [reportsLink], ["What is the fee collection today?", "Show this week's attendance"]);
    }

    if (/\b(fee|fees|collection|collected|payment|payments|dues|finance|money)\b/.test(text)) {
      return makeResponse([
        "For a fee report, open Reports and ask a question such as “What is the fee collection today?”. You can save the generated preview to your Reports library.",
        "Fee Collection is also listed under Operation Tools → Fees. The current website preview is not connected to live transactions."
      ], [reportsLink, overviewLink], ["What is the fee collection today?"]);
    }

    if (/\b(student|students|class wise|class-wise|enrollment|enrolment|section|admission report)\b/.test(text)) {
      return makeResponse([
        "The Students page contains the Class Wise Student Details report builder. Choose an academic year, class, section, and fields, then generate or export the report.",
        "For a natural-language student summary, use the Reports page."
      ], [studentLink, reportsLink], ["How do I create a report?"]);
    }

    if (/\b(attendance|absent|absence|present|late|tardy)\b/.test(text)) {
      return makeResponse([
        "Ask for an attendance report on the Reports page—for example, “Show this week's attendance”. The generated view includes demo attendance indicators and a breakdown.",
        "Attendance figures are illustrative until the school data source is connected."
      ], [reportsLink], ["Show this week's attendance"]);
    }

    if (/\b(application|applications|applicant|enquir(y|ies)|preadmission)\b/.test(text)) {
      return makeResponse([
        "Applications has a report builder for selecting application classes and fields. For admissions pipeline questions, ask in Reports or open the Preadmission and Admission tools from Operation Tools."
      ], [applicationLink, reportsLink, overviewLink], ["How do I create a report?"]);
    }

    if (/\b(teacher|teachers|staff|employee|employees|hrms|payroll|leave)\b/.test(text)) {
      return makeResponse([
        "The Teachers page is the staff workspace. For a report-style summary, ask a question in Reports. HRMS tools such as employee directory, payroll, leave, and staff attendance are grouped under Operation Tools."
      ], [teacherLink, reportsLink, overviewLink], ["Show me the staff overview"]);
    }

    if (/\b(exam|exams|marks|grades|results|academic|academics|subject|subjects|performance|top student)\b/.test(text)) {
      return makeResponse([
        "Ask for academic results or performance on the Reports page. Exam setup tools are available from Operation Tools → Exam; report figures in this preview are demo data."
      ], [reportsLink, overviewLink], ["Summarize student performance"]);
    }

    if (/\b(master configuration|master settings|general configuration|general settings|pre-configuration|configuration|settings|transaction numbering|fee standard|exam standard|admission standard)\b/.test(text)) {
      return makeResponse([
        "Pre-Configuration contains Master Configuration, General Configuration, Transaction Numbering, Admission Standard, Fee Standard, Exam Standard, and Payroll Standard.",
        "Open a configuration page directly below, or find the same tools under Operation Tools → Pre Configuration."
      ], settingsLinks, ["What is in Operation Tools?"]);
    }

    if (/\b(operation tools|tools|modules|pre configuration|front office|transport|hostel|library|supplies)\b/.test(text)) {
      return makeResponse([
        "Operation Tools groups school workflows into Pre-Configuration, Preadmission, Admission, Fees, Exam, HRMS, and Front Office. Select a group to view its available tools."
      ], [overviewLink, reportsLink], ["What is in this website?"]);
    }

    if (/\b(help|how do i|how can i|where is|find|open|navigate)\b/.test(text)) {
      return makeResponse([
        `You’re on ${currentPageLabel()}. I can help with Reports, Applications, Students, Teachers, Operations, and configuration. Try asking about a feature or use one of the links below.`
      ], [overviewLink, studentLink, reportsLink, settingsLinks[0]], ["What is in this website?"]);
    }

    return makeResponse([
      "I can help you find and use the website’s sections, including System Overview, Applications, Students, Teachers, Reports, and Pre-Configuration.",
      "Tell me which area you mean, or ask “What is in this website?” for a quick guide. Live school records and an external AI service are not connected."
    ], [overviewLink, applicationLink, studentLink, teacherLink, reportsLink], ["What is in this website?"]);
  }

  function setCommandMenuVisible(visible) {
    commandMenu.hidden = !visible;
    input.setAttribute("aria-expanded", String(visible));
    if (!visible) {
      commandOptions.forEach((option) => {
        option.hidden = false;
        option.classList.remove("is-active");
      });
    }
  }

  function updateCommandMenu() {
    const token = input.value.trimStart();
    if (!/^\/[a-z]*$/i.test(token)) {
      setCommandMenuVisible(false);
      return;
    }
    const matchingOptions = commandOptions.filter((option) => (
      option.dataset.command.startsWith(token.toLocaleLowerCase())
    ));
    commandOptions.forEach((option) => {
      option.hidden = !matchingOptions.includes(option);
      option.classList.remove("is-active");
    });
    activeCommandIndex = 0;
    if (!matchingOptions.length) {
      setCommandMenuVisible(false);
      return;
    }
    setCommandMenuVisible(true);
    matchingOptions[activeCommandIndex].classList.add("is-active");
  }

  function chooseCommand(option) {
    input.value = `${option.dataset.command} `;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function moveCommandSelection(direction) {
    const visibleOptions = commandOptions.filter((option) => !option.hidden);
    if (!visibleOptions.length) return;
    visibleOptions[activeCommandIndex].classList.remove("is-active");
    activeCommandIndex = (activeCommandIndex + direction + visibleOptions.length) % visibleOptions.length;
    visibleOptions[activeCommandIndex].classList.add("is-active");
  }

  function submitQuestion(rawQuestion) {
    const question = rawQuestion.trim();
    if (!question) return;
    window.clearTimeout(responseTimer);
    addUserMessage(question);
    input.value = "";
    input.style.height = "";
    setCommandMenuVisible(false);
    const typing = addTypingIndicator();
    responseTimer = window.setTimeout(() => {
      typing.remove();
      const commandResponse = getCommandResponse(question);
      addAssistantMessage(commandResponse || getSiteResponse(question));
    }, 620);
  }

  function resetConversation() {
    window.clearTimeout(responseTimer);
    messages.replaceChildren();
    const welcome = document.createElement("div");
    welcome.className = "site-assistant-message site-assistant-bot-message";
    const avatar = document.createElement("span");
    avatar.className = "site-assistant-message-avatar";
    const icon = document.createElement("i");
    icon.dataset.lucide = "sparkles";
    avatar.append(icon);
    const content = document.createElement("div");
    content.className = "site-assistant-message-content";
    const bubble = document.createElement("div");
    bubble.className = "site-assistant-bubble";
    const greeting = document.createElement("p");
    greeting.textContent = `Hi! You’re on ${currentPageLabel()}. I can help you explore the school workspace and explain how its tools work. What would you like to find?`;
    bubble.append(greeting);
    content.append(bubble);
    const prompts = createPromptButtons(["What is in this website?", "How do I create a report?", "Find student reports"]);
    content.append(prompts);
    welcome.append(avatar, content);
    messages.append(welcome);
    if (window.lucide) lucide.createIcons();
    scrollMessages();
  }

  launcher.addEventListener("click", () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    launcher.setAttribute("aria-expanded", String(opening));
    launcher.setAttribute("aria-label", opening ? "Close Principal Assistant" : "Open Principal Assistant");
    if (opening) {
      input.focus();
      scrollMessages();
    }
  });

  closeButton.addEventListener("click", () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open Principal Assistant");
    launcher.focus();
  });

  clearButton.addEventListener("click", resetConversation);

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (!commandMenu.hidden && event.key === "ArrowDown") {
      event.preventDefault();
      moveCommandSelection(1);
      return;
    }
    if (!commandMenu.hidden && event.key === "ArrowUp") {
      event.preventDefault();
      moveCommandSelection(-1);
      return;
    }
    if (!commandMenu.hidden && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setCommandMenuVisible(false);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!commandMenu.hidden) {
        const visibleOptions = commandOptions.filter((option) => !option.hidden);
        const selectedOption = visibleOptions[activeCommandIndex];
        if (selectedOption) {
          if (input.value.trim().toLocaleLowerCase() === selectedOption.dataset.command) {
            composer.requestSubmit();
          } else {
            chooseCommand(selectedOption);
          }
          return;
        }
      }
      composer.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 100)}px`;
    updateCommandMenu();
  });

  commandOptions.forEach((option) => {
    option.addEventListener("click", () => chooseCommand(option));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open Principal Assistant");
      launcher.focus();
    }
  });

  resetConversation();
  if (window.lucide) lucide.createIcons();
})();
