const Main: React.FC<any> = ({ world }) => {
  return (
    <main>
      <span>
        Player tag ~ <strong>{world.player}</strong>
      </span>
      <div className="row"></div>
    </main>
  );
};

export default Main;
