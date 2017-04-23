import * as ion from "ionsible";

import * as sprite from "./sprite";
import { SmallioCamera } from "./camera";
import * as D from "./defs";
import * as sm from "./behavior";

let game = new ion.Game({"parent": '#gameContainer'});

declare let createjs : any;
createjs.Sound.registerSound('sfx/coin.mp3', 'coin');
createjs.Sound.registerSound('sfx/jump.mp3', 'jump');
createjs.Sound.registerSound('sfx/land.mp3', 'land');
createjs.Sound.registerSound('sfx/reappear.mp3', 'reappear');
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
export let gameWon : boolean = false;
export let player : sprite.Player;
export let score : sprite.Score;
export function setGameWon() {
    gameWon = true;
    setTimeout(gameReset, 6000)
}
export function gameReset() : void {
    console.log("game reset")

    if (player) player.destroy();
    if (score) score.destroy();

    gameWon = false;
    score = new sprite.Score(game);
    let worlds: ion.ISpriteContainer = {
        subsprites: [] // TS glitch? Can't declare worlds here directly, so push them later.
    }
    let w = worlds.subsprites;
    let world = new sprite.World(game, ion.point(0, 0), 20);
    world.addJumper(15 / 16 * D.TAU, 300);
    world.addJumper(1 / 2 * D.TAU, 200);
    w.push(world);
    //world = new sprite.World(game, ion.point(680, 520), 58).setColor("BurlyWood");
    let bigWorld = world = new sprite.World(game, ion.point(549, 389), 29).setColor("BurlyWood");
    let newp = ion.point(680, 520).diff(new ion.Point({ dir: 1 / 8 * D.TAU, mag: world.r / 2 }))
    console.log(newp.x + ", " + newp.y)
    world.addJumper(1 / 2 * D.TAU, 270);
    world.addJumper(39 / 64 * D.TAU, 140);
    world.addJumper(13 / 16 * D.TAU, 250);
    w.push(world);
    world = new sprite.World(game, ion.point(-200, 200), 7).setColor("#612");
    w.push(world);
    world = new sprite.World(game, ion.point(-100, 450), 7).setColor("#261");
    world.addJumper(1 / 8 * D.TAU, 200)
    w.push(world);

    player = new sprite.Player(game, ion.point(0, 240), worlds);

    game.setScene([
        new sprite.Background(game)
        , worlds
        , player
        , score
        , new sprite.Baddy(game, new ion.Point(160, 220), sm.BaddySlide)
        , new sprite.Baddy(game, bigWorld.pos, sm.BaddyWorldGlide(bigWorld, 4))
        , new sprite.Baddy(game, bigWorld.pos, sm.BaddyWorldGlide(bigWorld, -3))
        , new sprite.GameWon(game)
    ]);

    console.log("game reset finished")
}

let camera = new SmallioCamera(game, game.canvas);
game.camera = camera;
//game.camera.drawBB = true;

gameReset();

game.start();