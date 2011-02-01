var Worf = {
  powers: [16777216, 65536, 256, 1],
  debug: false,
  
  use: function(src) {
    this.load(src, function(data) {
      Worf.decode(data);
    });
  },
  
  load: function(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        var index  = 0;
        var buffer = [];
        while(index < request.responseText.length)
          buffer[index] = request.responseText.charCodeAt(index++) & 0xff;
        callback(buffer);
      }
    };
    request.open('GET', url, true);
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.send(null);
  },
  
  tag: function(data, offset, length) {
    var tag = '';
    for (var index=0; index < length; index++) {
      tag = tag + String.fromCharCode(data[index+offset]);
    }
    return tag;
  },
  
  uint: function(data, offset, length) {
    var value  = 0;
    var powers = this.powers.slice(-length)
    for (var index=0; index < length; index++) {
      value = value + powers[index] * data[index+offset];
    }
    return value;
  },
  
  decode: function(data) {
    var header = this.parseHeader(data);
    console.log(header);
    var directory = this.parseTableDirectory(header, data);
    console.log(directory);
    var tables = this.readTables(data, directory)
    // console.log(tables);
  },
  
  parseHeader: function(data) {
    var header = {}
    // UInt32	signature	0x774F4646 'wOFF'
    header.signature      = this.tag(data, 0, 4);
    // UInt32	flavor	The "sfnt version" of the input font.
    header.flavor         = this.uint(data, 4, 4);
    // UInt32 length  Total size of the WOFF file.
    header.size           = this.uint(data, 8, 4);
    // UInt16 numTables Number of entries in directory of font tables.
    header.entries        = this.uint(data, 12, 2);
    // UInt16 reserved  Reserved; set to zero.
    header.reserved       = this.uint(data, 14, 2);
    // UInt32 totalSfntSize Total size needed for the uncompressed font data, including the sfnt header, directory, and font tables (including padding).
    header.totalSfntSize  = this.uint(data, 16, 4);
    // UInt16 majorVersion  Major version of the WOFF file.
    header.majorVersion   = this.uint(data, 20, 2);
    // UInt16 minorVersion  Minor version of the WOFF file.
    header.minorVersion   = this.uint(data, 22, 2);
    // UInt32 metaOffset  Offset to metadata block, from beginning of WOFF file.
    header.metaOffset     = this.uint(data, 24, 4);
    // UInt32 metaLength  Length of compressed metadata block.
    header.metaLength     = this.uint(data, 28, 4);
    // UInt32 metaOrigLength  Uncompressed size of metadata block.
    header.metaOrigLength = this.uint(data, 32, 4);
    // UInt32 privOffset  Offset to private data block, from beginning of WOFF file.
    header.privOffset     = this.uint(data, 36, 4);
    // UInt32 privLength  Length of private data block.
    header.privLength     = this.uint(data, 40, 4);
    return header;
  },
  
  parseTableDirectory: function(header, data) {
    var directory = [];
    for (var index = 0; index < header.entries; index++) {
      directory.push(this.parseTableDirectoryEntry(header, data, 44 + (index * 20)));
    }
    return directory;
  },
  
  parseTableDirectoryEntry: function(header, data, offset) {
    var entry = {};
    // UInt32 tag 4-byte sfnt table identifier.
    entry.identifier = this.tag(data, offset, 4);
    // UInt32 offset  Offset to the data, from beginning of WOFF file.
    entry.offset     = this.uint(data, offset + 4, 4);
    // UInt32 compLength  Length of the compressed data, excluding padding.
    entry.compLength = this.uint(data, offset + 8, 4);
    // UInt32 origLength  Length of the uncompressed table, excluding padding.
    entry.origLength = this.uint(data, offset + 12, 4);
    // UInt32 origChecksum  Checksum of the uncompressed table.
    entry.checksum   = this.uint(data, offset + 16, 4);
    return entry;
  },
  
  readTables: function(data, directory) {
    var tables = [];
    for(var index = 0; index < directory.length; index++) {
      tables.push(this.readTable(data, directory[index]));
    }
    return tables;
  },
  
  readTable: function(data, entry) {
    if (entry.compLength < entry.origLength) {
      var unpacked = (new JXG.Util.Unzip(data.slice(entry.offset, entry.offset + entry.compLength))).unzip();
      if (unpacked.length)
        return unpacked[0][0];
      else
        return '';
    } else {
      return data.slice(entry.offset, entry.offset + entry.compLength);
    }
  }
};