import React, { useState } from 'react';
import { Action } from './actions';
import JsonExporter from '../tools/JsonExporter';
import TerrainMapper from '../tools/TerrainMapper';
import AdjacencyMapper from '../tools/AdjacencyMapper';
import ToolsMenuItem from './ToolsMenuItem';
import PortMapper from '../tools/PortMapper';

const Header: React.FC<{ dispatch: React.Dispatch<Action> }> = ({
  dispatch,
}) => {
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
        <ul
          className="tab-selector"
          onClick={(e) =>
            dispatch({
              type: 'SET_ACTIVE_TAB',
              payload: (e.target as HTMLButtonElement).value,
            })
          }
        >
          <li className="tab" key="population">
            <button className="btn tab-btn" value="population">
              Population
            </button>
          </li>
          <li className="tab" key="popsNeeds">
            <button className="btn tab-btn" value="popsNeeds">
              Pops Needs
            </button>
          </li>
          <li className="tab" key="production">
            <button className="btn tab-btn" value="production">
              Production
            </button>
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

export default Header;
