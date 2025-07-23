// components/CodeGen/index.js
// Export principal du composant CodeGen

export { CodeGenerator  as default } from './CodeGenerator.js';

// Types de shortcodes supportés
export const SHORTCODE_TYPES = {
    INSERT: 'insert',
    IMAGEGRID: 'imagegrid', 
    IMAGE: 'image',
    FIGURE: 'figure'
};

// Classes exclues lors de la génération
export const EXCLUDED_CLASSES = [
    'selected', 
    'hover', 
    'cursor', 
    'figure', 
    'image', 
    'insert', 
    'resize', 
    'figmove', 
    'icono',
    'resizable',
    'resizing'
];

// Templates de génération
export const CODE_TEMPLATES = {
    insert: '{.insert {classes} {styles}}',
    image: '({type}: {url} {properties} {classes} {caption})',
    figure: '({type}: {url} {properties} {classes} {caption})',
    imagegrid: '({type}: {url} {properties} {classes} {caption})'
};

// Propriétés CSS à exporter
export const EXPORT_PROPERTIES = [
    'col', 
    'width', 
    'print-col', 
    'print-width', 
    'print-row', 
    'print-height', 
    'align-self', 
    'img-x', 
    'img-y', 
    'img-w'
];