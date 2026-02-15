// Use Country class to derive country data
// from other country properties
// and game data
import { Issues } from '../production/types';
import { Connection, Inventions, Pop, Straits, War } from './types';
import Province from './Province';
import State from './State';

class Country {
  static blob: Record<string, any>; // cache imported assets files

  tag: string;
  data: Record<string, any>;

  states: Record<string, State> = {};

  farm_rgo_size: number;
  mine_rgo_size: number;
  ownedProvinces: Record<string, Province> = {};
  controlledProvinces: Record<string, Province> = {};
  straitsConnections: Record<string, Connection[]> = {};
  sameContinentProvinces: Set<string> = new Set<string>();
  enemies: Set<string> = new Set<string>();
  mobilizedPenalty: number = 0;

  private connectedProvinces: Set<string> | null = null;

  constructor(tag: string, data: Record<string, any>) {
    this.tag = tag;
    this.data = data;

    this.farm_rgo_size = this.GetModifierFromIssues('farm_rgo_size');
    this.mine_rgo_size = this.GetModifierFromIssues('mine_rgo_size');
    this.mobilizedPenalty = this.CalculateMobilizedPenalty();

    this.CreateStates();
  }

  GetModifiersValue = (modifiers: Record<string, number>[]): number => {
    return modifiers.reduce(
      (acc: number, modifier: Record<string, number>) =>
        (acc += Object.values(modifier)[0]),
      0
    );
  };

  GetIssuesModifiers = (modifier: string): Record<string, number>[] => {
    let modifiers: Record<string, number>[] = [];

    const issues: Issues = Country.blob.issues;

    for (const category of Object.values(issues)) {
      for (const [reformName, reform] of Object.entries(category as Issues)) {
        if (!this.data.hasOwnProperty(reformName)) {
          continue;
        }
        for (const [stanceName, stance] of Object.entries(reform as Issues)) {
          if (
            stance.hasOwnProperty(modifier) &&
            this.data[reformName] === stanceName
          ) {
            modifiers.push({ [reformName]: Number(stance[modifier]) });
          }
        }
      }
    }

    return modifiers;
  };

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

