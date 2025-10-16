fetch('/api/sponsor/drivers')
  .then(response => response.json())
  .then(data => {
    const driverList = document.getElementById('driverList');
    const driverCount = document.getElementById('driverCount');

    if (data.error) {
      driverList.innerHTML = '<p>Could not load driver data.</p>';
      return;
    }

    driverCount.textContent = data.length || 0;

    if (data.length === 0) {
      driverList.innerHTML = '<p>No drivers found for this sponsor.</p>';
      return;
    }

    const staticBase = "/static/img/drivers/"; // optional path for driver photos
    driverList.innerHTML = data.map(driver => `
      <div class="tile driver-card">
        <div class="tile-header">
          <img src="${driver.photo ? staticBase + driver.photo : '/static/img/default_user.png'}" alt="${driver.name}" class="driver-photo">
          <h3>${driver.name}</h3>
        </div>
        <p><strong>Email:</strong> ${driver.email}</p>
        <p><strong>Points:</strong> ${driver.points}</p>
      </div>
    `).join('');
  })
  .catch(() => {
    document.getElementById('driverList').innerHTML = '<p>Could not load driver data.</p>';
  });
