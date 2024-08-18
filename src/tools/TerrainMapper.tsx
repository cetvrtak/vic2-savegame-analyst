import React, { useState } from 'react';
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

interface ProvinceDefinition {
  id: number;
  color: [number, number, number];
  name: string;
}

const TerrainMapper: React.FC = () => {
  const [provinceTerrainMapping, setProvinceTerrainMapping] = useState<Record<
    number,
    string
  > | null>(null);

  const parseDefinitionCSV = (data: string): ProvinceDefinition[] => {
    return data.split('\n').map((line) => {
      const [id, r, g, b, name] = line.split(';');
      return {
        id: parseInt(id),
        color: [parseInt(r), parseInt(g), parseInt(b)],
        name,
      };
    });
  };

  const getPixelsFromBMP = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        } else {
          reject(new Error('Could not get 2D context from canvas'));
        }
      };

      img.onerror = () => reject(new Error('Error loading image'));

      reader.readAsDataURL(file);
    });
  };

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

  const createProvinceTerrainMapping = async (
    provinceDefinitions: ProvinceDefinition[],
    provincesBmp: ImageData,
    terrainBmp: ImageData
  ) => {
    const mapping: Record<number, string> = {};

    for (const province of provinceDefinitions) {
      // Get terrain from history file
      const terrainType = provinceHistory[province.id]?.terrain;
      if (terrainType) {
        mapping[province.id] = terrainType;
        continue;
      }

      const [provinceR, provinceG, provinceB] = province.color;

      // A map to store the frequency of each terrain color in the province
      const terrainColorFrequency: Record<string, number> = {};

      for (let y = 0; y < provincesBmp.height; y++) {
        for (let x = 0; x < provincesBmp.width; x++) {
          const idx = (y * provincesBmp.width + x) * 4;
          const r = provincesBmp.data[idx];
          const g = provincesBmp.data[idx + 1];
          const b = provincesBmp.data[idx + 2];

          // Check if the current pixel belongs to the province
          if (r === provinceR && g === provinceG && b === provinceB) {
            const terrainR = terrainBmp.data[idx];
            const terrainG = terrainBmp.data[idx + 1];
            const terrainB = terrainBmp.data[idx + 2];
            const terrainColor = `${terrainR},${terrainG},${terrainB}`;

            // Update the frequency map
            if (terrainColorFrequency[terrainColor]) {
              terrainColorFrequency[terrainColor]++;
            } else {
              terrainColorFrequency[terrainColor] = 1;
            }
          }
        }
      }

      // Find the most frequent terrain color in the province
      let dominantTerrainColor = '';
      let maxFrequency = 0;
      for (const [color, frequency] of Object.entries(terrainColorFrequency)) {
        if (frequency > maxFrequency) {
          maxFrequency = frequency;
          dominantTerrainColor = color;
        }
      }

      if (dominantTerrainColor) {
        const terrainTexture = GetTexture(dominantTerrainColor);
        const terrainType = GetTerrainType(terrainTexture);
        if (terrainType) {
          mapping[province.id] = terrainType;
        }
      }
    }

    setProvinceTerrainMapping(mapping);
  };

  const GetFile = (fileName: string, files: FileList): File => {
    return Array.from(files).filter((file) => file.name === fileName)[0];
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const definitionCSV = GetFile('definition.csv', files);
      const provincesBMP = GetFile('provinces.bmp', files);
      const terrainBMP = GetFile('terrain.bmp', files);

      // Parse the CSV file
      const definitionCSVData = await definitionCSV.text();
      const provinceDefinitions = parseDefinitionCSV(definitionCSVData);

      // Get pixel data from BMP files
      const provincesBmp = await getPixelsFromBMP(provincesBMP);
      const terrainBmp = await getPixelsFromBMP(terrainBMP);

      // Create the mapping
      await createProvinceTerrainMapping(
        provinceDefinitions,
        provincesBmp,
        terrainBmp
      );
    }
  };

  const downloadJson = () => {
    if (provinceTerrainMapping) {
      const jsonResult = JSON.stringify(provinceTerrainMapping, null, 2);
      const blob = new Blob([jsonResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'provinceTerrainMapping.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="json-exporter btn-wrapper">
      <h2 className="title-black">Terrain Mapper</h2>
      <input
        className="btn"
        type="file"
        accept=".csv,.bmp,.txt"
        onChange={handleFileUpload}
        multiple
      />
      {provinceTerrainMapping && (
        <button className="btn" onClick={downloadJson}>
          Download provinceTerrainMapping.json
        </button>
      )}
    </div>
  );
};

export default TerrainMapper;
