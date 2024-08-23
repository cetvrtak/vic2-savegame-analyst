export type AppState = {
  world: any | null;
  activeTab: String;
  showTools: Boolean;
};

export const initialState: AppState = {
  world: null,
  activeTab: '',
  showTools: false,
};
