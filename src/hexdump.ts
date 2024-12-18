function hex(v: number, c: number) {
  return Number(v).toString(16).padStart(c, '0');
}

type Options = {
  addrOffset?: number;
  printer?: false | ((s: string) => void);
  prefix?: string;
  printChars?: boolean;
  foldSize?: number;
};
export function hexdump(buf: ArrayLike<number> | ArrayBuffer | DataView, options?: Options): string;
export function hexdump(buf: ArrayLike<number> | ArrayBuffer | DataView, len: number, options?: Options): string;
export function hexdump(buf: ArrayLike<number> | ArrayBuffer | DataView, len?: number | Options, options?: Options) {
  const u8 = ArrayBuffer.isView(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : new Uint8Array(buf);
  if (typeof len !== 'number') {
    options = len;
    len = u8.length;
  }
  options = { ...(options ?? {}) };
  if (len === undefined || len < 0) len = u8.length;
  if (options.addrOffset === undefined) options.addrOffset = 0;

  const printer =
    options.printer ||
    (options.printer !== false
      ? console.log
      : () => {
          return;
        });

  const foldSize = options.foldSize || 16;
  const printChars = options.printChars !== false;

  const offset = options.addrOffset % foldSize;
  const count = (offset + len! + foldSize - 1) / foldSize;

  const result: string[] = [];
  let line = '';
  const print = function (s: string) {
    line += s;
  };

  const prefix = options?.prefix || '';

  for (let i = 0; i < count; i++) {
    print(`${prefix}${hex(options.addrOffset, 8 - prefix.length)}: `);
    options.addrOffset = (options.addrOffset / foldSize) * foldSize;
    for (let j = 0; j < foldSize; j++) {
      const idx = i * foldSize + j - offset;
      if (j % 8 == 0) print(' ');
      if (idx < len!) {
        print(`${hex(u8[idx], 2)} `);
      } else {
        print('   ');
      }
    }
    if (printChars) {
      print(' |');
      for (let j = 0; j < foldSize; j++) {
        const idx = i * foldSize + j - offset;

        if (idx < len!) {
          print(u8[idx] >= 0x20 && u8[idx] < 0x7f ? String.fromCharCode(u8[idx]) : '.');
        } else {
          print(' ');
        }
      }
      print('|');
    }

    printer(line);
    result.push(line);
    line = '';

    options.addrOffset += foldSize;
  }
  return result.join('\n');
}

export default {
  hexdump,
};
