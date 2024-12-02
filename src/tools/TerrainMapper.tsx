import React, { useState } from 'react';
import {
  createProvincePixelsMap,
  getProvinceDefinitions,
  getProvincesBmp,
  getTerrainBmp,
} from './MapUtils';
import ColorMap from '../assets/map/terrainColormap.json';
import ProvinceHistory from '../assets/history/provinces.json';
import Terrain from '../assets/map/terrain.json';

const colorMap: Record<string, string> = ColorMap;

interface ProvinceData {
  terrain?: string;
  [key: string]: any; // Allows for any other properties without type checking
}
type ProvinceRecord = Record<string, ProvinceData>;
const provinceHistory: ProvinceRecord = ProvinceHistory;

const terrain: Record<string, any> = Terrain;

const TerrainMapper: React.FC = () => {
  const [provinceTerrainMapping, setProvinceTerrainMapping] = useState<Record<
    number,
    string
  > | null>(null);

  const GetTexture = (color: string): string => {
    for (const [key, value] of Object.entries(colorMap)) {
      if (value === color) return key;
    }
    return '';
  };

  const GetTerrainType = (texture: string): string => {
    for (const [_, textureDefinition] of Object.entries(terrain)) {
      if (textureDefinition.color?.key.includes(texture))
        return textureDefinition.type;
    }
    return '';
  };

  const GetTerrainFromPixelIndex = (
    idx: number,
    terrainBmp: ImageData
  ): string => {
    const terrainR = terrainBmp.data[idx];
    const terrainG = terrainBmp.data[idx + 1];
    const terrainB = terrainBmp.data[idx + 2];
    const terrainColor = `${terrainR},${terrainG},${terrainB}`;
    const terrainTexture = GetTexture(terrainColor);

    return GetTerrainType(terrainTexture);
  };

  const createProvinceTerrainMapping = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) {
      return;
    }

    const provinceDefinitions = await getProvinceDefinitions(files);
    const provincesBmp = await getProvincesBmp(files);
    const terrainBmp = await getTerrainBmp(files);

    const mapping: Record<number, string> = {};

    // Step 1: Create a map of province ID to array of pixel points
    const provincePixelsMap: Record<number, number[]> = createProvincePixelsMap(
      provinceDefinitions,
      provincesBmp
    );

    // Step 2: Use the provincePixelsMap to determine dominant terrain for each province
    for (const province of provinceDefinitions) {
      // Get terrain from history file
      const terrainType = provinceHistory[province.id]?.terrain;
      if (terrainType) {
        mapping[province.id] = terrainType;
        continue;
      }

      const terrainTypeFrequency: Record<string, number> = {};
      const pixelIndices = provincePixelsMap[province.id];

      if (pixelIndices) {
        for (const idx of pixelIndices) {
          const terrainType = GetTerrainFromPixelIndex(idx, terrainBmp);

          // Update the frequency map
          if (terrainTypeFrequency[terrainType]) {
            terrainTypeFrequency[terrainType]++;
          } else {
            terrainTypeFrequency[terrainType] = 1;
          }
        }

        // Find the most frequent terrain type in the province
        const dominantTerrainType = Object.entries(terrainTypeFrequency).reduce(
          (max, cur) => (cur[1] > max[1] ? cur : max),
          ['', 0]
        )[0];

        if (dominantTerrainType) {
          mapping[province.id] = dominantTerrainType;
        }
      }
    }

    setProvinceTerrainMapping(mapping);
  };

  const downloadJson = () => {
    if (provinceTerrainMapping) {
      const jsonResult = JSON.stringify(provinceTerrainMapping, null, 2);
      const blob = new Blob([jsonResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'terrainMap.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <input
        className="btn"
        type="file"
        accept=".csv,.bmp,.txt"
        onChange={createProvinceTerrainMapping}
        multiple
      />
      {provinceTerrainMapping && (
        <button className="btn" onClick={downloadJson}>
          Download terrainMap.json
        </button>
      )}
    </>
  );
};

export default TerrainMapper;
