document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/admin/accounts")
    .then(response => response.json())
    .then(data => {
      const body = document.getElementById("accountsTableBody");

      if (data.error) {
        console.error("Error:", data.error);
        body.innerHTML = "<tr><td colspan='5'>Error loading accounts.</td></tr>";
        return;
      }

      const accounts = data.accounts || [];

      if (accounts.length === 0) {
        body.innerHTML = "<tr><td colspan='5'>No accounts found.</td></tr>";
        return;
      }

      // --- Count totals ---
      const totalUsers = accounts.length;
      const totalSponsors = accounts.filter(a => a.role_name === "Sponsor").length;
      const totalDrivers = accounts.filter(a => a.role_name === "Driver").length;

      document.getElementById("totalUsers").textContent = totalUsers;
      document.getElementById("totalSponsors").textContent = totalSponsors;
      document.getElementById("totalDrivers").textContent = totalDrivers;

      // --- Populate table ---
      body.innerHTML = "";

      accounts.forEach(account => {
        const user = account.user || {};
        const roleName = account.role_name || "-";
        const role = account.role || {};

        let sponsorCell = "-";
        if (roleName === "Driver" && Array.isArray(role.sponsors) && role.sponsors.length > 0) {
          sponsorCell = role.sponsors.map(s => s.name).join(", ");
        } else if (role.name) {
          sponsorCell = role.name;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.user_id || "-"}</td>
          <td>${user.username || user.email || "-"}</td>
          <td>${roleName}</td>
          <td>${sponsorCell}</td>
          <td>
            <a href="/account/${user.user_id}" class="flat-button">View</a>
            <button class="flat-button impersonate-btn" data-user-id="${user.user_id}" style="background-color: #ff9800; margin-left: 8px;">Impersonate</button>
          </td>
        `;
        body.appendChild(row);
      });

      // Add impersonate button listeners
      document.querySelectorAll('.impersonate-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.dataset.userId;
          const userName = btn.closest('tr').querySelector('td:nth-child(2)').textContent;
          
          if (!confirm(`Impersonate user: ${userName}?\n\nThis will open a new tab where you'll be logged in as this user.`)) {
            return;
          }
          
          try {
            // Get impersonation token
            const res = await fetch('/api/admin/impersonate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: parseInt(userId) })
            });
            
            const result = await res.json();
            if (!res.ok) {
              alert(result.error || 'Failed to generate impersonation token');
              return;
            }
            
            // Open new tab with impersonation session
            const impersonateUrl = `/impersonate?token=${encodeURIComponent(result.token)}&role=${result.user_info.role}`;
            window.open(impersonateUrl, '_blank');
            
          } catch (err) {
            console.error('Error impersonating user:', err);
            alert('Error starting impersonation session');
          }
        });
      });
    })
    .catch(err => {
      console.error("Failed to load accounts:", err);
      document.getElementById("accountsTableBody").innerHTML =
        "<tr><td colspan='5'>Error loading accounts.</td></tr>";
    });
});
