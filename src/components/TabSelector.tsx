import { Action } from './actions';

const TabSelector: React.FC<{ dispatch: React.Dispatch<Action> }> = ({
  dispatch,
}) => {
  const handleToggleTools = () => {
    dispatch({ type: 'TOGGLE_TOOLS', payload: true });
  };

  return (
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
  );
};

export default TabSelector;
