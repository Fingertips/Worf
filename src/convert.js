var Worf = {
  VERSION: "0.1.0",
  
  font_face: function() {
    var length = arguments.length / 2;
    var url, rules;
    while(length--) {
      url = arguments[length*2];
      rules = arguments[length*2+1];
      Worf._font_face(url, rules);
    }
    Worf.Caching.cleanup();
  },
  
  _font_face: function(url, rules) {
    var sfnt = Worf.Caching.get(url);
    if (!sfnt) {
      Worf.Converter.woffToSfntAsBase64(url, function(base64, flavor) {
        Worf.define_font_face(flavor, base64, rules);
        Worf.Caching.set(url, flavor, base64);
      });
    } else {
      sfnt.push(rules);
      Worf.define_font_face.apply(this, sfnt);
    }
  },
  
  define_font_face: function(flavor, base64, rules) {
    var declaration = Worf.Converter.fontFaceDeclaration(flavor, base64, rules);
    var style = document.createElement('style');
    style.innerHTML = declaration;
    document.head.appendChild(style);
  }
}

Worf.Converter = {
  fontFaceDeclaration: function(flavor, data, rules) {
    return("@font-face {                                                                                         \
      src: url(//:) format('no404'), url(data:font/"+flavor+";charset=utf-8;base64,"+data+") format("+flavor+"); \
      "+rules+"                                                                                                  \
    }");
  },
  
  load: function(url, callback) {
    var request = new XMLHttpRequest();
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        callback(request.responseText);
      }
    };
    request.open('GET', url, true);
    request.send(null);
  },
  
  fromUint16: function(data) {
    return (data[0] << 8) + data[1];
  },
  
  fromUint32: function(data) {
    return (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
  },
  
  toUint16: function(value) {
    return [(value & 0xff00) >> 8, value & 0xff]
  },
  
  toUint32: function(value) {
    return [(value & 0xff000000) >> 24, (value & 0xff0000) >> 16, (value & 0xff00) >> 8, value & 0xff]
  },
  
  woffToSfntAsBase64: function(src, callback) {
    this.load(src, function(woff) {
      var oldFunction = Worf.Util.Base64._utf8_encode;
      Worf.Util.Base64._utf8_encode = function(data) { return data; }
      var encoded = Worf.Util.Base64.encode(Worf.Converter.woffToSfnt(woff));
      Worf.Util.Base64._utf8_encode = oldFunction;
      callback(encoded, Worf.Converter.woffFlavor(woff));
    });
  },
  
  lowestPower: function(entries) {
    var lowestPower = entries;
    lowestPower |= (lowestPower >> 1);
    lowestPower |= (lowestPower >> 2);
    lowestPower |= (lowestPower >> 4);
    lowestPower |= (lowestPower >> 8);
    lowestPower &= ~(lowestPower >> 1);
    return lowestPower;
  },
  
  stringToByteArray: function(data) {
    var index  = 0;
    var buffer = [];
    while(index < data.length)
      buffer[index] = data.charCodeAt(index++) & 0xff;
    return buffer;
  },
  
  cleanup: function(data) {
    return String.fromCharCode.apply(this, this.stringToByteArray(data));
  },
  
  woffFlavor: function(data) {
    var flavor = this.fromUint32(this.stringToByteArray(data.slice(4, 8)));
    switch(flavor) {
      case 0x00010000:
        return 'truetype';
      case 0x4f54544f:
        return 'opentype';
      default:
        throw "Unknown font type";
    }
  },
  
  woffToSfnt: function(data) {
    var sfntHeader = [];
    var sfntData = '';
    var woffDirectory = {};
    var entries = this.fromUint16(this.stringToByteArray(data.slice(12, 14)));
    var lowestPower = this.lowestPower(entries);
    var woffHeader = this.stringToByteArray(data.slice(0,44));
    
    sfntHeader = sfntHeader.concat(woffHeader.slice(4, 8)); // version
    sfntHeader = sfntHeader.concat(woffHeader.slice(12, 14)); // numTables
    sfntHeader = sfntHeader.concat(this.toUint16(lowestPower*16)); // searchRange;
    sfntHeader = sfntHeader.concat(this.toUint16(Math.log(lowestPower) / Math.LN2)) // entrySelector
    sfntHeader = sfntHeader.concat(this.toUint16((entries * 16) - (lowestPower * 16))); // rangeShift
    
    // sfntHeader header is 12 bytes and a table directory entry is 16 bytes
    var sfntDataOffset = 12 + (entries * 16);
    var sfntTag, rawSfntTag, woffEntryOffset, sfntTableSize, sfntTablePadding;
    var directoryKeys = [];
    var woffEntry;
    
    // Collect all table directory entries so we can sort them and write them out
    for (var entryIndex = 0; entryIndex < entries; entryIndex++) {
      
      // WOFF header is 44 bytes and a table directory entry is 20 bytes
      woffEntryOffset = 44 + (entryIndex * 20);
      woffEntry = this.stringToByteArray(data.slice(woffEntryOffset, woffEntryOffset+20));
      
      sfntTableSize = this.fromUint32(woffEntry.slice(12, 16)); // size
      rawSfntTag = woffEntry.slice(0, 4)
      sfntTag = this.fromUint32(rawSfntTag);
      
      woffDirectory[sfntTag] = {};
      woffDirectory[sfntTag].rawTag = rawSfntTag;
      woffDirectory[sfntTag].woffEntryOffset = woffEntryOffset;
      woffDirectory[sfntTag].checksum = woffEntry.slice(16, 20); // checksum
      woffDirectory[sfntTag].offset = sfntDataOffset;
      woffDirectory[sfntTag].length = sfntTableSize;
      directoryKeys.push(sfntTag);
      
      // Increment the offset counter for the next entry and add 4-byte alignment whitespace
      sfntTablePadding = (Math.ceil(sfntTableSize / 4.0) * 4) - sfntTableSize;
      sfntDataOffset += sfntTableSize + sfntTablePadding;
      
      var woffDataOffset = this.fromUint32(woffEntry.slice(4, 8)); // offset
      var woffDataCompressedSize = this.fromUint32(woffEntry.slice(8, 12)); // compSize
      
      if (sfntTableSize > woffDataCompressedSize) {
        var unpacked = (new Worf.Util.Unzip(this.stringToByteArray(data.slice(woffDataOffset, woffDataOffset + woffDataCompressedSize)))).unzip();
        sfntData += unpacked[0][0]; // Bad data breaks at this line
      } else {
        sfntData += this.cleanup(data.slice(woffDataOffset, woffDataOffset + woffDataCompressedSize));
      }
      // Write zero bytes as padding
      for (var index = 0; index < sfntTablePadding; index++) { sfntData += String.fromCharCode(0); };
    }
    
    // Write the table directory
    var entry;
    directoryKeys = directoryKeys.sort();
    for (var entryIndex = 0; entryIndex < directoryKeys.length; entryIndex++) {
      entry = woffDirectory[directoryKeys[entryIndex]];
      sfntHeader = sfntHeader.concat(entry.rawTag); // tag
      sfntHeader = sfntHeader.concat(entry.checksum); // checksum
      sfntHeader = sfntHeader.concat(this.toUint32(entry.offset)); // offset
      sfntHeader = sfntHeader.concat(this.toUint32(entry.length)); // length
    }
    
    return(String.fromCharCode.apply(this, sfntHeader) + sfntData);
  }
}

