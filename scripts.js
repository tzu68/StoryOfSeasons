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
  const events = [
    { date: "1-01-15", name: "春季節日", type: "festival" },
    { date: "1-02-10", name: "夏季節日", type: "festival" },
    { date: "1-03-05", name: "秋季節日", type: "festival" },
    { date: "1-04-20", name: "冬季節日", type: "festival" },
  ];

  const seasons = ["春", "夏", "秋", "冬"];
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

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
            name: `${resident.name} 生日`,
            type: "birthday",
            picture: resident.picture,
            color: resident.color,
            favorite: resident.favorite,
            likes: resident.likes,
            dislikes: resident.dislikes,
          });
        }
      }
    });
  }

  // 初始化行事曆
  async function generateCalendar(year, seasonIndex) {
    calendarContainer.innerHTML = ""; // 清空行事曆

    const daysInSeason = 30; // 每季固定30天
    const firstDayOfYear = 6; // 第一年的1號是周六 (0: 周日, 6: 周六)
    const firstDayOfSeason =
      (firstDayOfYear + (year - 1) * 120 + seasonIndex * 30) % 7;

    // 建立行事曆表格
    const calendarGrid = document.createElement("div");
    calendarGrid.style.display = "grid";
    calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
    calendarGrid.style.gap = "0.5rem";

    // 添加星期標題
    weekdays.forEach((weekday) => {
      const weekdayCell = document.createElement("div");
      weekdayCell.textContent = weekday;
      weekdayCell.style.textAlign = "center";
      weekdayCell.style.fontWeight = "bold";
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
      const formattedDate = `${year}-${String(seasonIndex + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      dateCell.textContent = day;
      dateCell.style.padding = "1rem";
      dateCell.style.textAlign = "center";
      dateCell.style.border = "1px solid #cde5cd";
      dateCell.style.borderRadius = "5px";
      dateCell.style.backgroundColor = "#eaf5e9";

      // 檢查是否有節日或生日
      const event = events.find((e) => e.date === formattedDate);
      if (event) {
        if (event.type === "festival") {
          dateCell.style.backgroundColor = "#ffeb3b"; // 節日顏色
        } else if (event.type === "birthday") {
          // 根據居民喜歡的顏色設置背景色
          if (event.color === "Yellow") {
            dateCell.style.backgroundColor = "#FFFF93";
          } else if (event.color === "Blue") {
            dateCell.style.backgroundColor = "#ACD6FF";
          } else if (event.color === "Red") {
            dateCell.style.backgroundColor = "#ffccbc"; // 保持紅色
          }

          // 顯示居民圖片
          const eventImage = document.createElement("img");
          eventImage.src = `images/people/${event.picture}`;
          eventImage.alt = event.name;
          eventImage.style.display = "block";
          eventImage.style.margin = "0.5rem auto 0";
          eventImage.style.width = "50px";
          eventImage.style.height = "50px";
          eventImage.style.borderRadius = "50%";
          dateCell.appendChild(eventImage);

          // 點擊事件顯示居民資訊
          dateCell.addEventListener("click", () => {
            infoContainer.innerHTML = `
                            <p>${event.name}</p>
                            <img src="images/people/${event.picture}" alt="${
              event.name
            }" style="width:100px;height:100px;border-radius:50%;display:block;margin:0 auto;"/>
                            <hr/>
                            <div>
                                <p>最喜歡</p>
                                <p>${event.favorite}</p>
                            </div>
                            <div>
                                <p>喜歡</p>
                                <p>${event.likes.join(", ")}</p>
                            </div>
                            <hr/>
                            <div>
                                <p>討厭</p>
                                <p>${event.dislikes.join(", ")}</p>
                            </div>
                            <hr/>
                            <div>
                                <p>喜歡的顏色</p>
                                <p>${event.color}</p>
                            </div>
                        `;
          });
        }
        dateCell.title = event.name; // 顯示提示文字
      }

      calendarGrid.appendChild(dateCell);
    }

    calendarContainer.appendChild(calendarGrid);
  }

  // 結婚候補資訊區塊功能
  async function loadMarriedResidents() {
    const response = await fetch("data/people.txt");
    const residents = await response.json();

    const marriedResidents = residents.filter((resident) => resident.married);

    const residentCardsContainer = document.getElementById("resident-cards");
    residentCardsContainer.innerHTML = ""; // 清空內容

    marriedResidents.forEach((resident) => {
      const card = document.createElement("div");
      card.className = "resident-card";
      card.setAttribute("data-color", resident.color); // 設置顏色屬性

      card.innerHTML = `
        <img src="images/people/${resident.picture}" alt="${
        resident.name
      }" style="width:100px;height:100px;border-radius:50%;display:block;margin:0 auto;"/>
        <h3>${resident.name}</h3>
        <p>生日：${resident.birthday.season} ${resident.birthday.day}日</p>
        <p>最喜歡：${resident.favorite}</p>
        <p>喜歡：${resident.likes.join(", ")}</p>
        <p>討厭：${resident.dislikes.join(", ")}</p>
      `;

      residentCardsContainer.appendChild(card);
    });
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
  await loadResidents();
  generateCalendar(currentYear, currentSeasonIndex);

  // 初始化結婚候補資訊
  loadMarriedResidents();

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
    const tabs = document.querySelectorAll(".tabs button");
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
      `.tabs button[data-season="${currentMineralSeason}"]`
    );
    if (activeTab) {
      activeTab.click();
    }
  } else {
    document.getElementById("minerals").style.display = "none"; // 隱藏礦物分布區塊
  }
});
