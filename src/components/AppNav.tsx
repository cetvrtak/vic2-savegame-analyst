import React, { useState } from 'react';
import JsonExporter from '../tools/JsonExporter';
import TerrainMapper from '../tools/TerrainMapper';
import AdjacencyMapper from '../tools/AdjacencyMapper';
import ToolsMenuItem from './ToolsMenuItem';
import PortMapper from '../tools/PortMapper';
import { NavLink } from 'react-router-dom';

const AppNav: React.FC = () => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleToggleTools = () => {
    setShowToolsMenu((show) => !show);
  };

  const handleMouseEnter = () => {
    setShowToolsMenu(true);
  };

  const handleMouseLeave = () => {
    setShowToolsMenu(false);
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

      <div
        className={`tools-menu ${showToolsMenu ? 'tools-menu-open' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="tools-close" onClick={handleToggleTools}>
          &times;
        </div>
        <ToolsMenuItem
          title="JSON Exporter"
          icon="json.svg"
          menuHovered={showToolsMenu}
        >
          <JsonExporter />
        </ToolsMenuItem>
        <ToolsMenuItem
          title="Terrain Mapper"
          icon="terrain.svg"
          menuHovered={showToolsMenu}
        >
          <TerrainMapper />
        </ToolsMenuItem>
        <ToolsMenuItem
          title="Adjacency Mapper"
          icon="adjacency.svg"
          menuHovered={showToolsMenu}
        >
          <AdjacencyMapper />
        </ToolsMenuItem>

        <ToolsMenuItem
          title="Port Mapper"
          icon="port.svg"
          menuHovered={showToolsMenu}
        >
          <PortMapper />
        </ToolsMenuItem>
      </div>
    </header>
  );
};

export default AppNav;
