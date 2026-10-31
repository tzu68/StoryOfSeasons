document.addEventListener("DOMContentLoaded", async () => {
  const wrapper = document.createElement("div");
  wrapper.id = "calendar-info-wrapper";

  const calendarContainer = document.getElementById("interactive-calendar");
  const parent = calendarContainer.parentElement;

  // 控制選單容器
  const controls = document.createElement("div");
  controls.id = "controls";

  const yearSelect = document.createElement("select");
  for (let year = 1; year <= 5; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `第 ${year} 年`;
    yearSelect.appendChild(option);
  }

  const seasonSelect = document.createElement("select");
  ["春", "夏", "秋", "冬"].forEach((season, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = season;
    seasonSelect.appendChild(option);
  });

  controls.appendChild(yearSelect);
  controls.appendChild(seasonSelect);

  // 先附加控制選單
  parent.appendChild(controls);

  // 包裹行事曆與資訊區塊
  wrapper.appendChild(calendarContainer);

  const infoContainer = document.createElement("div");
  infoContainer.id = "info-container";
  infoContainer.innerHTML = "<p>請點擊行事曆中的生日以查看居民資訊</p>";
  wrapper.appendChild(infoContainer);

  parent.appendChild(wrapper);

  // 節日與居民生日資料
  const events = [];

  const seasons = ["春", "夏", "秋", "冬"];
  const daysInSeason = 31; // 每季固定31天
  const firstDayOfYear = 6; // 第一年的春1日是周六 (0: 周日, 6: 周六)

  // 計算某年某季第1天是星期幾
  function getFirstDayOfSeason(year, seasonIndex) {
    return (
      (firstDayOfYear + (year - 1) * daysInSeason * 4 + seasonIndex * daysInSeason) % 7
    ); // 每年4季，每季31天
  }

  function formatDate(year, seasonIndex, day) {
    return `${year}-${String(seasonIndex + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  }
  /*const weekdays = ["日", "一", "二", "三", "四", "五", "六"];*/

  const weekdays = [
    {
      text: "日",
      bgImg: "images/background/sunday_background.png",
    },
    {
      text: "一",
      bgImg: "images/background/normal_background.png",
    },
    {
      text: "二",
      bgImg: "images/background/normal_background.png",
    },
    {
      text: "三",
      bgImg: "images/background/normal_background.png",
    },
    {
      text: "四",
      bgImg: "images/background/normal_background.png",
    },
    {
      text: "五",
      bgImg: "images/background/normal_background.png",
    },
    {
      text: "六",
      bgImg: "images/background/saturday_background.png",
    },
  ];

  // 讀取居民資料
  async function loadResidents() {
    const response = await fetch("data/people.txt");
    const residents = await response.json();

    residents.forEach((resident) => {
      const seasonIndex = seasons.indexOf(resident.birthday.season);
      if (seasonIndex !== -1) {
        for (let year = 1; year <= 5; year++) {
          const formattedDate = `${year}-${String(seasonIndex + 1).padStart(
            2,
            "0"
          )}-${String(resident.birthday.day).padStart(2, "0")}`;
          events.push({
            date: formattedDate,
            name: `${resident.name}`,
            type: "birthday",
            picture: resident.picture,
            color: resident.color,
            resident,
          });
        }
      }
    });

    return residents;
  }

  // 居民詳細資訊（行事曆與居民卡片共用）
  function residentDetailHTML(resident, keyword = "") {
    // 標示搜尋關鍵字，方便分辨是出現在喜歡還是討厭
    const highlight = (text) =>
      keyword ? text.split(keyword).join(`<mark>${keyword}</mark>`) : text;
    const section = (className, title, content) =>
      content
        ? `<p class="${className}">${title}</p><p>${highlight(content)}</p>`
        : "";

    return `
      ${section(
        "normal",
        "生日",
        `${resident.birthday.season} ${resident.birthday.day}日`
      )}
      ${section("favorite", "最喜歡", resident.favorite)}
      ${
        resident.favoriteFrom
          ? `<p class="detail-note">取得方式：${resident.favoriteFrom}</p>`
          : ""
      }
      ${section("like", "喜歡", resident.likes.join(", "))}
      ${section("dislike", "討厭", resident.dislikes.join(", "))}
      ${section("dislike", "最討厭", resident.mostDisliked)}
      ${section("normal", "主要地點", (resident.places || []).join("、"))}
      ${section("normal", "外出時間", (resident.outings || []).join("<br>"))}
      ${section("normal", "喜歡的顏色", resident.color)}
    `;
  }

  // 讀取節日資料，依年份計算實際日期
  // week + date：該季第 week 個「星期X」，after：再往後幾天，day：固定日期
  async function loadFestivals() {
    const response = await fetch("data/Event.txt");
    const festivals = await response.json();

    festivals.forEach((festival) => {
      const seasonIndex = seasons.indexOf(festival.season.replace("季", ""));
      if (seasonIndex === -1) return;

      for (let year = 1; year <= 5; year++) {
        let day = festival.day;
        if (!day) {
          const weekday = weekdays.findIndex(
            (w) => festival.date === `星期${w.text}`
          );
          const firstDayOfSeason = getFirstDayOfSeason(year, seasonIndex);
          day =
            1 +
            ((weekday - firstDayOfSeason + 7) % 7) +
            (festival.week - 1) * 7 +
            (festival.after || 0);
        }
        if (day > daysInSeason) continue;

        events.push({
          date: formatDate(year, seasonIndex, day),
          name: festival.event,
          type: "festival",
          time: festival.time,
        });
      }
    });
  }

  // 初始化行事曆
  async function generateCalendar(year, seasonIndex) {
    calendarContainer.innerHTML = ""; // 清空行事曆

    const firstDayOfSeason = getFirstDayOfSeason(year, seasonIndex);

    // 建立行事曆表格
    const calendarGrid = document.createElement("div");
    calendarGrid.style.display = "grid";
    calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
    calendarGrid.style.gap = "0.5rem";

    // 添加星期標題
    weekdays.forEach((weekday) => {
      const weekdayCell = document.createElement("div");
      weekdayCell.textContent = weekday.text;
      weekdayCell.style.backgroundImage = `url(${weekday.bgImg})`;

      weekdayCell.classList.add("weekday-cell");
      calendarGrid.appendChild(weekdayCell);
    });

    // 填入空白日期（對齊）
    for (let i = 0; i < firstDayOfSeason; i++) {
      const emptyCell = document.createElement("div");
      calendarGrid.appendChild(emptyCell);
    }

    // 填入日期
    for (let day = 1; day <= daysInSeason; day++) {
      const dateCell = document.createElement("div");
      const formattedDate = formatDate(year, seasonIndex, day);

      dateCell.textContent = day;
      dateCell.classList.add("dateCell");

      // 檢查是否有節日或生日（同一天可能有多個）
      const dayEvents = events.filter((e) => e.date === formattedDate);
      const festivals = dayEvents.filter((e) => e.type === "festival");
      const birthdays = dayEvents.filter((e) => e.type === "birthday");

      festivals.forEach((event) => {
        dateCell.style.backgroundColor = "#ffeb3b"; // 節日顏色

        // 顯示節日名稱
        const festivalLabel = document.createElement("span");
        festivalLabel.className = "festival-label";
        festivalLabel.textContent = event.name;
        dateCell.appendChild(festivalLabel);
      });

      birthdays.forEach((event) => {
        // 根據居民喜歡的顏色設置背景色（節日優先）
        if (festivals.length === 0) {
          if (event.color === "Yellow") {
            dateCell.style.backgroundColor = "#FFFF93";
          } else if (event.color === "Blue") {
            dateCell.style.backgroundColor = "#ACD6FF";
          } else if (event.color === "Red") {
            dateCell.style.backgroundColor = "#ffccbc"; // 保持紅色
          }
        }

        // 顯示居民圖片
        const eventImage = document.createElement("img");
        eventImage.src = `images/people/${event.picture}`;
        eventImage.alt = event.name;
        eventImage.style.display = "block";
        eventImage.style.margin = "0.5rem auto 0";
        eventImage.style.width = "50px";
        eventImage.style.height = "50px";
        eventImage.style.borderRadius = "10px";
        dateCell.appendChild(eventImage);
      });

      if (dayEvents.length > 0) {
        dateCell.style.cursor = "pointer";

        // 點擊事件顯示節日與居民資訊
        dateCell.addEventListener("click", () => {
          infoContainer.innerHTML =
            festivals
              .map(
                (event) => `
                            <p class="event-name">${event.name}</p>
                            <div>
                                <p class="normal">時間</p>
                                <p>${event.time}</p>
                            </div>
                        `
              )
              .join("") +
            birthdays
              .map(
                (event) => `
                            <p class="event-name">${event.name}</p>
                            <img src="images/people/${event.picture}" alt="${
                  event.name
                }" style="width:100px;height:100px;border-radius:20px;display:block;margin:0 auto;"/>
                            ${residentDetailHTML(event.resident)}
                        `
              )
              .join("");
        });

        dateCell.title = dayEvents.map((e) => e.name).join("、"); // 顯示提示文字
      }

      calendarGrid.appendChild(dateCell);
    }

    calendarContainer.appendChild(calendarGrid);
  }

  // 居民送禮資訊區塊功能
  function loadResidentCards(residents) {
    const residentCardsContainer = document.getElementById("resident-cards");
    const filterButtons = document.querySelectorAll(
      "#resident-filter-tabs button"
    );
    const searchInput = document.getElementById("resident-search");

    let currentFilter = getFromLocalStorage("residentFilter", "all");

    function showResidents() {
      saveToLocalStorage("residentFilter", currentFilter);
      filterButtons.forEach((button) =>
        button.classList.toggle(
          "active",
          button.dataset.filter === currentFilter
        )
      );

      // 依結婚候補篩選，再依關鍵字搜尋姓名與送禮資訊
      const keyword = searchInput.value.trim();
      const list = residents.filter((resident) => {
        if (currentFilter === "married" && !resident.married) return false;
        if (currentFilter === "others" && resident.married) return false;
        if (!keyword) return true;
        return [
          resident.name,
          resident.favorite,
          resident.mostDisliked,
          ...resident.likes,
          ...resident.dislikes,
        ].some((text) => text && text.includes(keyword));
      });

      residentCardsContainer.innerHTML = list.length
        ? ""
        : "<p>找不到符合的居民</p>"; // 清空內容

      list.forEach((resident) => {
        const card = document.createElement("div");
        card.className = "resident-card";
        card.setAttribute("data-color", resident.color); // 設置顏色屬性

        card.innerHTML = `
          <img src="images/people/${resident.picture}" alt="${
          resident.name
        }" style="width:100px;height:100px;border-radius:30px;display:block;margin:0 auto;"/>
          <h3 class="event-name">${resident.name}</h3>
          ${residentDetailHTML(resident, keyword)}
        `;

        residentCardsContainer.appendChild(card);
      });
    }

    filterButtons.forEach((button) =>
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        showResidents();
      })
    );
    searchInput.addEventListener("input", showResidents);

    showResidents();
  }

  // 賺錢料理區塊功能
  async function loadCookingGuide() {
    const response = await fetch("data/cooking.txt");
    const guide = await response.json();

    document.getElementById("cooking-source").innerHTML = `資料整理自 ${guide.source.author}：<a href="${guide.source.url}" target="_blank" rel="noopener">${guide.source.title}</a>`;

    const cookingCardsContainer = document.getElementById("cooking-cards");
    cookingCardsContainer.innerHTML = ""; // 清空內容

    guide.dishes.forEach((dish) => {
      const card = document.createElement("div");
      card.className = "cooking-card";

      card.innerHTML = `
        <h3 class="event-name">${dish.name}</h3>
        ${
          dish.variants
            ? `<p class="normal">種類</p><p>${dish.variants.join("<br>")}</p>`
            : ""
        }
        ${
          dish.recipeFrom
            ? `<p class="normal">食譜來源</p><p>${dish.recipeFrom}</p>`
            : ""
        }
        ${
          dish.crops.length
            ? `<p class="like">作物</p><p>${dish.crops.join(", ")}</p>`
            : ""
        }
        ${
          dish.ingredients.length
            ? `<p class="like">材料</p><p>${dish.ingredients.join("<br>")}</p>`
            : ""
        }
        ${dish.price ? `<p class="favorite">售價</p><p>${dish.price}</p>` : ""}
        ${
          dish.tips.length
            ? `<p class="normal">小提醒</p><ul>${dish.tips
                .map((tip) => `<li>${tip}</li>`)
                .join("")}</ul>`
            : ""
        }
      `;

      cookingCardsContainer.appendChild(card);
    });

    document.getElementById("cooking-tips").innerHTML = guide.tips
      .map(
        (tip) => `
        <div class="cooking-tip">
          <h3>${tip.title}</h3>
          <ul>${tip.items.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
      `
      )
      .join("");
  }

  // 日常料理區塊功能
  async function loadDailyDishes() {
    const response = await fetch("data/daily.txt");
    const data = await response.json();

    document.getElementById("daily-source").textContent = data.source;

    document.getElementById("daily-categories").innerHTML = data.categories
      .map(
        (category) => `
        <h3>${category.title}</h3>
        ${category.note ? `<p class="data-source">${category.note}</p>` : ""}
        <div class="table-wrapper">
          <table class="data-table daily-table">
            <thead>
              <tr><th>料理</th><th>效果</th><th>材料（季節）</th><th>取得方式</th></tr>
            </thead>
            <tbody>
              ${category.dishes
                .map(
                  (dish) => `
                <tr>
                  <td class="crop-label">${dish.name}</td>
                  <td>${
                    [dish.effect, dish.level ? `Lv.${dish.level}` : ""]
                      .filter(Boolean)
                      .join(" ") || "—"
                  }</td>
                  <td>${dish.ingredients
                    .map(
                      (ingredient) =>
                        `${ingredient.name}<span class="ingredient-season">（${ingredient.season}）</span>`
                    )
                    .join("<br>")}</td>
                  <td>${dish.from}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      )
      .join("");
  }

  // 作物區塊功能
  async function loadCrops() {
    const response = await fetch("data/crops.txt");
    const data = await response.json();

    document.getElementById(
      "crops-source"
    ).innerHTML = `資料來源：<a href="${data.source.url}" target="_blank" rel="noopener">${data.source.title}</a><br>${data.pdfSource}（花卉澆兩次水天數不變，種子價未收錄）`;

    // 有圖片就顯示圖片，沒有就顯示文字
    const cropLabel = (crop) =>
      crop.image
        ? `<img src="images/crops/${crop.image}" alt="${crop.name}" title="${crop.name}" class="crop-image"><span class="crop-name">${crop.name}</span>`
        : crop.name;

    const seasonButtons = document.querySelectorAll("#crops-season-tabs button");
    let currentSeason = getFromLocalStorage("cropsSeason", "");

    function showCrops() {
      saveToLocalStorage("cropsSeason", currentSeason);
      seasonButtons.forEach((button) =>
        button.classList.toggle(
          "active",
          button.dataset.season === currentSeason
        )
      );

      // 依季節篩選
      const crops = data.crops.filter(
        (crop) => !currentSeason || crop.seasons.includes(currentSeason)
      );
      const seasonClass = (s) => (s === currentSeason ? ` class="season-current"` : "");

      // 季節總覽：可種植的季節打勾
      document.getElementById("crops-overview").innerHTML = `
        <thead>
          <tr><th>作物</th>${seasons
            .map((s) => `<th${seasonClass(s)}>${s}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>
          ${crops
            .map(
              (crop) => `
            <tr>
              <td class="crop-label">${cropLabel(crop)}</td>
              ${seasons
                .map((s) =>
                  crop.seasons.includes(s)
                    ? `<td class="season-yes${
                        s === currentSeason ? " season-current" : ""
                      }">✓</td>`
                    : `<td${seasonClass(s)}></td>`
                )
                .join("")}
            </tr>`
            )
            .join("")}
        </tbody>
      `;

      // 詳細資料
      document.getElementById("crops-detail").innerHTML = `
        <thead>
          <tr><th>作物</th><th>類型</th><th>季節</th><th>天數</th><th>收穫數</th><th>種子價</th><th>售價</th><th>稀有售價</th></tr>
        </thead>
        <tbody>
          ${crops
            .map(
              (crop) => `
            <tr>
              <td class="crop-label">${cropLabel(crop)}</td>
              <td>${crop.type}</td>
              <td>${crop.seasons.join("")}</td>
              <td>${crop.days}</td>
              <td>${crop.yield}</td>
              <td>${crop.seedPrice ?? "—"}</td>
              <td>${crop.price}</td>
              <td>${crop.rarePrice ?? "—"}</td>
            </tr>${
              crop.note
                ? `<tr class="note-row"><td colspan="8">${crop.name}：${crop.note}</td></tr>`
                : ""
            }`
            )
            .join("")}
        </tbody>
      `;
    }

    seasonButtons.forEach((button) =>
      button.addEventListener("click", () => {
        currentSeason = button.dataset.season;
        showCrops();
      })
    );

    showCrops();
  }

  // 風車加工區塊功能
  async function loadWindmill() {
    const response = await fetch("data/windmill.txt");
    const data = await response.json();

    document.getElementById(
      "windmill-source"
    ).innerHTML = `資料來源：<a href="${data.source.url}" target="_blank" rel="noopener">${data.source.title}</a>`;

    const windmillTabs = document.getElementById("windmill-tabs");
    const windmillTable = document.getElementById("windmill-table");

    function showWindmill(index) {
      saveToLocalStorage("windmillIndex", index);
      windmillTabs.querySelectorAll("button").forEach((button, i) => {
        button.classList.toggle("active", i === index);
      });

      windmillTable.innerHTML = `
        <thead>
          <tr><th>加工品</th><th>材料</th><th>售價</th></tr>
        </thead>
        <tbody>
          ${data.windmills[index].items
            .map(
              (item) => `
            <tr>
              <td>${item.name}${
                item.note ? `<span class="item-note">${item.note}</span>` : ""
              }</td>
              <td>${item.materials}</td>
              <td>${item.price ?? "—"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      `;
    }

    data.windmills.forEach((windmill, index) => {
      const button = document.createElement("button");
      button.textContent = windmill.name;
      button.dataset.color = windmill.color;
      button.addEventListener("click", () => showWindmill(index));
      windmillTabs.appendChild(button);
    });

    showWindmill(getFromLocalStorage("windmillIndex", 0));
  }

  // 釣魚與捕蟲區塊功能
  async function loadFishing() {
    const response = await fetch("data/fishing.txt");
    const data = await response.json();

    document.getElementById(
      "fishing-source"
    ).innerHTML = `資料來源：<a href="${data.source.url}" target="_blank" rel="noopener">${data.source.title}</a>`;

    const typeButtons = document.querySelectorAll("#fishing-type-tabs button");
    const seasonButtons = document.querySelectorAll(
      "#fishing-season-tabs button"
    );
    const fishingTable = document.getElementById("fishing-table");

    let currentType = getFromLocalStorage("fishingType", "fish");
    let currentSeason = getFromLocalStorage("fishingSeason", "");

    function showFishing() {
      saveToLocalStorage("fishingType", currentType);
      saveToLocalStorage("fishingSeason", currentSeason);
      typeButtons.forEach((button) =>
        button.classList.toggle("active", button.dataset.type === currentType)
      );
      seasonButtons.forEach((button) =>
        button.classList.toggle(
          "active",
          button.dataset.season === currentSeason
        )
      );

      // 依季節篩選
      const list = data[currentType].filter(
        (item) => !currentSeason || item.seasons.includes(currentSeason)
      );

      fishingTable.innerHTML = `
        <thead>
          <tr><th>名稱</th><th>分類</th><th>售價</th><th>季節</th><th>地點</th><th>天氣</th><th>時間</th></tr>
        </thead>
        <tbody>
          ${list
            .map(
              (item) => `
            <tr>
              <td class="crop-label">${item.name}</td>
              <td>${item.category}</td>
              <td>${item.price}</td>
              <td>${item.seasons.join("")}</td>
              <td>${item.places.length ? item.places.join("、") : "—"}</td>
              <td>${item.weather}</td>
              <td>${item.time}${
                item.days ? `<span class="item-note">僅 ${item.days}</span>` : ""
              }</td>
            </tr>`
            )
            .join("")}
        </tbody>
      `;
    }

    typeButtons.forEach((button) =>
      button.addEventListener("click", () => {
        currentType = button.dataset.type;
        showFishing();
      })
    );
    seasonButtons.forEach((button) =>
      button.addEventListener("click", () => {
        currentSeason = button.dataset.season;
        showFishing();
      })
    );

    showFishing();
  }

  // 儲存與讀取行事曆與礦物分布的快取值
  function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getFromLocalStorage(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  }

  // 初始化行事曆與礦物分布的快取值
  let currentYear = getFromLocalStorage("calendarYear", 1); // 預設第1年
  let currentSeasonIndex = getFromLocalStorage("calendarSeason", 0); // 預設春季
  let currentMineralSeason = getFromLocalStorage("mineralSeason", "spring"); // 預設春季

  // 更新行事曆選擇器的值
  const yearSelectElement = document
    .getElementById("controls")
    .querySelector("select");
  const seasonSelectElement = document
    .getElementById("controls")
    .querySelectorAll("select")[1];

  yearSelectElement.value = currentYear;
  seasonSelectElement.value = currentSeasonIndex;

  // 切換年度與季節時儲存快取
  yearSelectElement.addEventListener("change", () => {
    currentYear = parseInt(yearSelectElement.value, 10);
    saveToLocalStorage("calendarYear", currentYear);
    generateCalendar(currentYear, currentSeasonIndex);
  });

  seasonSelectElement.addEventListener("change", () => {
    currentSeasonIndex = parseInt(seasonSelectElement.value, 10);
    saveToLocalStorage("calendarSeason", currentSeasonIndex);
    generateCalendar(currentYear, currentSeasonIndex);
  });

  // 加載居民資料並初始化行事曆
  const residents = await loadResidents();
  await loadFestivals();
  generateCalendar(currentYear, currentSeasonIndex);

  // 初始化居民送禮資訊
  loadResidentCards(residents);

  // 初始化賺錢料理
  loadCookingGuide();

  // 初始化日常料理
  loadDailyDishes();

  // 初始化作物與風車加工
  loadCrops();
  loadWindmill();

  // 初始化釣魚與捕蟲
  loadFishing();

  // 修正左右按鈕功能
  const gallery = document.querySelector(".animal-gallery");
  const leftBtn = document.querySelector(".scroll-btn.left");
  const rightBtn = document.querySelector(".scroll-btn.right");

  leftBtn.addEventListener("click", () => {
    gallery.scrollBy({ left: -gallery.offsetWidth, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", () => {
    gallery.scrollBy({ left: gallery.offsetWidth, behavior: "smooth" });
  });

  // 礦物分布區塊密碼驗證功能
  function checkMineralAccess() {
    const storedPassword = localStorage.getItem("mineralAccess");

    if (storedPassword === "tzu") {
      return true; // 已經驗證過密碼
    }

    const userPassword = prompt("請輸入密碼以查看礦物分布：");

    if (userPassword === "tzu") {
      localStorage.setItem("mineralAccess", "tzu");
      return true;
    } else {
      alert("密碼錯誤，無法查看礦物分布。");
      return false;
    }
  }

  // 初始化礦物分布區塊
  if (checkMineralAccess()) {
    const tabs = document.querySelectorAll("#minerals .tabs button");
    const mineralGallery = document.getElementById("mineral-gallery");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const season = tab.getAttribute("data-season");
        saveToLocalStorage("mineralSeason", season);

        // 更新礦物圖片
        mineralGallery.innerHTML = `
        <img src="images/stone/${season}_mountain.png" alt="${season} Mountain">
        <img src="images/stone/${season}_town.png" alt="${season} Town">
      `;
      });
    });

    // 初始化礦物分布的預設值
    const currentMineralSeason = getFromLocalStorage("mineralSeason", "spring");
    const activeTab = document.querySelector(
      `#minerals .tabs button[data-season="${currentMineralSeason}"]`
    );
    if (activeTab) {
      activeTab.click();
    }
  } else {
    document.getElementById("minerals").style.display = "none"; // 隱藏礦物分布區塊
  }
});
