import * as ion from "ionsible";

import * as D from "./defs";
import * as sp from "./sprite";

export class World implements ion.IDrawable {
    draw(c : CanvasRenderingContext2D) {
        let s = this.sprite;
        let p = s.pos;
        c.beginPath();
        c.arc(p.x, p.y, s.r, 0, D.TAU);
        c.closePath();

        c.fillStyle = s.color;
        c.fill();
        c.strokeStyle = "black";
        c.lineWidth = 5;
        c.stroke();
    }

    constructor(private sprite : sp.World) {}
}