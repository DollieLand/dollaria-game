import { h } from '../utils/dom.js';

// Круг с буквами: игрок ведёт пальцем (или мышью) по буквам, отпускает — слово отправляется.
export class Wheel {
  constructor({ letters, size, onPreview, onWord }) {
    this.letters = letters.map((ch, i) => ({ ch, id: i }));
    this.size = size;
    this.onPreview = onPreview;
    this.onWord = onWord;
    this.sel = [];
    this.pointer = null;
    this.el = h('div', { class: 'wheel', style: { width: `${size}px`, height: `${size}px` } });
    this.svgNS = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(this.svgNS, 'svg');
    this.svg.setAttribute('class', 'wheel__line');
    this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    this.line = document.createElementNS(this.svgNS, 'polyline');
    this.svg.append(this.line);
    this.el.append(this.svg);
    this.buttons = [];
    this.layout();
    this.bind();
  }

  layout() {
    const n = this.letters.length;
    const tile = Math.round(Math.min(64, this.size * (n > 6 ? 0.2 : 0.23)));
    const r = this.size / 2 - tile / 2 - 8;
    this.tile = tile;
    this.buttons.forEach((b) => b.remove());
    this.buttons = this.letters.map((l, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      l.x = this.size / 2 + r * Math.cos(a);
      l.y = this.size / 2 + r * Math.sin(a);
      const b = h('button', {
        class: 'wheel__letter', tabindex: '-1', 'aria-hidden': 'true',
        style: { width: `${tile}px`, height: `${tile}px`, left: `${l.x - tile / 2}px`, top: `${l.y - tile / 2}px`, fontSize: `${Math.round(tile * 0.5)}px` },
      }, l.ch.toUpperCase());
      l.btn = b;
      this.el.append(b);
      return b;
    });
  }

  shuffle() {
    const a = this.letters;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    this.layout();
  }

  hit(clientX, clientY) {
    const rect = this.el.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    let best = null, bestD = Infinity;
    for (const l of this.letters) {
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bestD) { bestD = d; best = l; }
    }
    return { letter: bestD <= this.tile * 0.62 ? best : null, x, y };
  }

  bind() {
    const start = (e) => {
      const { letter, x, y } = this.hit(e.clientX, e.clientY);
      if (!letter) return;
      e.preventDefault();
      this.el.setPointerCapture?.(e.pointerId);
      this.active = true;
      this.sel = [letter];
      this.pointer = { x, y };
      this.update();
    };
    const move = (e) => {
      if (!this.active) return;
      e.preventDefault();
      const { letter, x, y } = this.hit(e.clientX, e.clientY);
      this.pointer = { x, y };
      if (letter) {
        const prev = this.sel[this.sel.length - 2];
        if (prev === letter) this.sel.pop();
        else if (!this.sel.includes(letter)) this.sel.push(letter);
      }
      this.update();
    };
    const end = () => {
      if (!this.active) return;
      this.active = false;
      const word = this.sel.map((l) => l.ch).join('');
      this.sel = [];
      this.pointer = null;
      this.update();
      if (word.length >= 3) this.onWord(word);
      else this.onPreview('');
    };
    this.el.addEventListener('pointerdown', start);
    this.el.addEventListener('pointermove', move);
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
    this.el.addEventListener('lostpointercapture', end);
  }

  update() {
    for (const l of this.letters) l.btn.classList.toggle('is-on', this.sel.includes(l));
    const pts = this.sel.map((l) => `${l.x},${l.y}`);
    if (this.pointer && this.sel.length) pts.push(`${this.pointer.x},${this.pointer.y}`);
    this.line.setAttribute('points', pts.join(' '));
    this.onPreview(this.sel.map((l) => l.ch).join(''));
  }
}
