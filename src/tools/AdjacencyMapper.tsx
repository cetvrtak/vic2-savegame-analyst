import React, { useState } from 'react';
import {
  createProvincePixelsMap,
  getProvinceDefinitions,
  getProvincesBmp,
  getProvinceByPixel,
} from './MapUtils';

const AdjacencyMapper: React.FC = () => {
  const [neighborsMap, setNeighborsMap] = useState<Record<
    string,
    string[]
  > | null>(null);

  const createProvinceNeighborsMap = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) {
      return {};
    }

    const provinceDefinitions = await getProvinceDefinitions(files);
    const provincesBmp = await getProvincesBmp(files);
    const provincePixelsMap = createProvincePixelsMap(
      provinceDefinitions,
      provincesBmp
    );
    const neighborsMap: Record<string, Set<string>> = {};

    for (const provinceId of Object.keys(provincePixelsMap)) {
      neighborsMap[provinceId] = new Set();
    }

    for (const [provinceId, pixels] of Object.entries(provincePixelsMap)) {
      const currentProvinceId = provinceId;

      for (const idx of pixels) {
        const adjacentOffsets = [
          -4,
          4,
          -provincesBmp.width * 4,
          provincesBmp.width * 4,
        ];

        for (const offset of adjacentOffsets) {
          const neighborIdx = idx + offset;
          const neighborProvinceId = getProvinceByPixel(
            neighborIdx,
            provinceDefinitions,
            provincesBmp
          );

          if (neighborProvinceId && neighborProvinceId !== currentProvinceId) {
            neighborsMap[currentProvinceId].add(neighborProvinceId);
          }
        }
      }
    }

    // Convert sets to arrays for JSON compatibility
    const neighborsMapJson: Record<string, string[]> = {};
    for (const [id, neighbors] of Object.entries(neighborsMap)) {
      neighborsMapJson[id] = Array.from(neighbors);
    }

    setNeighborsMap(neighborsMapJson);
  };

  const handleDownload = () => {
    if (neighborsMap) {
      const jsonResult = JSON.stringify(neighborsMap, null, 2);
      const blob = new Blob([jsonResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'adjacencyMap.json';
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
        onChange={createProvinceNeighborsMap}
        multiple
      />
      {neighborsMap && (
        <>
          <button className="btn" onClick={handleDownload}>
            Download adjacencyMap.json
          </button>
        </>
      )}
    </>
  );
};

export default AdjacencyMapper;
