import * as ion from "./ionsible/ionsible";
import * as sprite from "./sprite";
import { Player } from "./sprite";
import * as D from "./defs";
import { Camera, SmallioCamera, CameraBehaviorFac, ICameraBehaviorFactory } from "./camera";
import { player, playSound, gameReset, gameWon, vantagePoint } from "./smallio";

class FindNearestWorldClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;

        // In a bigger game, could probably throttle this function to check once every so often.
        // I doubt it matters for this one, though.
        // FIXME: surely this could be more terse?
        let subsprites = sp.worlds.subsprites;
        let closestWorld : sprite.World | null = null;
        let closestDist = 10000;
        for (let sub of subsprites) {
            if (! (sub instanceof sprite.World)) continue;
            let w : sprite.World = sub;
            // Could use a faster method than distFrom that avoids the intrinsic sqrt,
            // but then I have to square the world radius before subtracting... this is more readable.
            let dist = sp.pos.distFrom(w.pos) - w.r;
            if (dist < closestDist) {
                closestWorld = w;
                closestDist = dist;
            }
        }

        sp.pDist = closestDist;
        sp.theWorld = closestWorld;
    }

    public sprite : Player;
}

export let FindNearestWorld : ion.IBehaviorFactory<Player>
    = (game, sprite) => new FindNearestWorldClass(game, sprite);

class WorldGravityClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    // FIXME: A generalized vrsion of this ought to exist in ionsible.
    // Perhaps expressiong a tagged groups that gravitate one toward the other.
    update(delta : ion.Duration) {
        let sp = this.sprite;
        let w = sp.theWorld;

        if (!w) return;
        
        sp.vel = sp.vel.combined(ion.accelToward(sp.pos, w.pos, delta, D.gravity));
    }

    public sprite : Player;
}

export let WorldGravity : ion.IBehaviorFactory<Player>
    = (game, sprite) => new WorldGravityClass(game, sprite);

class WorldCollideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    // FIXME: This ought to use body collisions, and be, or be based on,
    // a generalized implementation within ionsible.
    update(delta : ion.Duration) {
        let sp = this.sprite;
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
                sp.vel = sp.vel.diff(ion.veloc({ dir: dm.dir, mag: hitMag + extra }));

                // Also ensure that the player can't go beneath the surface of the world.
                // sp.pos = sp.lastPos; // This isn't working. Using the following instead:
                //
                // Adjust player distance from world center, so that it's never
                // submerged. Well, we slightly submerge it so it's detected as "touching"
                dm.mag = w.pos.distFrom(sp.pos) //+ Player.offset;
                sp.pos = w.pos.diff(ion.point(dm));

                // If the velocity magnitude is small, zero it
                if (sp.vel.asDirMag().mag < 1)
                    sp.vel = ion.veloc(0, 0);
            }
        }
    }

    public sprite : Player;
}

export let WorldCollide : ion.IBehaviorFactory<Player>
    = (game, sprite) => new WorldCollideClass(game, sprite);

export let playerJump = (sp : Player) => {
    // FIXME: maybe instead fo HandleKeys and the like just passing a sprite to a function,
    // they trigger an event
    let w = sp.theWorld;
    if (!w) return;

    // Only jump if we're on the world surface.
    if (!sp.touchingWorld(w, 20)) return;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Negate any current velocity in the direction toward or away from the world.
    sp.vel = sp.vel.diff(ion.veloc({ dir: dm.dir, mag: sp.vel.magnitudeInDir(dm.dir) }));
    // Jump that direction
    dm.mag = D.jumpSpeed;
    sp.vel = sp.vel.combined(ion.veloc(dm));
};

let playerMover = (inDir: number) => ((game: ion.Game, sp: Player, delta: ion.Duration) => {

    let w = sp.theWorld;
    if (!w) return;

    // Find out which direction is from the world, toward player.
    let dm = sp.pos.diff(w.pos).asDirMag();
    // Accelerate to the side of that.
    dm.dir = dm.dir + inDir;
    dm.mag = D.lateralAccel;
    sp.vel = sp.vel.advanced(ion.accel(dm), delta)
});

export let playerLeft : (g: ion.Game, sp: Player, delta: ion.Duration) => void = playerMover(-D.TAU/4);

export let playerRight : (g: ion.Game, sp: Player, delta: ion.Duration) => void = playerMover(D.TAU/4);

class PlayerLateralFrictionClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;
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
            sp.vel = sp.vel.diff(ion.veloc({dir: perp, mag: mag}))
        }
        else {
            if ((redMag > 0) == (mag > 0))
                redMag = -redMag;
            sp.vel = sp.vel.advanced(ion.accel({dir: perp, mag: redMag}), delta);
        }

        // Ensure the total lateral speed doesn't exceed maximum.
        mag = sp.vel.magnitudeInDir(perp);
        if (Math.abs(mag) > D.maxLateralVel) {
            redMag = D.maxLateralVel - Math.abs(mag);
            if (mag > 0) redMag = -redMag;
            sp.vel = sp.vel.diff(ion.veloc({dir: perp, mag: redMag}));
        }
    }

    public sprite : Player;
}

