const ToolsIcon: React.FC<{
  toggleTools: () => void;
}> = ({ toggleTools }) => {
  return (
    <div>
      <div className="tools-icon-container" onClick={() => toggleTools()}>
        <img src="tools.svg" alt="Tools Icon" className="tools-icon" />
      </div>
    </div>
  );
};

export default ToolsIcon;
