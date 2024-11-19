import { Action } from './actions';

// Define types for the parsed data
export type ParsedObject = {
  [key: string]: any;
};

const preProcessText = (text: string): string => {
  // Remove line comments that start with "#" and run to the end of the line
  const withoutComments = text.replace(/#.*$/gm, '');

  // Ensure that each "{" and "}" is on its own line
  return withoutComments.replace(/{/g, '\n{\n').replace(/}/g, '\n}\n');
};

const parseObject = async (
  text: string,
  dispatch: React.Dispatch<Action>
): Promise<ParsedObject> => {
  dispatch({ type: 'SET_LOAD_STATUS', payload: 'Parsing lines...' });

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
        currentObject[key] = value.replace(/"/g, '');
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

  let lineIndex = 0;

  const processLines = async () => {
    const chunkSize = 100000;

    while (lineIndex < lines.length) {
      for (let i = 0; i < chunkSize && lineIndex < lines.length; i++) {
        const line = lines[lineIndex];
        if (line.trim() !== '') {
          parseLine(line);
        }

        lineIndex++;
      }

      const progress = Math.floor((100 * lineIndex) / lines.length);
      dispatch({ type: 'SET_LOAD_PROGRESS', payload: progress });

      // Allow the UI to update
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return object;
  };

  return processLines();
};

export const parseFileStream = async (
  stream: ReadableStream<Uint8Array>,
  dispatch: React.Dispatch<Action>,
  fileSize: number = 0
): Promise<ParsedObject> => {
  dispatch({ type: 'SET_LOAD_STATUS', payload: 'Loading stream...' });

  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let text = '';
  let processedSize = 0;

  const processStream = async () => {
    const { done, value } = await reader.read();

    processedSize += value?.length || 0;
    const progress = Math.floor((processedSize / fileSize) * 100);
    dispatch({ type: 'SET_LOAD_PROGRESS', payload: progress });

    // Allow the UI to update
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (done) {
      return await parseObject(text, dispatch);
    }
    text += decoder.decode(value, { stream: true });
    return processStream();
  };

  return processStream();
};
