export interface ProvinceDefinition {
  id: string;
  color: [number, number, number];
  name: string;
}

const parseDefinitionCSV = (data: string): ProvinceDefinition[] => {
  return data.split('\n').map((line) => {
    const [id, r, g, b, name] = line.split(';');
    return {
      id,
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

export const createProvincePixelsMap = (
  provinceDefinitions: ProvinceDefinition[],
  provincesBmp: ImageData
): Record<string, number[]> => {
  const provincePixelsMap: Record<string, number[]> = {};

  for (let y = 0; y < provincesBmp.height; y++) {
    for (let x = 0; x < provincesBmp.width; x++) {
      const idx = (y * provincesBmp.width + x) * 4;
      const r = provincesBmp.data[idx];
      const g = provincesBmp.data[idx + 1];
      const b = provincesBmp.data[idx + 2];

      // Find the province that matches the pixel color
      const province = provinceDefinitions.find(
        (prov) =>
          prov.color[0] === r && prov.color[1] === g && prov.color[2] === b
      );

      if (province) {
        if (!provincePixelsMap[province.id]) {
          provincePixelsMap[province.id] = [];
        }
        provincePixelsMap[province.id].push(idx);
      }
    }
  }

  return provincePixelsMap;
};

const GetFile = (fileName: string, files: FileList): File => {
  return Array.from(files).filter((file) => file.name === fileName)[0];
};

export const getProvinceDefinitions = async (
  files: FileList
): Promise<ProvinceDefinition[]> => {
  const definitionCSV = GetFile('definition.csv', files);
  const definitionCSVData = await definitionCSV.text();

  return parseDefinitionCSV(definitionCSVData);
};

export const getProvincesBmp = async (files: FileList): Promise<ImageData> => {
  const provincesBMP = GetFile('provinces.bmp', files);

  return await getPixelsFromBMP(provincesBMP);
};

export const getTerrainBmp = async (files: FileList): Promise<ImageData> => {
  const terrainBMP = GetFile('terrain.bmp', files);

  return await getPixelsFromBMP(terrainBMP);
};

export const getProvinceByPixel = (
  idx: number,
  provinceDefinitions: ProvinceDefinition[],
  provincesBmp: ImageData
): string | null => {
  if (idx < 0 || idx >= provincesBmp.data.length) return null;
  const r = provincesBmp.data[idx];
  const g = provincesBmp.data[idx + 1];
  const b = provincesBmp.data[idx + 2];

  const province = provinceDefinitions.find(
    (prov) => prov.color[0] === r && prov.color[1] === g && prov.color[2] === b
  );

  return province ? province.id : null;
};
