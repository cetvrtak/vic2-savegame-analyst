// Use World class to derive world/game data
// As opposed to:
//  * Save game data - retrieved directly AppState

import { Continents } from './types';

//  * Game files data - retrieved from DataContext
class World {
  saveData: Record<string, any>;

  // Game files
  production: Record<string, any>;

  // Derived data
  goodsOutput: Record<string, number>;
  goodsWorkerTypes: Record<string, string[]>;
  rgoWorkers: string[];
  provinceToContinentMap: Record<string, string>;

  constructor(saveData: Record<string, any>, filesData: Record<string, any>) {
    this.saveData = saveData;

    this.production = filesData.production;

    this.goodsOutput = this.CreateGoodOutputMap();
    this.goodsWorkerTypes = this.CreateGoodsWorkerTypesMap();
    this.rgoWorkers = this.DetermineRgoWorkers();
    this.provinceToContinentMap = this.mapProvinceToContinent(
      filesData.continents
    );
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
}

export default World;
