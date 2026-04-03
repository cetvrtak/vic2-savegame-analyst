import styles from './ToolsIcon.module.css';

const ToolsIcon: React.FC<{
  toggleTools: () => void;
}> = ({ toggleTools }) => {
  return (
    <div>
      <div className={styles.toolsIconContainer} onClick={() => toggleTools()}>
        <img src="tools.svg" alt="Tools Icon" className={styles.toolsIcon} />
      </div>
    </div>
  );
};

export default ToolsIcon;
