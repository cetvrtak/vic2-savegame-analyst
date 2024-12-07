// Use Country class to derive country data
// from other country properties
// and game data
import { Issues } from '../production/types';
import { Connection, Inventions, Pop, Straits } from './types';
import Province from './Province';
import State from './State';

class Country {
  static blob: Record<string, any>; // cache imported assets files

  tag: string;
  data: Record<string, any>;

  states: Record<string, State> = {};

  farm_rgo_size: number;
  mine_rgo_size: number;
  rgo_throughput_eff: number;
  ownedProvinces: Record<string, Province> = {};
  controlledProvinces: Record<string, Province> = {};
  straitsConnections: Record<string, Connection[]> = {};

  private connectedProvinces: Set<string> | null = null;

  constructor(tag: string, data: Record<string, any>) {
    this.tag = tag;
    this.data = data;

    this.farm_rgo_size = this.GetModifierFromIssues('farm_rgo_size');
    this.mine_rgo_size = this.GetModifierFromIssues('mine_rgo_size');
    this.rgo_throughput_eff = this.GetRgoThroughputEff();

    this.CreateStates();
  }

  GetModifierFromIssues = (modifier: string): number => {
    const issues: Issues = Country.blob.issues;
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

  GetModifierFromEvents = (modifier: string): number => {
    const countryModifiers: { modifier: string }[] = this.data.modifier;
    if (!countryModifiers) {
      return 0;
    }

    return countryModifiers.reduce(
      (acc: number, countryModifier: { modifier: string }) => {
        const countryModifierName: string = countryModifier.modifier;

        return (acc += Number(
          Country.blob.modifiers[countryModifierName][modifier] || 0
        ));
      },
      0
    );
  };

  GetModifierFromNationalValue = (modifier: string): number => {
    return Number(
      Country.blob.nationalvalues[this.data.nationalvalue][modifier] || 0
    );
  };

  GetRgoThrouputEffFromWarExhaustion = (): number => {
    const warExhaustionModifier = Number(
      Country.blob.modifiers.war_exhaustion.RGO_throughput
    );
    const warExhaustion = Number(this.data.war_exhaustion) || 0;

    return warExhaustion * warExhaustionModifier;
  };

  GetRgoThroughputEff = (): number => {
    const effFromWarExhaustion = this.GetRgoThrouputEffFromWarExhaustion();

    const effFromModifiers = this.GetModifierFromEvents('RGO_throughput');

    const effFromIssues = this.GetModifierFromIssues('RGO_throughput');
    const effFromNV = this.GetModifierFromNationalValue('RGO_throughput');

    return effFromModifiers + effFromIssues + effFromNV + effFromWarExhaustion;
  };

  GetRgoSize = (rgoSizeKey: string): number => {
    return rgoSizeKey === 'farm_rgo_size'
      ? this.farm_rgo_size
      : this.mine_rgo_size;
  };

  GetModifierFromTech = (modifier: string, goods: string = ''): number => {
    const countryTechs = Object.keys(this.data.technology);

    return countryTechs.reduce((effect, tech) => {
      const techModifiers = Country.blob.technologies[tech][modifier];
      if (!techModifiers) return effect;

      if (!goods) {
        return effect + (Number(techModifiers) || 0);
      }

      if (Array.isArray(techModifiers)) {
        return (
          effect +
          techModifiers.reduce(
            (sum, techModifier) => sum + (Number(techModifier[goods]) || 0),
            0
          )
        );
      }

      return effect + (Number(techModifiers[goods]) || 0);
    }, 0);
  };

  GetModifierFromInventions = (
    modifier: string,
    goods: string = ''
  ): number => {
    const countryInventions: Inventions = this.data.active_inventions.key.map(
      (id: string) => Object.values(Country.blob.inventions)[parseInt(id)]
    );

    return countryInventions.reduce(
      (effect: number, invention: Record<string, any>) => {
        const directModifier = invention[modifier];
        const effectModifier = invention.effect?.[modifier];

        if (!goods) {
          return (
            effect +
            (Number(directModifier) || 0) +
            (Number(effectModifier) || 0)
          );
        }

        return (
          effect +
          (Number(directModifier?.[goods]) || 0) +
          (Number(effectModifier?.[goods]) || 0)
        );
      },
      0
    );
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

  SetOwnedProvinces = (provinces: Record<string, any>[]) => {
    this.ownedProvinces = provinces.reduce(
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

  SetControlledProvinceNeighbors = () => {
    for (const [id, province] of Object.entries(this.controlledProvinces)) {
      province.neighbors = Country.blob.adjacencyMap[id];
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

  CreateStates = () => {
    for (const state of this.data.state) {
      this.states[state.id.id] = new State(state);
    }
  };

  GetStateId = (provId: string): string => {
    const state = Object.values(this.states).find((s) =>
      s.data.provinces.key.includes(provId)
    );

    return state?.data.id.id;
  };

  GetPopsPercentageInState = (pop: string, stateId: string): number => {
    let count: number = 0;
    let total: number = 0;

    const state = this.states[stateId];

    for (const provId of state.data.provinces.key) {
      const province: Province = this.ownedProvinces[provId];

      for (const popType of Object.keys(Country.blob.poptypes)) {
        const provincePop: Pop[] | undefined = province.GetPop(popType);
        if (!provincePop) {
          continue;
        }

        const popSize: number = provincePop.reduce(
          (acc: number, pop: Pop) => (acc += Number(pop.size)),
          0
        );
        total += popSize || 0;

        if (popType === pop) {
          count += popSize || 0;
        }
      }
    }

    return count / total;
  };

  GetModifier = (modifier: string, goodsType: string = ''): number => {
    const eventsModifier = this.GetModifierFromEvents(modifier);
    const issuesModifier = this.GetModifierFromIssues(modifier);

    let techModifier = this.GetModifierFromTech(modifier);
    if (modifier === 'rgo_output') {
      techModifier += this.GetModifierFromTech('rgo_goods_output', goodsType);
    }

    let inventionsModifier = this.GetModifierFromInventions(modifier);
    if (modifier === 'rgo_output') {
      inventionsModifier += this.GetModifierFromInventions(
        'rgo_goods_output',
        goodsType
      );
    }

    return eventsModifier + issuesModifier + techModifier + inventionsModifier;
  };
}

export default Country;
