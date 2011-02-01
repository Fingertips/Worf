var Worf = {
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
        callback(request.responseText);
      }
    };
    request.open('GET', url, true);
    request.send(null);
  },
  
  uint: function(data, offset, length) {
    var value = 0;
    for (var index=0; index < length; index++) {
      // console.log([length, index, data.charCodeAt(index+offset), Math.pow(2, 8*(length-index-1))]);
      value = value + Math.pow(2, 8*(length-index-1)) * (data.charCodeAt(index+offset) & 0xff);
    }
    return value;
  },
  
  decode: function(data) {
    var header = this.parseHeader(data);
    console.log(header);
    var tables = this.parseTableDirectory(header, data);
    console.log(tables);
  },
  
  parseHeader: function(data) {
    var header = {}
    // UInt32	signature	0x774F4646 'wOFF'
    // UInt32	flavor	The "sfnt version" of the input font.
    // UInt32 length  Total size of the WOFF file.
    // UInt16 numTables Number of entries in directory of font tables.
    header.entries = this.uint(data, 12, 2);
    // UInt16 reserved  Reserved; set to zero.
    // UInt32 totalSfntSize Total size needed for the uncompressed font data, including the sfnt header, directory, and font tables (including padding).
    // UInt16 majorVersion  Major version of the WOFF file.
    // UInt16 minorVersion  Minor version of the WOFF file.
    // UInt32 metaOffset  Offset to metadata block, from beginning of WOFF file.
    // UInt32 metaLength  Length of compressed metadata block.
    // UInt32 metaOrigLength  Uncompressed size of metadata block.
    // UInt32 privOffset  Offset to private data block, from beginning of WOFF file.
    // UInt32 privLength  Length of private data block.
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
    entry.identifier = this.uint(data, offset, 4);
    // UInt32 offset  Offset to the data, from beginning of WOFF file.
    entry.offset     = this.uint(data, offset+4, 4);
    // UInt32 compLength  Length of the compressed data, excluding padding.
    entry.compLength = this.uint(data, offset+8, 4);
    // UInt32 origLength  Length of the uncompressed table, excluding padding.
    // UInt32 origChecksum  Checksum of the uncompressed table.
    entry.checksum = this.uint(data, offset+32, 4);
    
    return entry;
  }
};