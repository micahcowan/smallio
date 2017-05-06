import * as ion from "./ionsible/ionsible";

export let blockSize : number = 40;

// TAU represents a full turn/circle, in radians. Or twice PI (which only goes half a circle)
export let TAU : number = 2 * Math.PI;

// Here we calculate gravity and jump speed.
// But it's inconvenient to try-and-err numbers for those:
// instead, I want to specify jump height, and the total amount of time
// spent in a jump to that height.
let jump_height = 100;
let jump_time = 0.6;    // secs

/*
   vt = v0 - (g * t)
   yt = (t * v0) - (g * t^2)/2
  
   jump_height (ymax) will be when the time is half-way done, and vt is zero.
  
   Solve gravity in terms of jump speed:
  
   VEL0 = G * jtm/2
   G = VEL0/(jtm/2)
    
   ymax = (jtm/2 * VEL0) - (GRV * (jtm/2)^2)/2
        (subst for GRV)
   ymax = (jtm/2 * VEL0) - (VEL0/(jtm/2) * (jtm/2)^2)/2
   ymax = (jtm/2 * VEL0) - (VEL0 * jtm / 2)/2
   ymax = (jtm/2 * VEL0)(1/2)
   ymax = VEL0 * (jtm/4)    
   VEL0 = 4 * ymax/jtm

   G = (4 * ymax/jtm)/(jtm/2)
   G = 4 * ymax/jtm * 2/jtm
   G = 8 * ymax/(jtm^2)
*/
export let gravity : number = ion.util.getJumpGravity(jump_height, jump_time).y;
export function getSmallioJumpSpeed(height : number) {
    return -ion.util.getJumpSpeed(height, jump_time).y;
}
export let jumpSpeed : number = getSmallioJumpSpeed(jump_height);


// Now to calculate lateral friction and movement force, given
// desired ramp up, max speed, and ramp down.
export let maxLateralVel = 300;
let lateralRampUp = 0.66; // s
let lateralRampDown = 0.33; // s
export let lateralFriction = maxLateralVel / lateralRampDown;
export let lateralAccel = maxLateralVel / lateralRampUp + lateralFriction;
console.log ("lateralFriction = " + lateralFriction + "; lateralAccel = " + lateralAccel)