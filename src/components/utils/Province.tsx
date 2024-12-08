// Use Province class to derive province data
// Either from other province object properties
// Or combined with game data
import { Employees } from '../production/types';
import { Crimes, NationalFocusGroup, Pop, RegionDefinition } from './types';

class Province {
  static blob: Record<string, any>;

  id: string;
  data: Record<string, any>;

  rgoType: string = '';
  neighbors: string[] = [];

  constructor(id: string, data: Record<string, any>) {
    this.id = id;
    this.data = data;

    this.rgoType = this.data.hasOwnProperty('farmers') ? 'farm' : 'mine';
    this.neighbors = Province.blob.adjacencyMap[id];
  }

  private AggregateWorkers = (
    workerTypes: string[]
  ): { type: string; size: number }[] => {
    return workerTypes.map((type) => {
      const poptype = Province.blob.pops[this.id][type];

      const size = Array.isArray(poptype)
        ? poptype.reduce(
            (acc: number, pop: { size: number }) => (acc += Number(pop.size)),
            0
          )
        : Number(poptype?.size) || 0;

      return { type, size };
    });
  };

  GetProvinceSize = (workerTypes: string[]): number => {
    /*** Vic2 considers only the largest rgo pop type for province size ***/
    /*** Usually it's farmers, if there are any ***/
    /*** otherwise it's serfs or slaves ***/

    const baseWorkplaces = 40000;

    let aggregatedWorkers = this.AggregateWorkers(workerTypes);
    aggregatedWorkers.sort((a, b) => b.size - a.size);
    const numFarmers = aggregatedWorkers[0].size;

    const terrainType = Province.blob.terrainMap[this.id];
    const terrainModifier = Number(
      Province.blob.terrain.categories[terrainType][`${this.rgoType}_rgo_size`]
    );

    return Math.floor(
      1.5 * Math.ceil(numFarmers / baseWorkplaces / (1 + terrainModifier))
    );
  };

  GetModifierFromEvents = (modifier: string) =>
    Array.isArray(this.data.modifier)
      ? this.data.modifier.reduce(
          (acc, m) =>
            (acc += +Province.blob.modifiers[m.modifier][modifier] || 0),
          0
        )
      : 0;

  GetRgoSizeFromContinent = (): number => {
    const continents: Record<string, any> = Province.blob.continents;
    return Object.values(continents).reduce(
      (modifier: number, continent: Record<string, any>) =>
        (modifier = continent.provinces.key.includes(this.id)
          ? Number(continent[`${this.rgoType}_rgo_size`] || 0)
          : modifier),
      0
    );
  };

  GetRgoSize = (): number => {
    return (
      this.GetModifierFromEvents(`${this.rgoType}_rgo_size`) +
      this.GetRgoSizeFromContinent()
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
    const regions: Record<string, RegionDefinition> = Province.blob.region;
    const stateID = Object.entries(regions).findIndex(([_, region]) =>
      region.key.includes(this.id)
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
    const nationalFocuses: Record<string, NationalFocusGroup> =
      Province.blob.national_focus;
    for (const focusGroup of Object.values(nationalFocuses)) {
      if (focusName in focusGroup) {
        // Return the requested modifier, defaulting to 0 if not found
        return Number(focusGroup[focusName][modifier] || 0);
      }
    }

    // Focus name not found in any focus group
    return 0;
  };

  GetModifierFromCrime = (modifier: string): number => {
    const crimeIndex = this.data.crime;
    if (!crimeIndex) {
      return 0;
    }

    const crimes: Crimes = Province.blob.crime;
    const [_, crime] = Object.entries(crimes)[crimeIndex];

    return Number(crime[modifier]) || 0;
  };

  GetModifier = (
    modifier: string,
    countryFocuses: Record<string, string>
  ): number => {
    const eventModifiers = this.GetModifierFromEvents(modifier);
    const focusModifiers = this.GetModifierFromNationalFocus(
      modifier,
      countryFocuses
    );
    const crimeModifiers = this.GetModifierFromCrime(modifier);

    return eventModifiers + focusModifiers + crimeModifiers;
  };

  GetPop = (popType: string): Pop[] | undefined => {
    return Array.isArray(this.data[popType])
      ? this.data[popType]
      : this.data[popType]
      ? [this.data[popType]]
      : undefined;
  };
}

export default Province;
