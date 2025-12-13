import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getEventColor } from "./utils/eventUtils";
import CompletedEventsDropdown from "./components/RightPanel/CompletedEventsDropdown";
import UpcomingEventsList from "./components/RightPanel/UpcomingEventsList";
import MonthView from "./components/calendar/MonthView";
import WeekView from "./components/calendar/WeekView";
import YearView from "./components/calendar/YearView";
import EventDetails from "./components/calendar/EventDetails";
import LoginPage from "./components/LoginPage/LoginPage";
import SignupPage from "./components/LoginPage/SignupPage";
import EventForm from "./components/EventForm";
import "./App.css";
import "./index.css";
import AdminPanel from './components/AdminPanel/AdminPanel';
import AgendaView from './components/calendar/AgendaView';
import CompactMonthView from './components/calendar/CompactMonthView';
import MobileMenuDrawer from './components/LoginPage/MobileMenuDrawer';
import MobileHeader from './components/LoginPage/MobileHeader';
import DeleteEventContainer from './components/AdminPanel/DeleteEventContainer';

export function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= breakpoint);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isDesktop;
}

// === Placeholder Components ===
function FloatingActionButton({ onClick }) {
  return (
    <button
      className="fab touch-target"
      aria-label="Add an event"
      style={{
        position: 'fixed',
        right: 'var(--space-lg)',
        bottom: 'var(--space-lg)',
        zIndex: 100,
        background: 'var(--color-primary)',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        boxShadow: '0 4px 16px var(--color-shadow)',
        fontSize: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      +
    </button>
  );
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 100);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  if (window.innerWidth >= 1024) return null;
  return visible ? (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 80,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#1976d2',
        color: '#fff',
        border: 'none',
        boxShadow: '0 2px 8px #0003',
        zIndex: 2000,
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      &#8593;
    </button>
  ) : null;
}

function Dashboard({ isAuthenticated, refetchEventsRef, viewYear, setViewYear, viewMonth, setViewMonth, setViewDate }) {
  const navigate = useNavigate();
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [events, setEvents] = useState([]);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
  const [customRangeMode, setCustomRangeMode] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedCompletedEvent, setSelectedCompletedEvent] = useState(null);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Ref for refetching events from outside
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      const mappedEvents = data.map(ev => ({
        date: ev.date ? ev.date.split("T")[0] : "",
        title: ev.title,
        time: ev.time,
        type: ev.type || "default",
        club: ev.organizer || "",
        completed: false,
        results: ev.description || "",
      }));
      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Expose fetchEvents to parent via ref
  if (refetchEventsRef) {
    refetchEventsRef.current = fetchEvents;
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const weekDate = calendarView === "week" && !selectedDateStr
    ? new Date()
    : selectedDateStr ? new Date(selectedDateStr) : new Date(viewYear, viewMonth, 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const eventDateTime = new Date(e.date + 'T' + (e.time || '00:00'));
    const now = new Date();
    if (eventDate > today) return true;
    if (eventDate.getTime() === today.getTime()) return eventDateTime > now;
    return false;
  });

  const completedEventsForSelectedMonth = events.filter(e => {
    const eventDate = new Date(e.date);
    return (
      eventDate.getMonth() === viewMonth &&
      eventDate.getFullYear() === viewYear &&
      eventDate < today
    );
  });

  const handlePrevMonth = () => {
    setViewMonth(prevMonth => {
      const newMonth = prevMonth === 0 ? 11 : prevMonth - 1;
      const newYear = prevMonth === 0 ? viewYear - 1 : viewYear;
      setViewYear(newYear);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setViewMonth(prevMonth => {
      const newMonth = prevMonth === 11 ? 0 : prevMonth + 1;
      const newYear = prevMonth === 11 ? viewYear + 1 : viewYear;
      setViewYear(newYear);
      return newMonth;
    });
  };

  const handlePrevWeek = () => setSelectedDateStr(dateStr => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });

  const handleNextWeek = () => setSelectedDateStr(dateStr => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const handleAddEventClick = () => {
    if (isAuthenticated) {
      navigate('/event-form');
    } else {
      navigate('/login');
    }
  };

  const handleDownloadClick = () => {
    setShowCompletedDropdown(true);
    setShowDownloadDialog(true);
  };

  const handleDownloadOption = (range) => {
    if (range === "custom") {
      setCustomRangeMode(true);
      return;
    }
    if (range) {
      const downloadUrl = `http://localhost:8000/api/reports/download?range=${range}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setShowDownloadDialog(false);
    setCustomRangeMode(false);
    setCustomStart("");
    setCustomEnd("");
  };

  const handleCustomDownload = () => {
    if (!customStart || !customEnd) {
      alert("Please select both start and end dates.");
      return;
    }
    const range = JSON.stringify({ start: customStart, end: customEnd });
    const downloadUrl = `http://localhost:8000/api/reports/download?range=${encodeURIComponent(range)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowDownloadDialog(false);
    setCustomRangeMode(false);
    setCustomStart("");
    setCustomEnd("");
  };

  const handleViewMenuSelect = (view) => {
    setCalendarView(view);
    setShowViewMenu(false);
  };

  const isDesktop = useIsDesktop(1024);

  // --- Mobile/Tablet View Switcher State ---
  const [mobileView, setMobileView] = useState("agenda");
  // Collapsible state for mobile sections
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // --- CRUCIAL FIX: Filter events only for selectedDateStr ---
  const eventsForSelectedDate = selectedDateStr
    ? events.filter(e => e.date === selectedDateStr)
    : [];

    if (!isDesktop) {
      // === MOBILE/TABLET: Single-column, mobile-first layout ===
      return (
        <div className="app-bg">
          <MobileHeader onMenuClick={() => setMenuOpen(true)} />
          <MobileMenuDrawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            upcomingEvents={upcomingEvents}
            completedEvents={completedEventsForSelectedMonth}
            onSelectAgenda={() => { setMobileView('agenda'); setMenuOpen(false); }}
            onSelectMonth={() => { setMobileView('month'); setMenuOpen(false); }}
            onSelectWeek={() => { setMobileView('week'); setMenuOpen(false); }}
            onSelectYear={() => { setMobileView('year'); setMenuOpen(false); }}
            onSelectCompletedEvent={setSelectedCompletedEvent}
            onDownloadReport={() => { setShowDownloadDialog(true); setMenuOpen(false); }}
            onAddEvent={handleAddEventClick}
            onLogin={() => { navigate('/login'); setMenuOpen(false); }}
            onSignup={() => { navigate('/signup'); setMenuOpen(false); }}
            isAuthenticated={isAuthenticated}
            isAdmin={false} // Set to true if user is admin
            onAdminPanel={() => { navigate('/admin'); setMenuOpen(false); }}
          />
          <nav
            aria-label="View switcher"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 4,
              margin: '0.5rem auto 1rem auto',
              width: '100vw',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#f5f6fa',
              borderRadius: 12,
              boxShadow: '0 1px 4px #0001',
              padding: 4,
              position: 'relative',
              overflowX: 'auto',
            }}
          >
            {[
              { key: 'month', label: 'Month' },
              { key: 'week', label: 'Week' },
              { key: 'year', label: 'Year' },
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setMobileView(view.key)}
                aria-pressed={mobileView === view.key}
                style={{
                  flex: 1,
                  padding: '0.7rem 0',
                  background: mobileView === view.key ? '#1976d2' : 'transparent',
                  color: mobileView === view.key ? '#fff' : '#1976d2',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  outline: mobileView === view.key ? '2px solid #1976d2' : 'none',
                }}
              >
                {view.label}
              </button>
            ))}
          </nav>
          <main style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
            {mobileView === 'agenda' && <AgendaView events={events} />}
            {mobileView === 'month' && (
              <CompactMonthView
                year={viewYear}
                month={viewMonth}
                events={events}
                selectedDateStr={selectedDateStr}
                onSelectDate={setSelectedDateStr}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            )}
            {mobileView === 'week' && (
              <WeekView
                weekDate={weekDate}
                selectedDate={selectedDateStr}
                onSelectDate={setSelectedDateStr}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                events={events}
              />
            )}
            {mobileView === 'year' && (
              <YearView
                initialYear={viewYear}
                setViewMonth={setViewMonth}
                setViewYear={setViewYear}
                setCalendarView={() => setMobileView('month')}
              />
            )}
          </main>
          <FloatingActionButton onClick={handleAddEventClick} />
          {/* Event Details Modal/Bottom Sheet for selected date */}
          {selectedDateStr && !menuOpen && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3000,
                background: '#fff',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                boxShadow: '0 -2px 16px #0003',
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '36px 20px 20px 20px',
                animation: 'slideUp 0.3s',
                maxWidth: 340,
                width: '100%',
                minHeight: 120,
                margin: '24px auto 0 auto', // margin-top to separate from calendar
              }}
              role="dialog"
              aria-modal="true"
            >
              <button
                onClick={() => setSelectedDateStr(null)}
                aria-label="Close details"
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 18,
                  zIndex: 10,
                  background: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: '#1976d2',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px #0001',
                  padding: 0,
                }}
              >
                ×
              </button>
              <EventDetails dateStr={selectedDateStr} getEventColor={getEventColor} events={events} />
            </div>
          )}
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
          {showDownloadDialog && (
            <div id="download-dialog" className="modal">
              <div className="modal-content">
                {customRangeMode ? (
                  <>
                    <label style={{ marginBottom: 8 }}>Start Date: <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} /></label>
                    <label style={{ marginBottom: 16 }}>End Date: <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></label>
                    <button
                      className="download-mode"
                      style={{ background: '#e53940', color: '#fff', fontWeight: 'bold', marginBottom: 16 }}
                      onClick={() => handleDownloadOption(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="download-mode"
                      style={{ background: '#1976d2', color: '#fff', fontWeight: 'bold' }}
                      onClick={handleCustomDownload}
                    >
                      Download Custom Range
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Select Report Period</h3>
                    <button className="download-mode" onClick={() => handleDownloadOption('week')}>Weekly</button>
                    <button className="download-mode" onClick={() => handleDownloadOption('month')}>Monthly</button>
                    <button className="download-mode" onClick={() => handleDownloadOption('year')}>Yearly</button>
                    <button className="download-mode" onClick={() => handleDownloadOption('custom')}>Custom Range</button>
                    <button className="download-mode" onClick={() => handleDownloadOption(null)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          )}
          <BackToTopButton />
        </div>
      );
    }
  
  // === DESKTOP: Multi-column layout ===
  return (
    <div className="app-bg">
      <header className="app-header">
        <h1>Campus Events Calendar</h1>
        <div className="action-buttons" style={{ position: 'relative' }}>
          <button
            className={calendarView === "month" ? "active" : ""}
            onClick={() => setCalendarView("month")}
          >
            Month
          </button>
          <button
            className={calendarView === "week" ? "active" : ""}
            onClick={() => {
              setCalendarView("week");
              if (!selectedDateStr) setSelectedDateStr(new Date().toISOString().slice(0, 10));
            }}
          >
            Week
          </button>
          <button
            className={calendarView === "year" ? "active" : ""}
            onClick={() => setCalendarView("year")}
          >
            Year
          </button>
          <button onClick={handleAddEventClick}>Add an event</button>
        </div>
      </header>
      <div className="dashboard">
        <aside className="sidebar glass-panel">
          <div className="section-title">Upcoming Events</div>
          <UpcomingEventsList upcomingEvents={upcomingEvents} />
          <div className="section-title-1">Completed Events (This Month)</div>
          <div className="left-box" style={{ width: "100%", marginTop: "2px" }}>
            
            <div className="CompletedEventsDropdown">
              <CompletedEventsDropdown 
                completedEvents={completedEventsForSelectedMonth} 
                onSelect={setSelectedCompletedEvent} 
                
              />
            </div>
            
          </div>
          <div className="completed-event-card-outer" style={{ width: '100%', maxWidth: '220px', minHeight: '60px', margin: '2px auto 0 auto', background: 'none', border: 'none', display: 'flex', justifyContent: 'center' }}>
              {selectedCompletedEvent && (
                <div
                  className="event-item"
                  style={{
                    borderLeft: `6px solid ${getEventColor(selectedCompletedEvent.type)}`,
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px #0001',
                    padding: '0',
                    margin: '0 auto',
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '220px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                    color:'black'
                  }}
                >
                  <div className="modal-1">
                    <strong>{selectedCompletedEvent.title}</strong>
                    <div>{selectedCompletedEvent.results}</div>
                  </div>
                </div>
              )}
            </div>
        </aside>
        <main className="calendar-panel glass-panel">
          {calendarView === "month" && (
            <MonthView
              year={viewYear}
              month={viewMonth}
              selectedDateStr={selectedDateStr}
              onSelectDate={setSelectedDateStr}
              getEventColor={getEventColor}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onGoToWeekView={() => setCalendarView("week")}
              events={events}
            />
          )}
          {calendarView === "week" && (
            <WeekView
              weekDate={weekDate}
              selectedDate={selectedDateStr}
              onSelectDate={setSelectedDateStr}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              events={events}
            />
          )}
          {calendarView === "year" && (
            <YearView
              initialYear={viewYear}
              setViewDate={setViewDate}
              setCalendarView={setCalendarView}
            />
          )}
        </main>
        <aside className="right-panel glass-panel">
          <button className="download-btn" onClick={handleDownloadClick}>
            <span className="button-content">Download Report</span>
          </button>
          {!showCompletedDropdown && (
            <div className="section-title" style={{ marginTop: 1 }}>Events on Selected Day</div>
          )}

          {/* *** Updated here: pass filtered events only for selected date *** */}
          <EventDetails 
            dateStr={selectedDateStr} 
            getEventColor={getEventColor} 
            events={eventsForSelectedDate} 
          />
        </aside>
      </div>
      {showDownloadDialog && (
        <div id="download-dialog" className="modal">
          <div className="modal-content">
            {customRangeMode ? (
              <>
                <label className="l1" style={{ marginBottom: 8, color: '#000' }}>
                  Start Date: <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </label>
                <label className="l1" style={{ marginBottom: 16, color: '#000' }}>
                  End Date: <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </label>
                <button
                  className="download-mode"
                  style={{ background: '#e53940', color: '#fff', fontWeight: 'bold', marginBottom: 16 }}
                  onClick={() => handleDownloadOption(null)}
                >
                  Cancel
                </button>
                <button
                  className="download-mode"
                  style={{ background: '#1976d2', color: '#fff', fontWeight: 'bold' }}
                  onClick={handleCustomDownload}
                >
                  Download Custom Range
                </button>
              </>
            ) : (
              <>
                <h3>Select Report Period</h3>
                <button className="download-mode" onClick={() => handleDownloadOption('week')}>Weekly</button>
                <button className="download-mode" onClick={() => handleDownloadOption('month')}>Monthly</button>
                <button className="download-mode" onClick={() => handleDownloadOption('year')}>Yearly</button>
                <button className="download-mode" onClick={() => handleDownloadOption('custom')}>Custom Range</button>
                <button className="download-mode" onClick={() => handleDownloadOption(null)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
      <BackToTopButton />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refetchEventsRef = React.useRef(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const setViewDate = ({ year, month }) => {
    setViewYear(year);
    setViewMonth(month);
  };
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/event-form"
          element={
            isAuthenticated ? (
              <EventForm
                onEventAdded={() => {
                  if (refetchEventsRef.current) refetchEventsRef.current();
                }}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/"
          element={
            <Dashboard
              isAuthenticated={isAuthenticated}
              refetchEventsRef={refetchEventsRef}
              viewYear={viewYear}
              setViewYear={setViewYear}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              setViewDate={setViewDate}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/delete-events" element={<DeleteEventContainer />} />
      </Routes>
    </Router>
  );
}
