import * as ion from "ionsible";
import * as sprite from "./sprite";

let game = new ion.Game({"parent": '#gameContainer'});

game.setScene([
    new sprite.Background(game)
  , new sprite.World(game, ion.point(0, 0), 20)
  , new sprite.Player(game, ion.point(0, 200))
]);

game.camera.drawBB = true;

game.start();
