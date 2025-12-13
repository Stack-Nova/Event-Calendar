import React from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function hasEventsForDate(events, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return events && events.some(ev => ev.date === dateStr);
}

export default function CompactMonthView({
  year,
  month,
  events = [],
  selectedDateStr,
  onSelectDate,
  onPrevMonth,
  onNextMonth
}) {
  console.log("CompactMonthView props:", { year, month });
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthName = new Date(year, month).toLocaleString(undefined, { month: "long" });

  // Build the grid: empty cells for days before the 1st, then 1..daysInMonth
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // For highlighting selected date
  let selectedDay = null;
  if (selectedDateStr) {
    const [selYear, selMonth, selDay] = selectedDateStr.split("-").map(Number);
    if (selYear === year && selMonth === month + 1) selectedDay = selDay;
  }

  return (
    <div
      style={{
        background: "#f5f6fa",
        borderRadius: 16,
        padding: 16,
        maxWidth: 400,
        margin: "0 auto",
        boxShadow: "0 2px 12px #0001",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Month navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: 8,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#f5f6fa',
      }}>
        <button
          aria-label="Previous month"
          onClick={onPrevMonth}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "#1976d2",
            cursor: "pointer",
            padding: 4,
            borderRadius: 8,
            marginRight: 12,
          }}
        >
          &#60;
        </button>
        <div style={{ fontWeight: 700, fontSize: "1.2rem", textAlign: "center", flex: 1, color: "#111" }}>
          {monthName} {year}
        </div>
        <button
          aria-label="Next month"
          onClick={onNextMonth}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "#1976d2",
            cursor: "pointer",
            padding: 4,
            borderRadius: 8,
            marginLeft: 12,
          }}
        >
          &#62;
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          width: "100%",
          minWidth: 320,
          maxWidth: 400,
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontWeight: 500,
              color: "#1976d2",
              fontSize: "1rem",
              padding: "2px 0",
            }}
          >
            {wd}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          width: "100%",
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        {cells.map((d, i) => {
          let dayEvents = [];
          if (d) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            dayEvents = events.filter(ev => ev.date === dateStr);
          }
          const hasEvents = dayEvents.length > 0;
          const isSelected = d && d === selectedDay;
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                minHeight: 44,
                fontSize: "1.25rem",
                fontWeight: d ? 500 : 400,
                color: d ? (isSelected ? "#fff" : "#222") : "transparent",
                borderRadius: 6,
                background: isSelected ? "#1976d2" : d ? "#fff" : "transparent",
                cursor: d && onSelectDate ? "pointer" : "default",
                lineHeight: "44px",
                transition: "background 0.2s, color 0.2s",
                position: "relative",
                outline: isSelected ? "2px solid #1976d2" : "none",
              }}
              onClick={d && onSelectDate ? () => onSelectDate(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`) : undefined}
              tabIndex={d ? 0 : -1}
              aria-label={d ? `${monthName} ${d}, ${year}${hasEvents ? ` (${dayEvents.length} events)` : ''}` : undefined}
            >
              {d || ""}
              {/* Event dot and count (only if there are events) */}
              {hasEvents && (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      display: "block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isSelected ? "#fff" : "#1976d2",
                      margin: 0,
                      position: "relative",
                    }}
                    aria-hidden="true"
                  />
                  {dayEvents.length > 1 && (
                    <div
                      style={{
                        marginLeft: 4,
                        background: isSelected ? "#1976d2" : "#fff",
                        color: isSelected ? "#fff" : "#1976d2",
                        borderRadius: "8px",
                        fontSize: "0.95em",
                        fontWeight: 700,
                        padding: "0 5px",
                        minWidth: 18,
                        minHeight: 18,
                        lineHeight: "18px",
                        boxShadow: "0 1px 4px #0002",
                        border: `1px solid ${isSelected ? '#fff' : '#1976d2'}`,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {`+${dayEvents.length}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 