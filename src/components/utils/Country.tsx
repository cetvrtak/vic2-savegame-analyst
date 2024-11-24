// Use Country class to derive country data
// from other country properties
// and game data
import { Issues } from '../production/types';

class Country {
  tag: string;
  data: Record<string, any>;
  farm_rgo_size: number = 0;
  mine_rgo_size: number = 0;

  constructor(tag: string, data: Record<string, any>) {
    this.tag = tag;
    this.data = data;
  }

  GetRgoSize = (issues: Issues, rgoSizeKey: string): number => {
    return Object.values(issues).reduce((acc, category) => {
      Object.entries(category as Issues).forEach(([reformName, reform]) => {
        Object.entries(reform as Issues).forEach(([stanceName, stance]) => {
          if (
            stance.hasOwnProperty(rgoSizeKey) &&
            this.data[reformName] === stanceName
          ) {
            acc += +stance[rgoSizeKey];
          }
        });
      });
      return acc;
    }, 0);
  };
}

export default Country;
