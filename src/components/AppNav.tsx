import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const AppNav: React.FC = () => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleToggleTools = () => {
    setShowToolsMenu((show) => !show);
  };

  return (
    <header>
      <div className="tab-selector-container btn-wrapper">
        <ul className="tab-selector">
          <li className="tab" key="population">
            <NavLink to="/population" className="btn tab-btn">
              Population
            </NavLink>
          </li>
          <li className="tab" key="popsNeeds">
            <NavLink to="/pops-needs" className="btn tab-btn">
              Pops Needs
            </NavLink>
          </li>
          <li className="tab" key="production">
            <NavLink to="/production" className="btn tab-btn">
              Production
            </NavLink>
          </li>
        </ul>

        <div className="tools-icon-container" onClick={handleToggleTools}>
          <img src="tools.svg" alt="Tools Icon" className="tools-icon" />
        </div>
      </div>
    </header>
  );
};

export default AppNav;
