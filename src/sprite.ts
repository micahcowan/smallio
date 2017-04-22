import * as ion from "ionsible";

import * as D from "./defs";
import * as art from "./art";
import * as sm from "./behavior";

export class Background extends ion.Sprite implements ion.ISprite {
    drawer : ion.IDrawable = new art.Background();
}

export class World extends ion.Sprite implements ion.ISprite {
    public readonly r : number;            // Radius size of this world
    public color : string = "olive";
    public static theWorld : World;
    constructor(g : ion.Game, public readonly pos : ion.Point, public readonly szBlocks : number) {
        super(g);

        let circumf = szBlocks * D.blockSize;
        this.r = circumf / D.TAU;

        this.drawer = new art.World(this);

        if (World.theWorld === undefined)
            World.theWorld = this;
    }
}

export class Player extends ion.Sprite implements ion.ISprite {
    constructor(g : ion.Game, public readonly pos : ion.Point) {
        super(g);
        this.drawer = new art.Player(this);
    }

    behaviors : ion.IBehaviorFactory[] = [
        sm.WorldGravity
      , sm.WorldCollide
      , ion.b.Momentum
    ];
}