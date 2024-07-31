// Define types for the parsed data
export type ParsedObject = {
  [key: string]: any;
};

const preProcessText = (text: string): string => {
  // Ensure that each "{" and "}" is on its own line
  return text.replace(/{/g, '\n{\n').replace(/}/g, '\n}\n');
};

const parseObject = (text: string): ParsedObject => {
  const object: ParsedObject = {};
  const preProcessedText = preProcessText(text);
  const lines = preProcessedText.split('\n');
  let currentKey = '';
  let objectStack: ParsedObject[] = [object];

  const parseLine = (line: string) => {
    const trimmedLine = line.trim();

    const currentObject = objectStack[objectStack.length - 1];
    if (trimmedLine.endsWith('=')) {
      // Start of a new object
      currentKey = trimmedLine.slice(0, -1).trim();
    } else if (trimmedLine === '{') {
      // Start of a nested object or array
      const newObject: ParsedObject = {};
      if (currentObject.hasOwnProperty(currentKey)) {
        if (!Array.isArray(currentObject[currentKey])) {
          currentObject[currentKey] = [currentObject[currentKey]];
        }
        currentObject[currentKey].push(newObject);
      } else {
        currentObject[currentKey] = newObject;
      }
      objectStack.push(newObject);
      currentKey = 'key'; // reset for objects defined solely by a pair of braces
    } else if (trimmedLine === '}') {
      // End of a nested object or array
      objectStack.pop();
    } else if (trimmedLine.includes('=')) {
      // Handle key-value pairs
      const [key, value] = trimmedLine.split('=').map((part) => part.trim());
      if (value) {
        objectStack[objectStack.length - 1][key] = value.replace(/"/g, ''); // Remove quotes
      }
    } else {
      // Handle array-like values
      const values = trimmedLine.split(' ').map((v) => v.replace(/"/g, ''));
      if (Array.isArray(currentObject[currentKey])) {
        currentObject[currentKey].push(...values);
      } else {
        currentObject[currentKey] = values;
      }
    }
  };

  for (const line of lines) {
    if (line.trim() !== '') {
      parseLine(line);
    }
  }

  return object;
};

export const parseFileStream = async (
  stream: ReadableStream<Uint8Array>
): Promise<ParsedObject> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let text = '';

  const processStream = async () => {
    const { done, value } = await reader.read();
    if (done) {
      return parseObject(text);
    }
    text += decoder.decode(value, { stream: true });
    return processStream();
  };

  return processStream();
};
