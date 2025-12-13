import React from "react";

// Helper to format date headings
function getDateHeading(dateStr) {
  const today = new Date();
  const eventDate = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const diff = (eventDate - today) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";

  // Format as "Wed, Sep 3"
  return eventDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Group events by date
function groupEventsByDate(events) {
  const groups = {};
  events.forEach((event) => {
    if (!event.date) return;
    if (!groups[event.date]) groups[event.date] = [];
    groups[event.date].push(event);
  });
  return groups;
}

export default function AgendaView({ events = [] }) {
  // Sort events by date and time
  const sortedEvents = [...events].sort((a, b) => {
    if (a.date === b.date) {
      return (a.time || "").localeCompare(b.time || "");
    }
    return new Date(a.date) - new Date(b.date);
  });

  const grouped = groupEventsByDate(sortedEvents);
  const dateKeys = Object.keys(grouped).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  if (dateKeys.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#888", marginTop: "2rem" }}>
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="agenda-view" style={{ padding: "1rem" }}>
      {dateKeys.map((date) => (
        <div key={date} className="agenda-date-group" style={{ marginBottom: "2rem" }}>
          <div
            className="agenda-date-heading"
            style={{
              fontWeight: "bold",
              fontSize: "1.1rem",
              marginBottom: "0.5rem",
              color: "#1976d2",
              position: "sticky",
              top: 0,
              background: "inherit",
              zIndex: 1,
            }}
          >
            {getDateHeading(date)}
          </div>
          <div className="agenda-events-list">
            {grouped[date].map((event, idx) => (
              <div
                key={idx}
                className="agenda-event-card"
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px #0001",
                  padding: "1rem",
                  marginBottom: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  borderLeft: `5px solid #1976d2`,
                }}
                tabIndex={0}
                aria-label={`${event.title}, ${event.time || "All day"}`}
              >
                <div style={{ fontWeight: 600, fontSize: "1rem", color: "#222" }}>
                  {event.title}
                </div>
                <div style={{ color: "#1976d2", fontSize: "0.98rem", margin: "0.2rem 0" }}>
                  {event.time || "All day"}
                </div>
                {event.type && (
                  <div style={{ fontSize: "0.92rem", color: "#555" }}>
                    {event.type}
                  </div>
                )}
                {event.club && (
                  <div style={{ fontSize: "0.92rem", color: "#888" }}>
                    {event.club}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 