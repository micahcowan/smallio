import * as ion from "ionsible";
import * as sprite from "./sprite";
import { Player } from "./sprite";
import * as D from "./defs";
import { Camera, SmallioCamera, CameraBehaviorFac, ICameraBehaviorFactory } from "./camera";
import { player, playSound, gameReset, gameWon } from "./smallio";

class FindNearestWorldClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite as Player;

        // In a bigger game, could probably throttle this function to check once every so often.
        // I doubt it matters for this one, though.
        let worlds = sp.worlds.subsprites as sprite.World[];
        let closestIdx = 0;
        let closestDist = 10000;
        for (let i = 0; i != worlds.length; ++i) {
            let w = worlds[i];
            // Could use a faster method than distFrom that avoids the intrinsic sqrt,
            // but then I have to square the world radius before subtracting... this is more readable.
            let dist = sp.pos.distFrom(w.pos) - w.r;
            if (i == 0 || dist < closestDist) {
                closestIdx = i;
                closestDist = dist;
            }
        }

        sp.pDist = closestDist;

        sp.theWorld = worlds[closestIdx];
        if (!sp.theWorld) sp.theWorld = null;
    }
}

export let FindNearestWorld : ion.IBehaviorFactory
    = (game, sprite) => new FindNearestWorldClass(game, sprite);

class WorldGravityClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite as Player;
        let w = sp.theWorld;

        if (!w) return;
        
        // XXX this indicates a major clunk in ionsible
        let dm = w.pos.diff(sp.pos).asDirMag();
        dm.mag = D.gravity; // set the accel amount
        let accel = new ion.Acceleration(dm);
        sp.vel = sp.vel.advanced(accel, delta);
    }
}

export let WorldGravity : ion.IBehaviorFactory
    = (game, sprite) => new WorldGravityClass(game, sprite);

class WorldCollideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite as sprite.Player;
        let w = sp.theWorld;
        if (!w) return;
        
        // Ensure that falling stops at the planet surface.
        if (sp.touchingWorld !== undefined && sp.touchingWorld(w)) {

            // Find the portion of the velocity that is heading into the world's center.
            let dm = w.pos.diff(sp.pos).asDirMag();
            let hitMag = sp.vel.magnitudeInDir(dm.dir);
            let j : sprite.Jumper | null = null;
            
            if (hitMag <= 0) { // Don't mess with magnitudes going _away_ from the world!
                // Do nothing
            }
            else if (hitMag > sprite.Jumper.minMagnitude && (j = w.findJumperAt(sp.pos))) {
                // Hit the jumper. Velocity will be completely replaced by the jump.
                sp.vel = j.vel;
                playSound('jump');
            }
            else {
                // Scale it back, plus a little extra for bounce!
                let extra = hitMag / 3;
                if (extra < 100) {
                    extra = 0;
                }
                else if (hitMag > D.jumpSpeed * 1.5) {
                    playSound('land');
                }
                sp.vel = sp.vel.diff(new ion.Velocity({ dir: dm.dir, mag: hitMag + extra }));

                // Also ensure that the player can't go beneath the surface of the world.
                // sp.pos = sp.lastPos; // This isn't working. Using the following instead:
                //
                // Adjust player distance from world center, so that it's never
                // submerged. Well, we slightly submerge it so it's detected as "touching"
                dm.mag = w.pos.distFrom(sp.pos) //+ Player.offset;
                sp.pos = w.pos.diff(new ion.Point(dm));

                // If the velocity magnitude is really tiny, zero it
                if (sp.vel.asDirMag().mag < 1)
                    sp.vel = new ion.Velocity(0, 0);
            }
        }
    }
}

export let WorldCollide : ion.IBehaviorFactory
    = (game, sprite) => new WorldCollideClass(game, sprite);

export let playerJump = (s : any) => {
    let sp = s as sprite.Player;
    let w = sp.theWorld;
    if (!w) return;

    // Only jump if we're on the world surface.
    if (!sp.touchingWorld(w, 10)) return;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Jump that direction
    dm.mag = D.jumpSpeed;
    sp.vel = sp.vel.combined(new ion.Velocity(dm));

    // TODO: cap that velocity out, to prevent the occasional multi-triggered jump
};

let playerMover : (inDir : number) => ion.b.KeyHandlerCallback
    = (inDir) => ((game, s, delta) => {

    let sp = s as sprite.Player;
    let w = sp.theWorld;
    if (!w) return;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Accelerate to the side of that.
    dm.dir = dm.dir + inDir;
    dm.mag = D.lateralAccel;
    sp.vel = sp.vel.advanced(new ion.Acceleration(dm), delta)
});

export let playerLeft : ion.b.KeyHandlerCallback = playerMover(D.TAU/4);

export let playerRight : ion.b.KeyHandlerCallback = playerMover(-D.TAU/4);

class PlayerLateralFrictionClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite as Player;
        let w = sp.theWorld;
        if (!w) return;
        // Reduce lateral motion

        // Find out which direction is from the world, toward player.
        let dm = sp.pos.diff(w.pos).asDirMag();
        // Use a degree perpendicular to that.
        let perp = dm.dir + D.TAU/4;
        // Measure that degree from current player velocity.
        let mag = sp.vel.magnitudeInDir(perp);
        // Reduce speed in that direction.
        let redMag = D.lateralFriction;
        if (redMag * delta.s > Math.abs(mag)) {
            // We've exhausted the velocity in this direction. Consume all energy.
            sp.vel = sp.vel.diff(new ion.Velocity({dir: perp, mag: mag}))
        }
        else {
            if ((redMag > 0) == (mag > 0))
                redMag = -redMag;
            sp.vel = sp.vel.advanced(new ion.Acceleration({dir: perp, mag: redMag}), delta);
        }

        // Ensure the total lateral speed doesn't exceed maximum.
        mag = sp.vel.magnitudeInDir(perp);
        if (Math.abs(mag) > D.maxLateralVel) {
            redMag = D.maxLateralVel - Math.abs(mag);
            if (mag > 0) redMag = -redMag;
            sp.vel = sp.vel.diff(new ion.Velocity({dir: perp, mag: redMag}));
        }
    }
}

export let PlayerLateralFriction : ion.IBehaviorFactory
    = (game, sprite) => new PlayerLateralFrictionClass(game, sprite);

class PlayerRotatorClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite as Player;
        let w = sp.theWorld;
        if (!w) return;
        // Rotate the player so feet point at planet.

        // Find out which direction is from the world, toward player.
        let dm = sp.pos.diff(w.pos).asDirMag();
        // Translate into player rotation. When the direction to player
        // is straight up (TAU/4), player should be at 0 rotation.
        // So we subtract TAU/4 from the planet-to-player direction
        // to obtain player rotation.
        let desiredDir = dm.dir - D.TAU/4;

        let ROT_TIME = 1;   // Time in seconds it takes to make a full rotation
        let maxRot = D.TAU * delta.s;
        let desiredRot = ion.util.clampRadians(desiredDir - sp.rotation);
        if (desiredRot > D.TAU/2)
            desiredRot -= D.TAU;

        let scaleDown = maxRot / Math.abs(desiredRot);
        sp.rotation += desiredRot * (scaleDown < 1? scaleDown : 1);
    }
}

export let PlayerRotator : ion.IBehaviorFactory
    = (game, sprite) => new PlayerRotatorClass(game, sprite);

class CollectableCoinClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    private collectedTime = 0;
    update(delta : ion.Duration) {
        let s = this.sprite as sprite.Coin;
        if (s.collected && !gameWon) {
            this.collectedTime += delta.s;
            if (this.collectedTime > 20) {
                s.uncollect();
            }
        }
        else if (player.pos.distFrom(this.sprite.pos) < 10) {
            this.collectedTime = 0;
            s.collect();
        }
    }
}

export let CollectableCoin : ion.IBehaviorFactory
    = (game, sprite) => new CollectableCoinClass(game, sprite);

class BaddyCollisionClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(d : ion.Duration) {
        if (gameWon) return;
        let s = this.sprite;
        if (s.pos.distFrom(player.pos) < 32) {
            //sprite.Coin.resetAllCoins();
            gameReset(); // Not working! :(
        }
    }
}

export let BaddyCollision : ion.IBehaviorFactory
    = (game, sprite) => new BaddyCollisionClass(game, sprite);

class BaddyWorldGlideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(d : ion.Duration) {
        let r = this.world.r;
        let w = this.world.pos;
        let timer = this.game.elapsed.s / this.speed * D.TAU;

        this.sprite.pos = new ion.Point(
            w.x + r * Math.cos(timer)
          , w.y + r * Math.sin(timer)
        );
    }

    constructor(g : ion.Game, s : ion.Sprite, private world : sprite.World, private speed : number) {
        super(g, s);
    }
}

export let BaddyWorldGlide : (w: sprite.World, spd: number) => ion.IBehaviorFactory
    = (w, spd) => ((g: ion.Game, s: ion.Sprite) => new BaddyWorldGlideClass(g, s, w, spd));

class BaddySlideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    public period = 2.5; // time in secs to complete a cycle.
    public xSlide = -160;
    public ySlide = 340;
    public period1 = 1/2;
    public xSlide1 = 40;
    public ySlide1 = 40;

    update(d : ion.Duration) {
        let s = this.sprite as sprite.Baddy;
        let game = this.game;
        let timer = game.elapsed.s / this.period * D.TAU;
        let timer1 = game.elapsed.s / this.period1 * D.TAU;
        s.pos = new ion.Point(
            s.startingPos.x + this.xSlide * Math.sin(timer) + this.xSlide1 * Math.sin(timer1)
          , s.startingPos.y + this.ySlide * Math.sin(timer) + this.ySlide1 * Math.sin(timer1)
        );
    }
}

export let BaddySlide : ion.IBehaviorFactory
    = (game, sprite) => {
        let val = new BaddySlideClass(game, sprite);
        (window as any).mjcslide = val;
        return val;
    }

/*** Camera Behavior */

class CameraFollowsPlayerClass extends CameraBehaviorFac {
    update(delta : ion.Duration) {
        let c = this.camera as SmallioCamera;
        let ppos = player.pos;
        //c.pos = new ion.Point(ppos.x, ppos.y + 80)
        c.pos = ppos;

        // Would be nice, but (a) should chase, not match exactly,
        // and need to make the rotation smoother between planets before
        // it could work.
        //c.rotation = c.player.rotation;

        let ramp = player.pDist / 1000;
        if (ramp > 1) ramp = 1;
        let targetScale = 1 - 4/5 * ramp;
        c.scale = targetScale;
    }
}

export let CameraFollowsPlayer : ICameraBehaviorFactory
    = (g: ion.Game, c: Camera) => new CameraFollowsPlayerClass(g, c);