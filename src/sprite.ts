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
    constructor(g : ion.Game, pos : ion.Point, public readonly szBlocks : number) {
        super(g);

        this.pos = pos;

        let circumf = szBlocks * D.blockSize;
        this.r = circumf / D.TAU;

        this.drawer = new art.World(this);
    }

    setColor(color : string) : this {
        this.color = color;
        return this;
    }
}

export class Player extends ion.Sprite implements ion.ISprite {
    /**
     * The nearest world to the player, and the one whose
     * gravity is applying force to the player.
     */
    theWorld : World | null = null;

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

    touchingWorld(w : World, fudge : number = 0) : boolean {
        return this.pos.distFrom(w.pos) < w.r + 28 + fudge;
    }
}