document.addEventListener("DOMContentLoaded", () => {
  const calendarContainer = document.getElementById("interactive-calendar");

  // 節日與居民生日資料
  const events = [
    { date: "1-01-15", name: "春季節日", type: "festival" },
    { date: "1-02-10", name: "夏季節日", type: "festival" },
    { date: "1-03-05", name: "秋季節日", type: "festival" },
    { date: "1-04-20", name: "冬季節日", type: "festival" },
  ];

  const seasons = ["春", "夏", "秋", "冬"];
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  // 初始化行事曆
  function generateCalendar(year, seasonIndex) {
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
          dateCell.style.backgroundColor = "#ffccbc"; // 生日顏色
        }
        dateCell.title = event.name; // 顯示提示文字
      }

      calendarGrid.appendChild(dateCell);
    }

    calendarContainer.appendChild(calendarGrid);
  }

  // 切換季節功能
  let currentYear = 1; // 第一年的開始
  let currentSeasonIndex = 0; // 春季開始

  const yearSelect = document.createElement("select");
  for (let year = 1; year <= 5; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `第 ${year} 年`;
    if (year === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }

  const seasonSelect = document.createElement("select");
  seasons.forEach((season, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = season;
    if (index === currentSeasonIndex) option.selected = true;
    seasonSelect.appendChild(option);
  });

  yearSelect.addEventListener("change", () => {
    currentYear = parseInt(yearSelect.value, 10);
    generateCalendar(currentYear, currentSeasonIndex);
  });

  seasonSelect.addEventListener("change", () => {
    currentSeasonIndex = parseInt(seasonSelect.value, 10);
    generateCalendar(currentYear, currentSeasonIndex);
  });

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.justifyContent = "space-between";
  controls.style.marginBottom = "1rem";
  controls.appendChild(yearSelect);
  controls.appendChild(seasonSelect);

  calendarContainer.before(controls);

  // 初始化顯示當前季節行事曆
  generateCalendar(currentYear, currentSeasonIndex);
});
