import { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { TerrainType, ProductionProps } from './types';
import World from '../utils/World';
import Country from '../utils/Country';
import Province from '../utils/Province';

const Production: React.FC<ProductionProps> = ({ saveData }) => {
  const selectedTags = ['RUS', 'ARA', 'GRE'];
  const selectedGoods = ['tobacco', 'cotton', 'fruit'];
  const [production, setProduction] = useState<{
    [key: string]: { [key: string]: number };
  }>({});

  const { data, loadJsonFiles } = useData();

  useEffect(() => {
    loadJsonFiles([
      'common/issues.json',
      'common/modifiers.json',
      'common/production_types.json',
      'map/continent.json',
      'map/provinceTerrainMapping.json',
      'map/terrain.json',
    ]);
  }, []);

  useEffect(() => {
    if (!data) return;

    function calculateProduction() {
      const productionData: { [key: string]: { [key: string]: number } } = {};

      const terrainMap: Record<string, string> = data.provinceTerrainMapping;
      const terrain: TerrainType = data.terrain.categories;
      const modifiers: Record<string, any> = data.modifiers;
      const continents: Record<string, any> = data.continent;
      const issues: Record<string, any> = data.issues;
      const world = new World(saveData, data);

      const countries: Record<string, any> = {};
      for (const tag of selectedTags) {
        const country = new Country(tag, saveData[tag]);
        country.farm_rgo_size = country.GetRgoSize(issues, 'farm_rgo_size');
        country.mine_rgo_size = country.GetRgoSize(issues, 'mine_rgo_size');
        countries[tag] = country;

        productionData[tag] = {};
        for (const good of selectedGoods) {
          productionData[tag][good] = 0;
        }
      }

      for (const key in saveData) {
        const province = new Province(key, saveData[key]);
        const goodsType = province.data.rgo?.goods_type || '';
        const ownerTag = province.data.owner || '';

        if (
          selectedTags.includes(ownerTag) &&
          selectedGoods.includes(goodsType)
        ) {
          //       Output
          // Production = Base Production * Throughput * Output Efficiency

          // Base Production = Province Size * ( 1 + Terrain + RGO Size Modifiers ) * Output Amount (in table below)
          const provinceSize = province.GetProvinceSize(terrain, terrainMap);

          const terrainType = terrainMap[key];
          const rgoSizeKey = `${province.rgoType}_rgo_size`;
          const terrainModifier = Number(terrain[terrainType][rgoSizeKey]);

          const provinceRgoSize = province.GetRgoSize(modifiers, continents);
          const countryRgoSize = countries[ownerTag][rgoSizeKey];
          const rgoSizeModifier = provinceRgoSize + countryRgoSize;

          const baseOutput = world.goodsOutput[goodsType];

          const baseProduction =
            provinceSize * (1 + terrainModifier + rgoSizeModifier) * baseOutput;

          // Throughput = (Number of workers / Max Workers) * ( 1 + RGO Throughput Efficiency Modifiers - War Exhaustion ) * oversea penalty
          const throughput = 1;

          // Output Efficiency = 1 + Aristocrat % in State + RGO Output Efficiency Modifiers + Terrain + Province Infrastructure * ( 1 + Mobilized Penalty)
          // The number of workers is limited by the maximum number of workers employable by the RGO, calculated using this formula:

          // Max Workers = base (40000) * Province Size * ( 1 + Terrain + RGO Size Modifiers )
          const outputEfficiency = 1;

          const production = baseProduction * throughput * outputEfficiency;

          productionData[ownerTag][goodsType!] +=
            Math.round(production * 10) / 10;
        }
      }

      setProduction(productionData);
    }

    calculateProduction();
  }, [data]);

  return (
    <div>
      <div className="country-selector">
        <div className="btn-wrapper">
          {selectedTags.map((tag) => (
            <button className="btn" value={tag} key={tag}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="goods-selector">
        <div className="btn-wrapper">
          {selectedGoods.map((good) => (
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
            {selectedGoods.map((goodsType) => (
              <th key={goodsType}>{goodsType}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedTags.map((tag) => (
            <tr key={tag}>
              <td>{tag}</td>
              {selectedGoods.map((goodsType) => (
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
