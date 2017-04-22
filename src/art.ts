import * as ion from "ionsible";

import * as D from "./defs";
import * as sp from "./sprite";

export class Background implements ion.IDrawable {
    draw(c : CanvasRenderingContext2D) {
        c.save();
        // Restore identity matrix, so the background doesn't depend on position.
        // XXX: Perhaps cameras should have a background drawer of their own?
        c.setTransform(1, 0, 0, 1, 0, 0); 
        c.fillStyle = "#ccf";
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
        c.restore();
    }
}

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

export class Player implements ion.IDrawable {
    public static img : HTMLImageElement;

    draw(c : CanvasRenderingContext2D) {
        c.save();
        c.translate(-32, 32);
        c.scale(1, -1);
        c.drawImage(Player.img, 0, 0);
        c.restore();
    }

    constructor(private sprite : sp.Player) {
        if (Player.img === undefined) {
            //Player.img = new Image();
            Player.img = document.createElement("img");
            Player.img.src = "gfx/guy.png";
            (window as any).mjcimg = Player.img;
        }
    }
}