export type Modifier = { [key: string]: string };
export type RegionDefinition = { key: string[] };

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

export type Technologies = Record<string, any>;
export type Inventions = Record<string, any>;

export type Pop = {
  [size: string]: string;
};

export type Crimes = Record<string, Modifier>;
