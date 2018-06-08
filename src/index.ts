/*
 * vcfjs
 * https://github.com/precisely/vcfjs
 *
 * Copyright (c) 2018 Precise.ly, Inc
 */

import fs from 'fs';
import readline from 'readline';
import events, { EventEmitter } from 'events';
import zlib, { gzip } from 'zlib';
import unzip from 'unzip-stream';
import { WriteStream } from 'tty';
import { HeaderEntry, HeaderField, HeaderFieldParseOptions, SimpleHeaderField } from './meta-info';
import * as standardHeaderFields from './standard-fields';

export interface VCFParserOptions extends HeaderFieldParseOptions {}
export interface VCFFilter {
}
export interface VCFInfo {
}
export interface VCFFormat {
}

export interface VCFData {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string[];
  qual: string;
  filter: VCFFilter[];
  info: VCFInfo[];
  format: VCFFormat[];
}

export class VCFParser extends EventEmitter {
  constructor(private headerFields: {[key: string]: HeaderField} = {}, private options: VCFParserOptions) {
    super();
    this.headerFields = {...standardHeaderFields, ...headerFields };
    this.options = options;
    this.initialize();
  }

  read(path: string, fileType?: string) {
    const stream = fs.createReadStream(path);
    const streamType = fileType || path.split('.').pop() || 'vcf';
    this.readStream(stream, streamType);
  }

  readStream(input: NodeJS.ReadableStream, streamType: string): void {
    const lineReader = makeStreamReader(input, streamType);

    this.initialize();

    lineReader.on('line', (line: string) => this.parseHeader(line));
  }

  private parseHeader(line: string) {
    try {
      this.lineCount++;
      const metaHeaderLineRE = /##(\w+)=(.*)/;
      const metaHeaderMatch = metaHeaderLineRE.exec(line);
      if (metaHeaderMatch) {
        this.parseMetaHeader(metaHeaderMatch[1], metaHeaderMatch[2]);
      } else {
        const dataHeaderMatch = /#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO(.*)/i.exec(line);
        if (dataHeaderMatch) {
          const samples = dataHeaderMatch[1].split('\t');
          this.finalizeHeader(samples);
        }
      }
    } catch (e) {
      this.reportError(e);
    }
  }

  private parseMetaHeader(headerName: string, value: string) {
    const headerField = this.headerFields[headerName];
    if (headerField) {
      this.headerEntries.push(headerField.parse(value, this.options));
    } else if (this.options.strict) {
      throw new Error(`Unknown header`);
    } else {
      const newHeaderField = new SimpleHeaderField(headerName, 'string');
      this.headerFields[headerName] = newHeaderField;
      this.headerEntries.push(newHeaderField.parse(value));
    }
  }

  private parseFormat(format: string) {
    return format.split(';');
  }

  private parseFilter(filter: string) {
    return filter.split(';');
  }

  private parseInfo(info: string) {
    return info.split(';');
  }

