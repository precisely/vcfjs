import {StructuredHeaderField} from './meta-info';

export const InfoField = new StructuredHeaderField('INFO', {
  requiredKeys: {
    Number: 'number',
    Type: 'type',
    Description: 'string'
  },
  optionalKeys: {
    Source: 'string',
    Version: 'string'
  }
});

export const FilterField = new StructuredHeaderField('FILTER', {
  requiredKeys: {
    Description: 'string'
  }
});

export const FormatField = new StructuredHeaderField('FORMAT', {
  requiredKeys: {
    Number: 'number',
    Type: 'type',
    Description: 'string'
  }
});

export const AltField = new StructuredHeaderField('ALT', {
  requiredKeys: {
    Description: 'string'
  }
});

export const ContigField = new StructuredHeaderField('contig', {
  requiredKeys: {
    URL: 'string'
  }
});

export const SampleField = new StructuredHeaderField('SAMPLE', {
  requiredKeys: {
    Genomes: 'stringList',
    Mixtures: 'stringList',
    Descriptions: 'stringList'
  }
});

export const PedigreeField = new StructuredHeaderField('PEDIGREE', {
  requiredKeys: {},
  optionalKeys: {}
});