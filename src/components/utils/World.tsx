// Use World class to derive world/game data
// As opposed to:
//  * Save game data - retrieved directly AppState

import Country from './Country';
import Province from './Province';
import { Continents, Straits, Connection } from './types';

//  * Game files data - retrieved from DataContext
class World {
  saveData: Record<string, any>;

  // Game files
  filesData: Record<string, any>;
  production: Record<string, any>;

  // Derived data
  countries: Record<string, Country> = {};

  goodsOutput: Record<string, number>;
  goodsWorkerTypes: Record<string, string[]>;
  rgoWorkers: string[];
  provinceToContinentMap: Record<string, string>;
  straits: Straits;

  constructor(saveData: Record<string, any>, filesData: Record<string, any>) {
    this.saveData = saveData;

    this.filesData = filesData;
    Province.blob = this.filesData;
    this.production = filesData.production;

    this.goodsOutput = this.CreateGoodOutputMap();
    this.goodsWorkerTypes = this.CreateGoodsWorkerTypesMap();
    this.rgoWorkers = this.DetermineRgoWorkers();
    this.provinceToContinentMap = this.mapProvinceToContinent(
      filesData.continents
    );
    this.straits = this.GetStraitsFromCSV(filesData.adjacencies);
  }

  private CreateGoodOutputMap = (): Record<string, number> => {
    return Object.values(this.production).reduce(
      (map: Record<string, number>, type: Record<string, any>) =>
        type.output_goods && {
          ...map,
          [type.output_goods]: Number(type.value),
        },
      {}
    );
  };

  private CreateGoodsWorkerTypesMap = (): Record<string, string[]> => {
    return Object.values(this.production).reduce(
      (map: Record<string, string[]>, type: Record<string, any>) => {
        if (!type.output_goods || !type.template) {
          return map;
        }

        const template = this.production[type.template];
        const employees = template.employees.key;
        const goodsWorkerTypes = employees.map(
          (t: { poptype: string }) => t.poptype
        );
        return {
          ...map,
          [type.output_goods]: goodsWorkerTypes,
        };
      },
      {}
    );
  };

  private DetermineRgoWorkers = (): string[] => {
    return Object.values(this.production).reduce(
      (acc: string[], type: Record<string, any>) => {
        if (type.type !== 'rgo') {
          return acc;
        }

        const workers = type.employees.key.map(
          (e: { poptype: string }) => e.poptype
        );
        return [...new Set([...acc, ...workers])];
      },
      []
    );
  };

  private mapProvinceToContinent = (
    continents: Continents
  ): Record<string, string> => {
    const provinceToContinent: Record<string, string> = {};

    for (const [continent, data] of Object.entries(continents)) {
      for (const province of data.provinces.key) {
        provinceToContinent[province] = continent;
      }
    }

    return provinceToContinent;
  };

  GetStraitsFromCSV = (csvContent: string): Straits => {
    const lines = csvContent.split('\n').map((line) => line.trim());
    const header = lines[0]?.split(';');
    if (!header) throw new Error('Invalid CSV file: Missing header');

    const fromIndex = header.indexOf('From');
    const toIndex = header.indexOf('To');
    // const typeIndex = header.indexOf('Type');
    const throughIndex = header.indexOf('Through');
    if (
      // typeIndex === -1 ||
      throughIndex === -1
    ) {
      throw new Error(
        'Invalid CSV file: Missing required columns (Type, Through)'
      );
    }

    let straits: Straits = {};
    for (const line of lines.slice(1)) {
      if (!line || line.startsWith('#')) continue;

      const columns = line.split(';');
      if (
        // columns[typeIndex]?.trim() === 'sea' &&
        columns[throughIndex]?.trim()
      ) {
        const through = columns[throughIndex].trim();
        const from = columns[fromIndex].trim();
        const to = columns[toIndex].trim();
        const connection: Connection = { to, through };

        straits[from] = straits[from]
          ? [...straits[from], connection]
          : [connection];
      }
    }
    return straits;
  };

  CreateCountries = (tags: string[]) => {
    Country.blob = this.filesData;

    for (const tag of tags) {
      const country = new Country(tag, this.saveData[tag]);

      const ownedProvinces = Object.entries(this.saveData).filter(
        ([_, provinceData]) => provinceData.owner === tag
      );
      country.SetOwnedProvinces(ownedProvinces);

      const controlledProvinces = Object.entries(this.saveData).filter(
        ([_, provinceData]) => provinceData.controller === tag
      );
      country.SetControlledProvinces(controlledProvinces);
      country.SetStraitsConnections(this.straits);
      country.DetermineSameContinentProvinces(this.provinceToContinentMap);

      this.countries[tag] = country;
    }
  };

  GetCountry = (tag: string): Country => {
    return this.countries[tag];
  };

  IsUnderSiege = (provinceId: string): boolean => {
    const sieges: Record<string, any>[] = this.saveData.combat.siege_combat;
    for (const siege of sieges) {
      if (siege.location === provinceId) {
        return true;
      }
    }
    return false;
  };

  GetRgoEffFromSiege = (rgoType: string): number => {
    return this.filesData.modifiers.has_siege[`${rgoType}_rgo_eff`];
  };
}

export default World;
