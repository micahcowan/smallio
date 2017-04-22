import * as ion from "ionsible";
import * as sprite from "./sprite";

let game = new ion.Game({"parent": '#gameContainer'});

game.setScene([
    /* new sprite.Background(game) */
    new sprite.World(game, ion.point(0, 0), 20)
]);

game.drawBB = true;

game.start();
