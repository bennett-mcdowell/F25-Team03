import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const About = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/about')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch about info');
        return res.json();
      })
      .then((data) => {
        setAbout(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="dashboard">
        <h1>About Team Driver Rewards</h1>
        {loading && <div>Loading...</div>}
        {error && <div style={{color: 'red'}}>Error: {error}</div>}
        {about && (
          <div className="dashboard-card">
            <h2>{about.product_name}</h2>
            <p>{about.product_description}</p>
            <ul>
              <li><strong>Team Number:</strong> {about.team_number}</li>
              <li><strong>Version:</strong> {about.version_number}</li>
              <li><strong>Release Date:</strong> {about.release_date}</li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default About;
