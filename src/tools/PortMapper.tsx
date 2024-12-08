import React, { useState } from 'react';
import {
  getDefaultMap,
  getPositions,
  getProvinceDefinitions,
  getProvincesBmp,
  BuildingsPosition,
  Position,
  ProvinceDefinition,
  getProvinceByPixel,
} from './MapUtils';

const PortMapper: React.FC = () => {
  const [seaZoneMap, setSeaZoneMap] = useState<Record<string, string>>({});
  const [isFileProcessed, setIsFileProcessed] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const result = await generateSeaZoneMap(files);
    setSeaZoneMap(result);
    setIsFileProcessed(true);
  };

  const generateSeaZoneMap = async (
    files: FileList
  ): Promise<Record<string, string>> => {
    const defaultMap = await getDefaultMap(files);
    const provinceDefinitions = await getProvinceDefinitions(files);
    const positions = await getPositions(files);
    const provincesBmp = await getProvincesBmp(files);

    // Generate the mapping
    const provinceToSeaZone: Record<string, string> = {};
    for (const [provinceId, positionEntries] of Object.entries(positions)) {
      const buildingsPos: BuildingsPosition = positionEntries.building_position;
      if (!buildingsPos) {
        continue;
      }
      const portPos: Position = buildingsPos.naval_base;
      if (!portPos) {
        continue;
      }
      const seaZoneId = findSeaZoneId(
        portPos,
        defaultMap.sea_starts.key,
        provincesBmp,
        provinceDefinitions
      );
      if (seaZoneId) {
        provinceToSeaZone[provinceId] = seaZoneId;
      }
    }

    return provinceToSeaZone;
  };

  const findSeaZoneId = (
    portPos: Position,
    seaZones: string[],
    provincesBmp: ImageData,
    provinceDefinitions: ProvinceDefinition[]
  ): string | null => {
    const x = parseInt(portPos.x);
    const y = parseInt(portPos.y);
    const idx = (y * provincesBmp.width + x) * 4;
    const seaZoneId = getProvinceByPixel(
      idx,
      provinceDefinitions,
      provincesBmp
    );

    if (seaZoneId && seaZones.includes(seaZoneId)) {
      return seaZoneId; // Direct match found
    }

    // If not in a sea zone, find the closest sea zone
    return findClosestSeaZone(
      portPos,
      seaZones,
      provincesBmp,
      provinceDefinitions
    );
  };

  const findClosestSeaZone = (
    portPos: Position,
    seaZones: string[],
    provincesBmp: ImageData,
    provinceDefinitions: ProvinceDefinition[],
    maxSearchRadius: number = 50 // Limit search radius to avoid long loops
  ): string | null => {
    const xStart = Math.floor(parseFloat(portPos.x));
    const yStart = Math.floor(parseFloat(portPos.y));
    const width = provincesBmp.width;
    const height = provincesBmp.height;

    // Directions for 8-connected neighborhood (including diagonals)
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0], // Cardinal directions
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1], // Diagonal directions
    ];

    const visited = new Set<string>();
    const queue: [number, number, number][] = [[xStart, yStart, 0]]; // [x, y, distance]

    while (queue.length > 0) {
      const [x, y, distance] = queue.shift()!;

      // Skip if out of bounds or already visited
      if (
        x < 0 ||
        x >= width ||
        y < 0 ||
        y >= height ||
        visited.has(`${x},${y}`)
      ) {
        continue;
      }
      visited.add(`${x},${y}`);

      // Get the province at this pixel
      const idx = (y * width + x) * 4;
      const provinceId = getProvinceByPixel(
        idx,
        provinceDefinitions,
        provincesBmp
      );

      // Check if the province is a sea zone
      if (provinceId && seaZones.includes(provinceId)) {
        return provinceId; // Found a valid sea zone
      }

      // Stop search if beyond the maximum radius
      if (distance >= maxSearchRadius) {
        continue;
      }

      // Enqueue neighbors
      for (const [dx, dy] of directions) {
        queue.push([x + dx, y + dy, distance + 1]);
      }
    }

    console.error(`No sea zone found within ${maxSearchRadius} pixels.`);
    return null;
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(seaZoneMap, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portMap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <input
        className="btn"
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      {isFileProcessed && (
        <>
          <button className="btn" onClick={downloadJSON}>
            Download portMap.json
          </button>
        </>
      )}
    </>
  );
};

export default PortMapper;