  private parseDataLine(line: string) {
    const cols = line.split('\t');
    const format = this.parseFormat(cols[8]);
    const data: VCFData = {
      chrom: cols[0],
      pos: parseInt(cols[1]),
      id: cols[2],
      ref: cols[3],
      alt: cols[4].split(','),
      qual: cols[5],
      filter: this.parseFilter(cols[6]),
      info: this.parseInfo(cols[7]),
      format: format,
      samples: this.parseSamples

    };
    this.emit('data', { data, samples: );
  }

  private initialize() {
    this.headerEntries = [];
    this.samples = [];
    this.lineCount = 0;
  }

  private finalizeHeader(samples: string[]) {
    this.samples = samples;
    this.removeAllListeners('line');
    this.on('line', (line: string) => this.parseDataLine(line));
    this.emit('header', { meta: this.headerEntries, samples: this.samples });
  }

  private reportError(e: Error) {
    this.emit('error', { error: e, line: this.lineCount });
  }

  private headerEntries: HeaderEntry[];
  private lineCount: number;
  private samples: string[];
}

//
//
//
//
// OLD STUFF
//
//
//
//
//
//


function parseStream(stream: NodeJS.ReadableStream, streamType: string) {
  var numSamples = 0
  var sampleIndex = {}
  const header: [] = [];
  const lineReader = makeStreamReader(stream, streamType);

  lineReader.on('line', (line: string) => {
    if (isMetaHeader(line)) {
      metaHeader.push(parseMetaHeader(line))
    } else if (isDataHeader)
  });

  rl.on('line', function (line) {
    // check if line starts with hash and use them
    if (line.indexOf('#') === 0) {
      // ##fileformat=VCFv4.1
      if (!vcfAttrib.vcf_v) {
        vcfAttrib.vcf_v = line.match(/^##fileformat=/) ? line.split('=')[1] : null
      }

      // ##samtoolsVersion=0.1.19-44428cd
      if (!vcfAttrib.samtools) {
        vcfAttrib.samtools = line.match(/^##samtoolsVersion=/) ? line.split('=')[1] : null
      }

      // ##reference=file://../index/Chalara_fraxinea_TGAC_s1v1_scaffolds.fa
      if (!vcfAttrib.refseq) {
        vcfAttrib.refseq = line.match((/^##reference=file:/)) ? line.split('=')[1] : null
      }

      // #CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tsample1\tsample2\tsample3
      // set number of samples in vcf file
      if (line.match(/^#CHROM/)) {
        var sampleinfo = line.split('\t')
        numSamples = sampleinfo.length - 9

        for (var i = 0; i < numSamples; i++) {
          sampleIndex[i] = sampleinfo[9 + i]
        }
      }
    } else { // go through remaining lines
            // split line by tab character
      var info = line.split('\t')

      if (info.length < 9) {
        var err = new Error('number of columns in the file are less than expected in vcf')
        vcf.emit('error', err)
      }

      // format information ids
      var formatIds = info[8].split(':')

      // parse the sample information
      var sampleObject = []
      for (var j = 0; j < numSamples; j++) {
        var sampleData = {}
        sampleData['NAME'] = sampleIndex[j]
        var formatParts = info[9].split(':')
        for (var k = 0; k < formatParts.length; k++) {
          sampleData[formatIds[k]] = formatParts[k]
        }
        sampleObject.push(sampleData)
      }

      // parse the variant call information
      var varInfo = info[7].split(';')
      var infoObject = {}

      // check if the variant is INDEL or SNP
      // and assign the specific type of variation identified
      var type
      var typeInfo
      if (varInfo[0].match(/^INDEL$/)) {
        type = 'INDEL'
        varInfo.shift()
        if (info[3].length > info[4].length) {
          typeInfo = 'deletion'
        } else if (info[3].length < info[4].length) {
          typeInfo = 'insertion'
        } else if (info[3].length === info[4].length) {
          typeInfo = 'substitution - multi'
        }
      } else {
        type = 'SNP'
        if (info[3].length === 1) {
          typeInfo = 'substitution'
        } else if (info[3].length > 1) {
          typeInfo = 'substitution - multi'
        }
      }
      infoObject['VAR'] = type
      infoObject['VARINFO'] = typeInfo

      // variant info added to object
      for (var l = 0; l < varInfo.length; l++) {
        var pair = varInfo[l].split('=')
        infoObject[pair[0]] = pair[1]
      }

      // parse the variant information
      var varData = {
        chr: info[0],
        pos: info[1],
        id: info[2],
        ref: info[3],
        alt: info[4],
        qual: info[5],
        filter: info[6],
        varinfo: infoObject,
        sampleinfo: sampleObject,
        attributes: vcfAttrib
      }

      // console.log('Variant data',varData);
      vcf.emit('data', varData)
    }
  })

  rl.on('close', function () {
    vcf.emit('end')
  })
}

// To read file in stream and parse it
vcf.read = function (path) {
  var instream = fs.createReadStream(path)
  var extension = path.split('.').pop()

  parseStream(instream, extension)

  return this
}

// To parse stream data sent by user
vcf.readStream = function (instream, extension = 'vcf') {
  parseStream(instream, extension)

  return this
}

function makeStreamReader(input: NodeJS.ReadableStream, streamType: string): readline.ReadLine {
  const output = new WriteStream();
  switch (streamType) {
    case 'vcf':
      return readline.createInterface(input, output);
    case 'gz':
      return readline.createInterface({input: input.pipe(zlib.createGunzip())});
    case 'zip':
      return readline.createInterface({input: input.pipe(unzip.Parse())});
  }
  throw new Error(`Invalid stream type ${streamType}`);
}

function parseHeaderLine(line: string): VCFHeader | null {
  const metaHeaderRE = /^##([^=]*)=(.*)/;
  const metaMatch = metaHeaderRE.exec(line);

  if (metaMatch) {
    const key = metaMatch[1];
    const value = metaMatch[2];
    return { name: key, value };
  } else {
    const dataHeaderRE = /^#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO(.*)/;
    const dataHeaderMatch = dataHeaderRE.exec(line);
    if (dataHeaderMatch) {
      const samples = dataHeaderMatch[1].split('\t');
      return { samples };
    }
  }
  return null;
}

