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
                <dd id="driverStatus-${driver.driver_id}">${driver.active ? "Active" : "Inactive"}</dd>
              </div>
            </div>
            <div class="transfer-number">
              <input type="number" id="pointsInput-${driver.driver_id}" placeholder="Add points" min="1">
              <button class="flat-button add-points-btn" data-driver-id="${driver.driver_id}">Add Points</button>
              <button class="flat-button impersonate-driver-btn" data-driver-id="${driver.driver_id}" data-driver-name="${driverName}" style="background-color: #ff9800; margin-top: 8px;">Impersonate</button>
              <button class="flat-button remove-driver-btn" data-driver-id="${driver.driver_id}" style="background-color: #dc3545; margin-top: 8px;">Remove</button>
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

          if (!points) {
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

      // Remove driver button listeners
      document.querySelectorAll('.remove-driver-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const driverId = btn.dataset.driverId;

          if (!confirm('Are you sure you want to remove this driver? This will reject their sponsorship.')) {
            return;
          }

          try {
            const res = await fetch('/api/sponsor/remove-driver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ driver_id: parseInt(driverId) })
            });

            const result = await res.json();
            if (res.ok) {
              document.getElementById(`driverStatus-${driverId}`).textContent = 'Inactive';
              btn.disabled = true;
              btn.textContent = 'Removed';
              btn.style.backgroundColor = '#6c757d';
              
              const addPointsBtn = document.querySelector(`.add-points-btn[data-driver-id="${driverId}"]`);
              if (addPointsBtn) {
                addPointsBtn.disabled = true;
              }
            } else {
              alert(result.error || 'Failed to remove driver');
            }
          } catch (err) {
            console.error(err);
            alert('Error removing driver');
          }
        });
      });

      // Impersonate driver button listeners
      document.querySelectorAll('.impersonate-driver-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const driverId = btn.dataset.driverId;
          const driverName = btn.dataset.driverName;

          if (!confirm(`Impersonate driver: ${driverName}?\n\nThis will open a new tab where you'll be logged in as this driver.`)) {
            return;
          }

          try {
            const res = await fetch('/api/sponsor/impersonate-driver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ driver_id: parseInt(driverId) })
            });

            const result = await res.json();
            if (res.ok) {
              // Open new tab with impersonation session
              const impersonateUrl = `/impersonate?token=${encodeURIComponent(result.token)}&role=${result.user_info.role}`;
              window.open(impersonateUrl, '_blank');
            } else {
              alert(result.error || 'Failed to generate impersonation token');
            }
          } catch (err) {
            console.error('Error impersonating driver:', err);
            alert('Error starting impersonation session');
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
            <button class="flat-button reject-btn" data-driver-id="${p.driver_id}" style="background-color: #dc3545; margin-top: 8px;">
              Reject
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
              const rejectBtn = row.querySelector(".reject-btn");
              if (rejectBtn) rejectBtn.disabled = true;
            } else {
              alert(result.error || "Failed to approve driver.");
            }
          } catch (err) {
            console.error("Error approving driver:", err);
            alert("Network or server error while approving driver.");
          }
        });

        const rejectBtn = row.querySelector(".reject-btn");
        rejectBtn.addEventListener("click", async () => {
          const reason = prompt(`Reject ${driverName}?\n\nOptional: Enter reason for rejection:`);
          if (reason === null) return;
          
          try {
            const res = await fetch(`/api/sponsor/driver/${p.driver_id}/reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason: reason || 'No reason provided' })
            });

            const result = await res.json();
            if (res.ok) {
              document.getElementById(`driverStatus-${p.driver_id}`).textContent = "Inactive";
              rejectBtn.disabled = true;
              rejectBtn.textContent = "Rejected";
              rejectBtn.style.backgroundColor = "#6c757d";
              approveBtn.disabled = true;
            } else {
              alert(result.error || "Failed to reject driver.");
            }
          } catch (err) {
            console.error("Error rejecting driver:", err);
            alert("Network or server error while rejecting driver.");
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
