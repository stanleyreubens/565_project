// Location: frontend/src/pages/LandingPage.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      number: '01',
      title: 'Competitor Intelligence',
      description: 'Monitor real-time pricing from competitors in your market. Understand where you stand and identify opportunities to optimize your rates.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    },
    {
      number: '02',
      title: 'Event Detection',
      description: 'Automatically discover local events that drive demand. Concerts, sports, conferences - capture every revenue opportunity.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
    },
    {
      number: '03',
      title: 'Smart Pricing',
      description: 'Get AI-powered price recommendations based on demand signals, market conditions, and your business rules.',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
    },
    {
      number: '04',
      title: 'Performance Analytics',
      description: 'Compare your performance against the market with industry-standard metrics and competitive set analysis.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">H</span>
            <span className="logo-text">Hotel Revenue Manager</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Success Stories</a>
            <Link to="/login" className="nav-signin">Log in</Link>
            <Link to="/register" className="nav-cta">Book a Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Revenue Management<br />Made Simple</h1>
            <p>The intelligent pricing platform that helps independent hotels maximize revenue with real-time market insights and AI-powered recommendations.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Watch Demo
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-dashboard">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
                alt="Modern hotel lobby interior"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">15%</span>
            <span className="stat-label">Average RevPAR increase</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Market monitoring</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">5min</span>
            <span className="stat-label">Setup time</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100+</span>
            <span className="stat-label">Events tracked daily</span>
          </div>
        </div>
      </section>

      {/* Features Section - Sticky Tabs Style */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="features-header">
            <span className="section-tag">Features</span>
            <h2>Everything you need to optimize pricing</h2>
            <p>Powerful tools designed for independent hotels and revenue managers</p>
          </div>

          <div className="features-grid">
            <div className="features-tabs">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-tab ${activeFeature === index ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <span className="feature-number">{feature.number}</span>
                  <div className="feature-info">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="features-display">
              <div className="feature-image-wrapper">
                <img
                  src={features[activeFeature].image}
                  alt={features[activeFeature].title}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Feature Sections */}
      <section className="feature-block feature-block-linen">
        <div className="feature-block-container">
          <div className="feature-block-content">
            <span className="section-tag">Competitor Analysis</span>
            <h2>Know your market position</h2>
            <p>Track competitor rates in real-time across all major OTAs. See how your pricing compares and identify opportunities to capture more bookings.</p>
            <ul className="feature-checklist">
              <li>Real-time price tracking</li>
              <li>Historical trend analysis</li>
              <li>Market positioning insights</li>
              <li>Rate parity monitoring</li>
            </ul>
          </div>
          <div className="feature-block-image">
            <img
              src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"
              alt="Competitor analysis dashboard"
            />
          </div>
        </div>
      </section>

      <section className="feature-block feature-block-white">
        <div className="feature-block-container reverse">
          <div className="feature-block-content">
            <span className="section-tag">Event Intelligence</span>
            <h2>Capture demand spikes</h2>
            <p>Our AI automatically detects concerts, sports events, conferences, and festivals that will drive demand to your property.</p>
            <ul className="feature-checklist">
              <li>Ticketmaster integration</li>
              <li>Impact scoring system</li>
              <li>Demand forecasting</li>
              <li>Automated alerts</li>
            </ul>
          </div>
          <div className="feature-block-image">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
              alt="Events and concerts"
            />
          </div>
        </div>
      </section>

      <section className="feature-block feature-block-dark">
        <div className="feature-block-container">
          <div className="feature-block-content">
            <span className="section-tag light">Smart Pricing</span>
            <h2>AI-powered recommendations</h2>
            <p>Get daily pricing recommendations based on market conditions, competitor rates, demand signals, and your business rules.</p>
            <ul className="feature-checklist light">
              <li>SMERF rate protection</li>
              <li>Cost-based floor pricing</li>
              <li>One-click rate updates</li>
              <li>Rule-based automation</li>
            </ul>
          </div>
          <div className="feature-block-image">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
              alt="Pricing analytics"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2>Get started in minutes</h2>
            <p>Simple setup, powerful results</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-image">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                  alt="Hotel property"
                />
              </div>
              <h3>Add Your Property</h3>
              <p>Enter your hotel details, room types, and base rates. Takes less than 5 minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-image">
                <img
                  src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80"
                  alt="Multiple hotels"
                />
              </div>
              <h3>Set Your Competitors</h3>
              <p>Select hotels in your competitive set. We start tracking their prices immediately.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-image">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80"
                  alt="Analytics dashboard"
                />
              </div>
              <h3>Get Recommendations</h3>
              <p>Receive daily pricing suggestions based on market conditions and demand signals.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-image">
                <img
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80"
                  alt="Revenue growth"
                />
              </div>
              <h3>Grow Revenue</h3>
              <p>Apply optimized rates and watch your RevPAR increase over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Success Stories</span>
            <h2>Trusted by hoteliers</h2>
            <p>See what our customers have to say</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Hotel Revenue Manager increased our occupancy by 15% and ADR by 12% within just 3 months. The ROI has been incredible."</p>
              </div>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                  alt="Michael Chen"
                />
                <div className="author-info">
                  <strong>Michael Chen</strong>
                  <span>General Manager, Oceanview Resort</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card featured">
              <div className="testimonial-content">
                <p>"The event detection feature is a game-changer. We now capture demand spikes we used to miss. Last month alone, we gained $12K in additional revenue."</p>
              </div>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                  alt="Sarah Johnson"
                />
                <div className="author-info">
                  <strong>Sarah Johnson</strong>
                  <span>Revenue Manager, City Plaza Hotel</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Finally, a revenue management tool built for independent hotels. The competitor insights alone are worth it. Simple to use, powerful results."</p>
              </div>
              <div className="testimonial-author">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
                  alt="David Williams"
                />
                <div className="author-info">
                  <strong>David Williams</strong>
                  <span>CEO, Boutique Hotels Group</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to maximize your revenue?</h2>
          <p>Join hotels using data-driven pricing to increase their profits.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-cta-primary">
              Start Free Trial
            </Link>
            <Link to="/login" className="btn btn-cta-secondary">
              Schedule Demo
            </Link>
          </div>
          <span className="cta-note">No credit card required. Free 14-day trial.</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">H</span>
                <span className="logo-text">Hotel Revenue Manager</span>
              </div>
              <p>AI-powered revenue management for independent hotels. Maximize your RevPAR with smart pricing.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#careers">Careers</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#support">Support</a></li>
                  <li><a href="#docs">Documentation</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Hotel Revenue Manager. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
