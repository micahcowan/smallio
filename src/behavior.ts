import * as ion from "ionsible";
import * as sprite from "./sprite";
import * as D from "./defs";

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
        let w = sprite.World.theWorld; // XXX
        let sp = this.sprite as sprite.Player;
        
        // Ensure that falling stops at the planet surface.
        if (sp.touchingWorld !== undefined && sp.touchingWorld(w)) {
            // Find the portion of the velocity that is heading into the world's center.
            let dm = w.pos.diff(sp.pos).asDirMag();
            let hitMag = sp.vel.magnitudeInDir(dm.dir);

            // Don't mess with magnitudes going _away_ from the world!
            if (hitMag > 0) {
                // Scale it back, plus a little extra for bounce!
                let extra = hitMag / 3;
                if (extra < 25) extra = 0;
                sp.vel = sp.vel.diff(new ion.Velocity({dir: dm.dir, mag: hitMag + extra}));

                // Also ensure that the player can't go beneath the surface of the world.
                sp.pos = sp.lastPos;
            }
        }
    }
}

export let WorldCollide : ion.IBehaviorFactory
    = (game, sprite) => new WorldCollideClass(game, sprite);

export let playerJump = (s : any) => {
    let sp = s as sprite.Player;
    let w = sprite.World.theWorld;

    // Only jump if we're on the world surface.
    if (!sp.touchingWorld(w)) return;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Jump that direction
    dm.mag = 150;
    sp.vel = sp.vel.combined(new ion.Velocity(dm));
};

let playerMover = (inDir : number) => ((s : any) => {
    let sp = s as sprite.Player;
    let w = sprite.World.theWorld;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Accelerate to the side of that.
    dm.dir = dm.dir + inDir;
    dm.mag = 50;
    sp.vel = sp.vel.combined(new ion.Velocity(dm));
});

export let playerLeft = playerMover(D.TAU/4);

export let playerRight = playerMover(-D.TAU/4);

class PlayerLateralFrictionClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;
        let w = sprite.World.theWorld;
        // Reduce lateral motion

        // Find out which direction is from the world, toward player.
        let dm = sp.pos.diff(w.pos).asDirMag();
        // Use a degree perpendicular to taht.
        let perp = dm.dir + D.TAU/4;
        // Measure that degree from current player velocity.
        let mag = sp.vel.magnitudeInDir(perp);
        // Calculate a reduction to that direction
        let redMag = mag * 0.05;
        // Subtract it from velocity.
        sp.vel = sp.vel.diff(new ion.Velocity({dir: perp, mag: redMag}))
    }
}

export let PlayerLateralFriction : ion.IBehaviorFactory
    = (game, sprite) => new PlayerLateralFrictionClass(game, sprite);

class PlayerRotatorClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;
        let w = sprite.World.theWorld;
        // Rotate the player so feet point at planet.

        // For now, just rotate to match. Eventually we'll want to limit
        // how much rotation can happen per frame.

        // Find out which direction is from the world, toward player.
        let dm = sp.pos.diff(w.pos).asDirMag();
        // Translate into player rotation. When the direction to player
        // is straight up (TAU/4), player should be at 0 rotation.
        // So we subtract TAU/4 from the planet-to-player direction
        // to obtain player rotation.
        sp.rotation = dm.dir - D.TAU/4;
    }
}

export let PlayerRotator : ion.IBehaviorFactory
    = (game, sprite) => new PlayerRotatorClass(game, sprite);