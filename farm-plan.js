document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch("data/farm-plan.txt");
  const data = await response.json();

  // 夏季與春季相同，用 same 指向要沿用的季節
  const seasons = data.seasons.map((s) =>
    s.same !== undefined ? { ...data.seasons[s.same], name: s.name } : s
  );
  const daysInSeason = 31;
  const areaNames = { gh: "溫室", field: "外田", log: "菇木" };

  // localStorage 讀寫（無痕模式等情況可能無法使用）
  function saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function getFromLocalStorage(key, defaultValue) {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  // 方案改版時換掉前綴，避免舊的勾選對到新的工作項目
  const taskKey = (s, d, j) => `farmPlanV4-${s}-${d}-${j}`;

  // 收成量：格數 × 每格期望值，稀有品以 1/3 計算
  function amount(cropName, n) {
    const crop = data.crops[cropName];
    const total = Math.round(n * crop.yield);
    return (
      `約 ${total} ${crop.unit}` +
      (crop.rare ? `（稀有約 ${Math.round(total / 3)}）` : "")
    );
  }

  // 第 s 天種下（同作物分組錯開，每天播種不超過 54 格），之後每隔生長天數收成並補種；
  // 季末來不及再收的就改種 then 或空著。add 的第 4 個參數是當天播種格數
  function cropTasks(area, plot, day, add) {
    const { grow, seed } = data.crops[plot.crop];
    const start = plot.s || 1;
    if (day === start) {
      add(area, `種植 ${plot.crop} ${plot.n} 格`, seed, plot.n);
      return;
    }
    const harvests = [];
    for (let h = start + grow; h <= daysInSeason; h += grow) harvests.push(h);
    const last = harvests[harvests.length - 1];
    const thenGrow = plot.then ? data.crops[plot.then].grow : 0;

    if (harvests.includes(day)) {
      if (day + grow <= daysInSeason) {
        add(
          area,
          `收成並補種 ${plot.crop} ${plot.n} 格`,
          `${amount(plot.crop, plot.n)}；${seed}`,
          plot.n
        );
      } else if (plot.then && day + thenGrow <= daysInSeason) {
        add(
          area,
          `收成 ${plot.crop} ${plot.n} 格，改種${plot.then}`,
          `${amount(plot.crop, plot.n)}；${plot.then}第 ${day + thenGrow} 天收`,
          plot.n
        );
      } else {
        add(
          area,
          `收成 ${plot.crop} ${plot.n} 格`,
          amount(plot.crop, plot.n) + (day < daysInSeason ? "，之後空著到換季" : "")
        );
      }
    } else if (plot.then && day === last + thenGrow) {
      add(
        area,
        `收成 ${plot.crop}格的${plot.then} ${plot.n} 格`,
        amount(plot.then, plot.n) + "，之後空著到換季"
      );
    }
  }

  function tasksFor(s, day) {
    const tasks = [];
    const add = (area, text, note, sow = 0) => tasks.push({ area, text, note, sow });
    seasons[s].greenhouse.forEach((plot) => cropTasks("gh", plot, day, add));
    seasons[s].field.forEach((plot) => cropTasks("field", plot, day, add));

    // 菇木不算進每天播種格數
    const m = data.mushroom;
    const perHarvest = `${m.logs * m.yield} 朵`;
    if (day === 1) add("log", `種植 ${m.crop} ${m.logs} 個種菇木`, `每個種菇木用 ${m.seed} 顆種子`);
    else if ((day - 1) % m.grow === 0) {
      if (day + m.grow <= daysInSeason)
        add("log", `收成並補種 ${m.crop}`, `${perHarvest}；留 ${m.logs * m.seed} 朵當種子`);
      else add("log", `收成 ${m.crop}`, perHarvest);
    }
    return tasks;
  }

  // 季節配置
  function showSummary(s) {
    const plan = seasons[s];
    // 同作物的分組合併成一項，括號列出各組的開始日
    const list = (plots) => {
      const groups = new Map();
      plots.forEach((p) => groups.set(p.crop, (groups.get(p.crop) || []).concat(p)));
      return [...groups]
        .map(([crop, ps]) => {
          const total = ps.reduce((t, p) => t + p.n, 0);
          const starts =
            ps.length > 1
              ? ps.map((p) => `${p.n} 格第 ${p.s || 1} 天`).join("，")
              : `第 ${ps[0].s || 1} 天開始`;
          return `${crop} ${total} 格（${starts}）`;
        })
        .join("、");
    };
    document.getElementById("plan-summary").innerHTML = `
      <div class="plan-cards">
        <div class="cooking-card">
          <h3>${plan.name}季配置</h3>
          <ul>
            <li>溫室：${list(plan.greenhouse)}</li>
            <li>外田：${list(plan.field)}</li>
            ${plan.spare ? `<li>${plan.spare}</li>` : ""}
            <li>種菇木 ${data.mushroom.logs} 個：${data.mushroom.crop}</li>
            ${plan.storage ? `<li>倉庫：${plan.storage}</li>` : ""}
          </ul>
        </div>
        <div class="cooking-card">
          <h3>${plan.name}季預估收成</h3>
          <ul>${plan.yields.map((y) => `<li>${y}</li>`).join("")}</ul>
        </div>
        <div class="cooking-card">
          <h3>${plan.name}季料理（7 星收入${plan.income}）</h3>
          <p class="item-note">${plan.incomeDetail}</p>
          <ul>
            ${plan.dishes
              .map(
                (d) =>
                  `<li>${d.name} ${d.season} 份（每週 ${d.weekly}）${
                    d.note ? `<span class="item-note">${d.note}</span>` : ""
                  }</li>`
              )
              .join("")}
            <li>直接賣：${plan.sell}</li>
          </ul>
        </div>
        <div class="cooking-card">
          <h3>${plan.name}季畜產加工</h3>
          <p class="item-note">${plan.livestock.weekly}</p>
          <ul>${plan.livestock.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        </div>
      </div>
    `;
  }

  // 逐日工作卡片
  const todayInput = document.getElementById("schedule-today");
  const progress = document.getElementById("schedule-progress");

  function updateProgress(s) {
    let total = 0;
    let done = 0;
    for (let d = 1; d <= daysInSeason; d++) {
      tasksFor(s, d).forEach((_, j) => {
        total++;
        if (getFromLocalStorage(taskKey(s, d, j), false)) done++;
      });
    }
    progress.textContent = `本季完成 ${done} / ${total} 項`;
  }

  function markToday() {
    document
      .querySelectorAll(".schedule-day")
      .forEach((el) =>
        el.classList.toggle("today", el.id === `day-${todayInput.value}`)
      );
  }

  function showSchedule(s) {
    const container = document.getElementById("schedule-days");
    container.innerHTML = "";
    for (let d = 1; d <= daysInSeason; d++) {
      const tasks = tasksFor(s, d);
      const sow = tasks.reduce((t, task) => t + task.sow, 0);
      const card = document.createElement("div");
      card.className = "schedule-day" + (tasks.length ? "" : " quiet");
      card.id = `day-${d}`;
      card.innerHTML = `<div class="schedule-day-title"><b>第 ${d} 天</b><span>${
        seasons[s].name
      }季・第 ${Math.ceil(d / 7)} 週${sow ? `・播種 ${sow} 格` : ""}</span></div>`;
      if (!tasks.length)
        card.insertAdjacentHTML("beforeend", `<div class="schedule-water">只要澆水 2 次</div>`);

      tasks.forEach((task, j) => {
        const id = taskKey(s, d, j);
        const checked = getFromLocalStorage(id, false);
        const row = document.createElement("label");
        row.className = "schedule-task" + (checked ? " done" : "");
        row.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""}>
          <span class="area-tag ${task.area}">${areaNames[task.area]}</span>
          <span>${task.text}${task.note ? `<small>${task.note}</small>` : ""}</span>`;
        row.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) saveToLocalStorage(id, true);
          else removeFromLocalStorage(id);
          row.classList.toggle("done", e.target.checked);
          updateProgress(s);
        });
        card.appendChild(row);
      });
      container.appendChild(card);
    }
    markToday();
    updateProgress(s);
  }

  // 季節分頁
  const seasonButtons = document.querySelectorAll("#plan-season-tabs button");
  let currentSeason = getFromLocalStorage("farmPlanSeason", 0);

  function showSeason() {
    saveToLocalStorage("farmPlanSeason", currentSeason);
    seasonButtons.forEach((button) =>
      button.classList.toggle("active", Number(button.dataset.season) === currentSeason)
    );
    showSummary(currentSeason);
    showSchedule(currentSeason);
  }

  seasonButtons.forEach((button) =>
    button.addEventListener("click", () => {
      currentSeason = Number(button.dataset.season);
      showSeason();
    })
  );

  // 今天第幾天
  todayInput.value = getFromLocalStorage("farmPlanToday", 1);
  todayInput.addEventListener("input", () => {
    const value = parseInt(todayInput.value, 10);
    if (value >= 1 && value <= daysInSeason) {
      saveToLocalStorage("farmPlanToday", value);
      markToday();
    }
  });
  document.getElementById("schedule-jump").addEventListener("click", () => {
    const el = document.getElementById(`day-${todayInput.value}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // 清除本季勾選：按兩次才執行，避免誤按
  const resetButton = document.getElementById("schedule-reset");
  let resetArmed = false;
  resetButton.addEventListener("click", () => {
    if (!resetArmed) {
      resetArmed = true;
      resetButton.textContent = "再按一次確認清除";
      setTimeout(() => {
        resetArmed = false;
        resetButton.textContent = "清除本季勾選";
      }, 4000);
      return;
    }
    for (let d = 1; d <= daysInSeason; d++)
      tasksFor(currentSeason, d).forEach((_, j) =>
        removeFromLocalStorage(taskKey(currentSeason, d, j))
      );
    resetArmed = false;
    resetButton.textContent = "清除本季勾選";
    showSchedule(currentSeason);
  });

  // 前提與結論、料理表
  document.getElementById("plan-basis").innerHTML = `
    <div class="plan-cards single-column">
      <div class="cooking-tip">
        <h3>前提條件</h3>
        <ul>${data.conditions.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="cooking-tip">
        <h3>畜產每季產量</h3>
        <ul>${data.livestockProduction.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="cooking-tip">
        <h3>風車產能有限時的優先順序</h3>
        <ul>${data.windmillPriority.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="cooking-tip">
        <h3>結論</h3>
        <ul>${data.conclusions.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="cooking-tip">
        <h3>排程規則</h3>
        <ul>
          <li>第 N 天種下、第 N＋生長天數那天收成，收成當天立刻補種</li>
          <li>同一種作物可分成幾組、錯開開始日，每天播種不超過 54 格（菇木不算）；開始日晚的組別可能少收一次</li>
          ${Object.entries(data.crops)
            .map(
              ([name, c]) =>
                `<li>${name}：生長 ${c.grow} 天，每格收 ${c.yield}，${c.seed}</li>`
            )
            .join("")}
          <li>稻米最後一次收成後，同一格春夏補種馬鈴薯、秋冬補種胡蘿蔔</li>
        </ul>
      </div>
    </div>
  `;

  document.getElementById("plan-recipes").innerHTML = `
    <thead>
      <tr><th>料理</th><th>7 星售價</th><th>材料</th></tr>
    </thead>
    <tbody>
      ${data.recipes
        .map(
          (r) => `
        <tr>
          <td class="crop-label">${r.name}</td>
          <td>${typeof r.price === "number" ? r.price.toLocaleString() : r.price}</td>
          <td class="recipe-ingredients">${r.ingredients}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  `;

  showSeason();
});
