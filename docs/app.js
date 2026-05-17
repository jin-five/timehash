(function () {
  const timehash = new Timehash();
  const form = document.querySelector("#timehash-form");
  const startInput = document.querySelector("#start-time");
  const endInput = document.querySelector("#end-time");
  const queryInput = document.querySelector("#query-time");
  const indexKeysEl = document.querySelector("#index-keys");
  const queryKeysEl = document.querySelector("#query-keys");
  const minuteCountEl = document.querySelector("#minute-count");
  const termCountEl = document.querySelector("#term-count");
  const reductionEl = document.querySelector("#reduction");
  const matchStateEl = document.querySelector("#match-state");
  const codeOutputEl = document.querySelector("#code-output");

  function toHHMM(value) {
    return value.replace(":", "");
  }

  function formatTimeValue(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  function isValidTime(value) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }
    const [hours, minutes] = value.split(":").map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  function toMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function renderChips(target, keys, matchedKeys, className) {
    target.replaceChildren();
    keys.forEach((key) => {
      const chip = document.createElement("span");
      chip.className = ["chip", className, matchedKeys.has(key) ? "match" : ""]
        .filter(Boolean)
        .join(" ");
      chip.textContent = key;
      target.appendChild(chip);
    });
  }

  function updateDemo() {
    const start = startInput.value;
    const end = endInput.value;
    const query = queryInput.value;

    if (![start, end, query].every(isValidTime)) {
      matchStateEl.textContent = "No";
      codeOutputEl.textContent = "Use HH:MM times from 00:00 to 23:59.";
      indexKeysEl.replaceChildren();
      queryKeysEl.replaceChildren();
      minuteCountEl.textContent = "0";
      termCountEl.textContent = "0";
      reductionEl.textContent = "0%";
      return;
    }

    const startHHMM = toHHMM(start);
    const endHHMM = toHHMM(end);
    const queryHHMM = Number(toHHMM(query));
    const minuteCount = Math.max(0, toMinutes(end) - toMinutes(start));

    if (minuteCount <= 0) {
      matchStateEl.textContent = "No";
      codeOutputEl.textContent = "Use a same-day time range where close is after open.";
      indexKeysEl.replaceChildren();
      queryKeysEl.replaceChildren();
      minuteCountEl.textContent = "0";
      termCountEl.textContent = "0";
      reductionEl.textContent = "0%";
      return;
    }

    const indexKeys = timehash.getIndexTerms(startHHMM, endHHMM);
    const queryKeys = timehash.getQueryTerms(queryHHMM);
    const indexSet = new Set(indexKeys);
    const matched = new Set(queryKeys.filter((key) => indexSet.has(key)));
    const isMatch = matched.size > 0;
    const reduction = ((1 - indexKeys.length / minuteCount) * 100).toFixed(1);

    minuteCountEl.textContent = String(minuteCount);
    termCountEl.textContent = String(indexKeys.length);
    reductionEl.textContent = `${reduction}%`;
    matchStateEl.textContent = isMatch ? "Yes" : "No";

    renderChips(indexKeysEl, indexKeys, matched, "");
    renderChips(queryKeysEl, queryKeys, matched, "query");

    codeOutputEl.textContent = [
      `const th = new Timehash();`,
      `const indexKeys = th.getIndexTerms("${startHHMM}", "${endHHMM}");`,
      `const queryKeys = th.getQueryTerms(${queryHHMM});`,
      `const isOpen = queryKeys.some((key) => indexKeys.includes(key));`,
      ``,
      `// isOpen === ${isMatch}`,
    ].join("\n");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateDemo();
  });

  [startInput, endInput, queryInput].forEach((input) => {
    input.addEventListener("input", () => {
      const formatted = formatTimeValue(input.value);
      if (input.value !== formatted) {
        input.value = formatted;
      }
      updateDemo();
    });
  });

  updateDemo();
})();
