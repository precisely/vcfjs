import { parse } from "url";

export interface HeaderEntry {
  name: string;
  value: number | string | string[] | StructuredValue;
}

export type StructuredValue = { ID: string } & { [key: string]: number | string | string[] };

export const InfoValueType = { Integer: true, Float: true, Flag: true, Character: true, String: true };
export type HeaderFieldType = 'number' | 'string' | 'type' | 'stringList';
export type StructuredFieldKeys = { [name: string]: HeaderFieldType };

export interface HeaderFieldParseOptions {
  strict?: boolean;
}

export abstract class HeaderField {
  constructor(readonly name: string) {}

  public abstract parse(line: string, options: HeaderFieldParseOptions): HeaderEntry;
  protected parseValue(v: string, type: HeaderFieldType): string | number | string[] {
    let result;
    switch (type) {
      case 'number':
        result = parseFloat(v);
        if (!result && /A|R|G|\./.test(v)) { // special alternate cases
          result = v;
        }
        break;
      case 'string':
        let quoted = /^"([^"]*)"$/.exec(v);
        if (quoted) {
          result = quoted[1];
        } else {
          result = v;
        }
        break;
      case 'stringList':
        result = v.split(';').map(elt => <string>this.parseValue(elt, 'string'));
        break;
      case 'type':
        if (!InfoValueType.hasOwnProperty(v)) {
          throw new Error(`Unexpected INFO type "${v}", expecting one of ${InfoValueType}`);
        }
        break;
    }
    if (!result) {
      throw new Error(`Expected type "${type}", but received ${v}`);
    }
    return result;
  }
}

export class SimpleHeaderField extends HeaderField {
  constructor(public readonly name: string, public readonly type: HeaderFieldType) {
    super(name);
  }

  parse(value: string): HeaderEntry {
    return {
      name: this.name,
      value: this.parseValue(value, this.type)
    };
  }
}

export class StructuredHeaderField extends HeaderField {
  public readonly requiredKeys: StructuredFieldKeys;
  public readonly optionalKeys: StructuredFieldKeys;

  constructor(public readonly name: string, options: {requiredKeys?: StructuredFieldKeys, optionalKeys?: StructuredFieldKeys}) {
    super(name);
    this.captureRE = new RegExp(`^##${name}=<(.*)>`, 'i').compile();
    this.requiredKeys = { ID: 'string', ...options.requiredKeys || {} };
    this.optionalKeys = options.optionalKeys || {};
  }

  public parse(line: string, options: HeaderFieldParseOptions = { strict: false }): HeaderEntry {
    const match = this.captureRE.exec(line);
    if (match) {
      return {
        name: this.name,
        value: this.requiredKeys ? this.parseKVPairs(match[1], options.strict) : match[1]
      };
    } else {
      throw new Error(`Failed to parse ${name} header: ${line}`);
    }
  }

  private parseKVPairs(line: string, strict: boolean): StructuredValue {
    const kvPairRE = /(\w+)=(("[^"]*")|([^,\>]*))/;
    let match;
    const result: StructuredValue = { ID: '' };
    const requiredKeys = {...this.requiredKeys};
    const optionalKeys = {...this.optionalKeys};
    const allKeys = {...requiredKeys, ...optionalKeys};
    while (match = kvPairRE.exec(line)) {
      const k = match[1];
      const v = match[2];
      if (requiredKeys.hasOwnProperty(k)) {
        result[k] = this.parseValue(v, requiredKeys[k]);
        delete requiredKeys[k];
      } else if (this.optionalKeys.hasOwnProperty(k)) {
        result[k] = this.parseValue(v, this.optionalKeys[k]);
        delete optionalKeys[k];
      } else if (allKeys.hasOwnProperty(k)) {
        throw new Error(`Duplicate key ${k}=${v}`);
      } else if (strict) {
        throw new Error(`Unexpected key ${k}`);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  private captureRE: RegExp;
}