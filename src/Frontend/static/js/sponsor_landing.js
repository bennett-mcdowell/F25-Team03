document.addEventListener('DOMContentLoaded', () => {
  // ===========================
  // LOAD SPONSOR + ACTIVE DRIVERS
  // ===========================
  fetch("/api/sponsor/accounts")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error("Error:", data.error);
        document.getElementById("driverList").innerHTML = "<p>Error loading drivers.</p>";
        return;
      }

      const drivers = data.drivers || [];

      // Active Drivers count (drivers where active === true)
      const activeCount = drivers.filter(d => d.active).length;
      document.getElementById("activeDrivers").textContent = activeCount;

      // Points Given (sum of .points or 0 fallback)
      const totalPoints = drivers.reduce((sum, d) => sum + (d.points || 0), 0);
      document.getElementById("pointsGiven").textContent = totalPoints;

      const driverList = document.getElementById("driverList");
      driverList.innerHTML = "";

      if (drivers.length === 0) {
        driverList.innerHTML = "<p>No drivers currently sponsored.</p>";
      } else {
        drivers.forEach(driver => {
          const driverDiv = document.createElement("div");
          driverDiv.classList.add("transfer");

          const fullName =
            (driver.first_name || "") +
            (driver.last_name ? (" " + driver.last_name) : "");
          const driverName = (fullName.trim() || driver.email || "-");

          // balance in your code is what's displayed as "Points Earned"
          const balance = parseFloat(driver.balance) || 0;

          driverDiv.innerHTML = `
            <div class="transfer-details">
              <div>
                <dt>Name</dt>
                <dd>${driverName}</dd>
              </div>
              <div>
                <dt>Points Earned</dt>
                <dd id="driverPoints-${driver.driver_id}">${balance}</dd>
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
      }

      // Add points button listeners
      document.querySelectorAll('.add-points-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const driverId = btn.dataset.driverId;
          const input = document.getElementById(`pointsInput-${driverId}`);
          const points = parseInt(input.value);

          if (!points || points <= 0) {
            alert('Enter a valid number of points');
            return;
          }

          try {
            const res = await fetch(`/api/sponsor/driver/${driverId}/add_points`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ points })
            });

            const result = await res.json();
            if (res.ok) {
              // Update displayed points
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


  // ===========================
  // LOAD PENDING DRIVER REQUESTS
  // ===========================
  fetch("/api/sponsor/pending-drivers")
    .then(res => res.json())
    .then(data => {
      const listEl  = document.getElementById("pendingDriverList");
      const emptyEl = document.getElementById("pendingDriverEmpty");
      const errEl   = document.getElementById("pendingDriverError");

      // If the HTML doesn't include the pending section (edge case),
      // just bail quietly so we don't throw.
      if (!listEl || !emptyEl || !errEl) {
        return;
      }

      // reset states
      listEl.innerHTML = "";
      emptyEl.style.display = "none";
      errEl.style.display = "none";

      if (!data || data.error) {
        console.error("Error loading pending drivers:", data && data.error);
        errEl.style.display = "block";
        errEl.textContent = "Could not load pending drivers.";
        return;
      }

      const pending = data.pending_drivers || [];

      if (pending.length === 0) {
        emptyEl.style.display = "block";
        return;
      }

      // For each pending driver, we match the visual style of .transfer
      // and keep the same <dt>/<dd> pattern you use in the main list.
      pending.forEach(p => {
        const fullName =
          (p.first_name || "") +
          (p.last_name ? (" " + p.last_name) : "");
        const driverName = fullName.trim() || "Unnamed Driver";
        const sponsorCount = p.active_sponsor_count ?? 0;

        const row = document.createElement("div");
        row.classList.add("transfer");

        row.innerHTML = `
          <div class="transfer-details">
            <div>
              <dt>Name</dt>
              <dd>${driverName}</dd>
            </div>
            <div>
              <dt>Current # Sponsors</dt>
              <dd>${sponsorCount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd id="driverStatus-${p.driver_id}">Pending</dd>
            </div>
          </div>
          <div class="transfer-number">
            <button class="flat-button approve-btn" data-driver-id="${p.driver_id}">
              Approve
            </button>
          </div>
        `;

        // Add approve button handler
        const approveBtn = row.querySelector(".approve-btn");
        approveBtn.addEventListener("click", async () => {
          if (!confirm(`Approve ${driverName}?`)) return;

          try {
            const res = await fetch(`/api/sponsor/driver/${p.driver_id}/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });

            const result = await res.json();
            if (res.ok) {
              document.getElementById(`driverStatus-${p.driver_id}`).textContent = "Active";
              approveBtn.disabled = true;
              approveBtn.textContent = "Approved";
              approveBtn.classList.add("disabled");
            } else {
              alert(result.error || "Failed to approve driver.");
            }
          } catch (err) {
            console.error("Error approving driver:", err);
            alert("Network or server error while approving driver.");
          }
        });

        listEl.appendChild(row);
      });


    })
    .catch(err => {
      console.error("Failed to load pending driver requests:", err);

      const listEl  = document.getElementById("pendingDriverList");
      const errEl   = document.getElementById("pendingDriverError");
      const emptyEl = document.getElementById("pendingDriverEmpty");

      if (listEl && errEl && emptyEl) {
        listEl.innerHTML = "";
        emptyEl.style.display = "none";
        errEl.style.display = "block";
        errEl.textContent = "Could not load pending drivers.";
      }
    });

});
