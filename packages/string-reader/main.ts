export class StringReader {
  #s: string;
  #pos: number = 0;
  #length: number;

  constructor(s: string) {
    this.#s = s;
    this.#length = s.length;
  }

  get position() {
    return this.#pos;
  }

  get size() {
    return this.#length;
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
    this.#pos += Math.min(n ?? 1, this.remain);
    return this;
  }

  match(m: string | RegExp, cb?: (matched: string[]) => void) {
    if (this.eof()) return false;

    const sliced = this.#s.slice(this.position);

    const matched = typeof m === 'string' ? sliced.startsWith(m) && [m] : sliced.match(new RegExp(m, 'y'));
    if (!matched) return false;

    this.skip(matched[0].length);
    cb?.(matched);
    return matched;
  }

  skipUntil(m: string | RegExp, cb?: (obj: { skipped: string; matched: string[] }) => void) {
    if (this.eof()) return false;

    const sliced = this.#s.slice(this.position);

    const pos = typeof m === 'string' ? sliced.indexOf(m) : sliced.search(m);
    if (pos < 0) return false;

    const matched: string[] = typeof m === 'string' ? [m] : sliced.match(m)!;
    const skipped = sliced.slice(0, pos);
    this.skip(pos);
    cb?.({ skipped, matched });
    return { skipped, matched };
  }

  read(n?: number) {
    if (this.eof()) return '';

    n = n ?? 1;
    if (n <= 0) n = this.remain + n;

    const result = this.#s.slice(this.position, this.position + n);
    this.skip(n);
    return result;
  }
}
