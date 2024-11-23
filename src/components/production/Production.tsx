import { useEffect, useState } from 'react';
import { useData } from '../DataContext';

interface TerrainData {
  farm_rgo_size?: string;
  [key: string]: any;
}
type TerrainType = Record<string, TerrainData>;

type Province = {
  farmers: { size: string } | { size: string }[];
  labourers: { size: string } | { size: string }[];
  rgo?: {
    goods_type: string;
    employment: {
      employees: {
        count: string;
        key: { count: string } | { count: string }[];
      };
    };
  };
  owner: string;
  name: string;
  modifier: { modifier: string }[];
};

type Country = {
  [reform: string]: string;
};
type Issues = Record<string, any>;
type World = Record<string, Province | Country>;

type ProductionProps = {
  world: World;
};

const GetProvinceSize = (
  key: string,
  province: Province,
  terrain: TerrainType,
  provinceTerrainMapping: Record<string, string>
): number => {
  const baseWorkplaces = 40000;
  const farmers = province.hasOwnProperty('farmers')
    ? province.farmers
    : province.labourers;
  const numFarmers = Array.isArray(farmers)
    ? farmers?.reduce((acc, cur) => (acc += +cur.size), 0)
    : +farmers.size;

  const terrainType = provinceTerrainMapping[key];
  const terrainModifier = Number(terrain[terrainType]?.farm_rgo_size);

  return Math.floor(
    1.5 * Math.ceil(numFarmers / baseWorkplaces / (1 + terrainModifier))
  );
};

const GetContinentModifier = (
  key: string,
  continents: Record<string, any>,
  rgoSizeKey: string
): number => {
  return Object.values(continents).reduce(
    (modifier: number, cur: Record<string, any>) =>
      (modifier = cur.provinces.key.includes(key)
        ? Number(cur[rgoSizeKey] || 0)
        : modifier),
    0
  );
};

const GetIssuesModifier = (
  country: Country,
  issues: Issues,
  rgoSizeKey: string
): number => {
  return Object.values(issues).reduce((acc, category) => {
    Object.entries(category as Issues).forEach(([reformName, reform]) => {
      Object.entries(reform as Issues).forEach(([stanceName, stance]) => {
        if (
          stance.hasOwnProperty(rgoSizeKey) &&
          country[reformName] === stanceName
        ) {
          acc += +stance[rgoSizeKey];
        }
      });
    });
    return acc;
  }, 0);
};

function GetCountryData(
  countries: string[],
  world: World,
  issues: Record<string, any>
) {
  const countryData: Record<string, any> = {};
  for (const country of countries) {
    countryData[country] = {
      farm_rgo_size: GetIssuesModifier(
        world[country] as Country,
        issues,
        'farm_rgo_size'
      ),
      mine_rgo_size: GetIssuesModifier(
        world[country] as Country,
        issues,
        'mine_rgo_size'
      ),
    };
  }

  return countryData;
}

const Production: React.FC<ProductionProps> = ({ world }) => {
  const countries = ['RUS', 'ARA', 'GRE'];
  const tradeGoods = ['tobacco', 'cotton', 'fruit'];
  const [production, setProduction] = useState<{
    [key: string]: { [key: string]: number };
  }>({});

  const { data, loadJsonFiles } = useData();

  useEffect(() => {
    loadJsonFiles([
      'common/issues.json',
      'common/modifiers.json',
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

      const countryData = GetCountryData(countries, world, issues);

      for (const country of countries) {
        productionData[country] = {};
        for (const good of tradeGoods) {
          productionData[country][good] = 0;
        }
      }

      for (const key in world) {
        const province = world[key] as Province;
        const goodsType = province.rgo?.goods_type || '';
        const ownerTag = province.owner || '';

        if (countries.includes(ownerTag) && tradeGoods.includes(goodsType)) {
          //       Output
          // Production = Base Production * Throughput * Output Efficiency

          // Base Production = Province Size * ( 1 + Terrain + RGO Size Modifiers ) * Output Amount (in table below)
          const provinceSize = GetProvinceSize(
            key,
            province,
            terrain,
            terrainMap
          );

          const terrainType = terrainMap[key];
          const rgoSizeKey = province.hasOwnProperty('farmers')
            ? 'farm_rgo_size'
            : 'mine_rgo_size';
          const terrainModifier = Number(terrain[terrainType][rgoSizeKey]);

          const provinceRgoSizeModifier = Array.isArray(province.modifier)
            ? province.modifier.reduce(
                (acc, m) => (acc += +modifiers[m.modifier][rgoSizeKey] || 0),
                0
              )
            : 0;
          const continentRgoSizeModifier = GetContinentModifier(
            key,
            continents,
            rgoSizeKey
          );

          const issuesRgoSizeModifier = countryData[ownerTag][rgoSizeKey];
          const rgoSizeModifier =
            provinceRgoSizeModifier +
            continentRgoSizeModifier +
            issuesRgoSizeModifier;

          const baseProduction =
            provinceSize * (1 + terrainModifier + rgoSizeModifier);

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
