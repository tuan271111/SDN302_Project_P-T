document.addEventListener('DOMContentLoaded', function() {
  // Handle room deletion forms
  const roomDeletionForms = document.querySelectorAll('form[action*="/admin/rooms/"][action*="_method=DELETE"]');
  roomDeletionForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
        // Create a fetch request to handle the DELETE operation
        const url = form.getAttribute('action').split('?')[0];
        fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add a CSRF token if your application uses one
          },
        })
        .then(response => {
          if (response.ok) {
            window.location.href = '/admin/rooms';
          } else {
            alert('Failed to delete the room. It may have associated bookings.');
          }
        })
        .catch(error => {
          console.error('Error deleting room:', error);
          alert('An error occurred while deleting the room.');
        });
      }
    });
  });
  
  // Get chart containers if they exist
  const bookingChartContainer = document.getElementById('bookingChart');
  const revenueChartContainer = document.getElementById('revenueChart');
  const statusChartContainer = document.getElementById('statusChart');
  const occupancyChartContainer = document.getElementById('occupancyChart');
  
  if (!bookingChartContainer || !revenueChartContainer || !statusChartContainer) return;
  
  // Fetch admin statistics from API
  fetch('/api/admin/stats')
    .then(response => response.json())
    .then(data => {
      // Process monthly bookings data
      const dates = data.monthlyBookings.map(item => item._id);
      const bookingCounts = data.monthlyBookings.map(item => item.count);
      const revenues = data.monthlyBookings.map(item => item.revenue);
      
      // Process booking status counts
      const statusLabels = data.bookingStatusCounts.map(item => 
        item._id.charAt(0).toUpperCase() + item._id.slice(1)
      );
      const statusCounts = data.bookingStatusCounts.map(item => item.count);
      
      // Create booking trends chart
      const bookingChart = new Chart(bookingChartContainer, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Bookings',
            data: bookingCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Booking Trends'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
      
      // Create revenue chart
      const revenueChart = new Chart(revenueChartContainer, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Revenue ($)',
            data: revenues,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Revenue'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
      
      // Create status distribution chart
      const statusChart = new Chart(statusChartContainer, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusCounts,
            backgroundColor: [
              'rgba(255, 159, 64, 0.8)',  // Pending
              'rgba(54, 162, 235, 0.8)',  // Confirmed
              'rgba(255, 99, 132, 0.8)',  // Cancelled
              'rgba(75, 192, 192, 0.8)'   // Completed
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Booking Status Distribution'
            },
            legend: {
              position: 'right'
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching admin stats:', error);
    });
    
  // Handle occupancy chart
  if (occupancyChartContainer) {
    let occupancyChart;
    const occupancyDateRange = document.getElementById('occupancy-date-range');
    
    // Function to fetch and render occupancy data
    function fetchOccupancyData(days = 30) {
      // Calculate dates
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Fetch occupancy data
      fetch(`/api/admin/occupancy?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            const data = result.data;
            
            // Prepare chart data
            const labels = data.map(item => item.date);
            const occupancyRates = data.map(item => item.occupancyRate);
            
            // Destroy previous chart if it exists
            if (occupancyChart) {
              occupancyChart.destroy();
            }
            
            // Create occupancy chart
            occupancyChart = new Chart(occupancyChartContainer, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Occupancy Rate (%)',
                  data: occupancyRates,
                  backgroundColor: 'rgba(153, 102, 255, 0.2)',
                  borderColor: 'rgba(153, 102, 255, 1)',
                  borderWidth: 2,
                  tension: 0.4,
                  fill: true
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Hotel Occupancy Rate'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const item = data[context.dataIndex];
                        return [
                          `Occupancy: ${item.occupancyRate}%`,
                          `Booked: ${item.bookedRooms}/${item.totalRooms} rooms`
                        ];
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Occupancy (%)'
                    },
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }
            });
          } else {
            console.error('Error fetching occupancy data:', result.message);
          }
        })
        .catch(error => {
          console.error('Error fetching occupancy data:', error);
        });
    }
    
    // Initial fetch
    fetchOccupancyData();
    
    // Handle date range changes
    if (occupancyDateRange) {
      occupancyDateRange.addEventListener('change', function() {
        fetchOccupancyData(parseInt(this.value));
      });
    }
  }
});
