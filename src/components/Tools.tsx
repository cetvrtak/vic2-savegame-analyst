import AdjacencyMapper from '../tools/AdjacencyMapper';
import JsonExporter from '../tools/JsonExporter';
import TerrainMapper from '../tools/TerrainMapper';
import PortMapper from '../tools/PortMapper';
import ToolsMenuItem from './ToolsMenuItem';
import { Action } from './actions';

const Tools: React.FC<{
  showTools: Boolean;
  dispatch: React.Dispatch<Action>;
}> = ({ showTools, dispatch }) => {
  return (
    <div
      className={`tools-menu ${showTools ? 'tools-menu-open' : ''}`}
      onMouseEnter={() => {
        dispatch({ type: 'TOGGLE_TOOLS', payload: true });
      }}
      onMouseLeave={() => {
        dispatch({ type: 'TOGGLE_TOOLS', payload: false });
      }}
    >
      <div
        className="tools-close"
        onClick={() => {
          dispatch({ type: 'TOGGLE_TOOLS', payload: !showTools });
        }}
      >
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
  );
};

export default Tools;
