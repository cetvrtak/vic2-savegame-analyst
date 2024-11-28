export type Modifier = { [key: string]: string };
export type RegionDefinition = [id: string, { key: string[] }];

type NationalFocus = Record<string, Modifier>;
export type NationalFocusGroup = Record<string, NationalFocus>;
