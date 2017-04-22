import * as ion from "ionsible";
import * as sprite from "./sprite";

class WorldGravityClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;
        let w = sprite.World.theWorld; // XXX
        
        // XXX this indicates a major clunk in ionsible
        let dm = w.pos.diff(sp.pos).asDirMag();
        dm.mag = 200; // set the accel amount
        let accel = new ion.Acceleration(dm);
        sp.vel = sp.vel.advanced(accel, delta);
    }
}

export let WorldGravity : ion.IBehaviorFactory
    = (game, sprite) => new WorldGravityClass(game, sprite);

class WorldCollideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {

    }
}

export let WorldCollide : ion.IBehaviorFactory
    = (game, sprite) => new WorldCollideClass(game, sprite);