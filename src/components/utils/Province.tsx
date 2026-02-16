// Use Province class to derive province data
// Either from other province object properties
// Or combined with game data
import { Employees } from '../production/types';
import Country from './Country';
import { Crimes, NationalFocusGroup, Pop, RegionDefinition } from './types';

class Province {
  static blob: Record<string, any>;

  id: string;
  data: Record<string, any>;

  goodsType: string;
  rgoType: string;
  rgoSize: number;
  neighbors: string[];
  seaZone: string;

  constructor(id: string, data: Record<string, any>) {
    this.id = id;
    this.data = data;

    this.goodsType = data.rgo?.goods_type || '';
    this.rgoType = this.GetRgoType();
    this.rgoSize = this.GetRgoSize();
    this.neighbors = Province.blob?.adjacencyMap[id] || [];
    this.seaZone = Province.blob?.portMap[id] || null;
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

    const continentModifier = this.GetRgoSizeFromContinent();

    return Math.floor(
      1.5 * Math.ceil(numFarmers / baseWorkplaces / (1 + continentModifier))
    );
  };

  GetModifierFromEvents = (modifier: string): number => {
    const provinceModifiers = this.data.modifier;
    if (!provinceModifiers) return 0;

    const modifiers = Array.isArray(provinceModifiers)
      ? provinceModifiers
      : [provinceModifiers];

    const definitions = Province.blob.modifiers;

    return modifiers.reduce((sum, m) => {
      return sum + Number(definitions[m.modifier]?.[modifier] ?? 0);
    }, 0);
  };

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
      this.GetRgoSizeFromTerrain() +
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
        value
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

  hasNavalBlockade = (owner: Country, enemies: Country[]): boolean => {
    if (!enemies) return false;

    if (owner.HasNavyInSeaZone(this.seaZone)) {
      return false;
    }

    for (const enemy of enemies) {
      if (enemy.HasNavyInSeaZone(this.seaZone)) {
        return true;
      }
    }

    return false;
  };

  private GetRgoType = (): string => {
    for (const type of Object.values(Province.blob.production) as any) {
      if (type.output_goods === this.data.rgo?.goods_type) {
        return type.farm === 'yes' ? 'farm' : 'mine';
      }
    }
    return '';
  };

  private GetRgoSizeFromTerrain = (): number => {
    const terrainType = Province.blob.terrainMap[this.id];
    const rgoSizeKey = `${this.rgoType}_rgo_size`;

    return Number(Province.blob.terrain.categories[terrainType][rgoSizeKey]);
  };

  GetRgoEff = (
    owner: Country,
    controller: Country,
    enemies: Country[],
    isUnderSiege: boolean
  ): number => {
    const siegeRgoEff =
      Number(isUnderSiege) *
      Province.blob.modifiers.has_siege[`${this.rgoType}_rgo_eff`];

    /* NOTE: Blockades don't refresh every tick */
    // Province is blockaded by land when
    // * on another continent &&
    // * under siege || controller doesn't have port access to it
    const sameContinent = owner.sameContinentProvinces.has(this.id);
    const connectedPort = controller.GetConnectedPort(this.id);
    const landBlockade = !sameContinent && (isUnderSiege || !connectedPort);

    const navalBlockade = this.hasNavalBlockade(owner, enemies);
    const blockadeRgoEff =
      Number(landBlockade || navalBlockade) *
      Province.blob.modifiers.blockaded[`${this.rgoType}_rgo_eff`];

    return (
      this.GetModifier('local_rgo_output', owner.data.national_focus) +
      this.GetModifier('local_RGO_output', owner.data.national_focus) +
      this.GetModifier(`${this.rgoType}_rgo_eff`, owner.data.national_focus) +
      this.GetModifier(`${this.rgoType}_RGO_eff`, owner.data.national_focus) +
      siegeRgoEff +
      blockadeRgoEff
    );
  };

  GetRgoEffFromTerrain = (): number => {
    const terrainType = Province.blob.terrainMap[this.id];

    return Number(
      Province.blob.terrain.categories[terrainType][`${this.rgoType}_rgo_eff`]
    );
  };
}

export default Province;
