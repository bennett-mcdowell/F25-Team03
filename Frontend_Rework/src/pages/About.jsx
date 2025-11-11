import Layout from '../components/Layout';

const About = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h1>About Team Driver Rewards</h1>
        <div className="dashboard-card">
          <h2>Our Mission</h2>
          <p>
            Team Driver Rewards is a comprehensive platform designed to connect sponsors with drivers,
            facilitating a rewards-based system that benefits both parties.
          </p>
        </div>
        <div className="dashboard-card">
          <h2>How It Works</h2>
          <ul>
            <li>
              <strong>Drivers</strong> can apply to sponsors and earn points for their activities
            </li>
            <li>
              <strong>Sponsors</strong> can manage their driver pool and distribute points as rewards
            </li>
            <li>
              <strong>Admins</strong> oversee the entire platform and manage all user accounts
            </li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h2>Contact Us</h2>
          <p>For support or inquiries, please contact us at support@teamdriverrewards.com</p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
