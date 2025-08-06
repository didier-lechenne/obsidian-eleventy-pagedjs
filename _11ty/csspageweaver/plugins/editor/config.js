export const TOOLBAR_CONFIG = {
  buttons: [
    'smallcaps', 'superscript', 'letter-spacing',
    'nbsp', 'nnbsp', 'quotes-fr', 'quotes-en', 
    'br', 'reset', 'copy-md', 'export-md'
  ],
  selects: [
    {
      id: 'accented-caps',
      icon: 'Á',
      title: 'Capitales accentuées',
      options: [
        { value: 'A_acute', label: 'Á - A accent aigu', char: 'Á' },
        { value: 'A_grave', label: 'À - A accent grave', char: 'À' },
        { value: 'A_circ', label: 'Â - A circonflexe', char: 'Â' },
      ]
    }
  ]
};