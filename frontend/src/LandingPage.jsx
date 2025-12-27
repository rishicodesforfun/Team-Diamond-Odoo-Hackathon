import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div className="landing-page" ref={containerRef}>
      <div className="background-animation" style={{
        '--mouse-x': `${mousePosition.x}px`,
        '--mouse-y': `${mousePosition.y}px`
      }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="landing-header">
        <button className="auth-button" onClick={() => navigate('/auth')}>
          Login / Sign Up
        </button>
      </header>

      <div className="landing-content">
        <h1 className="landing-title">GearGuard</h1>
        <p className="landing-subtitle">Smart Maintenance Planner</p>
      </div>
    </div>
  );
}

export default LandingPage;
