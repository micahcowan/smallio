import * as ion from "ionsible";

import * as sprite from "./sprite";
import { SmallioCamera } from "./camera";

let game = new ion.Game({"parent": '#gameContainer'});

let worlds : ion.ISpriteContainer = {
    subsprites: [] // TS glitch? Can't declare worlds here directly, so push them later.
}
let w = worlds.subsprites;
w.push(new sprite.World(game, ion.point(0, 0), 20));
let world2 : sprite.World = new sprite.World(game, ion.point(680, 520), 58).setColor("BurlyWood");
w.push(world2)

let player = new sprite.Player(game, ion.point(-100, 220), worlds);
(window as any).mjcworld = world2;
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