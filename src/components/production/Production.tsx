import { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { ProductionData, ProductionProps, ProvinceData } from './types';
import World from '../utils/World';
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
        'technologies.json',
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
      world.CreateCountries(selectedTags);

      for (const tag of selectedTags) {
        productionData[tag] = {};
        for (const good of selectedGoods) {
          productionData[tag][good] = 0;
        }
      }

      for (const key in saveData) {
        const provinceData = saveData[key] as ProvinceData;
        const goodsType = provinceData.rgo?.goods_type || '';
        const ownerTag = provinceData.owner || '';

        if (
          selectedTags.includes(ownerTag) &&
          selectedGoods.includes(goodsType)
        ) {
          const province = new Province(key, provinceData);
          const owner = world.GetCountry(ownerTag);
          const controller = world.GetCountry(province.data.controller);
          //       Output
          // Production = Base Production * Throughput * Output Efficiency

          // Base Production = Province Size * ( 1 + Terrain + RGO Size Modifiers ) * Output Amount (in table below)
          const provinceSize = province.GetProvinceSize(world.rgoWorkers);

          const terrainType = data.terrainMap[key];
          const rgoSizeKey = `${province.rgoType}_rgo_size`;
          const terrainModifier = Number(
            data.terrain.categories[terrainType][rgoSizeKey]
          );

          const provinceRgoSize = province.GetRgoSize();
          const countryRgoSize = owner.GetRgoSize(rgoSizeKey);
          const rgoSizeFromModifiers = provinceRgoSize + countryRgoSize;

          // Due to inconsistency in modifier naming in Vic2 files
          // we need to get both versions of a modifier
          const rgoSizeFromTech =
            owner.GetModifierFromTech('rgo_size', goodsType) +
            owner.GetModifierFromTech('RGO_size', goodsType);

          const rgoSizeFromInventions =
            owner.GetModifierFromInventions('rgo_size', goodsType) +
            owner.GetModifierFromInventions('RGO_size', goodsType);
          const rgoSizeFromTechnologies =
            rgoSizeFromTech + rgoSizeFromInventions;
          const rgoSizeModifier =
            rgoSizeFromModifiers + rgoSizeFromTechnologies;

          const baseOutput = world.goodsOutput[goodsType];

          const baseProduction =
            provinceSize * (1 + terrainModifier + rgoSizeModifier) * baseOutput;

          // Throughput = (Number of workers / Max Workers) * ( 1 + RGO Throughput Efficiency Modifiers - War Exhaustion ) * oversea penalty
          const numWorkers = province.GetNumWorkers();
          const maxWorkers =
            40000 * provinceSize * (1 + terrainModifier + rgoSizeModifier);
          const rgoThroughputEff = owner.rgo_throughput_eff;
          const localRgoThroughputEff = province.GetModifier(
            'local_RGO_throughput',
            owner.data.national_focus
          );

          const isOverseas = owner.isOverseas(province.id);
          const overseasPenalty =
            Number(isOverseas) * owner.data.overseas_penalty;

          const throughput =
            (numWorkers / maxWorkers) *
            (1 + rgoThroughputEff + localRgoThroughputEff) *
            (1 - overseasPenalty);

          // Output Efficiency = 1 + Aristocrat % in State + RGO Output Efficiency Modifiers + Terrain + Province Infrastructure * ( 1 + Mobilized Penalty)
          const aristocratsPercentage = owner.GetPopsPercentageInState(
            'aristocrats',
            owner.GetStateId(province.id)
          );
          const countryRgoOutput = owner.GetModifier('rgo_output', goodsType);
          const localRgoOutput =
            province.GetModifier(
              'local_rgo_output',
              owner.data.national_focus
            ) +
            province.GetModifier('local_RGO_output', owner.data.national_focus);
          const countryRgoEff =
            owner.GetModifier(`${province.rgoType}_rgo_eff`) +
            owner.GetModifier(`${province.rgoType}_RGO_eff`);
          const localRgoEff =
            province.GetModifier(
              `${province.rgoType}_rgo_eff`,
              owner.data.national_focus
            ) +
            province.GetModifier(
              `${province.rgoType}_RGO_eff`,
              owner.data.national_focus
            );

          const isUnderSiege = world.IsUnderSiege(province.id);
          const siegeRgoEff =
            Number(isUnderSiege) * world.GetRgoEffFromSiege(province.rgoType);

          // Province is blockaded by land when
          // * on another continent &&
          // * under siege || controller doesn't have port access to it
          const sameContinent = owner.sameContinentProvinces.has(province.id);
          const connectedPort = controller.GetConnectedPort(province.id);
          const landBlockade =
            !sameContinent && (isUnderSiege || !connectedPort);
          const blockadeRgoEff =
            Number(landBlockade) *
            data.modifiers.blockaded[`${province.rgoType}_rgo_eff`];

          const rgoEfficiency =
            countryRgoEff + localRgoEff + siegeRgoEff + blockadeRgoEff;
          const rgoOutputEff =
            countryRgoOutput + localRgoOutput + rgoEfficiency;
          // The number of workers is limited by the maximum number of workers employable by the RGO, calculated using this formula:

          // Max Workers = base (40000) * Province Size * ( 1 + Terrain + RGO Size Modifiers )
          const outputEfficiency = 1 + aristocratsPercentage + rgoOutputEff;

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
