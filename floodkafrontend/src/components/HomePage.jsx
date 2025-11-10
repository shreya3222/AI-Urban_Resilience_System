import React, { useEffect } from 'react';
import '../styles/HomePage.css';
import waterBg from '../assets/images/water2.jpg'; 

const HomePage = () => {
  
  useEffect(() => {
    // Create the IntersectionObserver to trigger animations on scroll
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5  // Trigger when 50% of the element is in the viewport
    });

    // Target all elements with the class `animate-on-scroll`
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => observer.observe(element));

    return () => {
      // Clean up the observer when the component unmounts
      observer.disconnect();
    };
  }, []);
  
  return (
    <div className="full-page">
      {/* Section 1: Hero Section */}
      <div className="home-page" style={{ backgroundImage: `url(${waterBg})` }}>
        <nav className="navbar">
          <ul>
            <li><a href="/">HOME</a></li>
            <li><a href="/flood-prediction">FLOOD PREDICTION</a></li>
            <li><a href="/heat-island">HEAT ISLAND PREDICTION</a></li>
            <li><a href="#features">FEATURES</a></li>
            <li><a href="#contact">CONTACT US</a></li>
            {/* <li><a href="/login">LOGIN</a></li> */}
          </ul>
        </nav>

        <div className="hero">
          <div className="hero-text">
            <h1 className="animate-on-scroll">URBAN RESILIENCE SYSTEM</h1>
            <h5 className="animate-on-scroll">Harnessing AI to forecast floods and HeatIslands</h5>
          </div>
        </div>
      </div>

      {/* Section 2: Options Section */}
      <div className="about-section">
        <h1 className="animate-on-scroll" style={{ color: '#00ffff', fontFamily:'"Orbitron", serif' }}>ABOUT</h1>
        <p className="animate-on-scroll">This system aims to utilize AI and machine learning to predict urban floods and provide real-time alerts, early warnings, and actionable mitigation strategies. It integrates geospatial data, including latitude, land encroachment, historical weather patterns, temperature, and green cover analysis, to forecast potential flood scenarios. By offering advanced predictive capabilities, it enables authorities and communities to make informed decisions, reducing the impact on infrastructure and human lives. Additionally, it focuses on climate resilience by recommending sustainable solutions, optimizing resource management, and improving urban livability through proactive planning and disaster response mechanisms.</p>
      </div>

      {/* Section 3: Features Section */}
      <div className="features-section" id="features">
        <h2 className="animate-on-scroll">FEATURES</h2>
        <ul>
          <li className="animate-on-scroll">AI Based Flood Prediction</li>
          <li className="animate-on-scroll">Efficient Rescue Operations</li>
          <li className="animate-on-scroll">Enhanced Resource Management</li>
          <li className="animate-on-scroll">Scalable and Adaptable System</li>
          <li className="animate-on-scroll">Improved Urban Livability</li>
          <li className="animate-on-scroll">AI based Urban Heat Island Mitigation</li>
        </ul>
      </div>

      {/* Section 4: Models Section */}
      <div className="option-section">
        <div><h2  className="animate-on-scroll" style={{color: '#00ffff', margin:'20vh',fontSize:'70px', fontFamily: '"Orbitron", serif' }}>MODELS</h2></div>

        <div className="models-container">
          <div className='models'>
            <a href="/flood-prediction"><h3 className="animate-on-scroll">Flood Prediction</h3></a>
          </div>
          <div className='models'>
          <a href="/heat-island"><h3 className="animate-on-scroll">Heat Island Mitigation</h3></a>
          </div>
          <div className='models'>
          <a href="/flood-prediction"><h3 className="animate-on-scroll">Rescue Optimization</h3></a>
          </div>
        </div>
      </div>   

      {/* Section 5: Contact Section */}
      <div className="contact-section" id="contact">
        <center><h2 className="animate-on-scroll">CONTACT US:</h2></center>
        <div className="contact-content">
          <div className="contact-info">
            <p className="animate-on-scroll">Email: urbanresilience@gmail.com</p>
            <p className="animate-on-scroll">Contact no.: 1234567890</p>
            <p className="animate-on-scroll">Address: Some random address here</p>
          </div>
          <div className="contact-info">
            <p className="animate-on-scroll">Email: urbanresilience@gmail.com</p>
            <p className="animate-on-scroll">Contact no.: 1234567890</p>
            <p className="animate-on-scroll">Address: Some random address here</p>
          </div>
          {/* <form className="contact-form">
            <label className="animate-on-scroll">Name</label>
            <input type="text" placeholder="Enter your name" />
            <label className="animate-on-scroll">Location</label>
            <input type="text" placeholder="Enter your location" />
            <label className="animate-on-scroll">Email</label>
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Submit</button>
          </form> */}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