export let PlayerLateralFriction : ion.IBehaviorFactory<Player>
    = (game, sprite) => new PlayerLateralFrictionClass(game, sprite);

class PlayerRotatorClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(delta : ion.Duration) {
        let sp = this.sprite;
        let w = sp.theWorld;
        if (!w) return;
        // Rotate the player so feet point at planet.

        // Find out which direction is from the world, toward player.
        let dm = w.pos.diff(sp.pos).asDirMag();
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

    public sprite : Player
}

export let PlayerRotator : ion.IBehaviorFactory<Player>
    = (game, sprite) => new PlayerRotatorClass(game, sprite);

class CollectableCoinClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    private collectedTime = 0;
    update(delta : ion.Duration) {
        let s = this.sprite;
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

    public sprite : sprite.Coin;
}

export let CollectableCoin : ion.IBehaviorFactory<sprite.Coin>
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

export let BaddyCollision : ion.IBehaviorFactory<ion.Sprite>
    = (game, sprite) => new BaddyCollisionClass(game, sprite);

class BaddyWorldGlideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    update(d : ion.Duration) {
        let r = this.world.r;
        let w = this.world.pos;
        let timer = this.game.elapsed.s / this.speed * D.TAU;

        this.sprite.pos = ion.point(
            w.x + r * Math.cos(timer)
          , w.y + r * Math.sin(timer)
        );
    }

    constructor(g : ion.Game, s : ion.Sprite, private world : sprite.World, private speed : number) {
        super(g, s);
    }
}

export let BaddyWorldGlide : (w: sprite.World, spd: number) => ion.IBehaviorFactory<sprite.Baddy>
    = (w, spd) => ((g: ion.Game, s: ion.Sprite) => new BaddyWorldGlideClass(g, s, w, spd));

class BaddySlideClass extends ion.b.BehaviorFac implements ion.IUpdatable {
    public period = 2.5; // time in secs to complete a cycle.
    public xSlide = 160;
    public ySlide = 340;
    public period1 = 1/2;
    public xSlide1 = 40;
    public ySlide1 = -40;

    update(d : ion.Duration) {
        let s = this.sprite;
        let game = this.game;
        let timer = game.elapsed.s / this.period * D.TAU;
        let timer1 = game.elapsed.s / this.period1 * D.TAU;
        s.pos = ion.point(
            s.startingPos.x + this.xSlide * Math.sin(timer) + this.xSlide1 * Math.sin(timer1)
          , s.startingPos.y + this.ySlide * Math.sin(timer) + this.ySlide1 * Math.sin(timer1)
        );
    }

    public sprite : sprite.Baddy;
}

export let BaddySlide : ion.IBehaviorFactory<sprite.Baddy>
    = (game, sprite) => {
        let val = new BaddySlideClass(game, sprite);
        return val;
    }

/*** Camera Behavior */

let vantageRamp = ion.util.makeScalingRamp(200, 60, 1, 0.65);
class CameraFollowsPlayerClass extends CameraBehaviorFac {
    private lastPlanetScale : number = 1.0;
    private lastScaleDirection : number = 1;
    private timeSinceDirChange : number = 0;

    update(delta : ion.Duration) {
        let c = this.camera;
        let ppos = player.pos;
        let ctr = this.game.center;
        //c.pos = ion.point(ppos.x, ppos.y + 80)
        c.pos = ppos;

        // Would be nice, but (a) should chase, not match exactly,
        // and need to make the rotation smoother between planets before
        // it could work.
        //c.rotation = c.player.rotation;
        //c.rotation = D.TAU / 2;

        // Scale is a function of two things: player's distance from the nearest world, and
        // player's distance from a specific world that offers a good vantage point
        // of the large world with baddies circling.

        // distance from vantage point (zoom out on approach)
        let vantageDist = ppos.distFrom(vantagePoint);
        let planetScale = vantageRamp(vantageDist);
        // the problem with basing zoom on distance from a point, is that the zoom
        // shifts rapidly when the player is jumping around near it.
        // To compensate for this, we'll slow the speed planetScale
        // can change in the positive direction.
        // - We'll also instigate a delay before we actually start zooming in again.
        let time = 5.0 // seconds to go from most zoom to normal zoom
        let speed = (1 - 0.65) / time;
        if (planetScale > this.lastPlanetScale + speed * delta.s)
            planetScale = this.lastPlanetScale + speed * delta.s;
        this.lastPlanetScale = planetScale;

        // distance from nearest world
        let distRamp = player.pDist / 1000;
        if (distRamp > 1) distRamp = 1;

        let targetScale = planetScale - 4/5 * distRamp;
        c.scale = targetScale;
    }
}

export let CameraFollowsPlayer : ICameraBehaviorFactory
    = (g: ion.Game, c: Camera) => new CameraFollowsPlayerClass(g, c);