import { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { ProductionData, ProductionProps } from './types';
import World from '../utils/World';
import Province from '../utils/Province';
import Country from '../utils/Country';

const Production: React.FC<ProductionProps> = ({ saveData }) => {
  const selectedTags = ['RUS', 'ARA', 'GRE'];
  const selectedGoods = ['tobacco', 'cotton', 'fruit'];
  const [production, setProduction] = useState<ProductionData>({});
  const [jsonFilesLoaded, setJsonFilesLoaded] = useState<Boolean>(false);

  const { data, loadJsonFiles, loadCsvFiles } = useData();

  const calculateBaseProduction = (
    province: Province,
    owner: Country,
    rgoWorkers: string[],
    baseOutput: number
  ): number => {
    // Base Production = Province Size * ( 1 + Terrain + RGO Size Modifiers ) * Output Amount (in table below)
    return (
      province.GetProvinceSize(rgoWorkers) *
      (1 +
        province.rgoSize +
        owner.GetRgoSize(province.rgoType, province.goodsType)) *
      baseOutput
    );
  };

  const calculateThroughput = (
    province: Province,
    owner: Country,
    rgoWorkers: string[]
  ): number => {
    // Throughput = (Number of workers / Max Workers) * ( 1 + RGO Throughput Efficiency Modifiers - War Exhaustion ) * oversea penalty
    const numWorkers = province.GetNumWorkers();
    const maxWorkers =
      40000 *
      province.GetProvinceSize(rgoWorkers) *
      (1 +
        province.rgoSize +
        owner.GetRgoSize(province.rgoType, province.goodsType));

    const rgoThroughputEffModifier =
      province.GetModifier('local_RGO_throughput', owner.data.national_focus) +
      owner.GetRgoThroughputEff(province.rgoType);

    const isOverseas = owner.isOverseas(province.id);
    const overseasPenalty = Number(isOverseas) * owner.data.overseas_penalty;

    // Mobilization impacts throughput, Wiki is wrong
    return (
      (numWorkers / maxWorkers) *
      (1 + rgoThroughputEffModifier) *
      (1 - overseasPenalty) *
      (1 + owner.mobilizedPenalty)
    );
  };

  const calculateOutputEff = (
    province: Province,
    owner: Country,
    controller: Country,
    enemies: Country[],
    isUnderSiege: boolean
  ): number => {
    // Output Efficiency = 1 + Aristocrat % in State + RGO Output Efficiency Modifiers + Terrain + Province Infrastructure * ( 1 + Mobilized Penalty)
    const aristocratsPercentage = owner.GetPopsPercentageInState(
      'aristocrats',
      owner.GetStateId(province.id)
    );

    const rgoOutputEff =
      province.GetRgoEff(owner, controller, enemies, isUnderSiege) +
      owner.GetRgoEff(province.rgoType, province.goodsType);

    const terrainRgoEff = province.GetRgoEffFromTerrain();

    const infraPct = Number(province.data.infrastructure) || 0;
    // The number of workers is limited by the maximum number of workers employable by the RGO, calculated using this formula:

    // Max Workers = base (40000) * Province Size * ( 1 + Terrain + RGO Size Modifiers )
    return 1 + aristocratsPercentage + rgoOutputEff + terrainRgoEff + infraPct;
  };

  useEffect(() => {
    (async () => {
      await loadJsonFiles([
        'common/crime.json',
        'common/issues.json',
        'common/modifiers.json',
        'common/national_focus.json',
        'common/nationalvalues.json',
        'common/production.json',
        'history/pops.json',
        'inventions.json',
        'map/adjacencyMap.json',
        'map/continents.json',
        'map/portMap.json',
        'map/region.json',
        'map/terrainMap.json',
        'map/terrain.json',
        'poptypes.json',
        'technologies.json'
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

      for (const tag of selectedTags) {
        productionData[tag] = {};
        for (const good of selectedGoods) {
          productionData[tag][good] = 0;
        }

        const owner = world.GetCountry(tag);
        const enemies: Country[] = Array.from(owner.enemies).map((tag) =>
          world.GetCountry(tag)
        );

        for (const province of Object.values(owner.ownedProvinces)) {
          const goodsType = province.data.rgo?.goods_type || '';

          if (selectedGoods.includes(goodsType)) {
            //       Output
            // Production = Base Production * Throughput * Output Efficiency

            const baseProduction = calculateBaseProduction(
              province,
              owner,
              world.rgoWorkers,
              world.goodsOutput[goodsType]
            );

            const throughput = calculateThroughput(
              province,
              owner,
              world.rgoWorkers
            );

            const outputEfficiency = calculateOutputEff(
              province,
              owner,
              world.GetCountry(province.data.controller),
              enemies,
              world.IsUnderSiege(province.id)
            );

            const production = baseProduction * throughput * outputEfficiency;

            productionData[owner.tag][goodsType!] += production;
          }
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
