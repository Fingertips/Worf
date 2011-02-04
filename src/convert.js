var Worf = {
  load: function(url, callback) {
    var request = new XMLHttpRequest();
    if (callback) {
      request.onreadystatechange = function() {
        if (request.readyState == 4)
          callback(Worf.stringToByteArray(request.responseText));
      };
    }
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.open('GET', url, (callback && true));
    request.send(null);
    if (!callback) {
      return Worf.stringToByteArray(request.responseText);
    }
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
    var oldFunction = JXG.Util.Base64._utf8_encode;
    JXG.Util.Base64._utf8_encode = function(data) { return data; }
    var encoded = JXG.Util.Base64.encode(Worf.woffToSfnt(this.load(src)));
    JXG.Util.Base64._utf8_encode = oldFunction;
    return encoded;
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
  
  byteArrayToString: function(byteArray) {
    var buffer = ''
    for(var index = 0; index < byteArray.length; index++) {
      buffer += String.fromCharCode(byteArray[index]);
    }
    return buffer;
  },
  
  woffToSfnt: function(data) {
    var sfntHeader = [];
    var sfntData = [];
    var woffDirectory = {};
    var entries = this.fromUint16(data.slice(12, 14));
    var lowestPower = this.lowestPower(entries);
    
    // uint32_t version;
    sfntHeader = sfntHeader.concat(data.slice(4, 8));
    // uint16_t numTables;
    sfntHeader = sfntHeader.concat(data.slice(12, 14));
    // uint16_t searchRange;
    sfntHeader = sfntHeader.concat(this.toUint16(lowestPower*16));
    // uint16_t entrySelector;
    sfntHeader = sfntHeader.concat(this.toUint16(Math.log(lowestPower) / Math.LN2));
    // uint16_t rangeShift;
    sfntHeader = sfntHeader.concat(this.toUint16((entries * 16) - (lowestPower * 16)));
    
    // sfntHeader header is 12 bytes and a table directory entry is 16 bytes
    var sfntDataOffset = 12 + (entries * 16);
    var sfntTag, rawSfntTag, woffEntryOffset, sfntTableSize, sfntTablePadding;
    var directoryKeys = [];
    
    // Collect all table directory entries so we can sort them and write them out
    for (var entryIndex = 0; entryIndex < entries; entryIndex++) {
      // WOFF header is 44 bytes and a table directory entry is 20 bytes
      woffEntryOffset = 44 + (entryIndex * 20);
      sfntTableSize = this.fromUint32(data.slice(woffEntryOffset+12, woffEntryOffset+16));
      rawSfntTag = data.slice(woffEntryOffset, woffEntryOffset+4)
      sfntTag = this.fromUint32(rawSfntTag);
      
      woffDirectory[sfntTag] = {};
      woffDirectory[sfntTag].rawTag = rawSfntTag;
      woffDirectory[sfntTag].woffEntryOffset = woffEntryOffset;
      woffDirectory[sfntTag].checksum = data.slice(woffEntryOffset+16, woffEntryOffset+20);
      woffDirectory[sfntTag].offset = sfntDataOffset;
      woffDirectory[sfntTag].length = sfntTableSize;
      directoryKeys.push(sfntTag);
      
      // Increment the offset counter for the next entry and add alignment whitespace
      sfntTablePadding = (Math.ceil(sfntTableSize / 4.0) * 4) - sfntTableSize;
      sfntDataOffset += sfntTableSize + sfntTablePadding;
      
      var woffDataOffset = this.fromUint32(data.slice(woffEntryOffset+4, woffEntryOffset+8));
      var woffDataCompressedSize = this.fromUint32(data.slice(woffEntryOffset+8, woffEntryOffset+12));
      var byteArray = data.slice(woffDataOffset, woffDataOffset + woffDataCompressedSize);
      
      if (sfntTableSize > woffDataCompressedSize) {
        var unpacked = (new JXG.Util.Unzip(byteArray)).unzip();
        sfntData.push(unpacked[0][0]); // Bad data breaks at this line
      } else {
        sfntData.push(this.byteArrayToString(byteArray));
      }
      // Write zero bytes as padding
      for (var index = 0; index < sfntTablePadding; index++) { sfntData.push(0) };
    }
    
    // Write the table directory
    var entry;
    directoryKeys = directoryKeys.sort();
    for (var entryIndex = 0; entryIndex < directoryKeys.length; entryIndex++) {
      entry = woffDirectory[directoryKeys[entryIndex]];
      // uint32_t tag;
      sfntHeader = sfntHeader.concat(entry.rawTag);
      // uint32_t checksum;
      sfntHeader = sfntHeader.concat(entry.checksum);
      // uint32_t offset;
      sfntHeader = sfntHeader.concat(this.toUint32(entry.offset));
      // uint32_t length;
      sfntHeader = sfntHeader.concat(this.toUint32(entry.length));
    }
    
    // Write everything to a string and return it
    var buffer = this.byteArrayToString(sfntHeader);
    for (var index = 0; index < sfntData.length; index++) {
      buffer += sfntData[index];
    }
    return buffer;
  }
}