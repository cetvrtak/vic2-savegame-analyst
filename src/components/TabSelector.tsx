import { Action } from './actions';

const TabSelector: React.FC<{ dispatch: React.Dispatch<Action> }> = ({
  dispatch,
}) => {
  return (
    <ul
      className="tab-selector btn-wrapper"
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
      <li className="tab" key="production">
        <button className="btn tab-btn" value="production">
          Production
        </button>
      </li>
    </ul>
  );
};

export default TabSelector;
