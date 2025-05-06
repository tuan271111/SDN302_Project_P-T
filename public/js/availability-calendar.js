document.addEventListener('DOMContentLoaded', function() {
  // Get calendar element if it exists
  const calendarEl = document.getElementById('availability-calendar');
  if (!calendarEl) return;
  
  // Get room ID from data attribute
  const roomId = calendarEl.dataset.roomId;
  
  // Initialize FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    height: 'auto',
    events: `/api/rooms/${roomId}/bookings`,
    eventColor: '#3788d8',
    eventTextColor: '#ffffff',
    eventClick: function(info) {
      // Prevent clicking on events for regular users
      if (!info.event.extendedProps.isAdmin) {
        return;
      }
      
      // For admins, show booking details
      const bookingId = info.event.id;
      window.location.href = `/admin/bookings?highlight=${bookingId}`;
    },
    eventDidMount: function(info) {
      // Add tooltip with more information
      const tooltip = new bootstrap.Tooltip(info.el, {
        title: `${info.event.title}
                Check-in: ${moment(info.event.start).format('MMM DD, YYYY')}
                Check-out: ${moment(info.event.end).format('MMM DD, YYYY')}
                Status: ${info.event.extendedProps.status}`,
        placement: 'top',
        trigger: 'hover',
        container: 'body',
        html: true
      });
    }
  });
  
  calendar.render();
});
