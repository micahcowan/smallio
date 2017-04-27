import * as ion from "./ionsible/ionsible";

import * as D from "./defs";
import * as sp from "./sprite";
import { gameWon } from "./smallio";

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
        let s = this.sprite as sp.World;
        let p = s.pos;
        c.beginPath();
        c.arc(0, 0, s.r, 0, D.TAU);

        c.fillStyle = s.color;
        c.fill();
        c.strokeStyle = "black";
        c.lineWidth = 5;
        c.stroke();

        // Draw jumpers
        s.jumpers.forEach((j) => {
            c.save();
            c.rotate(j.dir - D.TAU/4);
            c.translate(0, s.r)
            let r : ion.Rect = ion.getXYWH(sp.Jumper.rect);
            c.fillStyle = "rgba(255,255,220,0.8)";
            c.fillRect(r.x, r.y, r.w, r.h);
            c.strokeStyle = "black";
            c.lineWidth = 1.2;
            c.strokeRect(r.x, r.y, r.w, r.h);
            c.restore();
        })
    }

    constructor(private sprite : sp.World) {}
}

export class Player implements ion.IDrawable {
    public static img : HTMLImageElement;

    draw(c : CanvasRenderingContext2D) {
        c.save();
        try {
            c.translate(-32, -32);
            c.drawImage(Player.img, 0, 0);
        }
        finally {
            c.restore();
        }
    }

    constructor(private sprite : sp.Player) {
        if (Player.img === undefined) {
            //Player.img = new Image();
            Player.img = document.createElement("img");
            Player.img.src = "gfx/guy.png";
        }
    }
}

export class Coin implements ion.IDrawable {
    constructor(private sprite : sp.Coin) { }

    draw(c : CanvasRenderingContext2D) {
        let s = this.sprite;
        if (s.collected) return;

        c.beginPath();

        c.save();
        c.transform(1,0,0,1.33,0,0);

        c.arc(0, 0, 10, 0, D.TAU);

        c.restore();

        c.fillStyle = "#ff8";
        c.fill();
        c.strokeStyle = "black";
        c.lineWidth = 1.2;
        c.stroke();
    }
}

export class Baddy implements ion.IDrawable {
    public static img : HTMLImageElement;

    constructor(private sprite : sp.Baddy) {
        if (Baddy.img === undefined) {
            //Player.img = new Image();
            Baddy.img = document.createElement("img");
            Baddy.img.src = "gfx/baddy.png";
        }
    }

    draw(c: CanvasRenderingContext2D) : void {
        c.save();
        try {
            c.translate(-32, -32);
            c.drawImage(Baddy.img, 0, 0);
        }
        finally {
            c.restore();
        }
    }
}

export class GameWon implements ion.IDrawable {
    draw(c: CanvasRenderingContext2D) : void {
        if (!gameWon) return;

        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);

        // Draw game over text.
        let center = this.game.center;
        c.font = 'bold 48px Arial Black, Helvetica, sans-serif';
        var msg = "YOU WON!";
        c.lineWidth = 10;
        c.lineJoin = 'round';
        c.strokeStyle = 'white';
        c.textAlign = 'center';
        c.strokeText(msg, center.x, center.y);
        c.fillStyle = 'black';
        c.fillText(msg, center.x, center.y);

        c.restore();
    }

    constructor(private game : ion.Game) {}
}