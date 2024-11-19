export type AppState = {
  world: any | null;
  activeTab: String;
  showTools: Boolean;
  loadStatus: String;
  loadProgress: number;
};

export const initialState: AppState = {
  world: null,
  activeTab: '',
  showTools: false,
  loadStatus: '',
  loadProgress: 0,
};
