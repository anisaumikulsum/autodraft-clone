declare module 'svg-path-properties' {
  export class svgPathProperties {
    constructor(path: string);
    getTotalLength(): number;
    getPointAtLength(length: number): { x: number; y: number };
  }
}
