Moksi.describe('Worf', {
  'generates a font-face declaration to include in the styling': function() {
    var declaration = Worf.Converter.fontFaceDeclaration("truetype", "DATA",
    "                                                      \
      font-family: 'Label';                                \
      font-weight: normal;                                 \
      font-style: normal;                                  \
    ");
    declaration = declaration.replace(/\s+/g, " ");
    expects(declaration).equals("@font-face { src: url(//:) format('no404'), url(data:font/truetype;charset=utf-8;base64,DATA) format(truetype); font-family: 'Label'; font-weight: normal; font-style: normal; }");
  }
});