// Room availability checking
function checkAvailability(roomId) {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const availabilityResult = document.getElementById('availabilityResult');
    
    if (!checkIn || !checkOut) {
      availabilityResult.innerHTML = '<div class="alert alert-warning">Please select both check-in and check-out dates</div>';
      return;
    }
    
    // Check if check-out is after check-in
    if (new Date(checkOut) <= new Date(checkIn)) {
      availabilityResult.innerHTML = '<div class="alert alert-danger">Check-out date must be after check-in date</div>';
      return;
    }
  
    availabilityResult.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    
    // Make AJAX request to check availability
    fetch(`/rooms/${roomId}/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ checkIn, checkOut })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.isAvailable) {
          availabilityResult.innerHTML = '<div class="alert alert-success">Room is available! You can proceed with booking.</div>';
          document.getElementById('bookNowBtn').removeAttribute('disabled');
        } else {
          availabilityResult.innerHTML = '<div class="alert alert-danger">Sorry, this room is not available for the selected dates.</div>';
          document.getElementById('bookNowBtn').setAttribute('disabled', 'disabled');
        }
      } else {
        availabilityResult.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        document.getElementById('bookNowBtn').setAttribute('disabled', 'disabled');
      }
    })
    .catch(error => {
      console.error('Error checking availability:', error);
      availabilityResult.innerHTML = '<div class="alert alert-danger">Error checking availability. Please try again.</div>';
      document.getElementById('bookNowBtn').setAttribute('disabled', 'disabled');
    });
  }
  
  // Handle room form amenities field
  function updateAmenitiesList() {
    const amenitiesInput = document.getElementById('amenities');
    const amenitiesList = document.getElementById('amenitiesList');
    
    if (!amenitiesInput || !amenitiesList) return;
    
    // Clear existing items
    amenitiesList.innerHTML = '';
    
    // Get array of amenities
    const amenities = amenitiesInput.value.split(',').map(item => item.trim()).filter(item => item);
    
    // Create list items
    amenities.forEach(amenity => {
      const listItem = document.createElement('span');
      listItem.className = 'badge badge-info mr-2 mb-2';
      listItem.textContent = amenity;
      amenitiesList.appendChild(listItem);
    });
  }
  
  // Function to get status badge class
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      case 'completed':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  }
  
  // Initialize elements and event listeners when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize amenities list for room form
    updateAmenitiesList();
    
    // Add event listener to amenities input
    const amenitiesInput = document.getElementById('amenities');
    if (amenitiesInput) {
      amenitiesInput.addEventListener('input', updateAmenitiesList);
    }
    
    // Add event listeners to date fields for availability checking
    const checkInDate = document.getElementById('checkIn');
    const checkOutDate = document.getElementById('checkOut');
    const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn');
    
    if (checkInDate && checkOutDate && checkAvailabilityBtn) {
      const roomId = checkAvailabilityBtn.getAttribute('data-room-id');
      checkAvailabilityBtn.addEventListener('click', function() {
        checkAvailability(roomId);
      });
    }
    
    // Enable Bootstrap tooltips
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
      $('[data-toggle="tooltip"]').tooltip();
    }
    
    // Enable Bootstrap popovers
    if (typeof $ !== 'undefined' && $.fn.popover) {
      $('[data-toggle="popover"]').popover();
    }
  });