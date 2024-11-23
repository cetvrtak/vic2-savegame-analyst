interface TerrainData {
  farm_rgo_size?: string;
  [key: string]: any;
}
export type TerrainType = Record<string, TerrainData>;

export type Province = {
  farmers: { size: string } | { size: string }[];
  labourers: { size: string } | { size: string }[];
  rgo?: {
    goods_type: string;
    employment: {
      employees: {
        count: string;
        key: { count: string } | { count: string }[];
      };
    };
  };
  owner: string;
  name: string;
  modifier: { modifier: string }[];
};

export type Country = {
  [reform: string]: string;
};
export type Issues = Record<string, any>;
export type World = Record<string, Province | Country>;

export type ProductionProps = {
  world: World;
};