Worf.Caching = {
  baseKey: function(url) {
    return('worf.' + url);
  },
  
  get: function(url) {
    var baseKey = Worf.Caching.baseKey(url);
    if (localStorage[baseKey + '.timestamp']) {
      return([
        localStorage[baseKey + '.flavor'],
        localStorage[baseKey + '.base64']
      ]);
    }
  },
  
  set: function(url, flavor, base64) {
    var baseKey = Worf.Caching.baseKey(url);
    localStorage[baseKey + '.timestamp'] = (new Date()).getTime();
    localStorage[baseKey + '.flavor'] = flavor;
    localStorage[baseKey + '.base64'] = base64;
  },
  
  maxAge: 3600*24*1000,
  
  cleanup: function() {
    var match, now, timestamp, baseKey;
    for (key in localStorage) {
      if (match = key.match(/^worf\.(.*)\.timestamp$/)) {
        now = (new Date()).getTime();
        timestamp = parseInt(localStorage[key]);
        if (now - timestamp > Worf.Caching.maxAge) {
          baseKey = 'worf.'+match[1];
          localStorage.removeItem(baseKey+'.timestamp');
          localStorage.removeItem(baseKey+'.flavor');
          localStorage.removeItem(baseKey+'.base64');
        }
      }
    }
  }
}

//= require "compressor"