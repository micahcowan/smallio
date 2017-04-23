import * as ion from "ionsible";

import * as sprite from "./sprite";
import { SmallioCamera } from "./camera";
import * as D from "./defs";

let game = new ion.Game({"parent": '#gameContainer'});

declare let createjs : any;
createjs.Sound.registerSound('sfx/coin.mp3', 'coin');
createjs.Sound.registerSound('sfx/jump.mp3', 'jump');
createjs.Sound.registerSound('sfx/land.mp3', 'land');
export let playSound = function (name : string) {
    return createjs.Sound.play(name);
}

createjs.Sound.addEventListener("fileload", playMusic);
createjs.Sound.registerSound("music/diddly.mp3", "music");
export let music : any;

function playMusic(event : any) : void {
    if (event.id == "music" && music === undefined) {
        music = createjs.Sound.play("music", {loop: -1});
        (window as any).gameMusic = music;
        music.volume = 0.25;
    }
}

let worlds : ion.ISpriteContainer = {
    subsprites: [] // TS glitch? Can't declare worlds here directly, so push them later.
}
let w = worlds.subsprites;
let world = new sprite.World(game, ion.point(0, 0), 20);
world.addJumper(15/16 * D.TAU, 300);
world.addJumper(1/2 * D.TAU, 200);
w.push(world);
//world = new sprite.World(game, ion.point(680, 520), 58).setColor("BurlyWood");
world = new sprite.World(game, ion.point(549, 389), 29).setColor("BurlyWood");
let newp = ion.point(680, 520).diff(new ion.Point({dir: 1/8 * D.TAU, mag: world.r/2}))
console.log(newp.x + ", " + newp.y)
world.addJumper(1/2 * D.TAU, 270);
world.addJumper(39/64 * D.TAU, 140);
world.addJumper(13/16 * D.TAU, 350);
w.push(world);
world = new sprite.World(game, ion.point(-200, 200), 7).setColor("#612");
w.push(world);
world = new sprite.World(game, ion.point(-100, 450), 7).setColor("#261");
world.addJumper(1/8 * D.TAU, 200)
w.push(world);

export let player = new sprite.Player(game, ion.point(0, 240), worlds);

export let score = new sprite.Score(game);

game.setScene([
    new sprite.Background(game)
  , worlds
  , player
  , score
]);

let camera = new SmallioCamera(game, game.canvas);
camera.player = player;
game.camera = camera;
//game.camera.drawBB = true;

game.start();