  GetEventModifiers = (modifier: string): Record<string, number>[] => {
    let modifiers: Record<string, number>[] = [];

    const eventModifiers: string[] = Object.values(this.data.modifier).map(
      (m: any) => m.modifier
    );
    for (const name of eventModifiers) {
      const definition = Country.blob.modifiers[name];
      if (definition.hasOwnProperty(modifier)) {
        const value: string = definition[modifier];
        modifiers.push({ [name]: Number(value) });
      }
    }

    return modifiers;
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

  GetNationlValueModifiers = (modifier: string): Record<string, number>[] => {
    let modifiers: Record<string, number>[] = [];

    const nationalValue = this.data.nationalvalue;
    const definition = Country.blob.nationalvalues[nationalValue];
    if (definition.hasOwnProperty(modifier)) {
      modifiers.push({ [nationalValue]: Number(definition[modifier]) });
    }

    return modifiers;
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

  GetRgoThroughputEff = (rgoType: string): number => {
    const effFromWarExhaustion = this.GetRgoThrouputEffFromWarExhaustion();

    const effFromModifiers = this.GetModifierFromEvents('RGO_throughput');

    const effFromIssues = this.GetModifierFromIssues('RGO_throughput');
    const effFromNV = this.GetModifierFromNationalValue('RGO_throughput');

    const rgoThroughputEffTech =
      this.GetModifierFromTech(`${rgoType}_rgo_eff`) +
      this.GetModifierFromTech(`${rgoType}_RGO_eff`) +
      this.GetModifierFromInventions(`${rgoType}_rgo_eff`) +
      this.GetModifierFromInventions(`${rgoType}_RGO_eff`);

    return (
      effFromModifiers +
      effFromIssues +
      effFromNV +
      effFromWarExhaustion +
      rgoThroughputEffTech
    );
  };

  GetRgoSize = (rgoType: string, goodsType: string): number => {
    const rgoSize =
      rgoType === 'farm' ? this.farm_rgo_size : this.mine_rgo_size;

    // Due to inconsistency in modifier naming in Vic2 files
    // we need to get both versions of a modifier
    const rgoSizeFromTech =
      this.GetModifierFromTech('rgo_size', goodsType) +
      this.GetModifierFromTech('RGO_size', goodsType);

    const rgoSizeFromInventions =
      this.GetModifierFromInventions('rgo_size', goodsType) +
      this.GetModifierFromInventions('RGO_size', goodsType);

    return rgoSize + rgoSizeFromTech + rgoSizeFromInventions;
  };

  GetRgoEff = (rgoType: string, goodsType: string) => {
    return (
      this.GetModifier('rgo_output', goodsType) +
      this.GetModifier(`${rgoType}_rgo_eff`) +
      this.GetModifier(`${rgoType}_RGO_eff`)
    );
  };

  GetTechModifiers = (
    modifier: string,
    goods: string = ''
  ): Record<string, number>[] => {
    let modifiers: Record<string, number>[] = [];

    for (const tech of Object.keys(this.data.technology)) {
      const techDefinition = Country.blob.technologies[tech];
      if (!techDefinition.hasOwnProperty(modifier)) {
        continue;
      }
      const techModifier = techDefinition[modifier];

      if (typeof techModifier === 'string') {
        modifiers.push({ [tech]: Number(techModifier) });
      } else if (Array.isArray(techModifier)) {
        for (const goodsModifier of techModifier) {
          if (goodsModifier.hasOwnProperty(goods)) {
            modifiers.push({ [tech]: Number(goodsModifier[goods]) });
          }
        }
      } else if (techModifier.hasOwnProperty(goods)) {
        modifiers.push({ [tech]: Number(techModifier[goods]) });
      }
    }

    if (modifier === 'rgo_output') {
      modifiers = [
        ...modifiers,
        ...this.GetTechModifiers('rgo_goods_output', goods)
      ];
    }

    return modifiers;
  };

  GetModifierFromTech = (modifier: string, goods: string = ''): number => {
    return this.GetTechModifiers(modifier, goods).reduce(
      (value: number, techModifier: Record<string, number>) => {
        return (value += Number(Object.values(techModifier)));
      },
      0
    );
  };

  GetInventionsModifiers = (
    modifier: string,
    goods: string = ''
  ): Record<string, number>[] => {
    let modifiers: Record<string, number>[] = [];

    const inventions = Country.blob.inventions;
    const countryInventions = this.data.active_inventions.key;

    for (const id of countryInventions) {
      const index = parseInt(id) - 1;
      let [invention, effects]: [string, any] =
        Object.entries(inventions)[index];

      // Inventions can have modifiers in a list or inside an `effect` block
      effects = effects.effect || effects;

      if (!effects.hasOwnProperty(modifier)) {
        continue;
      }
      const inventionModifier = effects[modifier];

      if (typeof inventionModifier === 'string') {
        modifiers.push({ [invention]: Number(inventionModifier) });
      } else if (Array.isArray(inventionModifier)) {
        for (const goodsModifier of inventionModifier) {
          if (goodsModifier.hasOwnProperty(goods)) {
            modifiers.push({ [invention]: Number(goodsModifier[goods]) });
          }
        }
      } else if (inventionModifier.hasOwnProperty(goods)) {
        modifiers.push({ [invention]: Number(inventionModifier[goods]) });
      }
    }

    if (modifier === 'rgo_output') {
      modifiers = [
        ...modifiers,
        ...this.GetInventionsModifiers('rgo_goods_output', goods)
      ];
    }

    return modifiers;
  };

  GetModifierFromInventions = (
    modifier: string,
    goods: string = ''
  ): number => {
    return this.GetInventionsModifiers(modifier, goods).reduce(
      (value: number, inventionModifier: Record<string, number>) => {
        return (value += Number(Object.values(inventionModifier)));
      },
      0
    );
  };

  SetControlledProvinces = (provinces: Record<string, any>[]) => {
    this.controlledProvinces = provinces.reduce(
      (acc: Record<string, Province>, prov: Record<string, any>) => ({
        ...acc,
        [prov[0]]: new Province(prov[0], prov[1])
      }),
      {}
    );
  };

  SetOwnedProvinces = (provinces: Record<string, any>[]) => {
    this.ownedProvinces = provinces.reduce(
      (acc: Record<string, Province>, prov: Record<string, any>) => ({
        ...acc,
        [prov[0]]: new Province(prov[0], prov[1])
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

  /**
   * Computes all provinces connected to the capital via controlled provinces and straits.
   * Utilizes BFS for traversal.
   */
  private computeConnectedProvinces(
    provinceId: string = this.data.capital
  ): Set<string> {
    const visited = new Set<string>();
    const queue: string[] = [provinceId];

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
  public isOverseas(provinceId: string): boolean {
    // If on the same continent, it's not overseas
    if (this.sameContinentProvinces.has(provinceId)) {
      return false;
    }

    // Get all connected provinces via controlled provinces and straits
    const connectedProvinces = this.getConnectedProvinces();

    // If the province is not in the connected set, it's overseas
    return !connectedProvinces.has(provinceId);
  }

  CreateStates = () => {
    if (!this.data.state) return;

    // Convert to array if single state
    const states = Array.isArray(this.data.state)
      ? this.data.state
      : [this.data.state];

    for (const state of states) {
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
    const techModifier = this.GetModifierFromTech(modifier, goodsType);
    const inventionsModifier = this.GetModifierFromInventions(
      modifier,
      goodsType
    );
    const nvModifier = this.GetModifierFromNationalValue(modifier);

    return (
      eventsModifier +
      issuesModifier +
      techModifier +
      inventionsModifier +
      nvModifier
    );
  };

  GetModifiers = (
    modifier: string,
    goodsType: string = ''
  ): Record<string, number>[] => {
    const eventModifiers = this.GetEventModifiers(modifier);
    const issuesModifiers = this.GetIssuesModifiers(modifier);
    const techModifiers = this.GetTechModifiers(modifier, goodsType);
    const inventionModifiers = this.GetInventionsModifiers(modifier, goodsType);
    const nvModifiers = this.GetNationlValueModifiers(modifier);

    return [
      ...eventModifiers,
      ...issuesModifiers,
      ...techModifiers,
      ...inventionModifiers,
      ...nvModifiers
    ];
  };

  DetermineSameContinentProvinces = (
    provinceToContinentMap: Record<string, string>
  ) => {
    const capitalContinent = provinceToContinentMap[this.data.capital];
    for (const province of Object.values(this.ownedProvinces)) {
      const provinceContinent = provinceToContinentMap[province.id];
      if (provinceContinent === capitalContinent) {
        this.sameContinentProvinces.add(province.id);
      }
    }
  };

  GetConnectedPort = (provinceId: string): Province | null => {
    const controlledPorts = Object.keys(this.controlledProvinces).filter(
      (id) => Country.blob?.portMap[id]
    );

    for (const controlledPort of controlledPorts) {
      const connectedProvinces = this.computeConnectedProvinces(controlledPort);
      if (connectedProvinces.has(provinceId)) {
        return this.controlledProvinces[controlledPort];
      }
    }
    return null;
  };

  DetermineWarEnemies = (wars: War[]) => {
    if (!Array.isArray(wars)) return;

    for (const war of wars) {
      const attacker = new Set<string>().add(war.attacker);
      const defender = new Set<string>().add(war.defender);

      for (const date of Object.values(war.history)) {
        const entries: any[] = Array.isArray(date) ? date : [date];

        for (const entry of entries) {
          switch (Object.keys(entry)[0]) {
            case 'add_attacker':
              attacker.add(entry.add_attacker);
              break;
            case 'add_defender':
              defender.add(entry.add_defender);
              break;
            case 'rem_attacker':
              attacker.delete(entry.rem_attacker);
              break;
            case 'rem_defender':
              defender.delete(entry.rem_defender);
              break;
            default:
              break;
          }
        }
      }

      if (attacker.has(this.tag)) this.enemies = this.enemies.union(defender);
      if (defender.has(this.tag)) this.enemies = this.enemies.union(attacker);
    }
  };

  HasNavyInSeaZone = (seaZone: string): boolean => {
    if (!this.data.navy) {
      return false;
    }

    const navies = Array.isArray(this.data.navy)
      ? this.data.navy
      : [this.data.navy];

    for (const navy of navies) {
      if (navy.location === seaZone) {
        return true;
      }
    }

    return false;
  };

  CalculateMobilizedPenalty = (): number => {
    if (!this.data.mobilize) {
      return 0;
    }

    // throughput = -1 x mobilization_size x mobilization_economic_impact
    const mobSizeFromModifiers = this.GetModifier('mobilisation_size');

    const isUncivilized = this.data.civilized === 'no';
    const uncivMobSizeModifier =
      Country.blob.modifiers.unciv_nation['mobilisation_size'];
    const mobSizeFromUnciv = Number(isUncivilized) * uncivMobSizeModifier;

    const mobilizationSize = mobSizeFromModifiers + mobSizeFromUnciv;

    if (mobilizationSize < 0) {
      return 0;
    }

    const mobilizationImpact = this.GetModifier('mobilisation_economy_impact');

    return -1 * mobilizationSize * mobilizationImpact;
  };
}

export default Country;
