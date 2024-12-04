import { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { ProductionData, ProductionProps } from './types';
import World from '../utils/World';
import Country from '../utils/Country';
import Province from '../utils/Province';

const Production: React.FC<ProductionProps> = ({ saveData }) => {
  const selectedTags = ['RUS', 'ARA', 'GRE'];
  const selectedGoods = ['tobacco', 'cotton', 'fruit'];
  const [production, setProduction] = useState<ProductionData>({});
  const [jsonFilesLoaded, setJsonFilesLoaded] = useState<Boolean>(false);

  const { data, loadJsonFiles, loadCsvFiles } = useData();

  useEffect(() => {
    (async () => {
      await loadJsonFiles([
        'common/issues.json',
        'common/modifiers.json',
        'common/national_focus.json',
        'common/nationalvalues.json',
        'common/production.json',
        'history/pops.json',
        'map/adjacencyMap.json',
        'map/continents.json',
        'map/region.json',
        'map/terrainMap.json',
        'map/terrain.json',
      ]);
      await loadCsvFiles(['map/adjacencies.csv']);
      setJsonFilesLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!jsonFilesLoaded) return;

    function calculateProduction() {
      const productionData: ProductionData = {};

      const world = new World(saveData, data);

      const countries: Record<string, any> = {};
      for (const tag of selectedTags) {
        const country = new Country(tag, saveData[tag]);
        country.farm_rgo_size = country.GetModifierFromIssues(
          data.issues,
          'farm_rgo_size'
        );
        country.mine_rgo_size = country.GetModifierFromIssues(
          data.issues,
          'mine_rgo_size'
        );
        country.rgo_throughput_eff = country.GetRgoThroughputEff(
          data.modifiers,
          data.issues,
          data.nationalvalues
        );

        const provinces = Object.entries(saveData).filter(
          ([_, provinceData]) => provinceData.controller === tag
        );
        country.SetControlledProvinces(provinces);
        country.SetStraitsConnections(world.straits);
        country.SetControlledProvinceNeighbors(data.adjacencyMap);
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
          const provinceSize = province.GetProvinceSize(
            data.terrain.categories,
            data.terrainMap,
            data.pops[key], // province pops
            world.rgoWorkers
          );

          const terrainType = data.terrainMap[key];
          const rgoSizeKey = `${province.rgoType}_rgo_size`;
          const terrainModifier = Number(
            data.terrain.categories[terrainType][rgoSizeKey]
          );

          const provinceRgoSize = province.GetRgoSize(
            data.modifiers,
            data.continents
          );
          const countryRgoSize = countries[ownerTag][rgoSizeKey];
          const rgoSizeModifier = provinceRgoSize + countryRgoSize;

          const baseOutput = world.goodsOutput[goodsType];

          const baseProduction =
            provinceSize * (1 + terrainModifier + rgoSizeModifier) * baseOutput;

          // Throughput = (Number of workers / Max Workers) * ( 1 + RGO Throughput Efficiency Modifiers - War Exhaustion ) * oversea penalty
          const numWorkers = province.GetNumWorkers();
          const maxWorkers =
            40000 * provinceSize * (1 + terrainModifier + rgoSizeModifier);
          const rgoThroughputEff = countries[ownerTag].rgo_throughput_eff;
          const localRgoThroughputEff = province.GetRgoThroughputEff(
            data.modifiers,
            data.national_focus,
            Object.entries(data.region),
            countries[ownerTag].data.national_focus
          );

          const isOverseas = countries[ownerTag].isOverseas(
            province.id,
            world.provinceToContinentMap
          );
          const overseasPenalty = 1;

          const throughput =
            (numWorkers / maxWorkers) *
            (1 + rgoThroughputEff + localRgoThroughputEff) *
            overseasPenalty;

          // Output Efficiency = 1 + Aristocrat % in State + RGO Output Efficiency Modifiers + Terrain + Province Infrastructure * ( 1 + Mobilized Penalty)
          // The number of workers is limited by the maximum number of workers employable by the RGO, calculated using this formula:

          // Max Workers = base (40000) * Province Size * ( 1 + Terrain + RGO Size Modifiers )
          const outputEfficiency = 1;

          const production = baseProduction * throughput * outputEfficiency;

          productionData[ownerTag][goodsType!] += production;
        }
      }

      setProduction(productionData);
    }

    calculateProduction();
  }, [jsonFilesLoaded]);

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
          {Object.entries(production).map(([tag, data]) => (
            <tr key={tag}>
              <td>{tag}</td>
              {Object.entries(data).map(([goodsType, value]) => (
                <td key={goodsType}>{value.toFixed(1) || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Production;
