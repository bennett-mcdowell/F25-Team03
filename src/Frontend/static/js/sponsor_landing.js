document.addEventListener('DOMContentLoaded', () => {
  // --- Fetch sponsor info and drivers ---
  fetch("/api/sponsor/accounts")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error("Error:", data.error);
        document.getElementById("driverList").innerHTML = "<p>Error loading drivers.</p>";
        return;
      }

      const drivers = data.drivers || [];
      document.getElementById("activeDrivers").textContent = drivers.filter(d => d.active).length;
      document.getElementById("pointsGiven").textContent = drivers.reduce((sum, d) => sum + (d.points || 0), 0);

      const driverList = document.getElementById("driverList");
      driverList.innerHTML = "";

      if (drivers.length === 0) {
        driverList.innerHTML = "<p>No drivers currently sponsored.</p>";
        return;
      }

      drivers.forEach(driver => {
        const driverDiv = document.createElement("div");
        driverDiv.classList.add("transfer");
        driverDiv.innerHTML = `
          <div class="transfer-details">
            <div>
              <dt>Name</dt>
              <dd>${driver.name}</dd>
            </div>
            <div>
              <dt>Points Earned</dt>
              <dd id="driverPoints-${driver.driver_id}">${driver.points || 0}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>${driver.active ? "Active" : "Inactive"}</dd>
            </div>
          </div>
          <div class="transfer-number">
            <input type="number" id="pointsInput-${driver.driver_id}" placeholder="Add points" min="1">
            <button class="flat-button add-points-btn" data-driver-id="${driver.driver_id}">Add Points</button>
          </div>
        `;
        driverList.appendChild(driverDiv);
      });

      // --- Add points button listeners ---
      document.querySelectorAll('.add-points-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const driverId = btn.dataset.driverId;
          const input = document.getElementById(`pointsInput-${driverId}`);
          const points = parseInt(input.value);
          if (!points || points <= 0) return alert('Enter a valid number of points');

          try {
            const res = await fetch(`/api/sponsor/driver/${driverId}/add_points`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ points })
            });

            const result = await res.json();
            if (res.ok) {
              document.getElementById(`driverPoints-${driverId}`).textContent = result.new_points;
              input.value = '';
            } else {
              alert(result.error || 'Failed to add points');
            }
          } catch (err) {
            console.error(err);
            alert('Error adding points');
          }
        });
      });

    })
    .catch(err => {
      console.error("Failed to load sponsor data:", err);
      document.getElementById("driverList").innerHTML = "<p>Error loading drivers.</p>";
    });
});
