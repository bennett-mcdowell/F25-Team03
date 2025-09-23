fetch('/api/about')
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      document.getElementById('about-data').innerHTML = '<p>Could not load about data.</p>';
      return;
    }
    document.getElementById('about-data').innerHTML = `
      <table>
        <tr><th>Team #</th><td>${data.team_number}</td></tr>
        <tr><th>Version #</th><td>${data.version_number}</td></tr>
        <tr><th>Release Date</th><td>${data.release_date}</td></tr>
        <tr><th>Product Name</th><td>${data.product_name}</td></tr>
        <tr><th>Product Description</th><td>${data.product_description}</td></tr>
        <tr><th>Contact Details</th><td>${data.contact_details}</td></tr>
      </table>
    `;
  })
  .catch(() => {
    document.getElementById('about-data').innerHTML = '<p>Could not load about data.</p>';
  });

  //Home page
  document.getElementById("homeBtn").addEventListener("click", () => {
    window.location.href = "/home";
  });
