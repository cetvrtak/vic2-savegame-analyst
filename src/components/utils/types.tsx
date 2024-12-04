export type Modifier = { [key: string]: string };
export type RegionDefinition = [id: string, { key: string[] }];

type NationalFocus = Record<string, Modifier>;
export type NationalFocusGroup = Record<string, NationalFocus>;

export interface Continents {
  [continent: string]: {
    provinces: { key: string[] };
    assimilation_rate: string;
  };
}

export type Connection = { to: string; through: string };
export type Straits = {
  [from: string]: Connection[];
};
