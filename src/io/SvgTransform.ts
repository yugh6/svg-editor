import { Numeric } from '../domain/Numeric.js';

/** The Phase 1 importer normalizes translate and positive uniform scale. */
export class SvgTransform {
  constructor(readonly factor = 1, readonly x = 0, readonly y = 0) {}
  compose(local: SvgTransform): SvgTransform {
    return new SvgTransform(Numeric.finite(this.factor * local.factor),
      Numeric.finite(this.x + this.factor * local.x), Numeric.finite(this.y + this.factor * local.y));
  }
  static parse(source: string): SvgTransform {
    const number = '([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)';
    const separator = '(?:\\s*,\\s*|\\s+)';
    const expression = new RegExp(`\\s*(?:translate\\s*\\(\\s*${number}(?:${separator}${number})?\\s*\\)|scale\\s*\\(\\s*${number}(?:${separator}${number})?\\s*\\))\\s*,?`, 'giy');
    let transform = new SvgTransform(), offset = 0;
    while (offset < source.trimEnd().length) {
      expression.lastIndex = offset;
      const match = expression.exec(source);
      if (!match) throw new Error(`unsupported transform: ${source}`);
      const factor = match[3] === undefined ? 1 : Numeric.parse(match[3]);
      Numeric.positive(factor, 'transform scale');
      if (match[4] !== undefined && Numeric.parse(match[4]) !== factor) throw new Error('non-uniform scale is not supported');
      transform = transform.compose(new SvgTransform(factor,
        match[1] === undefined ? 0 : Numeric.parse(match[1]),
        match[2] === undefined ? 0 : Numeric.parse(match[2])));
      offset = expression.lastIndex;
    }
    return transform;
  }
}
