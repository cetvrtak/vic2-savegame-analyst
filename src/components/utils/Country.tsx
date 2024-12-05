// Use Country class to derive country data
// from other country properties
// and game data
import { Issues } from '../production/types';
import { Connection, Modifier, Straits } from './types';
import Province from './Province';

class Country {
  tag: string;
  data: Record<string, any>;

  farm_rgo_size: number = 0;
  mine_rgo_size: number = 0;
  rgo_throughput_eff: number = 0;
  controlledProvinces: Record<string, Province> = {};
  straitsConnections: Record<string, Connection[]> = {};

  private connectedProvinces: Set<string> | null = null;

  constructor(tag: string, data: Record<string, any>) {
    this.tag = tag;
    this.data = data;
  }

  GetModifierFromIssues = (issues: Issues, modifier: string): number => {
    return Object.values(issues).reduce((acc, category) => {
      Object.entries(category as Issues).forEach(([reformName, reform]) => {
        Object.entries(reform as Issues).forEach(([stanceName, stance]) => {
          if (
            stance.hasOwnProperty(modifier) &&
            this.data[reformName] === stanceName
          ) {
            acc += +stance[modifier];
          }
        });
      });
      return acc;
    }, 0);
  };

  GetModifierFromEvents = (
    modifiers: Record<string, Modifier>,
    modifier: string
  ): number => {
    const countryModifiers: { modifier: string }[] = this.data.modifier;
    if (!countryModifiers) {
      return 0;
    }

    return countryModifiers.reduce(
      (acc: number, countryModifier: { modifier: string }) => {
        const countryModifierName: string = countryModifier.modifier;

        return (acc += Number(modifiers[countryModifierName][modifier] || 0));
      },
      0
    );
  };

  GetModifierFromNationalValue = (
    nationalValues: Record<string, Modifier>,
    modifier: string
  ): number => {
    return Number(nationalValues[this.data.nationalvalue][modifier] || 0);
  };

  GetRgoThrouputEffFromWarExhaustion = (
    modifiers: Record<string, Modifier>
  ): number => {
    const warExhaustionModifier = Number(
      modifiers.war_exhaustion.RGO_throughput
    );
    const warExhaustion = Number(this.data.war_exhaustion) || 0;

    return warExhaustion * warExhaustionModifier;
  };

  GetRgoThroughputEff = (
    modifiers: Record<string, Modifier>,
    issues: Issues,
    nationalValues: Record<string, Modifier>
  ): number => {
    const effFromWarExhaustion =
      this.GetRgoThrouputEffFromWarExhaustion(modifiers);

    const effFromModifiers = this.GetModifierFromEvents(
      modifiers,
      'RGO_throughput'
    );

    const effFromIssues = this.GetModifierFromIssues(issues, 'RGO_throughput');
    const effFromNV = this.GetModifierFromNationalValue(
      nationalValues,
      'RGO_throughput'
    );

    return effFromModifiers + effFromIssues + effFromNV + effFromWarExhaustion;
  };

  GetRgoSize = (rgoSizeKey: string): number => {
    return rgoSizeKey === 'farm_rgo_size'
      ? this.farm_rgo_size
      : this.mine_rgo_size;
  };

  SetControlledProvinces = (provinces: Record<string, any>[]) => {
    this.controlledProvinces = provinces.reduce(
      (acc: Record<string, Province>, prov: Record<string, any>) => ({
        ...acc,
        [prov[0]]: new Province(prov[0], prov[1]),
      }),
      {}
    );
  };

  private AddStraitsConnection = (
    from: string,
    to: string,
    through: string
  ) => {
    const connection: Connection = { to, through };

    this.straitsConnections[from] = this.straitsConnections[from]
      ? [...this.straitsConnections[from], connection]
      : [connection];
  };

  SetStraitsConnections = (straits: Straits) => {
    for (const [from, connections] of Object.entries(straits)) {
      for (const { to, through } of connections) {
        if (
          this.controlledProvinces.hasOwnProperty(from) &&
          this.controlledProvinces.hasOwnProperty(to)
        ) {
          this.AddStraitsConnection(from, to, through);
          this.AddStraitsConnection(to, from, through);
        }
      }
    }
  };

  SetControlledProvinceNeighbors = (adjacencyMap: Record<string, string[]>) => {
    for (const [id, province] of Object.entries(this.controlledProvinces)) {
      province.neighbors = adjacencyMap[id];
    }
  };

  /**
   * Computes all provinces connected to the capital via controlled provinces and straits.
   * Utilizes BFS for traversal.
   */
  private computeConnectedProvinces(): Set<string> {
    const visited = new Set<string>();
    const queue: string[] = [this.data.capital];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      // Determine if current province is a controlled province
      const currentProvince = this.controlledProvinces[current];

      if (!currentProvince) {
        continue; // Skip if not controlled
      }

      visited.add(current);

      for (const neighbor of currentProvince.neighbors) {
        if (!visited.has(neighbor) && !queue.includes(neighbor)) {
          queue.push(neighbor);
        }
      }

      // Add to queue provinces connected by a strait to the current province
      if (!this.straitsConnections[current]) {
        continue;
      }

      for (const connection of this.straitsConnections[current]) {
        if (!visited.has(connection.to) && !queue.includes(connection.to)) {
          queue.push(connection.to);
        }
      }
    }

    return visited;
  }

  /**
   * Retrieves the set of all connected provinces. Computes and caches the result if not already done.
   */
  private getConnectedProvinces(): Set<string> {
    if (!this.connectedProvinces) {
      this.connectedProvinces = this.computeConnectedProvinces();
    }
    return this.connectedProvinces;
  }

  /**
   * Determines if a given province is overseas.
   * A province is considered overseas if:
   * - It is on a different continent from the capital.
   * - There is no land connection through controlled provinces and straits to the capital.
   *
   * @param provinceId - The ID of the province to check.
   * @param provinceToContinentMap - A mapping from province IDs to their respective continents.
   * @returns `true` if the province is overseas, `false` otherwise.
   */
  public isOverseas(
    provinceId: string,
    provinceToContinentMap: Record<string, string>
  ): boolean {
    const provinceContinent = provinceToContinentMap[provinceId];
    const capitalContinent = provinceToContinentMap[this.data.capital];

    // If on the same continent, it's not overseas
    if (provinceContinent === capitalContinent) {
      return false;
    }

    // Get all connected provinces via controlled provinces and straits
    const connectedProvinces = this.getConnectedProvinces();

    // If the province is not in the connected set, it's overseas
    return !connectedProvinces.has(provinceId);
  }
}

export default Country;
