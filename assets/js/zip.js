(() => {
  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(data) {
    let c = 0xffffffff;
    for (const byte of data) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function dosDate(date) {
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
  }

  function u16(n) {
    const out = new Uint8Array(2);
    new DataView(out.buffer).setUint16(0, n, true);
    return out;
  }

  function u32(n) {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, n, true);
    return out;
  }

  async function zipBlobs(files) {
    const now = dosDate(new Date());
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const file of files) {
      const data = new Uint8Array(await file.blob.arrayBuffer());
      const name = new TextEncoder().encode(file.name.replace(/[\\/]/g, "-"));
      const crc = crc32(data);
      const local = new Uint8Array(30 + name.length + data.length);
      local.set([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 0, 0], 0);
      local.set(u16(now.time), 10);
      local.set(u16(now.day), 12);
      local.set(u32(crc), 14);
      local.set(u32(data.length), 18);
      local.set(u32(data.length), 22);
      local.set(u16(name.length), 26);
      local.set(name, 30);
      local.set(data, 30 + name.length);
      locals.push(local);
      const central = new Uint8Array(46 + name.length);
      central.set([0x50, 0x4b, 0x01, 0x02, 20, 0, 20, 0, 0, 0, 0, 0], 0);
      central.set(u16(now.time), 12);
      central.set(u16(now.day), 14);
      central.set(u32(crc), 16);
      central.set(u32(data.length), 20);
      central.set(u32(data.length), 24);
      central.set(u16(name.length), 28);
      central.set(u32(offset), 42);
      central.set(name, 46);
      centrals.push(central);
      offset += local.length;
    }
    const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
    const eocd = new Uint8Array(22);
    eocd.set([0x50, 0x4b, 0x05, 0x06], 0);
    eocd.set(u16(files.length), 8);
    eocd.set(u16(files.length), 10);
    eocd.set(u32(centralSize), 12);
    eocd.set(u32(offset), 16);
    const out = new Uint8Array(offset + centralSize + 22);
    let cursor = 0;
    for (const part of locals) { out.set(part, cursor); cursor += part.length; }
    for (const part of centrals) { out.set(part, cursor); cursor += part.length; }
    out.set(eocd, cursor);
    return new Blob([out], { type: "application/zip" });
  }

  window.UtiloraZip = { zipBlobs };
})();
