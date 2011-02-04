Moksi.describe('Worf', {
  'converts to the correct headers for a WOFF': function() {
    var woff = Worf.load('../example/impact_label.woff');
    var sfnt = Worf.stringToByteArray(Worf.woffToSfnt(woff));
    
    expects(sfnt.slice(0,44)).equals([0,1,0,0,0,15,0,128,0,3,0,112,70,70,84,77,90,217,206,75,0,0,0,252,0,0,0,28,71,68,69,70,1,5,0,4,0,0,1,24,0,0,0,32]);
  },
  
  'converts to the correct Base64 encoded header': function() {
    var sfnt = Worf.woffToSfntAsBase64('../example/impact_label.woff');
    expects(sfnt.slice(0,44)).equals('AAEAAAAPAIAAAwBwRkZUTVrZzksAAAD8AAAAHEdERUYB');
  },
  
  'converts the whole font to the correct Base64 encoded form': function() {
    var sfnt = Worf.woffToSfntAsBase64('../example/impact_label.woff');
    var expected = Worf.load('../example/impact_label.base64');
    expects(sfnt.slice(0,100)).equals(expected.slice(0,100));
    expects(sfnt.length).equals(expected.length);
  }
});