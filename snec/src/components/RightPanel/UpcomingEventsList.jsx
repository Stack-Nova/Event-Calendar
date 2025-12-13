import React from "react";

export default function UpcomingEventsList({ upcomingEvents }) {
  return (
   <>
    <ul className="uplist">
      {upcomingEvents.map(e => (
        <li key={e.title + e.date}>
          <strong style={{color:"black"}}>{e.title}</strong> ({e.date})<br />
          <span>{e.time} | {e.club}</span>
        </li>
      ))}
    </ul>
   </>
  );
}