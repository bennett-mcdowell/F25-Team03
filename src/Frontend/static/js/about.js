fetch('/api/about')
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      document.getElementById('about-data').innerHTML = '<p>Could not load about data.</p>';
      return;
    }

    const info = `
      <div class="about-item"><strong>Team # </strong><span>${data.team_number}</span></div>
      <div class="about-item"><strong>Version </strong><span>${data.version_number}</span></div>
      <div class="about-item"><strong>Release Date </strong><span>${data.release_date}</span></div>
      <div class="about-item"><strong>Product Name </strong><span>${data.product_name}</span></div>
      <div class="about-item"><strong>Product Description </strong><span>${data.product_description}</span></div>
      <div class="about-item"><strong>Contact Details </strong><span>${data.contact_details || "Not provided"}</span></div>
    `;

    document.getElementById('about-data').innerHTML = info;
  })
  .catch(() => {
    document.getElementById('about-data').innerHTML = '<p>Could not load about data.</p>';
  });
