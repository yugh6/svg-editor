import { DOMImplementation, DOMParser, XMLSerializer, type Document, type Element } from '@xmldom/xmldom';
import type { LoadedDocument } from '../application/DocumentStore.js';
import { Numeric } from '../domain/Numeric.js';
import type { Shape } from '../domain/Shape.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { SvgTransform } from './SvgTransform.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();
  private readonly presentation = new Set(['font-size', 'font-family', 'font-weight', 'font-style',
    'text-anchor', 'dominant-baseline', 'opacity', 'fill-opacity', 'stroke-opacity',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'rx', 'ry', 'data-kind']);

  private childElements(element: Element): Element[] {
    return Array.from(element.childNodes).filter(node => node.nodeType === 1) as Element[];
  }
  private validateNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error(`unsupported namespace: ${element.namespaceURI}`);
  }
  private length(value: string, fallback: number): number {
    return value ? Numeric.parse(value.replace(/px$/, '')) : fallback;
  }
  decode(source: string): LoadedDocument {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('SVG document types and entities are not supported');
    let xml: Document;
    try {
      xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, 'image/svg+xml');
    } catch (error) { throw new Error(`invalid SVG: ${error instanceof Error ? error.message : String(error)}`); }
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg') throw new Error('expected <svg> root');
    this.validateNamespace(root);
    const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).filter(Boolean).map(value => Numeric.parse(value, 'viewBox'));
    const document = new SvgDocument(this.length(root.getAttribute('width') ?? '', viewBox?.[2] ?? 800),
      this.length(root.getAttribute('height') ?? '', viewBox?.[3] ?? 600));
    if (viewBox) document.setViewBox(viewBox);
    const roots = this.childElements(root);
    const elements: Element[] = [];
    const collect = (element: Element): void => { elements.push(element); this.childElements(element).forEach(collect); };
    roots.forEach(collect);
    const reserved = new Set<string>();
    if (root.getAttribute('id')) reserved.add(root.getAttribute('id')!);
    for (const element of elements) {
      this.validateNamespace(element);
      const id = element.getAttribute('id');
      if (id) {
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
    }
    const ids = new Map<Element, string>(), warnings: string[] = [];
    for (const element of elements) {
      let id = element.getAttribute('id');
      if (!id) {
        let index = 1;
        while (reserved.has(`${element.localName}${index}`)) index++;
        id = `${element.localName}${index}`; reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${element.localName}>`);
      }
      ids.set(element, id);
    }
    for (const attribute of Array.from(root.attributes)) {
      if (['xmlns', 'width', 'height', 'viewBox', 'transform'].includes(attribute.name)) continue;
      if (!this.presentation.has(attribute.name) && !['fill', 'stroke', 'stroke-width', 'id', 'version', 'preserveAspectRatio'].includes(attribute.name)) {
        throw new Error(`unsupported SVG attribute: ${attribute.name}`);
      }
      document.importPresentation(attribute.name, attribute.value);
    }
    const rootTransform = SvgTransform.parse(root.getAttribute('transform') ?? '');
    const rootStrokeWidth = this.length(root.getAttribute('stroke-width') ?? '', 1);
    const rootFontSize = this.length(root.getAttribute('font-size') ?? '', 16);
    const readShape = (element: Element, parentTransform: SvgTransform, inheritedWidth: number, inheritedFont: number): Shape => {
      const shape = this.factory.empty(element.localName ?? element.tagName, ids.get(element)!);
      const transform = parentTransform.compose(SvgTransform.parse(element.getAttribute('transform') ?? ''));
      const strokeWidth = this.length(element.getAttribute('stroke-width') ?? '', inheritedWidth);
      const fontSize = this.length(element.getAttribute('font-size') ?? '', inheritedFont);
      const geometry = new Set(shape.attributes().map(([name]) => name));
      for (const attribute of Array.from(element.attributes)) {
        if (['id', 'xmlns', 'transform'].includes(attribute.name)) continue;
        if (geometry.has(attribute.name) || ['fill', 'stroke', 'stroke-width'].includes(attribute.name)) shape.set(attribute.name, attribute.value);
        else if (this.presentation.has(attribute.name)) shape.importPresentation(attribute.name, attribute.value);
        else throw new Error(`unsupported SVG attribute: ${attribute.name}`);
      }
      const children = this.childElements(element);
      if (shape.textContent !== null) {
        if (children.length) throw new Error('nested text elements are not supported');
        shape.set('text', element.textContent ?? '');
      } else if (Array.from(element.childNodes).some(node => (node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim())) {
        throw new Error(`unexpected text in <${element.localName}>`);
      }
      for (const child of children) shape.asGroup().insert(readShape(child, transform, strokeWidth, fontSize));
      if (!children.length) {
        shape.scale(transform.factor); shape.move(transform.x, transform.y);
        if (transform.factor !== 1) {
          shape.set('stroke-width', String(Numeric.finite(strokeWidth * transform.factor)));
          if (shape.textContent !== null) shape.importPresentation('font-size', String(Numeric.finite(fontSize * transform.factor)));
        }
      }
      return shape;
    };
    for (const element of roots) document.add(readShape(element, rootTransform, rootStrokeWidth, rootFontSize));
    return { document, warnings };
  }
  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('xmlns', this.namespace);
    for (const [name, value] of document.canvasAttributes()) root.setAttribute(name, value);
    const append = (shape: Shape, parent: Element, depth: number): void => {
      parent.appendChild(xml.createTextNode(`\n${'  '.repeat(depth)}`));
      const element = xml.createElementNS(this.namespace, shape.type);
      for (const [name, value] of shape.attributes()) element.setAttribute(name, value);
      if (shape.textContent !== null) element.appendChild(xml.createTextNode(shape.textContent));
      for (const child of shape.children) append(child, element, depth + 1);
      if (shape.children.length) element.appendChild(xml.createTextNode(`\n${'  '.repeat(depth)}`));
      parent.appendChild(element);
    };
    document.children.forEach(shape => append(shape, root, 1));
    root.appendChild(xml.createTextNode('\n'));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
  }
}
