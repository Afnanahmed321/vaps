(() => {
  const encoder = new TextEncoder();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zip(files) {
    const localParts = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;

    for (const [path, contents] of Object.entries(files)) {
      const name = encoder.encode(path);
      const data = encoder.encode(contents);
      const checksum = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(12, 33, true);
      local.setUint32(14, checksum, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      localParts.push(local.buffer, name, data);

      const central = new DataView(new ArrayBuffer(46));
      central.setUint32(0, 0x02014b50, true);
      central.setUint16(4, 20, true);
      central.setUint16(6, 20, true);
      central.setUint16(14, 33, true);
      central.setUint32(16, checksum, true);
      central.setUint32(20, data.length, true);
      central.setUint32(24, data.length, true);
      central.setUint16(28, name.length, true);
      central.setUint32(42, offset, true);
      directory.push(central.buffer, name);

      offset += local.byteLength + name.length + data.length;
      directorySize += central.byteLength + name.length;
    }

    const count = Object.keys(files).length;
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, count, true);
    end.setUint16(10, count, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...localParts, ...directory, end.buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }

  const spreadsheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const relationship = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const packageRelationship = "http://schemas.openxmlformats.org/package/2006/relationships";
  const xml = '<?xml version="1.0" encoding="UTF-8"?>';
  const escapeXml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  window.createAcademicYearWorkbook = rows => {
    const sheetRows = rows.map((fields, index) => {
      const row = index + 1;
      const cells = fields.map((value, column) => {
        const location = String.fromCharCode(65 + column) + row;
        return typeof value === "number"
          ? `<c r="${location}"><v>${value}</v></c>`
          : `<c r="${location}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      });
      return `<row r="${row}">${cells.join("")}</row>`;
    }).join("");

    return zip({
      "[Content_Types].xml": `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      "_rels/.rels": `${xml}<Relationships xmlns="${packageRelationship}"><Relationship Id="rId1" Type="${relationship}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      "xl/workbook.xml": `${xml}<workbook xmlns="${spreadsheet}" xmlns:r="${relationship}"><sheets><sheet name="Academic Years" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      "xl/_rels/workbook.xml.rels": `${xml}<Relationships xmlns="${packageRelationship}"><Relationship Id="rId1" Type="${relationship}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      "xl/worksheets/sheet1.xml": `${xml}<worksheet xmlns="${spreadsheet}"><cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="4" width="18" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`
    });
  };
})();
