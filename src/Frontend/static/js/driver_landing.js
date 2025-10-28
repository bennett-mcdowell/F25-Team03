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
});
