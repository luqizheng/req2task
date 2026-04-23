export function deepMapObject(obj: Record<string, unknown>, mapping: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    if (sourcePath.includes('.')) {
      const parts = sourcePath.split('.');
      let current = obj;
      let found = true;
      
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part] as Record<string, unknown>;
        } else {
          found = false;
          break;
        }
      }
      
      if (found) {
        result[targetKey] = current;
      }
    } else if (sourcePath in obj) {
      result[targetKey] = obj[sourcePath];
    }
  }
  
  return result;
}

export function convertTypes(obj: Record<string, unknown>, typeMap: Record<string, 'string' | 'number' | 'boolean' | 'date'>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  
  for (const [key, type] of Object.entries(typeMap)) {
    if (result[key] !== undefined) {
      switch (type) {
        case 'string':
          result[key] = String(result[key]);
          break;
        case 'number':
          result[key] = Number(result[key]);
          break;
        case 'boolean':
          result[key] = Boolean(result[key]);
          break;
        case 'date':
          result[key] = new Date(result[key] as string | Date);
          break;
      }
    }
  }
  
  return result;
}

export function flattenObject(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

export function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return result;
}

export function validateRequiredFields(obj: Record<string, unknown>, requiredFields: string[]): string[] {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

export function mergeObjects(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && 
        result[key] !== null && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = mergeObjects(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}