import { useState } from 'react';
import AdjacencyMapper from './AdjacencyMapper';
import JsonExporter from './JsonExporter';
import TerrainMapper from './TerrainMapper';
import PortMapper from './PortMapper';
import ToolsMenuItem from './ToolsMenuItem';
import ToolsIcon from './ToolsIcon';

const Tools: React.FC = () => {
  const [showTools, setShowTools] = useState(false);

  const toggleTools = () => {
    setShowTools((prevShowTools) => !prevShowTools);
  };

  return (
    <>
      <div
        className={`tools-menu ${showTools ? 'tools-menu-open' : ''}`}
        onMouseEnter={() => setShowTools(true)}
        onMouseLeave={() => setShowTools(false)}
      >
        <div className="tools-close" onClick={toggleTools}>
          &times;
        </div>
        <ToolsMenuItem
          title="JSON Exporter"
          icon="json.svg"
          menuHovered={showTools}
        >
          <JsonExporter />
        </ToolsMenuItem>
        <ToolsMenuItem
          title="Terrain Mapper"
          icon="terrain.svg"
          menuHovered={showTools}
        >
          <TerrainMapper />
        </ToolsMenuItem>
        <ToolsMenuItem
          title="Adjacency Mapper"
          icon="adjacency.svg"
          menuHovered={showTools}
        >
          <AdjacencyMapper />
        </ToolsMenuItem>

        <ToolsMenuItem
          title="Port Mapper"
          icon="port.svg"
          menuHovered={showTools}
        >
          <PortMapper />
        </ToolsMenuItem>
      </div>

      <ToolsIcon toggleTools={toggleTools} />
    </>
  );
};

export default Tools;
