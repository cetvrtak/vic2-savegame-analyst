export type AppState = {
  world: any | null;
  activeTab: String;
};

export const initialState: AppState = {
  world: null,
  activeTab: '',
};
