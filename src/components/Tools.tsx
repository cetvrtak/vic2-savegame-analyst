import JsonExporter from '../tools/JsonExporter';
import TerrainMapper from '../tools/TerrainMapper';
import { Action } from './actions';

const Tools: React.FC<{
  showTools: Boolean;
  dispatch: React.Dispatch<Action>;
}> = ({ showTools, dispatch }) => {
  const style = {
    transform: `translate(${showTools ? '0' : '100%'})`,
    transition: 'all 0.7s ease-out 0s',
    height: `${window.innerHeight}px`,
  };
  const handleToggleTools = () => {
    dispatch({ type: 'TOGGLE_TOOLS', payload: false });
  };

  return (
    <div className="tools-menu" style={style}>
      <div className="tools-close" onClick={handleToggleTools}>
        &times;
      </div>
      <JsonExporter />
      <TerrainMapper />
    </div>
  );
};

export default Tools;
