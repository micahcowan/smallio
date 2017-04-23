import * as ion from "ionsible";

import * as sprite from "./sprite";
import { SmallioCamera } from "./camera";

let game = new ion.Game({"parent": '#gameContainer'});

let player = new sprite.Player(game, ion.point(0, 200))
game.setScene([
    new sprite.Background(game)
  , new sprite.World(game, ion.point(0, 0), 20)
  , player
]);

let camera = new SmallioCamera(game, game.canvas);
camera.player = player;
game.camera = camera;
game.camera.drawBB = true;

game.start();