import React from 'react';
import { Link } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiFacebook } from '@react-icons/all-files/fi/FiFacebook';
import { FiTwitter } from '@react-icons/all-files/fi/FiTwitter';
import { FiInstagram } from '@react-icons/all-files/fi/FiInstagram';
import { FiYoutube } from '@react-icons/all-files/fi/FiYoutube';
import { FiLinkedin } from '@react-icons/all-files/fi/FiLinkedin';
import { FiMail } from '@react-icons/all-files/fi/FiMail';
import { FiPhone } from '@react-icons/all-files/fi/FiPhone';
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiHeadphones } from '@react-icons/all-files/fi/FiHeadphones';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Top Section - Back to Top */}
      <div className="footer-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span>Back to top</span>
      </div>

      {/* Trust Features */}
      <div className="footer-trust">
        <div className="trust-container">
          <div className="trust-item">
            <FiTruck className="trust-icon" />
            <div>
              <h4>Free Delivery</h4>
              <p>On orders over ₹500</p>
            </div>
          </div>
          <div className="trust-item">
            <FiShield className="trust-icon" />
            <div>
              <h4>Secure Payments</h4>
              <p>100% secure checkout</p>
            </div>
          </div>
          <div className="trust-item">
            <FiHeadphones className="trust-icon" />
            <div>
              <h4>24/7 Support</h4>
              <p>Dedicated support</p>
            </div>
          </div>
          <div className="trust-item">
            <FiHeart className="trust-icon" />
            <div>
              <h4>Quality Assured</h4>
              <p>Verified farmers only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="footer-main">
        <div className="footer-container">
          {/* Company Info */}
          <div className="footer-column brand-column">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">🌾</span>
              <span className="logo-text">AgriLink</span>
            </Link>
            <p className="footer-tagline">
              Connecting farmers directly to consumers. Fresh produce, fair prices, sustainable future.
            </p>
            <div className="footer-contact">
              <a href="mailto:support@agrilink.com">
                <FiMail /> support@agrilink.com
              </a>
              <a href="tel:+911800123456">
                <FiPhone /> 1800-123-456 (Toll Free)
              </a>
              <span>
                <FiMapPin /> Mumbai, Maharashtra, India
              </span>
            </div>
          </div>

          {/* Get to Know Us */}
          <div className="footer-column">
            <h3>Get to Know Us</h3>
            <ul>
              <li><Link to="/about">About AgriLink</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press Releases</Link></li>
              <li><Link to="/investors">Investor Relations</Link></li>
              <li><Link to="/sustainability">Sustainability</Link></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div className="footer-column">
            <h3>Connect With Us</h3>
            <ul>
              <li><Link to="/farmers">Meet Our Farmers</Link></li>
              <li><Link to="/register?role=FARMER">Sell on AgriLink</Link></li>
              <li><Link to="/blog">Blog & Stories</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/refer">Refer & Earn</Link></li>
            </ul>
          </div>

          {/* Make Money With Us */}
          <div className="footer-column">
            <h3>Make Money With Us</h3>
            <ul>
              <li><Link to="/register?role=FARMER">Become a Seller</Link></li>
              <li><Link to="/seller-support">Seller Support</Link></li>
              <li><Link to="/advertise">Advertise Your Products</Link></li>
              <li><Link to="/affiliate">Affiliate Program</Link></li>
              <li><Link to="/warehouse">Warehouse Services</Link></li>
            </ul>
          </div>

          {/* Let Us Help You */}
          <div className="footer-column">
            <h3>Let Us Help You</h3>
            <ul>
              <li><Link to="/profile">Your Account</Link></li>
              <li><Link to="/orders">Your Orders</Link></li>
              <li><Link to="/shipping">Shipping Rates & Policies</Link></li>
              <li><Link to="/returns">Returns & Replacements</Link></li>
              <li><Link to="/help">Help Center</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Social & App Links */}
      <div className="footer-social">
        <div className="footer-container">
          <div className="social-links">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://facebook.com/agrilink" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href="https://twitter.com/agrilink" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="https://instagram.com/agrilink" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="https://youtube.com/agrilink" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <FiYoutube />
              </a>
              <a href="https://linkedin.com/company/agrilink" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
            </div>
          </div>

          <div className="app-download">
            <h4>Download App</h4>
            <div className="app-buttons">
              <button className="app-btn" onClick={() => alert('Coming soon to App Store!')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
              </button>
              <button className="app-btn" onClick={() => alert('Coming soon to Play Store!')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" />
              </button>
            </div>
          </div>

          <div className="payment-methods">
            <h4>We Accept</h4>
            <div className="payment-icons">
              <span>💳 Visa</span>
              <span>💳 Mastercard</span>
              <span>📱 UPI</span>
              <span>🏦 Net Banking</span>
              <span>💰 Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-legal">
            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
          <div className="footer-copyright">
            <p>© {currentYear} AgriLink. All rights reserved.</p>
            <p>Made with ❤️ for Indian Farmers</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
