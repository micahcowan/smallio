import * as ion from "ionsible";

import * as D from "./defs";
import * as art from "./art";
import * as sm from "./behavior";
import { playSound, music } from "./smallio";
import * as smallio from "./smallio";

export class Background extends ion.Sprite implements ion.ISprite {
    drawer : ion.IDrawable = new art.Background();
}

export class Jumper {
    public static rect : ion.Rect = {t: 10, b: -8, l: -30, r: 30};
    // quarter-second of gravity's worth of velocity.
    public static minMagnitude : number = D.gravity * 1/4;

    public readonly vel : ion.Velocity;
    constructor(public world : World, public readonly dir : number, public readonly height : number) {
        // Calculate magnitude of velocity from height
        this.vel = new ion.Velocity({dir: dir, mag: D.getSpeedFromDist(height)});
    }

    matchesDir(dir : number) : boolean {
        let fudgeSz = ion.getXYWH(Jumper.rect).w / 2; // Size in pixels to fudge
        // translate into directional fudge, using world radius
        let w = this.world
        /*
        let circumf = w.r * D.TAU;
        let fudge = (fudgeSz / circumf) * D.TAU;
        */
        let fudge = fudgeSz / w.r; // faster than above
        dir = ion.util.clampRadians(dir);
        let myDir = ion.util.clampRadians(this.dir);
        return Math.abs(dir - myDir) < fudge;
    }
}

export class Coin extends ion.Sprite implements ion.ISprite {
    public collected : boolean = false;

    constructor(g : ion.Game, private w: World, pos: ion.Point, rot: number) {
        super(g);
        this.pos = pos;
        this.rotation = rot;

        this.drawer = new art.Coin(this);
    }

    behaviors : ion.IBehaviorFactory[] = [
        sm.CollectableCoin
    ]

    collect() : void {
        if (!this.collected) {
            playSound('coin');
            ++smallio.score.val;
        }
        this.collected = true;
    }
}

export class World extends ion.Sprite implements ion.ISprite, ion.ISpriteContainer {
    public readonly r : number;            // Radius size of this world
    public color : string = "olive";
    constructor(g : ion.Game, pos : ion.Point, public readonly szBlocks : number) {
        super(g);

        this.pos = pos;

        let circumf = szBlocks * D.blockSize;
        this.r = circumf / D.TAU;

        this.drawer = new art.World(this);

        this.makeCoins(szBlocks);
    }

    subsprites : ion.ISprite[] = []

    private makeCoins(n : number) : void {
        let r = this.r + D.blockSize * 3/4;
        for (let i = 0; i < n; ++i) {
            let A = i * (D.TAU/n);
            let x = this.pos.x + r * Math.cos(A);
            let y = this.pos.y + r * Math.sin(A);
            this.subsprites.push(new Coin(this.game, this, new ion.Point(x, y), A - D.TAU/4))
        }
    }

    setColor(color : string) : this {
        this.color = color;
        return this;
    }

    public jumpers : Jumper[] = [];
    addJumper(dir : number, height : number) : this {
        this.jumpers.push(new Jumper(this, dir, height));
        return this;
    }

    /**
     * Find Jumper at Player position.
     * Note: assumes we've already checked for whether
     * we're at the surface, and just checks the direction.
     */
    findJumperAt(pos : ion.Point) : Jumper | null {
        // Get direction to player
        let dm = pos.diff(this.pos).asDirMag();
        for (let i = 0; i < this.jumpers.length; ++i) {
            let j = this.jumpers[i];
            if (j.matchesDir(dm.dir))
                return j;
        }
        return null;
    }
}

export class Player extends ion.Sprite implements ion.ISprite {
    /**
     * The nearest world to the player, and the one whose
     * gravity is applying force to the player.
     */
    theWorld : World | null = null;

    // reflects distance from nearest planet. Used for scaling.
    // set by FindNearestWorld behavior.
    pDist : number = 10000;

    constructor(g : ion.Game, pos : ion.Point, public worlds : ion.ISpriteContainer) {
        super(g);
        this.drawer = new art.Player(this);
        this.pos = pos;
    }

    behaviors : ion.IBehaviorFactory[] = [
        sm.FindNearestWorld
      , sm.WorldGravity
      , sm.WorldCollide
      , ion.b.HandleKeys([
          {
              handler: sm.playerLeft,
              keys: ['A', 'Left']
          }
        , {
              handler: sm.playerRight,
              keys: ['D', 'Right']
          }
        ])
      , ion.b.OnKey({
            keyDown: ["Space", 'Up', 'W']
          , fire: sm.playerJump
        })
      , sm.PlayerLateralFriction
      , ion.b.Momentum
      , sm.PlayerRotator
    ];

    /**
     * How much to raise the player picture above the ground.
     */
    public static readonly offset = 28;
    touchingWorld(w : World, fudge : number = 0) : boolean {
        return this.pos.distFrom(w.pos) < w.r + Player.offset + fudge;
    }
}

export class Score extends ion.Sprite implements ion.ISprite {
    private _score : number = 0;
    get val() : number { return this._score; }
    set val(n : number) {
        this._score = n;
        let stext = document.getElementById("scoreText");
        if (stext === null) return;
        stext.innerText = this._score.toString();
    }
    behaviors : ion.IBehaviorFactory[] = [
        // Music toggle handling. Doesn't belong here.
        ion.b.OnKey({
            keyUp: 'M'
          , fire: (sprite: any) => {
                if (music.paused)
                    music.resume();
                else
                    music.pause();
            }
        })
    ];
}