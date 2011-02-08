Moksi.describe('Worf', {
  helpers: {
    sleep: function(wait) {
      var sleeping = true;
      var now, then = (new Date()).getTime();
      while(sleeping) {
        now = (new Date()).getTime();
        if (now - then > wait) sleeping = false;
      }
    }
  },
  
  'generates a font-face declaration to include in the styling': function() {
    var declaration = Worf.fontFaceDeclaration(" \
      font-family: 'Label';                      \
      font-weight: normal;                       \
      font-style: normal;                        \
    ", "DATA", "truetype");
    declaration = declaration.replace(/\s+/g, " ");
    expects(declaration).equals("@font-face { src: url(//:) format('no404'), url(data:font/truetype;charset=utf-8;base64,DATA) format(truetype); font-family: 'Label'; font-weight: normal; font-style: normal; }");
  },
  
  'adds a style tag to the HEAD with the font-face declaration': function() {
    Worf.define("../example/impact_label.woff", "font-family: 'Label';");
  }
});