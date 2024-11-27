// Use Province class to derive province data
// Either from other province object properties
// Or combined with game data
import { TerrainType, Employees } from '../production/types';

class Province {
  id: string;
  data: Record<string, any>;

  rgoType: string = '';

  constructor(id: string, data: Record<string, any>) {
    this.id = id;
    this.data = data;

    this.rgoType = this.data.hasOwnProperty('farmers') ? 'farm' : 'mine';
  }

  private AggregateWorkers = (
    pops: Record<string, any>,
    workerTypes: string[]): { type: string, size: number }[] => {
      return workerTypes.map((type) => {
        const poptype = pops[type];

        const size = Array.isArray(poptype)
          ? poptype.reduce((acc: number, pop: { size: number }) => acc += Number(pop.size), 0)
          : Number(poptype?.size) || 0;

        return { 'type': type, 'size': size };
      }
    );
  };

  GetProvinceSize = (
    terrain: TerrainType,
    provinceTerrainMapping: Record<string, string>,
    pops: Record<string, any>,
    workerTypes: string[]
  ): number => {
    /*** Vic2 considers only the largest rgo pop type for province size ***/
    /*** Usually it's farmers, if there are any ***/
    /*** otherwise it's serfs or slaves ***/

    const baseWorkplaces = 40000;

    let aggregatedWorkers = this.AggregateWorkers(pops, workerTypes);
    aggregatedWorkers.sort((a, b) => b.size - a.size);
    const numFarmers = aggregatedWorkers[0].size;

    const terrainType = provinceTerrainMapping[this.id];
    const terrainModifier = Number(
      terrain[terrainType][`${this.rgoType}_rgo_size`]
    );

    return Math.floor(
      1.5 * Math.ceil(numFarmers / baseWorkplaces / (1 + terrainModifier))
    );
  };

  GetRgoSizeFromModifiers = (modifiers: Record<string, any>) =>
    Array.isArray(this.data.modifier)
      ? this.data.modifier.reduce(
          (acc, m) =>
            (acc += +modifiers[m.modifier][`${this.rgoType}_rgo_size`] || 0),
          0
        )
      : 0;

  GetRgoSizeFromContinent = (continents: Record<string, any>): number => {
    return Object.values(continents).reduce(
      (modifier: number, continent: Record<string, any>) =>
        (modifier = continent.provinces.key.includes(this.id)
          ? Number(continent[`${this.rgoType}_rgo_size`] || 0)
          : modifier),
      0
    );
  };

  GetRgoSize = (
    modifiers: Record<string, any>,
    continents: Record<string, any>
  ): number => {
    return (
      this.GetRgoSizeFromModifiers(modifiers) +
      this.GetRgoSizeFromContinent(continents)
    );
  };

  GetNumWorkers = (): number => {
    if (!this.data.rgo.employment.employees) return 0;

    const employees = this.data.rgo.employment.employees.key;

    return Array.isArray(employees)
      ? employees.reduce(
          (acc: number, cur: Employees) => (acc += +cur.count),
          0
        )
      : employees.count;
  };
}

export default Province;
