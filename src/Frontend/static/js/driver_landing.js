document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/driver/sponsors");
    const data = await res.json();

    if (!res.ok) {
      console.error("Error loading driver data:", data.error);
      document.getElementById("pointsDisplay").textContent = "Error";
      return;
    }

    // Update total points
    document.getElementById("pointsDisplay").textContent = data.total_points.toLocaleString();

    const sponsorList = document.getElementById("sponsorList");
    if (!data.sponsors || data.sponsors.length === 0) {
      sponsorList.innerHTML = "<p>No sponsors associated with this driver.</p>";
      return;
    }

    sponsorList.innerHTML = "";

    data.sponsors.forEach(sponsor => {
      const div = document.createElement("div");
      div.classList.add("sponsor-item");
      div.innerHTML = `
        <h3>${sponsor.sponsor_name}</h3>
        <p><strong>Points Available:</strong> ${sponsor.balance.toLocaleString()}</p>
        <p>${sponsor.description || ""}</p>
      `;
      sponsorList.appendChild(div);
    });

  } catch (err) {
    console.error("Failed to fetch driver sponsors:", err);
  }

  // Load available sponsors to apply
  try {
    const res2 = await fetch("/api/sponsors/available");
    const data2 = await res2.json();
    const container = document.getElementById("availableSponsors");

    if (!res2.ok) {
      container.innerHTML = "<p>Error loading available sponsors.</p>";
      return;
    }

    const rows = data2.sponsors || [];
    if (rows.length === 0) {
      container.innerHTML = "<p>No sponsors available at this time.</p>";
      return;
    }

    container.innerHTML = "";
    rows.forEach((s) => {
      const div = document.createElement("div");
      div.classList.add("sponsor-item");
      const status = (s.relationship_status || '').toUpperCase();

      let actionHtml = '';
      if (!s.has_relationship || status === 'INACTIVE') {
        actionHtml = `<button class="btn-apply" data-sponsor-id="${s.sponsor_id}">Apply</button>`;
      } else if (status === 'PENDING') {
        actionHtml = '<span class="badge badge-pending">Pending</span>';
      } else if (status === 'ACTIVE') {
        actionHtml = '<span class="badge badge-active">Active</span>';
      }

      div.innerHTML = `
        <h3>${s.sponsor_name}</h3>
        <p>${s.description || ''}</p>
        <div>${actionHtml}</div>
      `;
      container.appendChild(div);
    });

    // Wire up Apply buttons
    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-apply');
      if (!btn) return;
      btn.disabled = true;
      const sponsorId = btn.getAttribute('data-sponsor-id');
      try {
        const r = await fetch('/api/driver/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ sponsor_id: Number(sponsorId) })
        });
        const jj = await r.json();
        if (!r.ok) {
          alert(jj.error || 'Failed to apply');
          btn.disabled = false;
          return;
        }
        window.location.reload();
      } catch (err) {
        console.error('Apply failed', err);
        btn.disabled = false;
      }
    });
  } catch (err) {
    console.error('Failed to fetch available sponsors', err);
  }
});
