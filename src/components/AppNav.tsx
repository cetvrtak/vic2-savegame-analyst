import React from 'react';
import { NavLink } from 'react-router-dom';

const AppNav: React.FC = () => {
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
      </div>
    </header>
  );
};

export default AppNav;
