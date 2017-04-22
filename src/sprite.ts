import * as ion from "ionsible";

import * as D from "./defs";
import * as art from "./art";

export class World extends ion.Sprite implements ion.ISprite {
    public readonly r : number;            // Radius size of this world
    public color : string = "olive";
    constructor(g : ion.Game, public readonly pos : ion.Point, public readonly szBlocks : number) {
        super(g);

        let circumf = szBlocks * D.blockSize;
        this.r = circumf / D.TAU;

        this.drawer = new art.World(this);
    }
}