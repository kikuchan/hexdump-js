export type BinaryLike = Uint8Array<ArrayBuffer> | Uint8ClampedArray<ArrayBuffer> | ArrayBuffer | DataView<ArrayBuffer>;

export class BinaryReader {
  #view: DataView<ArrayBuffer>;
  #pos: number;

  constructor(u8: BinaryLike) {
    if (u8 instanceof ArrayBuffer) {
      this.#view = new DataView(u8);
    } else {
      this.#view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    }
    this.#pos = 0;
  }

  get position() {
    return this.#pos;
  }

  get size() {
    return this.#view.byteLength;
  }

  get remain() {
    return this.size - this.position;
  }

  eof() {
    return this.remain <= 0;
  }

  seek(n: number) {
    this.#pos = n;
    return this;
  }

  skip(n?: number) {
    this.#pos += Math.min(n ?? 1, this.size - this.#pos);
    return this;
  }

  align(n: number) {
    if (this.position % n) {
      return this.skip(n - (this.position % n));
    }
    return this;
  }

  peekBuffer(n?: number) {
    if (n === undefined) n = this.remain;

    const pos = this.#view.byteOffset + this.position;
    return this.#view.buffer.slice(pos, pos + n);
  }

  readByte() {
    const r = this.#view.getUint8(this.position);
    this.skip(1);
    return r;
  }

  readLe16() {
    const r = this.#view.getUint16(this.position, true);
    this.skip(2);
    return r;
  }

  readLe32() {
    const r = this.#view.getUint32(this.position, true);
    this.skip(4);
    return r;
  }

  readLe64() {
    const r = this.#view.getBigUint64(this.position, true);
    this.skip(8);
    return r;
  }

  readBe16() {
    const r = this.#view.getUint16(this.position, false);
    this.skip(2);
    return r;
  }

  readBe32() {
    const r = this.#view.getUint32(this.position, false);
    this.skip(4);
    return r;
  }

  readBe64() {
    const r = this.#view.getBigUint64(this.position, false);
    this.skip(8);
    return r;
  }

  readBytes(n?: number) {
    const buffer = this.peekBuffer(n);
    if (buffer) this.skip(buffer.byteLength);
    return buffer;
  }

  #strlen() {
    const remain = this.remain;
    for (let i = 0; i < remain; i++) {
      if (this.#view.getUint8(this.position + i) === 0) {
        return i;
      }
    }
    return undefined; // No termination
  }

  /**
   * @returns string. undefined on oversize or EOF.
   */
  readString(len?: number, encoding?: string) {
    const remain = this.remain;
    let extraLength = 0;

    if (len === undefined) {
      // C String Mode
      len = this.#strlen();
      extraLength = 1;
    }
    if (len === undefined || remain < len) return undefined; // EOF

    const buffer = this.peekBuffer(len);
    try {
      const string = new TextDecoder(encoding ?? 'utf-8', {
        fatal: true,
      }).decode(buffer);
      this.skip(len + extraLength);
      return string;
    } catch {
      return undefined;
    }
  }
}
