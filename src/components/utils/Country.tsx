// Use Country class to derive country data
// from other country properties
// and game data
import { Issues } from '../production/types';
import { Modifier } from './types';

class Country {
  tag: string;
  data: Record<string, any>;
  farm_rgo_size: number = 0;
  mine_rgo_size: number = 0;
  rgo_throughput_eff: number = 0;

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
}

export default Country;
