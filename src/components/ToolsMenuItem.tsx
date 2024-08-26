import { ReactElement, useState } from 'react';

type ItemProps = {
  title: string;
  icon: string;
  children: ReactElement;
  menuHovered: boolean;
};

const ToolsMenuItem: React.FC<ItemProps> = ({
  title,
  icon,
  children,
  menuHovered,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded((expanded) => !expanded);
  };

  return (
    <div className="tool-container">
      <div className="tool-item">
        <img className="tool-icon" src={icon} alt={`${title} Icon`} />
        <div className="tool-title btn-wrapper" onClick={handleExpand}>
          <h2 className="title-black">{title}</h2>
          <img
            className={`tool-expand-icon ${
              expanded ? 'tool-collapse-icon' : ''
            }`}
            src="chevron-down.svg"
            alt="Chevron Down Icon"
          />
        </div>
      </div>
      <div
        className={`tool-box btn-wrapper ${
          menuHovered && expanded ? 'tool-box-expanded' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ToolsMenuItem;
