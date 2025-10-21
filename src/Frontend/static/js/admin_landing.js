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

        // Determine sponsor name if applicable
        const sponsorName = role.name || "-";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.user_id || "-"}</td>
          <td>${user.username || user.email || "-"}</td>
          <td>${roleName}</td>
          <td>${sponsorName}</td>
          <td><a href="/account/${user.user_id}" class="flat-button">View</a></td>
        `;
        body.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Failed to load accounts:", err);
      document.getElementById("accountsTableBody").innerHTML =
        "<tr><td colspan='5'>Error loading accounts.</td></tr>";
    });
});
