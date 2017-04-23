import * as ion from "ionsible";

import * as sprite from "./sprite";
import { SmallioCamera } from "./camera";
import * as D from "./defs";

let game = new ion.Game({"parent": '#gameContainer'});

let worlds : ion.ISpriteContainer = {
    subsprites: [] // TS glitch? Can't declare worlds here directly, so push them later.
}
let w = worlds.subsprites;
let world = new sprite.World(game, ion.point(0, 0), 20);
world.addJumper(2/12 * D.TAU, 150);
world.addJumper(1/2 * D.TAU, 200);
w.push(world);
world = new sprite.World(game, ion.point(680, 520), 58).setColor("BurlyWood");
world.addJumper(11/16 * D.TAU, 220);
world.addJumper(7/16 * D.TAU, 300);
w.push(world)

let player = new sprite.Player(game, ion.point(0, 240), worlds);

game.setScene([
    new sprite.Background(game)
  , worlds
  , player
]);

let camera = new SmallioCamera(game, game.canvas);
camera.player = player;
game.camera = camera;
//game.camera.drawBB = true;

game.start();