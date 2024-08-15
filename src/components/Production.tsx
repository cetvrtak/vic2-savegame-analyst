import { useEffect, useState } from 'react';

type World = {
  [key: string]: {
    rgo?: {
      goods_type: string;
      employment: {
        employees: {
          key: { count: string } | { count: string }[];
        };
      };
    };
    owner: string;
    name: string;
  };
};

type ProductionProps = {
  world: World;
};

const Production: React.FC<ProductionProps> = ({ world }) => {
  const countries = ['RUS', 'ARA', 'GRE'];
  const tradeGoods = ['tobacco', 'cotton', 'fruit'];
  const [production, setProduction] = useState<{
    [key: string]: { [key: string]: number };
  }>({});

  useEffect(() => {
    function calculateProduction() {
      const productionData: { [key: string]: { [key: string]: number } } = {};

      for (const country of countries) {
        productionData[country] = {};
        for (const good of tradeGoods) {
          productionData[country][good] = 0;
        }
      }

      for (const key in world) {
        const goodsType = world[key].rgo?.goods_type || '';
        const owner = world[key].owner || '';

        if (countries.includes(owner) && tradeGoods.includes(goodsType)) {
          const province = world[key];
          //       Output
          // Production = Base Production * Throughput * Output Efficiency

          // Base Production = Province Size * ( 1 + Terrain + RGO Size Modifiers ) * Output Amount (in table below)
          //       Province Size
          // Example:

          // Base workerplaces: 40000
          const baseWorkplaces = 40000;
          // Farmers in province : 90000
          const employees = province.rgo!.employment.employees.key;
          const employeesSize = Array.isArray(employees)
            ? employees.reduce((acc, cur) => (acc += +cur.count), 0)
            : +employees.count;

          // Terrain modifier: -10%
          console.log(province);
          // 40000 * (100% - 10%) = 36000
          // 90000 / 36000 = 2.5
          // Rounding up gives 3.
          // Multiplying by 1.5 gives 4.5.
          // Rounding down gives 4. This will then be the province size.

          // Throughput = (Number of workers / Max Workers) * ( 1 + RGO Throughput Efficiency Modifiers - War Exhaustion ) * oversea penalty
          // Output Efficiency = 1 + Aristocrat % in State + RGO Output Efficiency Modifiers + Terrain + Province Infrastructure * ( 1 + Mobilized Penalty)
          // The number of workers is limited by the maximum number of workers employable by the RGO, calculated using this formula:

          // Max Workers = base (40000) * Province Size * ( 1 + Terrain + RGO Size Modifiers )

          productionData[owner][goodsType!] += employeesSize;
        }
      }

      setProduction(productionData);
    }

    calculateProduction();
  }, []);

  return (
    <div>
      <div className="country-selector">
        <div className="btn-wrapper">
          {countries.map((tag) => (
            <button className="btn" value={tag} key={tag}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="goods-selector">
        <div className="btn-wrapper">
          {tradeGoods.map((good) => (
            <button className="btn" value={good} key={good}>
              {good}
            </button>
          ))}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Country</th>
            {tradeGoods.map((goodsType) => (
              <th key={goodsType}>{goodsType}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {countries.map((tag) => (
            <tr key={tag}>
              <td>{tag}</td>
              {tradeGoods.map((goodsType) => (
                <td key={goodsType}>{production[tag]?.[goodsType] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Production;
