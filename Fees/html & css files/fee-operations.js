(() => {
  const { renderBars, formatMoney, dateLabel, daysBefore, openMessageDraft } = window.WorkspaceOperations;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Kolkata" });
  const panel = document.getElementById("fee-operations");
  const months = [52350, 68020, 59240, 75160, 69230, 81490];
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });
  renderBars(document.getElementById("monthly-fees-chart"), months.map((value, index) => {
    const date = new Date(today);
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + index - months.length + 1);
    return { label: monthLabel.format(date), value };
  }), formatMoney);

  const modes = [
    { label: "UPI", amount: 22400 },
    { label: "Cash", amount: 9240 },
    { label: "Cheque", amount: 4500 }
  ];
  const total = modes.reduce((sum, { amount }) => sum + amount, 0);
  document.getElementById("fee-payment-split").replaceChildren(...modes.map(({ label, amount }) => {
    const row = document.createElement("div");
    const name = document.createElement("dt");
    name.textContent = label;
    const value = document.createElement("dd");
    value.textContent = formatMoney(amount);
    const progress = document.createElement("progress");
    progress.value = amount;
    progress.max = total;
    progress.setAttribute("aria-label", `${label} share of today’s receipts`);
    value.append(progress);
    row.append(name, value);
    return row;
  }));

  function createRow(values, action) {
    const row = document.createElement("tr");
    for (const value of [...values, action]) {
      const cell = row.insertCell();
      cell.append(value);
    }
    return row;
  }

  function actionButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "operations-button secondary";
    button.textContent = label;
    return button;
  }

  const overdue = [
    { student: "Demo student A", className: "V · A", days: 4, amount: 4800 },
    { student: "Demo student B", className: "VII · B", days: 8, amount: 3250 },
    { student: "Demo student C", className: "IX · A", days: 12, amount: 6200 }
  ];
  document.getElementById("overdue-fees-list").replaceChildren(...overdue.map((record) => {
    const dueDate = dateLabel(daysBefore(today, record.days));
    const button = actionButton("Send reminder");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", `Send reminder for ${record.student}`);
    button.addEventListener("click", () => {
      openMessageDraft("Fee reminder",
        "Dear Parent, this is a reminder to check your child’s outstanding school fees. Please contact the school office to confirm the balance and payment options. — Tunbridge High School",
        (channel) => {
          document.getElementById("fee-reminder-status").textContent = `Draft handed off to ${channel} for review.`;
        });
    });
    return createRow([record.student, record.className, dueDate, formatMoney(record.amount)], button);
  }));

  const receipts = modes.map(({ label, amount }, index) => ({
    id: `DEMO-10${index + 1}`, date: today, method: label, amount
  }));
  document.getElementById("fee-receipt-list").replaceChildren(...receipts.map((receipt) => {
    const download = actionButton("Download receipt");
    download.setAttribute("aria-label", `Download demo receipt ${receipt.id}`);
    download.addEventListener("click", () => {
      const content = [
        "Tunbridge High School", "DEMO FEE RECEIPT", "",
        `Receipt: ${receipt.id}`, `Date: ${receipt.date}`,
        `Method: ${receipt.method}`, `Amount: ${formatMoney(receipt.amount)}`, "",
        "Demonstration only. This document is not proof of payment."
      ].join("\n");
      const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${receipt.id}.txt`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    return createRow([receipt.id, dateLabel(receipt.date), receipt.method, formatMoney(receipt.amount)], download);
  }));

  // Set data-payment-url to the school's approved HTTPS payment page.
  try {
    const paymentUrl = new URL(panel.dataset.paymentUrl);
    if (paymentUrl.protocol === "https:") {
      const paymentLink = document.getElementById("fee-payment-link");
      paymentLink.href = paymentUrl.href;
      paymentLink.hidden = false;
      document.getElementById("fee-payment-note").hidden = true;
    }
  } catch {
    // An empty or invalid setting leaves checkout unavailable.
  }
})();
