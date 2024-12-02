// Use Province class to derive province data
// Either from other province object properties
// Or combined with game data
import { TerrainType, Employees } from '../production/types';
import { Modifier, NationalFocusGroup, RegionDefinition } from './types';
import Country from './Country';

class Province {
  id: string;
  data: Record<string, any>;

  rgoType: string = '';
  neighbors: string[] = [];

  constructor(id: string, data: Record<string, any>) {
    this.id = id;
    this.data = data;

    this.rgoType = this.data.hasOwnProperty('farmers') ? 'farm' : 'mine';
  }

  private AggregateWorkers = (
    pops: Record<string, any>,
    workerTypes: string[]
  ): { type: string; size: number }[] => {
    return workerTypes.map((type) => {
      const poptype = pops[type];

      const size = Array.isArray(poptype)
        ? poptype.reduce(
            (acc: number, pop: { size: number }) => (acc += Number(pop.size)),
            0
          )
        : Number(poptype?.size) || 0;

      return { type, size };
    });
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

  GetModifierFromEvents = (modifiers: Record<string, any>, modifier: string) =>
    Array.isArray(this.data.modifier)
      ? this.data.modifier.reduce(
          (acc, m) => (acc += +modifiers[m.modifier][modifier] || 0),
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
      this.GetModifierFromEvents(modifiers, `${this.rgoType}_rgo_size`) +
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

  GetModifierFromNationalFocus = (
    modifier: string,
    nationalFocuses: Record<string, NationalFocusGroup>,
    regions: RegionDefinition[],
    countryFocuses: Record<string, string>
  ): number => {
    // Clean up countryFocuses keys by removing quotes
    const cleanedCountryFocuses = Object.fromEntries(
      Object.entries(countryFocuses).map(([key, value]) => [
        key.replace(/"/g, ''),
        value,
      ])
    );

    // Find the state ID for the current province
    const stateID = regions.findIndex((region) =>
      region[1].key.includes(this.id)
    );
    if (stateID === -1) {
      throw new Error(
        `Bad state definitions: ${this.data.name} province ID=${this.id} wasn't found in state definitions`
      );
    }

    // Get the national focus name for the state
    const focusName = cleanedCountryFocuses[stateID];
    if (!focusName) {
      return 0; // State doesn't have a focus set
    }

    // Find the focus group containing the focus name
    for (const focusGroup of Object.values(nationalFocuses)) {
      if (focusName in focusGroup) {
        // Return the requested modifier, defaulting to 0 if not found
        return Number(focusGroup[focusName][modifier] || 0);
      }
    }

    // Focus name not found in any focus group
    return 0;
  };

  GetRgoThroughputEff = (
    modifiers: Record<string, Modifier>,
    nationalFocuses: Record<string, NationalFocusGroup>,
    regions: RegionDefinition[],
    countryFocuses: Record<string, string>
  ): number => {
    const effFromEvents = this.GetModifierFromEvents(
      modifiers,
      'local_RGO_throughput'
    );
    const effFromFocus = this.GetModifierFromNationalFocus(
      'local_RGO_throughput',
      nationalFocuses,
      regions,
      countryFocuses
    );

    return effFromEvents + effFromFocus;
  };

  IsOverseas = (
    owner: Country,
    provinceToContinentMap: Record<string, string>
  ): boolean => {
    const provinceContinent = provinceToContinentMap[this.id];
    const capitalContinent = provinceToContinentMap[owner.data.capital];

    // Check if on the same continent
    if (provinceContinent === capitalContinent) {
      return false; // Not overseas
    }

    // Perform BFS to check for land connection
    const visited = new Set<string>();
    const queue: string[] = [owner.data.capital];

    while (queue.length > 0) {
      const current = queue.shift()!;
      visited.add(current);

      const currentProvince = owner.controlledProvinces[current];
      if (!currentProvince) continue;

      if (currentProvince.id === this.id) {
        return false; // Land connection found
      }

      for (const neighbor of currentProvince.neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return true; // No land connection found, province is overseas
  };
}

export default Province;
