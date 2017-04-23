import * as ion from "ionsible";

import * as sprite from "./sprite";
import * as sm from "./behavior";

export interface ICameraBehaviorFactory {
    (game : ion.Game, camera : Camera) : ion.IUpdatable;
}

export class CameraBehaviorFac implements ion.IDestroyable {
    constructor(protected game : ion.Game, protected camera: Camera) {}

    destroy() : void {
        //this.game = null;
        //this.sprite = null;
        delete this.game;
        delete this.camera;
    }
}

// This class is a kludge.
// Ionsible needs the whole "Updatable" thing to be more generalized (and Camera to implement it),
// but in the meantime we can't use existing machinery for that. So we
// duplicate effort here.
export class Camera extends ion.Camera implements ion.ICamera {
    public lastPos : ion.Point = ion.point(0, 0);

    /** Default implementation calls `.update` on the behaviors. */
    update(delta : ion.Duration) : void {
        // Ugh. Wanted this to be in the constructor, but TypeScript (as
        // of 1.8.10) calls constructors before evaluating member
        // declarations, so there's no way to provide behaviors
        // before construction.
        this.lastPos = this.pos.clone();
        if (this.behaviors !== undefined) {
            this.behaviorsInst = this.behaviors.map(
                (x : ICameraBehaviorFactory) : ion.IUpdatable => x(this.game, this)
            );
            this.behaviors = undefined;
        }
        this.behaviorsInst.forEach(
            (x : ion.IUpdatable) => x.update(delta)
        );
    }

    destroy() : void {
        let bs = this.behaviorsInst;
        while (bs.length > 0) {
            let b = bs.pop() as any | ion.IDestroyable;
            if (ion.isDestroyable(b))
                b.destroy();
        }
    }

    /**
     * A list of behaviors that the sprite will have.
     * This is usually the most important member to override in
     * descendant classes of `Sprite`.
     */
    protected behaviors : ICameraBehaviorFactory[] | undefined = [];

    /**
     * The list of instantiated behaviors. The value is derived from `behaviors`
     * upon `Sprite` construction.
     */
    protected behaviorsInst : ion.IUpdatable[];
}

export class SmallioCamera extends Camera implements ion.ICamera {
    protected behaviors = [
        sm.CameraFollowsPlayer
    ];
}